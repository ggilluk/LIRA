# LIRA Vocabulary Layer — Developer Specification

## Table of Contents

1. [Purpose](#1-purpose)
2. [Design Principles](#2-design-principles)
3. [Dictionary](#3-dictionary)
4. [DictionaryEntry](#4-dictionaryentry)
5. [LexicalRelationship](#5-lexicalrelationship)
6. [Enumerations](#6-enumerations)
7. [Supporting Value Objects](#7-supporting-value-objects)

---

## 1. Purpose

The Vocabulary Layer stores lexical forms and explicit relationships between lexical forms.

The layer contains three primary artefacts:

- `Dictionary`
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

## 3. Dictionary

### 3.1 Definition

`Dictionary` represents the top-level lexicon container: the aggregate of `DictionaryEntry` records for a language, or a domain-scoped vocabulary.

### 3.2 Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uuid` | `UUID` | Yes | Stable identifier |
| `version` | `str` | Yes | Dictionary version |
| `language_code` | `LanguageCode` | Yes | Language this dictionary indexes |
| `entries` | `tuple[DictionaryEntry, ...]` | Yes | The dictionary's lexicon entries |
| `source_references` | `tuple[SourceReference, ...]` | Yes | Source provenance |
| `system_properties` | `SystemPropertiesRef` | Yes | By-reference LIRA system properties |

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
