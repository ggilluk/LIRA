"""Video. Type, per the UN/CEFACT Core Components Technical
Specification (CCTS) Core Component Type catalogue (Layer Summary:
Value Objects Layer)."""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Video:
    value: bytes
    format: Optional[str] = field(default=None, kw_only=True)
    mime_code: Optional[str] = field(default=None, kw_only=True)
    character_set_code: Optional[str] = field(default=None, kw_only=True)
    encoding_code: Optional[str] = field(default=None, kw_only=True)
    filename: Optional[str] = field(default=None, kw_only=True)
    uri: Optional[str] = field(default=None, kw_only=True)
