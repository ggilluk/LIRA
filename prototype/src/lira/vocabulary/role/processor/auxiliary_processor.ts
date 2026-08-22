import { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Word } from "../../data/entities/word";
import { createWord, validateFormText, validateWordFormAttributes, type WordFormIssue } from "../word_processor";
import type { Auxiliary } from "../../data/entities/auxiliary";
import { stringPatternsFor } from "../../data/matrices/pos_vs_wordform_matrice";
import type { WordForms } from "../../data/word_forms";

export type AuxiliaryInit = Pick<Auxiliary, "text"> & Partial<Omit<Auxiliary, "text" | "partOfSpeech">>;

export function createAuxiliary(init: AuxiliaryInit): Auxiliary {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.AUXILIARY }) as Auxiliary;
}

export function isAuxiliary(word: Word): word is Auxiliary {
  return word.partOfSpeech === PartOfSpeech.AUXILIARY;
}

/** Validates every WordForm `auxiliary` carries (`wordForms.formsOf()`)
 * against WORD_FORM_MATRIX's own AUXILIARY rules
 * (data/matrices/pos_vs_wordform_matrice.ts) -- every one of them is
 * curated/irregular by design (no Auxiliary spelling is regex-derivable
 * the way a regular Verb's is), so this mostly confirms a form was
 * populated with a real string rather than catching a spelling-rule
 * violation the way validateVerb can. Unlike every other POS subtype's
 * own validateX(), this needs the Domain's own WordForms store passed
 * in -- Auxiliary's own forms aren't scalar fields on `auxiliary`
 * itself any more (data/entities/auxiliary.ts's own docstring). Returns
 * every issue found, not just the first. */
export function validateAuxiliary(auxiliary: Auxiliary, wordForms: WordForms): readonly WordFormIssue[] {
  const issues: WordFormIssue[] = [...validateWordFormAttributes(auxiliary)];
  for (const form of wordForms.formsOf(auxiliary)) {
    const issue = validateFormText(form.field, form.text, stringPatternsFor(form.field, PartOfSpeech.AUXILIARY));
    if (issue !== undefined) issues.push(issue);
  }
  return issues;
}
