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
 * pointer, not narrowed to any Word subtype here the way `preModifier`/
 * `postModifier` below are -- an `Identifier` carries no type of its
 * own to narrow. For a real seeded AdjectivePhrase it always resolves
 * (`Dictionary.findByUuid()`) to an `Adjective`: ADJECTIVE_PHRASE's own
 * Head Identification Rule never resolves to any other Word subtype
 * (data/phrase_type_patterns_and_word_roles.md's own "Phrase Role
 * Allowed Types" table, AdjectivePhrase/HEAD row). Genuinely populated
 * today, for every real seeded multi-word WordNet AdjectivePhrase, by
 * linkPhraseWords() (role/processor/phrase_processor.ts).
 *
 * `preModifier` narrows Phrase's own same-named field (data/entities/phrase.ts's
 * own docstring on it) down to `AdjectivePhraseModifier` above: an
 * `Adverb`- or `Adjective`-capable token's own WordForm reference for
 * the single-token case, or an `AdverbPhrase`/`AdjectivePhrase`/
 * `Coordination` sub-constituent for a run of two or more MODIFIER-role
 * tokens (real constituency parsing now, `buildModifierUnit()`'s own
 * docstring, role/processor/phrase_processor.ts) -- `headWord`'s own "an
 * Identifier carries no type to narrow" reasoning, narrowing only the
 * embedded-subtype half of the union. A single MODIFIER-role token whose
 * own resolved Word carries no WordForm spelled the way it appears here
 * resolves to `undefined` rather than guessed at.
 *
 * `postModifier` narrows Phrase's own same-named field (data/entities/phrase.ts's
 * own docstring on it) down to that exact same constituent set --
 * `preModifier`'s own MODIFIER row makes no pre/post distinction, so
 * AdjectivePhrase's post-Head modifier is resolved the identical way its
 * pre-Head one is.
 *
 * `complements` narrows Phrase's own same-named field (data/entities/phrase.ts's
 * own docstring on it) down to AdjectivePhraseComplement below --
 * `PHRASE_TYPE_DETAILS[PhraseType.ADJECTIVE_PHRASE].allowedTypes`'s own
 * COMPLEMENT row, `["PrepositionalPhrase", "Clause"]`. Genuinely
 * populated by `linkPhraseWords()` the same structural way NounPhrase's
 * own `complements` is (data/entities/noun_phrase.ts's own docstring on
 * it): a token immediately after the Head capable of reading as a
 * Preposition starts this AdjectivePhrase's own complement, running to
 * the end of `text`, built as one nested PrepositionalPhrase -- e.g. a
 * genuine "(Degree modifiers) + Adjective + (Complements)" case like
 * "responsible for the outcome" ("for the outcome" nested). Empty
 * whenever no such token exists (most real seeded AdjectivePhrases:
 * "highly reliable" has none). A `Clause` complement is never
 * constructed -- `classifyComplementPhraseType()`'s own docstring,
 * role/processor/phrase_processor.ts. */

import { PhraseType } from "../enums/phrase_type";
import { createPhrase, type Phrase } from "./phrase";
import type { Identifier } from "../../../value_objects";
import type { AdverbPhrase } from "./adverb_phrase";
import type { PrepositionalPhrase } from "./prepositional_phrase";
import type { Coordination } from "./coordination";
import type { Word } from "./word";
import type { Clause } from "../../../linguistics/data/clause";

// Adjective is included alongside AdverbPhrase's own documented MODIFIER
// row (`PHRASE_TYPE_DETAILS[PhraseType.ADJECTIVE_PHRASE].allowedTypes`,
// data/enums/phrase_type.ts, lists only Adverb/AdverbPhrase) -- a pre-
// existing gap between that table and `nonHeadModifierRole()`'s own real
// ADJECTIVE_PHRASE branch (role/processor/phrase_processor.ts), which
// always treated an ADJECTIVE-capable pre-Head token as a genuine
// Modifier too ("bone dry", degree-modifier-less compounding). Harmless
// before this field could ever hold an embedded sub-Phrase; corrected
// here since `buildModifierUnit()` can now genuinely build a nested
// AdjectivePhrase for a run of 2+ such tokens.
type AdjectivePhraseModifier = Identifier | AdjectivePhrase | AdverbPhrase | Coordination<Word | Phrase>;

/** AdjectivePhrase's own COMPLEMENT allowed-types row -- `noun_phrase.ts`'s
 * own `NounPhraseComplement` counterpart, identical shape. */
type AdjectivePhraseComplement = Identifier | PrepositionalPhrase | Clause;

export interface AdjectivePhrase extends Phrase {
  phraseType: PhraseType.ADJECTIVE_PHRASE;
  preModifier?: AdjectivePhraseModifier;
  postModifier?: AdjectivePhraseModifier;
  complements: readonly AdjectivePhraseComplement[];
}

export type AdjectivePhraseInit = Pick<Phrase, "text"> &
  Partial<Omit<Phrase, "text" | "phraseType" | "preModifier" | "postModifier" | "complements">> & {
    preModifier?: AdjectivePhraseModifier;
    postModifier?: AdjectivePhraseModifier;
    complements?: readonly AdjectivePhraseComplement[];
  };

export function createAdjectivePhrase(init: AdjectivePhraseInit): AdjectivePhrase {
  return createPhrase({ ...init, phraseType: PhraseType.ADJECTIVE_PHRASE }) as AdjectivePhrase;
}

export function isAdjectivePhrase(phrase: Phrase): phrase is AdjectivePhrase {
  return phrase.phraseType === PhraseType.ADJECTIVE_PHRASE;
}
