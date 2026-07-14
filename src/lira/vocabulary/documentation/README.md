# Vocabulary Layer

The Vocabulary Layer is where LIRA stores words: their spelling,
meaning, part of speech, and how they relate to other words (like
synonyms or plurals). It only stores vocabulary -- it doesn't know
about sentences, grammar (that's the Linguistics Layer), or domain
knowledge (that's the Knowledge Layer).

See the repository root's `ARCHITECTURE.md` for the full component
tree and design rules.

## Layout

- `data/` -- `VocabularyLayer`; one class per file implementing the
  Developer Specification below: `Dictionary` (aggregates `Word`
  records, no `DictionaryEntry` any more -- merged into `Word`),
  `Word`, `LexicalRelationship`; `PartOfSpeech`, `RegisterCode`,
  `EditorialLabel`, `LexicalRelationshipType` (integer-valued enums,
  numeric tensor-ready values, `LexicalRelationshipType` additionally
  bit-packing group/category/item); `Pronunciation`, `SourceReference`,
  `AttributeValue` supporting value objects; `LexicalRelationshipSystemPropertyTensor`
  and the by-reference `SystemPropertiesRef` view (Rule 14) -- only
  `LexicalRelationship` carries one, not `Dictionary` or `Word` (Design
  Principle 8). `Word` and `Punctuation` still subclass Linguistics's
  `LinguisticUnit`, since a word's lexical unit status, its part of
  speech, and its meaning are all lexical attributes (Rule 17).
- `agents/` -- `VocabularyAgent` and its concrete agents (`SeedAgent`,
  `LookupAgent`, `HydrateAgent`, `NormaliseAgent`).
- `role/` -- `DictionaryProcessor`, `AsyncDictionaryHydrator`,
  `ExternalDictionaryAdapter`, `LexicalRelationshipProcessor`,
  `WordSeeder` -- plain service classes for the lexicon and
  relationship graph, not `*Agent` subclasses.
- `assets/` -- `common/<language_code>/` -- the Common Vocabulary
  Cache `WordSeeder` loads (`common/en/` -- the mandatory 300-word
  English Common Closed-Class Cache v1; see 9.4 and
  `assets/common/en/README.md`).
- `api/`, `ui/` -- none yet.

---

## Developer Specification

The rest of this document is the Vocabulary Layer's developer
specification: the data model for `Dictionary`, `Word`, and
`LexicalRelationship`, their enumerations, and their supporting value
objects -- implemented in `data/` per Layout above.

### Table of Contents

1. [Purpose](#1-purpose)
2. [Design Principles](#2-design-principles)
3. [Dictionary](#3-dictionary)
4. [Word](#4-word)
5. [LexicalRelationship](#5-lexicalrelationship)
6. [Enumerations](#6-enumerations)
7. [Supporting Value Objects](#7-supporting-value-objects)
8. [Value Object Type Reference](#8-value-object-type-reference)
9. [Cross-Domain Vocabulary](#9-cross-domain-vocabulary)

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
| 8 | Tensor-backed system properties | Only `LexicalRelationship` references authoritative, tensor-backed system properties. `Dictionary` and `Word` do not -- confidence, provenance weight, activation, and the rest are properties of a *claimed relationship*, not of a word standing alone. |
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

`Dictionary` has no `system_properties` field -- see Design Principle 8.

### 4. Word

#### 4.1 Definition

`Word` represents one lexical form in one language and one grammatical category.

The same written form may have multiple `Word` entries where its language, script, grammatical category, or other identity-defining property differs.

> **Note:** this `Word` superseded the smaller class that used to be
> implemented in `vocabulary/data/word.py` (which only had `text`,
> `part_of_speech`, and `definition`, inherited from Linguistics's
> `LinguisticUnit`). Its `text` attribute is carried forward into 4.2
> below so the supersession lost no capability; `part_of_speech` and
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
| `is_common` | `bool` | Yes | `True` only for a `Word` loaded by `WordSeeder` from a Common Vocabulary Cache (9.4); defaults `False`, never set by hand |

`Word` has no `system_properties` field -- see Design Principle 8. This is not a gap: when a `Word` is used in Linguistics, in its *token* role (4.1), it draws confidence, activation, and the rest from the Linguistics tensor instead, via the `LinguisticUnit.system_property` (singular) it inherits -- a separate, Linguistics-owned mechanism, populated by `GraphProcessor` at the point the token is created. A `Word`-as-type (Vocabulary) has no tensor row of its own; a `Word`-as-token (Linguistics) does. Vocabulary-level confidence/provenance about the word itself, as opposed to its use in a sentence, only exists by way of a `LexicalRelationship`.

#### 4.3 Derived Properties

None of the following are stored directly on `Word`. Each is computed on demand by querying `LexicalRelationship` for records where this `Word` is the source (or target, where noted) -- not a lookup, a live derivation from the relationship graph. In `word.py`, each is a method rather than a bare `@property`, since a live derivation needs the relationship store and the `Dictionary` (to resolve the other word in each match) passed in -- e.g. `word.synonyms(relationships, dictionary)`.

| Derived Property | Type | Backing Relationship Type / Category | Meaning |
|-------------------|------|---------------------------------------|---------|
| `lemma_forms` | `tuple[Word, ...]` | `LEMMA_FORM` (6.2.1 Base relation) | The dictionary root form(s) this `Word` is an inflected or derived form of |
| `inflections` | `tuple[Word, ...]` | `INFLECTION` (6.2.1 Base relation) | The inflected form(s) derived from this `Word` |
| `morphological_variants` | `tuple[Word, ...]` | Morphological group, all categories (6.2.1) | Every grammatical variant of this `Word` -- tense, number, person, degree, and derivational forms combined |
| `derived_forms` | `tuple[Word, ...]` | Derivation category (6.2.1) | New words formed from this `Word` by a derivational prefix or suffix |
| `synonyms` | `tuple[Word, ...]` | `SYNONYM` (6.2.2 Similarity/Opposition) | Words that mean roughly the same as this `Word` |
| `antonyms` | `tuple[Word, ...]` | `ANTONYM` (6.2.2 Similarity/Opposition) | Words that mean the opposite of this `Word` |
| `hypernyms` | `tuple[Word, ...]` | `HYPERNYM` (6.2.2 Hierarchy) | Broader terms this `Word` is a kind of |
| `hyponyms` | `tuple[Word, ...]` | `HYPONYM` (6.2.2 Hierarchy) | Narrower terms that are a kind of this `Word` |
| `meronyms` | `tuple[Word, ...]` | `MERONYM` (6.2.2 Part-Whole) | Words naming a part of what this `Word` names |
| `holonyms` | `tuple[Word, ...]` | `HOLONYM` (6.2.2 Part-Whole) | Words naming the whole that this `Word` is a part of |
| `troponyms` | `tuple[Word, ...]` | `TROPONYM` (6.2.2 Manner) | More specific ways of performing the action this `Word` names |
| `spelling_variants` | `tuple[Word, ...]` | Spelling Variation category (6.2.3) | Alternative or historical spellings of this `Word` |
| `abbreviations` | `tuple[Word, ...]` | `ABBREVIATION` (6.2.3 Shortening) | Shortened forms of this `Word` |
| `acronyms` | `tuple[Word, ...]` | `ACRONYM` (6.2.3 Shortening) | Acronym forms of this `Word` |
| `contractions` | `tuple[Word, ...]` | `CONTRACTION` (6.2.3 Shortening) | Contracted forms of this `Word` |
| `transliterations` | `tuple[Word, ...]` | `TRANSLITERATION` (6.2.3 Script Transformation) | This `Word` rendered in another writing system |
| `related_words` | `tuple[Word, ...]` | `RELATED` (6.2.2 Unspecified) | Words known to be lexically associated with this `Word`, without a more specific relationship type |

The following are genuinely out of scope for the Vocabulary Layer -- not derived properties, because they don't describe a relationship between two `Word` entries at all:

| Concept | Meaning | Why it's out of scope |
|---------|---------|-------------------------|
| example sentences | A sentence demonstrating this `Word` in use | Belongs to the Linguistics Layer -- it's sentence structure, not vocabulary |
| sentence grammar | The grammatical role this `Word` plays within a sentence | Belongs to the Linguistics Layer -- it depends on a specific sentence, not the word itself |
| contextual interpretation | What this `Word` means in a specific domain or situation | Belongs to the Knowledge Layer -- domain context, not lexical inventory |

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

| Name | Value | Meaning |
|------|-------|---------|
| `NOUN` | 0 | A person, place, thing, or idea |
| `VERB` | 1 | An action, occurrence, or state of being |
| `ADJECTIVE` | 2 | Describes or modifies a noun |
| `ADVERB` | 3 | Describes or modifies a verb, adjective, or another adverb |
| `PRONOUN` | 4 | Stands in place of a noun |
| `DETERMINER` | 5 | Introduces and specifies a noun (e.g. "the", "a", "this") |
| `PREPOSITION` | 6 | Shows the relationship between a noun and another word |
| `CONJUNCTION` | 7 | Connects words, phrases, or clauses |
| `INTERJECTION` | 8 | An exclamation expressing emotion |
| `NUMERAL` | 9 | Expresses a number |
| `PARTICLE` | 10 | A function word that doesn't fit other categories (e.g. "to" in an infinitive) |
| `AUXILIARY` | 11 | A helping verb that supports the main verb (e.g. "have", "will") |
| `PROPER_NOUN` | 12 | The specific name of a person, place, or thing |
| `SYMBOL` | 13 | A non-alphabetic mark used in place of a word (e.g. "&", "%") |
| `PUNCTUATION` | 14 | A mark that structures or separates text (e.g. ".", ",") |
| `OTHER` | 15 | Does not fit any defined grammatical category |

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

| Name | Value | Meaning | Real-World Example |
|------|-------|---------|----------------------|
| `LEMMA_FORM` | 0 | Target is the lemma of the source | "running" → "run" |
| `INFLECTION` | 1 | Target is an inflected form | "run" → "running" |

###### Number (category 1)

Distinguishes a word's singular form from its plural form.

| Name | Value | Meaning | Real-World Example |
|------|-------|---------|----------------------|
| `SINGULAR_FORM` | 8 | Target is a singular form | "geese" → "goose" |
| `PLURAL_FORM` | 9 | Target is a plural form | "goose" → "geese" |

###### Tense (category 2)

Distinguishes a verb's present-tense form from its past-tense form.

| Name | Value | Meaning | Real-World Example |
|------|-------|---------|----------------------|
| `PRESENT_TENSE_FORM` | 16 | Target is a present-tense form | "ran" → "run" |
| `PAST_TENSE_FORM` | 17 | Target is a past-tense form | "run" → "ran" |

###### Aspect (category 3)

Distinguishes a verb's present participle (e.g. "running") from its past participle (e.g. "run").

| Name | Value | Meaning | Real-World Example |
|------|-------|---------|----------------------|
| `PRESENT_PARTICIPLE_FORM` | 24 | Target is a present participle | "run" → "running" |
| `PAST_PARTICIPLE_FORM` | 25 | Target is a past participle | "eat" → "eaten" |

###### Person (category 4)

Distinguishes which grammatical person a verb form is conjugated for -- first person ("I"/"we"), second person ("you"), or third person ("he"/"she"/"it"/"they").

| Name | Value | Meaning | Real-World Example |
|------|-------|---------|----------------------|
| `FIRST_PERSON_FORM` | 32 | Target is a first-person form | "be" → "am" |
| `SECOND_PERSON_FORM` | 33 | Target is a second-person form | "be" → "are" |
| `THIRD_PERSON_FORM` | 34 | Target is a third-person form | "be" → "is" |

###### Degree (category 5)

Distinguishes an adjective or adverb's comparative form (e.g. "faster") from its superlative form (e.g. "fastest").

| Name | Value | Meaning | Real-World Example |
|------|-------|---------|----------------------|
| `COMPARATIVE_FORM` | 40 | Target is a comparative form | "fast" → "faster" |
| `SUPERLATIVE_FORM` | 41 | Target is a superlative form | "fast" → "fastest" |

###### Derivation (category 6)

Connects a word to a new word built from it by adding a prefix or suffix that changes its grammatical category or meaning -- for example, naming "a person who does X", or turning a verb into a noun, adjective, or adverb.

| Name | Value | Meaning | Real-World Example |
|------|-------|---------|----------------------|
| `DERIVED_FORM` | 48 | Target is morphologically derived | "friend" → "friendly" |
| `AGENT_NOUN_DERIVATION` | 49 | Target denotes an agent | "teach" → "teacher" |
| `NOMINALISATION` | 50 | Target is a noun derivation | "decide" → "decision" |
| `ADJECTIVAL_DERIVATION` | 51 | Target is an adjective derivation | "wonder" → "wonderful" |
| `ADVERBIAL_DERIVATION` | 52 | Target is an adverb derivation | "quick" → "quickly" |

##### 6.2.2 Lexical Semantic (group 1)

Lexical semantic relationships connect two *different* words based on how their meanings relate to each other, rather than on shared grammatical form.

###### Similarity / Opposition (category 0)

Connects words that mean roughly the same thing, or words that mean the opposite of each other.

| Name | Value | Meaning | Real-World Example |
|------|-------|---------|----------------------|
| `SYNONYM` | 64 | Entries have similar lexical meaning | "happy" ↔ "glad" |
| `ANTONYM` | 65 | Entries express lexical opposition | "hot" ↔ "cold" |

###### Hierarchy (category 1)

Connects a general term to a more specific term beneath it, and vice versa -- for example, "animal" and "dog".

| Name | Value | Meaning | Real-World Example |
|------|-------|---------|----------------------|
| `HYPERNYM` | 72 | Target is lexically broader | "dog" → "animal" |
| `HYPONYM` | 73 | Target is lexically narrower | "animal" → "dog" |

###### Part-Whole (category 2)

Connects a word naming a part to a word naming the whole it belongs to, and vice versa -- for example, "wheel" and "car".

| Name | Value | Meaning | Real-World Example |
|------|-------|---------|----------------------|
| `MERONYM` | 80 | Source denotes a part of target | "wheel" → "car" |
| `HOLONYM` | 81 | Source denotes a whole containing target | "car" → "wheel" |

###### Manner (category 3)

Connects a general action to a word describing a more specific way of performing it -- for example, "walk" and "stroll".

| Name | Value | Meaning | Real-World Example |
|------|-------|---------|----------------------|
| `TROPONYM` | 88 | Target expresses a specific manner | "walk" → "stroll" |

###### Entailment / Causation (category 4)

Connects a word to another word whose meaning it logically implies, or to a word describing what it brings about -- for example, "snore" entails "sleep", and "kill" causes "die".

| Name | Value | Meaning | Real-World Example |
|------|-------|---------|----------------------|
| `ENTAILMENT` | 96 | Source lexically entails target | "snore" → "sleep" |
| `CAUSE` | 97 | Source lexically causes target | "kill" → "die" |

###### Unspecified (category 5)

Connects two words known to be lexically related without specifying the exact nature of that relationship.

| Name | Value | Meaning | Real-World Example |
|------|-------|---------|----------------------|
| `RELATED` | 104 | Entries have an unspecified lexical association | "bank" ↔ "money" |

##### 6.2.3 Orthographic and Naming (group 2)

Orthographic and naming relationships connect two written forms of the same word that differ in spelling, length, or writing system, rather than in grammar or meaning.

###### Spelling Variation (category 0)

Connects alternative spellings of the same word, including older, historical spellings that have since changed.

| Name | Value | Meaning | Real-World Example |
|------|-------|---------|----------------------|
| `SPELLING_VARIANT` | 128 | Alternative spelling | "colour" ↔ "color" |
| `HISTORICAL_SPELLING` | 129 | Historical spelling form | "shoppe" → "shop" |

###### Shortening (category 1)

Connects a full word or phrase to a shortened form of it -- an abbreviation, an acronym, an initialism, or a contraction.

| Name | Value | Meaning | Real-World Example |
|------|-------|---------|----------------------|
| `ABBREVIATION` | 136 | Shortened form | "Doctor" → "Dr." |
| `ACRONYM` | 137 | Acronym form | "Light Amplification by Stimulated Emission of Radiation" → "laser" |
| `INITIALISM` | 138 | Initial-letter form | "Federal Bureau of Investigation" → "FBI" |
| `CONTRACTION` | 139 | Contracted lexical form | "do not" → "don't" |

###### Script Transformation (category 2)

Connects a word to a version of itself rewritten in a different script, capitalisation, or with different diacritical marks.

| Name | Value | Meaning | Real-World Example |
|------|-------|---------|----------------------|
| `TRANSLITERATION` | 144 | Form represented in another writing system | "Москва" → "Moskva" |
| `CAPITALISATION` | 145 | Capitalisation variant | "nato" ↔ "NATO" |
| `DIACRITIC_VARIANT` | 146 | Variant differing by diacritics | "resume" ↔ "résumé" |

#### 6.5 RegisterCode

| Name | Value | Meaning |
|------|-------|---------|
| `FORMAL` | 0 | Suitable for formal or official contexts |
| `INFORMAL` | 1 | Suitable for casual, everyday contexts |
| `SLANG` | 2 | Very informal, often specific to a group or era |
| `TECHNICAL` | 3 | Specific to a professional or specialist field |
| `LITERARY` | 4 | Associated with literary or poetic writing |
| `COLLOQUIAL` | 5 | Characteristic of ordinary, spoken conversation |
| `VULGAR` | 6 | Coarse or offensive language |
| `NEUTRAL` | 7 | No particular register association |

#### 6.6 EditorialLabel

| Name | Value | Meaning |
|------|-------|---------|
| `ARCHAIC` | 0 | No longer in ordinary use, but still recognised |
| `OBSOLETE` | 1 | No longer in use at all |
| `RARE` | 2 | Encountered only occasionally |
| `HISTORICAL` | 3 | Refers to something that no longer exists |
| `OFFENSIVE` | 4 | Likely to offend; used with caution |
| `DEPRECATED` | 5 | Discouraged in favour of a preferred alternative |
| `REGIONAL` | 6 | Specific to a particular region or dialect |
| `NONSTANDARD` | 7 | Outside standard or prescribed usage |

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

| Value Object | Meaning | Used for |
|---------------|---------|----------|
| `Identifier` | A stable reference to another record or external resource | `uuid`, `source_word_id`, `target_word_id`, `external_identifier`, `reference_uri`, `licence_identifier` |
| `Text` | Free-form textual content | `version`, `lexical_form`, `normalised_form`, `syllable_representation`, `stress_pattern`, `gloss`, `definition`, `usage_notes`, `etymology_text`, `first_recorded_use`, `notation`, `value` (Pronunciation), `source_name`, `source_version`, `name`/`value` (AttributeValue) |
| `Code` | A value drawn from a defined classification or code list | `language_code`, `script_code`, `dialect_codes`, `frequency_scale`, `dialect_code` (Pronunciation) |
| `Number` | A numeric quantity | `syllable_count`, `frequency_value` |

`LexicalRelationship.system_properties` (`SystemPropertiesRef`), and object-graph collections (`words`, `pronunciations`, `source_references`, `qualifiers`), reference other typed objects rather than holding a scalar value, so Design Principle 11 does not apply to them. `system_properties` is not a field on `Dictionary` or `Word` at all -- see Design Principle 8.

### 9. Cross-Domain Vocabulary

A `Dictionary` belongs to exactly one `Domain`, but the same written
word can carry a genuinely different sense in a different `Domain` --
"bank" means one thing in a Finance domain and another in a Geography
domain. This section describes how a `Word`'s home `Domain` is
resolved, and how LIRA avoids two unrelated senses silently colliding
under the same identity.

#### 9.1 A Word can live in another Domain's Vocabulary

A `Word` a caller is resolving does not have to belong to the `Domain`
currently being processed -- it can be looked up in, or stored in, a
`Vocabulary` belonging to a different `Domain` entirely. `Domain.known_domains`
(Knowledge Layer, by-reference registry) is how one `Domain` becomes
aware of another's existence for this purpose.

#### 9.2 Resolving a word-sense conflict

When the `Word` a caller wants to register already exists in the
current `Dictionary` under a conflicting sense (same written form,
different meaning), resolve it in this order:

| Order | Strategy | When it applies |
|-------|----------|-------------------|
| 1 | Identify an existing Domain that already owns the conflicting sense | Another `Domain` in `known_domains` (or hosted on the same `LIRAHost`) already has a `Word` for this exact sense -- reference that `Word` there instead of duplicating it. |
| 2 | Create a new Domain for the sense | No existing `Domain` owns it, but the sense is significant enough to deserve its own `Domain` (e.g. a whole new subject area) -- see 9.3, `LIRAHost.get_or_create_domain`. |
| 3 | Modify the word's name | Neither of the above applies -- the two senses coexist in the same `Dictionary`, disambiguated by a sense-numbered suffix on `lexical_form` (`bank` / `bank_2` / `bank_3`, ...), while `text` (the raw surface form a tokenizer produces) is left untouched on both. |

Strategies 1 and 2 are judgement calls -- whether a conflicting sense
warrants an entirely different `Domain`, or just a second entry in the
same `Dictionary`, isn't something derivable from the words alone.
Strategy 3 (`DictionaryProcessor.register_conflicting_sense`,
`Dictionary.next_available_lexical_form`) is the mechanical fallback:
always available, requires no semantic judgement, but means a plain
surface-form lookup can still only resolve to one of the coexisting
senses.

#### 9.3 Every Dictionary is seeded from a reserved "Common" Domain

Every `LIRAHost` auto-creates a reserved `Domain` named `Common` the
moment the Host itself is created. Every other `Domain` a `LIRAHost`
creates afterwards -- via `LIRAHost.get_or_create_domain`, which is
also the trigger point for strategy 2 in 9.2, when a conflicting sense
needs a `Domain` that doesn't exist yet -- has its `Vocabulary.dictionary`
seeded with a copy of every `Word` in Common's `Dictionary`
(`Dictionary.seed_from`) before anything domain-specific is added.
This gives every `Domain` on a `Host` a shared vocabulary baseline:
ordinary words don't have to be rediscovered independently in every
`Domain`, only the senses specific to that `Domain` do.

Seeding only happens through `LIRAHost.get_or_create_domain` -- a
`Domain` constructed directly (without going through a `LIRAHost`) has
no `Common` to seed from and starts with an empty `Dictionary`, exactly
as before this section existed.

#### 9.4 The English Common Vocabulary Cache

> Every English LIRA Domain shall contain the 300 lexical forms
> defined by the English Common Closed-Class Cache v1.

This rule is what `Common`'s own `Dictionary` is seeded with, on
`LIRAHost` construction, before anything else: the 300 mandatory
English closed-class lexical forms (determiners, pronouns, auxiliaries,
prepositions, coordinating and subordinating conjunctions, particles)
that 9.3's propagation then carries into every `Domain` created
afterwards. Seed `Common` once, and every English `Domain` on that
`Host` satisfies the rule automatically.

The cache itself -- its file format, exact counts, rebuild policy, and
open-class word promotion/demotion rules -- is documented in full at
`vocabulary/assets/common/en/README.md`, alongside the data
(`manifest.json` plus one JSON file per closed-class kind, plus
`promoted_words.json`). **The cache is not the authoritative source of
a `Word`** -- it is a generated bootstrap asset; the authoritative
record of every `Word` remains the `Domain` that owns it.

Each entry carries as much of `Word`'s field set (4.2) as the cache
can populate responsibly: a real definition, register/editorial
classification (archaic, informal, regional, ...), a computed syllable
count for single-token entries, and a `source_references` entry
attributing it to this cache rather than to an external dictionary
that was never consulted. Fields this cache has no verified source for
-- `pronunciations`, `stress_pattern`, `frequency_value`/`frequency_scale`,
`etymology_text`, `first_recorded_use` -- are left `null` rather than
invented, since fabricated IPA transcriptions or corpus frequencies
would be presenting made-up data as fact. See
`vocabulary/assets/common/en/README.md`'s field table for the complete
breakdown.

`WordSeeder` (`vocabulary/role/word_seeder.py`) is the role that
validates, loads, and seeds the cache, and manages promotion/demotion
of open-class words into and out of `promoted_words.json`:

| Method | Responsibility |
|--------|-----------------|
| `validate_assets()` | Schema, duplicate lexical forms, per-file and total counts, mandatory file existence, manifest consistency, language codes, normalised forms. Creates `promoted_words.json` (empty) or `manifest.json` (recomputed) if either is missing -- never the mandatory closed-class content itself, which has to be authored. |
| `load_cache()` | Validates, then parses every mandatory file plus `promoted_words.json` into `Word` instances, each with `is_common=True`. Cached after the first call. |
| `seed_closed_class_words(dictionary)` | Appends a fresh copy of every cached `Word` not already present into `dictionary`. Idempotent. |
| `seed_domain(domain)` | `seed_closed_class_words` against `domain.vocabulary.dictionary`. |
| `promote_word(word, reference_count)` | Adds an open-class `word` to `promoted_words.json` once `reference_count` exceeds `promotion_threshold` (default 3). |
| `demote_word(word, reference_count)` | Removes a promoted `word` from `promoted_words.json` once `reference_count` falls below `demotion_threshold` (default 1) -- never touches the `Word`'s owning `Domain`. |

`promotion_threshold` and `demotion_threshold` are constructor
arguments, not hardcoded. Deciding *when* to call `promote_word` /
`demote_word` -- i.e. actually counting cross-`Domain` references to a
`Word` -- is not implemented anywhere in this codebase yet; `WordSeeder`
takes `reference_count` as a parameter rather than computing it.

`Word.is_common` (4.2) is `True` only for a `Word` that came from a
Common Vocabulary Cache via `WordSeeder` -- never set directly. A
`Word` a `Domain` discovers or defines on its own is `is_common=False`,
regardless of how ordinary the word is.

This design is language-agnostic by construction: `WordSeeder` takes a
`language_code` and loads whichever `assets/common/<language_code>/`
directory matches it. Adding `fr`, `de`, `es`, `it`, ... support means
adding sibling asset directories in the same format -- no change to
`WordSeeder` itself.
