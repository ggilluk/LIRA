/** Adverb: Word's own ADVERB-specific subtype. Unlike Noun/Verb/
 * Adjective, neither Princeton WordNet's dict/data.adv nor the Common
 * Vocabulary Cache carries any adverb-specific marker this codebase
 * discards today (Verb's `frames`/Adjective's `syntacticPosition`
 * docstrings on where those two came from), so every field below is
 * undefined until a future seeding/curation pass populates it -- the
 * class still exists, and still carries its own row of fields from the
 * Word Form to Part of Speech Matrix
 * (../matrices/word_form_part_of_speech_matrix.md), the same as its three
 * siblings, ready for a value once one is available. */

import type { Identifier } from "../../../value_objects";
import { PartOfSpeech } from "../enums/part_of_speech";
import type { Word } from "./word";

export interface Adverb extends Word {
  partOfSpeech: PartOfSpeech.ADVERB;

  // One half of a morphological-derivation pointer pair --
  // Noun.isDerivedFromVerb's own docstring (../noun.ts) has the full
  // shared rationale (deriveMorphologicalPointers()/findDerivationTarget(),
  // role/word_seeder.ts) every one of these fields, on every POS
  // subtype, is built from, including why this is deliberately one
  // field, not two (an earlier iteration also had isAdjectivised, reading
  // WordNet's own reciprocal DERIVED_FORM pointer for the same
  // relationship Adjective.isAdverbialised already captures from the
  // other word's own side). Undefined/false for every Common Vocabulary
  // Cache closed-class Adverb.

  // This Adverb's own uuid, per the Adjective it adverbialises from
  // ("quickly" <- "quick") -- Adjective.isAdverbialised's own exact
  // reverse.
  isDerivedFromAdjective?: Identifier;
  isDerivedFromAdjectiveIndicator: boolean;

  // Positive/Comparative/Superlative Degree Form -- this subtype's own
  // row of fields from the Word Form to Part of Speech Matrix
  // (../matrices/word_form_part_of_speech_matrix.md) -- are no longer
  // scalar fields here (Auxiliary's own precedent,
  // data/entities/auxiliary.ts): each one now lives as its own
  // `WordForm` record, reached via `Word.wordFormIds` (data/word_form.ts,
  // data/word_forms.ts's own `WordForms` store), generated the same as
  // ever by generateAdverbForms() (role/processor/adverb_processor.ts)
  // but registered there via `WordForms.registerNamedForm()` instead of
  // assigned to a named field on this interface.
}
