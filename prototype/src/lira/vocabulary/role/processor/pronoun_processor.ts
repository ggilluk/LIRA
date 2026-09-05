import { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Word } from "../../data/entities/word";
import type { WordForms } from "../../data/word_forms";
import { createWord, validateFormText, type WordFormIssue } from "../word_processor";
import type { Pronoun } from "../../data/entities/pronoun";
import { stringPatternsFor } from "../../data/matrices/pos_vs_wordform_matrice";

export type PronounInit = Pick<Pronoun, "text"> & Partial<Omit<Pronoun, "text" | "partOfSpeech">>;

export function createPronoun(init: PronounInit): Pronoun {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.PRONOUN }) as Pronoun;
}

export function isPronoun(word: Word): word is Pronoun {
  return word.partOfSpeech === PartOfSpeech.PRONOUN;
}

/** Validates every WordForm this Pronoun carries -- its own row above,
 * plus baseLemmaCanonicalForm (both registered onto `wordForms`, so
 * both are covered by the same loop) -- against WORD_FORM_MATRIX's own
 * PRONOUN rules (data/matrices/pos_vs_wordform_matrice.ts). Returns
 * every issue found, not just the first; empty means every populated
 * field is internally consistent with the matrix, not that every
 * field is populated. validateAuxiliary()'s own exact shape
 * (role/processor/auxiliary_processor.ts) -- a no-op against real data
 * today, since no production write site populates a Pronoun's own
 * WordForms yet (Pronoun's own docstring, data/entities/pronoun.ts). */
export function validatePronoun(pronoun: Pronoun, wordForms: WordForms): readonly WordFormIssue[] {
  const issues: WordFormIssue[] = [];
  for (const form of wordForms.formsOf(pronoun)) {
    const issue = validateFormText(form.formType, form.text, stringPatternsFor(form.formType, PartOfSpeech.PRONOUN));
    if (issue !== undefined) issues.push(issue);
  }
  return issues;
}
