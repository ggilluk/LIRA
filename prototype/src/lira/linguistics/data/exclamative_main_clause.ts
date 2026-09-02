/** ExclamativeMainClause: MainClause's own SentenceType.EXCLAMATORY
 * subtype -- DeclarativeMainClause's own counterpart, one mood over
 * (declarative_main_clause.ts's own docstring on the pattern and its
 * "declared ahead of its own detector" state). Example: "What a
 * beautiful day it is!" Named ExclamativeMainClause (matching the
 * requested name) even though it narrows SentenceType.EXCLAMATORY --
 * "exclamative" and "exclamatory" name the identical grammatical mood,
 * this codebase's own enum member (data/sentence_type.ts) having
 * settled on the latter spelling first; no separate ClauseMood enum was
 * introduced just to rename the value (Clause.mood's own docstring,
 * data/clause.ts, on reusing SentenceType directly). */

import { createMainClause, type MainClause, type MainClauseInit } from "./main_clause";
import { SentenceType } from "./sentence_type";
import type { Clause } from "./clause";
import { ClauseType } from "./clause_type";

export interface ExclamativeMainClause extends MainClause {
  mood: SentenceType.EXCLAMATORY;
}

export type ExclamativeMainClauseInit = Omit<MainClauseInit, "mood">;

export function createExclamativeMainClause(init: ExclamativeMainClauseInit): ExclamativeMainClause {
  return createMainClause({ ...init, mood: SentenceType.EXCLAMATORY }) as ExclamativeMainClause;
}

export function isExclamativeMainClause(clause: Clause): clause is ExclamativeMainClause {
  return clause.clauseType === ClauseType.INDEPENDENT && clause.mood === SentenceType.EXCLAMATORY;
}
