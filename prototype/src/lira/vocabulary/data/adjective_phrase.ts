/** AdjectivePhrase: Phrase's own ADJECTIVE_PHRASE-specific subtype --
 * one of PhraseType's own six grammatical shapes (enums/phrase_type.ts's
 * own docstring), narrowing a Phrase by `phraseType` the same way
 * Adjective narrows a Word by `partOfSpeech` (data/entities/adjective.ts).
 * Structure: "(Degree modifiers) + Adjective + (Complements)"
 * (PHRASE_TYPE_DETAILS[PhraseType.ADJECTIVE_PHRASE],
 * enums/phrase_type.ts) -- example: "highly reliable". Distinct from
 * Phrase.partOfSpeech (PhraseType's own docstring on why the two are
 * kept apart), so this subtype narrows `phraseType` only, never
 * `partOfSpeech`.
 *
 * Genuinely seeded today, not "declared before it's populated":
 * WordSeeder.seedWordNet's own classifyPhraseType() (role/word_seeder.ts)
 * maps a real multi-word WordNet ADJECTIVE lemma to ADJECTIVE_PHRASE by
 * default -- but about a quarter of the bundled dict/ files' own ~510
 * unique ADJECTIVE-tagged multi-word lemmas open with a preposition
 * ("at fault", "in advance", "out of print"): WordNet tags these
 * ADJECTIVE because that's the function they serve, but their internal
 * structure is Preposition + NP, so classifyPhraseType() checks for
 * that PREPOSITIONAL_PHRASE shape first and only falls back to this
 * class for the rest (that function's own docstring). Never set for a
 * Common Vocabulary Cache closed-class Phrase, which has no
 * constituency-parsing pass of its own. */

import { PhraseType } from "./enums/phrase_type";
import { createPhrase, type Phrase } from "./phrase";

export interface AdjectivePhrase extends Phrase {
  phraseType: PhraseType.ADJECTIVE_PHRASE;
}

export type AdjectivePhraseInit = Pick<Phrase, "text" | "partOfSpeech"> & Partial<Omit<Phrase, "text" | "partOfSpeech" | "phraseType">>;

export function createAdjectivePhrase(init: AdjectivePhraseInit): AdjectivePhrase {
  return createPhrase({ ...init, phraseType: PhraseType.ADJECTIVE_PHRASE }) as AdjectivePhrase;
}

export function isAdjectivePhrase(phrase: Phrase): phrase is AdjectivePhrase {
  return phrase.phraseType === PhraseType.ADJECTIVE_PHRASE;
}
