import type { Dictionary } from "../data/dictionary";
import type { Senses } from "../data/senses";
import { createSense, graphUuid } from "./sense_processor";
import { createDeterminer, isDeterminer } from "./processor/determiner_processor";
import type { WordForms } from "../data/word_forms";
import { identifier, LanguageStyleCode, LanguageStyleCodelist } from "../../value_objects";
import { WordFormField } from "../data/enums/word_forms_enum";

// The subset of WordFormField (data/enums/word_forms_enum.ts) this
// seeder ever authors -- AuxiliarySeeder's own AuxiliaryFormField
// alias (role/auxiliary_seeder.ts), same reasoning: authoring-time
// safety for the literal data below. Singular/Plural Number Form are
// the Word Form to Part of Speech Matrix's own existing DETERMINER
// rows (data/matrices/pos_vs_wordform_matrice.ts);
// Consonant/Vowel-Sound Form are two new rows this seeder introduces,
// for the one genuine phonetically-conditioned alternation a closed-class
// English determiner has ("a"/"an") -- every other lemma below simply
// repeats its own base spelling under both, the same way a Verb's own
// bareInfinitiveForm and presentTenseForm often repeat the identical
// spelling under two different field names (word_form.ts's own docstring
// on why the field name, not the text, is what distinguishes a WordForm).
type DeterminerFormField = WordFormField.SINGULAR_NUMBER_FORM | WordFormField.PLURAL_NUMBER_FORM | WordFormField.CONSONANT_SOUND_FORM | WordFormField.VOWEL_SOUND_FORM;

interface DeterminerFormSeed {
  field: DeterminerFormField;
  text: string;
}

interface DeterminerLemmaSeed {
  // Reused from the now-retired determiners.json's own entry_id where
  // that lexical form already existed as its own top-level entry there
  // (e.g. "the", "this") -- entryId's own stability contract (Word.entryId's
  // docstring, data/entities/word.ts) is about *this* underlying
  // vocabulary entry keeping its identity across a format change, the
  // same precedent AuxiliarySeeder's own entryId reuse set. A lemma with
  // no equivalent entry in the old flat file (e.g. "whose", "fewer") gets
  // a freshly generated entryId instead -- there is nothing to preserve
  // continuity with. Old entries that fold into a *form* rather than
  // surviving as their own lemma ("an" into "a"'s own vowelSoundForm,
  // "these"/"those" into "this"/"that"'s own pluralNumberForm, the old
  // nested "fewest" into "few"'s own family) are not reused anywhere --
  // AuxiliarySeeder's own precedent for "am"/"was" etc. is the same: only
  // the base lemma's own entryId survives a format change, not every
  // spelling's.
  entryId: string;
  lemma: string;
  definition: string;
  forms: readonly DeterminerFormSeed[];
}

// The 44 DETERMINER lemmas this seeder covers -- one Word per base
// lemma rather than the now-retired determiners.json's own flat
// one-Word-per-surface-form entries (37 of them, "a"/"an" and
// "this"/"these"/"that"/"those" each their own independent Word there).
// "which"/"what" (2 of the 46 lemmas the source table names) are
// deliberately excluded -- see the standalone comment right before
// their own spot below. Singular/Plural Number Form and Consonant/
// Vowel-Sound Form are omitted per lemma (not authored as an empty
// string) wherever that lemma has no distinct spelling for that
// grammatical slot at all -- "our" has no singular use, "a" has no
// plural use -- mirroring how AuxiliarySeeder simply omits a
// `secondaryModalForm` entry for a defective modal like "must" rather
// than authoring a placeholder.
//
// "whose" and "whichever" have no equivalent entry in the old
// determiners.json at all -- they previously resolved only as PRONOUN
// (pronouns.json). Seeding them here, before pronouns.json loads,
// gives them a first DETERMINER entry and so makes DETERMINER their
// new Dictionary.lookup() default ("whose car", "whichever way" are
// both genuine determiner uses). Deliberate, not incidental: nothing
// in this codebase's own tests depends on either word's previous
// PRONOUN default, and `role/word_seeder.ts`'s own
// `PHRASE_TYPE_DETERMINERS` closed set already treated "whose" as
// determiner-role regardless of which Dictionary sense was default.
const DETERMINER_LEMMAS: readonly DeterminerLemmaSeed[] = [
  {
    entryId: "c3bb1d82-6695-40e8-9709-81c47764c4a3",
    lemma: "a",
    definition: "Introduces a singular noun referring to one non-specific thing -- 'a' before a consonant sound, 'an' before a vowel sound",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "a" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "a" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "an" },
    ],
  },
  {
    entryId: "0cc62e9f-c9de-4aac-abc8-22409f4a54c8",
    lemma: "the",
    definition: "Introduces a noun referring to a specific, already-identified thing",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "the" },
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "the" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "the" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "the" },
    ],
  },
  {
    entryId: "a1c6fc07-73db-4dc7-bcb4-eea3cf47eaa7",
    lemma: "this",
    definition: "Refers to a singular thing that is nearby or currently being discussed",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "this" },
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "these" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "this" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "this" },
    ],
  },
  {
    entryId: "8692b033-9192-410f-811b-71375e9d94ce",
    lemma: "that",
    definition: "Refers to a singular thing that is farther away or previously mentioned",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "that" },
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "those" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "that" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "that" },
    ],
  },
  {
    entryId: "d568ec75-411f-4311-8fb9-bd64f3e38b3c",
    lemma: "my",
    definition: "Belonging to the speaker",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "my" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "my" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "my" },
    ],
  },
  {
    entryId: "c5b5dafc-60ac-424e-9ff0-57979e0fe632",
    lemma: "your",
    definition: "Belonging to the person or people being addressed",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "your" },
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "your" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "your" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "your" },
    ],
  },
  {
    entryId: "bc501dc4-350d-4e82-801b-7291f2ce9e7f",
    lemma: "his",
    definition: "Belonging to a male person or animal",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "his" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "his" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "his" },
    ],
  },
  {
    entryId: "98f17467-683a-42d6-8da6-51a556a52cb5",
    lemma: "her",
    definition: "Belonging to a female person or animal",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "her" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "her" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "her" },
    ],
  },
  {
    entryId: "5257f29e-92b5-4c07-b03e-bc9c134f73b8",
    lemma: "its",
    definition: "Belonging to a thing, animal, or abstract entity",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "its" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "its" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "its" },
    ],
  },
  {
    entryId: "d10078e1-4038-4ebd-aa4c-3b713b5055d2",
    lemma: "our",
    definition: "Belonging to the speaker and others",
    forms: [
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "our" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "our" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "our" },
    ],
  },
  {
    entryId: "2c91ce4b-742f-426f-bdba-6aefc5fd0739",
    lemma: "their",
    definition: "Belonging to more than one other person, or a person of unspecified gender",
    forms: [
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "their" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "their" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "their" },
    ],
  },
  {
    entryId: "21851e4b-8206-45e0-bc5d-438867a82c93",
    lemma: "whose",
    definition: "Belonging to whom or which; used to ask or specify possession",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "whose" },
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "whose" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "whose" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "whose" },
    ],
  },
  // "which"/"what" are deliberately NOT seeded here, even though the
  // source table this seeder is built from lists them -- both already
  // carry a real DETERMINER Word, seeded from pronouns.json rather than
  // this seeder (assets/common/en/README.md's own "asset_version 1.3.0"
  // note on why: their *original*, higher-frequency sense is PRONOUN, so
  // their DETERMINER entry was deliberately placed inside pronouns.json
  // itself, positioned right after the PRONOUN entry, purely to load
  // second and keep PRONOUN the Dictionary.lookup() default). Seeding
  // them here too would both violate a Word's own uniqueness by
  // (partOfSpeech, lemma) -- two independent DETERMINER Words for the
  // same lemma -- and, since this seeder runs before pronouns.json
  // loads, silently flip their default sense to DETERMINER.
  {
    entryId: "261302df-c7c1-4120-a9de-9e38be0a3c6d",
    lemma: "whatever",
    definition: "Any or every one of; no matter what",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "whatever" },
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "whatever" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "whatever" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "whatever" },
    ],
  },
  {
    entryId: "a0e67ecd-88b9-4bf7-bb89-91d0437a00ed",
    lemma: "whichever",
    definition: "Any one out of a set, no matter which; the choice does not matter",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "whichever" },
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "whichever" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "whichever" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "whichever" },
    ],
  },
  {
    entryId: "4144c220-317b-4632-8b65-03815d3d84a5",
    lemma: "all",
    definition: "The whole quantity or extent of",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "all" },
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "all" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "all" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "all" },
    ],
  },
  {
    entryId: "62d41b72-f0d0-4afd-a2ca-ca4969ccf98a",
    lemma: "both",
    definition: "The two, considered together",
    forms: [
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "both" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "both" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "both" },
    ],
  },
  {
    entryId: "53b44ff9-9d3d-44ce-ab4f-0fb301dd2c1b",
    lemma: "each",
    definition: "Every individual one of a group, considered separately",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "each" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "each" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "each" },
    ],
  },
  {
    entryId: "7813b20e-7288-4134-9e58-06586b7c524a",
    lemma: "every",
    definition: "Each one of a group, without exception",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "every" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "every" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "every" },
    ],
  },
  {
    entryId: "ed3731e6-f8ef-4170-a15f-1319022e58a9",
    lemma: "either",
    definition: "One or the other of two",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "either" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "either" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "either" },
    ],
  },
  {
    entryId: "eb8ee458-d7d7-4484-b349-9ec64a980874",
    lemma: "neither",
    definition: "Not one nor the other of two",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "neither" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "neither" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "neither" },
    ],
  },
  {
    entryId: "92d2c4f2-bcb8-4fbe-b175-03886d7dea09",
    lemma: "any",
    definition: "Whichever, or some, amount or number (typically in questions or negatives)",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "any" },
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "any" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "any" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "any" },
    ],
  },
  {
    entryId: "bf01366e-96a9-4815-9c66-ac96956cb981",
    lemma: "some",
    definition: "An unspecified amount or number of",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "some" },
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "some" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "some" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "some" },
    ],
  },
  {
    entryId: "89c602ed-58d1-40e3-9eec-ef15269859ef",
    lemma: "no",
    definition: "Not any; zero of",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "no" },
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "no" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "no" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "no" },
    ],
  },
  {
    entryId: "7163e2ae-7547-44cd-bba2-660aac28c0d5",
    lemma: "enough",
    definition: "As much or as many as required",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "enough" },
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "enough" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "enough" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "enough" },
    ],
  },
  {
    entryId: "38a567cf-c9a6-44a1-a28d-bef30c0f2cb9",
    lemma: "much",
    definition: "A large amount of (used with uncountable nouns)",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "much" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "much" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "much" },
    ],
  },
  {
    entryId: "cc19adcc-b77d-4e83-a6f8-aa3b6160ef4c",
    lemma: "many",
    definition: "A large number of",
    forms: [
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "many" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "many" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "many" },
    ],
  },
  {
    entryId: "9b78438d-b90e-424e-96c6-cfcc99a2b6fb",
    lemma: "little",
    definition: "A small amount of (used with uncountable nouns)",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "little" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "little" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "little" },
    ],
  },
  {
    entryId: "3f3381d5-1675-4cf3-8a01-96e751a7e3f6",
    lemma: "few",
    definition: "A small number of",
    forms: [
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "few" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "few" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "few" },
    ],
  },
  {
    entryId: "58358a70-ec9f-4c78-a2c1-6a05a6dd7547",
    lemma: "less",
    definition: "A smaller amount of (used with uncountable nouns); comparative of 'little'",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "less" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "less" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "less" },
    ],
  },
  {
    entryId: "5c93d656-7e5b-4755-b089-9b5f30b795f3",
    lemma: "fewer",
    definition: "A smaller number of; comparative of 'few'",
    forms: [
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "fewer" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "fewer" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "fewer" },
    ],
  },
  {
    entryId: "b0309f4c-e3a7-4bcc-a67f-c5349b91aa19",
    lemma: "least",
    definition: "The smallest amount of; superlative of 'little'",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "least" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "least" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "least" },
    ],
  },
  {
    entryId: "de7b8231-256a-4053-b22c-c95ddbbdcbd9",
    lemma: "fewest",
    definition: "The smallest number of; superlative of 'few'",
    forms: [
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "fewest" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "fewest" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "fewest" },
    ],
  },
  {
    entryId: "78e03b7a-d1d7-4ebc-b425-422efe1bff60",
    lemma: "more",
    definition: "A greater amount or number of; comparative of 'much'/'many'",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "more" },
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "more" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "more" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "more" },
    ],
  },
  {
    entryId: "5356d6cd-2965-4d9a-a08c-d0e3b0c13231",
    lemma: "most",
    definition: "The greatest quantity or number of",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "most" },
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "most" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "most" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "most" },
    ],
  },
  {
    entryId: "5f5929d5-e94b-481c-9f1a-f7b611361b1c",
    lemma: "several",
    definition: "More than two but not very many",
    forms: [
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "several" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "several" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "several" },
    ],
  },
  {
    entryId: "44f34bb1-5a96-4caa-a193-029715a10d59",
    lemma: "another",
    definition: "One more, or a different, thing of the same kind",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "another" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "another" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "another" },
    ],
  },
  {
    entryId: "f3b496d4-4be2-4707-960c-553d8908a80a",
    lemma: "other",
    definition: "Different from the one(s) already mentioned",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "other" },
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "other" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "other" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "other" },
    ],
  },
  {
    entryId: "95841d99-986c-4685-9648-d2f925f4f246",
    lemma: "certain",
    definition: "Some but not named or specified",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "certain" },
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "certain" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "certain" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "certain" },
    ],
  },
  {
    entryId: "fa55ff72-9e2d-471a-9ac1-b035128f676a",
    lemma: "such",
    definition: "Of the kind previously mentioned or implied",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "such" },
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "such" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "such" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "such" },
    ],
  },
  {
    entryId: "b4a64ed7-131e-4a48-aa8b-a25c848ce213",
    lemma: "half",
    definition: "One of two equal parts of; being half of",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "half" },
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "half" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "half" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "half" },
    ],
  },
  {
    entryId: "50ab64cc-1c78-4bd8-9bcd-c5e28d0011a9",
    lemma: "double",
    definition: "Twice as much or as many of",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "double" },
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "double" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "double" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "double" },
    ],
  },
  {
    entryId: "808a507e-5a59-4e9d-8b08-730c24ea0d40",
    lemma: "twice",
    definition: "Two times the amount or number of",
    forms: [
      { field: WordFormField.SINGULAR_NUMBER_FORM, text: "twice" },
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "twice" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "twice" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "twice" },
    ],
  },
  {
    entryId: "30b5feb6-10bf-4c79-b381-672a018a9967",
    lemma: "various",
    definition: "More than one, distinct and different",
    forms: [
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "various" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "various" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "various" },
    ],
  },
  {
    entryId: "b2e219c6-5220-4c13-ad27-434eaa91d815",
    lemma: "numerous",
    definition: "Existing or occurring in great number; many",
    forms: [
      { field: WordFormField.PLURAL_NUMBER_FORM, text: "numerous" },
      { field: WordFormField.CONSONANT_SOUND_FORM, text: "numerous" },
      { field: WordFormField.VOWEL_SOUND_FORM, text: "numerous" },
    ],
  },
];

/** Seeds the 44 DETERMINER lemma Words this codebase's Common
 * Vocabulary Cache used to get from the now-retired determiners.json
 * (plus "whose"/"whichever", newly covered), as a standalone post-seed
 * role -- AuxiliarySeeder's own exact shape (role/auxiliary_seeder.ts),
 * one Word per lemma with every inflected spelling living on its own
 * WordForm record rather than the old flat one-Word-per-surface-form
 * entries determiners.json had ("a"/"an" and "this"/"these"/"that"/
 * "those" each their own independent Word there). "which"/"what" stay
 * out of scope here entirely -- DETERMINER_LEMMAS's own comment above
 * their spot explains why.
 *
 * Unlike Auxiliary, a Determiner lemma's own forms never carry more
 * than one meaning apiece -- "the"/"these"/"an" all mean the same thing
 * "the"/"this"/"a" does, just selected by number or by the following
 * word's phonetic onset, not genuinely distinct senses the way "am"
 * (continuous aspect) and "am" (passive voice) are. So this seeder
 * gives each lemma exactly one Sense, registered onto the Word
 * (`Senses.registerMember()`, driving `client_senses_section_html.ts`'s
 * existing Senses-panel rendering) and onto every WordForm it creates
 * for that lemma (`form.senseIds` -- each spelling genuinely does
 * lexicalize that one meaning), rather than AuxiliarySeeder's own
 * several-Senses-per-lemma shape.
 *
 * Consonant/Vowel-Sound Form (data/matrices/pos_vs_wordform_matrice.ts's
 * own two new DETERMINER-only rows) exist for exactly one real English
 * alternation, "a"/"an" -- every other lemma below simply repeats its
 * own base spelling under both fields, the same way an invariant
 * Auxiliary spelling can appear under more than one field name at once.
 *
 * Called from inside `WordSeeder.seedClosedClassWords()` itself
 * (alongside `AuxiliarySeeder`, that method's own docstring), not by
 * each caller individually -- this seeder now owns DETERMINER
 * coverage for every lemma below, so it has to run before that
 * method's own `loadCache()` loop, where determiners.json's former
 * place in `MANDATORY_FILES` would have loaded (that entry is
 * removed, not merely reordered). "this"/"that" still have their own
 * real ordering dependency on `pronouns.json`, exactly as they did
 * under the old file -- running before `pronouns.json` loads is what
 * keeps DETERMINER their Dictionary.lookup() default over their own
 * separate PRONOUN entry there (assets/common/en/README.md's own
 * "asset_version 1.3.0" note has the full history). */
export class DeterminerSeeder {
  constructor(
    private readonly dictionary: Dictionary,
    private readonly senses?: Senses,
    private readonly wordForms?: WordForms,
  ) {}

  /** Idempotent, AuxiliarySeeder's own "upsert, never duplicate" shape:
   * a lemma already present as a DETERMINER Word is left alone entirely
   * (including its own WordForms/Senses -- a re-seed never re-registers
   * or duplicates them), so this is safe to call on every seed run, not
   * just the first. Returns how many lemma Words were newly created. */
  seed(): { created: number } {
    let created = 0;
    for (const lemmaSeed of DETERMINER_LEMMAS) {
      const alreadyPresent = this.dictionary.lookupAll(lemmaSeed.lemma).some(isDeterminer);
      if (alreadyPresent) continue;

      const word = createDeterminer({
        text: lemmaSeed.lemma,
        // identifier(), not a bare `{ value }` literal -- see
        // AuxiliarySeeder's own identical fix (role/auxiliary_seeder.ts)
        // for the full explanation: createWord()'s own defaulting only
        // auto-generates a fresh `uuid` when `entryId` is omitted
        // entirely, so a bare `{ value }` here would leave every lemma
        // below sharing one `undefined` `entryId.uuid`, silently
        // colliding in Dictionary.byUuid and WordForms.formsByWordId.
        entryId: identifier(lemmaSeed.entryId),
        definition: { value: lemmaSeed.definition },
        isCommon: true,
      });
      this.dictionary.append(word);
      created++;

      const sense =
        this.senses === undefined
          ? undefined
          : createSense({ definition: { value: lemmaSeed.definition }, gloss: { value: lemmaSeed.definition }, isCommon: true });
      if (sense !== undefined && this.senses !== undefined) {
        this.senses.append(sense);
        this.senses.registerMember(sense, word);
      }

      for (const formSeed of lemmaSeed.forms) {
        // Every DETERMINER spelling is NEUTRAL register -- AuxiliarySeeder's
        // own identical reasoning (role/auxiliary_seeder.ts) for why this
        // is attached per WordForm rather than once on the Word.
        const form = this.wordForms?.registerNamedForm(word, formSeed.field, {
          value: formSeed.text,
          languageStyleCode: new LanguageStyleCode(LanguageStyleCodelist.NEUTRAL),
        });
        if (form !== undefined && sense !== undefined) {
          form.senseIds = [...form.senseIds, { value: graphUuid(sense) }];
        }
      }
    }
    return { created };
  }
}
