/** Adjective: Word's own ADJECTIVE-specific subtype. Also see
 * `syntacticPositionForSense()` (role/processor/adjective_processor.ts) -- a real
 * WordNet-sourced property this codebase used to discard outright.
 * Princeton WordNet 3.1's dict/data.adj marks some lemmas with a
 * trailing, space-free parenthetical -- "afraid(p)", "galore(ip)" --
 * restricting where that specific sense of the adjective can sit
 * relative to the noun it modifies. wordnet_loader.ts's own
 * cleanLemma() already stripped this marker before this existed; it's
 * parsed into WordNetSynset.lemmaPositions now instead, and
 * WordSeeder.seedWordNet's own synsetMemberToWord() reads it from
 * there, storing the result on the Senses store as per-membership
 * metadata (Senses.setMemberMetadata()'s own docstring, ../senses.ts)
 * rather than on the Adjective itself -- an Adjective is now unique by
 * (partOfSpeech, lemma) and can lexicalize several senses
 * (Word.senseIds's own docstring), and a syntactic-position restriction
 * is a fact about one specific sense ("afraid" is predicate-only in its
 * "frightened" sense but has no such restriction in some other sense
 * sharing that spelling), not the spelling as a whole.
 *
 * Verified directly against the bundled dict/ files, not guessed: a
 * scan of all four dict/data.* files found `(a)`/`(p)`/`(ip)` are the
 * *only* trailing parenthetical markers ever attached directly to a
 * lemma token (never in data.noun/data.verb/data.adv), so this is safe
 * to treat as an exhaustive, closed set. */

import type { Identifier } from "../../../value_objects";
import { PartOfSpeech } from "../enums/part_of_speech";
import type { Word } from "./word";

export interface Adjective extends Word {
  partOfSpeech: PartOfSpeech.ADJECTIVE;

  // Every field in this block is one half of a morphological-derivation
  // pointer pair -- Noun.isDerivedFromVerb's own docstring (../noun.ts)
  // has the full shared rationale (deriveMorphologicalPointers()/
  // findDerivationTarget(), role/word_seeder.ts) every one of these
  // fields, on every POS subtype, is built from, including why this is
  // deliberately three fields, not six (an earlier iteration also had
  // isVerbalised/isDerivedFromNoun/isDerivedFromAdverb, each reading
  // WordNet's own reciprocal DERIVED_FORM pointer for a relationship
  // Verb.isAdjectivised/Noun.isDerivedFromAdjective/Adverb.isDerivedFromAdjective
  // already capture from the other word's own side -- the same fact
  // under a second, spurious name, not a new one). Undefined/false for
  // every Common Vocabulary Cache closed-class Adjective; an Adjective
  // with more than one qualifying edge keeps only the first one found.
  // An Adjective still sits at the centre of more of these pairs than
  // any other POS subtype -- a real Adjective<->Verb, Adjective<->Noun,
  // and Adjective<->Adverb relationship each, not just one.

  // The Noun this Adjective nominalizes into ("happy" -> "happiness") --
  // Noun.isDerivedFromAdjective's own exact reverse, same NOMINALISATION
  // kind Verb.isNominalised also reads (that field's own docstring on
  // why the source's own actual part of speech has to be checked).
  isNominalised?: Identifier;
  isNominalisedIndicator: boolean;

  // The Adverb this Adjective adverbialises into ("quick" -> "quickly")
  // -- a real WordNet ADVERBIAL_DERIVATION pointer, source=this
  // Adjective -- Adverb.isDerivedFromAdjective's own exact reverse.
  // Distinct from a Pertainym relationship (role/processor/adverb_processor.ts's
  // own determineGradability() docstring on that separate `\` pointer
  // type, "relates to" rather than "is formed from") -- this is
  // WordNet's `+` Derived-Form pointer specifically.
  isAdverbialised?: Identifier;
  isAdverbialisedIndicator: boolean;

  // This Adjective's own uuid, per the Verb it adjectivises from
  // ("interesting" <- "interest") -- Verb.isAdjectivised's own exact
  // reverse.
  isDerivedFromVerb?: Identifier;
  isDerivedFromVerbIndicator: boolean;

  // The rest of this subtype's own row of fields from the Word Form to
  // Part of Speech Matrix (../matrices/word_form_part_of_speech_matrix.md) --
  // Positive/Comparative/Superlative Degree Form -- are no longer scalar
  // fields here (Auxiliary's own precedent, data/entities/auxiliary.ts):
  // each one now lives as its own `WordForm` record, reached via
  // `Word.wordFormIds` (data/word_form.ts, data/word_forms.ts's own
  // `WordForms` store), generated the same as ever by
  // generateAdjectiveForms() (role/processor/adjective_processor.ts) but
  // registered there via `WordForms.registerNamedForm()` instead of
  // assigned to a named field on this interface.
}
