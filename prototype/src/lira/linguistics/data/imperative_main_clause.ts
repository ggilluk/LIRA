/** ImperativeMainClause: MainClause's own SentenceType.IMPERATIVE
 * subtype -- DeclarativeMainClause's own counterpart, one mood over
 * (declarative_main_clause.ts's own docstring on the pattern and its
 * "declared ahead of its own detector" state). Example: "Open the
 * door." -- an imperative clause has no subject of its own
 * (SentenceType's own docstring: "IMPERATIVE alone remains unpopulated:
 * an imperative clause has no subject at all... which needs its own
 * ClauseTemplate (subjectRequired=false)"), so `subject` stays
 * `undefined` on a real ImperativeMainClause once ClauseReader can
 * build one, unlike the other three moods. */

import { createMainClause, type MainClause, type MainClauseInit } from "./main_clause";
import { SentenceType } from "./sentence_type";
import type { Clause } from "./clause";
import { ClauseType } from "./clause_type";

export interface ImperativeMainClause extends MainClause {
  mood: SentenceType.IMPERATIVE;
}

export type ImperativeMainClauseInit = Omit<MainClauseInit, "mood">;

export function createImperativeMainClause(init: ImperativeMainClauseInit): ImperativeMainClause {
  return createMainClause({ ...init, mood: SentenceType.IMPERATIVE }) as ImperativeMainClause;
}

export function isImperativeMainClause(clause: Clause): clause is ImperativeMainClause {
  return clause.clauseType === ClauseType.INDEPENDENT && clause.mood === SentenceType.IMPERATIVE;
}
