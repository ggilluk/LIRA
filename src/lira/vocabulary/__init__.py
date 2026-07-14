"""Vocabulary Layer: term/lexeme-level concept identity within a Domain
(surface-form to concept resolution). Contains lexical inventory only
(Rule 17).

Implements the Vocabulary Layer developer specification
(vocabulary/documentation/README.md): Dictionary aggregates Word
records; DictionaryEntry is gone, merged into Word; LexicalRelationship
is the sole carrier of tensor-backed system properties (Design
Principle 8) -- Dictionary and Word have none of their own. Every
scalar attribute on these types is a value_objects Value Object
(Design Principle 11); PartOfSpeech, RegisterCode, EditorialLabel, and
LexicalRelationshipType are integer-valued enums (Design Principle 12),
LexicalRelationshipType additionally bit-packing group/category/item
(Design Principle 13).

Every English Word.is_common is True only when it was loaded by
WordSeeder from the English Common Vocabulary Cache (300 mandatory
closed-class lexical forms -- assets/common/en/), never set by hand.

Repository layout follows Architectural Layer -> artefact purpose:
data/ (VocabularyLayer; Dictionary, Word, LexicalRelationship, one
class per file; PartOfSpeech, RegisterCode, EditorialLabel,
LexicalRelationshipType; Pronunciation, SourceReference, AttributeValue
supporting value objects; LexicalRelationshipSystemPropertyTensor and
the by-reference SystemPropertiesRef view (Rule 14); Word and
Punctuation still subclass Linguistics's LinguisticUnit base -- see
Word's own docstring for why), agents/ (VocabularyAgent and concrete
agents), role/ (DictionaryProcessor, AsyncDictionaryHydrator,
ExternalDictionaryAdapter, LexicalRelationshipProcessor, WordSeeder --
the lexicon and relationship graph and everything that seeds/looks
up/hydrates/creates them belong here, not Linguistics), documentation/,
api/, ui/, assets/ (common/<language_code>/ -- the Common Vocabulary
Cache WordSeeder loads)."""

from .agents import VocabularyAgent
from .role.dictionary_hydrator import AsyncDictionaryHydrator
from .role.dictionary_processor import DictionaryProcessor
from .role.external_dictionary_adapter import ExternalDictionaryAdapter
from .role.lexical_relationship_processor import LexicalRelationshipProcessor
from .role.word_seeder import WordSeeder
from .data.attribute_value import AttributeValue
from .data.dictionary import Dictionary
from .data.editorial_label import EditorialLabel
from .data.layer import VocabularyLayer
from .data.lexical_relationship import LexicalRelationship
from .data.lexical_relationship_store import LexicalRelationshipStore
from .data.lexical_relationship_tensor import LexicalRelationshipSystemPropertyTensor
from .data.lexical_relationship_type import LexicalRelationshipType
from .data.part_of_speech import PartOfSpeech
from .data.pronunciation import Pronunciation
from .data.punctuation import Punctuation
from .data.register_code import RegisterCode
from .data.source_reference import SourceReference
from .data.system_properties_ref import SystemPropertiesRef
from .data.word import Word

__all__ = [
    "VocabularyLayer",
    "VocabularyAgent",
    "Dictionary",
    "Word",
    "Punctuation",
    "PartOfSpeech",
    "RegisterCode",
    "EditorialLabel",
    "LexicalRelationship",
    "LexicalRelationshipType",
    "LexicalRelationshipStore",
    "LexicalRelationshipSystemPropertyTensor",
    "SystemPropertiesRef",
    "Pronunciation",
    "SourceReference",
    "AttributeValue",
    "AsyncDictionaryHydrator",
    "DictionaryProcessor",
    "ExternalDictionaryAdapter",
    "LexicalRelationshipProcessor",
    "WordSeeder",
]
