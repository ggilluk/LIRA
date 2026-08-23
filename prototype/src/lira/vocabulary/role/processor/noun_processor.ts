import type { Text } from "../../../value_objects";
import { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Word } from "../../data/entities/word";
import type { WordForms } from "../../data/word_forms";
import { createWord, endsInConsonantY, validateFormText, validateWordFormAttributes, type WordFormIssue } from "../word_processor";
import type { Noun } from "../../data/entities/noun";
import { stringPatternsFor } from "../../data/matrices/pos_vs_wordform_matrice";

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

/** Validates every WordForm this Noun carries -- its own row above,
 * plus baseLemmaCanonicalForm via Word's own validateWordFormAttributes
 * -- against WORD_FORM_MATRIX's own NOUN rules
 * (data/matrices/pos_vs_wordform_matrice.ts). Returns every
 * issue found, not just the first; empty means every populated field
 * is internally consistent with the matrix, not that every field is
 * populated. validateAuxiliary()'s own exact shape
 * (role/processor/auxiliary_processor.ts). */
export function validateNoun(noun: Noun, wordForms: WordForms): readonly WordFormIssue[] {
  const issues: WordFormIssue[] = [...validateWordFormAttributes(noun)];
  for (const form of wordForms.formsOf(noun)) {
    const issue = validateFormText(form.field, form.text, stringPatternsFor(form.field, PartOfSpeech.NOUN));
    if (issue !== undefined) issues.push(issue);
  }
  return issues;
}

/** pluralNumberForm's own Generation Transform
 * (../../data/matrices/pos_vs_wordform_matrice.ts),
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

/** Registers this Noun's own derivable WordForms wherever not already
 * present, from its own base lemma (`noun.text`) -- WordSeeder's own
 * seeding entry points (role/word_seeder.ts) call this right after
 * createNoun(), so every seeded Noun (WordNet or Common Vocabulary
 * Cache alike) gets its regular-case forms populated automatically,
 * without a hand-authored Noun built elsewhere (a test fixture, say)
 * acquiring forms it never asked for just by calling createNoun(). No-op
 * when `wordForms` is undefined (mirrors `senseStore?:`'s own optional
 * convention throughout role/word_seeder.ts) -- produces a Noun with no
 * inflected forms beyond whatever's already registered. Only ever
 * registers a field not already present via
 * `WordForms.registerNamedForm()`'s own idempotent find-or-create --- an
 * explicitly-registered value (from an earlier call, or hand-curated
 * seeding) is never overwritten. Every value this produces is provably
 * one of that field's own recognised String Patterns (WORD_FORM_MATRIX's
 * own NOUN rules), by construction -- generateNounForms() and
 * validateNoun() are built from the exact same matrix rules, so a
 * freshly-generated Noun always passes its own validateNoun() unchanged.
 * Fields are registered in the same order they're declared on Noun
 * (singular, plural, possessive) so Word Forms UI display order stays
 * unaffected by this migration. Returns `noun` unchanged -- registration
 * is a side effect on `wordForms`, not a copy of `noun` itself. */
export function generateNounForms(noun: Noun, wordForms: WordForms | undefined): Noun {
  if (wordForms === undefined) return noun;
  const lemma = noun.text;
  const has = (field: string): boolean => wordForms.formsOf(noun).some((form) => form.field === field);
  if (!has("singularNumberForm")) wordForms.registerNamedForm(noun, "singularNumberForm", { value: lemma });
  if (!has("pluralNumberForm")) {
    const plural = generatedPluralNumberForm(lemma);
    if (plural !== undefined) wordForms.registerNamedForm(noun, "pluralNumberForm", plural);
  }
  if (!has("possessiveCaseForm")) wordForms.registerNamedForm(noun, "possessiveCaseForm", { value: `${lemma}'s`, formats: ["/'s$/i"] });
  return noun;
}
