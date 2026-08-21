/** Every *_Form field a Word's own concrete POS subtype declares, keyed
 * by PartOfSpeech -- the single source of truth for "which fields hold
 * this Word's own spelling variants," shared by
 * DictionaryView.wordFormsFor() (ui/dictionary_view.ts, display) and
 * Dictionary.indexWordForms() (data/dictionary.ts, lookup) rather than
 * each maintaining its own copy of this list. Built from each POS
 * class's own exported *_FORM_PATTERNS record (noun.ts/verb.ts/
 * adjective.ts/adverb.ts/pronoun.ts/determiner.ts) -- that record's
 * keys are exactly the *_Form fields that class declares (each POS
 * file's own docstring on why its row of the Word Form to Part of
 * Speech Matrix, data/word_form_part_of_speech_matrix.md, is expressed
 * this way). Every other PartOfSpeech (Preposition, Conjunction,
 * Interjection, Numeral, Particle, Auxiliary, ProperNoun, Symbol,
 * Punctuation, Other) carries no *_Form field of its own -- absent from
 * this record entirely, not listed with an empty array, since
 * `formTextsOf`'s own `?? []` already treats a missing key that way. */

import { ADJECTIVE_FORM_PATTERNS } from "../role/adjective_processor";
import { ADVERB_FORM_PATTERNS } from "../role/adverb_processor";
import { DETERMINER_FORM_PATTERNS } from "../role/determiner_processor";
import { PartOfSpeech } from "./enums/part_of_speech";
import { NOUN_FORM_PATTERNS } from "../role/noun_processor";
import { PRONOUN_FORM_PATTERNS } from "../role/pronoun_processor";
import { VERB_FORM_PATTERNS } from "../role/verb_processor";
import type { Text } from "../../value_objects";
import type { Word } from "./word";

export const WORD_FORM_FIELDS: Readonly<Partial<Record<PartOfSpeech, readonly string[]>>> = {
  [PartOfSpeech.NOUN]: Object.keys(NOUN_FORM_PATTERNS),
  [PartOfSpeech.VERB]: Object.keys(VERB_FORM_PATTERNS),
  [PartOfSpeech.ADJECTIVE]: Object.keys(ADJECTIVE_FORM_PATTERNS),
  [PartOfSpeech.ADVERB]: Object.keys(ADVERB_FORM_PATTERNS),
  [PartOfSpeech.PRONOUN]: Object.keys(PRONOUN_FORM_PATTERNS),
  [PartOfSpeech.DETERMINER]: Object.keys(DETERMINER_FORM_PATTERNS),
};

/** One populated *_Form field, paired with its own field name -- e.g.
 * `{ field: "pluralNumberForm", text: { value: "commas" } }`. */
export interface WordFormEntry {
  field: string;
  text: Text;
}

/** Every populated *_Form field `word` carries, each paired with its
 * own field name -- `baseLemmaCanonicalForm` first (declared on Word
 * itself, so every POS is eligible for it regardless of
 * WORD_FORM_FIELDS), then whichever of that POS's own fields
 * (WORD_FORM_FIELDS[word.partOfSpeech]) are actually set. A field with
 * no populated value is simply absent, not included as undefined --
 * mirrors wordFormsFor()'s own "field with no populated value is
 * simply absent" convention (ui/dictionary_view.ts). */
export function formTextsOf(word: Word): readonly WordFormEntry[] {
  const fields = ["baseLemmaCanonicalForm", ...(WORD_FORM_FIELDS[word.partOfSpeech] ?? [])];
  const record = word as unknown as Record<string, Text | undefined>;
  const entries: WordFormEntry[] = [];
  for (const field of fields) {
    const text = record[field];
    if (text !== undefined) entries.push({ field, text });
  }
  return entries;
}
