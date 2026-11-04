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
 * │ Module Name     │ lira/vocabulary/role/processor/conjunction_processor
 * │ Filename        │ conjunction_processor.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-21
 * │ Modified Date   │ 2026-09-11
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Conjunction behaviour: construction and type guard.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/role/processor/conjunction_processor
 * @file conjunction_processor.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Word } from "../../data/entities/word";
import { createWord } from "./word_processor";
import type { Conjunction } from "../../data/entities/conjunction";

export type ConjunctionInit = Pick<Conjunction, "text" | "conjunctionType"> & Partial<Omit<Conjunction, "text" | "partOfSpeech" | "conjunctionType">>;

export function createConjunction(init: ConjunctionInit): Conjunction {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.CONJUNCTION }) as Conjunction;
}

export function isConjunction(word: Word): word is Conjunction {
  return word.partOfSpeech === PartOfSpeech.CONJUNCTION;
}
