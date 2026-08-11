import type { LinguisticScope } from "./linguistic_scope";

/** The grammatical obligations a scope can raise while sequencing
 * (Linguistics Layer developer specification, 8.3; spec 17's own worked
 * examples). A phrase/clause/sentence is not VALID while any obligation
 * it raised remains undischarged (spec 17's closing line) --
 * GrammarConfigurator.obligationDischarges names which PartOfSpeech
 * values discharge each kind. RELATIVE_PRONOUN_OPENS_RELATIVE_CLAUSE,
 * QUOTATION_MUST_CLOSE, and PARENTHETICAL_MUST_CLOSE are defined for a
 * stable value space but not yet raised by any rule in this phase.
 *
 * Ported from linguistics/data/sequencing_obligation.py. */
export enum ObligationKind {
  DETERMINER_REQUIRES_NOMINAL_HEAD = 0,
  PREPOSITION_REQUIRES_OBJECT = 1,
  AUXILIARY_REQUIRES_COMPATIBLE_VERB_FORM = 2,
  INFINITIVE_MARKER_REQUIRES_BASE_VERB = 3,
  CONJUNCTION_REQUIRES_COORDINATED_ELEMENT = 4,
  RELATIVE_PRONOUN_OPENS_RELATIVE_CLAUSE = 5,
  DECLARATIVE_CLAUSE_REQUIRES_FINITE_VERB = 6,
  QUOTATION_MUST_CLOSE = 7,
  PARENTHETICAL_MUST_CLOSE = 8,
}

/** One instance of an obligation raised during sequencing -- e.g. the
 * PREPOSITION_REQUIRES_OBJECT obligation "over" raises the moment it's
 * read as the start of a PREPOSITIONAL_PHRASE, discharged once a
 * NOUN_PHRASE is nested under it. raisedAtIndex is the token index that
 * raised it, for structured-error reporting (a ReadingError's own
 * unfinishedObligation field points back to one of these). */
export interface SequencingObligation {
  kind: ObligationKind;
  scope: LinguisticScope;
  raisedAtIndex: number;
  description: string;
}
