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
 * │ Module Name     │ lira/vocabulary/role/processor/numeral_processor
 * │ Filename        │ numeral_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-21
 * │ Modified Date   │ 2026-09-11
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Numeral behaviour: construction and type guard.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/role/processor/numeral_processor
 * @file numeral_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Word } from "../../data/entities/word";
import { createWord } from "./word_processor";
import type { Numeral } from "../../data/entities/numeral";

export type NumeralInit = Pick<Numeral, "text"> & Partial<Omit<Numeral, "text" | "partOfSpeech">>;

export function createNumeral(init: NumeralInit): Numeral {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.NUMERAL }) as Numeral;
}

export function isNumeral(word: Word): word is Numeral {
  return word.partOfSpeech === PartOfSpeech.NUMERAL;
}
