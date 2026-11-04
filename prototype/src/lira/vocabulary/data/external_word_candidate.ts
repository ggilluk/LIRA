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
 * │ Module Name     │ lira/vocabulary/data/external_word_candidate
 * │ Filename        │ external_word_candidate.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-08-31
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ ExternalWordCandidate: one grammatical-category candidate parsed
 * │                 │ from an external dictionary API response.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/data/external_word_candidate
 * @file external_word_candidate.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { Code, Text } from "../../value_objects";
import type { PartOfSpeech } from "./enums/part_of_speech";
import type { SourceReference } from "./source_reference";

/** One externally-sourced grammatical-category candidate for a lexical
 * form, parsed from an external dictionary API response
 * (ExternalDictionaryAdapter) before it becomes a Word. Field set
 * mirrors what Word already supports (definition, usageNotes,
 * sourceReferences, ...) rather than introducing an unrelated schema.
 *
 * Ported from vocabulary/data/external_word_candidate.py. */
export interface ExternalWordCandidate {
  text: string;
  lexicalForm: string;
  normalisedForm: string;
  languageCode: Code;
  partOfSpeech: PartOfSpeech;

  definition?: Text;
  usageNotes: readonly Text[];

  domainConcept?: Text;
  domainRelevance: number;
  sourceConfidence: number;

  sourceReferences: readonly SourceReference[];
}

/** The domain hint ranks candidates the external source already
 * supports; it never manufactures confidence on its own --
 * sourceConfidence always carries the majority weight. */
export function combinedConfidence(candidate: ExternalWordCandidate): number {
  return Math.min(1.0, candidate.sourceConfidence * 0.65 + candidate.domainRelevance * 0.35);
}
