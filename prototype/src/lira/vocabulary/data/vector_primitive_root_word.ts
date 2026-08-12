/** Values are numeric codes, the same convention PartOfSpeech/RegisterCode/
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
  ORIGIN = 2,
  INSTANCE = 3,
  CAUSE = 4,
  MECHANISM = 5,
}
