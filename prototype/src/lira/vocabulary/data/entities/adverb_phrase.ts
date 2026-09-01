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
 * "infinitive" ss_type of its own), and for the Determiner + Noun-
 * quantifier DETERMINER_PHRASE shape too ("a bit", "a lot", "a little",
 * "a trifle", "a good/great deal", "a hundred/million times" --
 * classifyDeterminerPhrase(), role/processor/phrase_processor.ts --
 * reclassified as NOUN_PHRASE, not this class), before falling back to
 * this class for the rest (that function's own docstring, including its
 * own three-entry denylist of "to date"/"to boot"/"to advantage" false
 * positives). Never set for a Common Vocabulary Cache closed-class
 * Phrase, which has no constituency-parsing pass of its own.
 *
 * `headWord` (data/entities/phrase.ts's own docstring on it) is a graph-reference
 * pointer, not narrowed to any Word subtype here the way `preModifier`/
 * `postModifier` below are -- an `Identifier` carries no type of its
 * own to narrow. For a real seeded AdverbPhrase it always resolves
 * (`Dictionary.findByUuid()`) to an `Adverb`: ADVERB_PHRASE's own Head
 * Identification Rule never resolves to any other Word subtype
 * (data/phrase_type_patterns_and_word_roles.md's own "Phrase Role
 * Allowed Types" table, AdverbPhrase/HEAD row). Genuinely populated
 * today, for every real seeded multi-word WordNet AdverbPhrase, by
 * linkPhraseWords() (role/processor/phrase_processor.ts).
 *
 * `preModifier` narrows Phrase's own same-named field (data/entities/phrase.ts's
 * own docstring on it) down to `AdverbPhraseModifier` below: an
 * `Adverb`-capable token's own WordForm reference for the single-token
 * case, or a self-referential `AdverbPhrase`/`Coordination`
 * sub-constituent for a run of two or more MODIFIER-role tokens (real
 * constituency parsing now, `buildModifierUnit()`'s own docstring,
 * role/processor/phrase_processor.ts) -- an AdverbPhrase can itself
 * modify another AdverbPhrase's own Head -- `headWord`'s own "an
 * Identifier carries no type to narrow" reasoning, narrowing only the
 * embedded-subtype half of the union. A single MODIFIER-role token whose
 * own resolved Word carries no WordForm spelled the way it appears here
 * resolves to `undefined` rather than guessed at.
 *
 * `postModifier` narrows Phrase's own same-named field (data/entities/phrase.ts's
 * own docstring on it) down to that exact same constituent set --
 * `preModifier`'s own MODIFIER row makes no pre/post distinction, so
 * AdverbPhrase's post-Head modifier is resolved the identical way its
 * pre-Head one is. */

import { PhraseType } from "../enums/phrase_type";
import { createPhrase, type Phrase } from "./phrase";
import type { Identifier } from "../../../value_objects";
import type { Coordination } from "./coordination";
import type { Word } from "./word";

type AdverbPhraseModifier = Identifier | AdverbPhrase | Coordination<Word | Phrase>;

export interface AdverbPhrase extends Phrase {
  phraseType: PhraseType.ADVERB_PHRASE;
  preModifier?: AdverbPhraseModifier;
  postModifier?: AdverbPhraseModifier;
}

export type AdverbPhraseInit = Pick<Phrase, "text"> &
  Partial<Omit<Phrase, "text" | "phraseType" | "preModifier" | "postModifier">> & {
    preModifier?: AdverbPhraseModifier;
    postModifier?: AdverbPhraseModifier;
  };

export function createAdverbPhrase(init: AdverbPhraseInit): AdverbPhrase {
  return createPhrase({ ...init, phraseType: PhraseType.ADVERB_PHRASE }) as AdverbPhrase;
}

export function isAdverbPhrase(phrase: Phrase): phrase is AdverbPhrase {
  return phrase.phraseType === PhraseType.ADVERB_PHRASE;
}
