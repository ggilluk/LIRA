import type { Text } from "../../../value_objects";
import { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Word } from "../../data/entities/word";
import { createWord, validateFormText, validateWordFormAttributes, type WordFormIssue } from "../word_processor";
import type { Auxiliary } from "../../data/entities/auxiliary";
import { stringPatternsFor } from "../../data/matrices/pos_vs_wordform_matrice";

export type AuxiliaryInit = Pick<Auxiliary, "text"> & Partial<Omit<Auxiliary, "text" | "partOfSpeech">>;

export function createAuxiliary(init: AuxiliaryInit): Auxiliary {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.AUXILIARY }) as Auxiliary;
}

export function isAuxiliary(word: Word): word is Auxiliary {
  return word.partOfSpeech === PartOfSpeech.AUXILIARY;
}

/** Validates every *_Form field this Auxiliary carries against
 * WORD_FORM_MATRIX's own AUXILIARY rules (data/matrices/pos_vs_wordform_matrice.ts)
 * -- every one of them is curated/irregular by design (no Auxiliary
 * spelling is regex-derivable the way a regular Verb's is), so this
 * mostly confirms a field was populated with a real string rather than
 * catching a spelling-rule violation the way validateVerb can. Returns
 * every issue found, not just the first. */
export function validateAuxiliary(auxiliary: Auxiliary): readonly WordFormIssue[] {
  const issues: WordFormIssue[] = [...validateWordFormAttributes(auxiliary)];
  const check = (field: string, text: Text | undefined): void => {
    if (text === undefined) return;
    const issue = validateFormText(field, text, stringPatternsFor(field, PartOfSpeech.AUXILIARY));
    if (issue !== undefined) issues.push(issue);
  };
  check("bareInfinitiveForm", auxiliary.bareInfinitiveForm);
  check("presentTenseInstanceForm", auxiliary.presentTenseInstanceForm);
  check("presentTenseForm", auxiliary.presentTenseForm);
  check("thirdPersonSingularPresentForm", auxiliary.thirdPersonSingularPresentForm);
  check("pastTenseInstanceForm", auxiliary.pastTenseInstanceForm);
  check("pastTenseForm", auxiliary.pastTenseForm);
  check("presentParticipleForm", auxiliary.presentParticipleForm);
  check("pastParticipleForm", auxiliary.pastParticipleForm);
  check("modalForm", auxiliary.modalForm);
  check("secondaryModalForm", auxiliary.secondaryModalForm);
  return issues;
}
