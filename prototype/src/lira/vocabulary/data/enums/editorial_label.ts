/** Values are numeric codes for use in a tensor, not string labels --
 * same convention as PartOfSpeech and LinguisticUnitKind.
 *
 * Matches the Vocabulary Layer developer specification, 6.6. Ported
 * from vocabulary/data/editorial_label.py. */
export enum EditorialLabel {
  ARCHAIC = 0,
  OBSOLETE = 1,
  RARE = 2,
  HISTORICAL = 3,
  OFFENSIVE = 4,
  DEPRECATED = 5,
  REGIONAL = 6,
  NONSTANDARD = 7,
}
