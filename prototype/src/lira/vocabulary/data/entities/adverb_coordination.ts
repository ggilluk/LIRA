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
 * │ Module Name     │ lira/vocabulary/data/entities/adverb_coordination
 * │ Filename        │ adverb_coordination.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-25
 * │ Modified Date   │ 2026-08-25
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ AdverbCoordination: coordination between Adverbs. E.g. "quickly or
 * │                 │ carefully".
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/data/entities/adverb_coordination
 * @file adverb_coordination.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Adverb } from "./adverb";
import type { Coordination } from "./coordination";

/**
 * Represents coordination between Adverbs.
 *
 * Example:
 * "quickly or carefully"
 */
export interface AdverbCoordination extends Coordination<Adverb> {}
