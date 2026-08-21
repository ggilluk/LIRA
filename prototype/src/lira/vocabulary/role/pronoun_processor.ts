import type { Text } from "../../value_objects";
import { PartOfSpeech } from "../data/enums/part_of_speech";
import { createWord, validateFormText, validateWordFormAttributes, type Word, type WordFormIssue } from "../data/word";
import type { Pronoun } from "../data/entities/pronoun";

export type PronounInit = Pick<Pronoun, "text"> & Partial<Omit<Pronoun, "text" | "partOfSpeech">>;

export function createPronoun(init: PronounInit): Pronoun {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.PRONOUN }) as Pronoun;
}

export function isPronoun(word: Word): word is Pronoun {
  return word.partOfSpeech === PartOfSpeech.PRONOUN;
}

// Pronoun's own row of the matrix's String Pattern column (../data/word_form_part_of_speech_matrix.md),
// scoped to exactly the rules that apply to Pronoun specifically -- see
// each field's own docstring above for which numbered rule(s) these are
// and why the rest of that row's rules (another class's own) are simply
// absent here.
export const PRONOUN_FORM_PATTERNS: Readonly<Record<string, readonly string[]>> = {
  singularNumberForm: [],
  pluralNumberForm: [],
  firstPersonForm: ["/^(I|me|my|mine|myself)$/i", "/^(we|us|our|ours|ourselves)$/i"],
  secondPersonForm: ["/^(you|your|yours)$/i", "/^yourself$/i", "/^yourselves$/i"],
  thirdPersonForm: [
    "/^(he|she|it|him|her|his|hers|its|himself|herself|itself)$/i",
    "/^(they|them|their|theirs|themselves)$/i",
  ],
  subjectiveCaseForm: ["/^(I|we|you|he|she|it|they)$/i"],
  objectiveCaseForm: ["/^(me|us|you|him|her|it|them)$/i"],
  possessiveCaseForm: ["/^(my|mine|your|yours|his|her|hers|its|our|ours|their|theirs)$/i"],
  reflexiveCaseForm: ["/self$/i", "/selves$/i"],
};

/** Validates every *_Form field this Pronoun carries -- its own row
 * above, plus baseLemmaCanonicalForm via Word's own
 * validateWordFormAttributes -- against PRONOUN_FORM_PATTERNS. Returns
 * every issue found, not just the first; empty means every populated
 * field is internally consistent with the matrix, not that every field
 * is populated (undefined is never an issue, validateFormText's own
 * docstring). */
export function validatePronoun(pronoun: Pronoun): readonly WordFormIssue[] {
  const issues: WordFormIssue[] = [...validateWordFormAttributes(pronoun)];
  const check = (field: keyof typeof PRONOUN_FORM_PATTERNS, text: Text | undefined): void => {
    if (text === undefined) return;
    const issue = validateFormText(field, text, PRONOUN_FORM_PATTERNS[field]);
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
