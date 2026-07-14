"""Quantity. Type, per the UN/CEFACT Core Components Technical
Specification (CCTS) Core Component Type catalogue (Layer Summary:
Value Objects Layer)."""

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Optional


@dataclass
class Quantity:
    value: Decimal
    unit_code: Optional[str] = field(default=None, kw_only=True)
    unit_code_list_id: Optional[str] = field(default=None, kw_only=True)
    unit_code_list_agency_id: Optional[str] = field(default=None, kw_only=True)
    unit_code_list_agency_name: Optional[str] = field(default=None, kw_only=True)
