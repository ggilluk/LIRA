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
 * │ Module Name     │ lira/linguistics/data/paragraph
 * │ Filename        │ paragraph.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-08-12
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Paragraph: one paragraph block within a Document.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/data/paragraph
 * @file paragraph.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { LinguisticUnit } from "./linguistic_unit";
import type { ReadingError } from "./reading_error";
import type { Sentence } from "./sentence";
import { ValidationOutcome } from "./validation_outcome";

/** One paragraph block within a Document (Linguistic Hierarchy, README
 * section 3): Document -> Heading | Paragraph -> Sentence -> Clause ->
 * Phrase -> Word/Punctuation. `blockKind` discriminates a Document's
 * `blocks` union against `Heading` (heading.ts).
 *
 * `validation`/`confidence`/`errors` are a prototype-only addition
 * (Python's own paragraph.py has none of these): ParagraphReader
 * (role/paragraph_reader.ts) is a genuine read-path state-machine
 * level now, not just the write path's naive per-line split, so a
 * Paragraph needs the same validation triplet Clause/Sentence already
 * carry -- worst-outcome aggregated across its own Sentences (the same
 * `[ownOutcome, ...childOutcomes].reduce(min)` pattern
 * ClauseReader.validate already uses for Phrases). GraphProcessor's
 * write path (processDocument) still builds a Paragraph directly and
 * leaves these at their UNRESOLVED/empty defaults -- "not evaluated by
 * the read path", which is honest, not wrong.
 *
 * Ported from linguistics/data/paragraph.py. */
export interface Paragraph extends LinguisticUnit {
  blockKind: "paragraph";
  sentences: Sentence[];
  validation: ValidationOutcome;
  confidence: number;
  errors: readonly ReadingError[];
}

export function createParagraph(init: Pick<Paragraph, "text"> & Partial<Paragraph>): Paragraph {
  return { blockKind: "paragraph", sentences: [], validation: ValidationOutcome.UNRESOLVED, confidence: 0.0, errors: [], ...init };
}
