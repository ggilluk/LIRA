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

import type { Identifier, Text } from "../../../value_objects";
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

  // The purpose is to identify the basic adjective or adverb form that
  // describes a quality without comparing it with another. Fully
  // lexical, not spelling-derivable (the matrix's own Format/String
  // Pattern rows are both `N/A`) -- a populated value's own
  // `Text.formats` should stay unset.
  positiveDegreeForm?: Text;
  // The purpose is to identify the adjective or adverb form used to
  // compare the degree of a quality between two people, things,
  // actions, or states. Applies only to gradable adverbs ("faster"),
  // not to every adverb. Rules #1-4 are regex-derivable (`/er$/i` twice
  // over, `/ier$/i`, a doubled-final-consonant pattern) -- a populated
  // regular-case value's own `Text.formats` should carry whichever
  // matched; rule #5 (irregular, "well"->"better") has no format and
  // needs curated data instead.
  comparativeDegreeForm?: Text;
  // The purpose is to identify the adjective or adverb form used to
  // identify the highest or lowest degree of a quality within a group.
  // Same gradable-only caveat as comparativeDegreeForm above. Rules
  // #1-4 are regex-derivable (`/est$/i` twice over, `/iest$/i`, a
  // doubled-final-consonant pattern) -- a populated regular-case
  // value's own `Text.formats` should carry whichever matched; rule #5
  // (irregular, "well"->"best") has no format and needs curated data
  // instead.
  superlativeDegreeForm?: Text;
}
