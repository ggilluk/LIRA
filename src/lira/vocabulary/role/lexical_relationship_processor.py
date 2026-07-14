"""Creates LexicalRelationship records, allocating each one's
tensor-backed SystemPropertiesRef row (Design Principle 8) and storing
the result in a LexicalRelationshipStore."""

import uuid as uuid_module
from typing import Optional, Tuple

from lira.value_objects import Identifier, Text

from ..data.attribute_value import AttributeValue
from ..data.lexical_relationship import LexicalRelationship
from ..data.lexical_relationship_store import LexicalRelationshipStore
from ..data.lexical_relationship_tensor import LexicalRelationshipSystemPropertyTensor
from ..data.lexical_relationship_type import LexicalRelationshipType
from ..data.source_reference import SourceReference
from ..data.system_properties_ref import SystemPropertiesRef


class LexicalRelationshipProcessor:
    def __init__(self, store: LexicalRelationshipStore, tensor: LexicalRelationshipSystemPropertyTensor):
        self.store = store
        self.tensor = tensor

    def create(self, source_word_id: str, target_word_id: str, relationship_type: LexicalRelationshipType,
               source_references: Tuple[SourceReference, ...],
               inverse_relationship_type: Optional[LexicalRelationshipType] = None,
               qualifiers: Tuple[AttributeValue, ...] = (),
               confidence: float = 0.0, provenance: float = 0.0,
               temporal: float = 0.0, activation: float = 0.0) -> LexicalRelationship:
        relationship_uuid = str(uuid_module.uuid4())
        version = "1.0"
        row = self.tensor.allocate_row(
            uuid_str=relationship_uuid, version=version,
            confidence=confidence, provenance=provenance, temporal=temporal, activation=activation,
        )
        relationship = LexicalRelationship(
            uuid=Identifier(value=relationship_uuid),
            version=Text(value=version),
            source_word_id=Identifier(value=source_word_id),
            target_word_id=Identifier(value=target_word_id),
            relationship_type=relationship_type,
            source_references=source_references,
            system_properties=SystemPropertiesRef(self.tensor, row),
            inverse_relationship_type=inverse_relationship_type,
            qualifiers=qualifiers,
        )
        self.store.add(relationship)
        return relationship
