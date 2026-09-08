/**
 * Represents one inflected spelling of one Word.
 *
 * A WordForm gives a single spelling its own identity, addressable via
 * `Word.wordFormIds` rather than inlined as a scalar field on Word --
 * Sense's own exact counterpart one level down (a Sense gives a shared
 * meaning its own identity; a WordForm does the same for one specific
 * spelling of a lemma).
 *
 * See `documentation/architecture/data_entity_design_decisions_log.md`
 * for the design history behind this shape.
 */

import type { Code, Identifier, Number_, Text } from "../../../value_objects";
import type { WordFormType } from "../enums/word_forms_enum";

export interface WordForm {

  // ── Identity ─────────────────────────────────────────────

  /**
   * Identifier of the underlying WordForm entry this record
   * represents.
   *
   * `wordFormId.value` is stable across every Domain that holds a copy
   * of this WordForm; `wordFormId.uuid` is this WordForm's own unique
   * identifier within its own Domain, freshly regenerated every time
   * this WordForm is copied into another Domain.
   */
  wordFormId: Identifier;


  // ── Classification ───────────────────────────────────────

  /**
   * Which `*_Form` type this WordForm stands for -- the Word Form to
   * Part of Speech Matrix's own single agreed list
   * (data/enums/word_forms_enum.ts, data/matrices/pos_vs_wordform_matrice.ts).
   */
  formType: WordFormType;


  // ── Data Attributes ──────────────────────────────────────

  /** Spelling of this WordForm as it is conventionally written. */
  text: Text;

  /**
   * This spelling's own usage frequency value.
   *
   * Undefined when a frequency value has not been curated for this
   * spelling.
   */
  frequencyValue?: Number_;

  /**
   * Scale the frequency named by `frequencyValue` is expressed on.
   *
   * Undefined when `frequencyValue` is undefined.
   */
  frequencyScale?: Code;


  // ── References ───────────────────────────────────────────

  /**
   * Identifiers of the Senses this spelling lexicalizes.
   *
   * More than one entry means this one spelling carries more than one
   * distinct meaning.
   *
   * Carries no `synsetId` of its own for the same reason Sense doesn't
   * (Sense's own docstring): WordNet's own synset identifier is an
   * externally-defined attribute, mapped onto `senseIds[0]` via
   * `WordForms.synsetIdOf(word)` instead (data/word_forms.ts).
   */
  senseIds: readonly Identifier[];

  /**
   * Identifiers of this contracted spelling's own components -- each
   * either a `Word` (a bare closed-class lemma, e.g. "do"/"not" for
   * "don't") or a `WordForm` (a specific inflected spelling that is not
   * itself an independently addressable Word under this codebase's own
   * lemma+WordForm model, e.g. "is"/"was"/"had"/"am", each a WordForm of
   * the "be"/"have" lemma -- an "isn't"->"be" pointer alone couldn't
   * distinguish 3rd-singular "is" from "was"/"were"/"am"/"are"). Never a
   * `Phrase` -- deliberately: this family's two real syntactic shapes
   * (Auxiliary + Negator: don't/can't/isn't/wasn't/hadn't; Subject Pronoun
   * + finite Auxiliary: I'm/it's) fit neither one of `PhraseType`'s own six
   * structural shapes (`VERB_PHRASE`'s own Head Identification Rule admits
   * only `Verb`, never `Auxiliary`, data/enums/phrase_type.ts) nor a
   * persisted `Clause` (this codebase has no addressable Clause store at
   * all -- Clause is built fresh per sentence read by ClauseReader, never
   * seeded) -- see role/contraction_seeder.ts's own docstring and
   * documentation/architecture/data_entity_design_decisions_log.md for the
   * full grammar analysis. `Identifier` itself carries no type of its own
   * to narrow between the two (`Phrase.headWord`'s own identical
   * reasoning, data/entities/phrase.ts), so this stays a plain
   * `Identifier[]`, resolved by trying `Dictionary.findByUuid()` first and
   * `WordForms.findByUuid()` on a miss.
   *
   * Many-to-many, not always a pair -- "n't" is itself a genuine one-
   * component contraction of "not" alone.
   *
   * Empty when this WordForm is not itself a contraction.
   */
  contractionOf: readonly Identifier[];
}
