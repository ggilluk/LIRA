/**
 * Represents a Noun -- Word's own NOUN-specific subtype.
 *
 * See `documentation/architecture/data_entity_design_decisions_log.md`
 * for the design history behind this shape, including why the
 * Singular/Plural Number Form and Possessive Case Form fields the
 * Word Form to Part of Speech Matrix names for NOUN are not declared
 * here (they live as WordForm records instead, reached via
 * `Word.wordFormIds`).
 */

import type { Identifier, Text } from "../../../value_objects";
import { PartOfSpeech } from "../enums/part_of_speech";
import type { HolonymRootWord } from "../enums/holonym_root_word";
import type { HypernymRootWord } from "../enums/hypernym_root_word";
import type { InterrogativeRootWord } from "../enums/interrogative_root_word";
import type { VectorPrimitiveRootWord } from "../enums/vector_primitive_root_word";
import type { Word } from "./word";

export interface Noun extends Word {

  // ── Classification ───────────────────────────────────────

  partOfSpeech: PartOfSpeech.NOUN;

  /**
   * Indicates whether this Noun denotes a countable quantity.
   *
   * Undefined when countability has not been curated for this Noun.
   */
  isCountable?: boolean;

  /** Indicates whether this Noun names the answer to an interrogative in the Interrogative/Hypernym/Holonym/Vector-Primitive root word table. */
  isRootWord: boolean;

  /**
   * Interrogative this Noun answers, in the Interrogative/Hypernym/
   * Holonym/Vector-Primitive root word table.
   *
   * Undefined unless `isRootWord` is true and this is that
   * interrogative's own column.
   */
  interrogativeRootWord?: InterrogativeRootWord;

  /**
   * Hypernym column this Noun instantiates, in the Interrogative/
   * Hypernym/Holonym/Vector-Primitive root word table.
   *
   * Undefined unless `isRootWord` is true and this is that
   * hypernym's own column.
   */
  hypernymRootWord?: HypernymRootWord;

  /**
   * Holonym column this Noun instantiates, in the Interrogative/
   * Hypernym/Holonym/Vector-Primitive root word table.
   *
   * Undefined unless `isRootWord` is true and this is that
   * holonym's own column.
   */
  holonymRootWord?: HolonymRootWord;

  /**
   * Vector/primitive column this Noun instantiates, in the
   * Interrogative/Hypernym/Holonym/Vector-Primitive root word table.
   *
   * Undefined unless `isRootWord` is true and this is that
   * primitive's own column.
   */
  vectorPrimitiveRootWord?: VectorPrimitiveRootWord;

  /** Indicates whether this Noun can be considered derived from (or shares its lexical form with) a corresponding VERB sense. */
  isDerivableNoun: boolean;


  // ── Data Attributes ──────────────────────────────────────

  /**
   * Every literal Unicode character this Noun names, for a Noun that
   * is itself the name of a mark rather than a word that uses one
   * (e.g. "comma" names ",").
   *
   * Empty when this Noun names no character of its own.
   */
  wordCharacterForms: readonly Text[];


  // ── References ───────────────────────────────────────────

  /**
   * Identifier of the Verb this Noun nominalizes from (e.g.
   * "decision" from "decide").
   *
   * Undefined when this Noun is not a nominalisation of a Verb.
   */
  isDerivedFromVerb?: Identifier;

  /** Indicates whether `isDerivedFromVerb` is set. */
  isDerivedFromVerbIndicator: boolean;

  /**
   * Identifier of the Adjective this Noun nominalizes from (e.g.
   * "happiness" from "happy").
   *
   * Undefined when this Noun is not a nominalisation of an
   * Adjective.
   */
  isDerivedFromAdjective?: Identifier;

  /** Indicates whether `isDerivedFromAdjective` is set. */
  isDerivedFromAdjectiveIndicator: boolean;
}
