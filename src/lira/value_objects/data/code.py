"""Code. Type, per the UN/CEFACT Core Components Technical Specification
(CCTS) Core Component Type catalogue (Layer Summary: Value Objects
Layer)."""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Code:
    value: str
    name: Optional[str] = field(default=None, kw_only=True)
    language_id: Optional[str] = field(default=None, kw_only=True)
    list_id: Optional[str] = field(default=None, kw_only=True)
    list_agency_id: Optional[str] = field(default=None, kw_only=True)
    list_agency_name: Optional[str] = field(default=None, kw_only=True)
    list_name: Optional[str] = field(default=None, kw_only=True)
    list_version_id: Optional[str] = field(default=None, kw_only=True)
    list_uri: Optional[str] = field(default=None, kw_only=True)
    list_scheme_uri: Optional[str] = field(default=None, kw_only=True)
