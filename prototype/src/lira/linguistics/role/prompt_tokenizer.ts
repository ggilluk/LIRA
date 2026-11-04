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
 * │ Module Name     │ lira/linguistics/role/prompt_tokenizer
 * │ Filename        │ prompt_tokenizer.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-08-12
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ PromptTokenizer: wraps a UserPrompt and drives GraphProcessor to
 * │                 │ build its Document tree.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/linguistics/role/prompt_tokenizer
 * @file prompt_tokenizer.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { LinguisticUnitKind } from "../data/linguistic_unit_kind";
import type { Document } from "../data/document";
import type { UserPrompt } from "../ui/user_prompt";
import type { GraphProcessor } from "./graph_processor";

/** Top-level entry point: wraps a UserPrompt and drives GraphProcessor
 * to build its full Document tree.
 *
 * Ported from linguistics/role/prompt_tokenizer.py. */
export class PromptTokenizer {
  constructor(private readonly graphProcessor: GraphProcessor) {}

  tokenizePrompt(prompt: UserPrompt): Document {
    prompt.systemProperty = this.graphProcessor.createPropertyWrapper(
      prompt, LinguisticUnitKind.UserPrompt, 0, "PromptTokenizer_Gateway",
    );
    return this.graphProcessor.processDocument(prompt.text, 0);
  }
}
