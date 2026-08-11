/** Describes one raw token occurrence being resolved against the
 * Dictionary -- surface form, casing, and surrounding-token evidence.
 * Deliberately separate from Word: this is occurrence metadata about a
 * single appearance of a lexical form in a document, not an attribute
 * of the lexical form itself. A WordLookupContext never becomes part
 * of an authoritative Word; it exists only to rank candidate senses
 * for this one occurrence (PartOfSpeechIdentifier,
 * ExternalDictionaryAdapter).
 *
 * Ported from vocabulary/data/word_lookup_context.py. */
export interface WordLookupContext {
  rawText: string;
  normalisedText: string;
  domainName: string;

  sentenceIndex: number;
  tokenIndex: number;
  isSentenceStart: boolean;

  precedingWords: readonly string[];
  followingWords: readonly string[];
}

export function createWordLookupContext(
  init: Pick<WordLookupContext, "rawText" | "normalisedText" | "domainName"> & Partial<WordLookupContext>,
): WordLookupContext {
  return {
    sentenceIndex: 0,
    tokenIndex: 0,
    isSentenceStart: false,
    precedingWords: [],
    followingWords: [],
    ...init,
  };
}

export function isTitleCase(context: WordLookupContext): boolean {
  const raw = context.rawText;
  return raw.length > 0 && raw[0] === raw[0].toUpperCase() && raw[0] !== raw[0].toLowerCase()
    && raw.slice(1) === raw.slice(1).toLowerCase();
}

export function isUpperCase(context: WordLookupContext): boolean {
  const letters = [...context.rawText].filter((ch) => /\p{L}/u.test(ch)).join("");
  return letters.length > 0 && letters === letters.toUpperCase() && letters !== letters.toLowerCase();
}

export function containsHyphen(context: WordLookupContext): boolean {
  return context.rawText.includes("-");
}

export function containsDigit(context: WordLookupContext): boolean {
  return /\d/.test(context.rawText);
}
