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
 * │ Module Name     │ lira/vocabulary/data/entities/interjection
 * │ Filename        │ interjection.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-21
 * │ Modified Date   │ 2026-08-23
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Interjection: Word narrowed to the INTERJECTION part of speech.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/data/entities/interjection
 * @file interjection.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/**
 * Represents an Interjection -- Word's own INTERJECTION-specific
 * subtype, narrowing `partOfSpeech` at the type level. Carries no
 * field of its own beyond `partOfSpeech`.
 *
 * See `documentation/architecture/data_entity_design_decisions_log.md`
 * for the design history behind this shape.
 */

import { PartOfSpeech } from "../enums/part_of_speech";
import type { Word } from "./word";

export interface Interjection extends Word {
  /** Grammatical part of speech under which this Word is defined. */
  partOfSpeech: PartOfSpeech.INTERJECTION;
}
