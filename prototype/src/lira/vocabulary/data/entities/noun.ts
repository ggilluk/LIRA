/** Noun: Word's own NOUN-specific subtype. `isCountable` has no
 * seeding source today -- neither Princeton WordNet's dict/ files nor
 * the Common Vocabulary Cache mark countability anywhere -- so it stays
 * undefined on every Noun WordSeeder produces; the field exists so a
 * future curation pass has somewhere to write "chair" (countable) vs.
 * "water" (uncountable) to, the same "declared before it's populated"
 * shape this codebase's other not-yet-seeded fields already have.
 * `wordCharacterForms` is the same shape again, for the literal Unicode
 * character(s) a mark-naming Noun ("comma", "ampersand", "brace")
 * itself denotes -- see that field's own docstring.
 *
 * Singular Number Form/Plural Number Form/Possessive Case Form -- this
 * subtype's own row of fields from the Word Form to Part of Speech
 * Matrix (../matrices/word_form_part_of_speech_matrix.md) -- are no
 * longer scalar fields here (Auxiliary's own precedent,
 * data/entities/auxiliary.ts): each one now lives as its own `WordForm`
 * record, reached via `Word.wordFormIds` (data/word_form.ts, data/word_forms.ts's
 * own `WordForms` store), generated the same as ever by
 * generateNounForms() (role/processor/noun_processor.ts) but registered
 * there via `WordForms.registerNamedForm()` instead of assigned to a
 * named field on this interface.
 *
 * `isRootWord`/`interrogativeRootWord`/`hypernymRootWord`/
 * `holonymRootWord`/`vectorPrimitiveRootWord`, and `isDerivableNoun`,
 * used to live on `Word` itself -- moved here once it became clear
 * every one of them is NOUN-only in practice (`Word`'s own docstring
 * has the "why moved" note): `assets/common/en/root_words.json`'s own
 * 25 entries are every one of them `"part_of_speech": "NOUN"`, and each
 * of the four root-word enums (`../enums/interrogative_root_word.ts`
 * and its three siblings) is described purely in noun terms (Entity,
 * Party/Role, Place, ... -- the *answer* to an interrogative, never the
 * interrogative word itself). Nothing outside `Noun` ever populates
 * these; every other POS subtype no longer inherits six always-default
 * fields that never applied to it. */

import type { Identifier, Text } from "../../../value_objects";
import { PartOfSpeech } from "../enums/part_of_speech";
import type { HolonymRootWord } from "../enums/holonym_root_word";
import type { HypernymRootWord } from "../enums/hypernym_root_word";
import type { InterrogativeRootWord } from "../enums/interrogative_root_word";
import type { VectorPrimitiveRootWord } from "../enums/vector_primitive_root_word";
import type { Word } from "./word";

export interface Noun extends Word {
  partOfSpeech: PartOfSpeech.NOUN;
  isCountable?: boolean;

  // Every literal Unicode character this Noun names, for the handful of
  // Nouns that are themselves the *name* of a mark rather than a word
  // that uses one -- "comma" -> [","], "ampersand" -> ["&"], "brace" ->
  // ["{", "}"] (a paired mark genuinely names more than one glyph at
  // once -- WordNet models "brace" as one generic sense for both, with
  // nothing in the lemma itself to pick a side, so both belong on the
  // same Noun rather than being split across siblings or arbitrarily
  // reduced to one). Not a Word Form Matrix field
  // (../matrices/pos_vs_wordform_matrice.ts has no row for it)
  // and not spelling-derivable from the lemma the way pluralNumberForm
  // etc. are, so generateNounForms() never touches it. Empty, not undefined, for every Noun with nothing
  // seeded -- NounCharacterFormSeeder (role/noun_character_form_seeder.ts)
  // is this field's only seeding source today, and
  // assets/common/en/punctuation_wordnet_hyponyms.json has the full
  // mark-name -> character(s) mapping it and any future curation pass
  // would read from.
  wordCharacterForms: readonly Text[];

  // True only for one of the 25 words seeded from
  // assets/common/en/root_words.json -- the Interrogative/Hypernym/
  // Holonym/Vector-Primitive root word table (../enums/interrogative_root_word.ts's
  // own docstring). Never set true by hand elsewhere; every other Noun
  // defaults to false via createNoun(). See DictionaryView's own "Show
  // root words" filter, the reason this flag exists at all rather than
  // being inferred from whichever of the four fields below is set.
  isRootWord: boolean;

  // At most one of these four is ever set, and only when isRootWord is
  // true -- whichever single column of the root word table this Noun
  // instantiates (e.g. the Noun "entity" carries hypernymRootWord =
  // HypernymRootWord.ENTITY, and none of the other three). All four
  // enums share the same numeric ordinal for the same table row (see
  // each one's own docstring), so a caller holding one root word's
  // column value can look up its counterpart in another column by
  // ordinal alone, without this Noun needing to store all four itself.
  interrogativeRootWord?: InterrogativeRootWord;
  hypernymRootWord?: HypernymRootWord;
  holonymRootWord?: HolonymRootWord;
  vectorPrimitiveRootWord?: VectorPrimitiveRootWord;

  // True for a Noun that can be considered derived from (or shares its
  // lexical form with) a corresponding VERB sense -- a suffix-derived
  // nominalisation ("operate" -> "operation", "manifest" ->
  // "manifestation", "originate" -> "origination") or a genuine
  // zero-derivation noun/verb pair ("work", "trigger"). Defaults false
  // via createNoun(); never set true by hand outside WordSeeder's own
  // entryToWord(). Not itself a LexicalRelationship -- this only flags
  // that this Noun is a derivable one, it doesn't wire the actual
  // NOMINALISATION edge to the verb (see
  // relationships/morphological_relationships.json for that, where one
  // already exists).
  isDerivableNoun: boolean;

  // Every field in this block is one half of a morphological-derivation
  // pointer pair -- the other half lives on the class named in the
  // field's own name (Verb/Adjective) -- all populated the identical way
  // by WordSeeder.seedWordNet's own deriveMorphologicalPointers()
  // (role/word_seeder.ts, that method's own docstring for the full
  // rationale and the shared findDerivationTarget() engine every one of
  // these fields, across every POS subtype, is built from): read back
  // from an already-seeded WordNet `+` Derived-Form pointer, never
  // itself creating a LexicalRelationship. Each pointer field's own
  // Indicator boolean is simply `field !== undefined`, kept as its own
  // property rather than left for every caller to check (never undefined
  // itself -- defaults false via createNoun below, the same convention
  // isRootWord just above already uses). Undefined/false for every Common
  // Vocabulary Cache closed-class Noun, which has no relationship-graph
  // read-back pass of its own. A Noun with more than one qualifying edge
  // keeps only the first one found, the same arbitrary-but-deterministic
  // "pick one" convention Dictionary.lookup() already uses for a
  // homograph.
  //
  // Deliberately only two fields, not four -- Noun.isAdjectivised and
  // Noun.isVerbalised existed in an earlier iteration of this block and
  // were removed: WordNet records its own `+` Derived-Form pointer
  // reciprocally (once under the source word's own synset, once again
  // under the target's), and derivationKind() (role/word_seeder.ts)
  // picks a *different* LexicalRelationshipType for each direction --
  // so a Noun/Verb pair like "abandon"/"abandonment" produces both a
  // NOMINALISATION edge (verb->noun) and a separate DERIVED_FORM edge
  // (noun->verb) for the exact same underlying fact, not two distinct
  // ones. DERIVED_FORM itself is WordNet's own catch-all for "target
  // isn't Noun/Adjective/Adverb," not a genuine morphological category
  // the way Nominalisation/Adjectivisation/Adverbialisation are, so
  // building a "Verbalised"/"Adjectivised" field on top of it here
  // duplicated Verb.isNominalised/Adjective.isDerivedFromNoun's own
  // fact under a second, spurious name instead of describing anything
  // new. Correct linguistics, not WordNet's own storage convention, is
  // what these fields model -- there is exactly one derivational
  // relationship between two words, read from whichever single edge
  // NOMINALISATION/ADJECTIVAL_DERIVATION/ADVERBIAL_DERIVATION actually
  // produces, never from DERIVED_FORM.

  // This Noun's own uuid, per the Verb it nominalizes from ("decision"
  // <- "decide"). Distinct from isDerivableNoun above (that field's own
  // docstring): isDerivableNoun is a hand-curated boolean with no
  // pointer of its own; this is the real thing, read from a genuine
  // NOMINALISATION edge whose source resolves to a Verb specifically --
  // that same edge kind also covers Adjective->Noun ("happy"->"happiness"),
  // isDerivedFromAdjective's own case just below, so checking the
  // source's own actual part of speech is required, not defensive
  // boilerplate (deriveMorphologicalPointers()'s own docstring).
  isDerivedFromVerb?: Identifier;
  isDerivedFromVerbIndicator: boolean;

  // This Noun's own uuid, per the Adjective it nominalizes from ("happiness"
  // <- "happy") -- isDerivedFromVerb's own exact counterpart for the
  // other real source part of speech NOMINALISATION covers. The Noun-side
  // half of the one real Noun<->Adjective relationship -- Adjective is
  // treated as the canonical base form (Adjective.isNominalised, not a
  // separate Noun.isAdjectivised), matching how much more heavily
  // populated real WordNet data is in this direction.
  isDerivedFromAdjective?: Identifier;
  isDerivedFromAdjectiveIndicator: boolean;
}
