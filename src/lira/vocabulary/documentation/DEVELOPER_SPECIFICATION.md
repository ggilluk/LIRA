# LIRA Vocabulary Layer — Developer Specification

## Table of Contents

1. [Purpose](#1-purpose)
2. [Design Principles](#2-design-principles)
3. [Package Structure](#3-package-structure)
4. [DictionaryEntry](#4-dictionaryentry)
5. [LexicalRelationship](#5-lexicalrelationship)
6. [Enumerations](#6-enumerations)
7. [Supporting Value Objects](#7-supporting-value-objects)
8. [Python Model](#8-python-model)
9. [Repository Interfaces](#9-repository-interfaces)
10. [Vocabulary Service](#10-vocabulary-service)
11. [Normalisation](#11-normalisation)
12. [Relationship Direction Rules](#12-relationship-direction-rules)
13. [Validation Rules](#13-validation-rules)
14. [Exceptions](#14-exceptions)
15. [Persistence Requirements](#15-persistence-requirements)
16. [Serialisation](#16-serialisation)
17. [Testing Requirements](#17-testing-requirements)
18. [Acceptance Criteria](#18-acceptance-criteria)
19. [Core Implementation Rule](#19-core-implementation-rule)

---

## 1. Purpose

The Vocabulary Layer stores lexical forms and explicit relationships between lexical forms.

The layer contains two primary artefacts:

- `DictionaryEntry`
- `LexicalRelationship`

The Vocabulary Layer is responsible only for vocabulary data. It does not model sentences, sentence structure, contextual interpretation, or domain knowledge.

---

## 2. Design Principles

| ID | Principle | Requirement |
|----|-----------|-------------|
| 1 | Independent lexical forms | Each lexical form must be stored as a separate entry. |
| 2 | Intrinsic properties only | Entries contain only properties of that lexical form. |
| 3 | Explicit relationships | Word-to-word connections are separate relationship objects. |
| 4 | No embedded word graphs | Entries must not contain collections of related entries. |
| 5 | Directed relationships | Every relationship has an explicit source and target. |
| 6 | Extensible classification | New relationship types can be added without changing entries. |
| 7 | Provenance | Every entry and relationship retains source information. |
| 8 | Tensor-backed system properties | Every object references authoritative system properties. |
| 9 | Immutability | Core vocabulary objects should be immutable after creation. |
| 10 | Stable identity | UUIDs remain stable across persistence and reloading. |

---

## 3. Package Structure

```
lira/
└── vocabulary/
    ├── __init__.py
    ├── models.py
    ├── enums.py
    ├── value_objects.py
    ├── repositories.py
    ├── services.py
    ├── validation.py
    ├── normalisation.py
    ├── exceptions.py
    └── tests/
        ├── test_dictionary_entry.py
        ├── test_lexical_relationship.py
        ├── test_repository.py
        ├── test_validation.py
        └── test_normalisation.py
```

---

## 4. DictionaryEntry

### 4.1 Definition

`DictionaryEntry` represents one lexical form in one language and one grammatical category.

The same written form may have multiple entries where its language, script, grammatical category, or other identity-defining property differs.

### 4.2 Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uuid` | `UUID` | Yes | Stable identifier |
| `version` | `str` | Yes | Entry version |
| `language_code` | `LanguageCode` | Yes | Language of the lexical form |
| `lexical_form` | `str` | Yes | Exact lexical form |
| `normalised_form` | `str` | Yes | Normalised form used for indexing |
| `script_code` | `ScriptCode \| None` | No | Writing system |
| `part_of_speech` | `PartOfSpeech` | Yes | Grammatical category |
| `pronunciations` | `tuple[Pronunciation, ...]` | No | Pronunciation variants |
| `syllable_representation` | `str \| None` | No | Human-readable syllable breakdown |
| `syllable_count` | `int \| None` | No | Number of syllables |
| `stress_pattern` | `str \| None` | No | Lexical stress pattern |
| `gloss` | `str \| None` | No | Short lexical description |
| `definition` | `str \| None` | No | Human-readable lexical definition |
| `usage_notes` | `tuple[str, ...]` | No | Editorial guidance intrinsic to the lexical form |
| `register_codes` | `tuple[RegisterCode, ...]` | No | Register classifications |
| `dialect_codes` | `tuple[DialectCode, ...]` | No | Regional or social language classifications |
| `frequency_value` | `float \| None` | No | Corpus-derived frequency |
| `frequency_scale` | `FrequencyScale \| None` | No | Frequency measurement scale |
| `etymology_text` | `str \| None` | No | Historical lexical origin |
| `first_recorded_use` | `str \| None` | No | Earliest recorded lexical use |
| `editorial_labels` | `tuple[EditorialLabel, ...]` | No | Editorial classifications |
| `source_references` | `tuple[SourceReference, ...]` | Yes | Source provenance |
| `system_properties` | `SystemPropertiesRef` | Yes | By-reference LIRA system properties |

### 4.3 Excluded Fields

The following must not be stored directly on `DictionaryEntry`:

| Excluded field | Required representation |
|----------------|--------------------------|
| lemma forms | `LexicalRelationship` |
| inflections | `LexicalRelationship` |
| morphological variants | `LexicalRelationship` |
| derived forms | `LexicalRelationship` |
| synonyms | `LexicalRelationship` |
| antonyms | `LexicalRelationship` |
| hypernyms | `LexicalRelationship` |
| hyponyms | `LexicalRelationship` |
| meronyms | `LexicalRelationship` |
| holonyms | `LexicalRelationship` |
| troponyms | `LexicalRelationship` |
| spelling variants | `LexicalRelationship` |
| abbreviations | `LexicalRelationship` |
| acronyms | `LexicalRelationship` |
| contractions | `LexicalRelationship` |
| transliterations | `LexicalRelationship` |
| related words | `LexicalRelationship` |
| example sentences | Outside Vocabulary Layer |
| sentence grammar | Outside Vocabulary Layer |
| contextual interpretation | Outside Vocabulary Layer |

---

## 5. LexicalRelationship

### 5.1 Definition

`LexicalRelationship` represents a directed relationship between two `DictionaryEntry` objects.

It must reference the source and target entries by UUID.

### 5.2 Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uuid` | `UUID` | Yes | Stable relationship identifier |
| `version` | `str` | Yes | Relationship version |
| `source_entry_id` | `UUID` | Yes | Source DictionaryEntry identifier |
| `target_entry_id` | `UUID` | Yes | Target DictionaryEntry identifier |
| `relationship_type` | `LexicalRelationshipType` | Yes | Relationship classification |
| `inverse_relationship_type` | `LexicalRelationshipType \| None` | No | Declared inverse relationship type |
| `qualifiers` | `tuple[AttributeValue, ...]` | No | Typed qualifications |
| `source_references` | `tuple[SourceReference, ...]` | Yes | Source provenance |
| `system_properties` | `SystemPropertiesRef` | Yes | By-reference LIRA system properties |

---

## 6. Enumerations

### 6.1 PartOfSpeech

| Value |
|-------|
| `NOUN` |
| `VERB` |
| `ADJECTIVE` |
| `ADVERB` |
| `PRONOUN` |
| `DETERMINER` |
| `PREPOSITION` |
| `CONJUNCTION` |
| `INTERJECTION` |
| `NUMERAL` |
| `PARTICLE` |
| `AUXILIARY` |
| `PROPER_NOUN` |
| `SYMBOL` |
| `PUNCTUATION` |
| `OTHER` |

### 6.2 LexicalRelationshipType — Morphological

| Value | Meaning |
|-------|---------|
| `LEMMA_FORM` | Target is the lemma of the source |
| `INFLECTION` | Target is an inflected form |
| `SINGULAR_FORM` | Target is a singular form |
| `PLURAL_FORM` | Target is a plural form |
| `PRESENT_TENSE_FORM` | Target is a present-tense form |
| `PAST_TENSE_FORM` | Target is a past-tense form |
| `PRESENT_PARTICIPLE_FORM` | Target is a present participle |
| `PAST_PARTICIPLE_FORM` | Target is a past participle |
| `FIRST_PERSON_FORM` | Target is a first-person form |
| `SECOND_PERSON_FORM` | Target is a second-person form |
| `THIRD_PERSON_FORM` | Target is a third-person form |
| `COMPARATIVE_FORM` | Target is a comparative form |
| `SUPERLATIVE_FORM` | Target is a superlative form |
| `DERIVED_FORM` | Target is morphologically derived |
| `AGENT_NOUN_DERIVATION` | Target denotes an agent |
| `NOMINALISATION` | Target is a noun derivation |
| `ADJECTIVAL_DERIVATION` | Target is an adjective derivation |
| `ADVERBIAL_DERIVATION` | Target is an adverb derivation |

### 6.3 LexicalRelationshipType — Lexical Semantic

| Value | Meaning |
|-------|---------|
| `SYNONYM` | Entries have similar lexical meaning |
| `ANTONYM` | Entries express lexical opposition |
| `HYPERNYM` | Target is lexically broader |
| `HYPONYM` | Target is lexically narrower |
| `MERONYM` | Source denotes a part of target |
| `HOLONYM` | Source denotes a whole containing target |
| `TROPONYM` | Target expresses a specific manner |
| `ENTAILMENT` | Source lexically entails target |
| `CAUSE` | Source lexically causes target |
| `RELATED` | Entries have an unspecified lexical association |

### 6.4 LexicalRelationshipType — Orthographic and Naming

| Value | Meaning |
|-------|---------|
| `SPELLING_VARIANT` | Alternative spelling |
| `HISTORICAL_SPELLING` | Historical spelling form |
| `ABBREVIATION` | Shortened form |
| `ACRONYM` | Acronym form |
| `INITIALISM` | Initial-letter form |
| `CONTRACTION` | Contracted lexical form |
| `TRANSLITERATION` | Form represented in another writing system |
| `CAPITALISATION` | Capitalisation variant |
| `DIACRITIC_VARIANT` | Variant differing by diacritics |

### 6.5 RegisterCode

| Value |
|-------|
| `FORMAL` |
| `INFORMAL` |
| `SLANG` |
| `TECHNICAL` |
| `LITERARY` |
| `COLLOQUIAL` |
| `VULGAR` |
| `NEUTRAL` |

### 6.6 EditorialLabel

| Value |
|-------|
| `ARCHAIC` |
| `OBSOLETE` |
| `RARE` |
| `HISTORICAL` |
| `OFFENSIVE` |
| `DEPRECATED` |
| `REGIONAL` |
| `NONSTANDARD` |

---

## 7. Supporting Value Objects

### 7.1 Pronunciation

| Field | Type | Required | Description |
|-------|------|----------|--------------|
| `notation` | `str` | Yes | Pronunciation notation system |
| `value` | `str` | Yes | Pronunciation representation |
| `dialect_code` | `DialectCode \| None` | No | Dialect to which pronunciation applies |

### 7.2 SourceReference

| Field | Type | Required | Description |
|-------|------|----------|--------------|
| `source_name` | `str` | Yes | Source dataset or publication |
| `source_version` | `str \| None` | No | Source version |
| `external_identifier` | `str \| None` | No | Identifier assigned by the source |
| `reference_uri` | `str \| None` | No | Source reference location |
| `licence_identifier` | `str \| None` | No | Licence applicable to imported information |

### 7.3 AttributeValue

| Field | Type | Required | Description |
|-------|------|----------|--------------|
| `name` | `str` | Yes | Qualifier name |
| `value` | `str` | Yes | Serialised qualifier value |

---

## 8. Python Model

```python
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Protocol
from uuid import UUID


class PartOfSpeech(str, Enum):
    NOUN = "noun"
    VERB = "verb"
    ADJECTIVE = "adjective"
    ADVERB = "adverb"
    PRONOUN = "pronoun"
    DETERMINER = "determiner"
    PREPOSITION = "preposition"
    CONJUNCTION = "conjunction"
    INTERJECTION = "interjection"
    NUMERAL = "numeral"
    PARTICLE = "particle"
    AUXILIARY = "auxiliary"
    PROPER_NOUN = "proper_noun"
    SYMBOL = "symbol"
    PUNCTUATION = "punctuation"
    OTHER = "other"


class RegisterCode(str, Enum):
    FORMAL = "formal"
    INFORMAL = "informal"
    SLANG = "slang"
    TECHNICAL = "technical"
    LITERARY = "literary"
    COLLOQUIAL = "colloquial"
    VULGAR = "vulgar"
    NEUTRAL = "neutral"


class EditorialLabel(str, Enum):
    ARCHAIC = "archaic"
    OBSOLETE = "obsolete"
    RARE = "rare"
    HISTORICAL = "historical"
    OFFENSIVE = "offensive"
    DEPRECATED = "deprecated"
    REGIONAL = "regional"
    NONSTANDARD = "nonstandard"


class LexicalRelationshipType(str, Enum):
    LEMMA_FORM = "lemma_form"
    INFLECTION = "inflection"
    SINGULAR_FORM = "singular_form"
    PLURAL_FORM = "plural_form"
    PRESENT_TENSE_FORM = "present_tense_form"
    PAST_TENSE_FORM = "past_tense_form"
    PRESENT_PARTICIPLE_FORM = "present_participle_form"
    PAST_PARTICIPLE_FORM = "past_participle_form"
    FIRST_PERSON_FORM = "first_person_form"
    SECOND_PERSON_FORM = "second_person_form"
    THIRD_PERSON_FORM = "third_person_form"
    COMPARATIVE_FORM = "comparative_form"
    SUPERLATIVE_FORM = "superlative_form"
    DERIVED_FORM = "derived_form"
    AGENT_NOUN_DERIVATION = "agent_noun_derivation"
    NOMINALISATION = "nominalisation"
    ADJECTIVAL_DERIVATION = "adjectival_derivation"
    ADVERBIAL_DERIVATION = "adverbial_derivation"

    SYNONYM = "synonym"
    ANTONYM = "antonym"
    HYPERNYM = "hypernym"
    HYPONYM = "hyponym"
    MERONYM = "meronym"
    HOLONYM = "holonym"
    TROPONYM = "troponym"
    ENTAILMENT = "entailment"
    CAUSE = "cause"
    RELATED = "related"

    SPELLING_VARIANT = "spelling_variant"
    HISTORICAL_SPELLING = "historical_spelling"
    ABBREVIATION = "abbreviation"
    ACRONYM = "acronym"
    INITIALISM = "initialism"
    CONTRACTION = "contraction"
    TRANSLITERATION = "transliteration"
    CAPITALISATION = "capitalisation"
    DIACRITIC_VARIANT = "diacritic_variant"


@dataclass(frozen=True, slots=True)
class Pronunciation:
    notation: str
    value: str
    dialect_code: str | None = None

    def __post_init__(self) -> None:
        if not self.notation.strip():
            raise ValueError("Pronunciation notation cannot be empty.")

        if not self.value.strip():
            raise ValueError("Pronunciation value cannot be empty.")


@dataclass(frozen=True, slots=True)
class SourceReference:
    source_name: str
    source_version: str | None = None
    external_identifier: str | None = None
    reference_uri: str | None = None
    licence_identifier: str | None = None

    def __post_init__(self) -> None:
        if not self.source_name.strip():
            raise ValueError("Source name cannot be empty.")


@dataclass(frozen=True, slots=True)
class AttributeValue:
    name: str
    value: str

    def __post_init__(self) -> None:
        if not self.name.strip():
            raise ValueError("Attribute name cannot be empty.")

        if not self.value.strip():
            raise ValueError("Attribute value cannot be empty.")


class SystemPropertiesRef(Protocol):

    @property
    def uuid(self) -> UUID:
        ...

    @property
    def version(self) -> str:
        ...

    @property
    def confidence_weight(self) -> float:
        ...

    @property
    def provenance_weight(self) -> float:
        ...

    @property
    def temporal_value_weight(self) -> float:
        ...

    @property
    def activation_weight(self) -> float:
        ...


@dataclass(frozen=True, slots=True)
class DictionaryEntry:
    uuid: UUID
    version: str
    language_code: str
    lexical_form: str
    normalised_form: str
    part_of_speech: PartOfSpeech
    source_references: tuple[SourceReference, ...]
    system_properties: SystemPropertiesRef

    script_code: str | None = None
    pronunciations: tuple[Pronunciation, ...] = field(default_factory=tuple)
    syllable_representation: str | None = None
    syllable_count: int | None = None
    stress_pattern: str | None = None
    gloss: str | None = None
    definition: str | None = None
    usage_notes: tuple[str, ...] = field(default_factory=tuple)
    register_codes: tuple[RegisterCode, ...] = field(default_factory=tuple)
    dialect_codes: tuple[str, ...] = field(default_factory=tuple)
    frequency_value: float | None = None
    frequency_scale: str | None = None
    etymology_text: str | None = None
    first_recorded_use: str | None = None
    editorial_labels: tuple[EditorialLabel, ...] = field(default_factory=tuple)

    def __post_init__(self) -> None:
        if not self.version.strip():
            raise ValueError("Version cannot be empty.")

        if not self.language_code.strip():
            raise ValueError("Language code cannot be empty.")

        if not self.lexical_form.strip():
            raise ValueError("Lexical form cannot be empty.")

        if not self.normalised_form.strip():
            raise ValueError("Normalised form cannot be empty.")

        if not self.source_references:
            raise ValueError(
                "At least one source reference is required."
            )

        if self.syllable_count is not None and self.syllable_count < 1:
            raise ValueError(
                "Syllable count must be greater than zero."
            )

        if (
            self.frequency_value is not None
            and not self.frequency_scale
        ):
            raise ValueError(
                "Frequency scale is required when frequency value is set."
            )

    @property
    def uniqueness_key(
        self,
    ) -> tuple[str, str, PartOfSpeech, str | None]:
        return (
            self.language_code.casefold(),
            self.normalised_form.casefold(),
            self.part_of_speech,
            self.script_code,
        )


@dataclass(frozen=True, slots=True)
class LexicalRelationship:
    uuid: UUID
    version: str
    source_entry_id: UUID
    target_entry_id: UUID
    relationship_type: LexicalRelationshipType
    source_references: tuple[SourceReference, ...]
    system_properties: SystemPropertiesRef

    inverse_relationship_type: LexicalRelationshipType | None = None
    qualifiers: tuple[AttributeValue, ...] = field(default_factory=tuple)

    def __post_init__(self) -> None:
        if not self.version.strip():
            raise ValueError("Version cannot be empty.")

        if self.source_entry_id == self.target_entry_id:
            raise ValueError(
                "Source and target entries cannot be identical."
            )

        if not self.source_references:
            raise ValueError(
                "At least one source reference is required."
            )
```

---

## 9. Repository Interfaces

```python
from typing import Protocol
from uuid import UUID


class DictionaryEntryRepository(Protocol):

    def add(self, entry: DictionaryEntry) -> None:
        ...

    def update(self, entry: DictionaryEntry) -> None:
        ...

    def remove(self, entry_id: UUID) -> None:
        ...

    def get(self, entry_id: UUID) -> DictionaryEntry | None:
        ...

    def exists(self, entry_id: UUID) -> bool:
        ...

    def find(
        self,
        *,
        language_code: str,
        lexical_form: str,
        part_of_speech: PartOfSpeech | None = None,
        script_code: str | None = None,
    ) -> tuple[DictionaryEntry, ...]:
        ...

    def find_by_normalised_form(
        self,
        *,
        language_code: str,
        normalised_form: str,
    ) -> tuple[DictionaryEntry, ...]:
        ...


class LexicalRelationshipRepository(Protocol):

    def add(self, relationship: LexicalRelationship) -> None:
        ...

    def update(self, relationship: LexicalRelationship) -> None:
        ...

    def remove(self, relationship_id: UUID) -> None:
        ...

    def get(
        self,
        relationship_id: UUID,
    ) -> LexicalRelationship | None:
        ...

    def get_outgoing(
        self,
        *,
        source_entry_id: UUID,
        relationship_type: LexicalRelationshipType | None = None,
    ) -> tuple[LexicalRelationship, ...]:
        ...

    def get_incoming(
        self,
        *,
        target_entry_id: UUID,
        relationship_type: LexicalRelationshipType | None = None,
    ) -> tuple[LexicalRelationship, ...]:
        ...

    def exists_between(
        self,
        *,
        source_entry_id: UUID,
        target_entry_id: UUID,
        relationship_type: LexicalRelationshipType,
    ) -> bool:
        ...
```

---

## 10. Vocabulary Service

The service layer coordinates validation, normalisation, duplicate detection, and relationship creation.

```python
class VocabularyService:

    def __init__(
        self,
        entry_repository: DictionaryEntryRepository,
        relationship_repository: LexicalRelationshipRepository,
        normaliser: LexicalNormaliser,
    ) -> None:
        self._entry_repository = entry_repository
        self._relationship_repository = relationship_repository
        self._normaliser = normaliser

    def add_entry(
        self,
        entry: DictionaryEntry,
    ) -> DictionaryEntry:
        ...

    def add_relationship(
        self,
        relationship: LexicalRelationship,
        *,
        create_inverse: bool = True,
    ) -> LexicalRelationship:
        ...

    def find_entries(
        self,
        lexical_form: str,
        language_code: str,
        part_of_speech: PartOfSpeech | None = None,
    ) -> tuple[DictionaryEntry, ...]:
        ...

    def get_related_entries(
        self,
        entry_id: UUID,
        relationship_type: LexicalRelationshipType | None = None,
    ) -> tuple[DictionaryEntry, ...]:
        ...
```

### 10.1 Service Responsibilities

| Responsibility | Behaviour |
|-----------------|-----------|
| Normalisation | Calculate or validate `normalised_form` |
| Duplicate detection | Reject duplicate uniqueness keys |
| Entry validation | Validate required fields and intrinsic constraints |
| Relationship validation | Confirm source and target entries exist |
| Duplicate relationship check | Reject duplicate source/type/target combinations |
| Inverse creation | Create inverse relationship where configured |
| Symmetry handling | Create reciprocal relationship for symmetric types |
| Provenance preservation | Preserve all source references |
| Immutability | Replace records rather than mutate stored objects |

---

## 11. Normalisation

### 11.1 Interface

```python
from typing import Protocol


class LexicalNormaliser(Protocol):

    def normalise(
        self,
        lexical_form: str,
        language_code: str,
        script_code: str | None = None,
    ) -> str:
        ...
```

### 11.2 Minimum Normalisation Rules

| ID | Rule |
|----|------|
| 1 | Remove leading and trailing whitespace |
| 2 | Apply Unicode normalisation |
| 3 | Apply language-aware case normalisation where appropriate |
| 4 | Preserve internal punctuation |
| 5 | Preserve diacritics unless explicitly configured otherwise |
| 6 | Do not stem or lemmatise |
| 7 | Do not replace the original `lexical_form` |

Recommended Unicode form:

```python
unicodedata.normalize("NFC", lexical_form)
```

`normalised_form` is an indexing value. It must not overwrite or replace `lexical_form`.

---

## 12. Relationship Direction Rules

### 12.1 Symmetric Relationships

| Relationship |
|--------------|
| `SYNONYM` |
| `ANTONYM` |
| `SPELLING_VARIANT` |
| `RELATED` |

The initial implementation should persist both directions explicitly.

### 12.2 Inverse Relationship Pairs

| Relationship | Inverse |
|--------------|---------|
| `LEMMA_FORM` | `INFLECTION` |
| `SINGULAR_FORM` | `PLURAL_FORM` |
| `PLURAL_FORM` | `SINGULAR_FORM` |
| `HYPERNYM` | `HYPONYM` |
| `HYPONYM` | `HYPERNYM` |
| `MERONYM` | `HOLONYM` |
| `HOLONYM` | `MERONYM` |
| `ABBREVIATION` | `EXPANDED_FORM` |
| `DERIVED_FORM` | `DERIVED_FROM` |

Where an inverse type is required but not yet defined in the enumeration, it must be added rather than represented as an untyped reverse link.

Recommended additional enumeration values:

```python
EXPANDED_FORM = "expanded_form"
DERIVED_FROM = "derived_from"
```

### 12.3 Duplicate Definition

A relationship is considered a duplicate when all three values match:

`source_entry_id` + `relationship_type` + `target_entry_id`

---

## 13. Validation Rules

### 13.1 DictionaryEntry Validation

| ID | Rule |
|----|------|
| 1 | `uuid` must be present |
| 2 | `version` must not be empty |
| 3 | `language_code` must not be empty |
| 4 | `lexical_form` must not be empty |
| 5 | `normalised_form` must not be empty |
| 6 | `part_of_speech` must be valid |
| 7 | `source_references` must contain at least one item |
| 8 | `system_properties` must be present |
| 9 | `syllable_count` must be greater than zero when provided |
| 10 | `frequency_scale` is required with `frequency_value` |
| 11 | `frequency_value` must be finite |
| 12 | duplicate uniqueness keys must be rejected |
| 13 | related-word collections must not exist |

### 13.2 LexicalRelationship Validation

| ID | Rule |
|----|------|
| 1 | `uuid` must be present |
| 2 | `version` must not be empty |
| 3 | source entry must exist |
| 4 | target entry must exist |
| 5 | `relationship_type` must be valid |
| 6 | `source_references` must contain at least one item |
| 7 | `system_properties` must be present |
| 8 | source and target must differ |
| 9 | duplicate relationships must be rejected |
| 10 | inverse type must comply with the relationship definition |
| 11 | qualifiers must have non-empty names and values |

---

## 14. Exceptions

```python
class VocabularyError(Exception):
    """Base exception for the Vocabulary Layer."""


class VocabularyValidationError(VocabularyError):
    """Raised when a vocabulary object is invalid."""


class DuplicateDictionaryEntryError(VocabularyError):
    """Raised when an entry uniqueness key already exists."""


class DictionaryEntryNotFoundError(VocabularyError):
    """Raised when a requested entry cannot be found."""


class DuplicateLexicalRelationshipError(VocabularyError):
    """Raised when the same directed relationship already exists."""


class LexicalRelationshipNotFoundError(VocabularyError):
    """Raised when a requested relationship cannot be found."""


class InvalidInverseRelationshipError(VocabularyError):
    """Raised when an inverse relationship is invalid."""
```

---

## 15. Persistence Requirements

The persistence implementation may use relational storage, graph storage, document storage, or an in-memory representation.

It must satisfy the following logical constraints.

### 15.1 Dictionary Entry Indexes

| Index | Fields |
|-------|--------|
| Primary | `uuid` |
| Unique lexical entry | `language_code`, `normalised_form`, `part_of_speech`, `script_code` |
| Lexical search | `language_code`, `lexical_form` |
| Normalised search | `language_code`, `normalised_form` |
| Part-of-speech search | `language_code`, `part_of_speech` |

### 15.2 Relationship Indexes

| Index | Fields |
|-------|--------|
| Primary | `uuid` |
| Unique relationship | `source_entry_id`, `relationship_type`, `target_entry_id` |
| Outgoing traversal | `source_entry_id`, `relationship_type` |
| Incoming traversal | `target_entry_id`, `relationship_type` |
| Relationship search | `relationship_type` |

### 15.3 Deletion Behaviour

A `DictionaryEntry` must not be deleted while active relationships reference it.

Supported behaviours:

| Behaviour | Requirement |
|-----------|-------------|
| Reject deletion | Default behaviour |
| Cascade deletion | Allowed only through an explicit administrative operation |
| Soft deletion | Preferred where historical provenance must be preserved |

---

## 16. Serialisation

### 16.1 Requirements

| ID | Requirement |
|----|-------------|
| 1 | UUID values serialise as strings |
| 2 | Enum values serialise using their string values |
| 3 | Tuples serialise as arrays |
| 4 | Missing optional values serialise as null or are omitted |
| 5 | Source provenance must not be dropped |
| 6 | System properties serialise by reference identifier |
| 7 | Schema version must be retained |

### 16.2 Recommended Functions

```python
def dictionary_entry_to_dict(
    entry: DictionaryEntry,
) -> dict[str, object]:
    ...


def dictionary_entry_from_dict(
    data: dict[str, object],
    system_properties: SystemPropertiesRef,
) -> DictionaryEntry:
    ...


def lexical_relationship_to_dict(
    relationship: LexicalRelationship,
) -> dict[str, object]:
    ...


def lexical_relationship_from_dict(
    data: dict[str, object],
    system_properties: SystemPropertiesRef,
) -> LexicalRelationship:
    ...
```

---

## 17. Testing Requirements

### 17.1 DictionaryEntry Tests

| ID | Test |
|----|------|
| 1 | Valid entry can be created |
| 2 | Empty lexical form is rejected |
| 3 | Empty normalised form is rejected |
| 4 | Missing source reference is rejected |
| 5 | Invalid syllable count is rejected |
| 6 | Frequency without scale is rejected |
| 7 | Uniqueness key is stable |
| 8 | Immutable fields cannot be modified |
| 9 | Two grammatical categories can use the same lexical form |

### 17.2 LexicalRelationship Tests

| ID | Test |
|----|------|
| 1 | Valid relationship can be created |
| 2 | Self-reference is rejected |
| 3 | Missing source reference is rejected |
| 4 | Missing source entry is rejected |
| 5 | Missing target entry is rejected |
| 6 | Duplicate relationship is rejected |
| 7 | Inverse relationship is generated correctly |
| 8 | Symmetric reverse relationship is generated correctly |
| 9 | Incoming relationships can be retrieved |
| 10 | Outgoing relationships can be retrieved |

### 17.3 Normalisation Tests

| ID | Test |
|----|------|
| 1 | Leading and trailing whitespace is removed |
| 2 | Unicode is normalised |
| 3 | Original lexical form is preserved |
| 4 | Case normalisation is deterministic |
| 5 | Internal punctuation is preserved |
| 6 | Diacritics are preserved |
| 7 | Normalisation does not perform stemming |

---

## 18. Acceptance Criteria

| ID | Acceptance criterion |
|----|------------------------|
| 1 | A lexical form can be stored as an independent DictionaryEntry |
| 2 | Different grammatical categories can use the same lexical form |
| 3 | Morphological variants are represented as relationships |
| 4 | Semantic lexical links are represented as relationships |
| 5 | Orthographic variants are represented as relationships |
| 6 | DictionaryEntry contains no embedded related-word collections |
| 7 | Entries can be searched by lexical and normalised form |
| 8 | Relationships can be traversed in both directions |
| 9 | Duplicate entries are rejected |
| 10 | Duplicate relationships are rejected |
| 11 | Symmetric relationships are persisted consistently |
| 12 | Inverse relationships are persisted consistently |
| 13 | Provenance is retained for all objects |
| 14 | System properties are referenced by all vocabulary objects |
| 15 | Objects can be serialised and restored without data loss |
| 16 | New relationship types require no DictionaryEntry schema change |
| 17 | Automated tests cover validation, traversal and normalisation |

---

## 19. Core Implementation Rule

A value belongs to `DictionaryEntry` only when it describes that lexical form independently.

Every connection between lexical forms must be represented by `LexicalRelationship`.

The implementation must therefore preserve the following boundary:

| DictionaryEntry | LexicalRelationship |
|------------------|----------------------|
| lexical form | lemma relationship |
| language | inflection relationship |
| grammatical category | derivation relationship |
| pronunciation | synonym relationship |
| syllable information | antonym relationship |
| stress | hypernym relationship |
| frequency | hyponym relationship |
| register | spelling-variant relationship |
| dialect | abbreviation relationship |
| etymology | transliteration relationship |
| editorial labels | any other word-to-word connection |
