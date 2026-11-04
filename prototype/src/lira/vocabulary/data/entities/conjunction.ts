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
 * │ Module Name     │ lira/vocabulary/data/entities/conjunction
 * │ Filename        │ conjunction.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-21
 * │ Modified Date   │ 2026-08-31
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Conjunction: Word narrowed to the CONJUNCTION part of speech.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/data/entities/conjunction
 * @file conjunction.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/**
 * Represents a Conjunction -- Word's own CONJUNCTION-specific
 * subtype, narrowing `partOfSpeech` at the type level.
 *
 * See `documentation/architecture/data_entity_design_decisions_log.md`
 * for the design history behind this shape.
 */

import { PartOfSpeech } from "../enums/part_of_speech";
import { ConjunctionType } from "../enums/conjunction_type";
import type { Word } from "./word";

export interface Conjunction extends Word {
  /** Grammatical part of speech under which this Word is defined. */
  partOfSpeech: PartOfSpeech.CONJUNCTION;

  /** Whether this Conjunction links two or more equal constituents
   * (COORDINATING) or introduces a clause dependent on a main clause
   * (SUBORDINATING) -- data/enums/conjunction_type.ts's own docstring. */
  conjunctionType: ConjunctionType;
}
