/** Values are numeric codes, the same convention PartOfSpeech/
 * EditorialLabel already use.
 *
 * The Vector/Primitive-Root-Word column of the Interrogative/Hypernym/
 * Holonym/Vector-Primitive root word table -- the underlying semantic
 * primitive each row ultimately reduces to (an Entity's Manifestation,
 * a Party/Role's Agency, and so on). Members share InterrogativeRootWord's
 * own numeric values one-for-one -- see that enum's own docstring. No
 * Python equivalent -- new to this table, prototype only. */
export enum VectorPrimitiveRootWord {
  MANIFESTATION = 0,
  AGENCY = 1,
  // Seeded as "origination" (root_words.json), not "origin" -- renamed
  // so the Vector/Primitive root word for the Where/Place row is a
  // genuine derivable noun (Word.isDerivableNoun's own docstring, "to
  // originate" -> "origination"), which "origin" never was.
  ORIGINATION = 2,
  INSTANCE = 3,
  CAUSE = 4,
  // Seeded as "trigger" (root_words.json), not "mechanism" -- renamed
  // for the same isDerivableNoun reason as WORK/ORIGINATION above.
  TRIGGER = 5,
}
