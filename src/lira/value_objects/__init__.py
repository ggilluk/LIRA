"""Value Objects Layer: parses and normalises primitive values (measures,
quantities, codes, identifiers, dates) into typed value object
instances before they enter the Knowledge Layer. Contains typed
unqualified data only (Rule 19).

Repository layout follows Architectural Layer -> artefact purpose:
data/ (ValueObjectsLayer; the full UN/CEFACT Core Components Technical
Specification (CCTS) Core Component Type catalogue -- Amount,
BinaryObject, Code, DateTime, Graphic, Identifier, Indicator, Measure,
Number, Percent, Picture, Quantity, Rate, Sound, Text, Video),
agents/ (ValueObjectAgent and concrete agents), role/ (none yet),
documentation/, api/, ui/, assets/."""

from .agents import ValueObjectAgent
from .data.layer import ValueObjectsLayer
from .data.amount import Amount
from .data.binary_object import BinaryObject
from .data.code import Code
from .data.date_time import DateTime
from .data.graphic import Graphic
from .data.identifier import Identifier
from .data.indicator import Indicator
from .data.measure import Measure
from .data.number import Number
from .data.percent import Percent
from .data.picture import Picture
from .data.quantity import Quantity
from .data.rate import Rate
from .data.sound import Sound
from .data.text import Text
from .data.video import Video

__all__ = [
    "ValueObjectsLayer",
    "ValueObjectAgent",
    "Amount",
    "BinaryObject",
    "Code",
    "DateTime",
    "Graphic",
    "Identifier",
    "Indicator",
    "Measure",
    "Number",
    "Percent",
    "Picture",
    "Quantity",
    "Rate",
    "Sound",
    "Text",
    "Video",
]
