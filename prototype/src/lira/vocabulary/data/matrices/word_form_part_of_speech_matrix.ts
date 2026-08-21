/** The Word Form to Part of Speech Matrix, as real data -- the single
 * source both the code (validateX()'s own String Pattern check,
 * data/word_forms.ts's own WORD_FORM_FIELDS) and
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
 * Only two columns of the matrix are mechanically consumed by code
 * today -- String Pattern (via stringPatternsFor(), validateX()'s own
 * check() closure, data/word.ts's validateFormText()) and POS
 * applicability (via fieldsFor(), data/word_forms.ts's own
 * WORD_FORM_FIELDS). Every other column (Base Lemma Preconditions,
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
  field: string;
  label: string;
  purpose: string;
  rules: readonly WordFormRule[];
}

const P = PartOfSpeech;

export const WORD_FORM_MATRIX: readonly WordFormRow[] = [
  {
    field: "baseLemmaCanonicalForm",
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
    field: "singularNumberForm",
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
    field: "pluralNumberForm",
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
    field: "presentTenseForm",
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
        appliesTo: [P.VERB],
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
    field: "pastTenseForm",
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
    ],
  },
  {
    field: "thirdPersonSingularPresentForm",
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
        appliesTo: [P.VERB],
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
    field: "presentParticipleForm",
    label: "Present Participle Form",
    purpose: "Identifies the verb form used to describe an action or state as ongoing.",
    rules: [
      {
        appliesTo: [P.VERB],
        format: "Adds -ing. Example: walk → walking.",
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
    field: "pastParticipleForm",
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
        appliesTo: [P.VERB],
        format: "Uses an irregular -en/-n form. Example: write → written.",
        baseLemmaPreconditions: "The lemma has an explicitly mapped irregular participle ending in -en/-n.",
        generationTransform: "Return mapped -en/-n participle.",
        reductionTransform: "Resolve mapped participle to lemma.",
        stringPattern: "/(en|n)$/i",
        requiredLinguisticData: "Lexical Exception Data.",
        exceptionLookup: "Irregular Verb Lookup.",
      },
      {
        appliesTo: [P.VERB],
        format: "Uses another irregular spelling. Example: go → gone.",
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
    field: "bareInfinitiveForm",
    label: "Bare Infinitive Form",
    purpose: "Identifies the basic verb form used without the word to.",
    rules: [
      {
        appliesTo: [P.VERB],
        format: "Uses the canonical uninflected verb spelling. Example: run, walk, be.",
        baseLemmaPreconditions: "The word must be classified as a verb lemma capable of bare-infinitive use.",
        generationTransform: "Return the base lemma unchanged.",
        reductionTransform: "Return the form as its canonical verb lemma.",
        requiredLinguisticData: "Verb Classification; Syntactic Context.",
      },
    ],
  },
  {
    field: "positiveDegreeForm",
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
    field: "comparativeDegreeForm",
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
    field: "comparativePeriphrasticForm",
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
    field: "superlativeDegreeForm",
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
    field: "superlativePeriphrasticForm",
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
    field: "firstPersonForm",
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
    field: "secondPersonForm",
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
    field: "thirdPersonForm",
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
    field: "subjectiveCaseForm",
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
    field: "objectiveCaseForm",
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
    field: "possessiveCaseForm",
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
    field: "reflexiveCaseForm",
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
export function stringPatternsFor(field: string, pos: PartOfSpeech): readonly string[] {
  const row = WORD_FORM_MATRIX.find((r) => r.field === field);
  if (row === undefined) return [];
  const patterns = row.rules.filter((rule) => rule.appliesTo.includes(pos)).map((rule) => rule.stringPattern);
  return [...new Set(patterns.filter((p): p is string => p !== undefined))];
}

/** data/word_forms.ts's own WORD_FORM_FIELDS is built from this per
 * PartOfSpeech, in place of the old `Object.keys(X_FORM_PATTERNS)`
 * across six separate role/processor/*.ts files -- every row with at
 * least one rule whose `appliesTo` includes `pos`, in the matrix's own
 * row order (matching the Word Form to Part of Speech Matrix's own
 * field order, the same order WORD_FORM_FIELDS has always documented
 * itself as using). */
export function fieldsFor(pos: PartOfSpeech): readonly string[] {
  return WORD_FORM_MATRIX.filter((row) => row.rules.some((rule) => rule.appliesTo.includes(pos))).map((row) => row.field);
}
