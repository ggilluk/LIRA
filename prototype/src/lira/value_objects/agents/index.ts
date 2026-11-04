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
 * │ Module Name     │ lira/value_objects/agents/index
 * │ Filename        │ index.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-08-11
 * │ Modified Date   │ 2026-08-11
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Value Object Agents: parse and normalise primitive values into
 * │                 │ typed value objects.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/agents/index
 * @file index.ts
 * @author Gurpinder Gill
 * @license MIT
 */
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
