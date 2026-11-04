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
 * │ Module Name     │ lira/vocabulary/data/entities/noun_phrase_coordination
 * │ Filename        │ noun_phrase_coordination.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-25
 * │ Modified Date   │ 2026-08-26
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ NounPhraseCoordination: coordination between NounPhrases. E.g.
 * │                 │ "the car or the van".
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/data/entities/noun_phrase_coordination
 * @file noun_phrase_coordination.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { NounPhrase } from "./noun_phrase";
import type { Coordination } from "./coordination";

/**
 * Represents coordination between NounPhrases.
 *
 * Example:
 * "the car or the van"
 */
export interface NounPhraseCoordination
  extends Coordination<NounPhrase> {}
