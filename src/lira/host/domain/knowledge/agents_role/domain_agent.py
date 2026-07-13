"""Domain Agents: specialist agents that operate at the Domain level,
across artefacts that don't belong to a single layer. A Domain may
introduce these without modifying the LIRA core (Specialisation
principle). Concrete Domain Agents live as sibling modules in this
package, same convention as the per-layer agents/ folders."""


class DomainAgent:
    def __init__(self, name: str):
        self.name = name

    def run(self, *args, **kwargs):
        raise NotImplementedError
