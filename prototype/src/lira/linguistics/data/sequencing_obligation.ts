/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/linguistics/data/sequencing_obligation
 * │ Filename        │ sequencing_obligation.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-09-08
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ SequencingObligation: grammatical obligations a scope raises
 * │                 │ while sequencing, which must be met for a VALID reading.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/data/sequencing_obligation
 * @file sequencing_obligation.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { LinguisticScope } from "./linguistic_scope";

/** The grammatical obligations a scope can raise while sequencing
 * (Linguistics Layer developer specification, 8.3; spec 17's own worked
 * examples). A phrase/clause/sentence is not VALID while any obligation
 * it raised remains undischarged (spec 17's closing line) --
 * GrammarConfigurator.obligationDischarges names which PartOfSpeech
 * values discharge each kind. RELATIVE_PRONOUN_OPENS_RELATIVE_CLAUSE,
 * QUOTATION_MUST_CLOSE, and PARENTHETICAL_MUST_CLOSE are defined for a
 * stable value space but not yet raised by any rule in this phase --
 * INFINITIVE_MARKER_REQUIRES_BASE_VERB is the inverse case, no longer
 * raised by any rule: it used to be raised by the INFINITIVE_PHRASE
 * PhraseGrammar's own marker-step mechanism, both now removed
 * (grammar_configurator.ts's own "Remove InfinitivePhrase" design log
 * entry) -- kept defined, not deleted or renumbered, the same "every
 * value here is a tensor code" reasoning LinguisticScope's own identical
 * gap has (linguistic_scope.ts).
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
