/** NounPhrase: Phrase's own NOUN_PHRASE-specific subtype -- one of
 * PhraseType's own six grammatical shapes (data/enums/phrase_type.ts's
 * own docstring), narrowing a Phrase by `phraseType` the same way Noun
 * narrows a Word by `partOfSpeech` (this same entities/ directory's own
 * noun.ts). Structure: "(Determiner) + (Modifiers) + Noun/Pronoun +
 * (Complements)" (PHRASE_TYPE_DETAILS[PhraseType.NOUN_PHRASE],
 * data/enums/phrase_type.ts) -- example: "the intelligent system".
 * Distinct from Phrase.partOfSpeech,
 * which still names the lexical category of the phrase's own headword
 * (a NOUN_PHRASE's own head can be a Noun or a Pronoun) -- PhraseType
 * classifies internal *structure*, not the headword's own part of
 * speech (PhraseType's own docstring), so this subtype narrows
 * `phraseType` only, never `partOfSpeech`.
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
 * PhraseRole values valid within a NounPhrase (data/enums/phrase_role.ts),
 * matching the structure above one-for-one -- Determiner, Modifier,
 * Head (the Noun/Pronoun itself), and Complement:
 * - PhraseRole.HEAD
 * - PhraseRole.MODIFIER
 * - PhraseRole.DETERMINER
 * - PhraseRole.COMPLEMENT
 *
 * PhraseRole.PARTICLE is not valid within a NounPhrase -- a particle is
 * a multiword verb's own non-head component (PhraseRole's own
 * docstring), which has no place in a phrase headed by a Noun or
 * Pronoun. Not yet enforced anywhere (no runtime or TypeScript
 * validation mechanism exists for PhraseRole-per-PhraseType today --
 * a later change may add one once constituent/role validation is
 * designed); documented here ahead of that enforcement, the same way
 * PhraseRole.COMPLEMENT itself is named ahead of any seeder that
 * assigns it.
 *
 * `headWord` narrows Phrase's own same-named field (data/phrase.ts's
 * own docstring on it, and on `unresolvedHeadWord`, the graph-reference
 * pointer this is distinct from) down to `Noun | Pronoun` -- this
 * subtype's own Head Identification Rule never resolves to any other
 * Word subtype (the "PhraseRole values valid within a NounPhrase" note
 * above, HEAD row). A compile-time restriction only: nothing seeds
 * `headWord` yet (Phrase.headWord's own docstring), so this narrowing
 * has no real value to check against today -- it exists so a future
 * caller that does populate it can never assign a Verb/Adjective/
 * Adverb/Preposition there by mistake.
 *
 * `preModifiers` narrows Phrase's own same-named field (data/phrase.ts's
 * own docstring on it) down to the exact constituent set
 * data/phrase_type_patterns_and_word_roles.md's own "Phrase Role
 * Allowed Types" table gives NounPhrase's own MODIFIER row: `Adjective
 * | AdjectivePhrase | Noun | NounPhrase | AdverbPhrase |
 * PrepositionalPhrase | Clause`. Same compile-time-only status as
 * `headWord` above -- nothing seeds this yet either.
 *
 * `postModifiers` narrows Phrase's own same-named field (data/phrase.ts's
 * own docstring on it) down to that exact same constituent set --
 * `preModifiers`' own MODIFIER row makes no pre/post distinction, so
 * NounPhrase's post-Head modifier set is identical to its pre-Head one.
 * Same compile-time-only status as `preModifiers` above. */

import { PhraseType } from "../enums/phrase_type";
import { createPhrase, type Phrase } from "../phrase";
import type { Noun } from "./noun";
import type { Pronoun } from "./pronoun";
import type { Adjective } from "./adjective";
import type { AdjectivePhrase } from "./adjective_phrase";
import type { AdverbPhrase } from "./adverb_phrase";
import type { PrepositionalPhrase } from "../prepositional_phrase";
import type { Clause } from "../../../linguistics/data/clause";

type NounPhraseModifier = Adjective | AdjectivePhrase | Noun | NounPhrase | AdverbPhrase | PrepositionalPhrase | Clause;

export interface NounPhrase extends Phrase {
  phraseType: PhraseType.NOUN_PHRASE;
  headWord: Noun | Pronoun;
  preModifiers: readonly NounPhraseModifier[];
  postModifiers: readonly NounPhraseModifier[];
}

export type NounPhraseInit = Pick<Phrase, "text" | "partOfSpeech"> &
  Partial<Omit<Phrase, "text" | "partOfSpeech" | "phraseType" | "headWord" | "preModifiers" | "postModifiers">> & {
    headWord?: Noun | Pronoun;
    preModifiers?: readonly NounPhraseModifier[];
    postModifiers?: readonly NounPhraseModifier[];
  };

export function createNounPhrase(init: NounPhraseInit): NounPhrase {
  return createPhrase({ ...init, phraseType: PhraseType.NOUN_PHRASE }) as NounPhrase;
}

export function isNounPhrase(phrase: Phrase): phrase is NounPhrase {
  return phrase.phraseType === PhraseType.NOUN_PHRASE;
}
