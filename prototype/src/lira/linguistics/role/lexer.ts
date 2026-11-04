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
 * │ Module Name     │ lira/linguistics/role/lexer
 * │ Filename        │ lexer.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-08-11
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ LinguisticLexer: rules-based sentence splitting and token
 * │                 │ extraction.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/lexer
 * @file lexer.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { GrammarConfigurator } from "./grammar_configurator";

/** Rules-based lexer: sentence splitting and token extraction.
 *
 * Ported from linguistics/role/lexer.py. Python's `\w` matches any
 * Unicode word character by default; JS's `\w` without the `u` flag is
 * ASCII-only ([A-Za-z0-9_]). Left as-is (no `u` flag) since this
 * prototype's seeded vocabulary is English-only -- worth revisiting if
 * a non-ASCII language's Common Vocabulary Cache is ever seeded. */
export class LinguisticLexer {
  // (?:[A-Z]\.)+ -- abbreviation-like initial groups (e.g. "U.S.")
  // (?:\d+\.\d+)+ -- decimal numbers
  // \w+(?:'\w+)? -- words, with an optional attached contraction
  // [.,!?;] -- single punctuation marks
  static readonly TOKEN_REGEX = /(?:[A-Z]\.)+|(?:\d+\.\d+)+|\w+(?:'\w+)?|[.,!?;]/g;

  static splitSentences(text: string, config: GrammarConfigurator): string[] {
    // Use explicit boundary lookbehinds compiled dynamically from
    // current configuration.
    const splitPattern = new RegExp(`${config.sentenceAbbreviationExceptions}(?<=[.!?])\\s+`);
    return text
      .split(splitPattern)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 0);
  }

  static extractTokens(text: string): string[] {
    return text.match(LinguisticLexer.TOKEN_REGEX) ?? [];
  }
}
