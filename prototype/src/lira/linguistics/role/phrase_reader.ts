import { PartOfSpeech } from "../../vocabulary/data/part_of_speech";
import type { Word } from "../../vocabulary/data/word";
import type { Clause } from "../data/clause";
import type { Interpretation } from "../data/interpretation";
import { LinguisticUnitKind } from "../data/linguistic_unit_kind";
import { createPhrase, type Phrase } from "../data/phrase";
import { PhraseType } from "../data/phrase_type";
import { createReadingError, ReadingErrorKind, type ReadingError } from "../data/reading_error";
import { ObligationKind, type SequencingObligation } from "../data/sequencing_obligation";
import { candidatePartsOfSpeech, identificationFor, isKnown, type TokenReading } from "../data/token_reading";
import { ValidationOutcome } from "../data/validation_outcome";
import type { GrammarConfigurator, PhraseGrammar } from "./grammar_configurator";
import type { GraphProcessor } from "./graph_processor";
import { createSequenceStep, type SequenceEngine, type SequencePath, type SequenceStep } from "./sequence_engine";

/** PhraseReader: spec 12.3's actual readPhrase() implementation -- the
 * only place phrase-level part-of-speech ambiguity gets resolved.
 * Tries every PhraseType at the given start position (a NOUN_PHRASE and
 * a VERB_PHRASE can both plausibly start at the same token -- e.g.
 * "state" is seeded as both NOUN and VERB), ranks every completed
 * SequencePath with the shared ReadingScorer, and materialises only the
 * winner into tensor-backed Words (GraphProcessor.materialiseToken) --
 * every other candidate stays a lightweight Interpretation record (spec
 * 15, 24), never a second tree of tensor rows for a reading nothing
 * kept.
 *
 * Ported from linguistics/role/phrase_reader.py. */

// Maps an unresolved obligation to the specific ReadingErrorKind spec 21
// names for it; AUXILIARY_REQUIRES_COMPATIBLE_VERB_FORM has no single
// dedicated kind of its own (an auxiliary chain with no following verb
// just fails to produce a valid VERB_PHRASE sequence at all), so it
// falls back to the generic NO_VALID_PHRASE_SEQUENCE.
const OBLIGATION_ERROR_KIND: Partial<Record<ObligationKind, ReadingErrorKind>> = {
  [ObligationKind.DETERMINER_REQUIRES_NOMINAL_HEAD]: ReadingErrorKind.INCOMPLETE_DETERMINER_SEQUENCE,
  [ObligationKind.PREPOSITION_REQUIRES_OBJECT]: ReadingErrorKind.PREPOSITION_MISSING_OBJECT,
  [ObligationKind.AUXILIARY_REQUIRES_COMPATIBLE_VERB_FORM]: ReadingErrorKind.NO_VALID_PHRASE_SEQUENCE,
  [ObligationKind.INFINITIVE_MARKER_REQUIRES_BASE_VERB]: ReadingErrorKind.INFINITIVE_MISSING_VERB,
  [ObligationKind.CONJUNCTION_REQUIRES_COORDINATED_ELEMENT]: ReadingErrorKind.INCOMPLETE_COORDINATION,
};

export interface PhraseReadOptions {
  startIndex?: number;
  endIndex?: number;
  parentClause?: Clause;
  grammar?: GrammarConfigurator;
  trace?: unknown[];
}

export class PhraseReader {
  constructor(
    public readonly engine: SequenceEngine,
    public readonly graphProcessor: GraphProcessor,
    private readonly grammar: GrammarConfigurator,
  ) {}

  /** `trace`, when an array is passed, gets one JSON-safe record
   * pushed per call describing *every* PhraseType attempted at this
   * start position -- not just the winner. Purely observational:
   * passing `trace` unset is byte-for-byte the original behaviour,
   * since nothing about the search or ranking changes, only what gets
   * recorded about it. */
  read(tokens: readonly TokenReading[], options: PhraseReadOptions = {}): Phrase {
    const activeGrammar = options.grammar ?? this.grammar;
    const startIndex = options.startIndex ?? 0;
    const endIndex = options.endIndex ?? tokens.length;
    const { parentClause, trace } = options;

    if (startIndex >= endIndex) {
      const phrase = this.unreadablePhrase(tokens, startIndex, parentClause);
      trace?.push(this.positionTrace(tokens, startIndex, activeGrammar, new Map(), undefined, phrase));
      return phrase;
    }

    const perTypeCandidates = new Map<PhraseType, SequencePath[]>();
    const candidates: SequencePath[] = [];
    for (const phraseType of Object.values(PhraseType).filter((v): v is PhraseType => typeof v === "number")) {
      const phraseGrammar = activeGrammar.phraseGrammars.get(phraseType);
      if (!phraseGrammar) continue;
      const found = phraseGrammar.nestedPhraseAfter.size > 0
        ? this.findPrepositionalPaths(tokens, startIndex, endIndex, phraseGrammar)
        : this.engine.findValidSequences(tokens, startIndex, phraseType, endIndex);
      perTypeCandidates.set(phraseType, [...found]);
      candidates.push(...found);
    }

    if (candidates.length === 0) {
      const phrase = this.unreadablePhrase(tokens, startIndex, parentClause);
      trace?.push(this.positionTrace(tokens, startIndex, activeGrammar, perTypeCandidates, undefined, phrase));
      return phrase;
    }

    const ranked = this.engine.rankSequences(candidates, tokens);
    const winningPath = ranked[0];
    const winnerKey = this.engine.scorer.rankKey(this.engine.scoringFactors(winningPath, tokens));
    const tieCount = ranked.filter((path) => keysEqual(this.engine.scorer.rankKey(this.engine.scoringFactors(path, tokens)), winnerKey)).length;
    const alternatives = ranked.slice(1, 1 + activeGrammar.maxAlternativeInterpretations).map((path) => this.toInterpretation(path, tokens));
    const phrase = this.buildPhrase(winningPath, tokens, activeGrammar, parentClause, alternatives, tieCount);
    trace?.push(this.positionTrace(tokens, startIndex, activeGrammar, perTypeCandidates, winningPath, phrase));
    return phrase;
  }

  // --- PREPOSITIONAL_PHRASE composition (nestedPhraseAfter) --------
  // findValidSequences can't walk this one alone -- see its own
  // docstring -- so PhraseReader composes it directly: confirm the
  // PREPOSITION start, then recurse into the nested NOUN_PHRASE.

  private findPrepositionalPaths(
    tokens: readonly TokenReading[], startIndex: number, endIndex: number, phraseGrammar: PhraseGrammar,
  ): SequencePath[] {
    const token = tokens[startIndex];
    if (!isKnown(token)) return [];
    const scope = this.engine.scopeForPhraseType(phraseGrammar.phraseType);
    const results: SequencePath[] = [];
    for (const pos of candidatePartsOfSpeech(token)) {
      if (!phraseGrammar.startStates.has(pos)) continue;
      const nestedType = this.engine.nestedPhraseFor(phraseGrammar, pos);
      if (nestedType === undefined) continue;
      const triggerStep = createSequenceStep(startIndex, pos);
      const nestedCandidates = this.engine.findValidSequences(tokens, startIndex + 1, nestedType, endIndex);

      if (nestedCandidates.length === 0) {
        // No object at all follows -- the obligation this PREPOSITION
        // raised is never discharged, a definite negative conclusion.
        let openObligations: readonly SequencingObligation[] = [];
        const raisedKind = phraseGrammar.obligationsRaised.get(pos);
        if (raisedKind !== undefined) {
          openObligations = [{
            kind: raisedKind, scope, raisedAtIndex: startIndex,
            description: `POS ${pos} at token ${startIndex} requires an object`,
          }];
        }
        results.push({
          phraseType: phraseGrammar.phraseType, startIndex, endIndex: startIndex + 1,
          steps: [triggerStep], openObligations, nestedPaths: [],
        });
        continue;
      }

      // An object exists structurally, so PREPOSITION_REQUIRES_OBJECT is
      // discharged regardless of the object's own validity -- the
      // object's own UNRESOLVED/INVALID state is what hasUnknownToken
      // and validateSequence's nestedPaths check already surface.
      for (const nestedPath of this.engine.rankSequences(nestedCandidates, tokens).slice(0, this.grammar.maxAlternativeInterpretations)) {
        results.push({
          phraseType: phraseGrammar.phraseType, startIndex, endIndex: nestedPath.endIndex,
          steps: [triggerStep], openObligations: [], nestedPaths: [nestedPath],
        });
      }
    }
    return results;
  }

  // --- Materialisation --------------------------------------------------

  private materialiseStep(token: TokenReading, step: SequenceStep): Word {
    let selected;
    if (!step.isUnknown) {
      if (step.isMarker) {
        // A lexical marker (e.g. infinitive "to") is matched by text,
        // not by the POS it was seeded under -- its own top-ranked
        // seeded sense is still the right one to materialise. The
        // phrase's own phraseType is what records its role here as an
        // infinitive marker, not a relabelled POS.
        selected = token.candidates.length > 0 ? token.candidates[0] : undefined;
      } else if (step.partOfSpeech !== undefined) {
        selected = identificationFor(token, step.partOfSpeech);
      }
    }
    return this.graphProcessor.materialiseToken(token, token.tokenIndex, selected);
  }

  private selectHead(path: SequencePath, phraseGrammar: PhraseGrammar): SequenceStep | undefined {
    for (const preferred of phraseGrammar.headPreference) {
      for (let i = path.steps.length - 1; i >= 0; i--) {
        const step = path.steps[i];
        if (!step.isUnknown && !step.isMarker && step.partOfSpeech === preferred) return step;
      }
    }
    // Nothing in headPreference matched (e.g. "the cat" with "cat"
    // unseeded) -- the wildcard stands in as head so the phrase still
    // has *something* to point to, correctly staying UNRESOLVED rather
    // than headless.
    for (let i = path.steps.length - 1; i >= 0; i--) {
      if (path.steps[i].isUnknown) return path.steps[i];
    }
    return undefined;
  }

  private buildPhrase(
    path: SequencePath, tokens: readonly TokenReading[], grammar: GrammarConfigurator,
    parentClause: Clause | undefined, alternatives: readonly Interpretation[], tieCount: number,
  ): Phrase {
    const phraseGrammar = grammar.phraseGrammars.get(path.phraseType) as PhraseGrammar;
    const words = path.steps.map((step) => this.materialiseStep(tokens[step.tokenIndex], step));
    const nestedPhrases = path.nestedPaths.map((nested) => this.buildPhrase(nested, tokens, grammar, parentClause, [], 1));
    const allWords = [...words, ...nestedPhrases.flatMap((nested) => nested.words)];

    const headStep = this.selectHead(path, phraseGrammar);
    let headWord: Word | undefined;
    let headPos;
    if (headStep !== undefined) {
      headWord = words[path.steps.indexOf(headStep)];
      headPos = headStep.partOfSpeech;
    }

    const selectedPos = path.steps.map((step) => step.partOfSpeech).filter((pos): pos is NonNullable<typeof pos> => pos !== undefined);
    const selectedIds = path.steps
      .filter((step) => step.partOfSpeech !== undefined)
      .map((step) => identificationFor(tokens[step.tokenIndex], step.partOfSpeech!))
      .filter((identification) => identification !== undefined);

    const validation = this.engine.validateSequence(path);
    const factors = this.engine.scoringFactors(path, tokens);
    const confidence = this.engine.scorer.confidence(factors, tieCount);
    const errors = this.buildErrors(path, tokens);

    const phrase = createPhrase({
      text: allWords.map((w) => w.text).join(" "),
      phraseType: path.phraseType,
      words: allWords,
      selectedPartsOfSpeech: selectedPos,
      selectedIdentifications: selectedIds,
      headWord, headPartOfSpeech: headPos,
      nestedPhrases,
      parentClause,
      startPosition: path.startIndex, endPosition: path.endIndex,
      openObligations: path.openObligations,
      validation, confidence, alternatives, errors,
    });
    // Only the winning SequencePath ever reaches buildPhrase (the
    // losing candidates stay lightweight Interpretation records via
    // toInterpretation) -- so this is the one place a Phrase-level
    // tensor row gets allocated (spec 19's containment: every unit
    // gets a systemProperty).
    phrase.systemProperty = this.graphProcessor.createPropertyWrapper(
      phrase, LinguisticUnitKind.Phrase, path.startIndex, "PhraseReader_ReadLayer",
    );
    return phrase;
  }

  private buildErrors(path: SequencePath, tokens: readonly TokenReading[]): readonly ReadingError[] {
    const errors: ReadingError[] = [];
    for (const step of path.steps) {
      if (step.isUnknown) {
        const token = tokens[step.tokenIndex];
        errors.push(createReadingError({
          kind: ReadingErrorKind.UNKNOWN_VOCABULARY_WORD, level: LinguisticUnitKind.Phrase,
          message: `"${token.text}" has no seeded or hydrated part of speech yet`,
          tokenIndex: step.tokenIndex, tokenText: token.text,
        }));
      }
    }
    for (const obligation of path.openObligations) {
      errors.push(createReadingError({
        kind: OBLIGATION_ERROR_KIND[obligation.kind] ?? ReadingErrorKind.NO_VALID_PHRASE_SEQUENCE,
        level: LinguisticUnitKind.Phrase, message: obligation.description,
        tokenIndex: obligation.raisedAtIndex, openScope: obligation.scope,
        unfinishedObligation: obligation.kind,
      }));
    }
    // Errors from a nested phrase (e.g. the NOUN_PHRASE nested under a
    // PREPOSITIONAL_PHRASE) live on that nested Phrase object itself
    // (built separately in buildPhrase's own recursive call) -- not
    // duplicated here.
    return errors;
  }

  private toInterpretation(path: SequencePath, tokens: readonly TokenReading[]): Interpretation {
    const factors = this.engine.scoringFactors(path, tokens);
    return {
      selectedPartsOfSpeech: path.steps.map((step) => step.partOfSpeech).filter((pos): pos is NonNullable<typeof pos> => pos !== undefined),
      selectedEntryIds: path.steps.map(() => undefined),
      phraseSpans: [[path.phraseType, path.startIndex, path.endIndex]],
      clauseSpans: [],
      openObligations: path.openObligations,
      validation: this.engine.validateSequence(path),
      confidence: this.engine.scorer.confidence(factors),
      rankKey: this.engine.scorer.rankKey(factors),
      errors: [],
    };
  }

  // --- Trace (sentence reader UI's "full trace" panel; kept as real
  // Service output even though the UI itself isn't ported here) ------

  private pathText(path: SequencePath, tokens: readonly TokenReading[]): string {
    const words = path.steps.map((step) => tokens[step.tokenIndex].text);
    for (const nested of path.nestedPaths) words.push(this.pathText(nested, tokens));
    return words.join(" ");
  }

  private positionTrace(
    tokens: readonly TokenReading[], startIndex: number, grammar: GrammarConfigurator,
    perTypeCandidates: Map<PhraseType, SequencePath[]>, winningPath: SequencePath | undefined, winningPhrase: Phrase,
  ): unknown {
    const token = startIndex < tokens.length ? tokens[startIndex] : undefined;
    const attempts = [];

    for (const [phraseType, phraseGrammar] of grammar.phraseGrammars) {
      const paths = perTypeCandidates.get(phraseType) ?? [];

      let requiredStart: string[];
      let startMatch: boolean;
      if (phraseGrammar.markerForms.size > 0) {
        requiredStart = [...phraseGrammar.markerForms].sort();
        startMatch = token !== undefined && phraseGrammar.markerForms.has(token.text.toLowerCase());
      } else {
        requiredStart = [...phraseGrammar.startStates].map((pos) => PartOfSpeech[pos]).sort();
        startMatch = token !== undefined && isKnown(token) && candidatePartsOfSpeech(token).some((pos) => phraseGrammar.startStates.has(pos));
      }

      const completions = paths.map((path) => ({
        text: this.pathText(path, tokens),
        endIndex: path.endIndex,
        validation: ValidationOutcome[this.engine.validateSequence(path)],
        confidence: Math.round(this.engine.scorer.confidence(this.engine.scoringFactors(path, tokens)) * 10000) / 10000,
        isWinner: path === winningPath,
      }));

      let rejectionReason: string | null = null;
      if (paths.length > 0) {
        rejectionReason = null;
      } else if (token === undefined) {
        rejectionReason = "no token at this position";
      } else if (phraseGrammar.markerForms.size > 0) {
        rejectionReason = `token text does not match the required marker form(s) ${JSON.stringify(requiredStart)}`;
      } else if (!isKnown(token)) {
        rejectionReason = `"${token.text}" is unseeded -- no candidate part of speech to match a required start state`;
      } else if (!startMatch) {
        const seeded = candidatePartsOfSpeech(token).map((pos) => PartOfSpeech[pos]);
        rejectionReason = `token's seeded part(s) of speech ${JSON.stringify(seeded)} don't include a required start ${JSON.stringify(requiredStart)}`;
      } else {
        rejectionReason = "start matched, but no valid completion could be found from here";
      }

      attempts.push({
        phraseType: PhraseType[phraseType],
        requiredStart, startMatch, completions, rejectionReason,
      });
    }

    return {
      startIndex,
      tokenText: token?.text ?? null,
      candidatePartsOfSpeech: token !== undefined ? candidatePartsOfSpeech(token).map((pos) => PartOfSpeech[pos]) : [],
      isKnown: token !== undefined ? isKnown(token) : null,
      attempts,
      winnerPhraseType: winningPhrase.phraseType !== undefined ? PhraseType[winningPhrase.phraseType] : null,
      winnerText: winningPhrase.text,
      winnerValidation: ValidationOutcome[winningPhrase.validation],
      winnerEndIndex: winningPhrase.endPosition,
    };
  }

  private unreadablePhrase(tokens: readonly TokenReading[], startIndex: number, parentClause: Clause | undefined): Phrase {
    const token = startIndex < tokens.length ? tokens[startIndex] : undefined;
    const error = createReadingError({
      kind: ReadingErrorKind.NO_VALID_PHRASE_SEQUENCE, level: LinguisticUnitKind.Phrase,
      message: "No phrase grammar accepts a token here",
      tokenIndex: token !== undefined ? startIndex : undefined,
      tokenText: token?.text,
      seededCandidatePartsOfSpeech: token !== undefined ? candidatePartsOfSpeech(token) : [],
    });
    const phrase = createPhrase({
      text: token?.text ?? "",
      phraseType: undefined, words: [], parentClause,
      startPosition: startIndex, endPosition: startIndex + (token !== undefined ? 1 : 0),
      validation: ValidationOutcome.INVALID, confidence: 0.0, errors: [error],
    });
    phrase.systemProperty = this.graphProcessor.createPropertyWrapper(
      phrase, LinguisticUnitKind.Phrase, startIndex, "PhraseReader_ReadLayer",
    );
    return phrase;
  }
}

function keysEqual(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
