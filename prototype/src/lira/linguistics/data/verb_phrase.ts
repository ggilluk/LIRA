/** VerbPhrase: this layer's own Phrase (data/phrase.ts) narrowed by
 * `phraseType` -- NounPhrase's own counterpart, one PhraseType over
 * (noun_phrase.ts's own docstring on the pattern, the Vocabulary-vs-
 * Linguistics naming split, and why no constructor lives here). */

import type { Phrase } from "./phrase";
import { PhraseType } from "./phrase_type";

export interface VerbPhrase extends Phrase {
  phraseType: PhraseType.VERB_PHRASE;
}

export function isVerbPhrase(phrase: Phrase): phrase is VerbPhrase {
  return phrase.phraseType === PhraseType.VERB_PHRASE;
}
