"""Knowledge Agents: agents that operate over the Domain's tensor-native
LiraGraph -- attribute completion, generalisation discovery,
compartmentalisation, cross-domain generalisation, output attribute
completion (Bands 1-5). Concrete agents live as sibling modules in this
package (Extensibility principle: agents operate inside the layer whose
artefacts they manage -- Agents are not a separate layer, Rule 15).
The Knowledge Layer is the only layer that assigns semantic meaning
(Rule 20); these agents are what actually do that assignment.

Also holds DomainController, DomainAgent, and HostController
(domain_controller.py, domain_agent.py, host_controller.py) -- per the
Repository Layout rule, Knowledge is the repository's home for core
Agents/Role types generally, not just Knowledge-layer-specific ones
(same as Domain and LIRAHost living in data_classes/)."""

from .domain_agent import DomainAgent
from .domain_controller import DomainController
from .host_controller import HostController


class KnowledgeAgent:
    def __init__(self, name: str):
        self.name = name

    def run(self, *args, **kwargs):
        raise NotImplementedError
