import type { ValueObjectAgent } from "../agents";

/** Ported from value_objects/data/layer.py. */
export class ValueObjectsLayer {
  agents: ValueObjectAgent[] = [];

  register(agent: ValueObjectAgent): void {
    this.agents.push(agent);
  }
}
