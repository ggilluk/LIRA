/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/vocabulary/data/entities/adverb
 * │ Filename        │ adverb.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-21
 * │ Modified Date   │ 2026-08-23
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Adverb: Word narrowed to the ADVERB part of speech.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/data/entities/adverb
 * @file adverb.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/**
 * Represents an Adverb -- Word's own ADVERB-specific subtype.
 *
 * See `documentation/architecture/data_entity_design_decisions_log.md`
 * for the design history behind this shape, including why the
 * Positive/Comparative/Superlative Degree Form fields the Word Form
 * to Part of Speech Matrix names for ADVERB are not declared here
 * (they live as WordForm records instead, reached via
 * `Word.wordFormIds`).
 */

import type { Identifier } from "../../../value_objects";
import { PartOfSpeech } from "../enums/part_of_speech";
import type { Word } from "./word";

export interface Adverb extends Word {

  // ── Classification ───────────────────────────────────────

  partOfSpeech: PartOfSpeech.ADVERB;


  // ── References ───────────────────────────────────────────

  /**
   * Identifier of the Adjective this Adverb adverbialises from (e.g.
   * "quickly" from "quick").
   *
   * Undefined when this Adverb is not adverbialised from an
   * Adjective.
   */
  isDerivedFromAdjective?: Identifier;

  /** Indicates whether `isDerivedFromAdjective` is set. */
  isDerivedFromAdjectiveIndicator: boolean;
}
