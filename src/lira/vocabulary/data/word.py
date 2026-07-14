"""Word: one lexical form in one language and one grammatical category
(Vocabulary Layer developer specification, 4). Still subclasses
Linguistics's LinguisticUnit -- Word has two legitimate uses, the
*type* (a lexical entry, owned by Vocabulary) and the *token* (one
occurrence of that type in a sentence, participating in Linguistics's
tree via LinguisticUnit's `text` and `system_property`); this is
deliberate, not an unresolved layering error (see
vocabulary/documentation/README.md, 4.1).

Word has no `system_properties` field of its own (Design Principle 8
-- tensor-backed system properties belong to a claimed
LexicalRelationship between two words, not to a word standing alone).
When used as a token in Linguistics, a Word draws its
confidence/activation/etc. from the Linguistics tensor instead, via
the inherited LinguisticUnit.system_property, populated by
GraphProcessor when the token is created."""

import uuid as uuid_module
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Optional, Tuple

from lira.linguistics.data.linguistic_unit import LinguisticUnit
from lira.value_objects import Code, Identifier, Number, Text

from .editorial_label import EditorialLabel
from .lexical_relationship_store import LexicalRelationshipStore
from .lexical_relationship_type import LexicalRelationshipType
from .part_of_speech import PartOfSpeech
from .pronunciation import Pronunciation
from .register_code import RegisterCode
from .source_reference import SourceReference

if TYPE_CHECKING:
    # Dictionary imports Word (to type its `words` field), so this is a
    # string-quoted, unimported hint to avoid a same-package import cycle.
    from .dictionary import Dictionary


@dataclass
class Word(LinguisticUnit):
    part_of_speech: PartOfSpeech = field(kw_only=True)

    uuid: Identifier = field(default_factory=lambda: Identifier(value=str(uuid_module.uuid4())), kw_only=True)
    version: Text = field(default_factory=lambda: Text(value="1.0"), kw_only=True)
    language_code: Code = field(default_factory=lambda: Code(value="en"), kw_only=True)
    lexical_form: Optional[Text] = field(default=None, kw_only=True)
    normalised_form: Optional[Text] = field(default=None, kw_only=True)
    script_code: Optional[Code] = field(default=None, kw_only=True)
    pronunciations: Tuple[Pronunciation, ...] = field(default_factory=tuple, kw_only=True)
    syllable_representation: Optional[Text] = field(default=None, kw_only=True)
    syllable_count: Optional[Number] = field(default=None, kw_only=True)
    stress_pattern: Optional[Text] = field(default=None, kw_only=True)
    gloss: Optional[Text] = field(default=None, kw_only=True)
    definition: Optional[Text] = field(default=None, kw_only=True)
    usage_notes: Tuple[Text, ...] = field(default_factory=tuple, kw_only=True)
    register_codes: Tuple[RegisterCode, ...] = field(default_factory=tuple, kw_only=True)
    dialect_codes: Tuple[Code, ...] = field(default_factory=tuple, kw_only=True)
    frequency_value: Optional[Number] = field(default=None, kw_only=True)
    frequency_scale: Optional[Code] = field(default=None, kw_only=True)
    etymology_text: Optional[Text] = field(default=None, kw_only=True)
    first_recorded_use: Optional[Text] = field(default=None, kw_only=True)
    editorial_labels: Tuple[EditorialLabel, ...] = field(default_factory=tuple, kw_only=True)
    source_references: Tuple[SourceReference, ...] = field(default_factory=tuple, kw_only=True)

    # True only for a Word loaded from the English Common Vocabulary
    # Cache (or another language's equivalent) by WordSeeder -- never
    # set True by hand. See vocabulary/documentation/README.md, 9.5.
    is_common: bool = field(default=False, kw_only=True)

    # Implementation plumbing, not part of the documented field set:
    # tracks whether AsyncDictionaryHydrator has finished populating this
    # Word's meaning/part_of_speech from the external dictionary API yet.
    is_fully_hydrated: bool = field(default=True, kw_only=True)

    def __post_init__(self):
        if self.lexical_form is None:
            self.lexical_form = Text(value=self.text)
        if self.normalised_form is None:
            self.normalised_form = Text(value=self.text.lower())

    # -- Derived properties (4.3) --------------------------------------
    # None of these are stored fields. Each is computed on demand from a
    # LexicalRelationshipStore (this Word's relationships) and a
    # Dictionary (to resolve the other word in each relationship).

    @staticmethod
    def _relationship_matches(relationship, relationship_type, group, category) -> bool:
        if relationship_type is not None:
            return relationship.relationship_type == relationship_type
        if category is not None:
            return relationship.relationship_type.group == group and relationship.relationship_type.category == category
        if group is not None:
            return relationship.relationship_type.group == group
        return True

    def _related_words(self, relationships: LexicalRelationshipStore, dictionary: "Dictionary", *,
                        relationship_type: Optional[LexicalRelationshipType] = None,
                        group: Optional[int] = None, category: Optional[int] = None,
                        direction: str = "outgoing") -> Tuple["Word", ...]:
        my_id = self.uuid.value
        other_ids = []
        if direction in ("outgoing", "both"):
            other_ids += [r.target_word_id.value for r in relationships.outgoing(my_id)
                          if self._relationship_matches(r, relationship_type, group, category)]
        if direction in ("incoming", "both"):
            other_ids += [r.source_word_id.value for r in relationships.incoming(my_id)
                          if self._relationship_matches(r, relationship_type, group, category)]
        resolved = (dictionary.find_by_uuid(word_id) for word_id in other_ids)
        return tuple(word for word in resolved if word is not None)

    def lemma_forms(self, relationships: LexicalRelationshipStore, dictionary: "Dictionary") -> Tuple["Word", ...]:
        return self._related_words(relationships, dictionary, relationship_type=LexicalRelationshipType.LEMMA_FORM)

    def inflections(self, relationships: LexicalRelationshipStore, dictionary: "Dictionary") -> Tuple["Word", ...]:
        return self._related_words(relationships, dictionary, relationship_type=LexicalRelationshipType.INFLECTION)

    def morphological_variants(self, relationships: LexicalRelationshipStore, dictionary: "Dictionary") -> Tuple["Word", ...]:
        return self._related_words(relationships, dictionary, group=0)

    def derived_forms(self, relationships: LexicalRelationshipStore, dictionary: "Dictionary") -> Tuple["Word", ...]:
        return self._related_words(relationships, dictionary, group=0, category=6)

    def synonyms(self, relationships: LexicalRelationshipStore, dictionary: "Dictionary") -> Tuple["Word", ...]:
        return self._related_words(relationships, dictionary, relationship_type=LexicalRelationshipType.SYNONYM, direction="both")

    def antonyms(self, relationships: LexicalRelationshipStore, dictionary: "Dictionary") -> Tuple["Word", ...]:
        return self._related_words(relationships, dictionary, relationship_type=LexicalRelationshipType.ANTONYM, direction="both")

    def hypernyms(self, relationships: LexicalRelationshipStore, dictionary: "Dictionary") -> Tuple["Word", ...]:
        return self._related_words(relationships, dictionary, relationship_type=LexicalRelationshipType.HYPERNYM)

    def hyponyms(self, relationships: LexicalRelationshipStore, dictionary: "Dictionary") -> Tuple["Word", ...]:
        return self._related_words(relationships, dictionary, relationship_type=LexicalRelationshipType.HYPONYM)

    def meronyms(self, relationships: LexicalRelationshipStore, dictionary: "Dictionary") -> Tuple["Word", ...]:
        return self._related_words(relationships, dictionary, relationship_type=LexicalRelationshipType.MERONYM, direction="incoming")

    def holonyms(self, relationships: LexicalRelationshipStore, dictionary: "Dictionary") -> Tuple["Word", ...]:
        return self._related_words(relationships, dictionary, relationship_type=LexicalRelationshipType.HOLONYM, direction="incoming")

    def troponyms(self, relationships: LexicalRelationshipStore, dictionary: "Dictionary") -> Tuple["Word", ...]:
        return self._related_words(relationships, dictionary, relationship_type=LexicalRelationshipType.TROPONYM)

    def spelling_variants(self, relationships: LexicalRelationshipStore, dictionary: "Dictionary") -> Tuple["Word", ...]:
        return self._related_words(relationships, dictionary, group=2, category=0, direction="both")

    def abbreviations(self, relationships: LexicalRelationshipStore, dictionary: "Dictionary") -> Tuple["Word", ...]:
        return self._related_words(relationships, dictionary, relationship_type=LexicalRelationshipType.ABBREVIATION)

    def acronyms(self, relationships: LexicalRelationshipStore, dictionary: "Dictionary") -> Tuple["Word", ...]:
        return self._related_words(relationships, dictionary, relationship_type=LexicalRelationshipType.ACRONYM)

    def contractions(self, relationships: LexicalRelationshipStore, dictionary: "Dictionary") -> Tuple["Word", ...]:
        return self._related_words(relationships, dictionary, relationship_type=LexicalRelationshipType.CONTRACTION)

    def transliterations(self, relationships: LexicalRelationshipStore, dictionary: "Dictionary") -> Tuple["Word", ...]:
        return self._related_words(relationships, dictionary, relationship_type=LexicalRelationshipType.TRANSLITERATION)

    def related_words(self, relationships: LexicalRelationshipStore, dictionary: "Dictionary") -> Tuple["Word", ...]:
        return self._related_words(relationships, dictionary, relationship_type=LexicalRelationshipType.RELATED, direction="both")
