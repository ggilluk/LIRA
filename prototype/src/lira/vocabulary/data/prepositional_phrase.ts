/** PrepositionalPhrase: Phrase's own PREPOSITIONAL_PHRASE-specific
 * subtype -- one of PhraseType's own six grammatical shapes
 * (enums/phrase_type.ts's own docstring), narrowing a Phrase by
 * `phraseType` the same way Preposition narrows a Word by
 * `partOfSpeech` (data/preposition.ts). Structure: "Preposition + Noun
 * phrase/complement + (Modifiers)"
 * (PHRASE_TYPE_DETAILS[PhraseType.PREPOSITIONAL_PHRASE],
 * enums/phrase_type.ts) -- example: "within the framework". Distinct
 * from the WordNet-tagged part of speech Phrases.partOfSpeechOf() reports
 * for this Phrase (data/phrases.ts), and pointedly so here: WordNet itself
 * never tags a multi-word lemma's own part of speech as PREPOSITION at all --
 * every real PrepositionalPhrase in the bundled data is WordNet-tagged
 * ADJECTIVE or ADVERB instead, because that's the *function* the whole
 * span serves ("at fault" modifies like an adjective, "by hand" like an
 * adverb) even though its own internal *structure* is a preposition
 * leading its complement (PhraseType's own docstring on exactly this
 * function-vs-structure distinction). This subtype narrows `phraseType`
 * only, never that WordNet-tagged part of speech.
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
 * Phrase, which has no constituency-parsing pass of its own.
 *
 * `headWord` (data/entities/phrase.ts's own docstring on it) is a graph-reference
 * pointer, not narrowed to any Word subtype here the way `preModifiers`/
 * `postModifiers` below are -- an `Identifier` carries no type of its
 * own to narrow. For a real seeded PrepositionalPhrase it always
 * resolves (`Dictionary.findByUuid()`) to a `Preposition`:
 * PREPOSITIONAL_PHRASE's own Head Identification Rule never resolves to
 * any other Word subtype (data/phrase_type_patterns_and_word_roles.md's
 * own "Phrase Role Allowed Types" table, PrepositionalPhrase/HEAD row).
 * Genuinely populated today, for every real seeded multi-word WordNet
 * PrepositionalPhrase, by linkPhraseWords()
 * (role/processor/phrase_processor.ts).
 *
 * `preModifiers` narrows Phrase's own same-named field (data/entities/phrase.ts's
 * own docstring on it) down to the exact constituent set
 * data/phrase_type_patterns_and_word_roles.md's own "Phrase Role
 * Allowed Types" table gives PrepositionalPhrase's own MODIFIER row: an
 * `Adverb`-capable token's own WordForm reference, or an `AdverbPhrase`
 * sub-constituent -- `headWord`'s own "an Identifier carries no type to
 * narrow" reasoning, narrowing only the embedded-subtype half of the
 * union. Same real-population status as `headWord` above, for the
 * single-Word-constituent case only -- linkPhraseWords()'s own
 * docstring on why a sub-phrase/Clause modifier is left out rather than
 * guessed at, and on why a WordForm that fails to resolve is too.
 *
 * `postModifiers` narrows Phrase's own same-named field (data/entities/phrase.ts's
 * own docstring on it) down to that exact same constituent set --
 * PrepositionalPhrase's own structure ("Preposition + Noun
 * phrase/complement + (Modifiers)") in fact places its real Modifiers
 * after the Head, so this is the field linkPhraseWords() actually
 * populates in practice for a real PrepositionalPhrase, with
 * `preModifiers` staying available (and populated the same way, should a
 * Modifier ever precede the Head) for the rarer pre-Head case. */

import { PhraseType } from "./enums/phrase_type";
import { createPhrase, type Phrase } from "./entities/phrase";
import type { Identifier } from "../../value_objects";
import type { AdverbPhrase } from "./entities/adverb_phrase";

type PrepositionalPhraseModifier = Identifier | AdverbPhrase;

export interface PrepositionalPhrase extends Phrase {
  phraseType: PhraseType.PREPOSITIONAL_PHRASE;
  preModifiers: readonly PrepositionalPhraseModifier[];
  postModifiers: readonly PrepositionalPhraseModifier[];
}

export type PrepositionalPhraseInit = Pick<Phrase, "text"> &
  Partial<Omit<Phrase, "text" | "phraseType" | "preModifiers" | "postModifiers">> & {
    preModifiers?: readonly PrepositionalPhraseModifier[];
    postModifiers?: readonly PrepositionalPhraseModifier[];
  };

export function createPrepositionalPhrase(init: PrepositionalPhraseInit): PrepositionalPhrase {
  return createPhrase({ ...init, phraseType: PhraseType.PREPOSITIONAL_PHRASE }) as PrepositionalPhrase;
}

export function isPrepositionalPhrase(phrase: Phrase): phrase is PrepositionalPhrase {
  return phrase.phraseType === PhraseType.PREPOSITIONAL_PHRASE;
}
