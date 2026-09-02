/** SubordinateClause: Clause's own DEPENDENT/RELATIVE/COORDINATED
 * subtype -- `MainClause`'s own counterpart (main_clause.ts's own
 * docstring on the narrowing pattern this mirrors). A subordinate clause
 * cannot stand alone as a complete sentence on its own; it depends on a
 * MainClause the way a DEPENDENT/RELATIVE clause modifies one, or a
 * COORDINATED clause joins onto one.
 *
 * Declared ahead of its own seeder, the same "declared before it's
 * populated" state several Vocabulary Phrase subtypes started in
 * (vocabulary/data/entities/noun_phrase.ts's own docstring on that
 * distinction) -- ClauseReader has no clause-level recursion yet
 * (clause_type.ts's own docstring), so no real ClauseReader.read() call
 * produces one of these today; every real reading either resolves to a
 * MainClause or stays UNRESOLVED with `clauseType` left `undefined`
 * (clause_reader.ts's own emptyClause()). This type exists now so
 * downstream code (grammar templates, the clause-recursion work itself)
 * has a real target to narrow onto once that phase lands, rather than
 * inventing it then. */

import { ClauseType } from "./clause_type";
import { createClause, type Clause, type ClauseInit } from "./clause";

export type SubordinateClauseType = ClauseType.DEPENDENT | ClauseType.RELATIVE | ClauseType.COORDINATED;

export interface SubordinateClause extends Clause {
  clauseType: SubordinateClauseType;
}

export type SubordinateClauseInit = Omit<ClauseInit, "clauseType"> & { clauseType: SubordinateClauseType };

export function createSubordinateClause(init: SubordinateClauseInit): SubordinateClause {
  return createClause(init) as SubordinateClause;
}

export function isSubordinateClause(clause: Clause): clause is SubordinateClause {
  return clause.clauseType !== undefined && clause.clauseType !== ClauseType.INDEPENDENT;
}
