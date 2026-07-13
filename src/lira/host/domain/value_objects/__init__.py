"""Value Objects Layer: parses and normalises primitive values (measures,
quantities, codes, identifiers, dates) into typed ValueTypeKind
instances before they enter the Knowledge Layer. Contains typed
unqualified data only (Rule 19).

Repository layout follows Architectural Layer -> artefact purpose:
data_classes/ (ValueObjectsLayer), agents_role/ (ValueObjectAgent and
concrete agents), documentation/, apis/, uis/, assets/."""

from .agents_role import ValueObjectAgent
from .data_classes.layer import ValueObjectsLayer

__all__ = ["ValueObjectsLayer", "ValueObjectAgent"]
