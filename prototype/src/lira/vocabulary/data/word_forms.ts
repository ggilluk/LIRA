import type { Text } from "../../value_objects";
import type { Word } from "./entities/word";
import type { Sense } from "./sense";
import { copyWordFormWithFreshUuid, createWordForm, type WordForm } from "./word_form";

/** WordForm storage: Senses's own exact counterpart one level down
 * (data/word_form.ts's own docstring on why WordForm exists at all).
 * One WordForms store per Domain, alongside that Domain's own
 * Dictionary/Phrases/Senses (VocabularyContext.wordForms,
 * data/vocabulary_context.ts).
 *
 * `registerNamedForm()` is the one primitive every writer builds on --
 * role/auxiliary_seeder.ts (every AUXILIARY lemma's own inflected
 * forms), each POS's own generateXForms() (role/processor/*_processor.ts,
 * an inflected spelling per POS subtype -- every one of them now,
 * Auxiliary having been the first to migrate), and
 * role/word_seeder.ts's registerUniqueSense()/seedWordNet() (every
 * ordinary Word's own base-lemma WordForm, via registerBaseLemmaForm()'s
 * own thin wrapper below). */
export class WordForms {
  private forms: WordForm[] = [];
  private readonly byUuid = new Map<string, WordForm>();
  private readonly formsByWordId = new Map<string, WordForm[]>();
  // Case-insensitive text -> every (form, owning word) pair whose own
  // `text.value` equals that text -- built eagerly as forms are
  // registered rather than as a deferred batch pass: unlike Adjective/
  // Adverb (whose gradability-derived comparativeDegreeForm/
  // superlativeDegreeForm aren't known until after the relationship
  // graph seeds), every Auxiliary WordForm is fully known at creation
  // time in AuxiliarySeeder, so there's no later pass this index would
  // need to wait for -- and every other POS's own generateXForms()
  // simply calls registerNamedForm() again, harmlessly, once its own
  // later-known fields are ready, the same idempotent find-or-create
  // this index already relies on throughout.
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
   * `word.wordFormIds` (the field itself, data/entities/word.ts's own
   * docstring) and indexes `form.text.value` for lookupByText().
   * Senses.registerMember()'s own exact shape, form-onto-word replacing
   * sense-onto-member. Idempotent: registering the same (form, word)
   * pair twice never duplicates either the `wordFormIds` entry or the
   * text index entry. */
  registerMember(form: WordForm, word: Word): void {
    if (!word.wordFormIds.some((id) => id.value === form.uuid.value)) {
      word.wordFormIds = [...word.wordFormIds, form.uuid];
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
   * verbatim (case-insensitive) -- PartOfSpeechIdentifier.identifySeeded()'s
   * own inflected-form fallback, tried once an exact
   * Dictionary.lookupAll() match fails. Empty when nothing matches. */
  lookupByText(text: string): readonly { form: WordForm; word: Word }[] {
    return this.textIndex.get(text.toLowerCase())?.slice() ?? [];
  }

  /** Idempotent find-or-create: the WordForm standing for `word`'s own
   * `field` -- reuses `word`'s own existing entry for that field if one
   * was already registered (by this call or any earlier one), rather
   * than creating a duplicate on a re-seed. The one primitive every
   * POS's own generateXForms()/hand-curated seeder call uses to store an
   * inflected spelling -- registerBaseLemmaForm() below is just this,
   * specialised to `"baseLemmaCanonicalForm"`. */
  registerNamedForm(word: Word, field: string, text: Text): WordForm {
    const existing = this.formsOf(word).find((form) => form.field === field);
    if (existing !== undefined) return existing;
    const form = createWordForm({ field, text });
    this.append(form);
    this.registerMember(form, word);
    return form;
  }

  /** Idempotent find-or-create: the WordForm standing for `word`'s own
   * base/canonical spelling -- registerNamedForm()'s own
   * `"baseLemmaCanonicalForm"` special case. Reuses that name
   * deliberately -- it's already the Word Form Matrix's own first row
   * name, so this converges onto that existing concept instead of
   * inventing a new one for the same idea.
   *
   * `text` prefers `word.baseLemmaCanonicalForm` (the scalar field's
   * own docstring, data/entities/word.ts: set only when a Word's own
   * stored spelling isn't already its canonical form -- e.g. a Word
   * modelling one specific inflected surface form, pointing back to a
   * different lemma) over `word.lexicalForm`/`word.text` -- this is
   * what gives that scalar field a real downstream consumer for the
   * first time; nothing read it before this. For the ordinary case (a
   * Word's own `text` already is its canonical spelling, the vast
   * majority), the two agree, so this WordForm's own `text` is simply
   * `word.text`. */
  registerBaseLemmaForm(word: Word): WordForm {
    return this.registerNamedForm(word, "baseLemmaCanonicalForm", word.baseLemmaCanonicalForm ?? word.lexicalForm ?? { value: word.text });
  }

  /** Records that `form` carries `sense` -- appends `sense.uuid` onto
   * `form.senseIds` (the field itself, data/word_form.ts's own
   * docstring) -- Senses.registerMember()'s own idempotency shape, one
   * level down: never duplicates an entry already present, safe to call
   * again for the same (form, sense) pair on a re-seed. */
  registerSense(form: WordForm, sense: Sense): void {
    if (!form.senseIds.some((id) => id.value === sense.uuid.value)) {
      form.senseIds = [...form.senseIds, sense.uuid];
    }
  }

  /** Bootstraps this WordForms store with a copy of every WordForm in
   * `other` -- Senses.seedFrom()'s own exact shape and own exact
   * limitation: membership isn't re-linked to the target Domain's own
   * copied Words (Word.wordFormIds keeps pointing at the source Domain's
   * WordForm uuids, not these fresh copies) -- Sense.ts's own docstring
   * on why: "a cross-Domain copy... doesn't carry a matching Sense
   * copy across yet, a known, accepted gap." WordForm inherits that
   * same accepted gap rather than solving it unilaterally one layer
   * down while Senses still has it. */
  seedFrom(other: WordForms): void {
    for (const form of other.forms) this.append(copyWordFormWithFreshUuid(form));
  }
}
