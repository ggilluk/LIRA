/** The sentence types Sentence.read() can recognise (Linguistics Layer
 * developer specification, 6.1). Only DECLARATIVE has a populated
 * sentence template in this phase (spec 22: "simple declarative
 * sentences" is the only initially supported sentence shape) -- the
 * other three are defined for a stable value space but never produced
 * yet; a sentence that isn't declarative-shaped is reported UNRESOLVED
 * rather than guessed.
 *
 * Ported from linguistics/data/sentence_type.py. */
export enum SentenceType {
  DECLARATIVE = 0,
  INTERROGATIVE = 1,
  IMPERATIVE = 2,
  EXCLAMATORY = 3,
}
