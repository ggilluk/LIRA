"""Value Objects Layer: parses and normalises primitive values (measures,
quantities, codes, identifiers, dates) into typed ValueTypeKind
instances before they enter the Knowledge Layer. Contains typed
unqualified data only (Rule 19).

Repository layout follows Architectural Layer -> artefact purpose:
data/ (ValueObjectsLayer), agents/ (ValueObjectAgent and concrete
agents), role/ (none yet), documentation/, apis/, uis/, assets/."""

from .agents import ValueObjectAgent
from .data.layer import ValueObjectsLayer

__all__ = ["ValueObjectsLayer", "ValueObjectAgent"]
