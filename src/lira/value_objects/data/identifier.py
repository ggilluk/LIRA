"""Identifier. Type, per the UN/CEFACT Core Components Technical
Specification (CCTS) Core Component Type catalogue (Layer Summary:
Value Objects Layer)."""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Identifier:
    value: str
    scheme_id: Optional[str] = field(default=None, kw_only=True)
    scheme_name: Optional[str] = field(default=None, kw_only=True)
    scheme_agency_id: Optional[str] = field(default=None, kw_only=True)
    scheme_agency_name: Optional[str] = field(default=None, kw_only=True)
    scheme_version_id: Optional[str] = field(default=None, kw_only=True)
    scheme_data_uri: Optional[str] = field(default=None, kw_only=True)
    scheme_uri: Optional[str] = field(default=None, kw_only=True)
