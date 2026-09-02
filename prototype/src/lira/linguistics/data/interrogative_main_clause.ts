/** InterrogativeMainClause: MainClause's own SentenceType.INTERROGATIVE
 * subtype -- DeclarativeMainClause's own counterpart, one mood over
 * (declarative_main_clause.ts's own docstring on the pattern and its
 * "declared ahead of its own detector" state). Example: "Did she open
 * the door?" */

import { createMainClause, type MainClause, type MainClauseInit } from "./main_clause";
import { SentenceType } from "./sentence_type";
import type { Clause } from "./clause";
import { ClauseType } from "./clause_type";

export interface InterrogativeMainClause extends MainClause {
  mood: SentenceType.INTERROGATIVE;
}

export type InterrogativeMainClauseInit = Omit<MainClauseInit, "mood">;

export function createInterrogativeMainClause(init: InterrogativeMainClauseInit): InterrogativeMainClause {
  return createMainClause({ ...init, mood: SentenceType.INTERROGATIVE }) as InterrogativeMainClause;
}

export function isInterrogativeMainClause(clause: Clause): clause is InterrogativeMainClause {
  return clause.clauseType === ClauseType.INDEPENDENT && clause.mood === SentenceType.INTERROGATIVE;
}
