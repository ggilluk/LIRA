"""Text. Type, per the UN/CEFACT Core Components Technical Specification
(CCTS) Core Component Type catalogue (Layer Summary: Value Objects
Layer)."""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Text:
    value: str
    language_id: Optional[str] = field(default=None, kw_only=True)
