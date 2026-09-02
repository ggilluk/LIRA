/** PrepositionalPhrase: this layer's own Phrase (data/phrase.ts)
 * narrowed by `phraseType` -- NounPhrase's own counterpart, one
 * PhraseType over (noun_phrase.ts's own docstring on the pattern, the
 * Vocabulary-vs-Linguistics naming split, and why no constructor lives
 * here). */

import type { Phrase } from "./phrase";
import { PhraseType } from "./phrase_type";

export interface PrepositionalPhrase extends Phrase {
  phraseType: PhraseType.PREPOSITIONAL_PHRASE;
}

export function isPrepositionalPhrase(phrase: Phrase): phrase is PrepositionalPhrase {
  return phrase.phraseType === PhraseType.PREPOSITIONAL_PHRASE;
}
