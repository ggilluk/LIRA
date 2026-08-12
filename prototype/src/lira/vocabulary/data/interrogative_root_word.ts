/** Values are numeric codes, the same convention PartOfSpeech/RegisterCode/
 * EditorialLabel already use.
 *
 * The six English interrogatives ("wh-" words plus "how"), each the
 * root of one row in the Interrogative/Hypernym/Holonym/Vector-Primitive
 * root word table -- see HypernymRootWord/HolonymRootWord/
 * VectorPrimitiveRootWord's own docstrings, and note their members share
 * this enum's own numeric values one-for-one: `HypernymRootWord.ENTITY
 * === InterrogativeRootWord.WHAT`, and so on down the table, so a caller
 * holding one root word can look up its counterpart in another column
 * by ordinal alone. No Python equivalent -- new to this table,
 * prototype only. */
export enum InterrogativeRootWord {
  WHAT = 0,
  WHO = 1,
  WHERE = 2,
  WHEN = 3,
  WHY = 4,
  HOW = 5,
}
