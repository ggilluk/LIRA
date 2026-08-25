/** The Word Form to Part of Speech Matrix, as real data -- the single
 * source both the code (validateX()'s own String Pattern check) and
 * data/matrices/word_form_part_of_speech_matrix.md's own narrative
 * derive from, replacing what used to be six independent, hand-copied
 * `*_FORM_PATTERNS` constants (one per role/processor/*_processor.ts
 * file) with no structural link back to the documentation they were
 * each a partial, drift-prone slice of.
 *
 * `data/matrices/` is this codebase's home for a genuine multi-axis
 * cross-tabulation -- two or more independent classification
 * dimensions crossed against each other (here: which *_Form field,
 * by which numbered spelling rule, applies to which Part of Speech).
 * This is a different shape from data/enums/, which covers single-axis
 * closed value sets, including a plain key -> value lookup table where
 * the value side isn't itself a second classification axis (e.g.
 * VERB_FRAME_TEXT, data/enums/verb_framed_example_template.ts: frame
 * number -> example sentence, one axis). Only this one matrix exists
 * in code today; no shared generic `Matrix<Row>` type is introduced
 * ahead of a second real example -- what's reusable about this pattern
 * is organizational (this folder, "one real data source, everything
 * else derives a view from it, prose sits beside the data rather than
 * duplicating it"), not a shared TypeScript abstraction guessed at in
 * advance.
 *
 * Only one column of the matrix is mechanically consumed by code
 * today -- String Pattern (via stringPatternsFor(), validateX()'s own
 * check() closure, role/word_processor.ts's validateFormText()); POS
 * applicability (fieldsFor()) no longer has a caller now that every POS
 * subtype registers real `WordForm` records instead of scalar `*_Form`
 * fields. Every other column (Base Lemma Preconditions,
 * Base Lemma Pattern, Generation Transform, Reduction Transform,
 * Required Linguistic Data, Exception Lookup) is carried as real data
 * too -- so the .md's own table can eventually be generated from this
 * file rather than hand-maintained a second time -- but nothing here
 * makes those columns *executable*: the doc's own words, "None of the
 * Exception Lookup tables named here exist in this codebase yet," are
 * still true, and the real Generation/Reduction Transform logic stays
 * exactly where it already lives (role/processor/*_processor.ts's own
 * generateXForms()/regularEdForm()/etc.), described here only in
 * prose, not duplicated as a second implementation.
 *
 * `appliesTo` lives on each *rule*, not on the row -- verified against
 * every one of the six real `*_FORM_PATTERNS` tables this file
 * replaces: applicability is genuinely per-rule, not per-row. E.g.
 * "First Person Form" carries a Verb-only rule (an unmarked, empty-
 * pattern "explicit first-person verb form") alongside two Pronoun-only
 * rules with real regexes -- a row-level-only applicability map would
 * let Pronoun's own firstPersonForm be checked against Verb's empty
 * rule set, or vice versa. */

import { PartOfSpeech } from "../enums/part_of_speech";
import { WordFormField } from "../enums/word_forms_enum";

export interface WordFormRule {
  appliesTo: readonly PartOfSpeech[];
  format: string;
  baseLemmaPreconditions: string;
  baseLemmaPattern?: string;
  generationTransform: string;
  reductionTransform: string;
  stringPattern?: string;
  requiredLinguisticData: string;
  exceptionLookup?: string;
}

export interface WordFormRow {
  field: WordFormField;
  label: string;
  purpose: string;
  rules: readonly WordFormRule[];
}

const P = PartOfSpeech;

export const WORD_FORM_MATRIX: readonly WordFormRow[] = [
  {
    field: WordFormField.BASE_LEMMA_CANONICAL_FORM,
    label: "Base Lemma Canonical Form",
    purpose: "Identifies the standard dictionary form used to represent the word.",
    rules: [
      {
        appliesTo: [P.NOUN, P.VERB, P.ADJECTIVE, P.ADVERB, P.PRONOUN, P.DETERMINER, P.PREPOSITION, P.CONJUNCTION, P.INTERJECTION, P.NUMERAL, P.PARTICLE],
        format: "Uses the canonical lexical spelling. Example: dog, run, small, quickly.",
        baseLemmaPreconditions: "The word must have an explicitly assigned canonical lemma.",
        generationTransform: "Return the canonical lemma text unchanged.",
        reductionTransform: "Return the canonical lemma text unchanged.",
        requiredLinguisticData: "Canonical Lemma Classification.",
      },
    ],
  },
  {
    field: WordFormField.SINGULAR_NUMBER_FORM,
    label: "Singular Number Form",
    purpose: "Identifies the word form used when referring to one person, thing, place, or idea.",
    rules: [
      {
        appliesTo: [P.NOUN],
        format: "Uses the lexical singular spelling. Example: dog, child, person.",
        baseLemmaPreconditions: "The lemma must have a singular-number form identical to its canonical spelling.",
        generationTransform: "Return the canonical lemma unchanged.",
        reductionTransform: "Return the canonical lemma unchanged.",
        requiredLinguisticData: "Number Classification.",
        exceptionLookup: "Irregular Number Lookup.",
      },
      {
        appliesTo: [P.PRONOUN, P.DETERMINER],
        format: "Uses an explicitly assigned singular form where number changes the lexical spelling. Example: this, that.",
        baseLemmaPreconditions: "The lemma must have an explicitly assigned singular form.",
        generationTransform: "Return the assigned singular form.",
        reductionTransform: "Resolve the singular form to its canonical lemma.",
        requiredLinguisticData: "Lexical Form Mapping.",
        exceptionLookup: "Irregular Number Lookup.",
      },
    ],
  },
  {
    field: WordFormField.PLURAL_NUMBER_FORM,
    label: "Plural Number Form",
    purpose: "Identifies the word form used when referring to more than one person, thing, place, or idea.",
    rules: [
      {
        appliesTo: [P.NOUN],
        format: "Ends with -s. Example: cat → cats.",
        baseLemmaPreconditions: "The lemma must take the regular -s plural and must not satisfy a more specific plural rule.",
        generationTransform: "Append s.",
        reductionTransform: "Remove final s.",
        stringPattern: "/s$/i",
        requiredLinguisticData: "None.",
        exceptionLookup: "Irregular Plural Lookup.",
      },
      {
        appliesTo: [P.NOUN],
        format: "Ends with -es. Example: box → boxes.",
        baseLemmaPreconditions: "The lemma ends in s, x, z, ch, sh or another explicitly classified -es ending.",
        baseLemmaPattern: "/(s|x|z|ch|sh)$/i",
        generationTransform: "Append es.",
        reductionTransform: "Remove final es.",
        stringPattern: "/es$/i",
        requiredLinguisticData: "Orthographic Ending.",
        exceptionLookup: "Irregular Plural Lookup.",
      },
      {
        appliesTo: [P.NOUN],
        format: "Changes -y to -ies. Example: city → cities.",
        baseLemmaPreconditions: "The lemma ends in consonant + y.",
        baseLemmaPattern: "/[^aeiou]y$/i",
        generationTransform: "Remove final y and append ies.",
        reductionTransform: "Remove final ies and append y.",
        stringPattern: "/ies$/i",
        requiredLinguisticData: "Orthographic Ending.",
        exceptionLookup: "Irregular Plural Lookup.",
      },
      {
        appliesTo: [P.NOUN],
        format: "Changes -f/-fe to -ves where applicable. Example: knife → knives.",
        baseLemmaPreconditions: "The lemma is lexically classified as taking -ves.",
        baseLemmaPattern: "/(f|fe)$/i plus lexical qualification",
        generationTransform: "Remove final f or fe and append ves.",
        reductionTransform: "Remove final ves and restore the lexically assigned f or fe ending.",
        stringPattern: "/ves$/i",
        requiredLinguisticData: "Lexical Plural Class.",
        exceptionLookup: "Irregular Plural Lookup.",
      },
      {
        appliesTo: [P.NOUN],
        format: "Uses an irregular spelling. Example: child → children.",
        baseLemmaPreconditions: "The lemma has an irregular plural mapping.",
        generationTransform: "Return the mapped irregular plural.",
        reductionTransform: "Resolve the irregular plural to its lemma.",
        requiredLinguisticData: "Lexical Exception Data.",
        exceptionLookup: "Irregular Plural Lookup.",
      },
      {
        appliesTo: [P.NOUN],
        format: "Uses an unchanged spelling. Example: sheep → sheep.",
        baseLemmaPreconditions: "The lemma is classified as having an unchanged plural.",
        generationTransform: "Return the lemma unchanged.",
        reductionTransform: "Resolve the unchanged form through its lexical number classification.",
        requiredLinguisticData: "Lexical Number Classification.",
        exceptionLookup: "Irregular Plural Lookup.",
      },
      // Not one of the .md table's own six numbered Format cells (those
      // are all Noun-specific pluralization spellings) -- Pronoun/
      // Determiner's own pluralNumberForm mirrors singularNumberForm's
      // own rule 2 (an explicitly assigned lexical form, not a spelling
      // rule), which the doc's applicability row (Pronoun ✓*, Determiner
      // ✓*) already implies but never writes out as its own numbered
      // case. Confirmed against the real code this replaces: both
      // PRONOUN_FORM_PATTERNS.pluralNumberForm and
      // DETERMINER_FORM_PATTERNS.pluralNumberForm were `[]` (String
      // Pattern N/A).
      {
        appliesTo: [P.PRONOUN, P.DETERMINER],
        format: "Uses an explicitly assigned plural form where number changes the lexical spelling (mirrors Singular Number Form's own rule 2). Example: these, those.",
        baseLemmaPreconditions: "The lemma must have an explicitly assigned plural form.",
        generationTransform: "Return the assigned plural form.",
        reductionTransform: "Resolve the plural form to its canonical lemma.",
        requiredLinguisticData: "Lexical Form Mapping.",
        exceptionLookup: "Irregular Number Lookup.",
      },
    ],
  },
  {
    field: WordFormField.PRESENT_TENSE_FORM,
    label: "Present Tense Form",
    purpose: "Identifies the verb form used for an action, event, or state that occurs or exists in the present.",
    rules: [
      {
        appliesTo: [P.VERB],
        format: "Uses the base verb spelling. Example: walk → walk.",
        baseLemmaPreconditions: "The verb must use its uninflected present form for the applicable person and number.",
        generationTransform: "Return the base lemma unchanged.",
        reductionTransform: "Return the form unchanged as the base lemma.",
        requiredLinguisticData: "Person and Number Context.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
      {
        appliesTo: [P.VERB, P.AUXILIARY],
        format: "Uses an irregular present form. Example: be → am, be → are.",
        baseLemmaPreconditions: "The verb must have an explicitly assigned irregular present form.",
        generationTransform: "Return the mapped present form.",
        reductionTransform: "Resolve the irregular form to its lemma.",
        requiredLinguisticData: "Irregular Verb Data.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
    ],
  },
  {
    field: WordFormField.PRESENT_TENSE_INSTANCE_FORM,
    label: "Present Tense Instance Form",
    purpose:
      "Identifies the present-tense verb form tied to one specific Determiner/pronoun, distinct from the general Present Tense Form shared by every other Determiner this lemma doesn't single out. AUXILIARY-only -- 'be' is the only lemma in this codebase that needs a distinct form for one specific Determiner beyond the ordinary Third Person Singular Present Form split every Verb already has ('am', Determiner: I, vs. 'are', every other Determiner Present Tense Form already covers).",
    rules: [
      {
        appliesTo: [P.AUXILIARY],
        format: "Uses an irregular, lexically fixed spelling tied to one specific Determiner. Example: be → am (Determiner: I).",
        baseLemmaPreconditions: "The lemma must have an explicitly assigned Determiner-specific present form.",
        generationTransform: "Return the mapped Determiner-specific present form.",
        reductionTransform: "Resolve the form to its lemma.",
        requiredLinguisticData: "Lexical Exception Data; Determiner Agreement.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
    ],
  },
  {
    field: WordFormField.PAST_TENSE_FORM,
    label: "Past Tense Form",
    purpose: "Identifies the verb form used for an action, event, or state that occurred or existed in the past.",
    rules: [
      {
        appliesTo: [P.VERB],
        format: "Adds -ed. Example: walk → walked.",
        baseLemmaPreconditions: "The lemma takes regular -ed and does not satisfy a more specific rule.",
        generationTransform: "Append ed.",
        reductionTransform: "Remove final ed.",
        stringPattern: "/ed$/i",
        requiredLinguisticData: "None.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
      {
        appliesTo: [P.VERB],
        format: "Adds -d after final e. Example: love → loved.",
        baseLemmaPreconditions: "The lemma ends in e.",
        baseLemmaPattern: "/e$/i",
        generationTransform: "Append d.",
        reductionTransform: "Remove final d.",
        stringPattern: "/ed$/i",
        requiredLinguisticData: "Orthographic Ending.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
      {
        appliesTo: [P.VERB],
        format: "Changes -y to -ied. Example: try → tried.",
        baseLemmaPreconditions: "The lemma ends in consonant + y.",
        baseLemmaPattern: "/[^aeiou]y$/i",
        generationTransform: "Remove final y and append ied.",
        reductionTransform: "Remove final ied and append y.",
        stringPattern: "/ied$/i",
        requiredLinguisticData: "Orthographic Ending.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
      {
        appliesTo: [P.VERB],
        format: "Doubles the final consonant before -ed. Example: stop → stopped.",
        baseLemmaPreconditions: "The lemma satisfies the final-consonant doubling rule.",
        baseLemmaPattern: "Orthographic candidate pattern plus stress and syllable conditions",
        generationTransform: "Duplicate the final consonant and append ed.",
        reductionTransform: "Remove final ed, then remove one duplicated final consonant.",
        stringPattern: "/([bcdfghjklmnpqrstvwxyz])\\1ed$/i",
        requiredLinguisticData: "Syllable Count; Stress Pattern; Final Phoneme/Letter Pattern.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
      {
        appliesTo: [P.VERB],
        format: "Uses an irregular spelling. Example: run → ran.",
        baseLemmaPreconditions: "The lemma has an irregular past-tense mapping.",
        generationTransform: "Return the mapped irregular past form.",
        reductionTransform: "Resolve the irregular past form to its lemma.",
        requiredLinguisticData: "Lexical Exception Data.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
      {
        appliesTo: [P.VERB],
        format: "Uses an unchanged spelling. Example: cut → cut.",
        baseLemmaPreconditions: "The lemma is classified as unchanged in the past tense.",
        generationTransform: "Return the lemma unchanged.",
        reductionTransform: "Resolve the unchanged form through lexical tense classification.",
        requiredLinguisticData: "Lexical Tense Classification.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
      {
        appliesTo: [P.AUXILIARY],
        format: "Uses an irregular spelling covering every Determiner this lemma doesn't single out via Past Tense Instance Form. Example: be → were (we/you/they); have → had; do → did.",
        baseLemmaPreconditions: "The lemma has an explicitly assigned irregular past-tense mapping.",
        generationTransform: "Return the mapped irregular past form.",
        reductionTransform: "Resolve the irregular past form to its lemma.",
        requiredLinguisticData: "Lexical Exception Data.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
    ],
  },
  {
    field: WordFormField.PAST_TENSE_INSTANCE_FORM,
    label: "Past Tense Instance Form",
    purpose:
      "Identifies the past-tense verb form tied to one specific Determiner/pronoun -- Present Tense Instance Form's own exact past-tense counterpart. AUXILIARY-only, and only 'be' needs it: 'was' (Determiner: I/he/she/it) vs. 'were', the general Past Tense Form covering we/you/they.",
    rules: [
      {
        appliesTo: [P.AUXILIARY],
        format: "Uses an irregular, lexically fixed spelling tied to one specific Determiner. Example: be → was (Determiner: I/he/she/it).",
        baseLemmaPreconditions: "The lemma must have an explicitly assigned Determiner-specific past form.",
        generationTransform: "Return the mapped Determiner-specific past form.",
        reductionTransform: "Resolve the form to its lemma.",
        requiredLinguisticData: "Lexical Exception Data; Determiner Agreement.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
    ],
  },
  {
    field: WordFormField.THIRD_PERSON_SINGULAR_PRESENT_FORM,
    label: "Third Person Singular Present Form",
    purpose: "Identifies the present-tense verb form used when the subject is one person or thing other than the speaker or listener.",
    rules: [
      {
        appliesTo: [P.VERB],
        format: "Adds -s. Example: run → runs.",
        baseLemmaPreconditions: "The lemma takes regular -s and does not satisfy a more specific rule.",
        generationTransform: "Append s.",
        reductionTransform: "Remove final s.",
        stringPattern: "/s$/i",
        requiredLinguisticData: "None.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
      {
        appliesTo: [P.VERB],
        format: "Adds -es. Example: watch → watches.",
        baseLemmaPreconditions: "The lemma ends in an -es triggering spelling.",
        baseLemmaPattern: "/(s|x|z|ch|sh|o)$/i with lexical qualification",
        generationTransform: "Append es.",
        reductionTransform: "Remove final es.",
        stringPattern: "/es$/i",
        requiredLinguisticData: "Orthographic Ending.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
      {
        appliesTo: [P.VERB],
        format: "Changes -y to -ies. Example: try → tries.",
        baseLemmaPreconditions: "The lemma ends in consonant + y.",
        baseLemmaPattern: "/[^aeiou]y$/i",
        generationTransform: "Remove final y and append ies.",
        reductionTransform: "Remove final ies and append y.",
        stringPattern: "/ies$/i",
        requiredLinguisticData: "Orthographic Ending.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
      {
        appliesTo: [P.VERB, P.AUXILIARY],
        format: "Uses an irregular spelling. Example: have → has, be → is.",
        baseLemmaPreconditions: "The lemma has an irregular third-person singular form.",
        generationTransform: "Return the mapped irregular form.",
        reductionTransform: "Resolve the irregular form to its lemma.",
        requiredLinguisticData: "Lexical Exception Data.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
    ],
  },
  {
    field: WordFormField.PRESENT_PARTICIPLE_FORM,
    label: "Present Participle Form",
    purpose: "Identifies the verb form used to describe an action or state as ongoing.",
    rules: [
      {
        appliesTo: [P.VERB, P.AUXILIARY],
        format: "Adds -ing. Example: walk → walking; have → having; be → being.",
        baseLemmaPreconditions: "The lemma takes regular -ing and does not satisfy a more specific rule.",
        generationTransform: "Append ing.",
        reductionTransform: "Remove final ing.",
        stringPattern: "/ing$/i",
        requiredLinguisticData: "None.",
        exceptionLookup: "Irregular Verb/Form Lookup.",
      },
      {
        appliesTo: [P.VERB],
        format: "Removes final e and adds -ing. Example: write → writing.",
        baseLemmaPreconditions: "The lemma ends in a removable silent e.",
        baseLemmaPattern: "/e$/i plus silent-e qualification",
        generationTransform: "Remove final e and append ing.",
        reductionTransform: "Remove final ing and restore e.",
        stringPattern: "/ing$/i",
        requiredLinguisticData: "Silent-E Classification / Pronunciation.",
        exceptionLookup: "Irregular Verb/Form Lookup.",
      },
      {
        appliesTo: [P.VERB],
        format: "Doubles the final consonant and adds -ing. Example: run → running.",
        baseLemmaPreconditions: "The lemma satisfies the final-consonant doubling rule.",
        baseLemmaPattern: "Orthographic candidate pattern plus stress and syllable conditions",
        generationTransform: "Duplicate final consonant and append ing.",
        reductionTransform: "Remove final ing, then remove one duplicated final consonant.",
        stringPattern: "/([bcdfghjklmnpqrstvwxyz])\\1ing$/i",
        requiredLinguisticData: "Syllable Count; Stress Pattern; Final Phoneme/Letter Pattern.",
        exceptionLookup: "Irregular Verb/Form Lookup.",
      },
      {
        appliesTo: [P.VERB],
        format: "Changes -ie to -ying. Example: lie → lying.",
        baseLemmaPreconditions: "The lemma ends in ie.",
        baseLemmaPattern: "/ie$/i",
        generationTransform: "Remove final ie and append ying.",
        reductionTransform: "Remove final ying and append ie.",
        stringPattern: "/ying$/i",
        requiredLinguisticData: "Orthographic Ending.",
        exceptionLookup: "Irregular Verb/Form Lookup.",
      },
    ],
  },
  {
    field: WordFormField.PAST_PARTICIPLE_FORM,
    label: "Past Participle Form",
    purpose: "Identifies the verb form used to construct perfect tenses and passive expressions.",
    rules: [
      {
        appliesTo: [P.VERB],
        format: "Adds -ed. Example: walk → walked.",
        baseLemmaPreconditions: "The lemma takes regular -ed.",
        generationTransform: "Append ed.",
        reductionTransform: "Remove final ed.",
        stringPattern: "/ed$/i",
        requiredLinguisticData: "Orthography.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
      {
        appliesTo: [P.VERB],
        format: "Adds -d. Example: love → loved.",
        baseLemmaPreconditions: "The lemma ends in e.",
        baseLemmaPattern: "/e$/i",
        generationTransform: "Append d.",
        reductionTransform: "Remove final d.",
        stringPattern: "/ed$/i",
        requiredLinguisticData: "Orthography.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
      {
        appliesTo: [P.VERB],
        format: "Changes -y to -ied. Example: try → tried.",
        baseLemmaPreconditions: "The lemma ends in consonant + y.",
        baseLemmaPattern: "/[^aeiou]y$/i",
        generationTransform: "Remove final y and append ied.",
        reductionTransform: "Remove ied and restore y.",
        stringPattern: "/ied$/i",
        requiredLinguisticData: "Orthography.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
      {
        appliesTo: [P.VERB],
        format: "Doubles the final consonant before -ed. Example: stop → stopped.",
        baseLemmaPreconditions: "The lemma satisfies the final-consonant doubling rule.",
        baseLemmaPattern: "Orthographic candidate pattern plus stress and syllable conditions",
        generationTransform: "Duplicate the final consonant and append ed.",
        reductionTransform: "Remove final ed, then remove one duplicated final consonant.",
        stringPattern: "/([bcdfghjklmnpqrstvwxyz])\\1ed$/i",
        requiredLinguisticData: "Syllable Count; Stress Pattern; Final Phoneme/Letter Pattern.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
      {
        appliesTo: [P.VERB, P.AUXILIARY],
        format: "Uses an irregular -en/-n form. Example: write → written; be → been.",
        baseLemmaPreconditions: "The lemma has an explicitly mapped irregular participle ending in -en/-n.",
        generationTransform: "Return mapped -en/-n participle.",
        reductionTransform: "Resolve mapped participle to lemma.",
        stringPattern: "/(en|n)$/i",
        requiredLinguisticData: "Lexical Exception Data.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
      {
        appliesTo: [P.VERB, P.AUXILIARY],
        format: "Uses another irregular spelling. Example: go → gone; have → had.",
        baseLemmaPreconditions: "The lemma has another irregular participle mapping.",
        generationTransform: "Return mapped irregular participle.",
        reductionTransform: "Resolve mapped participle to lemma.",
        requiredLinguisticData: "Lexical Exception Data.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
      {
        appliesTo: [P.VERB],
        format: "Uses an unchanged spelling. Example: cut → cut.",
        baseLemmaPreconditions: "The lemma has an unchanged past participle.",
        generationTransform: "Return lemma unchanged.",
        reductionTransform: "Resolve unchanged form through lexical participle classification.",
        requiredLinguisticData: "Lexical Exception Data.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
    ],
  },
  {
    field: WordFormField.BARE_INFINITIVE_FORM,
    label: "Bare Infinitive Form",
    purpose: "Identifies the basic verb form used without the word to.",
    rules: [
      {
        appliesTo: [P.VERB, P.AUXILIARY],
        format: "Uses the canonical uninflected verb spelling. Example: run, walk, be, have, do.",
        baseLemmaPreconditions: "The word must be classified as a verb lemma capable of bare-infinitive use.",
        generationTransform: "Return the base lemma unchanged.",
        reductionTransform: "Return the form as its canonical verb lemma.",
        requiredLinguisticData: "Verb Classification; Syntactic Context.",
      },
    ],
  },
  {
    field: WordFormField.MODAL_FORM,
    label: "Modal Form",
    purpose:
      "Identifies the primary spelling of a modal or semi-modal auxiliary -- can, may, shall, will, must, ought, need, dare. AUXILIARY-only: in this invariant auxiliary use a modal has no infinitive, no participle, and no person/number agreement of its own, so none of the Verb-style *_Form fields above ever apply to it -- this and Secondary Modal Form below are the only two fields a modal lemma's Auxiliary Word ever populates (need/dare's own ordinary lexical-verb use, which does inflect regularly, is a separate VERB Word, out of this row's scope).",
    rules: [
      {
        appliesTo: [P.AUXILIARY],
        format: "Uses the canonical, fully lexical modal spelling. Example: can, may, shall, will, must, ought.",
        baseLemmaPreconditions: "The word must be classified as a modal auxiliary lemma.",
        generationTransform: "Return the base lemma unchanged.",
        reductionTransform: "Return the form as its canonical modal lemma.",
        requiredLinguisticData: "Modal Classification.",
      },
    ],
  },
  {
    field: WordFormField.SECONDARY_MODAL_FORM,
    label: "Secondary Modal Form",
    purpose:
      "Identifies the secondary/preterite-present spelling paired with a modal's own Modal Form -- could, might, should, would. Undefined for must/ought, which are defective and have no secondary form at all (a genuine lexical gap, not an unpopulated placeholder).",
    rules: [
      {
        appliesTo: [P.AUXILIARY],
        format: "Uses an irregular, lexically fixed secondary spelling. Example: can → could, may → might, shall → should, will → would.",
        baseLemmaPreconditions: "The lemma must have an explicitly assigned secondary modal form.",
        generationTransform: "Return the mapped secondary modal form.",
        reductionTransform: "Resolve the secondary form to its primary modal lemma.",
        requiredLinguisticData: "Lexical Exception Data.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
    ],
  },
  {
    field: WordFormField.POSITIVE_DEGREE_FORM,
    label: "Positive Degree Form",
    purpose: "Identifies the basic adjective or adverb form that describes a quality without comparison.",
    rules: [
      {
        appliesTo: [P.ADJECTIVE, P.ADVERB],
        format: "Uses the lexical positive-degree spelling, whether or not the lemma is gradable. Example: small, fast, good, ablative.",
        baseLemmaPreconditions: "None -- every Adjective/Adverb gets a Positive Degree Form; only Comparative/Superlative Degree Form require gradability.",
        generationTransform: "Return the positive-degree lexical form (the lemma itself).",
        reductionTransform: "Resolve the positive form to its canonical lemma.",
        requiredLinguisticData: "None.",
        exceptionLookup: "N/A -- Positive Degree Form is always the lemma itself; irregularity only ever appears in Comparative/Superlative Degree Form (good → better/best), never here.",
      },
    ],
  },
  {
    field: WordFormField.COMPARATIVE_DEGREE_FORM,
    label: "Comparative Degree Form",
    purpose: "Identifies the adjective or adverb word form used to express a greater or lesser degree of a quality.",
    rules: [
      {
        appliesTo: [P.ADJECTIVE, P.ADVERB],
        format: "Adds -er. Example: small → smaller.",
        baseLemmaPreconditions: "The lemma is gradable, eligible for regular -er comparison, and no more specific rule applies.",
        generationTransform: "Append er.",
        reductionTransform: "Remove final er.",
        stringPattern: "/er$/i",
        requiredLinguisticData: "Gradability Classification; Degree Strategy Classification.",
        exceptionLookup: "Irregular Comparative Lookup.",
      },
      {
        appliesTo: [P.ADJECTIVE, P.ADVERB],
        format: "Adds -r after final e. Example: large → larger.",
        baseLemmaPreconditions: "The lemma is gradable and ends in e.",
        baseLemmaPattern: "/e$/i",
        generationTransform: "Append r.",
        reductionTransform: "Remove final r.",
        stringPattern: "/er$/i",
        requiredLinguisticData: "Gradability Classification; Degree Strategy Classification.",
        exceptionLookup: "Irregular Comparative Lookup.",
      },
      {
        appliesTo: [P.ADJECTIVE, P.ADVERB],
        format: "Changes -y to -ier. Example: happy → happier.",
        baseLemmaPreconditions: "The lemma is gradable and ends in consonant + y.",
        baseLemmaPattern: "/[^aeiou]y$/i",
        generationTransform: "Remove y and append ier.",
        reductionTransform: "Remove ier and append y.",
        stringPattern: "/ier$/i",
        requiredLinguisticData: "Gradability Classification; Degree Strategy Classification.",
        exceptionLookup: "Irregular Comparative Lookup.",
      },
      {
        appliesTo: [P.ADJECTIVE, P.ADVERB],
        format: "Doubles final consonant and adds -er. Example: big → bigger.",
        baseLemmaPreconditions: "The lemma is gradable and satisfies the final-consonant doubling rule.",
        baseLemmaPattern: "Orthographic candidate plus stress/syllable conditions",
        generationTransform: "Duplicate final consonant and append er.",
        reductionTransform: "Remove er, then remove one duplicated consonant.",
        stringPattern: "/([bcdfghjklmnpqrstvwxyz])\\1er$/i",
        requiredLinguisticData: "Gradability Classification; Syllable Count; Stress Pattern; Final Phoneme/Letter Pattern.",
        exceptionLookup: "Irregular Comparative Lookup.",
      },
      {
        appliesTo: [P.ADJECTIVE, P.ADVERB],
        format: "Uses an irregular spelling. Example: good → better.",
        baseLemmaPreconditions: "The lemma is gradable and has an irregular comparative form.",
        generationTransform: "Return mapped irregular comparative.",
        reductionTransform: "Resolve irregular comparative to lemma.",
        requiredLinguisticData: "Gradability Classification; Lexical Exception Data.",
        exceptionLookup: "Irregular Comparative Lookup.",
      },
      {
        appliesTo: [P.ADJECTIVE, P.ADVERB],
        format: "Uses periphrastic comparison instead of a suffix, for a lemma too long for a synthetic ending. Example: accepting → more accepting.",
        baseLemmaPreconditions:
          "The lemma is gradable but not eligible for synthetic comparison (three or more syllables, or two syllables without a synthetic-eligible ending). A non-gradable lemma satisfies none of these six and gets no Comparative Degree Form at all.",
        baseLemmaPattern: "N/A -- syllable-count heuristic, not a fixed spelling pattern (Required Linguistic Data)",
        generationTransform: 'Prefix "more " to the positive form.',
        reductionTransform: 'Remove leading "more ".',
        stringPattern: "/^more\\s+.+$/i",
        requiredLinguisticData: "Gradability Classification; Syllable Count.",
        exceptionLookup: "N/A.",
      },
    ],
  },
  {
    field: WordFormField.COMPARATIVE_PERIPHRASTIC_FORM,
    label: "Comparative Periphrastic Form",
    purpose:
      "Documents English's general periphrastic-comparison pattern (a separate comparative word rather than changing the adjective or adverb itself) -- neither POS subtype this prototype implements carries this as its own field; both fold the periphrastic value into Comparative Degree Form directly instead.",
    rules: [
      {
        appliesTo: [],
        format: "Places more before the positive form. Example: beautiful → more beautiful.",
        baseLemmaPreconditions: "The lemma must be classified as using or permitting periphrastic comparison.",
        generationTransform: "Prefix more + space to the positive form.",
        reductionTransform: "Remove leading more + space.",
        stringPattern: "/^more\\s+.+$/i",
        requiredLinguisticData: "Degree Strategy Classification; Phrase Construction.",
        exceptionLookup: "Degree Strategy Exception Lookup.",
      },
      {
        appliesTo: [],
        format: "Places less before the positive form. Example: effective → less effective.",
        baseLemmaPreconditions: "The lemma must be classified as using or permitting periphrastic comparison.",
        generationTransform: "Prefix less + space to the positive form.",
        reductionTransform: "Remove leading less + space.",
        stringPattern: "/^less\\s+.+$/i",
        requiredLinguisticData: "Degree Strategy Classification; Phrase Construction.",
        exceptionLookup: "Degree Strategy Exception Lookup.",
      },
    ],
  },
  {
    field: WordFormField.SUPERLATIVE_DEGREE_FORM,
    label: "Superlative Degree Form",
    purpose: "Identifies the adjective or adverb word form used to express the highest or lowest degree of a quality.",
    rules: [
      {
        appliesTo: [P.ADJECTIVE, P.ADVERB],
        format: "Adds -est. Example: small → smallest.",
        baseLemmaPreconditions: "The lemma is gradable, eligible for regular -est formation, and no more specific rule applies.",
        generationTransform: "Append est.",
        reductionTransform: "Remove final est.",
        stringPattern: "/est$/i",
        requiredLinguisticData: "Gradability Classification; Degree Strategy Classification.",
        exceptionLookup: "Irregular Superlative Lookup.",
      },
      {
        appliesTo: [P.ADJECTIVE, P.ADVERB],
        format: "Adds -st after final e. Example: large → largest.",
        baseLemmaPreconditions: "The lemma is gradable and ends in e.",
        baseLemmaPattern: "/e$/i",
        generationTransform: "Append st.",
        reductionTransform: "Remove final st.",
        stringPattern: "/est$/i",
        requiredLinguisticData: "Gradability Classification; Degree Strategy Classification.",
        exceptionLookup: "Irregular Superlative Lookup.",
      },
      {
        appliesTo: [P.ADJECTIVE, P.ADVERB],
        format: "Changes -y to -iest. Example: happy → happiest.",
        baseLemmaPreconditions: "The lemma is gradable and ends in consonant + y.",
        baseLemmaPattern: "/[^aeiou]y$/i",
        generationTransform: "Remove y and append iest.",
        reductionTransform: "Remove iest and append y.",
        stringPattern: "/iest$/i",
        requiredLinguisticData: "Gradability Classification; Degree Strategy Classification.",
        exceptionLookup: "Irregular Superlative Lookup.",
      },
      {
        appliesTo: [P.ADJECTIVE, P.ADVERB],
        format: "Doubles final consonant and adds -est. Example: big → biggest.",
        baseLemmaPreconditions: "The lemma is gradable and satisfies the final-consonant doubling rule.",
        baseLemmaPattern: "Orthographic candidate plus stress/syllable conditions",
        generationTransform: "Duplicate final consonant and append est.",
        reductionTransform: "Remove est, then remove one duplicated consonant.",
        stringPattern: "/([bcdfghjklmnpqrstvwxyz])\\1est$/i",
        requiredLinguisticData: "Gradability Classification; Syllable Count; Stress Pattern; Final Phoneme/Letter Pattern.",
        exceptionLookup: "Irregular Superlative Lookup.",
      },
      {
        appliesTo: [P.ADJECTIVE, P.ADVERB],
        format: "Uses an irregular spelling. Example: good → best.",
        baseLemmaPreconditions: "The lemma is gradable and has an irregular superlative form.",
        generationTransform: "Return mapped irregular superlative.",
        reductionTransform: "Resolve irregular superlative to lemma.",
        requiredLinguisticData: "Gradability Classification; Lexical Exception Data.",
        exceptionLookup: "Irregular Superlative Lookup.",
      },
      {
        appliesTo: [P.ADJECTIVE, P.ADVERB],
        format: "Uses periphrastic comparison instead of a suffix, for a lemma too long for a synthetic ending. Example: accepting → most accepting.",
        baseLemmaPreconditions:
          "The lemma is gradable but not eligible for synthetic comparison (three or more syllables, or two syllables without a synthetic-eligible ending). A non-gradable lemma satisfies none of these six and gets no Superlative Degree Form at all.",
        baseLemmaPattern: "N/A -- syllable-count heuristic, not a fixed spelling pattern (Required Linguistic Data)",
        generationTransform: 'Prefix "most " to the positive form.',
        reductionTransform: 'Remove leading "most ".',
        stringPattern: "/^most\\s+.+$/i",
        requiredLinguisticData: "Gradability Classification; Syllable Count.",
        exceptionLookup: "N/A.",
      },
    ],
  },
  {
    field: WordFormField.SUPERLATIVE_PERIPHRASTIC_FORM,
    label: "Superlative Periphrastic Form",
    purpose:
      "Documents English's general periphrastic-superlative pattern (a separate superlative word rather than changing the adjective or adverb itself) -- neither POS subtype this prototype implements carries this as its own field; both fold the periphrastic value into Superlative Degree Form directly instead.",
    rules: [
      {
        appliesTo: [],
        format: "Places most before the positive form. Example: beautiful → most beautiful.",
        baseLemmaPreconditions: "The lemma must be classified as using or permitting periphrastic superlative construction.",
        generationTransform: "Prefix most + space.",
        reductionTransform: "Remove leading most + space.",
        stringPattern: "/^most\\s+.+$/i",
        requiredLinguisticData: "Degree Strategy Classification; Phrase Construction.",
        exceptionLookup: "Degree Strategy Exception Lookup.",
      },
      {
        appliesTo: [],
        format: "Places least before the positive form. Example: effective → least effective.",
        baseLemmaPreconditions: "The lemma must be classified as using or permitting periphrastic superlative construction.",
        generationTransform: "Prefix least + space.",
        reductionTransform: "Remove leading least + space.",
        stringPattern: "/^least\\s+.+$/i",
        requiredLinguisticData: "Degree Strategy Classification; Phrase Construction.",
        exceptionLookup: "Degree Strategy Exception Lookup.",
      },
    ],
  },
  {
    field: WordFormField.FIRST_PERSON_FORM,
    label: "First Person Form",
    purpose: "Identifies the word form used when the speaker refers to themselves or a group that includes them.",
    rules: [
      {
        appliesTo: [P.PRONOUN],
        format: "Singular first-person lexical form. Example: I, me, my, mine, myself.",
        baseLemmaPreconditions: "The form must be explicitly classified by grammatical person.",
        generationTransform: "Return the lexical form mapped to the requested person, number and grammatical function.",
        reductionTransform: "Resolve the lexical form to its canonical lemma and grammatical properties.",
        stringPattern: "/^(I|me|my|mine|myself)$/i",
        requiredLinguisticData: "Person; Number; Case.",
        exceptionLookup: "Person/Form Lookup.",
      },
      {
        appliesTo: [P.PRONOUN],
        format: "Plural first-person lexical form. Example: we, us, our, ours, ourselves.",
        baseLemmaPreconditions: "The form must be explicitly classified by grammatical person.",
        generationTransform: "Return the lexical form mapped to the requested person, number and grammatical function.",
        reductionTransform: "Resolve the lexical form to its canonical lemma and grammatical properties.",
        stringPattern: "/^(we|us|our|ours|ourselves)$/i",
        requiredLinguisticData: "Person; Number; Case.",
        exceptionLookup: "Person/Form Lookup.",
      },
      {
        appliesTo: [P.VERB],
        format: "Explicit first-person verb form. Example: be → am.",
        baseLemmaPreconditions: "The form must be explicitly classified by grammatical person.",
        generationTransform: "Return the lexical form mapped to the requested person, number and grammatical function.",
        reductionTransform: "Resolve the lexical form to its canonical lemma and grammatical properties.",
        requiredLinguisticData: "Person; Number; Verb Agreement.",
        exceptionLookup: "Person/Form Lookup.",
      },
    ],
  },
  {
    field: WordFormField.SECOND_PERSON_FORM,
    label: "Second Person Form",
    purpose: "Identifies the word form used when referring to the person or people being addressed.",
    rules: [
      {
        appliesTo: [P.PRONOUN],
        format: "Uses an explicitly classified second-person form. Example: you, your, yours.",
        baseLemmaPreconditions: "The form must be explicitly classified as second person.",
        generationTransform: "Return the mapped second-person form for the requested grammatical properties.",
        reductionTransform: "Resolve to lemma and grammatical properties.",
        stringPattern: "/^(you|your|yours)$/i",
        requiredLinguisticData: "Person; Number; Case.",
        exceptionLookup: "Person/Form Lookup.",
      },
      {
        appliesTo: [P.PRONOUN],
        format: "Uses singular reflexive yourself.",
        baseLemmaPreconditions: "The form must be explicitly classified as second person.",
        generationTransform: "Return the mapped second-person form for the requested grammatical properties.",
        reductionTransform: "Resolve to lemma and grammatical properties.",
        stringPattern: "/^yourself$/i",
        requiredLinguisticData: "Person; Number; Case.",
        exceptionLookup: "Person/Form Lookup.",
      },
      {
        appliesTo: [P.PRONOUN],
        format: "Uses plural reflexive yourselves.",
        baseLemmaPreconditions: "The form must be explicitly classified as second person.",
        generationTransform: "Return the mapped second-person form for the requested grammatical properties.",
        reductionTransform: "Resolve to lemma and grammatical properties.",
        stringPattern: "/^yourselves$/i",
        requiredLinguisticData: "Person; Number; Case.",
        exceptionLookup: "Person/Form Lookup.",
      },
      // Unlike First/Third Person Form, the .md table's own Format
      // column never writes out a distinct verb-specific case for
      // Second Person Form -- English's second-person present tense is
      // spelled identically to the base form ("you walk", not "you
      // walks"), so there's no separate spelling rule to number.
      // Confirmed against the real code this replaces: VERB_FORM_PATTERNS.secondPersonForm
      // was `[]` (String Pattern N/A), same shape as the two rows either
      // side of it.
      {
        appliesTo: [P.VERB],
        format: "Verb second-person form is identical to its base/present-tense form -- no distinct spelling change.",
        baseLemmaPreconditions: "The form must be explicitly classified by grammatical person.",
        generationTransform: "Return the lexical form mapped to the requested person, number and grammatical function.",
        reductionTransform: "Resolve to lemma and grammatical properties.",
        requiredLinguisticData: "Person; Number; Case.",
        exceptionLookup: "Person/Form Lookup.",
      },
    ],
  },
  {
    field: WordFormField.THIRD_PERSON_FORM,
    label: "Third Person Form",
    purpose: "Identifies the word form used when referring to someone or something other than the speaker or listener.",
    rules: [
      {
        appliesTo: [P.PRONOUN],
        format: "Singular third-person lexical form. Example: he, she, it, him, her.",
        baseLemmaPreconditions: "The form must be explicitly classified as third person.",
        generationTransform: "Return the mapped third-person form for the requested grammatical properties.",
        reductionTransform: "Resolve to lemma and grammatical properties.",
        stringPattern: "/^(he|she|it|him|her|his|hers|its|himself|herself|itself)$/i",
        requiredLinguisticData: "Person; Number; Case.",
        exceptionLookup: "Person/Form Lookup.",
      },
      {
        appliesTo: [P.PRONOUN],
        format: "Plural third-person lexical form. Example: they, them.",
        baseLemmaPreconditions: "The form must be explicitly classified as third person.",
        generationTransform: "Return the mapped third-person form for the requested grammatical properties.",
        reductionTransform: "Resolve to lemma and grammatical properties.",
        stringPattern: "/^(they|them|their|theirs|themselves)$/i",
        requiredLinguisticData: "Person; Number; Case.",
        exceptionLookup: "Person/Form Lookup.",
      },
      {
        appliesTo: [P.VERB],
        format: "Explicit third-person verb form. Example: be → is.",
        baseLemmaPreconditions: "The form must be explicitly classified as third person.",
        generationTransform: "Return the mapped third-person form for the requested grammatical properties.",
        reductionTransform: "Resolve to lemma and grammatical properties.",
        requiredLinguisticData: "Person; Number; Verb Agreement.",
        exceptionLookup: "Person/Form Lookup.",
      },
    ],
  },
  {
    field: WordFormField.SUBJECTIVE_CASE_FORM,
    label: "Subjective Case Form",
    purpose: "Identifies the pronoun form used for the person or thing performing or experiencing what the clause describes.",
    rules: [
      {
        appliesTo: [P.PRONOUN],
        format: "Uses an explicitly classified subjective pronoun. Example: I, we, he, they.",
        baseLemmaPreconditions: "The lemma must have a subjective-case pronoun form.",
        generationTransform: "Return the mapped subjective-case form.",
        reductionTransform: "Resolve the subjective form to its pronoun lemma and case-neutral identity.",
        stringPattern: "/^(I|we|you|he|she|it|they)$/i",
        requiredLinguisticData: "Pronoun Case Classification.",
        exceptionLookup: "Pronoun Form Lookup.",
      },
    ],
  },
  {
    field: WordFormField.OBJECTIVE_CASE_FORM,
    label: "Objective Case Form",
    purpose: "Identifies the pronoun form used for the person or thing affected by an action or following a preposition.",
    rules: [
      {
        appliesTo: [P.PRONOUN],
        format: "Uses an explicitly classified objective pronoun. Example: me, us, him, them.",
        baseLemmaPreconditions: "The lemma must have an objective-case pronoun form.",
        generationTransform: "Return the mapped objective-case form.",
        reductionTransform: "Resolve the objective form to its pronoun lemma and case-neutral identity.",
        stringPattern: "/^(me|us|you|him|her|it|them)$/i",
        requiredLinguisticData: "Pronoun Case Classification.",
        exceptionLookup: "Pronoun Form Lookup.",
      },
    ],
  },
  {
    field: WordFormField.POSSESSIVE_CASE_FORM,
    label: "Possessive Case Form",
    purpose: "Identifies the noun, pronoun, or determiner form used to show that something belongs or relates to a person or thing.",
    rules: [
      {
        appliesTo: [P.NOUN],
        format: "Adds 's. Example: dog → dog's.",
        baseLemmaPreconditions: "The noun takes regular possessive 's.",
        generationTransform: "Append 's.",
        reductionTransform: "Remove final 's.",
        stringPattern: "/'s$/i",
        requiredLinguisticData: "Noun Classification.",
        exceptionLookup: "Possessive Form Lookup.",
      },
      {
        appliesTo: [P.NOUN],
        format: "Adds ' after plural -s. Example: dogs → dogs'.",
        baseLemmaPreconditions: "The noun is plural and ends in s.",
        baseLemmaPattern: "/s$/i",
        generationTransform: "Append '.",
        reductionTransform: "Remove final '.",
        stringPattern: "/s'$/i",
        requiredLinguisticData: "Number Classification.",
        exceptionLookup: "Possessive Form Lookup.",
      },
      {
        appliesTo: [P.PRONOUN, P.DETERMINER],
        format: "Uses an explicitly classified possessive form. Example: my, mine, hers, theirs.",
        baseLemmaPreconditions: "The word has a lexical possessive form.",
        generationTransform: "Return the mapped possessive form.",
        reductionTransform: "Resolve the possessive form to its lemma.",
        stringPattern: "/^(my|mine|your|yours|his|her|hers|its|our|ours|their|theirs)$/i",
        requiredLinguisticData: "Pronoun/Determiner Possessive Classification.",
        exceptionLookup: "Possessive Form Lookup.",
      },
    ],
  },
  {
    field: WordFormField.CONSONANT_SOUND_FORM,
    label: "Consonant-Sound Form",
    purpose: "Identifies the word form used immediately before a word beginning with a consonant sound.",
    rules: [
      {
        appliesTo: [P.DETERMINER],
        format: "Uses an explicitly assigned form selected by the phonetic onset of the following word. Example: a (a cat).",
        baseLemmaPreconditions: "The lemma must have an explicitly assigned consonant-sound form.",
        generationTransform: "Return the assigned consonant-sound form.",
        reductionTransform: "Resolve the consonant-sound form to its canonical lemma.",
        requiredLinguisticData: "Lexical Form Mapping; Phonetic Onset of the following word.",
      },
    ],
  },
  {
    field: WordFormField.VOWEL_SOUND_FORM,
    label: "Vowel-Sound Form",
    purpose: "Identifies the word form used immediately before a word beginning with a vowel sound.",
    rules: [
      {
        appliesTo: [P.DETERMINER],
        format: "Uses an explicitly assigned form selected by the phonetic onset of the following word. Example: an (an apple).",
        baseLemmaPreconditions: "The lemma must have an explicitly assigned vowel-sound form.",
        generationTransform: "Return the assigned vowel-sound form.",
        reductionTransform: "Resolve the vowel-sound form to its canonical lemma.",
        requiredLinguisticData: "Lexical Form Mapping; Phonetic Onset of the following word.",
      },
    ],
  },
  {
    field: WordFormField.REFLEXIVE_CASE_FORM,
    label: "Reflexive Case Form",
    purpose: "Identifies the pronoun form used when a person or thing refers back to itself.",
    rules: [
      {
        appliesTo: [P.PRONOUN],
        format: "Ends with -self for singular forms. Example: myself, himself.",
        baseLemmaPreconditions: "The pronoun is singular and has a reflexive form.",
        generationTransform: "Return the mapped singular reflexive form.",
        reductionTransform: "Resolve the reflexive form to its pronoun lemma and grammatical properties.",
        stringPattern: "/self$/i",
        requiredLinguisticData: "Person; Number; Reflexive Case Classification.",
        exceptionLookup: "Pronoun Reflexive Lookup.",
      },
      {
        appliesTo: [P.PRONOUN],
        format: "Ends with -selves for plural forms. Example: ourselves, themselves.",
        baseLemmaPreconditions: "The pronoun is plural and has a reflexive form.",
        generationTransform: "Return the mapped plural reflexive form.",
        reductionTransform: "Resolve the reflexive form to its pronoun lemma and grammatical properties.",
        stringPattern: "/selves$/i",
        requiredLinguisticData: "Person; Number; Reflexive Case Classification.",
        exceptionLookup: "Pronoun Reflexive Lookup.",
      },
    ],
  },
];

/** validateX()'s own `check()` closure calls this in place of the old
 * per-POS `X_FORM_PATTERNS[field]` lookup -- the doc's own "String
 * Pattern" column, flattened across every rule for `field` whose
 * `appliesTo` includes `pos`, deduplicated (the old per-POS constants
 * were themselves already deduplicated -- e.g. Past Tense Form's rules
 * 1 and 2 both give "/ed$/i", and VERB_FORM_PATTERNS.pastTenseForm
 * only ever listed it once; validateFormText()'s own check is a
 * membership test, `known.includes(claimed)`, so duplicates would
 * never have changed correctness, only the array's own length --
 * deduplicating here keeps this a true behavioral match rather than a
 * literal one). */
export function stringPatternsFor(field: WordFormField, pos: PartOfSpeech): readonly string[] {
  const row = WORD_FORM_MATRIX.find((r) => r.field === field);
  if (row === undefined) return [];
  const patterns = row.rules.filter((rule) => rule.appliesTo.includes(pos)).map((rule) => rule.stringPattern);
  return [...new Set(patterns.filter((p): p is string => p !== undefined))];
}

/** Every row applicable to `pos` -- once the single source the now-
 * deleted `pos_form_fields.ts`'s own `WORD_FORM_FIELDS` was built from
 * (in place of the older `Object.keys(X_FORM_PATTERNS)` across six
 * separate role/processor/*.ts files), in the matrix's own row order.
 * No production caller left now that every POS subtype registers real
 * `WordForm` records instead of scalar `*_Form` fields (data/entities/word_form.ts's
 * own docstring) -- kept alongside `stringPatternsFor()` as a plain,
 * still-correct view over `WORD_FORM_MATRIX` rather than deleted along
 * with its one-time caller. */
export function fieldsFor(pos: PartOfSpeech): readonly WordFormField[] {
  return WORD_FORM_MATRIX.filter((row) => row.rules.some((rule) => rule.appliesTo.includes(pos))).map((row) => row.field);
}
