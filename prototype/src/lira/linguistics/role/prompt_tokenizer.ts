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
