"""A pronunciation variant of a Word. Matches the Vocabulary Layer
developer specification, 7.1."""

from dataclasses import dataclass, field
from typing import Optional

from lira.value_objects import Code, Text


@dataclass
class Pronunciation:
    notation: Text
    value: Text
    dialect_code: Optional[Code] = field(default=None, kw_only=True)
