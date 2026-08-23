import type { Identifier, Text } from "../../value_objects";
import type { Word } from "./entities/word";
import type { Sense } from "./entities/sense";
import type { WordForm } from "./entities/word_form";
import { copyWordFormWithFreshUuid, createWordForm, type WordFormAttributes } from "../role/word_form_processor";

/** WordForm storage: Senses's own exact counterpart one level down
 * (data/entities/word_form.ts's own docstring on why WordForm exists at all).
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

  /** The WordForm standing for `word`'s own `field`, if one has been
   * registered -- the pure read side registerNamedForm() below builds
   * its own find-or-create on top of. Also how every reader resolves a
   * fact that moved off Word onto its base-lemma WordForm (`senseIds`/
   * `synsetId`/`contractionOf`, each field's own docstring, data/entities/word_form.ts):
   * `wordForms.findNamedForm(word, "baseLemmaCanonicalForm")?.senseIds ?? []`,
   * baseLemmaFormOf() below's own shorthand for exactly that lookup. */
  findNamedForm(word: Word, field: string): WordForm | undefined {
    return this.formsOf(word).find((form) => form.field === field);
  }

  /** findNamedForm()'s own `"baseLemmaCanonicalForm"` shorthand --
   * every Word's own base-lemma WordForm, when one has been registered
   * (every real seeded Word has one; a bare `createWord()`/`createNoun()`
   * result with no WordForms store involved at all does not). */
  baseLemmaFormOf(word: Word): WordForm | undefined {
    return this.findNamedForm(word, "baseLemmaCanonicalForm");
  }

  /** Every Sense any of `word`'s own WordForms carries, unioned across
   * all of them in WordForm registration order, each senseId appearing
   * once -- Word's former `senseIds` field's own exact replacement,
   * generalized past "always the base-lemma form alone": every POS
   * subtype except AUXILIARY only ever registers a Sense onto the
   * base-lemma form (so this reduces to that one form's own senseIds
   * for all of them), but AUXILIARY genuinely spreads its own senses
   * across more than one WordForm ("am"'s own senses differ from
   * "is"'s own -- role/auxiliary_seeder.ts's own docstring on the dual
   * registration this replaces), so reading only the base-lemma form
   * would silently under-report an Auxiliary Word's own senses.
   * `senseIdsOf(word)[0]` is this Word's own "primary sense", the exact
   * same entry `word.senseIds[0]` used to name -- the accumulation
   * order here (form-by-form, each form's own senses in its own
   * registration order) exactly reproduces how the old field itself
   * used to fill up, base-lemma-first for every non-AUXILIARY POS. */
  senseIdsOf(word: Word): readonly Identifier[] {
    const seen = new Set<string>();
    const result: Identifier[] = [];
    for (const form of this.formsOf(word)) {
      for (const senseId of form.senseIds) {
        if (!seen.has(senseId.value)) {
          seen.add(senseId.value);
          result.push(senseId);
        }
      }
    }
    return result;
  }

  /** `word`'s own base-lemma WordForm's own `synsetId` -- Word's former
   * `synsetId` field's own exact replacement. Unlike `senseIdsOf()`
   * above, no cross-form union is needed: synsetId is only ever set on
   * the base-lemma form (WordSeeder.synsetMemberToWord()'s own `extra`
   * parameter, the WordNet path's only writer), never on any other
   * WordForm, AUXILIARY's own included. */
  synsetIdOf(word: Word): Identifier | undefined {
    return this.baseLemmaFormOf(word)?.synsetId;
  }

  /** `word`'s own base-lemma WordForm's own `contractionOf` -- Word's
   * former `contractionOf` field's own exact replacement.
   * RelationshipSeeder's own CONTRACTION handling is this field's only
   * writer, and always targets the base-lemma form directly (a
   * contraction's own identity is a fact about its one spelling, not
   * about any of its other inflected forms, none of which a
   * contraction like "don't" even has). Empty, not undefined, when
   * `word` has no base-lemma WordForm registered at all -- matches the
   * old field's own "empty when not itself a contraction" default. */
  contractionOfOf(word: Word): readonly Identifier[] {
    return this.baseLemmaFormOf(word)?.contractionOf ?? [];
  }

  /** Idempotent find-or-create: the WordForm standing for `word`'s own
   * `field` -- reuses `word`'s own existing entry for that field if one
   * was already registered (by this call or any earlier one), rather
   * than creating a duplicate on a re-seed. The one primitive every
   * POS's own generateXForms()/hand-curated seeder call uses to store an
   * inflected spelling -- registerBaseLemmaForm() below is just this,
   * specialised to `"baseLemmaCanonicalForm"`. */
  registerNamedForm(word: Word, field: string, text: Text): WordForm {
    const existing = this.findNamedForm(word, field);
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
   * `text`, when supplied, is this WordForm's own rich spelling
   * (language/script/version, `Text`'s own docstring, value_objects/
   * data/text.ts) -- Word carries no `lexicalForm` of its own any more
   * for this to read (`WordForm`'s own docstring on why), so a caller
   * constructing a brand-new Word passes it explicitly (WordSeeder's
   * own synsetMemberToWord()/seedClosedClassWords()). Defaults to
   * `{value: word.text}` when omitted -- correct for every later,
   * idempotent call for a Word whose base-lemma form was already
   * registered with the real Text on its first call (registerUniqueSense()'s
   * own call, in particular, always omits it for exactly this reason).
   *
   * `extra`, when supplied, sets this WordForm's own normalised-spelling/
   * pronunciation/syllable/frequency attributes (`WordForm`'s own
   * docstring on why those live here, not on Word) -- only ever passed
   * by WordSeeder.entryToWord()'s own caller and role/dictionary_hydrator.ts,
   * the only two places any of that data is actually read from outside
   * this codebase; every other caller omits it, leaving those attributes
   * at createWordForm()'s own defaults the same as `registerNamedForm()`'s
   * own callers already do. Applied every call, not just the first --
   * idempotent the same way the rest of this method is, so a re-seed
   * simply reapplies the same values rather than needing its own
   * separate guard. */
  registerBaseLemmaForm(word: Word, text?: Text, extra?: WordFormAttributes): WordForm {
    const form = this.registerNamedForm(word, "baseLemmaCanonicalForm", text ?? { value: word.text });
    if (extra !== undefined) Object.assign(form, extra);
    return form;
  }

  /** Records that `form` carries `sense` -- appends `sense.uuid` onto
   * `form.senseIds` (the field itself, data/entities/word_form.ts's own
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
