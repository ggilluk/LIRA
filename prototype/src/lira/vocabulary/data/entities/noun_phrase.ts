/** NounPhrase: Phrase's own NOUN_PHRASE-specific subtype -- one of
 * PhraseType's own six grammatical shapes (data/enums/phrase_type.ts's
 * own docstring), narrowing a Phrase by `phraseType` the same way Noun
 * narrows a Word by `partOfSpeech` (this same entities/ directory's own
 * noun.ts). Structure: "(Determiner) + (Modifiers) + Noun/Pronoun +
 * (Complements)" (PHRASE_TYPE_DETAILS[PhraseType.NOUN_PHRASE],
 * data/enums/phrase_type.ts) -- example: "the intelligent system".
 * Distinct from the WordNet-tagged part of speech Phrases.partOfSpeechOf()
 * reports for this Phrase (data/phrases.ts), which still names the lexical
 * category of the phrase's own headword (a NOUN_PHRASE's own head can be
 * a Noun or a Pronoun) -- PhraseType classifies internal *structure*, not
 * the headword's own part of speech (PhraseType's own docstring), so this
 * subtype narrows `phraseType` only, never that WordNet-tagged part of
 * speech.
 *
 * Genuinely seeded today, not "declared before it's populated" the way
 * most POS-subtype-only fields on Word still are: WordSeeder.seedWordNet's
 * own classifyPhraseType() (role/word_seeder.ts) maps every real
 * multi-word WordNet NOUN lemma straight to NOUN_PHRASE with no
 * override -- verified against the bundled dict/ files, ~60,400 unique
 * lemmas, essentially all plain noun compounds ("18-karat gold", "toy
 * poodle"), including the ~50 that happen to share a leading word with
 * classifyPhraseType's own preposition set ("down payment", "near
 * miss") without actually being prepositional in structure (that
 * function's own docstring). Never set for a Common Vocabulary Cache
 * closed-class Phrase, which has no constituency-parsing pass of its
 * own.
 *
 * ModifierRole values valid within a NounPhrase (data/enums/modifier_role.ts),
 * matching the structure above one-for-one -- Determiner, Modifier,
 * Head (the Noun/Pronoun itself), and Complement:
 * - ModifierRole.HEAD
 * - ModifierRole.MODIFIER
 * - ModifierRole.DETERMINER
 * - ModifierRole.COMPLEMENT
 *
 * ModifierRole.PARTICLE is not valid within a NounPhrase -- a particle is
 * a multiword verb's own non-head component (ModifierRole's own
 * docstring), which has no place in a phrase headed by a Noun or
 * Pronoun. Not yet enforced anywhere (no runtime or TypeScript
 * validation mechanism exists for ModifierRole-per-PhraseType today --
 * a later change may add one once constituent/role validation is
 * designed); documented here ahead of that enforcement, the same way
 * ModifierRole.COMPLEMENT itself is named ahead of any seeder that
 * assigns it.
 *
 * `headWord` (data/phrase.ts's own docstring on it) is a graph-reference
 * pointer, not narrowed to any Word subtype here the way `preModifiers`/
 * `postModifiers` below are -- an `Identifier` carries no type of its
 * own to narrow. For a real seeded NounPhrase it always resolves
 * (`Dictionary.findByUuid()`) to a `Noun | Pronoun`: this subtype's own
 * Head Identification Rule never resolves to any other Word subtype
 * (the "ModifierRole values valid within a NounPhrase" note above, HEAD
 * row). Genuinely populated today, for every real seeded multi-word
 * WordNet NounPhrase, by linkPhraseWords() (role/processor/phrase_processor.ts).
 *
 * `preModifiers` narrows Phrase's own same-named field (data/phrase.ts's
 * own docstring on it) down to the exact constituent set
 * data/phrase_type_patterns_and_word_roles.md's own "Phrase Role
 * Allowed Types" table gives NounPhrase's own MODIFIER row: `Adjective
 * | AdjectivePhrase | Noun | NounPhrase | AdverbPhrase |
 * PrepositionalPhrase | Clause`. Same real-population status as
 * `headWord` above, for the single-Word-constituent case only --
 * linkPhraseWords()'s own docstring on why a sub-phrase/Clause modifier
 * is left out rather than guessed at.
 *
 * `postModifiers` narrows Phrase's own same-named field (data/phrase.ts's
 * own docstring on it) down to that exact same constituent set --
 * `preModifiers`' own MODIFIER row makes no pre/post distinction, so
 * NounPhrase's post-Head modifier set is identical to its pre-Head one.
 * Same real-population status as `preModifiers` above. */

import { PhraseType } from "../enums/phrase_type";
import { createPhrase, type Phrase } from "../phrase";
import type { Noun } from "./noun";
import type { Adjective } from "./adjective";
import type { AdjectivePhrase } from "./adjective_phrase";
import type { AdverbPhrase } from "./adverb_phrase";
import type { PrepositionalPhrase } from "../prepositional_phrase";
import type { Clause } from "../../../linguistics/data/clause";

type NounPhraseModifier = Adjective | AdjectivePhrase | Noun | NounPhrase | AdverbPhrase | PrepositionalPhrase | Clause;

export interface NounPhrase extends Phrase {
  phraseType: PhraseType.NOUN_PHRASE;
  preModifiers: readonly NounPhraseModifier[];
  postModifiers: readonly NounPhraseModifier[];
}

export type NounPhraseInit = Pick<Phrase, "text"> &
  Partial<Omit<Phrase, "text" | "phraseType" | "preModifiers" | "postModifiers">> & {
    preModifiers?: readonly NounPhraseModifier[];
    postModifiers?: readonly NounPhraseModifier[];
  };

export function createNounPhrase(init: NounPhraseInit): NounPhrase {
  return createPhrase({ ...init, phraseType: PhraseType.NOUN_PHRASE }) as NounPhrase;
}

export function isNounPhrase(phrase: Phrase): phrase is NounPhrase {
  return phrase.phraseType === PhraseType.NOUN_PHRASE;
}
