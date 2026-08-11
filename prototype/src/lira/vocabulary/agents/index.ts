/** Vocabulary Agents: agents responsible for term/lexeme-level concept
 * identity within a Domain (e.g. surface-form to concept resolution).
 * Concrete agents live as sibling modules in this package
 * (Extensibility principle: agents operate inside the layer whose
 * artefacts they manage -- Agents are not a separate layer, Rule 15).
 * Ported from vocabulary/agents/__init__.py. */
export abstract class VocabularyAgent {
  constructor(public readonly name: string) {}

  run(..._args: unknown[]): unknown {
    throw new Error("not implemented");
  }
}
