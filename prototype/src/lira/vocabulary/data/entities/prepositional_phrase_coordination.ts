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
 * │ Module Name     │ lira/vocabulary/data/entities/prepositional_phrase_coordination
 * │ Filename        │ prepositional_phrase_coordination.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-25
 * │ Modified Date   │ 2026-09-01
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ PrepositionalPhraseCoordination: coordination between
 * │                 │ PrepositionalPhrases. E.g. "in London or in Paris".
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/data/entities/prepositional_phrase_coordination
 * @file prepositional_phrase_coordination.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { PrepositionalPhrase } from "./prepositional_phrase";
import type { Coordination } from "./coordination";

/**
 * Represents coordination between PrepositionalPhrases.
 *
 * Example:
 * "in London or in Paris"
 */
export interface PrepositionalPhraseCoordination
  extends Coordination<PrepositionalPhrase> {}
