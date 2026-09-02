/** MainClause: Clause's own INDEPENDENT-only subtype -- narrows a Clause
 * by `clauseType` the same way Vocabulary's NounPhrase narrows a Phrase
 * by `phraseType` (vocabulary/data/entities/noun_phrase.ts's own
 * docstring). A main clause is a clause capable of standing alone as a
 * complete sentence -- ClauseType.INDEPENDENT, the one ClauseType a real
 * ClauseReader.read() call actually produces today (clause_type.ts's own
 * docstring: DEPENDENT/RELATIVE/COORDINATED all require clause-level
 * recursion this phase doesn't implement yet). Every clause a real
 * sentence reads successfully in this phase is genuinely a MainClause.
 *
 * MainClause itself narrows into four further real subtypes over
 * `mood` (Clause's own docstring on that field), one per SentenceType
 * value -- DeclarativeMainClause ("She opened the door."),
 * InterrogativeMainClause ("Did she open the door?"),
 * ImperativeMainClause ("Open the door."), and ExclamativeMainClause
 * ("What a beautiful day it is!", named for the user's own request even
 * though it narrows SentenceType.EXCLAMATORY -- "exclamative" and
 * "exclamatory" name the identical grammatical mood, this codebase's own
 * enum member having settled on the latter spelling first). Declared
 * ahead of their own detector, the same "declared before it's populated"
 * state SubordinateClause started in (subordinate_clause.ts's own
 * docstring) -- ClauseReader has no mood-classifying grammar yet
 * (subject-absence for IMPERATIVE, subject-auxiliary inversion for
 * INTERROGATIVE, wh-fronting for EXCLAMATIVE all remain Phase 2 work,
 * SentenceType's own docstring), so `mood` stays `undefined` on every
 * real MainClause `ClauseReader.read()` produces today; only a
 * hand-built value (`createDeclarativeMainClause()` et al.) is ever one
 * of these four subtypes right now. */

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
