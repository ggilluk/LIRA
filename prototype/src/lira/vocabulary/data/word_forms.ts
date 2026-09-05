import type { Identifier, Text } from "../../value_objects";
import type { Word } from "./entities/word";
import type { Sense } from "./entities/sense";
import type { WordForm } from "./entities/word_form";
import { copyWordFormWithFreshUuid, createWordForm, graphUuid, type WordFormAttributes } from "../role/word_form_processor";
import { graphUuid as wordGraphUuid } from "../role/word_processor";
import { graphUuid as senseGraphUuid } from "../role/sense_processor";
import { WordFormType } from "./enums/word_forms_enum";

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
  // WordNet's own synset identifier for each WordForm that has one,
  // keyed by graphUuid -- synsetIdOf()'s own backing store. Not a field
  // on WordForm itself (WordForm's own docstring on why): it's an
  // externally-defined WordNet attribute, mapped onto the base-lemma
  // form's own senseIds[0] rather than duplicated as a scalar field.
  private readonly synsetIdByUuid = new Map<string, Identifier>();

  all(): readonly WordForm[] {
    return this.forms.slice();
  }

  findByUuid(formId: string): WordForm | undefined {
    return this.byUuid.get(formId);
  }

  append(form: WordForm): void {
    this.forms.push(form);
    this.byUuid.set(graphUuid(form), form);
  }

  /** Records that `word` carries `form` -- appends `form`'s own
   * per-Domain uuid (`graphUuid()` below) onto `word.wordFormIds` (the
   * field itself, data/entities/word.ts's own docstring) and indexes
   * `form.text.value` for lookupByText(). Senses.registerMember()'s own
   * exact shape, form-onto-word replacing sense-onto-member. Idempotent:
   * registering the same (form, word) pair twice never duplicates either
   * the `wordFormIds` entry or the text index entry. */
  registerMember(form: WordForm, word: Word): void {
    const uuid = graphUuid(form);
    if (!word.wordFormIds.some((id) => id.value === uuid)) {
      word.wordFormIds = [...word.wordFormIds, { value: uuid }];
    }
    const wordBucket = this.formsByWordId.get(wordGraphUuid(word));
    if (wordBucket === undefined) {
      this.formsByWordId.set(wordGraphUuid(word), [form]);
    } else if (!wordBucket.some((existing) => graphUuid(existing) === uuid)) {
      wordBucket.push(form);
    }

    const key = form.text.value.toLowerCase();
    const textBucket = this.textIndex.get(key);
    const entry = { form, word };
    if (textBucket === undefined) {
      this.textIndex.set(key, [entry]);
    } else if (!textBucket.some((existing) => graphUuid(existing.form) === uuid)) {
      textBucket.push(entry);
    }
  }

  /** Every WordForm registered against `word`, in registration order --
   * Senses.membersOf()'s own shape, reversed direction (a Word's own
   * forms, not a Sense's own members). */
  formsOf(word: Word): readonly WordForm[] {
    return this.formsByWordId.get(wordGraphUuid(word))?.slice() ?? [];
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
   * `wordForms.findNamedForm(word, WordFormType.BASE_LEMMA_CANONICAL_FORM)?.senseIds ?? []`,
   * baseLemmaFormOf() below's own shorthand for exactly that lookup. */
  findNamedForm(word: Word, field: WordFormType): WordForm | undefined {
    return this.formsOf(word).find((form) => form.field === field);
  }

  /** findNamedForm()'s own `WordFormType.BASE_LEMMA_CANONICAL_FORM`
   * shorthand -- every Word's own base-lemma WordForm, when one has
   * been registered (every real seeded Word has one; a bare
   * `createWord()`/`createNoun()` result with no WordForms store
   * involved at all does not). */
  baseLemmaFormOf(word: Word): WordForm | undefined {
    return this.findNamedForm(word, WordFormType.BASE_LEMMA_CANONICAL_FORM);
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

  /** `word`'s own base-lemma WordForm's own synset identifier -- Word's
   * former `synsetId` field's own exact replacement, and not a field on
   * `WordForm` either (that entity's own docstring on why: WordNet's
   * own synset identifier is externally defined, not intrinsic to a
   * WordForm's own shape). Unlike `senseIdsOf()` above, no cross-form
   * union is needed: a synset identifier is only ever set on the
   * base-lemma form (WordSeeder.synsetMemberToWord()'s own
   * `registerBaseLemmaForm()` call, the WordNet path's only writer),
   * never on any other WordForm, AUXILIARY's own included. */
  synsetIdOf(word: Word): Identifier | undefined {
    const form = this.baseLemmaFormOf(word);
    return form !== undefined ? this.synsetIdByUuid.get(graphUuid(form)) : undefined;
  }

  /** Reassigns `form`'s own synset identifier -- `registerBaseLemmaForm()`'s
   * own `synsetId` parameter is this method's usual caller, but
   * WordSeeder.orderSensesByFrequency() also calls this directly once a
   * Word's own senses are reordered by real frequency, to keep this
   * value in sync with the new `senseIds[0]` (that method's own
   * docstring). Passing `undefined` clears any previously-set value. */
  setSynsetId(form: WordForm, synsetId: Identifier | undefined): void {
    if (synsetId !== undefined) this.synsetIdByUuid.set(graphUuid(form), synsetId);
    else this.synsetIdByUuid.delete(graphUuid(form));
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
   * specialised to `WordFormType.BASE_LEMMA_CANONICAL_FORM`. */
  registerNamedForm(word: Word, field: WordFormType, text: Text): WordForm {
    const existing = this.findNamedForm(word, field);
    if (existing !== undefined) return existing;
    const form = createWordForm({ field, text });
    this.append(form);
    this.registerMember(form, word);
    return form;
  }

  /** Idempotent find-or-create: the WordForm standing for `word`'s own
   * base/canonical spelling -- registerNamedForm()'s own
   * `WordFormType.BASE_LEMMA_CANONICAL_FORM` special case. Reuses that name
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
   * separate guard.
   *
   * `synsetId`, when supplied, sets this WordForm's own synset
   * identifier via `setSynsetId()` above -- kept as its own parameter,
   * not folded into `extra`, since it isn't a `WordForm` field at all
   * (`synsetIdOf()`'s own docstring on why); only
   * WordSeeder.synsetMemberToWord() ever passes it. */
  registerBaseLemmaForm(word: Word, text?: Text, extra?: WordFormAttributes, synsetId?: Identifier): WordForm {
    const form = this.registerNamedForm(word, WordFormType.BASE_LEMMA_CANONICAL_FORM, text ?? { value: word.text });
    if (extra !== undefined) Object.assign(form, extra);
    if (synsetId !== undefined) this.setSynsetId(form, synsetId);
    return form;
  }

  /** Records that `form` carries `sense` -- appends `sense`'s own
   * per-Domain graph uuid onto `form.senseIds` (the field itself, data/entities/word_form.ts's own
   * docstring) -- Senses.registerMember()'s own idempotency shape, one
   * level down: never duplicates an entry already present, safe to call
   * again for the same (form, sense) pair on a re-seed. */
  registerSense(form: WordForm, sense: Sense): void {
    const senseUuid = senseGraphUuid(sense);
    if (!form.senseIds.some((id) => id.value === senseUuid)) {
      form.senseIds = [...form.senseIds, { value: senseUuid }];
    }
  }

  /** Bootstraps this WordForms store with a copy of every WordForm in
   * `other` -- Senses.seedFrom()'s own exact shape and own exact
   * limitation: membership isn't re-linked to the target Domain's own
   * copied Words (Word.wordFormIds keeps pointing at the source Domain's
   * WordForm uuids, not these fresh copies) -- data/entities/sense.ts's own docstring
   * on why: "a cross-Domain copy... doesn't carry a matching Sense
   * copy across yet, a known, accepted gap." WordForm inherits that
   * same accepted gap rather than solving it unilaterally one layer
   * down while Senses still has it. */
  seedFrom(other: WordForms): void {
    for (const form of other.forms) {
      const synsetId = other.synsetIdByUuid.get(graphUuid(form));
      const copy = copyWordFormWithFreshUuid(form);
      this.append(copy);
      if (synsetId !== undefined) this.setSynsetId(copy, synsetId);
    }
  }
}
