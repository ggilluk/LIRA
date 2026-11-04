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
 * │ Module Name     │ lira/vocabulary/data/entities/auxiliary
 * │ Filename        │ auxiliary.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-22
 * │ Modified Date   │ 2026-08-23
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Auxiliary: Word narrowed to the AUXILIARY part of speech.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/data/entities/auxiliary
 * @file auxiliary.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/**
 * Represents an Auxiliary -- Word's own AUXILIARY-specific subtype.
 * One Word per base lemma (be, have, do, can, may, shall, will,
 * must, ought, need, dare), not one per surface spelling -- every
 * distinguishing spelling (e.g. "was", "were") lives on a WordForm
 * record reached via this Word's own `wordFormIds` instead.
 *
 * See `documentation/architecture/data_entity_design_decisions_log.md`
 * for the design history behind this shape.
 */

import { PartOfSpeech } from "../enums/part_of_speech";
import type { Word } from "./word";

export interface Auxiliary extends Word {
  /** Grammatical part of speech under which this Word is defined. */
  partOfSpeech: PartOfSpeech.AUXILIARY;
}
