import { LinguisticUnitKind } from "../data/linguistic_unit_kind";
import type { Subject } from "../data/subject";
import type { UserPrompt } from "../ui/user_prompt";
import type { GraphProcessor } from "./graph_processor";

/** Top-level entry point: wraps a UserPrompt and drives GraphProcessor
 * to build its full Subject tree.
 *
 * Ported from linguistics/role/prompt_tokenizer.py. */
export class PromptTokenizer {
  constructor(private readonly graphProcessor: GraphProcessor) {}

  tokenizePrompt(prompt: UserPrompt): Subject {
    prompt.systemProperty = this.graphProcessor.createPropertyWrapper(
      prompt, LinguisticUnitKind.UserPrompt, 0, "PromptTokenizer_Gateway",
    );
    return this.graphProcessor.processSubject(prompt.text, 0);
  }
}
