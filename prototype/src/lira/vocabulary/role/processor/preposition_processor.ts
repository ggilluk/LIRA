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
 * │ Module Name     │ lira/vocabulary/role/processor/preposition_processor
 * │ Filename        │ preposition_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-21
 * │ Modified Date   │ 2026-09-11
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Preposition behaviour: construction and type guard.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/role/processor/preposition_processor
 * @file preposition_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Word } from "../../data/entities/word";
import { createWord } from "./word_processor";
import type { Preposition } from "../../data/entities/preposition";

export type PrepositionInit = Pick<Preposition, "text"> & Partial<Omit<Preposition, "text" | "partOfSpeech">>;

export function createPreposition(init: PrepositionInit): Preposition {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.PREPOSITION }) as Preposition;
}

export function isPreposition(word: Word): word is Preposition {
  return word.partOfSpeech === PartOfSpeech.PREPOSITION;
}
