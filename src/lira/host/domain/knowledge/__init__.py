"""Knowledge Layer: the only layer that assigns semantic meaning
(Rule 20) -- qualifies Value Objects through Concepts, Attributes and
Relationships.

Repository layout follows Architectural Layer -> artefact purpose:
data_classes/ (KnowledgeLayer, TensorLiraGraph and its reference/view
types), agents_role/ (KnowledgeAgent and the Band 1-5 concrete agents),
documentation/, apis/, uis/, assets/."""

from .agents_role import KnowledgeAgent
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
]
