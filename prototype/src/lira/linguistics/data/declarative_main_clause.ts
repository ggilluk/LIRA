/** DeclarativeMainClause: MainClause's own SentenceType.DECLARATIVE
 * subtype -- narrows `mood` (Clause's own docstring on that field) the
 * same way MainClause itself narrows `clauseType` (main_clause.ts's own
 * docstring on the pattern, and on this subtype's own "declared ahead
 * of its own detector" state). Example: "She opened the door." */

import { createMainClause, type MainClause, type MainClauseInit } from "./main_clause";
import { SentenceType } from "./sentence_type";
import type { Clause } from "./clause";
import { ClauseType } from "./clause_type";

export interface DeclarativeMainClause extends MainClause {
  mood: SentenceType.DECLARATIVE;
}

export type DeclarativeMainClauseInit = Omit<MainClauseInit, "mood">;

export function createDeclarativeMainClause(init: DeclarativeMainClauseInit): DeclarativeMainClause {
  return createMainClause({ ...init, mood: SentenceType.DECLARATIVE }) as DeclarativeMainClause;
}

export function isDeclarativeMainClause(clause: Clause): clause is DeclarativeMainClause {
  return clause.clauseType === ClauseType.INDEPENDENT && clause.mood === SentenceType.DECLARATIVE;
}
