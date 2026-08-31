/** Whether a Conjunction (data/entities/conjunction.ts) links two or
 * more syntactically equal constituents (COORDINATING: "and", "or",
 * "but") or introduces a clause that depends on a main clause
 * (SUBORDINATING: "although", "because", "if") -- Huddleston, Pullum &
 * Reynolds, A Student's Introduction to English Grammar, Chapter 15
 * (Coordinations) draws the same distinction Coordination.coordinator
 * (data/entities/coordination.ts) relies on: a real Coordination's own
 * coordinator, when present, always names a COORDINATING Conjunction,
 * never a SUBORDINATING one.
 *
 * Mirrors the Common Vocabulary Cache's own two source files
 * (coordinating_conjunctions.json/subordinating_conjunctions.json,
 * each entry's own `closed_class_kind`) -- the distinction already
 * existed at seeding time, this just carries it onto the Word itself
 * instead of leaving it implicit in which file a Conjunction happened
 * to be seeded from.
 *
 * Values are numeric codes for use in a tensor, not string labels --
 * same convention as PartOfSpeech/PhraseType/ModifierRole/EditorialLabel. */
export enum ConjunctionType {
  COORDINATING = 0,
  SUBORDINATING = 1,
}
