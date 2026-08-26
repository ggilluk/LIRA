/** VerbPhrase: Phrase's own VERB_PHRASE-specific subtype -- one of
 * PhraseType's own six grammatical shapes (data/enums/phrase_type.ts's
 * own docstring), narrowing a Phrase by `phraseType` the same way Verb
 * narrows a Word by `partOfSpeech` (this same entities/ directory's own
 * verb.ts). Structure: "(Auxiliary verbs) + Main verb + (Particles) +
 * (Complements) + (Modifiers)" (PHRASE_TYPE_DETAILS[PhraseType.VERB_PHRASE],
 * data/enums/phrase_type.ts) -- example: "has learned the pattern". Distinct
 * from Phrase.partOfSpeech (PhraseType's own docstring on why the two
 * are kept apart), so this subtype narrows `phraseType` only, never
 * `partOfSpeech`.
 *
 * Genuinely seeded today, not "declared before it's populated":
 * WordSeeder.seedWordNet's own classifyPhraseType() (role/word_seeder.ts)
 * maps every real multi-word WordNet VERB lemma straight to VERB_PHRASE
 * with no override -- verified against the bundled dict/ files, ~2,840
 * unique lemmas, overwhelmingly phrasal verbs ("abide by", "account
 * for", "add up") that stay verb-headed regardless of a trailing
 * particle/preposition (that function's own docstring); WordNet's own
 * verb lemmas are never infinitive-marked either (zero "to "-led
 * VERB-tagged lemmas exist in the bundled data), so there's no
 * INFINITIVE_PHRASE ambiguity to resolve here the way ADJECTIVE/ADVERB
 * need. Never set for a Common Vocabulary Cache closed-class Phrase,
 * which has no constituency-parsing pass of its own.
 *
 * `headWord` narrows Phrase's own same-named field (data/phrase.ts's
 * own docstring on it, and on `unresolvedHeadWord`, the graph-reference
 * pointer this is distinct from) down to `Verb` -- VERB_PHRASE's own
 * Head Identification Rule never resolves to any other Word subtype
 * (data/phrase_type_patterns_and_word_roles.md's own "Phrase Role
 * Allowed Types" table, VerbPhrase/HEAD row). A compile-time
 * restriction only: nothing seeds `headWord` yet (Phrase.headWord's own
 * docstring), so this narrowing has no real value to check against
 * today -- it exists so a future caller that does populate it can never
 * assign a Noun/Adjective/Adverb/Preposition there by mistake.
 *
 * `preModifiers` narrows Phrase's own same-named field (data/phrase.ts's
 * own docstring on it) down to the exact constituent set
 * data/phrase_type_patterns_and_word_roles.md's own "Phrase Role
 * Allowed Types" table gives VerbPhrase's own MODIFIER row: `Adverb |
 * AdverbPhrase`. Same compile-time-only status as `headWord` above --
 * nothing seeds this yet either. */

import { PhraseType } from "../enums/phrase_type";
import { createPhrase, type Phrase } from "../phrase";
import type { Verb } from "./verb";
import type { Adverb } from "./adverb";
import type { AdverbPhrase } from "./adverb_phrase";

type VerbPhraseModifier = Adverb | AdverbPhrase;

export interface VerbPhrase extends Phrase {
  phraseType: PhraseType.VERB_PHRASE;
  headWord: Verb;
  preModifiers: readonly VerbPhraseModifier[];
}

export type VerbPhraseInit = Pick<Phrase, "text" | "partOfSpeech"> &
  Partial<Omit<Phrase, "text" | "partOfSpeech" | "phraseType" | "headWord" | "preModifiers">> & {
    headWord?: Verb;
    preModifiers?: readonly VerbPhraseModifier[];
  };

export function createVerbPhrase(init: VerbPhraseInit): VerbPhrase {
  return createPhrase({ ...init, phraseType: PhraseType.VERB_PHRASE }) as VerbPhrase;
}

export function isVerbPhrase(phrase: Phrase): phrase is VerbPhrase {
  return phrase.phraseType === PhraseType.VERB_PHRASE;
}
