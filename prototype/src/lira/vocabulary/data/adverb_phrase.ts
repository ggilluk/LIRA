/** AdverbPhrase: Phrase's own ADVERB_PHRASE-specific subtype -- one of
 * PhraseType's own six grammatical shapes (enums/phrase_type.ts's own
 * docstring), narrowing a Phrase by `phraseType` the same way Adverb
 * narrows a Word by `partOfSpeech` (data/adverb.ts). Structure:
 * "(Degree modifiers) + Adverb + (Complements)"
 * (PHRASE_TYPE_DETAILS[PhraseType.ADVERB_PHRASE], enums/phrase_type.ts)
 * -- example: "very quickly". Distinct from Phrase.partOfSpeech
 * (PhraseType's own docstring on why the two are kept apart), so this
 * subtype narrows `phraseType` only, never `partOfSpeech`.
 *
 * Genuinely seeded today, not "declared before it's populated":
 * WordSeeder.seedWordNet's own classifyPhraseType() (role/word_seeder.ts)
 * maps a real multi-word WordNet ADVERB lemma to ADVERB_PHRASE by
 * default -- but the same preposition-opening pattern ADJECTIVE shows
 * (that subtype's own docstring) is more pronounced here: over half of
 * the bundled dict/ files' own ~695 unique ADVERB-tagged multi-word
 * lemmas open with a preposition ("above all", "by hand", "in the
 * meantime"), so classifyPhraseType() checks for PREPOSITIONAL_PHRASE
 * first, and for the "to " + real-verb-lemma INFINITIVE_PHRASE shape
 * before that (every genuine WordNet infinitive -- "to be sure", "to
 * begin with" -- happens to be tagged ADVERB, since there's no
 * "infinitive" ss_type of its own), before falling back to this class
 * for the rest (that function's own docstring, including its own
 * three-entry denylist of "to date"/"to boot"/"to advantage" false
 * positives). Never set for a Common Vocabulary Cache closed-class
 * Phrase, which has no constituency-parsing pass of its own. */

import { PhraseType } from "./enums/phrase_type";
import { createPhrase, type Phrase } from "./phrase";

export interface AdverbPhrase extends Phrase {
  phraseType: PhraseType.ADVERB_PHRASE;
}

export type AdverbPhraseInit = Pick<Phrase, "text" | "partOfSpeech"> & Partial<Omit<Phrase, "text" | "partOfSpeech" | "phraseType">>;

export function createAdverbPhrase(init: AdverbPhraseInit): AdverbPhrase {
  return createPhrase({ ...init, phraseType: PhraseType.ADVERB_PHRASE }) as AdverbPhrase;
}

export function isAdverbPhrase(phrase: Phrase): phrase is AdverbPhrase {
  return phrase.phraseType === PhraseType.ADVERB_PHRASE;
}
