/** Values are numeric codes for use in a tensor, not string labels --
 * same convention as LinguisticUnitKind. Lives in Vocabulary, not
 * Linguistics: classifying a word's part of speech is a lexical
 * attribute of that word (Rule 17), same as its meaning.
 *
 * Matches the Vocabulary Layer developer specification, 6.1. Ported
 * from vocabulary/data/part_of_speech.py. */
export enum PartOfSpeech {
  NOUN = 0,
  VERB = 1,
  ADJECTIVE = 2,
  ADVERB = 3,
  PRONOUN = 4,
  DETERMINER = 5,
  PREPOSITION = 6,
  CONJUNCTION = 7,
  INTERJECTION = 8,
  NUMERAL = 9,
  PARTICLE = 10,
  AUXILIARY = 11,
  PROPER_NOUN = 12,
  SYMBOL = 13,
  PUNCTUATION = 14,
  OTHER = 15,
}
