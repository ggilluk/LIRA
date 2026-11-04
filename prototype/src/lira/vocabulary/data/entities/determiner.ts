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
 * │ Module Name     │ lira/vocabulary/data/entities/determiner
 * │ Filename        │ determiner.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-21
 * │ Modified Date   │ 2026-08-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Determiner: Word narrowed to the DETERMINER part of speech.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/data/entities/determiner
 * @file determiner.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/**
 * Represents a Determiner -- Word's own DETERMINER-specific subtype.
 *
 * See `documentation/architecture/data_entity_design_decisions_log.md`
 * for the design history behind this shape, including why its own
 * Word Form to Part of Speech Matrix fields (Singular/Plural Number
 * Form, Possessive Case Form, Consonant/Vowel-Sound Form) are not
 * declared here.
 */

import { PartOfSpeech } from "../enums/part_of_speech";
import type { Word } from "./word";

export interface Determiner extends Word {
  /** Grammatical part of speech under which this Word is defined. */
  partOfSpeech: PartOfSpeech.DETERMINER;
}
