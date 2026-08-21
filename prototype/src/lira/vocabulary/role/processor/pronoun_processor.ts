import type { Text } from "../../../value_objects";
import { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Word } from "../../data/entities/word";
import { createWord, validateFormText, validateWordFormAttributes, type WordFormIssue } from "../word_processor";
import type { Pronoun } from "../../data/entities/pronoun";
import { stringPatternsFor } from "../../data/matrices/pos_vs_wordform_matrice";

export type PronounInit = Pick<Pronoun, "text"> & Partial<Omit<Pronoun, "text" | "partOfSpeech">>;

export function createPronoun(init: PronounInit): Pronoun {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.PRONOUN }) as Pronoun;
}

export function isPronoun(word: Word): word is Pronoun {
  return word.partOfSpeech === PartOfSpeech.PRONOUN;
}

/** Validates every *_Form field this Pronoun carries -- its own row
 * above, plus baseLemmaCanonicalForm via Word's own
 * validateWordFormAttributes -- against WORD_FORM_MATRIX's own
 * PRONOUN rules (data/matrices/pos_vs_wordform_matrice.ts).
 * Returns every issue found, not just the first; empty means every
 * populated field is internally consistent with the matrix, not that
 * every field is populated (undefined is never an issue,
 * validateFormText's own docstring). */
export function validatePronoun(pronoun: Pronoun): readonly WordFormIssue[] {
  const issues: WordFormIssue[] = [...validateWordFormAttributes(pronoun)];
  const check = (field: string, text: Text | undefined): void => {
    if (text === undefined) return;
    const issue = validateFormText(field, text, stringPatternsFor(field, PartOfSpeech.PRONOUN));
    if (issue !== undefined) issues.push(issue);
  };
  check("singularNumberForm", pronoun.singularNumberForm);
  check("pluralNumberForm", pronoun.pluralNumberForm);
  check("firstPersonForm", pronoun.firstPersonForm);
  check("secondPersonForm", pronoun.secondPersonForm);
  check("thirdPersonForm", pronoun.thirdPersonForm);
  check("subjectiveCaseForm", pronoun.subjectiveCaseForm);
  check("objectiveCaseForm", pronoun.objectiveCaseForm);
  check("possessiveCaseForm", pronoun.possessiveCaseForm);
  check("reflexiveCaseForm", pronoun.reflexiveCaseForm);
  return issues;
}
