"""Value Objects Layer: parses and normalises primitive values (measures,
quantities, codes, identifiers, dates) into typed ValueTypeKind
instances before they enter the Knowledge Layer. Contains typed
unqualified data only (Rule 19).

Repository layout follows Architectural Layer -> artefact purpose:
data/ (ValueObjectsLayer; Text, Number, Code, Indicator, Quantity,
BinaryObject -- Core Component Types from the UN/CEFACT Core
Components Technical Specification), agents/ (ValueObjectAgent and
concrete agents), role/ (none yet), documentation/, api/, ui/,
assets/."""

from .agents import ValueObjectAgent
from .data.layer import ValueObjectsLayer
from .data.binary_object import BinaryObject
from .data.code import Code
from .data.indicator import Indicator
from .data.number import Number
from .data.quantity import Quantity
from .data.text import Text

__all__ = [
    "ValueObjectsLayer",
    "ValueObjectAgent",
    "Text",
    "Number",
    "Code",
    "Indicator",
    "Quantity",
    "BinaryObject",
]
