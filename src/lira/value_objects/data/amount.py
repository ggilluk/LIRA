"""Amount. Type, per the UN/CEFACT Core Components Technical
Specification (CCTS) Core Component Type catalogue (Layer Summary:
Value Objects Layer)."""

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Optional


@dataclass
class Amount:
    value: Decimal
    currency_id: Optional[str] = field(default=None, kw_only=True)
    currency_code_list_version_id: Optional[str] = field(default=None, kw_only=True)
