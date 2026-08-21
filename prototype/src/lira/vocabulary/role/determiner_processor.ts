import type { Text } from "../../value_objects";
import { PartOfSpeech } from "../data/enums/part_of_speech";
import { createWord, validateFormText, validateWordFormAttributes, type Word, type WordFormIssue } from "../data/word";
import type { Determiner } from "../data/entities/determiner";

export type DeterminerInit = Pick<Determiner, "text"> & Partial<Omit<Determiner, "text" | "partOfSpeech">>;

export function createDeterminer(init: DeterminerInit): Determiner {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.DETERMINER }) as Determiner;
}

export function isDeterminer(word: Word): word is Determiner {
  return word.partOfSpeech === PartOfSpeech.DETERMINER;
}

// Determiner's own row of the matrix's String Pattern column (../data/word_form_part_of_speech_matrix.md),
// scoped to exactly the rule that applies to Determiner specifically --
// see each field's own docstring above for why the rest of that row's
// rules (another class's own) are simply absent here.
export const DETERMINER_FORM_PATTERNS: Readonly<Record<string, readonly string[]>> = {
  singularNumberForm: [],
  pluralNumberForm: [],
  possessiveCaseForm: ["/^(my|mine|your|yours|his|her|hers|its|our|ours|their|theirs)$/i"],
};

/** Validates every *_Form field this Determiner carries -- its own row
 * above, plus baseLemmaCanonicalForm via Word's own
 * validateWordFormAttributes -- against DETERMINER_FORM_PATTERNS.
 * Returns every issue found, not just the first; empty means every
 * populated field is internally consistent with the matrix, not that
 * every field is populated (undefined is never an issue,
 * validateFormText's own docstring). */
export function validateDeterminer(determiner: Determiner): readonly WordFormIssue[] {
  const issues: WordFormIssue[] = [...validateWordFormAttributes(determiner)];
  const check = (field: keyof typeof DETERMINER_FORM_PATTERNS, text: Text | undefined): void => {
    if (text === undefined) return;
    const issue = validateFormText(field, text, DETERMINER_FORM_PATTERNS[field]);
    if (issue !== undefined) issues.push(issue);
  };
  check("singularNumberForm", determiner.singularNumberForm);
  check("pluralNumberForm", determiner.pluralNumberForm);
  check("possessiveCaseForm", determiner.possessiveCaseForm);
  return issues;
}
