"""Domain: LIRA's semantic and computational boundary -- Domains
partition knowledge. Composes the DomainController (operations),
domain-level system state, a by-reference registry of other Domains, and
the four processing layers: Vocabulary, Linguistics, Value Objects, and
Knowledge -- each with its own agents."""

from ...agents import DomainAgent
from ...controller import DomainController
from .domain_system_properties import DomainSystemProperties
from .domain_system_tensor import DomainSystemTensor
from .known_domains import KnownDomains
from ...vocabulary import VocabularyLayer
from ...linguistics import LinguisticsLayer
from ...value_objects import ValueObjectsLayer
from .layer import KnowledgeLayer


class Domain:
    def __init__(self, name: str, availability_zone: str = None):
        self.name = name
        self.controller = DomainController(self, availability_zone)
        self.system_tensor = DomainSystemTensor()
        self.system_properties = DomainSystemProperties(self.system_tensor)  # by-reference view (Rule 14)
        self.known_domains = KnownDomains()  # by reference
        self.domain_agents: list[DomainAgent] = []  # specialist agents, not tied to one layer

        self.vocabulary = VocabularyLayer()
        self.linguistics = LinguisticsLayer()
        self.value_objects = ValueObjectsLayer()
        self.knowledge = KnowledgeLayer()

    def register_domain_agent(self, agent: DomainAgent):
        self.domain_agents.append(agent)

    @property
    def graph(self):
        """Convenience accessor to the Knowledge Layer's authoritative
        tensor store."""
        return self.knowledge.graph
