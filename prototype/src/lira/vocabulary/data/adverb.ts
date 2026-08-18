/** Adverb: Word's own ADVERB-specific subtype. Unlike Noun/Verb/
 * Adjective, neither Princeton WordNet's dict/data.adv nor the Common
 * Vocabulary Cache carries any adverb-specific marker this codebase
 * discards today (Verb's `frames`/Adjective's `syntacticPosition`
 * docstrings on where those two came from), so every field below is
 * undefined until a future seeding/curation pass populates it -- the
 * class still exists, and still carries its own row of fields from the
 * Word Form to Part of Speech Matrix
 * (data/word_form_part_of_speech_matrix.md), the same as its three
 * siblings, ready for a value once one is available. */

import type { Text } from "../../value_objects";
import { PartOfSpeech } from "./enums/part_of_speech";
import { createWord, validateFormText, validateWordFormAttributes, type Word, type WordFormIssue } from "./word";

export interface Adverb extends Word {
  partOfSpeech: PartOfSpeech.ADVERB;

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

export type AdverbInit = Pick<Adverb, "text"> & Partial<Omit<Adverb, "text" | "partOfSpeech">>;

export function createAdverb(init: AdverbInit): Adverb {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.ADVERB }) as Adverb;
}

export function isAdverb(word: Word): word is Adverb {
  return word.partOfSpeech === PartOfSpeech.ADVERB;
}

// Adverb's own row of the matrix's String Pattern column (data/word_form_part_of_speech_matrix.md),
// scoped to exactly the rules that apply to Adverb specifically -- see
// each field's own docstring above for which numbered rule(s) these are
// and why the rest of that row's rules (irregular, curated-only, or
// another class's own) are simply absent here.
export const ADVERB_FORM_PATTERNS: Readonly<Record<string, readonly string[]>> = {
  positiveDegreeForm: [],
  comparativeDegreeForm: ["/er$/i", "/ier$/i", "/([bcdfghjklmnpqrstvwxyz])\\1er$/i"],
  superlativeDegreeForm: ["/est$/i", "/iest$/i", "/([bcdfghjklmnpqrstvwxyz])\\1est$/i"],
};

/** Validates every *_Form field this Adverb carries -- its own row
 * above, plus baseLemmaCanonicalForm via Word's own
 * validateWordFormAttributes -- against ADVERB_FORM_PATTERNS. Returns
 * every issue found, not just the first; empty means every populated
 * field is internally consistent with the matrix, not that every field
 * is populated (undefined is never an issue, validateFormText's own
 * docstring). */
export function validateAdverb(adverb: Adverb): readonly WordFormIssue[] {
  const issues: WordFormIssue[] = [...validateWordFormAttributes(adverb)];
  const check = (field: keyof typeof ADVERB_FORM_PATTERNS, text: Text | undefined): void => {
    if (text === undefined) return;
    const issue = validateFormText(field, text, ADVERB_FORM_PATTERNS[field]);
    if (issue !== undefined) issues.push(issue);
  };
  check("positiveDegreeForm", adverb.positiveDegreeForm);
  check("comparativeDegreeForm", adverb.comparativeDegreeForm);
  check("superlativeDegreeForm", adverb.superlativeDegreeForm);
  return issues;
}
