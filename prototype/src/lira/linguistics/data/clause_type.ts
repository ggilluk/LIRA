/** The clause types Clause.read() can recognise (Linguistics Layer
 * developer specification, 5.1; spec 13.1). All four are defined from
 * the outset so the values are stable, but only INDEPENDENT has a
 * populated clause template (GrammarConfigurator.clauseElementTemplates)
 * in this phase -- DEPENDENT/RELATIVE/COORDINATED clauses require
 * clause-level recursion ClauseReader does not yet implement. A
 * Clause.read() result that would need one of those three is reported
 * UNRESOLVED, never guessed into INDEPENDENT.
 *
 * Clause itself narrows into two real subtypes over this enum --
 * MainClause (data/main_clause.ts) for INDEPENDENT, the one value a real
 * ClauseReader.read() call actually produces today, and
 * SubordinateClause (data/subordinate_clause.ts) for the other three
 * (DEPENDENT/RELATIVE/COORDINATED) taken together -- a clause that
 * cannot stand alone as a complete sentence. A COORDINATED clause
 * ("...and she left") is grammatically still built from two independent
 * clauses joined by a coordinating conjunction, but is classified
 * SubordinateClause here rather than MainClause: this binary split is
 * deliberately keyed on "is this ClauseType the one this phase's own
 * ClauseReader genuinely resolves to" (INDEPENDENT alone), not on a
 * finer-grained grammatical-independence judgment call, since Phase 2's
 * own clause-level recursion (which will actually construct a
 * COORDINATED clause) hasn't been designed yet and shouldn't be
 * pre-empted by this split.
 *
 * Ported from linguistics/data/clause_type.py. */
export enum ClauseType {
  INDEPENDENT = 0,
  DEPENDENT = 1,
  RELATIVE = 2,
  COORDINATED = 3,
}
