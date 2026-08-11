/** Value Object Agents: agents responsible for parsing and normalising
 * primitive values (measures, quantities, codes, identifiers, dates)
 * into typed value object instances before they enter the Knowledge
 * Layer. Concrete agents live as sibling modules in this package
 * (Extensibility principle: agents operate inside the layer whose
 * artefacts they manage -- Agents are not a separate layer, Rule 15).
 * Ported from value_objects/agents/__init__.py. */
export abstract class ValueObjectAgent {
  constructor(public readonly name: string) {}

  run(..._args: unknown[]): unknown {
    throw new Error("not implemented");
  }
}
