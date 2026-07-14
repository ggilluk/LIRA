"""Rate. Type, per the UN/CEFACT Core Components Technical
Specification (CCTS) Core Component Type catalogue -- expresses the
value of one measure in relation to a second measure (e.g. an
exchange rate or a speed), as a base-unit/per-unit pair (Layer
Summary: Value Objects Layer)."""

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Optional


@dataclass
class Rate:
    value: Decimal
    base_unit_measure_unit_code: Optional[str] = field(default=None, kw_only=True)
    per_unit_measure_unit_code: Optional[str] = field(default=None, kw_only=True)
    currency_id: Optional[str] = field(default=None, kw_only=True)
    currency_code_list_version_id: Optional[str] = field(default=None, kw_only=True)
