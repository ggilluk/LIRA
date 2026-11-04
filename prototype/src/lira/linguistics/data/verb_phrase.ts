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
 * │ Module Name     │ lira/linguistics/data/verb_phrase
 * │ Filename        │ verb_phrase.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-09-02
 * │ Modified Date   │ 2026-09-02
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ VerbPhrase: the Linguistics Phrase narrowed by phraseType.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/data/verb_phrase
 * @file verb_phrase.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/** VerbPhrase: this layer's own Phrase (data/phrase.ts) narrowed by
 * `phraseType` -- NounPhrase's own counterpart, one PhraseType over
 * (noun_phrase.ts's own docstring on the pattern, the Vocabulary-vs-
 * Linguistics naming split, and why no constructor lives here). */

import type { Phrase } from "./phrase";
import { PhraseType } from "./phrase_type";

export interface VerbPhrase extends Phrase {
  phraseType: PhraseType.VERB_PHRASE;
}

export function isVerbPhrase(phrase: Phrase): phrase is VerbPhrase {
  return phrase.phraseType === PhraseType.VERB_PHRASE;
}
