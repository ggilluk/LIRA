/** PrepositionalPhrase: Phrase's own PREPOSITIONAL_PHRASE-specific
 * subtype -- one of PhraseType's own six grammatical shapes
 * (enums/phrase_type.ts's own docstring), narrowing a Phrase by
 * `phraseType` the same way Preposition narrows a Word by
 * `partOfSpeech` (data/preposition.ts). Structure: "Preposition + Noun
 * phrase/complement + (Modifiers)"
 * (PHRASE_TYPE_DETAILS[PhraseType.PREPOSITIONAL_PHRASE],
 * enums/phrase_type.ts) -- example: "within the framework". Distinct
 * from Phrase.partOfSpeech, and pointedly so here: WordNet itself never
 * tags a multi-word lemma's own `partOfSpeech` as PREPOSITION at all --
 * every real PrepositionalPhrase in the bundled data is WordNet-tagged
 * ADJECTIVE or ADVERB instead, because that's the *function* the whole
 * span serves ("at fault" modifies like an adjective, "by hand" like an
 * adverb) even though its own internal *structure* is a preposition
 * leading its complement (PhraseType's own docstring on exactly this
 * function-vs-structure distinction). This subtype narrows `phraseType`
 * only, never `partOfSpeech`.
 *
 * Genuinely seeded today, not "declared before it's populated":
 * WordSeeder.seedWordNet's own classifyPhraseType() (role/word_seeder.ts)
 * checks whether an ADJECTIVE- or ADVERB-tagged multi-word lemma's own
 * first token is one of a verified closed set of ~80 real English
 * prepositions (PHRASE_TYPE_PREPOSITIONS, role/word_seeder.ts) before
 * falling through to ADJECTIVE_PHRASE/ADVERB_PHRASE's own default --
 * about a quarter of ADJECTIVE's own multi-word lemmas and over half of
 * ADVERB's own qualify this way (those two subtypes' own docstrings).
 * Deliberately never checked for NOUN (compound nouns sharing a leading
 * word with the preposition set, like "down payment"/"near miss", are
 * modifier + head nouns, not prepositional in structure -- verified
 * against the bundled dict/data.noun, not guessed, classifyPhraseType's
 * own docstring). Never set for a Common Vocabulary Cache closed-class
 * Phrase, which has no constituency-parsing pass of its own. */

import { PhraseType } from "./enums/phrase_type";
import { createPhrase, type Phrase } from "./phrase";

export interface PrepositionalPhrase extends Phrase {
  phraseType: PhraseType.PREPOSITIONAL_PHRASE;
}

export type PrepositionalPhraseInit = Pick<Phrase, "text" | "partOfSpeech"> & Partial<Omit<Phrase, "text" | "partOfSpeech" | "phraseType">>;

export function createPrepositionalPhrase(init: PrepositionalPhraseInit): PrepositionalPhrase {
  return createPhrase({ ...init, phraseType: PhraseType.PREPOSITIONAL_PHRASE }) as PrepositionalPhrase;
}

export function isPrepositionalPhrase(phrase: Phrase): phrase is PrepositionalPhrase {
  return phrase.phraseType === PhraseType.PREPOSITIONAL_PHRASE;
}
