/** The single closed set of `WordForm.field` names -- every row the
 * Word Form to Part of Speech Matrix declares
 * (data/matrices/pos_vs_wordform_matrice.ts) names one of these, and
 * every `WordForm` record (data/entities/word_form.ts) carries one as
 * its own `field`. String-valued, not tensor-coded like PartOfSpeech
 * (this folder's own usual convention) -- `field` is a
 * lookup key (`WordForms.findNamedForm()`/`registerNamedForm()`) and a
 * value real client-facing code already reads directly
 * (`ui/server/builder_word.ts`'s own `WordFormEntry.field`), not a
 * system-tensor dimension, so there is no numeric code to assign it.
 * Member keys still follow this folder's own UPPER_SNAKE_CASE
 * convention; each value is the exact camelCase string every existing
 * `WordForm`/matrix-row/JSON consumer already reads and writes,
 * unchanged -- this enum adds compile-time enforcement of the
 * already-agreed set, not a new runtime representation.
 *
 * Ordered the same as the Matrix's own row order
 * (data/matrices/pos_vs_wordform_matrice.ts). */
export enum WordFormField {
  BASE_LEMMA_CANONICAL_FORM = "baseLemmaCanonicalForm",
  SINGULAR_NUMBER_FORM = "singularNumberForm",
  PLURAL_NUMBER_FORM = "pluralNumberForm",
  PRESENT_TENSE_FORM = "presentTenseForm",
  PRESENT_TENSE_INSTANCE_FORM = "presentTenseInstanceForm",
  PAST_TENSE_FORM = "pastTenseForm",
  PAST_TENSE_INSTANCE_FORM = "pastTenseInstanceForm",
  THIRD_PERSON_SINGULAR_PRESENT_FORM = "thirdPersonSingularPresentForm",
  PRESENT_PARTICIPLE_FORM = "presentParticipleForm",
  PAST_PARTICIPLE_FORM = "pastParticipleForm",
  BARE_INFINITIVE_FORM = "bareInfinitiveForm",
  MODAL_FORM = "modalForm",
  SECONDARY_MODAL_FORM = "secondaryModalForm",
  POSITIVE_DEGREE_FORM = "positiveDegreeForm",
  COMPARATIVE_DEGREE_FORM = "comparativeDegreeForm",
  COMPARATIVE_PERIPHRASTIC_FORM = "comparativePeriphrasticForm",
  SUPERLATIVE_DEGREE_FORM = "superlativeDegreeForm",
  SUPERLATIVE_PERIPHRASTIC_FORM = "superlativePeriphrasticForm",
  FIRST_PERSON_FORM = "firstPersonForm",
  SECOND_PERSON_FORM = "secondPersonForm",
  THIRD_PERSON_FORM = "thirdPersonForm",
  SUBJECTIVE_CASE_FORM = "subjectiveCaseForm",
  OBJECTIVE_CASE_FORM = "objectiveCaseForm",
  POSSESSIVE_CASE_FORM = "possessiveCaseForm",
  CONSONANT_SOUND_FORM = "consonantSoundForm",
  VOWEL_SOUND_FORM = "vowelSoundForm",
  REFLEXIVE_CASE_FORM = "reflexiveCaseForm",
}
