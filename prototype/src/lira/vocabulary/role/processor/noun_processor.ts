import type { Text } from "../../../value_objects";
import { PartOfSpeech } from "../../data/enums/part_of_speech";
import { createWord, endsInConsonantY, validateFormText, validateWordFormAttributes, type Word, type WordFormIssue } from "../../data/word";
import type { Noun } from "../../data/entities/noun";
import { stringPatternsFor } from "../../data/matrices/word_form_part_of_speech_matrix";

export type NounInit = Pick<Noun, "text"> & Partial<Omit<Noun, "text" | "partOfSpeech">>;

export function createNoun(init: NounInit): Noun {
  const noun = createWord({ ...init, partOfSpeech: PartOfSpeech.NOUN }) as Noun;
  if (noun.isDerivedFromVerbIndicator === undefined) noun.isDerivedFromVerbIndicator = false;
  if (noun.isDerivedFromAdjectiveIndicator === undefined) noun.isDerivedFromAdjectiveIndicator = false;
  if (noun.wordCharacterForms === undefined) noun.wordCharacterForms = [];
  return noun;
}

export function isNoun(word: Word): word is Noun {
  return word.partOfSpeech === PartOfSpeech.NOUN;
}

/** Validates every *_Form field this Noun carries -- its own row above,
 * plus baseLemmaCanonicalForm via Word's own validateWordFormAttributes
 * -- against WORD_FORM_MATRIX's own NOUN rules
 * (data/matrices/word_form_part_of_speech_matrix.ts). Returns every
 * issue found, not just the first; empty means every populated field
 * is internally consistent with the matrix, not that every field is
 * populated (undefined is never an issue, validateFormText's own
 * docstring). */
export function validateNoun(noun: Noun): readonly WordFormIssue[] {
  const issues: WordFormIssue[] = [...validateWordFormAttributes(noun)];
  const check = (field: string, text: Text | undefined): void => {
    if (text === undefined) return;
    const issue = validateFormText(field, text, stringPatternsFor(field, PartOfSpeech.NOUN));
    if (issue !== undefined) issues.push(issue);
  };
  check("singularNumberForm", noun.singularNumberForm);
  check("pluralNumberForm", noun.pluralNumberForm);
  check("possessiveCaseForm", noun.possessiveCaseForm);
  return issues;
}

/** pluralNumberForm's own Generation Transform
 * (../../data/matrices/word_form_part_of_speech_matrix.ts),
 * regular-case rules #1-3 only -- rule #4 (`f`/`fe` -> `ves`) needs
 * "lexical qualification" the matrix's own row admits isn't spelling
 * alone ("roof" takes plain -s, "knife" takes -ves, and both end the
 * same way), so a lemma matching that shape is left undefined rather
 * than guessed either way; rules #5-6 (irregular/unchanged) have no
 * spelling signal to detect at all. */
function generatedPluralNumberForm(lemma: string): Text | undefined {
  if (endsInConsonantY(lemma)) return { value: `${lemma.slice(0, -1)}ies`, formats: ["/ies$/i"] };
  if (/(s|x|z|ch|sh)$/i.test(lemma)) return { value: `${lemma}es`, formats: ["/es$/i"] };
  if (/(f|fe)$/i.test(lemma)) return undefined;
  return { value: `${lemma}s`, formats: ["/s$/i"] };
}

/** Fills in this Noun's own derivable *_Form fields wherever still
 * undefined, from its own base lemma (`noun.text`) -- WordSeeder's own
 * seeding entry points (role/word_seeder.ts) call this right after
 * createNoun(), so every seeded Noun (WordNet or Common Vocabulary
 * Cache alike) gets its regular-case forms populated automatically,
 * without a hand-authored Noun built elsewhere (a test fixture, say)
 * acquiring fields it never asked for just by calling createNoun().
 * Only ever fills a field that's still undefined -- an explicitly-set
 * value (from `init`, or an earlier call) is never overwritten. Every
 * value this produces is provably one of that field's own recognised
 * String Patterns (WORD_FORM_MATRIX's own NOUN rules), by construction --
 * generateNounForms() and validateNoun() are built from the exact same
 * matrix rules, so a freshly-generated Noun always passes its own
 * validateNoun() unchanged. */
export function generateNounForms(noun: Noun): Noun {
  const lemma = noun.text;
  const generated: Partial<Noun> = {};
  if (noun.singularNumberForm === undefined) generated.singularNumberForm = { value: lemma };
  if (noun.pluralNumberForm === undefined) {
    const plural = generatedPluralNumberForm(lemma);
    if (plural !== undefined) generated.pluralNumberForm = plural;
  }
  if (noun.possessiveCaseForm === undefined) generated.possessiveCaseForm = { value: `${lemma}'s`, formats: ["/'s$/i"] };
  return { ...noun, ...generated };
}
