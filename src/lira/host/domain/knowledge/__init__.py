"""Knowledge Layer: the only layer that assigns semantic meaning
(Rule 20) -- qualifies Value Objects through Concepts, Attributes and
Relationships.

Repository layout follows Architectural Layer -> artefact purpose:
data_classes/ (KnowledgeLayer, TensorLiraGraph and its reference/view
types, plus Domain and LIRAHost and their state classes -- Knowledge is
the repository's home for core data-class types, per the Repository
Layout rule in ARCHITECTURE.md), agents_role/ (KnowledgeAgent and the
Band 1-5 concrete agents), documentation/, apis/, uis/, assets/."""

from .agents_role import KnowledgeAgent
from .data_classes.domain import Domain
from .data_classes.domain_system_properties import DomainSystemProperties
from .data_classes.domain_system_tensor import DomainSystemTensor
from .data_classes.host import LIRAHost
from .data_classes.host_system_properties import HostSystemProperties
from .data_classes.host_system_tensor import HostSystemTensor
from .data_classes.hosted_domains import HostedDomains
from .data_classes.known_domains import KnownDomains
from .data_classes.known_hosts import KnownHosts
from .data_classes.layer import KnowledgeLayer
from .data_classes.tensor_graph import (
    Band,
    ConceptKind,
    ConceptRef,
    FactOrigin,
    RelationshipRef,
    SystemPropertyRef,
    TensorLiraGraph,
    ValueTypeKind,
    provenance_for_depth,
)

__all__ = [
    "KnowledgeLayer",
    "KnowledgeAgent",
    "TensorLiraGraph",
    "ConceptRef",
    "SystemPropertyRef",
    "RelationshipRef",
    "ConceptKind",
    "FactOrigin",
    "Band",
    "ValueTypeKind",
    "provenance_for_depth",
    "Domain",
    "DomainSystemProperties",
    "DomainSystemTensor",
    "KnownDomains",
    "LIRAHost",
    "HostSystemProperties",
    "HostSystemTensor",
    "HostedDomains",
    "KnownHosts",
]
