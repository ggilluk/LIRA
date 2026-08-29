/** AdverbPhrase: Phrase's own ADVERB_PHRASE-specific subtype -- one of
 * PhraseType's own six grammatical shapes (data/enums/phrase_type.ts's
 * own docstring), narrowing a Phrase by `phraseType` the same way
 * Adverb narrows a Word by `partOfSpeech` (this same entities/
 * directory's own adverb.ts). Structure: "(Degree modifiers) + Adverb +
 * (Complements)" (PHRASE_TYPE_DETAILS[PhraseType.ADVERB_PHRASE],
 * data/enums/phrase_type.ts) -- example: "very quickly". Distinct from
 * the WordNet-tagged part of speech Phrases.partOfSpeechOf() reports for
 * this Phrase (data/phrases.ts) (PhraseType's own docstring on why the
 * two are kept apart), so this subtype narrows `phraseType` only, never
 * that WordNet-tagged part of speech.
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
 * Phrase, which has no constituency-parsing pass of its own.
 *
 * `headWord` narrows Phrase's own same-named field (data/phrase.ts's
 * own docstring on it, and on `unresolvedHeadWord`, the graph-reference
 * pointer this is distinct from) down to `Adverb` -- ADVERB_PHRASE's
 * own Head Identification Rule never resolves to any other Word
 * subtype (data/phrase_type_patterns_and_word_roles.md's own "Phrase
 * Role Allowed Types" table, AdverbPhrase/HEAD row). Genuinely
 * populated today, for every real seeded multi-word WordNet
 * AdverbPhrase, by linkPhraseWords() (role/processor/phrase_processor.ts)
 * resolving `unresolvedHeadWord` via `Dictionary.findByUuid()`; this
 * narrowing exists so that resolution can never assign a Noun/Verb/
 * Adjective/Preposition here by mistake.
 *
 * `preModifiers` narrows Phrase's own same-named field (data/phrase.ts's
 * own docstring on it) down to the exact constituent set
 * data/phrase_type_patterns_and_word_roles.md's own "Phrase Role
 * Allowed Types" table gives AdverbPhrase's own MODIFIER row: `Adverb |
 * AdverbPhrase` -- self-referential, since an AdverbPhrase can itself
 * modify another AdverbPhrase's own Head. Same real-population status
 * as `headWord` above, for the single-Word-constituent case only --
 * linkPhraseWords()'s own docstring on why a sub-phrase modifier is left
 * out rather than guessed at.
 *
 * `postModifiers` narrows Phrase's own same-named field (data/phrase.ts's
 * own docstring on it) down to that exact same self-referential
 * `Adverb | AdverbPhrase` set -- `preModifiers`' own MODIFIER row makes
 * no pre/post distinction, so AdverbPhrase's post-Head modifier set is
 * identical to its pre-Head one. Same real-population status as
 * `preModifiers` above. */

import { PhraseType } from "../enums/phrase_type";
import { createPhrase, type Phrase } from "../phrase";
import type { Adverb } from "./adverb";

type AdverbPhraseModifier = Adverb | AdverbPhrase;

export interface AdverbPhrase extends Phrase {
  phraseType: PhraseType.ADVERB_PHRASE;
  headWord: Adverb;
  preModifiers: readonly AdverbPhraseModifier[];
  postModifiers: readonly AdverbPhraseModifier[];
}

export type AdverbPhraseInit = Pick<Phrase, "text"> &
  Partial<Omit<Phrase, "text" | "phraseType" | "headWord" | "preModifiers" | "postModifiers">> & {
    headWord?: Adverb;
    preModifiers?: readonly AdverbPhraseModifier[];
    postModifiers?: readonly AdverbPhraseModifier[];
  };

export function createAdverbPhrase(init: AdverbPhraseInit): AdverbPhrase {
  return createPhrase({ ...init, phraseType: PhraseType.ADVERB_PHRASE }) as AdverbPhrase;
}

export function isAdverbPhrase(phrase: Phrase): phrase is AdverbPhrase {
  return phrase.phraseType === PhraseType.ADVERB_PHRASE;
}
