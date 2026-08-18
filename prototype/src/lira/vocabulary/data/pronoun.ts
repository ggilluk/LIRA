/** Pronoun: Word's own PRONOUN-specific subtype -- the closed class
 * with the richest row of its own in the Word Form to Part of Speech
 * Matrix (data/word_form_part_of_speech_matrix.md), matching how much a
 * pronoun paradigm actually varies (I/me/my/mine/myself, he/him/his/
 * himself, ...) compared to every other closed class. Every field below
 * is undefined until a seeding/curation pass populates it -- the
 * Common Vocabulary Cache's own pronouns.json entries (word_seeder.ts's
 * own entryToWord()) don't set any of them today, the same "declared
 * before it's populated" shape Noun.isCountable and its siblings
 * already have. */

import type { Text } from "../../value_objects";
import { PartOfSpeech } from "./enums/part_of_speech";
import { createWord, validateFormText, validateWordFormAttributes, type Word, type WordFormIssue } from "./word";

export interface Pronoun extends Word {
  partOfSpeech: PartOfSpeech.PRONOUN;

  // The purpose is to identify the word form used when referring to
  // one person, thing, place, or idea. Applies only to a subset of
  // pronouns -- "each other"/"one another" have no distinct singular
  // form of their own the way "I"/"we" do. Fully lexical, not spelling-
  // derivable (the matrix's own Format/String Pattern rows are both
  // `N/A`) -- a populated value's own `Text.formats` should stay unset.
  singularNumberForm?: Text;
  // The purpose is to identify the word form used when referring to
  // more than one person, thing, place, or idea. Same subset-only
  // caveat, and same fully-lexical/no-`formats` note, as
  // singularNumberForm above.
  pluralNumberForm?: Text;
  // The purpose is to identify the word form used when the speaker
  // refers to themselves or to a group that includes them. Applies
  // only to a subset of pronouns -- "who"/"which" have no person of
  // their own the way "I"/"we" do. Unlike a spelling rule, rules #1-2
  // here are a closed fixed-word lookup, not real morphology -- rule #1
  // (`/^(I|me|my|mine|myself)$/i`) for the singular set, rule #2
  // (`/^(we|us|our|ours|ourselves)$/i`) for the plural one; a populated
  // value's own `Text.formats` should carry whichever matched. Rule #3
  // is Verb's own case (a first-person verb form like "am"), not
  // applicable here.
  firstPersonForm?: Text;
  // The purpose is to identify the word form used when referring to
  // the person or people being addressed. Same subset-only caveat as
  // firstPersonForm above. Rules #1-3 are closed fixed-word lookups:
  // #1 (`/^(you|your|yours)$/i`), #2 (`/^yourself$/i`), #3
  // (`/^yourselves$/i`) -- a populated value's own `Text.formats`
  // should carry whichever matched.
  secondPersonForm?: Text;
  // The purpose is to identify the word form used when referring to a
  // person, thing, place, or idea other than the speaker or listener.
  // Same subset-only caveat as firstPersonForm above. Rules #1-2 are
  // closed fixed-word lookups: #1
  // (`/^(he|she|it|him|her|his|hers|its|himself|herself|itself)$/i`)
  // for the singular set, #2 (`/^(they|them|their|theirs|themselves)$/i`)
  // for the plural one -- a populated value's own `Text.formats` should
  // carry whichever matched. Rule #3 is Verb's own case (a third-person
  // verb form like "is"), not applicable here.
  thirdPersonForm?: Text;
  // The purpose is to identify the pronoun form used for the person or
  // thing performing or experiencing what the clause describes. One
  // rule, a closed fixed-word lookup (`/^(I|we|you|he|she|it|they)$/i`)
  // -- a populated value's own `Text.formats` should carry it.
  subjectiveCaseForm?: Text;
  // The purpose is to identify the pronoun form used for the person or
  // thing affected by an action or following a preposition. One rule, a
  // closed fixed-word lookup (`/^(me|us|you|him|her|it|them)$/i`) -- a
  // populated value's own `Text.formats` should carry it.
  objectiveCaseForm?: Text;
  // The purpose is to identify the noun, pronoun, or determiner form
  // used to show that something belongs or relates to a person or
  // thing. Rule #3 is this class's own case -- a closed fixed-word
  // lookup (`/^(my|mine|your|yours|his|her|hers|its|our|ours|their|theirs)$/i`)
  // -- a populated value's own `Text.formats` should carry it. Rules
  // #1-2 (an apostrophe rule for an existing plural) are Noun's own
  // case, not applicable here.
  possessiveCaseForm?: Text;
  // The purpose is to identify the pronoun form used when a person or
  // thing refers back to itself, such as "myself" or "themselves".
  // Every rule here is regex-derivable (`/self$/i` for the singular
  // forms, `/selves$/i` for the plural ones) -- unlike most of this
  // subtype's own fields, this row has no closed-list-only or curated-
  // only branch at all, so a populated value's own `Text.formats`
  // should always carry the rule that matched.
  reflexiveCaseForm?: Text;
}

export type PronounInit = Pick<Pronoun, "text"> & Partial<Omit<Pronoun, "text" | "partOfSpeech">>;

export function createPronoun(init: PronounInit): Pronoun {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.PRONOUN }) as Pronoun;
}

export function isPronoun(word: Word): word is Pronoun {
  return word.partOfSpeech === PartOfSpeech.PRONOUN;
}

// Pronoun's own row of the matrix's String Pattern column (data/word_form_part_of_speech_matrix.md),
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
