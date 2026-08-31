/** AdjectivePhrase: Phrase's own ADJECTIVE_PHRASE-specific subtype --
 * one of PhraseType's own six grammatical shapes
 * (data/enums/phrase_type.ts's own docstring), narrowing a Phrase by
 * `phraseType` the same way Adjective narrows a Word by `partOfSpeech`
 * (this same entities/ directory's own adjective.ts). Structure:
 * "(Degree modifiers) + Adjective + (Complements)"
 * (PHRASE_TYPE_DETAILS[PhraseType.ADJECTIVE_PHRASE],
 * data/enums/phrase_type.ts) -- example: "highly reliable". Distinct
 * from the WordNet-tagged part of speech Phrases.partOfSpeechOf() reports
 * for this Phrase (data/phrases.ts) (PhraseType's own docstring on why
 * the two are kept apart), so this subtype narrows `phraseType` only,
 * never that WordNet-tagged part of speech.
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
 * class for the rest (that function's own docstring). A couple more
 * ("a few", "a couple of") are Determiner + Noun-quantifier
 * constructions instead, checked the same structural way
 * (classifyDeterminerPhrase(), role/processor/phrase_processor.ts) and
 * reclassified as NOUN_PHRASE, not this class. Never set for a Common
 * Vocabulary Cache closed-class Phrase, which has no constituency-parsing
 * pass of its own.
 *
 * `headWord` (data/entities/phrase.ts's own docstring on it) is a graph-reference
 * pointer, not narrowed to any Word subtype here the way `preModifiers`/
 * `postModifiers` below are -- an `Identifier` carries no type of its
 * own to narrow. For a real seeded AdjectivePhrase it always resolves
 * (`Dictionary.findByUuid()`) to an `Adjective`: ADJECTIVE_PHRASE's own
 * Head Identification Rule never resolves to any other Word subtype
 * (data/phrase_type_patterns_and_word_roles.md's own "Phrase Role
 * Allowed Types" table, AdjectivePhrase/HEAD row). Genuinely populated
 * today, for every real seeded multi-word WordNet AdjectivePhrase, by
 * linkPhraseWords() (role/processor/phrase_processor.ts).
 *
 * `preModifiers` narrows Phrase's own same-named field (data/entities/phrase.ts's
 * own docstring on it) down to the exact constituent set
 * data/phrase_type_patterns_and_word_roles.md's own "Phrase Role
 * Allowed Types" table gives AdjectivePhrase's own MODIFIER row: an
 * `Adverb`-capable token's own WordForm reference, or an `AdverbPhrase`
 * sub-constituent -- `headWord`'s own "an Identifier carries no type to
 * narrow" reasoning, narrowing only the embedded-subtype half of the
 * union. Same real-population status as `headWord` above, for the
 * single-Word-constituent case only -- linkPhraseWords()'s own
 * docstring on why a sub-phrase modifier is left out rather than
 * guessed at, and on why a WordForm that fails to resolve is too.
 *
 * `postModifiers` narrows Phrase's own same-named field (data/entities/phrase.ts's
 * own docstring on it) down to that exact same constituent set --
 * `preModifiers`' own MODIFIER row makes no pre/post distinction, so
 * AdjectivePhrase's post-Head modifier set is identical to its pre-Head
 * one. Same real-population status as `preModifiers` above. */

import { PhraseType } from "../enums/phrase_type";
import { createPhrase, type Phrase } from "./phrase";
import type { Identifier } from "../../../value_objects";
import type { AdverbPhrase } from "./adverb_phrase";

type AdjectivePhraseModifier = Identifier | AdverbPhrase;

export interface AdjectivePhrase extends Phrase {
  phraseType: PhraseType.ADJECTIVE_PHRASE;
  preModifiers: readonly AdjectivePhraseModifier[];
  postModifiers: readonly AdjectivePhraseModifier[];
}

export type AdjectivePhraseInit = Pick<Phrase, "text"> &
  Partial<Omit<Phrase, "text" | "phraseType" | "preModifiers" | "postModifiers">> & {
    preModifiers?: readonly AdjectivePhraseModifier[];
    postModifiers?: readonly AdjectivePhraseModifier[];
  };

export function createAdjectivePhrase(init: AdjectivePhraseInit): AdjectivePhrase {
  return createPhrase({ ...init, phraseType: PhraseType.ADJECTIVE_PHRASE }) as AdjectivePhrase;
}

export function isAdjectivePhrase(phrase: Phrase): phrase is AdjectivePhrase {
  return phrase.phraseType === PhraseType.ADJECTIVE_PHRASE;
}
