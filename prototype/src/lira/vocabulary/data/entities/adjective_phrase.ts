/** AdjectivePhrase: Phrase's own ADJECTIVE_PHRASE-specific subtype --
 * one of PhraseType's own six grammatical shapes
 * (data/enums/phrase_type.ts's own docstring), narrowing a Phrase by
 * `phraseType` the same way Adjective narrows a Word by `partOfSpeech`
 * (this same entities/ directory's own adjective.ts). Structure:
 * "(Degree modifiers) + Adjective + (Complements)"
 * (PHRASE_TYPE_DETAILS[PhraseType.ADJECTIVE_PHRASE],
 * data/enums/phrase_type.ts) -- example: "highly reliable". Distinct
 * from Phrase.partOfSpeech (PhraseType's own docstring on why the two
 * are kept apart), so this subtype narrows `phraseType` only, never
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
 * constituency-parsing pass of its own.
 *
 * `headWord` narrows Phrase's own same-named field (data/phrase.ts's
 * own docstring on it, and on `unresolvedHeadWord`, the graph-reference
 * pointer this is distinct from) down to `Adjective` -- ADJECTIVE_PHRASE's
 * own Head Identification Rule never resolves to any other Word
 * subtype (data/phrase_type_patterns_and_word_roles.md's own "Phrase
 * Role Allowed Types" table, AdjectivePhrase/HEAD row). A compile-time
 * restriction only: nothing seeds `headWord` yet (Phrase.headWord's own
 * docstring), so this narrowing has no real value to check against
 * today -- it exists so a future caller that does populate it can never
 * assign a Noun/Verb/Adverb/Preposition there by mistake.
 *
 * `preModifiers` narrows Phrase's own same-named field (data/phrase.ts's
 * own docstring on it) down to the exact constituent set
 * data/phrase_type_patterns_and_word_roles.md's own "Phrase Role
 * Allowed Types" table gives AdjectivePhrase's own MODIFIER row: `Adverb
 * | AdverbPhrase`. Same compile-time-only status as `headWord` above --
 * nothing seeds this yet either. */

import { PhraseType } from "../enums/phrase_type";
import { createPhrase, type Phrase } from "../phrase";
import type { Adjective } from "./adjective";
import type { Adverb } from "./adverb";
import type { AdverbPhrase } from "./adverb_phrase";

type AdjectivePhraseModifier = Adverb | AdverbPhrase;

export interface AdjectivePhrase extends Phrase {
  phraseType: PhraseType.ADJECTIVE_PHRASE;
  headWord: Adjective;
  preModifiers: readonly AdjectivePhraseModifier[];
}

export type AdjectivePhraseInit = Pick<Phrase, "text" | "partOfSpeech"> &
  Partial<Omit<Phrase, "text" | "partOfSpeech" | "phraseType" | "headWord" | "preModifiers">> & {
    headWord?: Adjective;
    preModifiers?: readonly AdjectivePhraseModifier[];
  };

export function createAdjectivePhrase(init: AdjectivePhraseInit): AdjectivePhrase {
  return createPhrase({ ...init, phraseType: PhraseType.ADJECTIVE_PHRASE }) as AdjectivePhrase;
}

export function isAdjectivePhrase(phrase: Phrase): phrase is AdjectivePhrase {
  return phrase.phraseType === PhraseType.ADJECTIVE_PHRASE;
}
