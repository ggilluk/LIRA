import type { Text } from "../../../value_objects";
import { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Word } from "../../data/entities/word";
import { createWord, validateFormText, validateWordFormAttributes, type WordFormIssue } from "../word_processor";
import type { Determiner } from "../../data/entities/determiner";
import { stringPatternsFor } from "../../data/matrices/pos_vs_wordform_matrice";

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
 * DETERMINER rules (data/matrices/pos_vs_wordform_matrice.ts).
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
