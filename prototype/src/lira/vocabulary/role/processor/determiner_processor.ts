import type { Text } from "../../../value_objects";
import { PartOfSpeech } from "../../data/enums/part_of_speech";
import { createWord, validateFormText, validateWordFormAttributes, type Word, type WordFormIssue } from "../../data/word";
import type { Determiner } from "../../data/entities/determiner";
import { stringPatternsFor } from "../../data/matrices/word_form_part_of_speech_matrix";

export type DeterminerInit = Pick<Determiner, "text"> & Partial<Omit<Determiner, "text" | "partOfSpeech">>;

export function createDeterminer(init: DeterminerInit): Determiner {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.DETERMINER }) as Determiner;
}

export function isDeterminer(word: Word): word is Determiner {
  return word.partOfSpeech === PartOfSpeech.DETERMINER;
}

/** Validates every *_Form field this Determiner carries -- its own row
 * above, plus baseLemmaCanonicalForm via Word's own
 * validateWordFormAttributes -- against WORD_FORM_MATRIX's own
 * DETERMINER rules (data/matrices/word_form_part_of_speech_matrix.ts).
 * Returns every issue found, not just the first; empty means every
 * populated field is internally consistent with the matrix, not that
 * every field is populated (undefined is never an issue,
 * validateFormText's own docstring). */
export function validateDeterminer(determiner: Determiner): readonly WordFormIssue[] {
  const issues: WordFormIssue[] = [...validateWordFormAttributes(determiner)];
  const check = (field: string, text: Text | undefined): void => {
    if (text === undefined) return;
    const issue = validateFormText(field, text, stringPatternsFor(field, PartOfSpeech.DETERMINER));
    if (issue !== undefined) issues.push(issue);
  };
  check("singularNumberForm", determiner.singularNumberForm);
  check("pluralNumberForm", determiner.pluralNumberForm);
  check("possessiveCaseForm", determiner.possessiveCaseForm);
  return issues;
}
