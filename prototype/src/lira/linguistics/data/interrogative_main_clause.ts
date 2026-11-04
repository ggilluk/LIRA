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
 * │ Module Name     │ lira/linguistics/data/interrogative_main_clause
 * │ Filename        │ interrogative_main_clause.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-09-02
 * │ Modified Date   │ 2026-09-02
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ InterrogativeMainClause: MainClause narrowed to the
 * │                 │ interrogative mood.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/data/interrogative_main_clause
 * @file interrogative_main_clause.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/** InterrogativeMainClause: MainClause's own SentenceType.INTERROGATIVE
 * subtype -- DeclarativeMainClause's own counterpart, one mood over
 * (declarative_main_clause.ts's own docstring on the pattern, its
 * "declared ahead of its own detector" state, and its own identical
 * subject/predicate narrowing). Example: "Did she open the door?" */

import { createMainClause, type MainClause, type MainClauseInit } from "./main_clause";
import { SentenceType } from "./sentence_type";
import type { Clause } from "./clause";
import { ClauseType } from "./clause_type";
import type { NounPhrase } from "./noun_phrase";
import type { PrepositionalPhrase } from "./prepositional_phrase";
import type { VerbPhrase } from "./verb_phrase";

export interface InterrogativeMainClause extends MainClause {
  mood: SentenceType.INTERROGATIVE;
  subject?: NounPhrase | PrepositionalPhrase | Clause;
  predicate?: VerbPhrase;
}

export type InterrogativeMainClauseInit = Omit<MainClauseInit, "mood" | "subject" | "predicate"> & {
  subject?: NounPhrase | PrepositionalPhrase | Clause;
  predicate?: VerbPhrase;
};

export function createInterrogativeMainClause(init: InterrogativeMainClauseInit): InterrogativeMainClause {
  return createMainClause({ ...init, mood: SentenceType.INTERROGATIVE }) as InterrogativeMainClause;
}

export function isInterrogativeMainClause(clause: Clause): clause is InterrogativeMainClause {
  return clause.clauseType === ClauseType.INDEPENDENT && clause.mood === SentenceType.INTERROGATIVE;
}
