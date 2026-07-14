"""A directed relationship between two Word entries. Matches the
Vocabulary Layer developer specification, 5."""

from dataclasses import dataclass, field
from typing import Optional, Tuple

from lira.value_objects import Identifier, Text

from .attribute_value import AttributeValue
from .lexical_relationship_type import LexicalRelationshipType
from .source_reference import SourceReference
from .system_properties_ref import SystemPropertiesRef


@dataclass
class LexicalRelationship:
    uuid: Identifier
    version: Text
    source_word_id: Identifier
    target_word_id: Identifier
    relationship_type: LexicalRelationshipType
    source_references: Tuple[SourceReference, ...]
    system_properties: SystemPropertiesRef

    inverse_relationship_type: Optional[LexicalRelationshipType] = field(default=None, kw_only=True)
    qualifiers: Tuple[AttributeValue, ...] = field(default_factory=tuple, kw_only=True)
