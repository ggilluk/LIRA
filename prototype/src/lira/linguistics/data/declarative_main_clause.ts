/** DeclarativeMainClause: MainClause's own SentenceType.DECLARATIVE
 * subtype -- narrows `mood` (Clause's own docstring on that field) the
 * same way MainClause itself narrows `clauseType` (main_clause.ts's own
 * docstring on the pattern, and on this subtype's own "declared ahead
 * of its own detector" state). Example: "She opened the door."
 *
 * Also narrows `subject`/`predicate` down from base Clause's own
 * generic `Phrase` -- a NounPhrase, PrepositionalPhrase, or embedded
 * Clause may fill `subject` ("The fact that she left surprised me." --
 * a nominal Clause subject, Phase 2 clause-embedding work, not yet
 * buildable); only a VerbPhrase may fill `predicate`. Requested
 * directly, identical for InterrogativeMainClause/ExclamativeMainClause
 * (interrogative_main_clause.ts/exclamative_main_clause.ts) -- only
 * ImperativeMainClause narrows differently (imperative_main_clause.ts's
 * own docstring). Today's one real GrammarConfigurator template
 * (buildClauseElementTemplates(), role/grammar_configurator.ts) only
 * ever assigns a NounPhrase to `subject`/a VerbPhrase to `predicate` --
 * PrepositionalPhrase/Clause subjects are, like `mood` itself, declared
 * ahead of the grammar that would actually produce one. */

import { createMainClause, type MainClause, type MainClauseInit } from "./main_clause";
import { SentenceType } from "./sentence_type";
import type { Clause } from "./clause";
import { ClauseType } from "./clause_type";
import type { NounPhrase } from "./noun_phrase";
import type { PrepositionalPhrase } from "./prepositional_phrase";
import type { VerbPhrase } from "./verb_phrase";

export interface DeclarativeMainClause extends MainClause {
  mood: SentenceType.DECLARATIVE;
  subject?: NounPhrase | PrepositionalPhrase | Clause;
  predicate?: VerbPhrase;
}

export type DeclarativeMainClauseInit = Omit<MainClauseInit, "mood" | "subject" | "predicate"> & {
  subject?: NounPhrase | PrepositionalPhrase | Clause;
  predicate?: VerbPhrase;
};

export function createDeclarativeMainClause(init: DeclarativeMainClauseInit): DeclarativeMainClause {
  return createMainClause({ ...init, mood: SentenceType.DECLARATIVE }) as DeclarativeMainClause;
}

export function isDeclarativeMainClause(clause: Clause): clause is DeclarativeMainClause {
  return clause.clauseType === ClauseType.INDEPENDENT && clause.mood === SentenceType.DECLARATIVE;
}
