"""Knowledge Agents: agents that operate over the Domain's tensor-native
LiraGraph -- attribute completion, generalisation discovery,
compartmentalisation, cross-domain generalisation, output attribute
completion (Bands 1-5). Concrete agents live as sibling modules in this
package (Extensibility principle: agents operate inside the layer whose
artefacts they manage -- Agents are not a separate layer, Rule 15).
The Knowledge Layer is the only layer that assigns semantic meaning
(Rule 20); these agents are what actually do that assignment.

Also holds DomainAgent (domain_agent.py) -- per the Repository Layout
rule, Knowledge is the repository's home for core Agent types
generally, not just Knowledge-layer-specific ones (same as Domain and
LIRAHost living in data/). DomainController and HostController are
Role, not Agent, and live in role/ instead."""

from .domain_agent import DomainAgent


class KnowledgeAgent:
    def __init__(self, name: str):
        self.name = name

    def run(self, *args, **kwargs):
        raise NotImplementedError
