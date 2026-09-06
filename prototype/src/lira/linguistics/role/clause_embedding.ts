import type { Clause } from "../data/clause";
import { ValidationOutcome } from "../data/validation_outcome";
import type { TokenReading } from "../data/token_reading";
import type { ClauseTemplate } from "./grammar_configurator";
import type { SequenceEngine } from "./sequence_engine";

/** ClauseReader.read()'s own trigger recognition + boundary search for a
 * nominal subordinate clause filling the matrix clause's SUBJECT role --
 * "That the door was unlocked surprised everyone." (the complementizer
 * "that" opening "the door was unlocked"), "Did what happened yesterday
 * surprise you?" (the free-relative "what" itself standing as the
 * embedded clause's own subject). See
 * data_entity_design_decisions_log.md for the diagnosis this
 * implements, and clause_type.ts/subordinate_clause.ts for why this was
 * previously unimplemented ("Phase 2" clause-level recursion).
 *
 * Deliberately narrow: only SUBJECT-position embedding, only these two
 * trigger shapes. Object-position embedding ("I know that she left.")
 * is a natural extension of the same mechanism but isn't exercised by
 * any real reported case, so it stays unimplemented here, not silently
 * half-done -- ClauseReader never attempts this once a subject has
 * already been found. */

// The subordinator "that" -- consumed as a pure marker, never itself
// part of the embedded clause's own subject (embeddingTrigger() returns
// the position *after* it). Deliberately just this one form: "that" is
// also a real closed-class DETERMINER/PRONOUN Word (data/entities/
// pronoun.ts, seeded from pronouns.json) with its own ordinary
// NOUN_PHRASE reading -- this set only fires the embedding attempt at
// all, it never claims "that" can ONLY be a complementizer here; a
// clause with no valid embedded boundary (embeddedSubjectClauseSpan()
// returning undefined) falls through to the ordinary flat phrase-by-
// phrase reading unaffected, "that" included.
const NOMINAL_CLAUSE_COMPLEMENTIZERS: ReadonlySet<string> = new Set(["that"]);

// Free-relative wh-words that themselves stand as the embedded clause's
// own subject ("what happened" = "the thing that happened") --
// embeddingTrigger() returns the trigger's own position, not the next
// one. "who"/"which" deliberately excluded: unlike "what", both are
// always seeded with a real, independent PRONOUN Word too
// (pronouns.json), so the ordinary flat parse already treats them as a
// ordinary subject NOUN_PHRASE and no reported failure needs this
// mechanism for them -- scoped to the one form the reported paragraph
// actually needs.
const FREE_RELATIVE_PRONOUNS: ReadonlySet<string> = new Set(["what", "whoever", "whatever", "whichever"]);

/** `token`'s own embedded-clause span start, if it opens one -- the
 * position ClauseReader should hand `embeddedSubjectClauseSpan()` as
 * `embeddedStart`. `undefined` when `token` is neither trigger form. */
export function embeddingTrigger(token: TokenReading): number | undefined {
  const text = token.text.toLowerCase();
  if (NOMINAL_CLAUSE_COMPLEMENTIZERS.has(text)) return token.tokenIndex + 1;
  if (FREE_RELATIVE_PRONOUNS.has(text)) return token.tokenIndex;
  return undefined;
}

/** The boundary search itself (data_entity_design_decisions_log.md's
 * own worked trace through both reported sentences). Scans candidate
 * boundaries from `embeddedStart + 1` up to `endIndex`, and for each,
 * accepts it only when BOTH:
 *
 * 1. `readEmbedded(embeddedStart, boundary)` (ClauseReader.read() against
 *    the DEPENDENT template, threaded in as a callback rather than a
 *    direct ClauseReader dependency here) reads as `VALID` over exactly
 *    that span.
 * 2. A real matrix predicate is structurally possible starting at
 *    `boundary` -- checked via `engine.findValidSequences()` directly
 *    for each of `matrixTemplate.predicatePhraseTypes`, NOT via
 *    PhraseReader's own cross-phrase-type-ranked winner: a genuinely
 *    ambiguous token (the reported case -- "surprised" resolves as
 *    ADJECTIVE_PHRASE when PhraseReader picks its own single winner at
 *    that position, even though a VALID VERB_PHRASE reading of the same
 *    token also exists) would otherwise wrongly reject a real boundary.
 *    This only needs a real predicate to be *structurally possible* at
 *    `boundary`, not to be PhraseReader's own preferred reading of it.
 *
 * Among every boundary satisfying both, returns the LARGEST -- required,
 * not incidental: for "That the door was unlocked surprised everyone.",
 * the boundary right after "was" already satisfies both ("the door was"
 * is itself a VALID dependent clause headed by the AUXILIARY-only
 * predicate "was", and "unlocked" alone starts a VALID VERB_PHRASE reading
 * too) -- taking the first match would wrongly truncate the embedded
 * clause there. Only the largest satisfying boundary (right after
 * "unlocked" instead) matches the correct constituent structure, leaving
 * "surprised" as the real matrix predicate. `undefined` when no boundary
 * satisfies both -- an ordinary sentence with no embedded subject, or an
 * embedded clause that never resolves; ClauseReader falls back to its
 * ordinary flat phrase-by-phrase reading unaffected either way. */
export function embeddedSubjectClauseSpan(
  embeddedStart: number,
  endIndex: number,
  tokens: readonly TokenReading[],
  engine: SequenceEngine,
  matrixTemplate: ClauseTemplate,
  readEmbedded: (startIndex: number, boundary: number) => Clause,
): { boundary: number; embedded: Clause } | undefined {
  let best: { boundary: number; embedded: Clause } | undefined;
  for (let boundary = embeddedStart + 1; boundary <= endIndex; boundary++) {
    const embedded = readEmbedded(embeddedStart, boundary);
    if (embedded.validation !== ValidationOutcome.VALID || embedded.endPosition !== boundary) continue;
    if (!matrixPredicateStartsAt(boundary, endIndex, tokens, engine, matrixTemplate)) continue;
    best = { boundary, embedded };
  }
  return best;
}

function matrixPredicateStartsAt(
  startIndex: number, endIndex: number, tokens: readonly TokenReading[], engine: SequenceEngine, matrixTemplate: ClauseTemplate,
): boolean {
  if (startIndex >= endIndex) return false;
  for (const phraseType of matrixTemplate.predicatePhraseTypes) {
    const candidates = engine.findValidSequences(tokens, startIndex, phraseType, endIndex);
    if (candidates.length === 0) continue;
    const best = engine.rankSequences(candidates, tokens)[0];
    if (engine.validateSequence(best) === ValidationOutcome.VALID) return true;
  }
  return false;
}
