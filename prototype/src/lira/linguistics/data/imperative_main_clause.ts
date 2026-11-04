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
 * │ Module Name     │ lira/linguistics/data/imperative_main_clause
 * │ Filename        │ imperative_main_clause.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-09-02
 * │ Modified Date   │ 2026-09-02
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ ImperativeMainClause: MainClause narrowed to the imperative
 * │                 │ mood.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/data/imperative_main_clause
 * @file imperative_main_clause.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/** ImperativeMainClause: MainClause's own SentenceType.IMPERATIVE
 * subtype -- DeclarativeMainClause's own counterpart, one mood over
 * (declarative_main_clause.ts's own docstring on the pattern and its
 * "declared ahead of its own detector" state). Example: "Open the
 * door." -- an imperative clause usually has no subject of its own
 * (SentenceType's own docstring: "IMPERATIVE alone remains unpopulated:
 * an imperative clause has no subject at all... which needs its own
 * ClauseTemplate (subjectRequired=false)"), so `subject` narrows down
 * to just `NounPhrase | undefined` here -- not the wider
 * `NounPhrase | PrepositionalPhrase | Clause | undefined`
 * DeclarativeMainClause/InterrogativeMainClause/ExclamativeMainClause
 * all share -- covering the rarer explicit-subject/vocative form ("You
 * open the door.", "Somebody stop that man!") without ever allowing a
 * PrepositionalPhrase or embedded Clause subject, neither of which is a
 * grammatical imperative subject shape. `predicate` narrows the same
 * `VerbPhrase` way the other three moods do. */

import { createMainClause, type MainClause, type MainClauseInit } from "./main_clause";
import { SentenceType } from "./sentence_type";
import type { Clause } from "./clause";
import { ClauseType } from "./clause_type";
import type { NounPhrase } from "./noun_phrase";
import type { VerbPhrase } from "./verb_phrase";

export interface ImperativeMainClause extends MainClause {
  mood: SentenceType.IMPERATIVE;
  subject?: NounPhrase;
  predicate?: VerbPhrase;
}

export type ImperativeMainClauseInit = Omit<MainClauseInit, "mood" | "subject" | "predicate"> & {
  subject?: NounPhrase;
  predicate?: VerbPhrase;
};

export function createImperativeMainClause(init: ImperativeMainClauseInit): ImperativeMainClause {
  return createMainClause({ ...init, mood: SentenceType.IMPERATIVE }) as ImperativeMainClause;
}

export function isImperativeMainClause(clause: Clause): clause is ImperativeMainClause {
  return clause.clauseType === ClauseType.INDEPENDENT && clause.mood === SentenceType.IMPERATIVE;
}
