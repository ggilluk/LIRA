/** VerbPhrase: Phrase's own VERB_PHRASE-specific subtype -- one of
 * PhraseType's own six grammatical shapes (data/enums/phrase_type.ts's
 * own docstring), narrowing a Phrase by `phraseType` the same way Verb
 * narrows a Word by `partOfSpeech` (this same entities/ directory's own
 * verb.ts). Structure: "(Auxiliary verbs) + Main verb + (Particles) +
 * (Complements) + (Modifiers)" (PHRASE_TYPE_DETAILS[PhraseType.VERB_PHRASE],
 * data/enums/phrase_type.ts) -- example: "has learned the pattern". Distinct
 * from the WordNet-tagged part of speech Phrases.partOfSpeechOf() reports
 * for this Phrase (data/phrases.ts) (PhraseType's own docstring on why
 * the two are kept apart), so this subtype narrows `phraseType` only,
 * never that WordNet-tagged part of speech.
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
 * `headWord` (data/phrase.ts's own docstring on it) is a graph-reference
 * pointer, not narrowed to any Word subtype here the way `preModifiers`/
 * `postModifiers` below are -- an `Identifier` carries no type of its
 * own to narrow. For a real seeded VerbPhrase it always resolves
 * (`Dictionary.findByUuid()`) to a `Verb`: VERB_PHRASE's own Head
 * Identification Rule never resolves to any other Word subtype
 * (data/phrase_type_patterns_and_word_roles.md's own "Phrase Role
 * Allowed Types" table, VerbPhrase/HEAD row). Genuinely populated
 * today, for every real seeded multi-word WordNet VerbPhrase, by
 * linkPhraseWords() (role/processor/phrase_processor.ts).
 *
 * `preModifiers` narrows Phrase's own same-named field (data/phrase.ts's
 * own docstring on it) down to the exact constituent set
 * data/phrase_type_patterns_and_word_roles.md's own "Phrase Role
 * Allowed Types" table gives VerbPhrase's own MODIFIER row: an
 * `Adverb`-capable token's own WordForm reference, or an `AdverbPhrase`
 * sub-constituent -- `headWord`'s own "an Identifier carries no type to
 * narrow" reasoning, narrowing only the embedded-subtype half of the
 * union. Same real-population status as `headWord` above, for the
 * single-Word-constituent case only -- linkPhraseWords()'s own
 * docstring on why a sub-phrase modifier is left out rather than
 * guessed at, and on why a WordForm that fails to resolve is too.
 *
 * `postModifiers` narrows Phrase's own same-named field (data/phrase.ts's
 * own docstring on it) down to that exact same constituent set --
 * VerbPhrase's own structure ("... + (Complements) + (Modifiers)") in
 * fact places its real Modifiers after the Head, so this is the field
 * linkPhraseWords() actually populates in practice for a real
 * VerbPhrase, with `preModifiers` staying available (and populated the
 * same way, should a Modifier ever precede the Head) for the rarer
 * pre-Head case. */

import { PhraseType } from "../enums/phrase_type";
import { createPhrase, type Phrase } from "../phrase";
import type { Identifier } from "../../../value_objects";
import type { AdverbPhrase } from "./adverb_phrase";

type VerbPhraseModifier = Identifier | AdverbPhrase;

export interface VerbPhrase extends Phrase {
  phraseType: PhraseType.VERB_PHRASE;
  preModifiers: readonly VerbPhraseModifier[];
  postModifiers: readonly VerbPhraseModifier[];
}

export type VerbPhraseInit = Pick<Phrase, "text"> &
  Partial<Omit<Phrase, "text" | "phraseType" | "preModifiers" | "postModifiers">> & {
    preModifiers?: readonly VerbPhraseModifier[];
    postModifiers?: readonly VerbPhraseModifier[];
  };

export function createVerbPhrase(init: VerbPhraseInit): VerbPhrase {
  return createPhrase({ ...init, phraseType: PhraseType.VERB_PHRASE }) as VerbPhrase;
}

export function isVerbPhrase(phrase: Phrase): phrase is VerbPhrase {
  return phrase.phraseType === PhraseType.VERB_PHRASE;
}
