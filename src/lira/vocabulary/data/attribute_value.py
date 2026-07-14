"""A typed qualifier attached to a LexicalRelationship. Matches the
Vocabulary Layer developer specification, 7.3."""

from dataclasses import dataclass

from lira.value_objects import Text


@dataclass
class AttributeValue:
    name: Text
    value: Text
