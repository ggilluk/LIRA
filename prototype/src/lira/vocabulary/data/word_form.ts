/** WordForm: one inflected spelling of one Word -- Sense's own exact
 * counterpart one level down. A Sense already gives a shared *meaning*
 * its own identity, addressable via `senseIds` rather than being
 * inlined as a scalar field; WordForm does the same for one specific
 * *spelling* of a lemma ("am" as a distinct, addressable fact about
 * "be"), addressable via `Word.wordFormIds` rather than a scalar field
 * like `presentTenseInstanceForm`.
 *
 * Introduced for AUXILIARY only (data/entities/auxiliary.ts, which
 * dropped its own flat *_Form fields in favour of this) -- one real
 * example before generalizing, the same discipline `data/matrices/`
 * itself was held to before a second real matrix existed. Every other
 * POS subtype (Noun, Verb, Adjective, Adverb, Pronoun, Determiner) has
 * since followed the same path (each role/processor/*_processor.ts's
 * own generateXForms(), or -- Pronoun/Determiner -- just the base-lemma
 * form every Word gets) and none of them declares a scalar `*_Form`
 * field of its own any more either.
 *
 * `field` is a loose string, not a new enum, matching how
 * `WordFormRow.field` already names a *_Form field elsewhere in this
 * codebase (data/matrices/pos_vs_wordform_matrice.ts) --
 * `stringPatternsFor(field, pos)` validates a WordForm's own `text`
 * against the identical matrix rules a scalar field's value used to be
 * checked against; the matrix doesn't care which shape holds the value.
 *
 * Why a WordForm can carry more than one Sense: the same spelling can
 * carry more than one meaning ("am" is both the continuous-aspect and
 * the passive-voice auxiliary of "be") -- `Word.senseIds`'s own "a Word
 * can lexicalize several senses" shape, one level down. */

import type { Code, Identifier, Number_, Text } from "../../value_objects";
import type { Pronunciation } from "./pronunciation";
import { newUuid } from "./uuid";

export interface WordForm {
  // A per-Domain-graph-instance identity, freshly regenerated every
  // time a WordForm is copied into a Domain's own WordForms store --
  // Sense.uuid's/Word.uuid's own exact counterpart.
  uuid: Identifier;

  // Assigned once, when a WordForm is first authored, and left
  // untouched by every later copy -- Sense.entryId's/Word.entryId's own
  // exact counterpart.
  entryId: Identifier;

  // Which *_Form field this WordForm stands for, e.g.
  // "presentTenseInstanceForm" -- names the same field a scalar-field
  // POS subtype would have declared this value under.
  field: string;

  text: Text;

  // This spelling's own distinct meanings, 0..* -- Word.senseIds's own
  // exact shape, one level down. A Sense referenced here is the same
  // object (and uuid) that's also, today, registered onto the owning
  // Word's own senseIds (role/auxiliary_seeder.ts's own docstring on
  // why -- keeps the existing Senses-section UI working unchanged),
  // not a second, independently-authored copy.
  senseIds: readonly Identifier[];

  // Every recorded pronunciation of this specific spelling -- moved
  // here from Word (Word's own docstring on why: a fact about one
  // spelling, e.g. "read" pronounced /ri:d/ as the present-tense
  // WordForm but /rɛd/ as the past-tense one, not about the lemma as
  // a whole). Only ever populated for the base-lemma WordForm today
  // (WordForms.registerBaseLemmaForm()'s own `extra` parameter) --
  // nothing seeds it for any other WordForm yet.
  pronunciations: readonly Pronunciation[];

  // This spelling's own syllable breakdown/count/stress pattern --
  // same "fact about one spelling" reasoning as `pronunciations`
  // above (English regularly changes syllable count under inflection,
  // e.g. "walk" one syllable, "walking" two). Only ever populated for
  // the base-lemma WordForm today, from a Common Vocabulary Cache
  // entry's own syllable_representation/syllable_count/stress_pattern
  // (WordFileEntry, role/asset_loader.ts) -- undefined for a
  // WordNet-seeded WordForm, which carries no such curated data.
  syllableRepresentation?: Text;
  syllableCount?: Number_;
  stressPattern?: Text;

  // This spelling's own usage frequency -- same "fact about one
  // spelling" reasoning again (corpus frequency is measured per
  // surface form, not per lemma: "ran"/"running"/"runs" each have
  // their own real count). Only ever populated for the base-lemma
  // WordForm today, from a Common Vocabulary Cache entry's own
  // frequency_value/frequency_scale; never populated by
  // WordSeeder.seedWordNet.
  frequencyValue?: Number_;
  frequencyScale?: Code;
}

// `field`/`text` are the two facts every WordForm must be authored
// with -- WordInit's own exact "Pick the real requirements, Partial the
// rest" shape (role/word_processor.ts), not a bare `Partial<WordForm>`
// the way SenseInit is (every one of Sense's own fields is already
// optional, so Partial alone is enough there).
export type WordFormInit = Pick<WordForm, "field" | "text"> & Partial<Omit<WordForm, "field" | "text">>;

// WordForms.registerBaseLemmaForm()'s own `extra` parameter shape --
// every WordForm attribute that's a fact about pronunciation/frequency
// rather than about spelling or meaning (this file's own docstring on
// each field), applied onto an already-registered WordForm rather than
// supplied at creation time the way `field`/`text` are.
export type WordFormAttributes = Partial<
  Pick<WordForm, "pronunciations" | "syllableRepresentation" | "syllableCount" | "stressPattern" | "frequencyValue" | "frequencyScale">
>;

export function createWordForm(init: WordFormInit): WordForm {
  return {
    senseIds: [],
    pronunciations: [],
    uuid: init.uuid ?? { value: newUuid() },
    entryId: init.entryId ?? { value: newUuid() },
    ...init,
  };
}

/** A shallow copy of `form`, sharing every field's own object identity
 * except `uuid`, which becomes a fresh Identifier -- copySenseWithFreshUuid's/
 * copyWordWithFreshUuid's own exact counterpart, used by WordForms.seedFrom
 * for the same reason: two Domains' independent copies of the same form
 * must never be confused as the same graph node. */
export function copyWordFormWithFreshUuid(form: WordForm): WordForm {
  return { ...form, uuid: { value: newUuid() } };
}
