"""Indicator. Type, per the UN/CEFACT Core Components Technical
Specification (CCTS) Core Component Type catalogue -- a boolean value
with no supplementary components (Layer Summary: Value Objects
Layer)."""

from dataclasses import dataclass


@dataclass
class Indicator:
    value: bool
