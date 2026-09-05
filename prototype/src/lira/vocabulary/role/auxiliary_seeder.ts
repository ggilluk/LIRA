import type { Dictionary } from "../data/dictionary";
import type { Senses } from "../data/senses";
import { createSense, graphUuid } from "./sense_processor";
import { createAuxiliary, isAuxiliary } from "./processor/auxiliary_processor";
import { createWordForm } from "./word_form_processor";
import type { WordForms } from "../data/word_forms";
import { identifier, LanguageStyleCode, LanguageStyleCodelist } from "../../value_objects";
import { WordFormField } from "../data/enums/word_forms_enum";

// The subset of WordFormField (data/enums/word_forms_enum.ts) this
// seeder ever authors -- kept as its own alias so AUXILIARY_LEMMAS
// below reads as plain data, not a wall of enum-member unions repeated
// at every entry, and so a typo/wrong-POS member is caught here at
// authoring time rather than only where the field is later read back.
type AuxiliaryFormField =
  | WordFormField.BARE_INFINITIVE_FORM
  | WordFormField.PRESENT_TENSE_INSTANCE_FORM
  | WordFormField.PRESENT_TENSE_FORM
  | WordFormField.THIRD_PERSON_SINGULAR_PRESENT_FORM
  | WordFormField.PAST_TENSE_INSTANCE_FORM
  | WordFormField.PAST_TENSE_FORM
  | WordFormField.PRESENT_PARTICIPLE_FORM
  | WordFormField.PAST_PARTICIPLE_FORM
  | WordFormField.MODAL_FORM
  | WordFormField.SECONDARY_MODAL_FORM;

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

// The 11 base lemmas this seeder covers: the original 9 the sense table
// (this seeder's own direct source) gave full per-form, per-meaning
// coverage for, plus "need"/"dare" and do's own "doing"/"done" (GitHub
// issue #2's own points 1-2, a deliberate expansion beyond that table's
// original scope -- each new entry's own comment below says so).
// auxiliaries.json's own remaining 7 entries -- the full contractions
// (don't, can't, I'm, it's, isn't, wasn't, hadn't) -- still have no
// lemma-model equivalent here; tracked as issue #2's own point 3, not
// silently dropped (see this file's own README.md note on
// auxiliaries.json's retirement).
const AUXILIARY_LEMMAS: readonly AuxiliaryLemmaSeed[] = [
  {
    entryId: "a5d86125-ccba-4988-a956-0f39fd04cf19",
    lemma: "be",
    definition: "The base form of the primary verb of existence or state, and the passive/progressive auxiliary",
    forms: [
      {
        field: WordFormField.BARE_INFINITIVE_FORM,
        text: "be",
        senses: [
          "Combines with a present participle to form the continuous/progressive aspect, marking an action or state as ongoing. Example: 'She will be running.'",
          "Combines with a past participle to form the passive voice, marking the subject as the recipient rather than the performer of the action. Example: 'It will be written by her.'",
        ],
      },
      {
        field: WordFormField.PRESENT_TENSE_INSTANCE_FORM,
        text: "am",
        senses: [
          "First person singular present form marking the continuous/progressive aspect. Example: 'I am running.'",
          "First person singular present form marking the passive voice. Example: 'I am invited.'",
        ],
      },
      {
        field: WordFormField.PRESENT_TENSE_FORM,
        text: "are",
        senses: [
          "Present form (we/you/they) marking the continuous/progressive aspect. Example: 'They are running.'",
          "Present form (we/you/they) marking the passive voice. Example: 'They are invited.'",
        ],
      },
      {
        field: WordFormField.THIRD_PERSON_SINGULAR_PRESENT_FORM,
        text: "is",
        senses: [
          "Third person singular present form marking the continuous/progressive aspect. Example: 'She is running.'",
          "Third person singular present form marking the passive voice. Example: 'The book is written by her.'",
        ],
      },
      {
        field: WordFormField.PAST_TENSE_INSTANCE_FORM,
        text: "was",
        senses: [
          "First/third person singular past form (I/he/she/it) marking the continuous/progressive aspect. Example: 'I was running.'",
          "First/third person singular past form (I/he/she/it) marking the passive voice. Example: 'It was written by her.'",
        ],
      },
      {
        field: WordFormField.PAST_TENSE_FORM,
        text: "were",
        senses: [
          "Past form (we/you/they), or subjunctive, marking the continuous/progressive aspect. Example: 'They were running.'",
          "Past form (we/you/they), or subjunctive, marking the passive voice. Example: 'The books were written by her.'",
        ],
      },
      {
        field: WordFormField.PRESENT_PARTICIPLE_FORM,
        text: "being",
        senses: [
          "The -ing form of 'be', used after another auxiliary to form the continuous passive, or the continuous aspect of 'be' itself. Example: 'He is being cautious.'",
        ],
      },
      {
        field: WordFormField.PAST_PARTICIPLE_FORM,
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
        field: WordFormField.BARE_INFINITIVE_FORM,
        text: "have",
        senses: [
          "Combines with a past participle to form the perfect aspect, marking an action or state as completed relative to a reference point. Example: 'I have finished.'",
        ],
      },
      {
        field: WordFormField.THIRD_PERSON_SINGULAR_PRESENT_FORM,
        text: "has",
        senses: ["Third person singular present form of the perfect-aspect auxiliary. Example: 'She has finished.'"],
      },
      {
        field: WordFormField.PAST_TENSE_FORM,
        text: "had",
        senses: ["Past tense form of the perfect-aspect auxiliary, forming the past perfect. Example: 'They had finished before we arrived.'"],
      },
      {
        field: WordFormField.PAST_PARTICIPLE_FORM,
        text: "had",
        senses: [
          "Past participle of 'have', used after another 'have' to form the perfect of 'have' itself, or within a longer perfect/passive chain. Example: 'It would have had an effect.'",
        ],
      },
      {
        field: WordFormField.PRESENT_PARTICIPLE_FORM,
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
        field: WordFormField.BARE_INFINITIVE_FORM,
        text: "do",
        senses: [
          "Forms questions and negative statements for a main verb that has no auxiliary of its own (do-support). Example: 'Do you agree?' / 'I do not agree.'",
          "Adds emphasis to an affirmative statement. Example: 'I do agree.'",
        ],
      },
      {
        field: WordFormField.THIRD_PERSON_SINGULAR_PRESENT_FORM,
        text: "does",
        senses: [
          "Third person singular present form of the do-support auxiliary. Example: 'Does she agree?' / 'She does not agree.'",
          "Third person singular present form used for emphasis. Example: 'She does agree.'",
        ],
      },
      {
        field: WordFormField.PAST_TENSE_FORM,
        text: "did",
        senses: [
          "Past tense form of the do-support auxiliary. Example: 'Did you agree?' / 'I did not agree.'",
          "Past tense form used for emphasis. Example: 'I did agree.'",
        ],
      },
      // "doing"/"done" are a deliberate expansion beyond this lemma's
      // original 3-form scope (do/does/did, the do-support/emphatic
      // auxiliary's own only real forms -- do-support never inflects to
      // -ing/-en) -- GitHub issue #2's own point 2. Kept honest about
      // that: these two definitions describe "do" acting as the main
      // verb of performing an action or reaching completion, the same
      // non-auxiliary lexical use "having"/"been" already sit alongside
      // for "have"/"be" above, not a genuine do-support/emphatic sense.
      {
        field: WordFormField.PRESENT_PARTICIPLE_FORM,
        text: "doing",
        senses: [
          "The -ing form of 'do', used to form the continuous aspect when 'do' is the main verb of performing an action. Example: 'She was doing her best.'",
        ],
      },
      {
        field: WordFormField.PAST_PARTICIPLE_FORM,
        text: "done",
        senses: [
          "The past participle of 'do', used after 'have' to form the perfect aspect of 'do' as the main verb of performing an action, or as an adjective meaning finished/complete. Example: 'I have done what I could.' / 'The work is done.'",
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
        field: WordFormField.MODAL_FORM,
        text: "can",
        senses: [
          "Expresses present ability. Example: 'She can swim.'",
          "Expresses general possibility. Example: 'Accidents can happen.'",
          "Expresses informal permission. Example: 'You can go now.'",
        ],
      },
      {
        field: WordFormField.SECONDARY_MODAL_FORM,
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
        field: WordFormField.MODAL_FORM,
        text: "may",
        senses: [
          "Expresses possibility. Example: 'It may rain.'",
          "Expresses formal permission. Example: 'You may leave now.'",
          "Expresses a formal wish or hope. Example: 'May you both be happy.'",
        ],
      },
      {
        field: WordFormField.SECONDARY_MODAL_FORM,
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
        field: WordFormField.MODAL_FORM,
        text: "shall",
        senses: [
          "Expresses simple future, chiefly with 'I'/'we' in formal register. Example: 'I shall arrive at noon.'",
          "Expresses a firm intention, promise, or command, chiefly with 'you'/'he'/'she'/'they'. Example: 'You shall not pass.'",
          "Used in questions to seek agreement or make a suggestion. Example: 'Shall we begin?'",
        ],
      },
      {
        field: WordFormField.SECONDARY_MODAL_FORM,
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
        field: WordFormField.MODAL_FORM,
        text: "will",
        senses: [
          "Expresses future prediction. Example: 'It will rain tomorrow.'",
          "Expresses intention or willingness. Example: 'I will help you.'",
          "Expresses habitual or characteristic behavior. Example: 'He will sit there for hours.'",
        ],
      },
      {
        field: WordFormField.SECONDARY_MODAL_FORM,
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
        field: WordFormField.MODAL_FORM,
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
        field: WordFormField.MODAL_FORM,
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
  {
    entryId: "dd0df66c-98c4-4d85-b8ec-6e3ed7f17ee1",
    lemma: "need",
    definition: "Semi-modal auxiliary expressing necessity (used without 'to' in negatives/questions)",
    forms: [
      // A semi-modal, not a true modal like can/may/shall/will/must/ought
      // -- as an ordinary lexical verb "need" inflects regularly
      // (needs/needed/needing), but that use is POS=VERB, out of scope
      // here (the same split be/have/do already have between this
      // AUXILIARY lemma and their own separate VERB homograph,
      // assets/common/en/README.md's own homograph table). This
      // AUXILIARY Word covers only the invariant NICE-property auxiliary
      // use (Negation/Inversion/Code/Emphasis, no third-person -s, no
      // separate past form) -- modalForm is the right field for that,
      // same shape as must/ought's own single invariant spelling.
      {
        field: WordFormField.MODAL_FORM,
        text: "need",
        senses: [
          "Used as an auxiliary, chiefly in negative and interrogative sentences, to express that something is or is not necessary. Example: 'You need not attend.' / 'Need I remind you?'",
        ],
      },
      // No secondaryModalForm -- same defective shape as "must"/"ought".
    ],
  },
  {
    entryId: "69ae7042-9010-46df-a8b9-629de0a8ee3a",
    lemma: "dare",
    definition: "Semi-modal auxiliary expressing having the courage to do something",
    forms: [
      // Same semi-modal shape as "need" above: the ordinary lexical verb
      // ("dares"/"dared"/"daring", "she dared him to jump") is POS=VERB,
      // out of scope here; this AUXILIARY Word covers only the invariant
      // NICE-property auxiliary use.
      {
        field: WordFormField.MODAL_FORM,
        text: "dare",
        senses: [
          "Used as an auxiliary, chiefly in negative and interrogative sentences, to express that someone has or does not have the courage or audacity to do something. Example: 'I dare not ask.' / 'Dare he object?'",
          "Used in the fixed exclamatory construction 'how dare' to express indignation at someone's audacity. Example: 'How dare you!'",
        ],
      },
      // No secondaryModalForm -- same defective shape as "need" above.
    ],
  },
];

/** Seeds the 11 AUXILIARY lemma Words (be, have, do, can, may, shall,
 * will, must, ought, need, dare) this codebase's Common Vocabulary
 * Cache used to get from the now-retired auxiliaries.json, as a
 * standalone post-seed
 * role -- NounCharacterFormSeeder's own shape (role/noun_character_form_seeder.ts),
 * not folded into WordSeeder itself, since this is data this seeder
 * authors directly rather than reads from an asset file.
 *
 * One Word per lemma, every inflected spelling living on its own
 * WordForm record (data/entities/word_form.ts, data/entities/auxiliary.ts's own
 * docstring on why, not a scalar *_Form field the way every other POS
 * subtype still has, and not the flat one-Word-per-surface-form shape
 * auxiliaries.json used either). Every distinct meaning of every
 * WordForm gets its own Sense, registered onto **both** that specific
 * WordForm (`form.senseIds` -- the new, precise linkage: "what does
 * 'am' specifically mean?") **and** the owning Word (`Senses.registerMember()`,
 * exactly as before -- keeps `client_senses_section_html.ts`'s existing
 * Senses-panel rendering, driven off `word.senseIds`, working
 * unchanged). Deliberate dual registration, not duplication that can
 * drift: both references name the exact same Sense object/uuid, the
 * same "one Sense, referenced by more than one thing" shape a real
 * WordNet synonym Sense already has across every Word that lexicalizes
 * it.
 *
 * Called from inside `WordSeeder.seedClosedClassWords()` itself, ahead
 * of `DeterminerSeeder` and that method's own `loadCache()` loop
 * (that method's own docstring) -- not left for each caller to invoke
 * separately any more, `WordSeeder.MANDATORY_FILES`'s own comment has
 * the history of why that changed. "be"/"have"/"do" are deliberate
 * homographs with a VERB sense seeded by metalinguistic_verbs.json
 * (assets/common/en/README.md's own homograph table), and
 * Dictionary.lookup()'s "first entry wins" default is what decided
 * AUXILIARY as their default sense under the old auxiliaries.json (a
 * MANDATORY_FILES entry, loaded before every SUPPLEMENTARY_FILES entry
 * including metalinguistic_verbs.json) -- this seeder has to keep
 * running first for that same default to survive the move off
 * auxiliaries.json. */
export class AuxiliarySeeder {
  constructor(
    private readonly dictionary: Dictionary,
    private readonly senses?: Senses,
    private readonly wordForms?: WordForms,
  ) {}

  /** Idempotent, NounCharacterFormSeeder's own "upsert, never duplicate"
   * shape: a lemma already present as an AUXILIARY Word is left alone
   * entirely (including its own WordForms/Senses -- a re-seed never
   * re-registers or duplicates them), so this is safe to call on every
   * seed run, not just the first. Returns how many lemma Words were
   * newly created. */
  seed(): { created: number } {
    let created = 0;
    for (const lemmaSeed of AUXILIARY_LEMMAS) {
      const alreadyPresent = this.dictionary.lookupAll(lemmaSeed.lemma).some(isAuxiliary);
      if (alreadyPresent) continue;

      const word = createAuxiliary({
        text: lemmaSeed.lemma,
        // identifier(), not a bare `{ value }` literal -- createWord()'s
        // own defaulting (`init.entryId ?? identifier(crypto.randomUUID())`)
        // only auto-generates a fresh `uuid` when `entryId` is omitted
        // entirely; a caller-supplied partial entryId is trusted as-is.
        // Every other Word-creation path in this codebase either omits
        // entryId (letting createWord() generate one outright) or is a
        // `copyWordWithFreshUuid()` result (always overwrites `uuid`
        // explicitly) -- this seeder is neither, so it must build a
        // real, complete Identifier itself, or every lemma below shares
        // one `undefined` `entryId.uuid`, silently colliding in
        // Dictionary.byUuid and WordForms.formsByWordId alike.
        entryId: identifier(lemmaSeed.entryId),
        definition: { value: lemmaSeed.definition },
        isCommon: true,
      });
      this.dictionary.append(word);
      created++;

      for (const formSeed of lemmaSeed.forms) {
        // Every AUXILIARY spelling is NEUTRAL register -- Word no longer
        // carries a `registerCodes` of its own (data/entities/word.ts's
        // own docstring on why: register/style is a fact about one
        // specific spelling, so it lives on that spelling's own
        // `Text.languageStyleCode` instead), so this is attached per
        // WordForm rather than once on the Word the way it used to be.
        const form = createWordForm({
          field: formSeed.field,
          text: { value: formSeed.text, languageStyleCode: new LanguageStyleCode(LanguageStyleCodelist.NEUTRAL) },
        });
        this.wordForms?.append(form);
        this.wordForms?.registerMember(form, word);

        if (this.senses === undefined) continue;
        for (const definition of formSeed.senses) {
          const sense = createSense({ definition: { value: definition }, gloss: { value: definition }, isCommon: true });
          this.senses.append(sense);
          this.senses.registerMember(sense, word);
          form.senseIds = [...form.senseIds, { value: graphUuid(sense) }];
        }
      }
    }
    return { created };
  }
}
