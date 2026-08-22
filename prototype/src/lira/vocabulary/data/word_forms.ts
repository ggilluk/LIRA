import type { Word } from "./entities/word";
import { copyWordFormWithFreshUuid, type WordForm } from "./word_form";

/** WordForm storage: Senses's own exact counterpart one level down
 * (data/word_form.ts's own docstring on why WordForm exists at all).
 * One WordForms store per Domain, alongside that Domain's own
 * Dictionary/Phrases/Senses (VocabularyContext.wordForms,
 * data/vocabulary_context.ts).
 *
 * AUXILIARY-only today (role/auxiliary_seeder.ts is this store's only
 * writer) -- every other POS subtype's own spellings still live in
 * scalar `*_Form` fields (data/pos_form_fields.ts), untouched. */
export class WordForms {
  private forms: WordForm[] = [];
  private readonly byUuid = new Map<string, WordForm>();
  private readonly formsByWordId = new Map<string, WordForm[]>();
  // Case-insensitive text -> every (form, owning word) pair whose own
  // `text.value` equals that text -- Dictionary.lookupFormMatches()'s
  // own exact index shape (data/dictionary.ts), built eagerly as forms
  // are registered rather than as a deferred batch pass: unlike
  // Adjective/Adverb (whose gradability-derived comparativeDegreeForm/
  // superlativeDegreeForm aren't known until after the relationship
  // graph seeds, Dictionary.indexWordForms()'s own docstring), every
  // Auxiliary WordForm is fully known at creation time in
  // AuxiliarySeeder, so there's no later pass this index would need to
  // wait for.
  private readonly textIndex = new Map<string, Array<{ form: WordForm; word: Word }>>();

  all(): readonly WordForm[] {
    return this.forms.slice();
  }

  findByUuid(formId: string): WordForm | undefined {
    return this.byUuid.get(formId);
  }

  append(form: WordForm): void {
    this.forms.push(form);
    this.byUuid.set(form.uuid.value, form);
  }

  /** Records that `word` carries `form` -- appends `form.uuid` onto
   * `word.formIds` (the field itself, data/entities/word.ts's own
   * docstring) and indexes `form.text.value` for lookupByText().
   * Senses.registerMember()'s own exact shape, form-onto-word replacing
   * sense-onto-member. Idempotent: registering the same (form, word)
   * pair twice never duplicates either the `formIds` entry or the text
   * index entry. */
  registerMember(form: WordForm, word: Word): void {
    if (!word.formIds.some((id) => id.value === form.uuid.value)) {
      word.formIds = [...word.formIds, form.uuid];
    }
    const wordBucket = this.formsByWordId.get(word.uuid.value);
    if (wordBucket === undefined) {
      this.formsByWordId.set(word.uuid.value, [form]);
    } else if (!wordBucket.some((existing) => existing.uuid.value === form.uuid.value)) {
      wordBucket.push(form);
    }

    const key = form.text.value.toLowerCase();
    const textBucket = this.textIndex.get(key);
    const entry = { form, word };
    if (textBucket === undefined) {
      this.textIndex.set(key, [entry]);
    } else if (!textBucket.some((existing) => existing.form.uuid.value === form.uuid.value)) {
      textBucket.push(entry);
    }
  }

  /** Every WordForm registered against `word`, in registration order --
   * Senses.membersOf()'s own shape, reversed direction (a Word's own
   * forms, not a Sense's own members). */
  formsOf(word: Word): readonly WordForm[] {
    return this.formsByWordId.get(word.uuid.value)?.slice() ?? [];
  }

  /** Every (form, owning word) pair whose own `text` equals `text`
   * verbatim (case-insensitive) -- Dictionary.lookupFormMatches()'s own
   * exact contract, so PartOfSpeechIdentifier.identifySeeded() can
   * merge this store's own results with Dictionary's without either
   * caller needing a different shape for the two. Empty when nothing
   * matches. */
  lookupByText(text: string): readonly { form: WordForm; word: Word }[] {
    return this.textIndex.get(text.toLowerCase())?.slice() ?? [];
  }

  /** Bootstraps this WordForms store with a copy of every WordForm in
   * `other` -- Senses.seedFrom()'s own exact shape and own exact
   * limitation: membership isn't re-linked to the target Domain's own
   * copied Words (Word.formIds keeps pointing at the source Domain's
   * WordForm uuids, not these fresh copies) -- Sense.ts's own docstring
   * on why: "a cross-Domain copy... doesn't carry a matching Sense
   * copy across yet, a known, accepted gap." WordForm inherits that
   * same accepted gap rather than solving it unilaterally one layer
   * down while Senses still has it. */
  seedFrom(other: WordForms): void {
    for (const form of other.forms) this.append(copyWordFormWithFreshUuid(form));
  }
}
