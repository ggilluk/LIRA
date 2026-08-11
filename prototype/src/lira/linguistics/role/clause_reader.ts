import { createClause, type Clause } from "../data/clause";
import { ClauseType } from "../data/clause_type";
import { LinguisticUnitKind } from "../data/linguistic_unit_kind";
import type { Phrase } from "../data/phrase";
import { createReadingError, ReadingErrorKind, type ReadingError } from "../data/reading_error";
import { isPunctuation, type TokenReading } from "../data/token_reading";
import { ValidationOutcome } from "../data/validation_outcome";
import type { ClauseTemplate, GrammarConfigurator } from "./grammar_configurator";
import type { PhraseReader } from "./phrase_reader";
import { createScoringFactors } from "./reading_scorer";
import type { SequenceEngine } from "./sequence_engine";

/** ClauseReader: spec 13.3's actual readClause() implementation. Reads
 * a token span as a sequence of Phrases (via PhraseReader), then
 * assigns each phrase a clause role (subject/predicate/object/
 * complement/modifier) against GrammarConfigurator.clauseElementTemplates.
 * Only ClauseType.INDEPENDENT has a populated template in this phase --
 * see clause_type.ts -- so this always attempts exactly one flat,
 * non-recursive independent-clause reading over its whole span;
 * relative/dependent/coordinated clauses (clause-level recursion) are
 * Phase 2.
 *
 * Clause validity is not simply the worst of its phrases' validity:
 * spec 20's own worked example ("The fox over the dog.") has two
 * individually VALID phrases (a NOUN_PHRASE, a PREPOSITIONAL_PHRASE)
 * but an INVALID clause, because no VERB_PHRASE predicate exists at
 * all. So this combines its own template-level check (subject/
 * predicate/finite-verb presence) with the worst outcome among its
 * phrases -- see validate.
 *
 * Ported from linguistics/role/clause_reader.py. */

// Copular/linking-verb forms -- when the predicate's own head word is
// one of these, a following NOUN_PHRASE/ADJECTIVE_PHRASE is a
// complement ("A meaning IS a representation."), not an object;
// anything else with a following NOUN_PHRASE reads that phrase as an
// object instead. A closed, hand-picked set rather than a
// morphological test, since real transitivity/linking-verb
// classification isn't seeded data this phase has access to.
const LINKING_VERB_FORMS = new Set(["is", "are", "was", "were", "be", "been", "being", "am"]);

export interface ClauseReadOptions {
  startIndex?: number;
  endIndex?: number;
  grammar?: GrammarConfigurator;
  trace?: unknown[];
}

export class ClauseReader {
  constructor(
    public readonly phraseReader: PhraseReader,
    private readonly engine: SequenceEngine,
    private readonly grammar: GrammarConfigurator,
  ) {}

  /** `trace`, when an array is passed, is threaded straight through to
   * every PhraseReader.read() call this clause makes. Purely additive/
   * observational. */
  read(tokens: readonly TokenReading[], options: ClauseReadOptions = {}): Clause {
    const activeGrammar = options.grammar ?? this.grammar;
    const startIndex = options.startIndex ?? 0;
    const endIndex = options.endIndex ?? tokens.length;
    const template = activeGrammar.clauseElementTemplates.get(ClauseType.INDEPENDENT);

    if (template === undefined || startIndex >= endIndex) {
      return this.emptyClause(tokens, startIndex, endIndex);
    }

    const phrases: Phrase[] = [];
    let index = startIndex;
    while (index < endIndex) {
      const token = tokens[index];
      if (isPunctuation(token)) {
        index += 1;
        continue;
      }
      const phrase = this.phraseReader.read(tokens, { startIndex: index, endIndex, grammar: activeGrammar, trace: options.trace });
      phrases.push(phrase);
      index = phrase.endPosition > index ? phrase.endPosition : index + 1;
    }

    const { subject, predicate, obj, complement, modifiers } = this.assignRoles(phrases, template);
    const finiteVerb = predicate?.headWord;

    const { validation, errors: ownErrors } = this.validate(phrases, subject, predicate, template);
    const phraseErrors = phrases.flatMap((phrase) => this.allPhraseErrors(phrase));
    const errors: readonly ReadingError[] = [...ownErrors, ...phraseErrors];

    const factors = createScoringFactors({
      validation,
      unresolvedTokenCount: phrases.filter((phrase) => phrase.validation === ValidationOutcome.UNRESOLVED).length,
      undischargedObligationCount: phrases.reduce((sum, phrase) => sum + phrase.openObligations.length, 0),
      finiteVerbPhraseCount: predicate !== undefined ? 1 : 0,
      phraseCount: phrases.length,
      lexicalEvidenceSum: phrases.reduce((sum, phrase) => sum + phrase.confidence, 0),
    });
    const confidence = this.engine.scorer.confidence(factors);

    const allWords = phrases.flatMap((phrase) => phrase.words);
    const clause = createClause({
      text: allWords.map((word) => word.text).join(" "),
      tokens: allWords,
      isIndependent: true,
      clauseType: ClauseType.INDEPENDENT,
      phrases,
      subject, predicate, object: obj, complement, modifiers,
      finiteVerb,
      startPosition: startIndex, endPosition: index,
      validation, confidence, errors,
    });
    // Phase 1 reads at most one clause per sentence (clause_type.ts),
    // so 0 is always this clause's own sequence number within its
    // sentence.
    clause.systemProperty = this.phraseReader.graphProcessor.createPropertyWrapper(
      clause, LinguisticUnitKind.Clause, 0, "ClauseReader_ReadLayer",
    );
    return clause;
  }

  private assignRoles(
    phrases: readonly Phrase[], template: ClauseTemplate,
  ): { subject?: Phrase; predicate?: Phrase; obj?: Phrase; complement?: Phrase; modifiers: Phrase[] } {
    let subject: Phrase | undefined;
    let predicate: Phrase | undefined;
    let obj: Phrase | undefined;
    let complement: Phrase | undefined;
    const modifiers: Phrase[] = [];

    for (const phrase of phrases) {
      if (phrase.phraseType === undefined) continue;
      if (predicate === undefined) {
        if (subject === undefined && template.subjectPhraseTypes.has(phrase.phraseType)) {
          subject = phrase;
          continue;
        }
        if (template.predicatePhraseTypes.has(phrase.phraseType)) {
          predicate = phrase;
          continue;
        }
        modifiers.push(phrase);
        continue;
      }

      // Past the predicate: first NOUN_PHRASE/ADJECTIVE_PHRASE becomes
      // the object or complement (never both), everything else is a
      // modifier.
      if (obj === undefined && complement === undefined && template.complementPhraseTypes.has(phrase.phraseType)) {
        const isLinking = predicate.headWord !== undefined && LINKING_VERB_FORMS.has(predicate.headWord.text.toLowerCase());
        if (!isLinking && template.objectPhraseTypes.has(phrase.phraseType)) {
          obj = phrase;
        } else {
          complement = phrase;
        }
        continue;
      }
      modifiers.push(phrase);
    }

    return { subject, predicate, obj, complement, modifiers };
  }

  private validate(
    phrases: readonly Phrase[], subject: Phrase | undefined, predicate: Phrase | undefined, template: ClauseTemplate,
  ): { validation: ValidationOutcome; errors: ReadingError[] } {
    const errors: ReadingError[] = [];
    let ownOutcome = ValidationOutcome.VALID;

    if (template.subjectRequired && subject === undefined) {
      ownOutcome = ValidationOutcome.INVALID;
      errors.push(createReadingError({
        kind: ReadingErrorKind.NO_VALID_CLAUSE_SEQUENCE, level: LinguisticUnitKind.Clause,
        message: "No subject-shaped phrase found before the predicate",
      }));
    }
    if (template.predicateRequired && predicate === undefined) {
      ownOutcome = ValidationOutcome.INVALID;
      errors.push(createReadingError({
        kind: ReadingErrorKind.MISSING_PREDICATE, level: LinguisticUnitKind.Clause,
        message: "No VERB_PHRASE found for this clause's predicate",
      }));
    } else if (predicate !== undefined && (predicate.headPartOfSpeech === undefined || !template.predicateHeadRequires.has(predicate.headPartOfSpeech))) {
      ownOutcome = ValidationOutcome.INVALID;
      errors.push(createReadingError({
        kind: ReadingErrorKind.MISSING_FINITE_VERB, level: LinguisticUnitKind.Clause,
        message: "The clause's predicate has no finite verb form",
      }));
    }

    const phraseOutcomes = phrases.filter((phrase) => phrase.phraseType !== undefined).map((phrase) => phrase.validation);
    const worst = phraseOutcomes.length > 0
      ? [ownOutcome, ...phraseOutcomes].reduce((worstSoFar, outcome) => (outcome < worstSoFar ? outcome : worstSoFar))
      : ownOutcome;
    return { validation: worst, errors };
  }

  /** A phrase's own `.errors` deliberately excludes its nested
   * phrases' errors, so Clause/Sentence-level error reporting (spec
   * 21) still needs every error reachable from one place -- this walks
   * nestedPhrases to collect them. */
  private allPhraseErrors(phrase: Phrase): ReadingError[] {
    const errors = [...phrase.errors];
    for (const nested of phrase.nestedPhrases) errors.push(...this.allPhraseErrors(nested));
    return errors;
  }

  private emptyClause(tokens: readonly TokenReading[], startIndex: number, endIndex: number): Clause {
    const error = createReadingError({
      kind: ReadingErrorKind.NO_VALID_CLAUSE_SEQUENCE, level: LinguisticUnitKind.Clause,
      message: "Empty token span or no clause template configured for ClauseType.INDEPENDENT",
      tokenIndex: startIndex < tokens.length ? startIndex : undefined,
    });
    const clause = createClause({
      text: "", tokens: [], isIndependent: undefined, clauseType: undefined,
      startPosition: startIndex, endPosition: endIndex,
      validation: ValidationOutcome.INVALID, confidence: 0.0, errors: [error],
    });
    clause.systemProperty = this.phraseReader.graphProcessor.createPropertyWrapper(
      clause, LinguisticUnitKind.Clause, 0, "ClauseReader_ReadLayer",
    );
    return clause;
  }
}
