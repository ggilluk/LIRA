"""Date Time. Type, per the UN/CEFACT Core Components Technical
Specification (CCTS) Core Component Type catalogue (Layer Summary:
Value Objects Layer)."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class DateTime:
    value: datetime
    format: Optional[str] = field(default=None, kw_only=True)
