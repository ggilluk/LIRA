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
 * │ Module Name     │ lira/vocabulary/role/processor/interjection_processor
 * │ Filename        │ interjection_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-21
 * │ Modified Date   │ 2026-09-11
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Interjection behaviour: construction and type guard.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/role/processor/interjection_processor
 * @file interjection_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Word } from "../../data/entities/word";
import { createWord } from "./word_processor";
import type { Interjection } from "../../data/entities/interjection";

export type InterjectionInit = Pick<Interjection, "text"> & Partial<Omit<Interjection, "text" | "partOfSpeech">>;

export function createInterjection(init: InterjectionInit): Interjection {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.INTERJECTION }) as Interjection;
}

export function isInterjection(word: Word): word is Interjection {
  return word.partOfSpeech === PartOfSpeech.INTERJECTION;
}
