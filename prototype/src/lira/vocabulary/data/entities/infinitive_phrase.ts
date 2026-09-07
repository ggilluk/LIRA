/** InfinitivePhrase: Phrase's own INFINITIVE_PHRASE-specific subtype --
 * one of PhraseType's own six grammatical shapes (enums/phrase_type.ts's
 * own docstring), narrowing a Phrase by `phraseType` -- unlike its five
 * siblings (NounPhrase, VerbPhrase, AdjectivePhrase, AdverbPhrase,
 * PrepositionalPhrase), this one has no single Word POS subtype it
 * mirrors: an infinitive is its own grammatical shape, not a Word class
 * at all. Structure: "to + Base-form verb + (Complements) +
 * (Modifiers)" (PHRASE_TYPE_DETAILS[PhraseType.INFINITIVE_PHRASE],
 * enums/phrase_type.ts) -- example: "to identify the cause", functioning
 * nominally, adjectivally, or adverbially depending on context.
 * Distinct from the WordNet-tagged part of speech Phrases.partOfSpeechOf()
 * reports for this Phrase (data/phrases.ts), and pointedly so here: WordNet
 * itself has no "infinitive" ss_type of its own at all, so every real
 * InfinitivePhrase in the bundled data is WordNet-tagged ADVERB instead
 * (the closest of its own four open classes to how an infinitive
 * usually functions) -- PhraseType classifies internal *structure*, not
 * the WordNet-assigned functional category, so this subtype narrows
 * `phraseType` only, never that WordNet-tagged part of speech.
 *
 * Genuinely seeded today, not "declared before it's populated":
 * WordSeeder.seedWordNet's own classifyPhraseType() (role/word_seeder.ts)
 * checks for this shape first, ahead of every other PhraseType --
 * lemma's first token is "to", immediately followed by a real WordNet
 * verb lemma (verbLemmas, built from the very same synset list being
 * seeded), minus a verified three-entry denylist ("to date"/"to boot"/
 * "to advantage" -- real WordNet ADVERB-tagged lemmas that read as
 * Preposition + NP instead, PrepositionalPhrase's own case, despite
 * superficially matching the "to" + verb-lemma pattern) -- found by
 * enumerating every "to_"-led multi-word lemma in the bundled
 * dict/data.adv (the only file any occur in) and checking each by hand
 * (that function's own docstring). Never set for a Common Vocabulary
 * Cache closed-class Phrase, which has no constituency-parsing pass of
 * its own. */

import { PhraseType } from "./enums/phrase_type";
import { createPhrase, type Phrase } from "./entities/phrase";

export interface InfinitivePhrase extends Phrase {
  phraseType: PhraseType.INFINITIVE_PHRASE;
}

export type InfinitivePhraseInit = Pick<Phrase, "text"> & Partial<Omit<Phrase, "text" | "phraseType">>;

export function createInfinitivePhrase(init: InfinitivePhraseInit): InfinitivePhrase {
  return createPhrase({ ...init, phraseType: PhraseType.INFINITIVE_PHRASE }) as InfinitivePhrase;
}

export function isInfinitivePhrase(phrase: Phrase): phrase is InfinitivePhrase {
  return phrase.phraseType === PhraseType.INFINITIVE_PHRASE;
}
