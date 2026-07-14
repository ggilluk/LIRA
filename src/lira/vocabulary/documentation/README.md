# Vocabulary Layer

The Vocabulary Layer is where LIRA stores words: their spelling,
meaning, part of speech, and how they relate to other words (like
synonyms or plurals). It only stores vocabulary -- it doesn't know
about sentences, grammar (that's the Linguistics Layer), or domain
knowledge (that's the Knowledge Layer).

See the repository root's `ARCHITECTURE.md` for the full component
tree and design rules.

## Layout

- `data/` -- `VocabularyLayer`; `Dictionary`, `DictionaryEntry`, one
  class per file; `PartOfSpeech` (numeric tensor-ready values, same
  convention as Linguistics's `LinguisticUnitKind`); `Word`,
  `Punctuation` -- each still subclasses Linguistics's `LinguisticUnit`.
  All three live here, not Linguistics, since a word's lexical unit
  status, its part of speech, and its meaning are all lexical
  attributes (Rule 17). `DictionaryEntry.meaning` is a `value_objects`
  `Text` rather than a plain `str`.
- `agents/` -- `VocabularyAgent` and its concrete agents (`SeedAgent`,
  `LookupAgent`, `HydrateAgent`, `NormaliseAgent`).
- `role/` -- `DictionaryProcessor`, `AsyncDictionaryHydrator`,
  `ExternalDictionaryAdapter` -- plain service classes for the lexicon,
  not `*Agent` subclasses.
- `api/`, `ui/`, `assets/` -- none yet.

---

## Developer Specification

The rest of this document is the Vocabulary Layer's developer
specification: the target data model for `Dictionary`, `Word`, and
`LexicalRelationship`, their enumerations, and their supporting value
objects. Note: the `Word` defined here is designated to supersede the
`Word` class described in Layout above -- the code in `data/` has not
yet been updated to match; see the note under [4. Word](#4-word).

### Table of Contents

1. [Purpose](#1-purpose)
2. [Design Principles](#2-design-principles)
3. [Dictionary](#3-dictionary)
4. [Word](#4-word)
5. [LexicalRelationship](#5-lexicalrelationship)
6. [Enumerations](#6-enumerations)
7. [Supporting Value Objects](#7-supporting-value-objects)
8. [Value Object Type Reference](#8-value-object-type-reference)

### 1. Purpose

The Vocabulary Layer stores lexical forms and explicit relationships between lexical forms.

The layer contains three primary artefacts:

- `Dictionary`
- `Word`
- `LexicalRelationship`

The Vocabulary Layer is responsible only for vocabulary data. It does not model sentences, sentence structure, contextual interpretation, or domain knowledge.

### 2. Design Principles

| ID | Principle | Requirement |
|----|-----------|-------------|
| 1 | Independent lexical forms | Each lexical form must be stored as a separate `Word`. |
| 2 | Intrinsic properties only | A `Word` contains only properties of that lexical form. |
| 3 | Explicit relationships | Word-to-word connections are separate relationship objects. |
| 4 | No embedded word graphs | A `Word` must not contain collections of related words. |
| 5 | Directed relationships | Every relationship has an explicit source and target. |
| 6 | Extensible classification | New relationship types can be added without changing `Word`. |
| 7 | Provenance | Every `Word` and relationship retains source information. |
| 8 | Tensor-backed system properties | Every object references authoritative system properties. |
| 9 | Immutability | Core vocabulary objects should be immutable after creation. |
| 10 | Stable identity | Identifiers remain stable across persistence and reloading. |
| 11 | Value-object typed attributes | Every non-identity, non-enum, non-object-graph attribute is typed as a `value_objects` Value Object (`Text`, `Number`, `Identifier`, `Code`, ...), never a raw primitive. |
| 12 | Integer-valued enumerations | Every enumeration member carries a stable, sequential integer value alongside its name, for tensor-backed representation. |
| 13 | Bitwise-composable classification | Where an enumeration has natural sub-groupings (see `LexicalRelationshipType`, 6.2), those groupings are packed into the integer value as bit-fields (group/category/item), so classification is a shift-and-mask, not a lookup table. |

### 3. Dictionary

#### 3.1 Definition

`Dictionary` represents the top-level lexicon container: the aggregate of `Word` records for a language, or a domain-scoped vocabulary.

#### 3.2 Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uuid` | `Identifier` | Yes | Stable identifier |
| `version` | `Text` | Yes | Dictionary version |
| `language_code` | `Code` | Yes | Language this dictionary indexes |
| `words` | `tuple[Word, ...]` | Yes | The dictionary's lexicon entries |
| `source_references` | `tuple[SourceReference, ...]` | Yes | Source provenance |
| `system_properties` | `SystemPropertiesRef` | Yes | By-reference LIRA system properties |

### 4. Word

#### 4.1 Definition

`Word` represents one lexical form in one language and one grammatical category.

The same written form may have multiple `Word` entries where its language, script, grammatical category, or other identity-defining property differs.

> **Note:** this `Word` supersedes the `Word` class currently
> implemented in `vocabulary/data/word.py` (which only has `text`,
> `part_of_speech`, and `definition`, inherited from Linguistics's
> `LinguisticUnit`). Its `text` attribute is carried forward into 4.2
> below so the supersession loses no capability; `part_of_speech` and
> `definition` map directly onto this specification's fields of the
> same name.
>
> **On the `LinguisticUnit` dependency:** `Word` deliberately keeps
> subclassing Linguistics's `LinguisticUnit`, and this is not an
> unresolved layering error to fix. `Word` has two legitimate uses --
> the *type* (a lexical entry, owned by Vocabulary: language, part of
> speech, meaning, provenance) and the *token* (one occurrence of that
> type in a sentence, participating in Linguistics's
> Word/Clause/Sentence/Paragraph/Subject tree via `LinguisticUnit`'s
> `text` and `system_property`). Collapsing type and token into one
> undifferentiated notion of "word" is a known source of error in
> conventional NLP systems; `Word` living in Vocabulary while still
> inheriting the structural base it needs to sit inside Linguistics's
> tree is how this specification keeps the two senses distinct without
> duplicating the class.

#### 4.2 Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uuid` | `Identifier` | Yes | Stable identifier |
| `version` | `Text` | Yes | Word version |
| `language_code` | `Code` | Yes | Language of the lexical form |
| `text` | `Text` | Yes | Raw lexical unit text, carried forward from the superseded `Word` definition (there, inherited from Linguistics's `LinguisticUnit` base) |
| `lexical_form` | `Text` | Yes | Exact lexical form |
| `normalised_form` | `Text` | Yes | Normalised form used for indexing |
| `script_code` | `Code` | No | Writing system |
| `part_of_speech` | `PartOfSpeech` | Yes | Grammatical category |
| `pronunciations` | `tuple[Pronunciation, ...]` | No | Pronunciation variants |
| `syllable_representation` | `Text` | No | Human-readable syllable breakdown |
| `syllable_count` | `Number` | No | Number of syllables |
| `stress_pattern` | `Text` | No | Lexical stress pattern |
| `gloss` | `Text` | No | Short lexical description |
| `definition` | `Text` | No | Human-readable lexical definition |
| `usage_notes` | `tuple[Text, ...]` | No | Editorial guidance intrinsic to the lexical form |
| `register_codes` | `tuple[RegisterCode, ...]` | No | Register classifications |
| `dialect_codes` | `tuple[Code, ...]` | No | Regional or social language classifications |
| `frequency_value` | `Number` | No | Corpus-derived frequency |
| `frequency_scale` | `Code` | No | Frequency measurement scale |
| `etymology_text` | `Text` | No | Historical lexical origin |
| `first_recorded_use` | `Text` | No | Earliest recorded lexical use |
| `editorial_labels` | `tuple[EditorialLabel, ...]` | No | Editorial classifications |
| `source_references` | `tuple[SourceReference, ...]` | Yes | Source provenance |
| `system_properties` | `SystemPropertiesRef` | Yes | By-reference LIRA system properties |

#### 4.3 Excluded Fields

The following must not be stored directly on `Word`:

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

### 5. LexicalRelationship

#### 5.1 Definition

`LexicalRelationship` represents a directed relationship between two `Word` objects.

It must reference the source and target words by identifier.

#### 5.2 Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uuid` | `Identifier` | Yes | Stable relationship identifier |
| `version` | `Text` | Yes | Relationship version |
| `source_word_id` | `Identifier` | Yes | Source Word identifier |
| `target_word_id` | `Identifier` | Yes | Target Word identifier |
| `relationship_type` | `LexicalRelationshipType` | Yes | Relationship classification |
| `inverse_relationship_type` | `LexicalRelationshipType` | No | Declared inverse relationship type |
| `qualifiers` | `tuple[AttributeValue, ...]` | No | Typed qualifications |
| `source_references` | `tuple[SourceReference, ...]` | Yes | Source provenance |
| `system_properties` | `SystemPropertiesRef` | Yes | By-reference LIRA system properties |

### 6. Enumerations

All enumeration values below are integers, assigned sequentially, for direct use as tensor codes (Design Principle 12).

#### 6.1 PartOfSpeech

| Name | Value |
|------|-------|
| `NOUN` | 0 |
| `VERB` | 1 |
| `ADJECTIVE` | 2 |
| `ADVERB` | 3 |
| `PRONOUN` | 4 |
| `DETERMINER` | 5 |
| `PREPOSITION` | 6 |
| `CONJUNCTION` | 7 |
| `INTERJECTION` | 8 |
| `NUMERAL` | 9 |
| `PARTICLE` | 10 |
| `AUXILIARY` | 11 |
| `PROPER_NOUN` | 12 |
| `SYMBOL` | 13 |
| `PUNCTUATION` | 14 |
| `OTHER` | 15 |

#### 6.2 LexicalRelationshipType — Encoding

`LexicalRelationshipType` classifies every kind of relationship two `Word` entries can have to each other. It is one enumeration, organised below by what its values are relationships *about*: shared grammar (6.2.1), shared or opposed meaning (6.2.2), and shared or altered writing (6.2.3). Each of those is further broken down into the specific kind of comparison being made, and each value packs its group and category into the integer itself, so a caller can classify a value with bitwise operations alone, without a lookup table:

```
value = (group << 6) | (category << 3) | item

group    = value >> 6            # 2 bits: 0-3   (6.2.1, 6.2.2, or 6.2.3 below)
category = (value >> 3) & 0b111  # 3 bits: 0-7   (the sub-heading within that group)
item     = value & 0b111         # 3 bits: 0-7   (the specific relationship type within its category)
```

Group values: `0` = Morphological, `1` = Lexical Semantic, `2` = Orthographic and Naming (`3` reserved for a future fourth group). 3 bits per field caps each group at 8 categories and each category at 8 items -- the current largest category (Derivation, 5 items) and largest group (Morphological, 7 categories) both fit with room to grow. The whole value fits in a single byte (max value used below is 146).

##### 6.2.1 Morphological (group 0)

Morphological relationships connect two forms of the *same* underlying word that differ only because of grammar -- the two `Word` entries share one core meaning, and just the grammatical shape changes (its tense, number, person, and so on).

###### Base relation (category 0)

The most basic morphological link: connecting an inflected or derived form back to its dictionary root, or forward to a form built from it.

| Name | Value | Meaning |
|------|-------|---------|
| `LEMMA_FORM` | 0 | Target is the lemma of the source |
| `INFLECTION` | 1 | Target is an inflected form |

###### Number (category 1)

Distinguishes a word's singular form from its plural form.

| Name | Value | Meaning |
|------|-------|---------|
| `SINGULAR_FORM` | 8 | Target is a singular form |
| `PLURAL_FORM` | 9 | Target is a plural form |

###### Tense (category 2)

Distinguishes a verb's present-tense form from its past-tense form.

| Name | Value | Meaning |
|------|-------|---------|
| `PRESENT_TENSE_FORM` | 16 | Target is a present-tense form |
| `PAST_TENSE_FORM` | 17 | Target is a past-tense form |

###### Aspect (category 3)

Distinguishes a verb's present participle (e.g. "running") from its past participle (e.g. "run").

| Name | Value | Meaning |
|------|-------|---------|
| `PRESENT_PARTICIPLE_FORM` | 24 | Target is a present participle |
| `PAST_PARTICIPLE_FORM` | 25 | Target is a past participle |

###### Person (category 4)

Distinguishes which grammatical person a verb form is conjugated for -- first person ("I"/"we"), second person ("you"), or third person ("he"/"she"/"it"/"they").

| Name | Value | Meaning |
|------|-------|---------|
| `FIRST_PERSON_FORM` | 32 | Target is a first-person form |
| `SECOND_PERSON_FORM` | 33 | Target is a second-person form |
| `THIRD_PERSON_FORM` | 34 | Target is a third-person form |

###### Degree (category 5)

Distinguishes an adjective or adverb's comparative form (e.g. "faster") from its superlative form (e.g. "fastest").

| Name | Value | Meaning |
|------|-------|---------|
| `COMPARATIVE_FORM` | 40 | Target is a comparative form |
| `SUPERLATIVE_FORM` | 41 | Target is a superlative form |

###### Derivation (category 6)

Connects a word to a new word built from it by adding a prefix or suffix that changes its grammatical category or meaning -- for example, naming "a person who does X", or turning a verb into a noun, adjective, or adverb.

| Name | Value | Meaning |
|------|-------|---------|
| `DERIVED_FORM` | 48 | Target is morphologically derived |
| `AGENT_NOUN_DERIVATION` | 49 | Target denotes an agent |
| `NOMINALISATION` | 50 | Target is a noun derivation |
| `ADJECTIVAL_DERIVATION` | 51 | Target is an adjective derivation |
| `ADVERBIAL_DERIVATION` | 52 | Target is an adverb derivation |

##### 6.2.2 Lexical Semantic (group 1)

Lexical semantic relationships connect two *different* words based on how their meanings relate to each other, rather than on shared grammatical form.

###### Similarity / Opposition (category 0)

Connects words that mean roughly the same thing, or words that mean the opposite of each other.

| Name | Value | Meaning |
|------|-------|---------|
| `SYNONYM` | 64 | Entries have similar lexical meaning |
| `ANTONYM` | 65 | Entries express lexical opposition |

###### Hierarchy (category 1)

Connects a general term to a more specific term beneath it, and vice versa -- for example, "animal" and "dog".

| Name | Value | Meaning |
|------|-------|---------|
| `HYPERNYM` | 72 | Target is lexically broader |
| `HYPONYM` | 73 | Target is lexically narrower |

###### Part-Whole (category 2)

Connects a word naming a part to a word naming the whole it belongs to, and vice versa -- for example, "wheel" and "car".

| Name | Value | Meaning |
|------|-------|---------|
| `MERONYM` | 80 | Source denotes a part of target |
| `HOLONYM` | 81 | Source denotes a whole containing target |

###### Manner (category 3)

Connects a general action to a word describing a more specific way of performing it -- for example, "walk" and "stroll".

| Name | Value | Meaning |
|------|-------|---------|
| `TROPONYM` | 88 | Target expresses a specific manner |

###### Entailment / Causation (category 4)

Connects a word to another word whose meaning it logically implies, or to a word describing what it brings about -- for example, "snore" entails "sleep", and "kill" causes "die".

| Name | Value | Meaning |
|------|-------|---------|
| `ENTAILMENT` | 96 | Source lexically entails target |
| `CAUSE` | 97 | Source lexically causes target |

###### Unspecified (category 5)

Connects two words known to be lexically related without specifying the exact nature of that relationship.

| Name | Value | Meaning |
|------|-------|---------|
| `RELATED` | 104 | Entries have an unspecified lexical association |

##### 6.2.3 Orthographic and Naming (group 2)

Orthographic and naming relationships connect two written forms of the same word that differ in spelling, length, or writing system, rather than in grammar or meaning.

###### Spelling Variation (category 0)

Connects alternative spellings of the same word, including older, historical spellings that have since changed.

| Name | Value | Meaning |
|------|-------|---------|
| `SPELLING_VARIANT` | 128 | Alternative spelling |
| `HISTORICAL_SPELLING` | 129 | Historical spelling form |

###### Shortening (category 1)

Connects a full word or phrase to a shortened form of it -- an abbreviation, an acronym, an initialism, or a contraction.

| Name | Value | Meaning |
|------|-------|---------|
| `ABBREVIATION` | 136 | Shortened form |
| `ACRONYM` | 137 | Acronym form |
| `INITIALISM` | 138 | Initial-letter form |
| `CONTRACTION` | 139 | Contracted lexical form |

###### Script Transformation (category 2)

Connects a word to a version of itself rewritten in a different script, capitalisation, or with different diacritical marks.

| Name | Value | Meaning |
|------|-------|---------|
| `TRANSLITERATION` | 144 | Form represented in another writing system |
| `CAPITALISATION` | 145 | Capitalisation variant |
| `DIACRITIC_VARIANT` | 146 | Variant differing by diacritics |

#### 6.5 RegisterCode

| Name | Value |
|------|-------|
| `FORMAL` | 0 |
| `INFORMAL` | 1 |
| `SLANG` | 2 |
| `TECHNICAL` | 3 |
| `LITERARY` | 4 |
| `COLLOQUIAL` | 5 |
| `VULGAR` | 6 |
| `NEUTRAL` | 7 |

#### 6.6 EditorialLabel

| Name | Value |
|------|-------|
| `ARCHAIC` | 0 |
| `OBSOLETE` | 1 |
| `RARE` | 2 |
| `HISTORICAL` | 3 |
| `OFFENSIVE` | 4 |
| `DEPRECATED` | 5 |
| `REGIONAL` | 6 |
| `NONSTANDARD` | 7 |

### 7. Supporting Value Objects

#### 7.1 Pronunciation

| Field | Type | Required | Description |
|-------|------|----------|--------------|
| `notation` | `Text` | Yes | Pronunciation notation system |
| `value` | `Text` | Yes | Pronunciation representation |
| `dialect_code` | `Code` | No | Dialect to which pronunciation applies |

#### 7.2 SourceReference

| Field | Type | Required | Description |
|-------|------|----------|--------------|
| `source_name` | `Text` | Yes | Source dataset or publication |
| `source_version` | `Text` | No | Source version |
| `external_identifier` | `Identifier` | No | Identifier assigned by the source |
| `reference_uri` | `Identifier` | No | Source reference location |
| `licence_identifier` | `Identifier` | No | Licence applicable to imported information |

#### 7.3 AttributeValue

| Field | Type | Required | Description |
|-------|------|----------|--------------|
| `name` | `Text` | Yes | Qualifier name |
| `value` | `Text` | Yes | Serialised qualifier value |

### 8. Value Object Type Reference

Every non-identity, non-enum attribute in sections 3–7 resolves to one of the following individually-represented `lira.value_objects` Core Component Types, each its own class (`value_objects/data/<name>.py`):

| Value Object | Used for |
|---------------|----------|
| `Identifier` | `uuid`, `source_word_id`, `target_word_id`, `external_identifier`, `reference_uri`, `licence_identifier` |
| `Text` | `version`, `lexical_form`, `normalised_form`, `syllable_representation`, `stress_pattern`, `gloss`, `definition`, `usage_notes`, `etymology_text`, `first_recorded_use`, `notation`, `value` (Pronunciation), `source_name`, `source_version`, `name`/`value` (AttributeValue) |
| `Code` | `language_code`, `script_code`, `dialect_codes`, `frequency_scale`, `dialect_code` (Pronunciation) |
| `Number` | `syllable_count`, `frequency_value` |

`system_properties` (`SystemPropertiesRef`), and object-graph collections (`words`, `pronunciations`, `source_references`, `qualifiers`), reference other typed objects rather than holding a scalar value, so Design Principle 11 does not apply to them.
