"""Provenance for a Dictionary, Word, or LexicalRelationship. Matches
the Vocabulary Layer developer specification, 7.2."""

from dataclasses import dataclass, field
from typing import Optional

from lira.value_objects import Identifier, Text


@dataclass
class SourceReference:
    source_name: Text
    source_version: Optional[Text] = field(default=None, kw_only=True)
    external_identifier: Optional[Identifier] = field(default=None, kw_only=True)
    reference_uri: Optional[Identifier] = field(default=None, kw_only=True)
    licence_identifier: Optional[Identifier] = field(default=None, kw_only=True)
