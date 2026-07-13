"""Knowledge Layer: the only layer that assigns semantic meaning
(Rule 20) -- qualifies Value Objects through Concepts, Attributes and
Relationships.

Repository layout follows Architectural Layer -> artefact purpose:
data/ (KnowledgeLayer, TensorLiraGraph and its reference/view types, the
shared NamedTensor/NamedTensorProperties base, plus Domain and LIRAHost
and their state classes), agents/ (KnowledgeAgent and the Band 1-5
concrete agents, plus DomainAgent), role/ (DomainController and
HostController) -- Knowledge is the repository's home for core Data and
Agent/Role types generally, not just Knowledge-layer-specific ones, per
the Repository Layout rule in ARCHITECTURE.md. documentation/, api/,
ui/, assets/ round out the artefact-purpose buckets."""

from .agents import DomainAgent, KnowledgeAgent
from .role import DomainController, HostController
from .data.domain import Domain
from .data.domain_system_properties import DomainSystemProperties
from .data.domain_system_tensor import DomainSystemTensor
from .data.host import LIRAHost
from .data.host_system_properties import HostSystemProperties
from .data.host_system_tensor import HostSystemTensor
from .data.hosted_domains import HostedDomains
from .data.known_domains import KnownDomains
from .data.known_hosts import KnownHosts
from .data.layer import KnowledgeLayer
from .data.tensor_graph import (
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
from .data.tensor_view import NamedTensor, NamedTensorProperties

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
    "DomainController",
    "DomainAgent",
    "HostController",
    "DomainSystemProperties",
    "DomainSystemTensor",
    "KnownDomains",
    "LIRAHost",
    "HostSystemProperties",
    "HostSystemTensor",
    "HostedDomains",
    "KnownHosts",
    "NamedTensor",
    "NamedTensorProperties",
]
