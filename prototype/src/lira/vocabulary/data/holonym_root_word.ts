/** Values are numeric codes, the same convention PartOfSpeech/RegisterCode/
 * EditorialLabel already use.
 *
 * The Holonym-Root-Word column of the Interrogative/Hypernym/Holonym/
 * Vector-Primitive root word table -- the whole each row's Hypernym is
 * a part of (an Entity within a System, a Place within a Domain, and
 * so on). Members share InterrogativeRootWord's own numeric values
 * one-for-one -- see that enum's own docstring. No Python equivalent --
 * new to this table, prototype only. */
export enum HolonymRootWord {
  SYSTEM = 0,
  SOCIETY = 1,
  DOMAIN = 2,
  TIMELINE = 3,
  DISCOURSE = 4,
  FRAMEWORK = 5,
}
