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
  Principle 8). `Word` still subclasses Linguistics's `LinguisticUnit`,
  since a word's lexical unit status, its part of speech, and its
  meaning are all lexical attributes (Rule 17). There is no separate
  `Punctuation` class -- a punctuation mark is an ordinary `Word` with
  `part_of_speech=PUNCTUATION`, seeded from `assets/common/en/punctuation.json`
  like any other mandatory closed-class file.
- `agents/` -- `VocabularyAgent` and its concrete agents (`SeedAgent`,
  `LookupAgent`, `HydrateAgent`, `NormaliseAgent`).
- `role/` -- `DictionaryProcessor`, `AsyncDictionaryHydrator`,
  `ExternalDictionaryAdapter`, `LexicalRelationshipProcessor`,
  `WordSeeder`, `RelationshipSeeder` -- plain service classes for the
  lexicon and relationship graph, not `*Agent` subclasses.
- `assets/` -- `common/<language_code>/` -- the Common Vocabulary
  Cache `WordSeeder` loads (`common/en/` -- the mandatory 388-word
  English Common Closed-Class Cache v1 (including punctuation, symbols,
  numerals, and closed-class contractions/phrasal particles), plus 163
  supplementary open-class metalinguistic terms across six parts of
  speech; see 9.4 and `assets/common/en/README.md`)
  plus `common/<language_code>/relationships/`
  -- the Common Vocabulary Relationship Cache `RelationshipSeeder`
  loads (`common/en/relationships/`; see 9.5 and
  `assets/common/en/relationships/README.md`).
- `ui/` -- `DictionaryView`: renders a `Dictionary` and its
  `LexicalRelationshipStore` as a single self-contained HTML page
  (searchable/sortable Words and Relationships tables, cross-linked);
  see `ui/README.md`.
- `api/` -- none yet.

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

The same written form may have multiple `Word` entries where its language, script, grammatical category, or other identity-defining property differs. The Common Vocabulary Cache exercises this for real (9.4): `that`/`this`/`these`/`those` each have both a `DETERMINER` and a `PRONOUN` entry, and `which`/`what` each have both a `PRONOUN` and a `DETERMINER` entry.

There is no separate `Punctuation` class. A punctuation mark (".", "!", "?", ";", ",") is an ordinary `Word` with `part_of_speech=PUNCTUATION` (6.1), seeded from the mandatory `assets/common/en/punctuation.json` like any other closed-class file (9.4). `LinguisticUnitKind` (Linguistics Layer) still distinguishes a punctuation *token* from a word token at the tensor-kind level, but that distinction is now derived from `part_of_speech` at the point `GraphProcessor` builds the tree, not from a separate Python type.

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

Every one of these returns each related `Word` once, not once per matching relationship -- two different edges can legitimately point at the same other `Word` (`her` is both the object form and the possessive-determiner form of `she`, two distinct `LexicalRelationship`s to the same `Word`), and a reciprocal pair materialised in both directions (`SYNONYM`/`ANTONYM`, see the relationship cache README's Symmetric and inverse edges section) is visible as both an outgoing and an incoming match for a `direction="both"` property. `Word._related_words` (the shared helper behind every property below) deduplicates by target `Word` identity before returning.

| Derived Property | Type | Backing Relationship Type / Category | Meaning |
|-------------------|------|---------------------------------------|---------|
| `lemma_forms` | `tuple[Word, ...]` | `LEMMA_FORM` (6.2.1 Base relation) | The dictionary root form(s) this `Word` is an inflected or derived form of |
| `inflections` | `tuple[Word, ...]` | `LEMMA_FORM`, incoming (6.2.1 Base relation) | The inflected form(s) derived from this `Word` -- every `Word` that names this one as its `LEMMA_FORM`, not a separately-seeded `INFLECTION` edge (`INFLECTION` is defined but never seeded, since it would only duplicate the same pair `LEMMA_FORM` already covers from the other direction) |
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

Group values: `0` = Morphological, `1` = Lexical Semantic, `2` = Orthographic and Naming (`3` reserved for a future fourth group). 3 bits per field caps each group at 8 categories and each category at 8 items. The largest category (Pronoun Form, 6 items) still fits with room to grow, but Morphological is now at its 8-category ceiling (0-7 all used) -- a future ninth Morphological category would need the category field widened beyond 3 bits. The whole value fits in a single byte (max value used below is 146).

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

###### Pronoun Form (category 7)

Connects a personal pronoun to one of its other paradigm forms -- the same pronoun playing a different grammatical role, not a derivational relationship (it doesn't change grammatical category or add a prefix/suffix, which is why this is its own category rather than reusing Derivation's `DERIVED_FORM`). This is the last available category in the Morphological group -- see 6.2's encoding note on the 3-bit category ceiling.

| Name | Value | Meaning | Real-World Example |
|------|-------|---------|----------------------|
| `PRONOUN_OBJECT_FORM` | 56 | Target is the object form of the source pronoun | "I" → "me" |
| `PRONOUN_SUBJECT_FORM` | 57 | Target is the subject form of the source pronoun | "me" → "I" |
| `PRONOUN_POSSESSIVE_DETERMINER_FORM` | 58 | Target is the possessive determiner form of the source pronoun | "I" → "my" |
| `PRONOUN_POSSESSIVE_FORM` | 59 | Target is the independent possessive pronoun form of the source pronoun | "I" → "mine" |
| `PRONOUN_REFLEXIVE_FORM` | 60 | Target is the reflexive form of the source pronoun | "I" → "myself" |
| `PRONOUN_RECIPROCAL_FORM` | 61 | Target is a reciprocal form corresponding to the source pronoun | "they" → "each other" |

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
always available, requires no semantic judgement, but means two (or
more) `Word` entries coexist under the same `text`, distinguished only
by their sense-numbered `lexical_form`. `Dictionary.lookup(text)`
still resolves to just one of them (whichever was appended first) --
for a caller that genuinely needs every sense, `Dictionary.lookup_all(text)`
returns all of them, unlike `lookup`.

This is exactly the limitation `linguistics/documentation/README.md`'s
"Semantic decomposition and semantic disambiguation" TODO is tracking
from the parsing side: `GraphProcessor.process_token` resolves every
token via plain `Dictionary.lookup`, so a homograph in running text
(`that`, `which`, `be`, `past`, ...) currently always gets whichever
sense was seeded first, never the sense the sentence actually calls
for. `lookup_all` makes every candidate sense visible; nothing yet
chooses among them using context.

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

> Every English LIRA Domain shall contain the mandatory lexical forms
> defined by the English Common Closed-Class Cache v1.

This rule is what `Common`'s own `Dictionary` is seeded with, on
`LIRAHost` construction, before anything else: the 388 mandatory
English closed-class lexical forms (determiners, pronouns, auxiliaries,
prepositions, coordinating and subordinating conjunctions, particles,
punctuation, symbols, numerals) that 9.3's propagation then carries
into every `Domain` created afterwards. Seed `Common` once, and every
English `Domain` on that `Host` satisfies the rule automatically. (The count started at 300;
`asset_version 1.2.0` added seven words -- `done`, `doing`, `little`,
`fewest`, `least`, `owing to`, `n't` -- needed to seed 9.5's
relationship cache in full. `asset_version 1.3.0` added six more as
genuine homographs -- `this`/`that`/`these`/`those` also as `PRONOUN`,
`which`/`what` also as `DETERMINER` -- each sharing a lexical_form with
an existing entry under a different `part_of_speech` (4.1's "same
written form, multiple `Word` entries" case, exercised here for the
first time). `asset_version 1.4.0` and `1.5.0` added
`metalinguistic_nouns.json`/`_verbs.json`/`_adjectives.json`/`_adverbs.json`,
129 open-class entries across four parts of speech naming grammatical
and lexical-relationship concepts themselves -- `word`, `noun`, `verb`,
`subject`, `tense`, `synonym`, `lemma` (nouns); `identify`, `describe`,
`compare` (verbs); `grammatical`, `possessive`, `derived` (adjectives);
`grammatically`, `directly`, `typically` (adverbs) -- referenced
constantly, by name, throughout the mandatory files' own definitions
("Introduces a **noun**...", "third **person**"), the
`LexicalRelationshipType` enum's own documentation (6.2), and this
codebase's own documentation generally, but otherwise absent from the
seeded vocabulary entirely. This doesn't change the mandatory total,
since these are open-class content words rather than closed-class
function words -- `WordSeeder.SUPPLEMENTARY_FILES` marks them as
validated and always-seeded like the mandatory files, but excluded
from the mandatory total. Several are genuine homographs of an
already-seeded word (`be`/`have`/`do` as `VERB` alongside their
existing `AUXILIARY` sense; `cause`/`result` as `VERB` alongside their
existing `NOUN` sense; `past`/`opposite` as `ADJECTIVE` alongside their
existing `PREPOSITION` sense) -- see
`vocabulary/assets/common/en/README.md`'s Homographs with existing
entries and Version sections for all of the above.

`asset_version 1.6.0` folded punctuation into the mandatory cache
itself, ending `Punctuation`'s existence as a separate class: a
punctuation mark is now an ordinary `Word` with
`part_of_speech=PUNCTUATION`, seeded from the new mandatory
`punctuation.json` (`.`, `!`, `?`, `;`, `,` -- the same five symbols
`DictionaryProcessor` previously special-cased) exactly like any other
`MANDATORY_FILES` entry, taking the mandatory total 313 -> 318. See 4.1
and `vocabulary/assets/common/en/README.md`'s Version section for the
full rationale, and `linguistics/documentation/README.md` for the
consequences on the Linguistics side (`GraphProcessor`, `Clause.tokens`,
`ClauseSegmentationUtility`).

`asset_version 1.7.0` seeded four more previously-empty `PartOfSpeech`
categories: `symbols.json` (25 `SYMBOL` entries -- `$`, `%`, `@`, `+`,
`=`, ...) and `numerals.json` (33 `NUMERAL` entries, the base numeral
words `zero` through `trillion` all other numbers are compositionally
built from) joined `MANDATORY_FILES`, taking the mandatory total 318 ->
376; `metalinguistic_proper_nouns.json` (a single `PROPER_NOUN` entry,
`English`) joined `SUPPLEMENTARY_FILES`, seeded strictly from a word
already named in an existing definition (`y'all`'s, "...chiefly
Southern US English") rather than an attempt at a general proper-noun
vocabulary -- `INTERJECTION` and `OTHER` stayed unseeded, since nothing
in the cache references an example of either. `metalinguistic_verbs.json`
also grew by 13 mathematics and logic operator verbs -- `add`,
`subtract`, `multiply`, `divide`, `plus`, `minus`, `and`, `or`, `xor`,
`not`, `nand`, `nor`, `xnor` -- six of which (`plus`, `minus`, `and`,
`or`, `not`, `nor`) are homographs of their existing mandatory
`PREPOSITION`/`CONJUNCTION`/`PARTICLE` senses, safe by the same
`MANDATORY_FILES`-loads-before-`SUPPLEMENTARY_FILES` rule as
`be`/`have`/`do` above.

`asset_version 1.8.0` seeded `INTERJECTION`, the last populatable
`PartOfSpeech` category: `metalinguistic_interjections.json` (12
entries -- `yes`, `no`, `please`, `alas`, `hurrah`, `huzzah`, `oh`,
`ah`, `wow`, `hey`, `ouch`, `hmm`) joined `SUPPLEMENTARY_FILES`. Unlike
`PROPER_NOUN`'s strict scan, none of these are literally referenced in
an existing definition -- `INTERJECTION` came back empty under that
standard, so this list instead uses a looser "actually recognized
use" standard, seeded only after explicit sign-off on each entry:
`yes`/`no`/`please` are homographs of already-seeded words (`no` as
`DETERMINER`, `please` as `PARTICLE`) and double as the canonical
answers/requests; `alas`/`hurrah`/`huzzah` match the existing
`LITERARY`/`ARCHAIC` register precedent already established elsewhere
in the cache (`huzzah` also carries `editorial_labels: ["ARCHAIC"]`);
`oh`/`ah`/`wow`/`hey`/`ouch`/`hmm` are the prototypical core of the
category. `metalinguistic_nouns.json` also grew by three: `true`,
`false`, `null` (all `register_codes: ["TECHNICAL"]`) -- these are
`OTHER`-shaped at first glance ("doesn't fit `NOUN`/`VERB`/..."), but
each has an ordinary, definable lexical meaning (a truth value; the
absence of a value) and functions grammatically as a noun in the
sentences that use them ("the result is **true**"), so they were
seeded as `NOUN` rather than forced into `OTHER` on the same reasoning
that keeps `OTHER` itself empty: an articulable definition is evidence
a word belongs somewhere else, not in `OTHER`. `OTHER` is a pure
"doesn't fit any other category" residual with no defined membership
of its own, so unlike every other category in this cache it stays
deliberately unseeded rather than seeded to completion -- there is no
principled stopping point for "words that fit nowhere else" the way
there is for a finite symbol set or a closed grammatical class.)

`asset_version 1.9.0` filled in six more categories a user-supplied
gap review flagged as commonly missing from a working English
vocabulary, folding every one of them into an existing file and
`PartOfSpeech` member rather than inventing a new category: discourse
markers (`however`, `therefore`, `moreover`, `nevertheless` -- joined
`metalinguistic_adverbs.json` as `ADVERB`, `closed_class_kind:
"discourse_marker"`, 13 -> 17); full contractions (`don't`, `can't`,
`I'm`, `it's`, `isn't`, `wasn't`, `hadn't` -- joined the mandatory
`auxiliaries.json` as `AUXILIARY`, `closed_class_kind: "contraction"`,
29 -> 36, each linked to its component word(s) by new `CONTRACTION`
relationship edges -- see 9.5); phrasal-verb particles (`up`, `off`,
`out` -- joined the mandatory `particles.json` as `PARTICLE` homographs
of their existing `PREPOSITION` sense; `away`, which had no existing
sense, joined as a plain new `PARTICLE` entry; particles.json 12 ->
16); a multi-word preposition (`as well as` -- joined the mandatory
`prepositions.json` alongside `because of`/`in spite of`/`according
to`, 93 -> 94); and `well` as a second, `INTERJECTION` sense of the
already-seeded `PARTICLE` entry, joining `metalinguistic_interjections.json`
(12 -> 13). Two categories from that same review needed no work:
"clause markers" (`whether`, `whereas`, `although`, `unless`) were
already fully present in `subordinating_conjunctions.json`, and of the
proposed "multi-word grammatical units" only `as well as` was actually
new -- `because of`, `in spite of`, and `according to` were already
seeded. Mandatory total 376 -> 388 (+7 contractions, +4 particle
entries, +1 multi-word preposition); supplementary total 158 -> 163
(+4 discourse markers, +1 interjection). A freshly seeded `Dictionary`
now ends up with 388 + 163 = 551 `Word`s, still covering 15 of
`PartOfSpeech`'s 16 members -- only `OTHER` remains unseeded, by
design.

The cache itself -- its file format, exact counts, rebuild policy, and
open-class word promotion/demotion rules -- is documented in full at
`vocabulary/assets/common/en/README.md`, alongside the data
(`manifest.json` plus one JSON file per closed-class kind, plus the
six `metalinguistic_*.json` files and `promoted_words.json`). **The
cache is not the authoritative source of a `Word`** -- it is a
generated bootstrap asset; the authoritative record of every `Word`
remains the `Domain` that owns it.

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
| `validate_assets()` | Schema, duplicate `(lexical_form, part_of_speech)` pairs (not lexical_form alone -- a homograph like "that" as both `DETERMINER` and `PRONOUN` is legitimate, only a true repeat of the same form *and* the same part of speech is rejected), per-file and total counts, mandatory and supplementary file existence, manifest consistency, language codes, normalised forms. The mandatory total is manifest-driven, not a hardcoded constant -- whatever `MANDATORY_FILES`' counts sum to, cross-checked against `manifest.json`; `SUPPLEMENTARY_FILES` (the five `metalinguistic_*.json` files) are validated the same way but excluded from that total. Creates `promoted_words.json` (empty) or `manifest.json` (recomputed) if either is missing -- never the mandatory or supplementary content itself, which has to be authored. |
| `load_cache()` | Validates, then parses every mandatory file, every supplementary file, and `promoted_words.json` into `Word` instances, each with `is_common=True`. Cached after the first call. |
| `seed_closed_class_words(dictionary)` | Appends a fresh copy of every cached `Word` not already present into `dictionary` -- despite the name, this includes the supplementary open-class metalinguistic terms alongside the mandatory closed-class words, since `load_cache()` loads both together. Matched by text *and* `part_of_speech` together (not text alone, which would treat a homograph's second entry as already present and silently drop it). Idempotent. |
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

#### 9.5 The English Common Vocabulary Relationship Cache

Once a `Domain`'s 307 mandatory `Word`s exist (9.4), that `Domain`
also gets the intrinsic lexical relationships between them --
`be`/`have`/`do` conjugations, `this`/`that` plurals,
comparative/superlative forms, personal pronoun paradigms, and a small
set of universally-true prepositional synonym/antonym pairs (`above`
↔ `below`, `beneath` ↔ `under`, ...). **Relationship assets are
generated bootstrap assets. They are not the authoritative source of
lexical knowledge** -- the authoritative record of every
`LexicalRelationship` is the `Domain` it was created in.

Unlike `Word`s, relationships cannot be propagated by copying: a
`LexicalRelationship` references specific `Word` UUIDs, and every
`Domain` has its own distinct `Word` instances (`Dictionary.seed_from`,
9.3). So relationships are re-resolved and re-created fresh for every
`Domain`, immediately after that `Domain`'s `Word`s are seeded, by
looking each one up in that `Domain`'s own `Dictionary` -- Qualified
Word resolution (Domain + Lexical Form), never lexical form alone, is
what makes this correct.

The seeding order is fixed: `Word`s first (`WordSeeder`), then a
lookup index (in practice, the now-populated `Dictionary` itself),
then the relationship assets, then for each one resolve its source
`Word`, resolve its target `Word`, allocate the `LexicalRelationship`
(which allocates its tensor-backed `SystemPropertiesRef` row, Design
Principle 8, in the same call), and finally validate the resulting
graph.

The cache -- file format, exact relationship list, and seeding and
validation rules -- is documented in full at
`vocabulary/assets/common/en/relationships/README.md`, alongside the
data (`manifest.json` plus `morphological_relationships.json`,
`semantic_relationships.json`, `orthographic_relationships.json`).

`RelationshipSeeder` (`vocabulary/role/relationship_seeder.py`) is the
role that validates, loads, and seeds the cache:

| Method | Responsibility |
|--------|-----------------|
| `validate_assets()` | Schema, per-file and total relationship counts, relationship kind validity, mandatory file existence, manifest consistency, and manifest checksum verification. |
| `load_relationship_specs()` | Validates, then parses every category file into `(source_lexical_form, target_lexical_form, LexicalRelationshipType)` tuples. Cached after the first call. |
| `seed_domain(domain)` | Resolves every relationship against `domain`'s own `Dictionary` in a complete first pass -- raising if a source or target `Word` cannot be resolved, before creating anything, so a resolution failure partway through the cache never leaves a partially-seeded relationship graph -- then creates each one not already present (same source `Word`, kind, and target `Word` -- 12.3's duplicate definition). Every relationship it creates gets all four system properties (confidence, provenance, temporal, activation) set to `SEEDER_DEFAULT_WEIGHT` (`0.9999`) -- a seeded relationship is a curated linguistic fact ("be" → "am" is `FIRST_PERSON_FORM`), not an unweighted placeholder, so it doesn't get `LexicalRelationshipProcessor.create`'s `0.0` default. `0.9999` rather than a literal `1.0` follows the same convention the Knowledge Layer uses for directly authored facts (`knowledge/data/tensor_graph.py`): certainty is never asserted as exactly `1.0`. |

No `HYPERNYM`, `MERONYM`, or `TROPONYM` relationships are seeded for
closed-class `Word`s -- those describe how open-class concepts relate
to each other, not how a fixed set of grammatical function words does.

Total relationships: **138**. Every originally-seeded morphological and
semantic edge now has its reverse materialised as a second, real edge
(`her`'s two roles get two reverse edges under two different kinds; see
the relationship cache README's Symmetric and inverse edges section for
the full rule set) -- this is also why `Word.inflections()` (4.3) reads
`LEMMA_FORM` from the *incoming* direction rather than a separately-
seeded `INFLECTION` edge: every derived form now has an explicit
outgoing `LEMMA_FORM` edge back to its lemma, so the lemma's incoming
`LEMMA_FORM` edges already are its inflections, with no redundant
generic edge needed. (Earlier history: seven relationships --
`do`→`done`, `do`→`doing`, `few`→`fewest`, `little`→`less`,
`little`→`least`, `due to`→`owing to`, `not`→`n't` -- originally
referenced words outside the mandatory word set and were left unseeded
until 9.4's word cache `asset_version 1.2.0` added those seven words;
an eighth, `she`→`her` `PRONOUN_POSSESSIVE_DETERMINER_FORM`, was added
separately since only the object-form edge had been seeded for that
dual-role word. See the relationship cache README's Resolved Gaps and
Known Gaps sections for the full history, including
`PRONOUN_RECIPROCAL_FORM`, still unseeded in either direction.)

##### 9.5.1 Pronoun Form relationships

Personal pronoun paradigm forms (`I` → `me`/`my`/`mine`/`myself`, and
so on for `you`/`he`/`she`/`it`/`we`/`they`) are seeded using six new
`LexicalRelationshipType` members added specifically for this purpose
-- `PRONOUN_OBJECT_FORM`, `PRONOUN_SUBJECT_FORM`,
`PRONOUN_POSSESSIVE_DETERMINER_FORM`, `PRONOUN_POSSESSIVE_FORM`,
`PRONOUN_REFLEXIVE_FORM`, `PRONOUN_RECIPROCAL_FORM` -- rather than the
existing `DERIVED_FORM`: a pronoun's object, possessive, or reflexive
form isn't a derivational relationship (it doesn't change grammatical
category or add a prefix/suffix), it's the same pronoun in a different
paradigm slot. See 6.2.1's new Pronoun Form (category 7) subsection
for the full member list, values, and examples -- this is also the
last available category in the Morphological group (0-7 all now used).

Where a single word form serves two roles that this seed data only
gives one arrow to (`his`, `her`, `its` are each both a possessive
determiner and, informally, an independent possessive pronoun), the
seed data picks one relationship kind rather than creating both edges
-- `he → his` and `it → its` are seeded as
`PRONOUN_POSSESSIVE_DETERMINER_FORM` (their primary, `PartOfSpeech.DETERMINER`
classification in the word cache), `she → her` as `PRONOUN_OBJECT_FORM`
(paralleling `he → him`, with the possessive role covered separately
by `she → hers`). Creating both edges for a dual-role word is not a
duplicate under the source+kind+target rule and could be added later
without conflicting with what's here.

`PRONOUN_RECIPROCAL_FORM` is defined but not yet seeded by any
relationship in this cache -- no personal pronoun in the seed data
maps directly to `each other` / `one another` the way it maps to its
object, possessive, or reflexive forms.
