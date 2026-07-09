"""Domain: LIRA's semantic and computational boundary -- Domains
partition knowledge. Composes the DomainController (operations),
domain-level system state, a by-reference registry of other Domains, and
the four processing layers: Vocabulary, Linguistics, Value Objects, and
Knowledge -- each with its own agents."""

from .controller import DomainController
from .system_properties import DomainSystemProperties
from .system_tensor import DomainSystemTensor
from .known_domains import KnownDomains
from .vocabulary import VocabularyLayer
from .linguistics import LinguisticsLayer
from .value_objects import ValueObjectsLayer
from .knowledge import KnowledgeLayer


class Domain:
    def __init__(self, name: str):
        self.name = name
        self.controller = DomainController(self)
        self.system_properties = DomainSystemProperties()
        self.system_tensor = DomainSystemTensor()
        self.known_domains = KnownDomains()  # by reference

        self.vocabulary = VocabularyLayer()
        self.linguistics = LinguisticsLayer()
        self.value_objects = ValueObjectsLayer()
        self.knowledge = KnowledgeLayer()

    @property
    def graph(self):
        """Convenience accessor to the Knowledge Layer's authoritative
        tensor store."""
        return self.knowledge.graph
