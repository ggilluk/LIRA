"""Percent. Type, per the UN/CEFACT Core Components Technical
Specification (CCTS) Core Component Type catalogue -- a pure numeric
value expressing a proportion out of one hundred, with no
supplementary components (Layer Summary: Value Objects Layer)."""

from dataclasses import dataclass
from decimal import Decimal


@dataclass
class Percent:
    value: Decimal
