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
 * │ Module Name     │ lira/linguistics/data/linguistic_unit
 * │ Filename        │ linguistic_unit.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-08-12
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ LinguisticUnit: the base type of every artefact in the
 * │                 │ Word/Clause/Sentence/Paragraph/Heading/Document tree.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/data/linguistic_unit
 * @file linguistic_unit.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { LinguisticSystemProperty } from "./system_property";

/** Base type for every artefact in the Word/Clause/Sentence/Paragraph/
 * Heading/Document/UserPrompt tree (Layer Summary: Linguistics Layer). Ported
 * from linguistics/data/linguistic_unit.py. `systemProperty` is now
 * fully typed against the real `LinguisticSystemProperty` (the
 * Linguistics Service is ported -- see linguistics/role/) -- Vocabulary's
 * `Word` still only ever reads/writes it as an opaque field, same as
 * before. */
export interface LinguisticUnit {
  text: string;
  systemProperty?: LinguisticSystemProperty;
}
