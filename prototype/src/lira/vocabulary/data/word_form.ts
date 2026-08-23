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

import type { Identifier, Text } from "../../value_objects";
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
}

// `field`/`text` are the two facts every WordForm must be authored
// with -- WordInit's own exact "Pick the real requirements, Partial the
// rest" shape (role/word_processor.ts), not a bare `Partial<WordForm>`
// the way SenseInit is (every one of Sense's own fields is already
// optional, so Partial alone is enough there).
export type WordFormInit = Pick<WordForm, "field" | "text"> & Partial<Omit<WordForm, "field" | "text">>;

export function createWordForm(init: WordFormInit): WordForm {
  return {
    senseIds: [],
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
