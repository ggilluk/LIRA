import { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Word } from "../../data/entities/word";
import type { WordForms } from "../../data/word_forms";
import { createWord, validateFormText, type WordFormIssue } from "../word_processor";
import type { Determiner } from "../../data/entities/determiner";
import { stringPatternsFor } from "../../data/matrices/pos_vs_wordform_matrice";

export type DeterminerInit = Pick<Determiner, "text"> & Partial<Omit<Determiner, "text" | "partOfSpeech">>;

export function createDeterminer(init: DeterminerInit): Determiner {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.DETERMINER }) as Determiner;
}

export function isDeterminer(word: Word): word is Determiner {
  return word.partOfSpeech === PartOfSpeech.DETERMINER;
}

/** Validates every WordForm this Determiner carries -- Singular/Plural
 * Number Form and Consonant/Vowel-Sound Form, plus baseLemmaCanonicalForm
 * (all registered onto `wordForms`, so all are covered by the same loop)
 * -- against WORD_FORM_MATRIX's own DETERMINER rules
 * (data/matrices/pos_vs_wordform_matrice.ts). Returns every issue
 * found, not just the first; empty means every populated field is
 * internally consistent with the matrix, not that every field is
 * populated. validateAuxiliary()'s own exact shape
 * (role/processor/auxiliary_processor.ts) -- `role/determiner_seeder.ts`
 * is this Determiner's own production write site now (that seeder's
 * own docstring). */
export function validateDeterminer(determiner: Determiner, wordForms: WordForms): readonly WordFormIssue[] {
  const issues: WordFormIssue[] = [];
  for (const form of wordForms.formsOf(determiner)) {
    const issue = validateFormText(form.formType, form.text, stringPatternsFor(form.formType, PartOfSpeech.DETERMINER));
    if (issue !== undefined) issues.push(issue);
  }
  return issues;
}
