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

import re
import uuid as uuid_module
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Optional, Tuple

from lira.linguistics.data.linguistic_unit import LinguisticUnit
from lira.value_objects import Code, Identifier, Number, Text

from .definition_word_reference import DefinitionWordReference
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

# Splits a definition's prose into its own word tokens -- deliberately a
# local regex, not a Linguistics-Layer LinguisticLexer import: Vocabulary
# must not depend on Linguistics (Linguistics depends on Vocabulary, via
# Word), and definition_words() only needs "the words in this string",
# not sentence/grammar structure. Same pattern as
# ExternalDictionaryAdapter._word_terms.
_DEFINITION_WORD_PATTERN = re.compile(r"[^\W_]+")


def _definition_tokens(definition_text: str) -> Tuple[str, ...]:
    return tuple(_DEFINITION_WORD_PATTERN.findall(definition_text.replace("-", " ")))


@dataclass
class Word(LinguisticUnit):
    part_of_speech: PartOfSpeech = field(kw_only=True)

    uuid: Identifier = field(default_factory=lambda: Identifier(value=str(uuid_module.uuid4())), kw_only=True)

    # The persistent Qualified Word Identity (Domain + Lexical Form +
    # part_of_speech) -- distinct from `uuid` above, which is deliberately
    # NOT stable: `uuid` is a per-Domain-graph-instance identity, freshly
    # regenerated every time a Word is copied into a Domain's own
    # Dictionary (Dictionary.seed_from, WordSeeder.seed_closed_class_words),
    # so that two Domains' independent copies of "be" are never confused
    # as the same graph node. `entry_id` is the opposite: assigned once,
    # when a Word is first authored (an asset-file entry, a promotion, a
    # hydration, or a conflict-resolution registration), stored in the
    # Common Vocabulary Cache's asset JSON for every entry that lives
    # there, and left untouched by every later copy -- the same
    # underlying vocabulary entry keeps the same entry_id no matter how
    # many Domains end up holding their own runtime copy of it. This is
    # what lets a Dictionary tell two distinct senses of the same
    # (domain, part_of_speech, lexical_form) apart (vocabulary/documentation/README.md,
    # 9.2) without needing to mangle lexical_form into something like
    # "particle_2" to do it.
    entry_id: Identifier = field(default_factory=lambda: Identifier(value=str(uuid_module.uuid4())), kw_only=True)

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
        """Returns the distinct set of related Words, in first-seen
        order -- not one entry per matching relationship. Two different
        edges can legitimately point at the same other Word (e.g. "her"
        is both the object form and the possessive-determiner form of
        "she", two distinct LexicalRelationships to the same Word), and
        a reciprocal pair (e.g. SYNONYM/ANTONYM, materialised in both
        directions -- see assets/common/en/relationships/README.md's
        Symmetric and inverse edges) is visible as both an outgoing and
        an incoming match under direction="both". Either way, a caller
        asking "what Words is this related to" wants each Word once."""
        my_id = self.uuid.value
        other_ids = []
        if direction in ("outgoing", "both"):
            other_ids += [r.target_word_id.value for r in relationships.outgoing(my_id)
                          if self._relationship_matches(r, relationship_type, group, category)]
        if direction in ("incoming", "both"):
            other_ids += [r.source_word_id.value for r in relationships.incoming(my_id)
                          if self._relationship_matches(r, relationship_type, group, category)]
        seen_ids = set()
        resolved = []
        for word_id in other_ids:
            if word_id in seen_ids:
                continue
            seen_ids.add(word_id)
            word = dictionary.find_by_uuid(word_id)
            if word is not None:
                resolved.append(word)
        return tuple(resolved)

    def lemma_forms(self, relationships: LexicalRelationshipStore, dictionary: "Dictionary") -> Tuple["Word", ...]:
        return self._related_words(relationships, dictionary, relationship_type=LexicalRelationshipType.LEMMA_FORM)

    def inflections(self, relationships: LexicalRelationshipStore, dictionary: "Dictionary") -> Tuple["Word", ...]:
        """Every Word that names this Word as its LEMMA_FORM -- the
        inverse direction of lemma_forms(), read via LEMMA_FORM's own
        incoming edges rather than a separately-seeded INFLECTION edge
        (which would just duplicate the same (source, target) pair
        under a second, less specific kind for no additional queryable
        value)."""
        return self._related_words(relationships, dictionary, relationship_type=LexicalRelationshipType.LEMMA_FORM, direction="incoming")

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

    # -- Definition word breakdown (4.4) ---------------------------------
    # Also not a stored field -- computed on demand, like the derived
    # properties above -- but resolved directly against a Dictionary
    # rather than a LexicalRelationshipStore: a definition is prose about
    # this Word, not a claimed relationship between two Words, so there is
    # no LexicalRelationship to read. Signature is deliberately narrower
    # than _related_words' callers above (no `relationships` parameter)
    # for the same reason.

    def definition_words(self, dictionary: "Dictionary") -> Tuple[DefinitionWordReference, ...]:
        """Breaks this Word's own `definition` text into its own sequenced
        array of DefinitionWordReferences, one per token in reading order
        -- unlike _related_words, duplicates are kept and position is
        preserved, since this describes a sentence, not a set of related
        Words. Empty when `definition` is None.

        Each token is resolved against `dictionary` domain-first: every
        same-text candidate `Dictionary.lookup_all` returns, preferring
        one with `is_common=False` if any exists, else falling back to
        `lookup_all`'s own first-seeded order -- the same one-liner
        `identify_word`'s own callers already use to prefer a Domain's
        own hydrated sense over Common's (vocabulary/documentation/README.md,
        9.7). A token with no candidate at all resolves to `word=None`,
        reported rather than guessed -- the same discipline
        DictionaryProcessor.identify_word applies to an unresolved
        occurrence, and the signal DictionaryProcessor.queue_definition_hydration
        acts on."""
        if self.definition is None:
            return ()
        references = []
        for token in _definition_tokens(self.definition.value):
            candidates = dictionary.lookup_all(token)
            resolved = next((word for word in candidates if not word.is_common), candidates[0]) if candidates else None
            references.append(DefinitionWordReference(text=token, word=resolved))
        return tuple(references)
