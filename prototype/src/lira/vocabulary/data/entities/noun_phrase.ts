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
 * function's own docstring). A further handful of WordNet-tagged
 * ADJECTIVE/ADVERB lemmas also land here -- genuine Determiner +
 * Noun-quantifier constructions WordNet tags by the idiomatic function
 * they serve rather than their own internal structure ("a bit", "a
 * few", "a lot"), reclassified the same structural-override way
 * classifyDeterminerPhrase() (role/processor/phrase_processor.ts)
 * corrects for. Also genuinely set for a Common Vocabulary Cache
 * closed-class Phrase now, but only a PRONOUN-tagged one --
 * word_seeder.ts's own entryToPhrase() calls the identical
 * classifyPhraseType(), whose own PRONOUN case maps straight to
 * NOUN_PHRASE too (pronouns.json's 17 real multi-word idioms: "each
 * other", "no one", "the former", ...) -- a Pronoun-headed phrase
 * genuinely is structurally a Noun Phrase, this subtype's own
 * "Noun/Pronoun" head shape below. `headWord`/`headWordForm`/
 * `preModifiers`/`postModifiers` are genuinely populated for these too
 * now -- `seedClosedClassWords()`'s own Phrase loop
 * (role/word_seeder.ts) calls linkPhraseWords() there as well, the
 * identical call seedWordNet() already makes for a WordNet-seeded
 * NounPhrase, below. "each other" is the one real exception: neither
 * "each" nor "other" resolves to a Noun or Pronoun Word on its own (both
 * are DETERMINER_LEMMAS entries, role/determiner_seeder.ts), so its own
 * Head Identification Rule genuinely finds no Head token to point at --
 * `headWord`'s own "Undefined whenever no token carries the HEAD role at
 * all" case, not a seeding gap.
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
 * `headWord` (data/entities/phrase.ts's own docstring on it) is a graph-reference
 * pointer, not narrowed to any Word subtype here the way `preModifiers`/
 * `postModifiers` below are -- an `Identifier` carries no type of its
 * own to narrow. For a real seeded NounPhrase it always resolves
 * (`Dictionary.findByUuid()`) to a `Noun | Pronoun`: this subtype's own
 * Head Identification Rule never resolves to any other Word subtype
 * (the "ModifierRole values valid within a NounPhrase" note above, HEAD
 * row). Genuinely populated today, for every real seeded multi-word
 * WordNet NounPhrase and every PRONOUN-tagged Common Vocabulary Cache
 * one alike, by linkPhraseWords() (role/processor/phrase_processor.ts) --
 * `seedWordNet()`'s and `seedClosedClassWords()`'s own call sites,
 * word_seeder.ts.
 *
 * `preModifiers` narrows Phrase's own same-named field (data/entities/phrase.ts's
 * own docstring on it) down to the exact constituent set
 * data/phrase_type_patterns_and_word_roles.md's own "Phrase Role
 * Allowed Types" table gives NounPhrase's own MODIFIER row: an
 * `Adjective | Noun`-capable token's own WordForm reference, or an
 * `AdjectivePhrase | NounPhrase | AdverbPhrase | PrepositionalPhrase |
 * Clause` sub-constituent -- the same "an Identifier carries no type of
 * its own to narrow" reasoning `headWord` above already has, so this
 * narrows the embedded-subtype half of the union only, never the
 * `Identifier` half. Same real-population status as `headWord` above,
 * for the single-Word-constituent case only -- linkPhraseWords()'s own
 * docstring on why a sub-phrase/Clause modifier is left out rather than
 * guessed at, and on why a WordForm that fails to resolve is too.
 *
 * `postModifiers` narrows Phrase's own same-named field (data/entities/phrase.ts's
 * own docstring on it) down to that exact same constituent set --
 * `preModifiers`' own MODIFIER row makes no pre/post distinction, so
 * NounPhrase's post-Head modifier set is identical to its pre-Head one.
 * Same real-population status as `preModifiers` above. */

import { PhraseType } from "../enums/phrase_type";
import { createPhrase, type Phrase } from "./phrase";
import type { Identifier } from "../../../value_objects";
import type { AdjectivePhrase } from "./adjective_phrase";
import type { AdverbPhrase } from "./adverb_phrase";
import type { PrepositionalPhrase } from "../prepositional_phrase";
import type { Clause } from "../../../linguistics/data/clause";

type NounPhraseModifier = Identifier | AdjectivePhrase | NounPhrase | AdverbPhrase | PrepositionalPhrase | Clause;

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
