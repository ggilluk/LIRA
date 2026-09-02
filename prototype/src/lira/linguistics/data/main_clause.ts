/** MainClause: Clause's own INDEPENDENT-only subtype -- narrows a Clause
 * by `clauseType` the same way Vocabulary's NounPhrase narrows a Phrase
 * by `phraseType` (vocabulary/data/entities/noun_phrase.ts's own
 * docstring). A main clause is a clause capable of standing alone as a
 * complete sentence -- ClauseType.INDEPENDENT, the one ClauseType a real
 * ClauseReader.read() call actually produces today (clause_type.ts's own
 * docstring: DEPENDENT/RELATIVE/COORDINATED all require clause-level
 * recursion this phase doesn't implement yet). Every clause a real
 * sentence reads successfully in this phase is genuinely a MainClause. */

import { ClauseType } from "./clause_type";
import { createClause, type Clause, type ClauseInit } from "./clause";

export interface MainClause extends Clause {
  clauseType: ClauseType.INDEPENDENT;
}

export type MainClauseInit = Omit<ClauseInit, "clauseType">;

export function createMainClause(init: MainClauseInit): MainClause {
  return createClause({ ...init, clauseType: ClauseType.INDEPENDENT }) as MainClause;
}

export function isMainClause(clause: Clause): clause is MainClause {
  return clause.clauseType === ClauseType.INDEPENDENT;
}
