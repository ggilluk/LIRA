/** Values are the numeric codes this kind is stored as in
 * LinguisticSystemPropertyTensor (Rule 14) -- the numeric value is used
 * directly as the tensor cell, not just a label.
 *
 * Word and Punctuation are both Vocabulary's Word class at the type
 * level (a punctuation mark is a Word with partOfSpeech=PUNCTUATION,
 * not a separate class) -- GraphProcessor.materialiseToken still tags a
 * token's tensor row with the Punctuation kind rather than Word when
 * that's the case, derived from partOfSpeech instead of an instanceof
 * check.
 *
 * Ported from linguistics/data/linguistic_unit_kind.py. */
export enum LinguisticUnitKind {
  Word = 0,
  Punctuation = 1,
  Clause = 2,
  Sentence = 3,
  Paragraph = 4,
  Subject = 5,
  UserPrompt = 6,
  // Appended, not inserted -- 0-6 above are already live tensor cell
  // codes in any LinguisticSystemPropertyTensor built before this value
  // existed; renumbering them would silently corrupt previously-
  // allocated rows' kindOf() reads.
  Phrase = 7,
}
