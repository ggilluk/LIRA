/** The three-way validation result every Phrase/Clause/Sentence carries
 * (Linguistics Layer developer specification, 8.4; spec 20). UNRESOLVED
 * is distinct from INVALID: UNRESOLVED means sequencing could not reach
 * a conclusion (an unknown word blocked a required slot, spec 7), while
 * INVALID means sequencing reached a definite negative conclusion (e.g.
 * no finite predicate, spec 20's own "The fox over the dog." example).
 * ReadingScorer's rankKey orders VALID above UNRESOLVED above INVALID.
 *
 * Ported from linguistics/data/validation_outcome.py. */
export enum ValidationOutcome {
  INVALID = 0,
  UNRESOLVED = 1,
  VALID = 2,
}
