import type { Dictionary } from "../data/dictionary";
import type { Senses } from "../data/senses";
import { createSense } from "../data/sense";
import { RegisterCode } from "../data/enums/register_code";
import type { Auxiliary } from "../data/entities/auxiliary";
import { createAuxiliary, isAuxiliary } from "./processor/auxiliary_processor";

// A *_Form field this subtype actually declares (data/entities/auxiliary.ts)
// -- kept as its own alias so AUXILIARY_LEMMAS below reads as plain data,
// not a wall of `keyof Auxiliary` unions repeated at every entry.
type AuxiliaryFormField =
  | "bareInfinitiveForm"
  | "presentTenseInstanceForm"
  | "presentTenseForm"
  | "thirdPersonSingularPresentForm"
  | "pastTenseInstanceForm"
  | "pastTenseForm"
  | "presentParticipleForm"
  | "pastParticipleForm"
  | "modalForm"
  | "secondaryModalForm";

interface AuxiliaryFormSeed {
  field: AuxiliaryFormField;
  text: string;
  // One definition per distinct meaning this spelling carries -- "am"
  // carries two (continuous aspect, passive voice), "having" carries
  // one, "can" carries three. Each becomes its own Sense, all
  // registered against the same lemma Word (seed()'s own docstring).
  senses: readonly string[];
}

interface AuxiliaryLemmaSeed {
  // Reused from the now-retired auxiliaries.json's own entry_id for
  // this exact lemma, not freshly generated -- entryId's own stability
  // contract (Word.entryId's docstring, data/entities/word.ts) is about
  // *this* underlying vocabulary entry keeping its identity across a
  // format change, not just across an ordinary re-seed; "be" was
  // already a real, referenced entryId under the old flat model, and
  // stays the same one now that it names a lemma Word instead of a
  // surface-form Word.
  entryId: string;
  lemma: string;
  // The lemma-level summary carried on the Word itself (definition/
  // gloss) -- reused verbatim from auxiliaries.json's own top-level
  // entry for continuity; the per-Sense definitions below are what's
  // actually new.
  definition: string;
  forms: readonly AuxiliaryFormSeed[];
}

// The 9 base lemmas this seeder covers -- exactly the ones the sense
// table (this seeder's own direct source) gives full per-form,
// per-meaning coverage for. auxiliaries.json's own remaining 27
// surface-form/semi-modal/contraction entries (need, dare, done, doing,
// don't, can't, I'm, it's, isn't, wasn't, hadn't) have no lemma-model
// equivalent here yet -- tracked as a follow-up, not silently dropped
// (see this file's own README.md note on auxiliaries.json's retirement).
const AUXILIARY_LEMMAS: readonly AuxiliaryLemmaSeed[] = [
  {
    entryId: "a5d86125-ccba-4988-a956-0f39fd04cf19",
    lemma: "be",
    definition: "The base form of the primary verb of existence or state, and the passive/progressive auxiliary",
    forms: [
      {
        field: "bareInfinitiveForm",
        text: "be",
        senses: [
          "Combines with a present participle to form the continuous/progressive aspect, marking an action or state as ongoing. Example: 'She will be running.'",
          "Combines with a past participle to form the passive voice, marking the subject as the recipient rather than the performer of the action. Example: 'It will be written by her.'",
        ],
      },
      {
        field: "presentTenseInstanceForm",
        text: "am",
        senses: [
          "First person singular present form marking the continuous/progressive aspect. Example: 'I am running.'",
          "First person singular present form marking the passive voice. Example: 'I am invited.'",
        ],
      },
      {
        field: "presentTenseForm",
        text: "are",
        senses: [
          "Present form (we/you/they) marking the continuous/progressive aspect. Example: 'They are running.'",
          "Present form (we/you/they) marking the passive voice. Example: 'They are invited.'",
        ],
      },
      {
        field: "thirdPersonSingularPresentForm",
        text: "is",
        senses: [
          "Third person singular present form marking the continuous/progressive aspect. Example: 'She is running.'",
          "Third person singular present form marking the passive voice. Example: 'The book is written by her.'",
        ],
      },
      {
        field: "pastTenseInstanceForm",
        text: "was",
        senses: [
          "First/third person singular past form (I/he/she/it) marking the continuous/progressive aspect. Example: 'I was running.'",
          "First/third person singular past form (I/he/she/it) marking the passive voice. Example: 'It was written by her.'",
        ],
      },
      {
        field: "pastTenseForm",
        text: "were",
        senses: [
          "Past form (we/you/they), or subjunctive, marking the continuous/progressive aspect. Example: 'They were running.'",
          "Past form (we/you/they), or subjunctive, marking the passive voice. Example: 'The books were written by her.'",
        ],
      },
      {
        field: "presentParticipleForm",
        text: "being",
        senses: [
          "The -ing form of 'be', used after another auxiliary to form the continuous passive, or the continuous aspect of 'be' itself. Example: 'He is being cautious.'",
        ],
      },
      {
        field: "pastParticipleForm",
        text: "been",
        senses: ["Past participle of 'be', used after 'have' to form the perfect aspect of 'be'. Example: 'They have been here before.'"],
      },
    ],
  },
  {
    entryId: "8e23c7a0-0b72-4e36-9d13-dc75ffd22790",
    lemma: "have",
    definition: "Auxiliary forming perfect tenses; also the base verb of possession",
    forms: [
      {
        field: "bareInfinitiveForm",
        text: "have",
        senses: [
          "Combines with a past participle to form the perfect aspect, marking an action or state as completed relative to a reference point. Example: 'I have finished.'",
        ],
      },
      {
        field: "thirdPersonSingularPresentForm",
        text: "has",
        senses: ["Third person singular present form of the perfect-aspect auxiliary. Example: 'She has finished.'"],
      },
      {
        field: "pastTenseForm",
        text: "had",
        senses: ["Past tense form of the perfect-aspect auxiliary, forming the past perfect. Example: 'They had finished before we arrived.'"],
      },
      {
        field: "pastParticipleForm",
        text: "had",
        senses: [
          "Past participle of 'have', used after another 'have' to form the perfect of 'have' itself, or within a longer perfect/passive chain. Example: 'It would have had an effect.'",
        ],
      },
      {
        field: "presentParticipleForm",
        text: "having",
        senses: ["The -ing form of 'have', forming the perfect participle/gerund of the perfect-aspect auxiliary. Example: 'Having finished, she left.'"],
      },
    ],
  },
  {
    entryId: "8d8ef25e-2424-472b-80ea-08df2f02ee56",
    lemma: "do",
    definition: "Auxiliary used to form questions, negatives, and emphasis; also the base verb of performing an action",
    forms: [
      {
        field: "bareInfinitiveForm",
        text: "do",
        senses: [
          "Forms questions and negative statements for a main verb that has no auxiliary of its own (do-support). Example: 'Do you agree?' / 'I do not agree.'",
          "Adds emphasis to an affirmative statement. Example: 'I do agree.'",
        ],
      },
      {
        field: "thirdPersonSingularPresentForm",
        text: "does",
        senses: [
          "Third person singular present form of the do-support auxiliary. Example: 'Does she agree?' / 'She does not agree.'",
          "Third person singular present form used for emphasis. Example: 'She does agree.'",
        ],
      },
      {
        field: "pastTenseForm",
        text: "did",
        senses: [
          "Past tense form of the do-support auxiliary. Example: 'Did you agree?' / 'I did not agree.'",
          "Past tense form used for emphasis. Example: 'I did agree.'",
        ],
      },
    ],
  },
  {
    entryId: "4f5bf243-f3c5-40f1-8433-038c30910a3e",
    lemma: "can",
    definition: "Modal auxiliary expressing ability or permission",
    forms: [
      {
        field: "modalForm",
        text: "can",
        senses: [
          "Expresses present ability. Example: 'She can swim.'",
          "Expresses general possibility. Example: 'Accidents can happen.'",
          "Expresses informal permission. Example: 'You can go now.'",
        ],
      },
      {
        field: "secondaryModalForm",
        text: "could",
        senses: [
          "Expresses past ability. Example: 'He could swim as a child.'",
          "Expresses a weaker or more tentative possibility than 'can'. Example: 'It could rain later.'",
          "Expresses a polite request. Example: 'Could you help me?'",
          "Expresses a hypothetical ability or possibility in a conditional clause. Example: 'If I had time, I could help.'",
        ],
      },
    ],
  },
  {
    entryId: "b578a197-4279-4534-8047-ab66c9610335",
    lemma: "may",
    definition: "Modal auxiliary expressing permission or possibility",
    forms: [
      {
        field: "modalForm",
        text: "may",
        senses: [
          "Expresses possibility. Example: 'It may rain.'",
          "Expresses formal permission. Example: 'You may leave now.'",
          "Expresses a formal wish or hope. Example: 'May you both be happy.'",
        ],
      },
      {
        field: "secondaryModalForm",
        text: "might",
        senses: [
          "Expresses a weaker or more tentative possibility than 'may'. Example: 'It might rain.'",
          "Expresses a hypothetical possibility in a conditional clause. Example: 'If she tried, she might succeed.'",
          "Introduces a tentative suggestion. Example: 'You might want to check that.'",
        ],
      },
    ],
  },
  {
    entryId: "7a7a46cb-8ca1-42a6-98f3-177f9d85ba59",
    lemma: "shall",
    definition: "Modal auxiliary expressing future tense or formal obligation",
    forms: [
      {
        field: "modalForm",
        text: "shall",
        senses: [
          "Expresses simple future, chiefly with 'I'/'we' in formal register. Example: 'I shall arrive at noon.'",
          "Expresses a firm intention, promise, or command, chiefly with 'you'/'he'/'she'/'they'. Example: 'You shall not pass.'",
          "Used in questions to seek agreement or make a suggestion. Example: 'Shall we begin?'",
        ],
      },
      {
        field: "secondaryModalForm",
        text: "should",
        senses: [
          "Expresses advisability or recommendation. Example: 'You should rest.'",
          "Expresses a likely or expected outcome. Example: 'They should arrive soon.'",
          "Expresses obligation or conformity to what is correct/expected. Example: 'The report should be accurate.'",
          "Introduces a conditional clause in formal register. Example: 'Should you need help, call me.'",
        ],
      },
    ],
  },
  {
    entryId: "20d00cd2-5528-44ca-800b-d19bbf6e14ee",
    lemma: "will",
    definition: "Modal auxiliary expressing future tense or intention",
    forms: [
      {
        field: "modalForm",
        text: "will",
        senses: [
          "Expresses future prediction. Example: 'It will rain tomorrow.'",
          "Expresses intention or willingness. Example: 'I will help you.'",
          "Expresses habitual or characteristic behavior. Example: 'He will sit there for hours.'",
        ],
      },
      {
        field: "secondaryModalForm",
        text: "would",
        senses: [
          "Expresses the result of a hypothetical condition. Example: 'If I had time, I would help.'",
          "Expresses a future action viewed from a past reference point. Example: 'She said she would come.'",
          "Expresses repeated past action. Example: 'We would walk to school every day.'",
          "Expresses a polite request. Example: 'Would you close the door?'",
          "Expresses willingness or preference. Example: 'I would rather stay.'",
        ],
      },
    ],
  },
  {
    entryId: "48b14bf4-1ed6-4acc-8ca9-cd1c8bbd330a",
    lemma: "must",
    definition: "Modal auxiliary expressing necessity or strong obligation",
    forms: [
      {
        field: "modalForm",
        text: "must",
        senses: [
          "Expresses strong necessity or obligation. Example: 'You must submit the form by Friday.'",
          "Expresses a strong logical conclusion drawn from evidence. Example: 'She must be at home; the lights are on.'",
          "In its negated form, expresses prohibition. Example: 'You must not enter.'",
        ],
      },
      // No secondaryModalForm -- "must" is defective and has no
      // secondary/preterite-present counterpart at all.
    ],
  },
  {
    entryId: "2ec8a2cc-663c-451c-947b-57b99d023b6a",
    lemma: "ought",
    definition: "Semi-modal auxiliary expressing obligation or advisability (used with 'to')",
    forms: [
      {
        field: "modalForm",
        text: "ought",
        senses: [
          "Expresses moral duty or obligation, used with 'to'. Example: 'You ought to apologise.'",
          "Expresses a likely or expected outcome, used with 'to'. Example: 'It ought to be ready by now.'",
          "Expresses what is fitting or appropriate, used with 'to'. Example: 'We ought to say thank you.'",
        ],
      },
      // No secondaryModalForm -- same defective shape as "must".
    ],
  },
];

/** Seeds the 9 AUXILIARY lemma Words (be, have, do, can, may, shall,
 * will, must, ought) this codebase's Common Vocabulary Cache used to
 * get from the now-retired auxiliaries.json, as a standalone post-seed
 * role -- NounCharacterFormSeeder's own shape (role/noun_character_form_seeder.ts),
 * not folded into WordSeeder itself, since this is data this seeder
 * authors directly rather than reads from an asset file.
 *
 * One Word per lemma, every inflected spelling living on a *_Form field
 * (data/entities/auxiliary.ts's own docstring on why, not the flat
 * one-Word-per-surface-form shape auxiliaries.json used). Every
 * distinct meaning of every populated *_Form value gets its own Sense,
 * all registered against that single Word via Senses.registerMember()
 * -- "am"'s continuous-aspect and passive-voice meanings become two
 * Senses sharing the one "be" Word, exactly as word_seeder.ts's own
 * registerUniqueSense() already lets a Word carry more than one Sense
 * (Verb's own "unique by (partOfSpeech, lemma), can lexicalize several
 * senses" note, data/entities/verb.ts).
 *
 * Call this *before* WordSeeder.seedDomain(), not after -- vocabulary_worker.ts's
 * own handleSeedCommonVocabulary ordering. "be"/"have"/"do" are
 * deliberate homographs with a VERB sense seeded by
 * metalinguistic_verbs.json (assets/common/en/README.md's own
 * homograph table), and Dictionary.lookup()'s "first entry wins"
 * default is what decided AUXILIARY as their default sense under the
 * old auxiliaries.json (a MANDATORY_FILES entry, loaded before every
 * SUPPLEMENTARY_FILES entry including metalinguistic_verbs.json) --
 * this seeder has to run first for that same default to survive the
 * move off auxiliaries.json. */
export class AuxiliarySeeder {
  constructor(
    private readonly dictionary: Dictionary,
    private readonly senses?: Senses,
  ) {}

  /** Idempotent, NounCharacterFormSeeder's own "upsert, never duplicate"
   * shape: a lemma already present as an AUXILIARY Word is left alone
   * entirely (including its own Senses -- a re-seed never re-registers
   * or duplicates them), so this is safe to call on every seed run, not
   * just the first. Returns how many lemma Words were newly created. */
  seed(): { created: number } {
    let created = 0;
    for (const lemmaSeed of AUXILIARY_LEMMAS) {
      const alreadyPresent = this.dictionary.lookupAll(lemmaSeed.lemma).some(isAuxiliary);
      if (alreadyPresent) continue;

      const fields: Partial<Auxiliary> = {};
      for (const form of lemmaSeed.forms) {
        fields[form.field] = { value: form.text };
      }
      const word = createAuxiliary({
        text: lemmaSeed.lemma,
        entryId: { value: lemmaSeed.entryId },
        definition: { value: lemmaSeed.definition },
        gloss: { value: lemmaSeed.definition },
        isCommon: true,
        registerCodes: [RegisterCode.NEUTRAL],
        ...fields,
      });
      this.dictionary.append(word);
      created++;

      if (this.senses !== undefined) {
        for (const form of lemmaSeed.forms) {
          for (const definition of form.senses) {
            const sense = createSense({ definition: { value: definition }, gloss: { value: definition }, isCommon: true });
            this.senses.append(sense);
            this.senses.registerMember(sense, word);
          }
        }
      }
    }
    return { created };
  }
}
