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
 * │ Module Name     │ lira/linguistics/ui/user_prompt
 * │ Filename        │ user_prompt.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-08-11
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ UserPrompt: raw user input at the UI boundary, before any
 * │                 │ processing.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/ui/user_prompt
 * @file user_prompt.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { LinguisticUnit } from "../data/linguistic_unit";

/** UserPrompt: the artefact at the UI boundary -- raw user input,
 * before GraphProcessor has done anything to it.
 *
 * Ported from linguistics/ui/user_prompt.py. Lives in ui/ (mirroring
 * the Python original's own placement) despite being a plain data
 * shape with no rendering of its own -- it's the boundary type
 * PromptTokenizer/LinguisticController take as input, not a UI
 * component; the actual Linguistics UI (sentence_reader_view.py,
 * sentence_reader_server.py) is not ported (this session's task was
 * "the Linguistics Service, not the UI"). */
export type UserPrompt = LinguisticUnit;

export function createUserPrompt(text: string): UserPrompt {
  return { text };
}
