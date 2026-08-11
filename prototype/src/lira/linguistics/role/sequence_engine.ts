import type { PartOfSpeech } from "../../vocabulary/data/part_of_speech";
import { LinguisticScope } from "../data/linguistic_scope";
import { PhraseType } from "../data/phrase_type";
import { ObligationKind, type SequencingObligation } from "../data/sequencing_obligation";
import { candidatePartsOfSpeech, isKnown, type TokenReading } from "../data/token_reading";
import { ValidationOutcome } from "../data/validation_outcome";
import type { GrammarConfigurator, PhraseGrammar } from "./grammar_configurator";
import type { LexicalEvidenceStore } from "./lexical_evidence_store";
import { createScoringFactors, ReadingScorer, type ScoringFactors } from "./reading_scorer";

/** SequenceEngine: the one shared sequencing engine behind
 * readPhrase()/readClause()/readSentence() (Linguistics Layer developer
 * specification, 8; spec 9, 10, 11). Holds no grammar of its own --
 * every allowed start/next/end state, every obligation raised/
 * discharged, comes from the injected GrammarConfigurator; SequenceEngine
 * only walks those tables. role/*_reader.ts modules are the only
 * intended callers -- this module has no per-level special-casing of
 * its own, which is what keeps "no duplicated rules" (spec 11) true
 * across all three readers.
 *
 * Ported from linguistics/role/sequence_engine.py. */

// PhraseType and LinguisticScope members share the same names by design
// (linguistic_scope.ts's own docstring) so this mapping is a straight
// name lookup, not a hand-maintained parallel table.
const PHRASE_SCOPE = new Map<PhraseType, LinguisticScope>(
  Object.keys(PhraseType)
    .filter((key) => Number.isNaN(Number(key)))
    .map((key) => [PhraseType[key as keyof typeof PhraseType], LinguisticScope[key as keyof typeof LinguisticScope]]),
);

// Sentinel for "the previous step was an absorbed unknown token" -- kept
// out of the public PartOfSpeech-typed surface (getAllowedNextStates
// only ever takes a real PartOfSpeech or undefined) since it's an
// internal search-bookkeeping detail, not a grammar concept.
const WILDCARD = Symbol("wildcard");

const BEAM_WIDTH = 8;

/** One token's contribution to a SequencePath. Exactly one of (a real
 * seeded PartOfSpeech), isUnknown, or isMarker is true -- isUnknown
 * stands in for an unseeded token absorbed per spec 7; isMarker stands
 * in for a lexically-anchored phrase marker (e.g. INFINITIVE_PHRASE's
 * "to") that has no POS state of its own in this grammar. */
export interface SequenceStep {
  tokenIndex: number;
  partOfSpeech?: PartOfSpeech;
  isUnknown: boolean;
  isMarker: boolean;
}

export function createSequenceStep(tokenIndex: number, partOfSpeech?: PartOfSpeech, isUnknown = false, isMarker = false): SequenceStep {
  return { tokenIndex, partOfSpeech, isUnknown, isMarker };
}

/** One candidate reading of a token span against one PhraseGrammar
 * (spec 10.1's "valid sequence"). Produced by
 * SequenceEngine.findValidSequences for the five phrase types whose
 * grammar is a flat POS transition table (or, for INFINITIVE_PHRASE, a
 * lexical marker); PREPOSITIONAL_PHRASE is assembled directly by
 * PhraseReader instead, since its continuation is a whole nested
 * NOUN_PHRASE rather than a token-by-token transition -- `nestedPaths`
 * is where that nested SequencePath is attached once PhraseReader
 * composes it. */
export interface SequencePath {
  phraseType: PhraseType;
  startIndex: number;
  endIndex: number; // exclusive
  steps: readonly SequenceStep[];
  openObligations: readonly SequencingObligation[];
  nestedPaths: readonly SequencePath[];
}

export function createSequencePath(init: Pick<SequencePath, "phraseType" | "startIndex" | "endIndex" | "steps" | "openObligations"> & Partial<SequencePath>): SequencePath {
  return { nestedPaths: [], ...init };
}

export function hasUnknownToken(path: SequencePath): boolean {
  return path.steps.some((step) => step.isUnknown) || path.nestedPaths.some((nested) => hasUnknownToken(nested));
}

interface PartialPath {
  steps: readonly SequenceStep[];
  openObligations: readonly SequencingObligation[];
}

export class SequenceEngine {
  readonly scorer: ReadingScorer;

  /** Optional -- unset by default, which keeps `lexicalEvidenceSum`
   * exactly `0` for every candidate (createScoringFactors's own
   * default), the same "declared but currently remains 0.0" state the
   * Proposed learning phase describes until a caller actually opts in
   * (LinguisticController's own `evidenceStore` constructor param,
   * threaded through from here). */
  constructor(
    public readonly grammar: GrammarConfigurator,
    scorer?: ReadingScorer,
    private readonly evidenceStore?: LexicalEvidenceStore,
  ) {
    this.scorer = scorer ?? new ReadingScorer();
  }

  // --- Spec 10.2: primitive state-table queries ----------------------

  /** The states a sequence may move to from `currentState` under
   * `phraseGrammar` -- `currentState=undefined` means "not yet
   * started", so this returns the phrase's startStates. */
  getAllowedNextStates(currentState: PartOfSpeech | undefined, phraseGrammar: PhraseGrammar): ReadonlySet<PartOfSpeech> {
    if (currentState === undefined) return phraseGrammar.startStates;
    return phraseGrammar.transitions.get(currentState) ?? new Set();
  }

  validateTransition(fromState: PartOfSpeech | undefined, toState: PartOfSpeech, phraseGrammar: PhraseGrammar): boolean {
    return this.getAllowedNextStates(fromState, phraseGrammar).has(toState);
  }

  /** PREPOSITIONAL_PHRASE's own continuation: after PREPOSITION, the
   * next constituent is a whole nested NOUN_PHRASE, not a POS
   * transition -- callers (PhraseReader) recurse into
   * findValidSequences for the returned PhraseType instead of calling
   * getAllowedNextStates again. */
  nestedPhraseFor(phraseGrammar: PhraseGrammar, state: PartOfSpeech): PhraseType | undefined {
    return phraseGrammar.nestedPhraseAfter.get(state);
  }

  private allReachableStates(phraseGrammar: PhraseGrammar): ReadonlySet<PartOfSpeech> {
    const states = new Set<PartOfSpeech>([...phraseGrammar.startStates, ...phraseGrammar.endStates, ...phraseGrammar.transitions.keys()]);
    for (const targets of phraseGrammar.transitions.values()) {
      for (const target of targets) states.add(target);
    }
    return states;
  }

  // --- Spec 10.3: sequence search -------------------------------------

  /** Bounded beam search over `tokens[startIndex:endIndex]` against
   * `phraseType`'s PhraseGrammar (a naive exhaustive cover search
   * explodes combinatorially, so this caps total nodes explored at
   * grammar.maxSequenceSearchNodes and keeps only the best BEAM_WIDTH
   * partial paths per token position). Handles the five ordinary
   * (non-nested-phrase) phrase types directly; PREPOSITIONAL_PHRASE has
   * no endStates and no transitions, so calling this with
   * PhraseType.PREPOSITIONAL_PHRASE always returns an empty array --
   * PhraseReader composes a PP itself. */
  findValidSequences(tokens: readonly TokenReading[], startIndex: number, phraseType: PhraseType, endIndex?: number): readonly SequencePath[] {
    const phraseGrammar = this.grammar.phraseGrammars.get(phraseType);
    if (!phraseGrammar) return [];
    const resolvedEnd = endIndex ?? tokens.length;
    if (phraseGrammar.markerForms.size > 0) {
      return this.findMarkerSequences(tokens, startIndex, resolvedEnd, phraseGrammar);
    }
    return this.findTransitionSequences(tokens, startIndex, resolvedEnd, phraseGrammar);
  }

  private findMarkerSequences(tokens: readonly TokenReading[], startIndex: number, endIndex: number, phraseGrammar: PhraseGrammar): readonly SequencePath[] {
    if (startIndex >= endIndex) return [];
    const marker = tokens[startIndex];
    if (!phraseGrammar.markerForms.has(marker.text.toLowerCase())) return [];

    let openObligations: readonly SequencingObligation[] = [];
    if (phraseGrammar.markerObligation !== undefined) {
      openObligations = [{
        kind: phraseGrammar.markerObligation,
        scope: PHRASE_SCOPE.get(phraseGrammar.phraseType) as LinguisticScope,
        raisedAtIndex: startIndex,
        description: `"${marker.text}" requires a base-form verb to follow`,
      }];
    }
    const markerStep = createSequenceStep(startIndex, undefined, false, true);

    if (startIndex + 1 >= endIndex) {
      // Marker with nothing following -- the obligation it raised is
      // never discharged, a definite negative conclusion.
      return [createSequencePath({
        phraseType: phraseGrammar.phraseType, startIndex, endIndex: startIndex + 1,
        steps: [markerStep], openObligations,
      })];
    }

    const nextToken = tokens[startIndex + 1];
    const scope = PHRASE_SCOPE.get(phraseGrammar.phraseType) as LinguisticScope;

    if (!isKnown(nextToken)) {
      if (this.grammar.unknownTokenAbsorbingScopes.has(scope)) {
        const steps = [markerStep, createSequenceStep(startIndex + 1, undefined, true)];
        return [createSequencePath({
          phraseType: phraseGrammar.phraseType, startIndex, endIndex: startIndex + 2,
          steps, openObligations: [],
        })];
      }
      return [createSequencePath({
        phraseType: phraseGrammar.phraseType, startIndex, endIndex: startIndex + 1,
        steps: [markerStep], openObligations,
      })];
    }

    let paths = candidatePartsOfSpeech(nextToken)
      .filter((pos) => phraseGrammar.markerNextStates.has(pos))
      .map((pos) => createSequencePath({
        phraseType: phraseGrammar.phraseType, startIndex, endIndex: startIndex + 2,
        steps: [markerStep, createSequenceStep(startIndex + 1, pos)], openObligations: [],
      }));
    if (paths.length === 0) {
      paths = [createSequencePath({
        phraseType: phraseGrammar.phraseType, startIndex, endIndex: startIndex + 1,
        steps: [markerStep], openObligations,
      })];
    }
    return paths;
  }

  private findTransitionSequences(tokens: readonly TokenReading[], startIndex: number, endIndex: number, phraseGrammar: PhraseGrammar): readonly SequencePath[] {
    const scope = PHRASE_SCOPE.get(phraseGrammar.phraseType) as LinguisticScope;
    const absorbing = this.grammar.unknownTokenAbsorbingScopes.has(scope);

    let beam: PartialPath[] = [{ steps: [], openObligations: [] }];
    const completed: SequencePath[] = [];
    let nodesExplored = 0;
    let index = startIndex;
    let truncated = false;

    while (beam.length > 0 && index < endIndex && !truncated) {
      const token = tokens[index];
      const nextBeam: PartialPath[] = [];
      for (const partial of beam) {
        let prevPos: PartOfSpeech | typeof WILDCARD | undefined;
        if (partial.steps.length === 0) {
          prevPos = undefined;
        } else if (partial.steps[partial.steps.length - 1].isUnknown) {
          prevPos = WILDCARD;
        } else {
          prevPos = partial.steps[partial.steps.length - 1].partOfSpeech;
        }
        for (const [pos, isUnknown] of this.candidateStates(token, phraseGrammar, prevPos, absorbing)) {
          nodesExplored += 1;
          if (nodesExplored > this.grammar.maxSequenceSearchNodes) {
            truncated = true;
            break;
          }
          const newOpen = this.advanceObligations(partial.openObligations, phraseGrammar, pos, index, scope, isUnknown);
          const newSteps = [...partial.steps, createSequenceStep(index, pos, isUnknown)];
          nextBeam.push({ steps: newSteps, openObligations: newOpen });
          if (isUnknown || (pos !== undefined && phraseGrammar.endStates.has(pos))) {
            completed.push(createSequencePath({
              phraseType: phraseGrammar.phraseType, startIndex, endIndex: index + 1,
              steps: newSteps, openObligations: newOpen,
            }));
          }
        }
        if (truncated) break;
      }
      nextBeam.sort((a, b) => {
        const byObligations = a.openObligations.length - b.openObligations.length;
        if (byObligations !== 0) return byObligations;
        const unknownCount = (p: PartialPath) => p.steps.filter((s) => s.isUnknown).length;
        return unknownCount(a) - unknownCount(b);
      });
      beam = nextBeam.slice(0, BEAM_WIDTH);
      index += 1;
    }

    return completed;
  }

  private candidateStates(
    token: TokenReading,
    phraseGrammar: PhraseGrammar,
    prevPos: PartOfSpeech | typeof WILDCARD | undefined,
    absorbing: boolean,
  ): readonly [PartOfSpeech | undefined, boolean][] {
    if (!isKnown(token)) {
      return absorbing ? [[undefined, true]] : [];
    }
    let allowed: ReadonlySet<PartOfSpeech>;
    if (prevPos === WILDCARD) {
      // A wildcard's real POS is unknowable, so the token after it is
      // checked against every state this grammar can ever be in, not a
      // specific transition row -- permissive by design (spec 7), and
      // still bounded, since it's this grammar's own (small, fixed)
      // state set, not an unconstrained guess.
      allowed = this.allReachableStates(phraseGrammar);
    } else {
      allowed = this.getAllowedNextStates(prevPos, phraseGrammar);
    }
    return candidatePartsOfSpeech(token)
      .filter((pos) => allowed.has(pos))
      .map((pos) => [pos, false] as const);
  }

  private advanceObligations(
    openObligations: readonly SequencingObligation[],
    phraseGrammar: PhraseGrammar,
    pos: PartOfSpeech | undefined,
    tokenIndex: number,
    scope: LinguisticScope,
    isUnknown: boolean,
  ): readonly SequencingObligation[] {
    let remaining = openObligations;
    if (!isUnknown && pos !== undefined) {
      remaining = remaining.filter((obligation) => !(this.grammar.obligationDischarges.get(obligation.kind) ?? new Set()).has(pos));
      const raisedKind = phraseGrammar.obligationsRaised.get(pos);
      if (raisedKind !== undefined) {
        remaining = [...remaining, {
          kind: raisedKind, scope, raisedAtIndex: tokenIndex,
          description: `POS ${pos} at token ${tokenIndex} raises ${ObligationKind[raisedKind]}`,
        }];
      }
    }
    return remaining;
  }

  // --- Spec 10.4: sequence validation and ranking ---------------------

  validateSequence(path: SequencePath): ValidationOutcome {
    if (hasUnknownToken(path)) return ValidationOutcome.UNRESOLVED;
    if (path.openObligations.length > 0 || path.nestedPaths.some((nested) => nested.openObligations.length > 0)) {
      return ValidationOutcome.INVALID;
    }
    return ValidationOutcome.VALID;
  }

  rankSequences(paths: readonly SequencePath[], tokens: readonly TokenReading[]): readonly SequencePath[] {
    const scored = paths.map((path) => [path, this.scoringFactors(path, tokens)] as const);
    return this.scorer.rank(scored);
  }

  scopeForPhraseType(phraseType: PhraseType): LinguisticScope {
    return PHRASE_SCOPE.get(phraseType) as LinguisticScope;
  }

  scoringFactors(path: SequencePath, tokens: readonly TokenReading[]): ScoringFactors {
    const allSteps = [...path.steps, ...path.nestedPaths.flatMap((nested) => nested.steps)];
    const unresolved = allSteps.filter((step) => step.isUnknown).length;
    const undischarged = path.openObligations.length + path.nestedPaths.reduce((sum, nested) => sum + nested.openObligations.length, 0);
    // Lower is "more preferred": identifyWord's own candidate order is
    // highest-confidence first, so index 0 within a token's
    // candidatePartsOfSpeech() is its top-ranked seeded sense. Summed
    // across every real (non-wildcard, non-marker) step so that, when
    // nothing else distinguishes two candidate readings, the one built
    // from more top-ranked seeded senses wins.
    let rankIndexSum = 0;
    for (const step of allSteps) {
      if (step.isUnknown || step.isMarker || step.partOfSpeech === undefined) continue;
      const candidates = candidatePartsOfSpeech(tokens[step.tokenIndex]);
      const index = candidates.indexOf(step.partOfSpeech);
      if (index >= 0) rankIndexSum += index;
    }
    return createScoringFactors({
      validation: this.validateSequence(path),
      unresolvedTokenCount: unresolved,
      undischargedObligationCount: undischarged,
      phraseCount: 1 + path.nestedPaths.length,
      spanLength: path.endIndex - path.startIndex,
      candidateRankIndexSum: rankIndexSum,
      lexicalEvidenceSum: this.pathLexicalEvidence(path),
    });
  }

  /** spec 15's `w_ij -> lexical_evidence_sum` wiring -- sums this
   * store's recorded evidence for every genuine POS-to-POS transition
   * `path` (and, recursively, each of its own nestedPaths -- a
   * PREPOSITIONAL_PHRASE's nested NOUN_PHRASE has its own transitions,
   * scored under its own phraseType, not the parent's) actually walks.
   * `0` throughout when no evidenceStore was ever given to this engine
   * -- unchanged behaviour from before this store existed. A marker or
   * unknown-absorbed step has no real fromState/toState transition to
   * look up, so it contributes nothing and also breaks the chain (the
   * step after it starts counting again from "phrase start", since
   * whatever came before an absorbed unknown token isn't a reliable
   * predictor of what follows it). */
  private pathLexicalEvidence(path: SequencePath): number {
    if (!this.evidenceStore) return 0;
    let sum = 0;
    let fromState: PartOfSpeech | undefined;
    for (const step of path.steps) {
      if (step.isUnknown || step.isMarker || step.partOfSpeech === undefined) {
        fromState = undefined;
        continue;
      }
      sum += this.evidenceStore.weightFor(path.phraseType, fromState, step.partOfSpeech);
      fromState = step.partOfSpeech;
    }
    for (const nested of path.nestedPaths) sum += this.pathLexicalEvidence(nested);
    return sum;
  }
}
