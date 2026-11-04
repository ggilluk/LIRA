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
 * │ Module Name     │ lira/vocabulary/role/word_identifier
 * │ Filename        │ word_identifier.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-18
 * │ Modified Date   │ 2026-08-23
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ WordIdentifier: one candidate resolution of a token to a
 * │                 │ grammatical category.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/role/word_identifier
 * @file word_identifier.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { PartOfSpeech } from "../data/enums/part_of_speech";
import type { Word } from "../data/entities/word";

/** Represents one candidate resolution of a raw token occurrence to a
 * grammatical category -- never a guess. DictionaryProcessor.identifyWord
 * returns zero or more of these; zero means the occurrence has no
 * resolved sense yet (external hydration has been queued, not that the
 * occurrence is a NOUN by default).
 *
 * Lives in role/, not data/, alongside PartOfSpeechIdentifier
 * (part_of_speech_identifier.ts) -- both this interface and
 * IdentificationSource below are built by DictionaryProcessor
 * (dictionary_processor.ts) and PartOfSpeechIdentifier
 * (part_of_speech_identifier.ts), Vocabulary's own role-layer
 * identification logic, not authored/stored data the way a Word or
 * Phrase is. Linguistics consumes it too (TokenReading.candidates,
 * Phrase.selectedIdentifications, GraphProcessor.materialiseToken) --
 * that's the ordinary Linguistics-depends-on-Vocabulary direction
 * (word.ts's own docstring on why the reverse is never allowed), so
 * this staying in Vocabulary's own role/ is what keeps that one-way.
 *
 * Ported from vocabulary/data/word_identification.py. */
export enum IdentificationSource {
  SEEDED_VOCABULARY = "seeded_vocabulary",
  // Matched via one of this Word's own WordForm records (pluralNumberForm,
  // pastTenseForm, comparativeDegreeForm, ...) rather than its base
  // lexical form -- PartOfSpeechIdentifier.identifySeeded's own
  // WordForms.lookupByText() fallback, tried only once an exact
  // lookupAll() match fails. Distinct from SEEDED_VOCABULARY so a
  // consumer can tell an exact match from a derived one without
  // string-matching WordIdentifier.reason.
  INFLECTED_FORM = "inflected_form",
  ORTHOGRAPHIC_EVIDENCE = "orthographic_evidence",
  EXTERNAL_REFERENCE = "external_reference",
}

export interface WordIdentifier {
  word?: Word;
  partOfSpeech: PartOfSpeech;
  source: IdentificationSource;
  confidence: number;
  reason: string;
}
