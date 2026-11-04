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
 * │ Module Name     │ lira/vocabulary/agents/normalise_agent
 * │ Filename        │ normalise_agent.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-08-11
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ NormaliseAgent: normalises words, identifiers, symbols and
 * │                 │ codes.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/agents/normalise_agent
 * @file normalise_agent.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { VocabularyAgent } from "./index";

/** Normalises vocabulary entries -- words, identifiers, symbols,
 * language and currency codes (Layer Summary: Vocabulary Layer).
 * Ported from vocabulary/agents/normalise_agent.py. */
export class NormaliseAgent extends VocabularyAgent {}
