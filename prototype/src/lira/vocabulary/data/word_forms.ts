/** Every *_Form field a Word's own concrete POS subtype declares, keyed
 * by PartOfSpeech -- the single source of truth for "which fields hold
 * this Word's own spelling variants," shared by
 * wordFormsFor() (ui/server/builder_word.ts, display) and
 * Dictionary.indexWordForms() (data/dictionary.ts, lookup) rather than
 * each maintaining its own copy of this list. Built from
 * WORD_FORM_MATRIX (data/matrices/pos_vs_wordform_matrice.ts),
 * the single real data source for the Word Form to Part of Speech
 * Matrix -- not, as this file used to, from six separate
 * role/processor/*_processor.ts constants (a data/ file importing from
 * role/ inverted this codebase's own one-way dependency rule; see that
 * matrix file's own module docstring for the full story). Auxiliary
 * joined this list once role/auxiliary_seeder.ts started populating its
 * own *_Form fields (data/entities/auxiliary.ts) -- without an entry
 * here, Dictionary.indexWordForms() would never index "was"/"were"/
 * "could"/etc. against the "be"/"can"/... Word that owns them, and
 * lookupFormMatches() would silently fail to resolve them during
 * sentence reading. Every remaining PartOfSpeech (Preposition,
 * Conjunction, Interjection, Numeral, Particle, ProperNoun, Symbol,
 * Punctuation, Other) still carries no *_Form field of its own --
 * absent from this record entirely, not listed with an empty array,
 * since `formTextsOf`'s own `?? []` already treats a missing key that
 * way. */

import { fieldsFor } from "./matrices/pos_vs_wordform_matrice";
import { PartOfSpeech } from "./enums/part_of_speech";
import type { Text } from "../../value_objects";
import type { Word } from "./entities/word";

// fieldsFor()'s own row-order sweep includes "baseLemmaCanonicalForm"
// for every POS (the matrix's own first row applies to all of them) --
// excluded here since formTextsOf() below already prepends that field
// unconditionally for every Word regardless of partOfSpeech; including
// it in WORD_FORM_FIELDS too would duplicate it in formTextsOf()'s own
// output, matching the same "belongs to Word itself, not any one POS
// subtype's own row" fact the old per-POS `*_FORM_PATTERNS` constants
// already encoded by never declaring it as one of their own keys.
function posFormFields(pos: PartOfSpeech): readonly string[] {
  return fieldsFor(pos).filter((field) => field !== "baseLemmaCanonicalForm");
}

export const WORD_FORM_FIELDS: Readonly<Partial<Record<PartOfSpeech, readonly string[]>>> = {
  [PartOfSpeech.NOUN]: posFormFields(PartOfSpeech.NOUN),
  [PartOfSpeech.VERB]: posFormFields(PartOfSpeech.VERB),
  [PartOfSpeech.ADJECTIVE]: posFormFields(PartOfSpeech.ADJECTIVE),
  [PartOfSpeech.ADVERB]: posFormFields(PartOfSpeech.ADVERB),
  [PartOfSpeech.PRONOUN]: posFormFields(PartOfSpeech.PRONOUN),
  [PartOfSpeech.DETERMINER]: posFormFields(PartOfSpeech.DETERMINER),
  [PartOfSpeech.AUXILIARY]: posFormFields(PartOfSpeech.AUXILIARY),
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
 * simply absent" convention (ui/server/builder_word.ts). */
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
