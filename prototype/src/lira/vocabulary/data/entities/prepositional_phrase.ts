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
 * pointer, not narrowed to any Word subtype here the way `preModifier`/
 * `postModifier` below are -- an `Identifier` carries no type of its
 * own to narrow. For a real seeded PrepositionalPhrase it always
 * resolves (`Dictionary.findByUuid()`) to a `Preposition`:
 * PREPOSITIONAL_PHRASE's own Head Identification Rule never resolves to
 * any other Word subtype (data/phrase_type_patterns_and_word_roles.md's
 * own "Phrase Role Allowed Types" table, PrepositionalPhrase/HEAD row).
 * Genuinely populated today, for every real seeded multi-word WordNet
 * PrepositionalPhrase, by linkPhraseWords()
 * (role/processor/phrase_processor.ts).
 *
 * `preModifier` narrows Phrase's own same-named field (data/entities/phrase.ts's
 * own docstring on it) down to `PrepositionalPhraseModifier` below: an
 * `Adverb`-capable token's own WordForm reference for the single-token
 * case, or an `AdverbPhrase`/`Coordination` sub-constituent for a run of
 * two or more MODIFIER-role tokens (real constituency parsing now,
 * `buildModifierUnit()`'s own docstring, role/processor/phrase_processor.ts)
 * -- `headWord`'s own "an Identifier carries no type to narrow"
 * reasoning, narrowing only the embedded-subtype half of the union. A
 * single MODIFIER-role token whose own resolved Word carries no
 * WordForm spelled the way it appears here resolves to `undefined`
 * rather than guessed at.
 *
 * `postModifier` narrows Phrase's own same-named field (data/entities/phrase.ts's
 * own docstring on it) down to that exact same constituent set --
 * PrepositionalPhrase's own structure ("Preposition + Noun
 * phrase/complement + (Modifiers)") in fact places its real Modifiers
 * after the Head, so this is the field linkPhraseWords() actually
 * populates in practice for a real PrepositionalPhrase, with
 * `preModifier` staying available (and populated the same way, should a
 * Modifier ever precede the Head) for the rarer pre-Head case.
 *
 * `complements` narrows Phrase's own same-named field (data/entities/phrase.ts's
 * own docstring on it) down to PrepositionalPhraseComplement above.
 * Genuinely the field `linkPhraseWords()` populates for *every* real
 * multi-word PrepositionalPhrase that has more than one token:
 * PREPOSITIONAL_PHRASE's own structure places its whole complement
 * immediately after the Head ("within [the framework]", "out of
 * [print]"), so `linkPhraseWords()` treats everything from `headWord`'s
 * own position onward as one embedded sub-Phrase -- a nested
 * PrepositionalPhrase when that span itself opens with another
 * Preposition-capable token ("out of [of print]" -> "print" nested one
 * PrepositionalPhrase deeper still), a NounPhrase otherwise (the
 * overwhelmingly common real case, `classifyComplementPhraseType()`'s
 * own docstring, role/processor/phrase_processor.ts) -- never a bare
 * `Identifier`, a `Pronoun`/`Adverb`/`AdverbPhrase`/`Clause` complement,
 * or empty, for a genuine multi-word PrepositionalPhrase today: only
 * those two branches of PrepositionalPhraseComplement are ever actually
 * constructed. A single-token PrepositionalPhrase built directly
 * (`createPrepositionalPhrase()`, never through `seedWordNet()`, which
 * never seeds a one-word Phrase at all) stays empty, the same "nothing
 * to link" case every other `linkPhraseWords()`-populated field already
 * has. */

import { PhraseType } from "../enums/phrase_type";
import { createPhrase, type Phrase } from "./phrase";
import type { Identifier } from "../../../value_objects";
import type { AdverbPhrase } from "./adverb_phrase";
import type { NounPhrase } from "./noun_phrase";
import type { Coordination } from "./coordination";
import type { Word } from "./word";
import type { Clause } from "../../../linguistics/data/clause";

type PrepositionalPhraseModifier = Identifier | AdverbPhrase | Coordination<Word | Phrase>;

/** PrepositionalPhrase's own COMPLEMENT allowed-types row
 * (`PHRASE_TYPE_DETAILS[PhraseType.PREPOSITIONAL_PHRASE].allowedTypes`,
 * data/enums/phrase_type.ts): `["NounPhrase", "Pronoun", "Adverb",
 * "AdverbPhrase", "PrepositionalPhrase", "Clause"]` -- the bare
 * `Pronoun`/`Adverb` Word-subtype entries fold into the generic
 * `Identifier` branch here, `preModifier`'s own identical "an
 * Identifier carries no type of its own to narrow" reasoning below. */
type PrepositionalPhraseComplement = Identifier | NounPhrase | AdverbPhrase | PrepositionalPhrase | Clause;

export interface PrepositionalPhrase extends Phrase {
  phraseType: PhraseType.PREPOSITIONAL_PHRASE;
  preModifier?: PrepositionalPhraseModifier;
  postModifier?: PrepositionalPhraseModifier;
  complements: readonly PrepositionalPhraseComplement[];
}

export type PrepositionalPhraseInit = Pick<Phrase, "text"> &
  Partial<Omit<Phrase, "text" | "phraseType" | "preModifier" | "postModifier" | "complements">> & {
    preModifier?: PrepositionalPhraseModifier;
    postModifier?: PrepositionalPhraseModifier;
    complements?: readonly PrepositionalPhraseComplement[];
  };

export function createPrepositionalPhrase(init: PrepositionalPhraseInit): PrepositionalPhrase {
  return createPhrase({ ...init, phraseType: PhraseType.PREPOSITIONAL_PHRASE }) as PrepositionalPhrase;
}

export function isPrepositionalPhrase(phrase: Phrase): phrase is PrepositionalPhrase {
  return phrase.phraseType === PhraseType.PREPOSITIONAL_PHRASE;
}
