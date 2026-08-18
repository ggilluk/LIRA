/** Values are numeric codes, the same convention PartOfSpeech/RegisterCode/
 * EditorialLabel already use.
 *
 * The Hypernym-Root-Word column of the Interrogative/Hypernym/Holonym/
 * Vector-Primitive root word table -- the broadest category each
 * interrogative word's answer falls under (what a "what" is asking
 * about, a "who" is asking about, and so on). Members share
 * InterrogativeRootWord's own numeric values one-for-one -- see that
 * enum's own docstring. No Python equivalent -- new to this table,
 * prototype only. */
export enum HypernymRootWord {
  ENTITY = 0,
  PARTY_ROLE = 1,
  PLACE = 2,
  TIME = 3,
  REASON = 4,
  OPERATION = 5,
}
