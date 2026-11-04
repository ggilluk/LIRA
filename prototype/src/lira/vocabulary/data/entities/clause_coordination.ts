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
 * │ Module Name     │ lira/vocabulary/data/entities/clause_coordination
 * │ Filename        │ clause_coordination.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-25
 * │ Modified Date   │ 2026-08-25
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ ClauseCoordination: coordination between Clauses. E.g. "John
 * │                 │ arrived and Mary left".
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/data/entities/clause_coordination
 * @file clause_coordination.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Clause } from "../../../linguistics/data/clause";
import type { Coordination } from "./coordination";

/**
 * Represents coordination between Clauses.
 *
 * Example:
 * "John arrived and Mary left"
 */
export interface ClauseCoordination
  extends Coordination<Clause> {}
