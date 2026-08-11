import type { Word } from "../../vocabulary/data/word";
import type { GrammarConfigurator } from "../role/grammar_configurator";
import type { ReadingContext } from "../role/reading_context";
import type { ClauseType } from "./clause_type";
import type { Interpretation } from "./interpretation";
import type { LinguisticUnit } from "./linguistic_unit";
import type { Phrase } from "./phrase";
import type { ReadingError } from "./reading_error";
import type { TokenReading } from "./token_reading";
import { ValidationOutcome } from "./validation_outcome";

/** A grammatical unit built from one or more Phrases, centred on a
 * single finite predicate (Linguistics Layer developer specification,
 * 5; spec 13.1). References Vocabulary Words -- never copies or
 * replaces their lexical data (Rule 17).
 *
 * Ported from linguistics/data/clause.py. */
export interface Clause extends LinguisticUnit {
  tokens: Word[];
  // Clause.read() overwrites this with a genuinely computed value once
  // clauseType is known -- only INDEPENDENT clauses are recognised in
  // this phase (see clause_type.ts), so a readClause() call always
  // returns isIndependent=true or is UNRESOLVED, never a computed false.
  isIndependent?: boolean;

  clauseType?: ClauseType;
  phrases: Phrase[];
  subject?: Phrase;
  predicate?: Phrase;
  object?: Phrase;
  complement?: Phrase;
  modifiers: Phrase[];
  finiteVerb?: Word;
  // Populated from Phase 2 onward (relative/subordinate/coordinated
  // clauses) -- always empty in this phase; see clause_type.ts.
  nestedClauses: Clause[];
  startPosition: number;
  endPosition: number; // exclusive
  validation: ValidationOutcome;
  confidence: number;
  alternatives: readonly Interpretation[];
  errors: readonly ReadingError[];
}

export function createClause(init: Pick<Clause, "text"> & Partial<Clause>): Clause {
  return {
    tokens: [],
    isIndependent: true,
    phrases: [],
    modifiers: [],
    nestedClauses: [],
    startPosition: 0,
    endPosition: 0,
    validation: ValidationOutcome.UNRESOLVED,
    confidence: 0.0,
    alternatives: [],
    errors: [],
    ...init,
  };
}

export interface ReadClauseOptions {
  startIndex?: number;
  endIndex?: number;
  grammar?: GrammarConfigurator;
}

/** Spec 13.3 entry point. Contains no grammar or sequencing logic of
 * its own (spec 9) -- one delegation to the shared ClauseReader, the
 * only implementation of clause sequencing in this layer, reached
 * through `context` rather than a controller-shaped dependency. */
export function readClause(tokens: readonly TokenReading[], context: ReadingContext, options: ReadClauseOptions = {}): Clause {
  return context.clauseReader.read(tokens, {
    startIndex: options.startIndex ?? 0,
    endIndex: options.endIndex ?? tokens.length,
    grammar: options.grammar ?? context.grammar,
  });
}
