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
 * │ Module Name     │ lira/vocabulary/data/entities/pronoun
 * │ Filename        │ pronoun.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-18
 * │ Modified Date   │ 2026-08-23
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Pronoun: Word narrowed to the PRONOUN part of speech.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/data/entities/pronoun
 * @file pronoun.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/**
 * Represents a Pronoun -- Word's own PRONOUN-specific subtype.
 *
 * See `documentation/architecture/data_entity_design_decisions_log.md`
 * for the design history behind this shape, including why its own
 * Word Form to Part of Speech Matrix fields (Singular/Plural Number
 * Form, First/Second/Third Person Form, Subjective/Objective/
 * Possessive/Reflexive Case Form) are not declared here.
 */

import { PartOfSpeech } from "../enums/part_of_speech";
import type { Word } from "./word";

export interface Pronoun extends Word {
  /** Grammatical part of speech under which this Word is defined. */
  partOfSpeech: PartOfSpeech.PRONOUN;
}
