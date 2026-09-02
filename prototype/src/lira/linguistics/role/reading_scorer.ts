import { ValidationOutcome } from "../data/validation_outcome";

/** ReadingScorer: the one shared confidence/ranking scheme every
 * sequencing search result is ordered and scored by (Linguistics Layer
 * developer specification, 8.7; spec 15's "combination" step, spec
 * 24's "retain alternatives with confidence"). Operates purely over
 * ScoringFactors -- it has no idea whether the candidate it's ranking
 * is a phrase, clause, or sentence reading, which is what keeps this
 * the *one* shared scheme rather than a per-level reimplementation
 * (spec 11).
 *
 * Ported from linguistics/role/reading_scorer.py. */

/** Inputs to one candidate reading's rankKey/confidence. Computed once
 * per candidate by whichever role/*_reader.ts built it -- a phrase
 * reading only ever populates unresolvedTokenCount/
 * undischargedObligationCount/phraseCount/lexicalEvidenceSum/
 * candidateRankIndexSum; finiteVerbPhraseCount only means anything at
 * clause level. Every field defaults to a neutral value (0) so an
 * unpopulated factor never accidentally tips a comparison. */
export interface ScoringFactors {
  validation: ValidationOutcome;
  unresolvedTokenCount: number;
  undischargedObligationCount: number;
  // 1 when this candidate's own PhraseType is VERB_PHRASE, 0 otherwise
  // -- only ever populated by SequenceEngine.scoringFactors() (a real
  // PhraseType lives on the SequencePath it reads this off of), so this
  // only means anything when PhraseReader.read() is ranking candidates
  // of *different* PhraseTypes competing at the same start position,
  // finiteVerbPhraseCount's own "only means anything at clause level"
  // reasoning one level down. Reported directly, with a real bundled
  // example: "The old house stands on the hill." -- "stands" is a
  // genuine NOUN ("stands", the plural of the vending/furniture sense
  // of "stand") / VERB ("stands", third-person-singular of the verb
  // "stand") homograph, and with every other factor genuinely tied
  // (both a bare single-token completion, both VALID, no obligations),
  // the deciding factor used to be candidateRankIndexSum -- an
  // essentially accidental tie-break driven by whichever POS happened
  // to seed its own inflected "stands" WordForm first, not a
  // grammatical judgment. A wrongly-NOUN "stands" here doesn't just
  // mis-tag one word: the clause never finds a VERB_PHRASE for its own
  // predicate at all, so the whole clause reads MISSING_PREDICATE/
  // INVALID -- picking the noun reading of an ambiguous token is far
  // more costly than picking a verb reading of one, since English
  // clauses need a predicate a great deal more reliably than they need
  // any one particular NOUN_PHRASE reading of an ambiguous token.
  isVerbPhraseCandidate: 0 | 1;
  finiteVerbPhraseCount: number;
  phraseCount: number;
  lexicalEvidenceSum: number;
  candidateRankIndexSum: number;
  // Token span covered (endIndex - startIndex). Only meaningful when
  // comparing candidates that start at the same position (exactly
  // PhraseReader.read()'s own situation) -- a longer *equally valid*
  // completion is preferred (maximal munch).
  spanLength: number;
}

export function createScoringFactors(init: Pick<ScoringFactors, "validation"> & Partial<ScoringFactors>): ScoringFactors {
  return {
    unresolvedTokenCount: 0,
    undischargedObligationCount: 0,
    isVerbPhraseCandidate: 0,
    finiteVerbPhraseCount: 0,
    phraseCount: 0,
    lexicalEvidenceSum: 0.0,
    candidateRankIndexSum: 0,
    spanLength: 0,
    ...init,
  };
}

/** rankKey is a tuple ordered so ascending sort always places the best
 * candidate first (callers sort with it, keep the winner, and keep the
 * losers as Interpretation.alternatives). Sign convention, stated once
 * here rather than re-derived at each call site: every component is
 * written so a *smaller* value is better; components where a larger
 * raw value is actually better (phraseCount, lexicalEvidenceSum) are
 * negated to fit. */
export class ReadingScorer {
  rankKey(factors: ScoringFactors): readonly number[] {
    return [
      -factors.validation, // VALID(2) -> -2 sorts before UNRESOLVED(1) -> -1 before INVALID(0) -> 0
      -factors.spanLength, // maximal munch among equally-valid candidates
      factors.unresolvedTokenCount,
      factors.undischargedObligationCount,
      -factors.isVerbPhraseCandidate, // prefer a VERB_PHRASE reading of a genuinely ambiguous token (ScoringFactors's own docstring on why)
      Math.abs(factors.finiteVerbPhraseCount - 1), // exactly one finite VERB_PHRASE is the well-formed shape
      -factors.phraseCount,
      -factors.lexicalEvidenceSum,
      factors.candidateRankIndexSum, // tie-break: prefer identifyWord's own top-ranked senses
    ];
  }

  /** A [0,1] estimate of how trustworthy this reading is, distinct from
   * rankKey's pure ordering -- the top-ranked reading can still be low-
   * confidence (the only reading found, but riddled with open
   * obligations), and two readings can be genuinely tied. `tieCount`
   * is how many candidates share this exact rankKey; confidence is
   * split among genuine ties rather than each one claiming full
   * confidence. */
  confidence(factors: ScoringFactors, tieCount = 1): number {
    const baseValidity = {
      [ValidationOutcome.VALID]: 1.0,
      [ValidationOutcome.UNRESOLVED]: 0.5,
      [ValidationOutcome.INVALID]: 0.05,
    }[factors.validation];
    const obligationFactor = 1.0 / (1 + factors.undischargedObligationCount);
    const ambiguityFactor = 1.0 / (1 + 0.15 * factors.candidateRankIndexSum);
    const tieFactor = 1.0 / Math.max(tieCount, 1);
    return Math.round(baseValidity * obligationFactor * ambiguityFactor * tieFactor * 10000) / 10000;
  }

  /** Stable sort (Array.prototype.sort is stable per ECMA-262 since
   * ES2019) so that candidates tying on rankKey keep whatever order
   * the caller built them in -- callers construct candidates in a
   * deterministic order, so ties resolve deterministically rather than
   * arbitrarily. */
  rank<T>(scored: readonly (readonly [T, ScoringFactors])[]): readonly T[] {
    const ordered = scored.slice().sort((a, b) => compareKeys(this.rankKey(a[1]), this.rankKey(b[1])));
    return ordered.map(([item]) => item);
  }
}

function compareKeys(a: readonly number[], b: readonly number[]): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}
