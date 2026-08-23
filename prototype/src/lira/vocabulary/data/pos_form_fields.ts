/** Every *_Form scalar field a Word's own concrete POS subtype declares
 * directly on itself, keyed by PartOfSpeech -- the single source of
 * truth for "which fields hold this Word's own spelling variants,"
 * shared by wordFormsFor() (ui/server/builder_word.ts, display) and
 * Dictionary.indexWordForms() (data/dictionary.ts, lookup) rather than
 * each maintaining its own copy of this list. Built from
 * WORD_FORM_MATRIX (data/matrices/pos_vs_wordform_matrice.ts), the
 * single real data source for the Word Form to Part of Speech Matrix
 * -- not, as this file used to, from six separate
 * role/processor/*_processor.ts constants (a data/ file importing from
 * role/ inverted this codebase's own one-way dependency rule; see that
 * matrix file's own module docstring for the full story).
 *
 * Renamed from word_forms.ts once AUXILIARY stopped using this
 * mechanism: an Auxiliary Word's own spellings no longer live in scalar
 * fields at all (data/entities/auxiliary.ts is now field-less beyond
 * `partOfSpeech`) -- they live in WordForm records reached via
 * `Word.formIds` (data/word_form.ts, data/word_forms.ts's own
 * `WordForms` store), which needed its own file, and `word_forms.ts`
 * was the more forward-looking name to free up for it. Every other POS
 * subtype is following the same path one at a time (WordForm's own
 * docstring calls Auxiliary "one real example before generalizing") --
 * a POS's own key in WORD_FORM_FIELDS below is removed the moment its
 * own scalar `*_Form` fields are, so this map's own shape always
 * reflects which POS subtypes still use scalar fields at all, not a
 * stale record of some earlier state. `Dictionary.indexWordForms()`/
 * `formTextsOf()` below correctly no-op for any POS with no entry here
 * (no scalar field left to reflect over) -- `PartOfSpeechIdentifier.identifySeeded()`
 * (role/part_of_speech_identifier.ts) is what covers a migrated POS's
 * own inflected-form lookup instead, via `WordForms.lookupByText()`
 * alongside `Dictionary.lookupFormMatches()`.
 *
 * Every PartOfSpeech not listed in WORD_FORM_FIELDS below carries no
 * *_Form scalar field of its own -- absent from this record entirely,
 * not listed with an empty array, since `formTextsOf`'s own `?? []`
 * already treats a missing key that way. */

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
  [PartOfSpeech.ADJECTIVE]: posFormFields(PartOfSpeech.ADJECTIVE),
  [PartOfSpeech.ADVERB]: posFormFields(PartOfSpeech.ADVERB),
  [PartOfSpeech.PRONOUN]: posFormFields(PartOfSpeech.PRONOUN),
  [PartOfSpeech.DETERMINER]: posFormFields(PartOfSpeech.DETERMINER),
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
 * simply absent" convention (ui/server/builder_word.ts). Always just
 * `["baseLemmaCanonicalForm"]` for an Auxiliary Word (WORD_FORM_FIELDS
 * has no entry for it) -- its real forms live in WordForm records
 * instead, this file's own module docstring. */
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
