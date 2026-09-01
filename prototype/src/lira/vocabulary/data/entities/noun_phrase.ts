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
 * `preModifier`/`postModifier` are genuinely populated for these too
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
 * designed); documented here ahead of that enforcement.
 *
 * ModifierRole.COMPLEMENT is genuinely assigned now, not just declared
 * ahead of a seeder (`complements`' own docstring below,
 * role/processor/phrase_processor.ts's own `classifyModifierRoles()`/
 * `complementStartIndex()`) -- "abatement of a nuisance" (00362285-n,
 * dict/data.noun) was the reported case that surfaced the gap: a
 * post-Head "Preposition + complement" span like "of a nuisance" used
 * to be silently dropped entirely (no role, no field, nowhere), rather
 * than becoming the genuine PrepositionalPhrase constituent this
 * subtype's own structure ("(Determiner) + (Modifiers) + Noun/Pronoun +
 * (Complements)" above) always said it could be.
 *
 * `headWord` (data/entities/phrase.ts's own docstring on it) is a graph-reference
 * pointer, not narrowed to any Word subtype here the way `preModifier`/
 * `postModifier` below are -- an `Identifier` carries no type of its
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
 * `preModifier` narrows Phrase's own same-named field (data/entities/phrase.ts's
 * own docstring on it) down to the exact constituent set
 * data/phrase_type_patterns_and_word_roles.md's own "Phrase Role
 * Allowed Types" table gives NounPhrase's own MODIFIER row: an
 * `Adjective | Noun`-capable token's own WordForm reference for the
 * single-token case, or an `AdjectivePhrase | NounPhrase | AdverbPhrase |
 * PrepositionalPhrase | Coordination | Clause` sub-constituent for a run
 * of two or more MODIFIER-role tokens (real constituency parsing now,
 * `buildModifierUnit()`'s own docstring, role/processor/phrase_processor.ts)
 * -- the same "an Identifier carries no type of its own to narrow"
 * reasoning `headWord` above already has, so this narrows the embedded-
 * subtype half of the union only, never the `Identifier` half. A single
 * MODIFIER-role token whose own resolved Word carries no WordForm
 * spelled the way it appears here resolves to `undefined` rather than
 * guessed at.
 *
 * `postModifier` narrows Phrase's own same-named field (data/entities/phrase.ts's
 * own docstring on it) down to that exact same constituent set --
 * `preModifier`'s own MODIFIER row makes no pre/post distinction, so
 * NounPhrase's post-Head modifier is resolved the identical way its
 * pre-Head one is.
 *
 * `complements` narrows Phrase's own same-named field (data/entities/phrase.ts's
 * own docstring on it) down to NounPhraseComplement above. Genuinely
 * populated by `linkPhraseWords()` for the real case this subtype's own
 * structure comment already named: a token immediately after the Head
 * capable of reading as a Preposition starts this NounPhrase's own
 * complement, running to the end of `text` -- built as one nested
 * PrepositionalPhrase ("abatement of [a nuisance]"; "toy poodle" has no
 * such token at all, so its own `complements` stays empty, same as
 * `preModifier`/`postModifier` staying `undefined` whenever no matching
 * token exists).
 * A `Clause` complement is never constructed -- this codebase performs
 * no clause-level parsing within a Phrase's own text at all, only the
 * PrepositionalPhrase case `classifyComplementPhraseType()`'s own
 * docstring covers (role/processor/phrase_processor.ts). */

import { PhraseType } from "../enums/phrase_type";
import { createPhrase, type Phrase } from "./phrase";
import type { Identifier } from "../../../value_objects";
import type { AdjectivePhrase } from "./adjective_phrase";
import type { AdverbPhrase } from "./adverb_phrase";
import type { PrepositionalPhrase } from "./prepositional_phrase";
import type { Coordination } from "./coordination";
import type { Word } from "./word";
import type { Clause } from "../../../linguistics/data/clause";

type NounPhraseModifier = Identifier | AdjectivePhrase | NounPhrase | AdverbPhrase | PrepositionalPhrase | Coordination<Word | Phrase> | Clause;

/** NounPhrase's own COMPLEMENT allowed-types row
 * (`PHRASE_TYPE_DETAILS[PhraseType.NOUN_PHRASE].allowedTypes`,
 * data/enums/phrase_type.ts): `["PrepositionalPhrase", "Clause"]`. */
type NounPhraseComplement = Identifier | PrepositionalPhrase | Clause;

export interface NounPhrase extends Phrase {
  phraseType: PhraseType.NOUN_PHRASE;
  preModifier?: NounPhraseModifier;
  postModifier?: NounPhraseModifier;
  complements: readonly NounPhraseComplement[];
}

export type NounPhraseInit = Pick<Phrase, "text"> &
  Partial<Omit<Phrase, "text" | "phraseType" | "preModifier" | "postModifier" | "complements">> & {
    preModifier?: NounPhraseModifier;
    postModifier?: NounPhraseModifier;
    complements?: readonly NounPhraseComplement[];
  };

export function createNounPhrase(init: NounPhraseInit): NounPhrase {
  return createPhrase({ ...init, phraseType: PhraseType.NOUN_PHRASE }) as NounPhrase;
}

export function isNounPhrase(phrase: Phrase): phrase is NounPhrase {
  return phrase.phraseType === PhraseType.NOUN_PHRASE;
}
