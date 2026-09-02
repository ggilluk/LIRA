/** The single closed set of `WordForm.field` names -- every row the
 * Word Form to Part of Speech Matrix declares
 * (data/matrices/pos_vs_wordform_matrice.ts) names one of these, and
 * every `WordForm` record (data/entities/word_form.ts) carries one as
 * its own `field`.
 *
 * Values are numeric codes for use in a tensor, not string labels --
 * same convention as PartOfSpeech (data/enums/part_of_speech.ts) and
 * every other enum in this folder, `field` included now: an earlier
 * version of this enum was deliberately string-valued (the exact
 * camelCase spelling every `WordForm`/matrix-row/JSON consumer already
 * read and wrote), reasoned as a lookup key and a value real
 * client-facing code read directly rather than a system-tensor
 * dimension -- reversed here so `field` can participate in tensor
 * operations the same way every sibling enum already does.
 * `wordFormFieldLabel()` below is the one place that still needs the
 * human-readable camelCase-derived text this enum's own values used to
 * carry for free -- every GUI consumer now goes through it rather than
 * reading `field` as displayable text itself.
 *
 * Member keys still follow this folder's own UPPER_SNAKE_CASE
 * convention. Ordered the same as the Matrix's own row order
 * (data/matrices/pos_vs_wordform_matrice.ts) -- every numeric code
 * below is simply that row order, 0-based. */
export enum WordFormField {
  BASE_LEMMA_CANONICAL_FORM = 0,
  SINGULAR_NUMBER_FORM = 1,
  PLURAL_NUMBER_FORM = 2,
  PRESENT_TENSE_FORM = 3,
  PRESENT_TENSE_INSTANCE_FORM = 4,
  PAST_TENSE_FORM = 5,
  PAST_TENSE_INSTANCE_FORM = 6,
  THIRD_PERSON_SINGULAR_PRESENT_FORM = 7,
  PRESENT_PARTICIPLE_FORM = 8,
  PAST_PARTICIPLE_FORM = 9,
  BARE_INFINITIVE_FORM = 10,
  MODAL_FORM = 11,
  SECONDARY_MODAL_FORM = 12,
  POSITIVE_DEGREE_FORM = 13,
  COMPARATIVE_DEGREE_FORM = 14,
  COMPARATIVE_PERIPHRASTIC_FORM = 15,
  SUPERLATIVE_DEGREE_FORM = 16,
  SUPERLATIVE_PERIPHRASTIC_FORM = 17,
  FIRST_PERSON_FORM = 18,
  SECOND_PERSON_FORM = 19,
  THIRD_PERSON_FORM = 20,
  SUBJECTIVE_CASE_FORM = 21,
  OBJECTIVE_CASE_FORM = 22,
  POSSESSIVE_CASE_FORM = 23,
  CONSONANT_SOUND_FORM = 24,
  VOWEL_SOUND_FORM = 25,
  REFLEXIVE_CASE_FORM = 26,
}

/** `field`'s own human-readable text, for the GUI only -- the numeric
 * codes above carry no displayable text of their own the way the
 * earlier string-valued version of this enum did (that version's own
 * value literally *was* this text, camelCase; `formFieldLabel()`,
 * ui/server/builder_segment.ts, recovered Title Case from it with a
 * regex). Every one of the 27 entries below is that exact same
 * regex's own output, precomputed once here rather than derived
 * per-call from a value that no longer carries it -- kept in this file
 * rather than `builder_segment.ts` so the numeric code and its own
 * display text stay next to each other, the one place drift would
 * otherwise go unnoticed. `formFieldLabel()` itself is unrelated and
 * unchanged -- it still derives a label from an arbitrary camelCase
 * *string* (Word's own `isNominalised`/`isAdjectivised`/... derivation
 * flags, and the synthetic `"wordCharacterForms"` WordFormEntry row,
 * neither of which is a `WordFormField` member), so it can't be reused
 * here now that `field` itself is a number, not a string. */
export function wordFormFieldLabel(field: WordFormField): string {
  return WORD_FORM_FIELD_LABELS[field];
}

const WORD_FORM_FIELD_LABELS: Record<WordFormField, string> = {
  [WordFormField.BASE_LEMMA_CANONICAL_FORM]: "Base Lemma Canonical Form",
  [WordFormField.SINGULAR_NUMBER_FORM]: "Singular Number Form",
  [WordFormField.PLURAL_NUMBER_FORM]: "Plural Number Form",
  [WordFormField.PRESENT_TENSE_FORM]: "Present Tense Form",
  [WordFormField.PRESENT_TENSE_INSTANCE_FORM]: "Present Tense Instance Form",
  [WordFormField.PAST_TENSE_FORM]: "Past Tense Form",
  [WordFormField.PAST_TENSE_INSTANCE_FORM]: "Past Tense Instance Form",
  [WordFormField.THIRD_PERSON_SINGULAR_PRESENT_FORM]: "Third Person Singular Present Form",
  [WordFormField.PRESENT_PARTICIPLE_FORM]: "Present Participle Form",
  [WordFormField.PAST_PARTICIPLE_FORM]: "Past Participle Form",
  [WordFormField.BARE_INFINITIVE_FORM]: "Bare Infinitive Form",
  [WordFormField.MODAL_FORM]: "Modal Form",
  [WordFormField.SECONDARY_MODAL_FORM]: "Secondary Modal Form",
  [WordFormField.POSITIVE_DEGREE_FORM]: "Positive Degree Form",
  [WordFormField.COMPARATIVE_DEGREE_FORM]: "Comparative Degree Form",
  [WordFormField.COMPARATIVE_PERIPHRASTIC_FORM]: "Comparative Periphrastic Form",
  [WordFormField.SUPERLATIVE_DEGREE_FORM]: "Superlative Degree Form",
  [WordFormField.SUPERLATIVE_PERIPHRASTIC_FORM]: "Superlative Periphrastic Form",
  [WordFormField.FIRST_PERSON_FORM]: "First Person Form",
  [WordFormField.SECOND_PERSON_FORM]: "Second Person Form",
  [WordFormField.THIRD_PERSON_FORM]: "Third Person Form",
  [WordFormField.SUBJECTIVE_CASE_FORM]: "Subjective Case Form",
  [WordFormField.OBJECTIVE_CASE_FORM]: "Objective Case Form",
  [WordFormField.POSSESSIVE_CASE_FORM]: "Possessive Case Form",
  [WordFormField.CONSONANT_SOUND_FORM]: "Consonant Sound Form",
  [WordFormField.VOWEL_SOUND_FORM]: "Vowel Sound Form",
  [WordFormField.REFLEXIVE_CASE_FORM]: "Reflexive Case Form",
};
