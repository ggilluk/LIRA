# Architecture Coding Guideline — Data Entity Class — Documentation And Code Comments

## 1. Purpose

This guideline defines the documentation and code-comment convention for Data Entity Classes.

A Data Entity Class represents a persistent or identifiable domain object. Its documentation should describe:

- what the entity represents;
- what each property means;
- how the entity is identified;
- how it relates to other entities;
- what constraints apply to its data.

Entity documentation should describe the meaning and structure of the data, not the internal behaviour of repositories, indexes, services, or processors that operate on the entity.

---

## 2. General Principle

Documentation should answer:

> *"What does this entity and each of its properties mean?"*

It should not normally answer:

> *"How is this entity processed elsewhere in the system?"*

For example:

```typescript
/** Identifiers of the WordForms belonging to this Word. */
formIds: UUID[];
```

is preferred over:

```typescript
/** IDs populated by WordForms.registerMember() and indexed by formsByWordId. */
formIds: UUID[];
```

The first describes the entity.

The second describes an external implementation mechanism.

---

## 3. Entity Class Element Order

Entity classes should use the following element order.

| Order | Section | Purpose |
|---|---|---|
| 1 | Class Documentation | Defines what the entity represents |
| 2 | Identity | Properties that identify the entity |
| 3 | Classification | Properties that classify or type the entity |
| 4 | Data Attributes | Values intrinsic to the entity |
| 5 | References | References to related entities |
| 6 | System Metadata | Technical or lifecycle metadata |
| 7 | Constructor | Establishes the entity's initial valid state |
| 8 | Derived State | Computed values derived from entity data |

Sections with no properties should be omitted.

---

## 4. Class Documentation

Every Data Entity Class should have a class-level documentation comment.

The first sentence should state what the entity represents.

Preferred pattern:

```typescript
/**
 * Represents <domain concept>.
 */
export class Word {
}
```

Example:

```typescript
/**
 * Represents a lexical Word within the vocabulary.
 */
export class Word {
}
```

Where additional clarification is required:

```typescript
/**
 * Represents a lexical Word within the vocabulary.
 *
 * A Word identifies a lexical entry and references the WordForms
 * and Senses associated with that entry.
 */
export class Word {
}
```

Avoid implementation-oriented descriptions such as:

```typescript
/**
 * Stores Word data used by WordService and WordRepository.
 */
```

---

## 5. Identity Properties

Identity properties establish the unique identity of the entity.

They should appear first in the class.

```typescript
// ── Identity ─────────────────────────────────────────────

/** Unique identifier of this Word. */
uuid: UUID;
```

If identity is composite, document the semantic role of each component.

```typescript
/** Domain in which this Word is defined. */
domainId: UUID;

/** Lexical value identifying the Word within the Domain. */
lemma: Text;
```

Do not describe database keys unless database semantics genuinely form part of the architecture contract.

---

## 6. Classification Properties

Classification properties identify what kind of entity the instance represents.

Examples include:

- type;
- category;
- part of speech;
- subtype;
- class.

Example:

```typescript
// ── Classification ───────────────────────────────────────

/** Grammatical part of speech under which this Word is defined. */
partOfSpeech: PartOfSpeech;
```

Avoid documentation that simply repeats the property name.

Weak:

```typescript
/** The part of speech. */
partOfSpeech: PartOfSpeech;
```

Preferred:

```typescript
/** Grammatical part of speech under which this Word is defined. */
partOfSpeech: PartOfSpeech;
```

---

## 7. Data Attributes

Data Attributes contain values intrinsic to the entity.

Example:

```typescript
// ── Data Attributes ──────────────────────────────────────

/** Canonical lexical text represented by this Word. */
text: Text;
```

Where a value has constrained semantics, document those constraints.

```typescript
/**
 * Canonical lexical text represented by this Word.
 *
 * The value represents the base lexical form rather than an
 * inflected WordForm.
 */
text: Text;
```

Documentation should describe semantic meaning rather than restating the TypeScript type.

Weak:

```typescript
/** String containing the text. */
text: Text;
```

Preferred:

```typescript
/** Canonical lexical text represented by this Word. */
text: Text;
```

---

## 8. Reference Properties

References identify relationships between entities.

Reference documentation should state:

1. what entity is referenced;
2. what the relationship means;
3. the direction of the relationship where relevant.

Example:

```typescript
// ── References ───────────────────────────────────────────

/** Identifiers of the WordForms belonging to this Word. */
formIds: UUID[];

/** Identifiers of the Senses associated with this Word. */
senseIds: UUID[];
```

Avoid documenting how those references are populated.

Weak:

```typescript
/** IDs added by registerMember(). */
formIds: UUID[];
```

Preferred:

```typescript
/** Identifiers of the WordForms belonging to this Word. */
formIds: UUID[];
```

---

## 9. Reference Naming Convention

Reference properties should distinguish between references to objects and references to identifiers.

```typescript
word: Word;
```

means:

> *"The referenced Word entity."*

Whereas:

```typescript
wordId: UUID;
```

means:

> *"The identifier of the referenced Word."*

Collections follow the same convention:

```typescript
wordIds: UUID[];
```

Preferred naming:

| Meaning | Convention |
|---|---|
| Single entity | `word` |
| Multiple entities | `words` |
| Single entity identifier | `wordId` |
| Multiple entity identifiers | `wordIds` |

---

## 10. Ownership And Membership

Where a reference expresses ownership or membership, document the semantic direction explicitly.

```typescript
/** Identifiers of the WordForms belonging to this Word. */
formIds: UUID[];
```

For the opposite direction:

```typescript
/** Identifier of the Word to which this WordForm belongs. */
wordId: UUID;
```

Relationship direction should be understandable without examining repository or service code.

---

## 11. Optional Properties

Optional properties should document what absence means where this is semantically significant.

```typescript
/**
 * Identifier of the originating Sense.
 *
 * Undefined when this entity was not derived from a Sense.
 */
sourceSenseId?: UUID;
```

Avoid:

```typescript
/** Optional Sense ID. */
sourceSenseId?: UUID;
```

The TypeScript syntax already communicates optionality. The documentation should communicate its meaning.

---

## 12. Collections

Collection documentation should describe what the collection members represent.

```typescript
/** Identifiers of the Senses associated with this Word. */
senseIds: UUID[];
```

Where an empty collection has semantic meaning, document it.

```typescript
/**
 * Identifiers of the Senses associated with this Word.
 *
 * An empty collection indicates that no Senses are currently associated.
 */
senseIds: UUID[];
```

Do not document ordinary array mechanics.

---

## 13. Enumerated Values

Enum-backed properties should document the semantic meaning of the selected value.

```typescript
/** Grammatical part of speech under which this Word is defined. */
partOfSpeech: PartOfSpeech;
```

The Data Entity Class should not duplicate the complete definition of the enum.

The enum itself should document its allowed values.

---

## 14. System Metadata

System Metadata contains information concerning the entity's lifecycle, provenance, version, persistence, or system state rather than its primary domain meaning.

Example:

```typescript
// ── System Metadata ──────────────────────────────────────

/** System-managed properties associated with this Word. */
systemProperties: SystemProperties;
```

Examples can include:

- version;
- provenance;
- creation timestamp;
- modification timestamp;
- confidence;
- activation state;
- persistence metadata.

Where such a property carries primary domain meaning rather than system meaning, it should instead be classified as a Data Attribute.

---

## 15. Constructors

The constructor establishes the minimum valid initial state of the entity.

Constructor documentation should describe construction semantics rather than implementation details.

```typescript
/**
 * Creates a Word with its required identity, lexical text,
 * and grammatical classification.
 */
constructor(
  uuid: UUID,
  text: Text,
  partOfSpeech: PartOfSpeech,
) {
  this.uuid = uuid;
  this.text = text;
  this.partOfSpeech = partOfSpeech;
  this.formIds = [];
  this.senseIds = [];
}
```

Extensive parameter documentation is unnecessary where parameter meaning is already clear from the entity properties and types.

---

## 16. Methods In Data Entity Classes

Data Entity Classes should contain as little behavioural logic as practical.

Methods may be appropriate when they represent behaviour intrinsic to the entity, such as:

- simple state-derived queries;
- invariant-preserving entity changes;
- value comparisons;
- domain-valid convenience operations.

Behaviour involving several entities, lookup indexes, persistence mechanisms, repositories, or registries should generally remain outside the Data Entity Class.

For example:

```typescript
registerMember(form: WordForm, word: Word): void
```

coordinates:

- a `Word`;
- a `WordForm`;
- relationship registration;
- lookup indexes.

That behaviour belongs more naturally to a registry, collection, repository, or domain service rather than either entity.

---

## 17. Derived State

Computed properties should document the semantic value they represent rather than merely explaining the implementation expression.

Preferred:

```typescript
/** Indicates whether this Word has at least one associated Sense. */
get hasSenses(): boolean {
  return this.senseIds.length > 0;
}
```

Avoid:

```typescript
/** Returns whether senseIds.length is greater than zero. */
```

---

## 18. Entity Invariants

Entity-wide invariants should be documented at class level where they form part of the entity contract.

```typescript
/**
 * Represents a lexical Word within the vocabulary.
 *
 * Invariants:
 * - `uuid` uniquely identifies the Word.
 * - Each `formIds` entry identifies a WordForm belonging to this Word.
 * - Each `senseIds` entry identifies a Sense associated with this Word.
 * - Duplicate reference identifiers are not permitted.
 */
export class Word {
}
```

Property-specific constraints should remain with the relevant property where practical.

---

## 19. Exceptions

Exception documentation should only be included where an operation can reject an invalid state or input.

Plain data properties should not contain unnecessary exception sections.

Avoid:

```typescript
/**
 * Unique identifier of this Word.
 *
 * Exceptions:
 * - None.
 */
uuid: UUID;
```

Exception documentation is primarily appropriate for constructors or entity methods with validation behaviour.

---

## 20. Documentation Comments Versus Code Comments

Use:

```typescript
/** ... */
```

for documentation describing the architecture or semantic contract of an entity or element.

Use:

```typescript
// ...
```

for implementation-specific code comments.

Example:

```typescript
/** Identifiers of the WordForms belonging to this Word. */
formIds: UUID[];

// Initialise separately to preserve constructor ordering.
```

Implementation comments should be used only where the implementation is not sufficiently clear from the code itself.

---

## 21. Section Comments

Larger Data Entity Classes should use consistent structural comments.

```typescript
// ── Identity ─────────────────────────────────────────────

// ── Classification ───────────────────────────────────────

// ── Data Attributes ──────────────────────────────────────

// ── References ───────────────────────────────────────────

// ── System Metadata ──────────────────────────────────────

// ── Construction ─────────────────────────────────────────

// ── Derived State ────────────────────────────────────────
```

Small entity classes may omit section comments where they would add unnecessary visual noise.

---

## 22. Documentation Style Rules

Data Entity Class documentation shall follow these rules:

1. Describe semantic meaning, not implementation mechanics.
2. Use domain terminology consistently.
3. Use "Represents…" for the primary entity-class definition.
4. Use "Unique identifier of…" for entity identity.
5. Use "Identifier of…" or "Identifiers of…" for entity references.
6. State relationship direction explicitly.
7. Document the semantic meaning of "undefined" or "null" where relevant.
8. Document meaningful constraints and invariants.
9. Do not repeat information already obvious from the TypeScript type.
10. Do not describe repository, indexing, caching, lookup, registration, or persistence implementation unless it forms part of the entity contract.
11. Keep documentation stable when implementation mechanisms change.
12. Prefer domain language over framework or programming terminology.

---

## 23. Preferred Documentation Wording

| Element | Preferred wording |
|---|---|
| Entity | "Represents ..." |
| Identity | "Unique identifier of ..." |
| Reference ID | "Identifier of the ..." |
| Reference IDs | "Identifiers of the ..." |
| Membership | "... belonging to this ..." |
| Association | "... associated with this ..." |
| Attribute | "... represented by this ..." |
| Classification | "... under which this ... is defined" |
| Boolean | "Indicates whether ..." |
| Optional value | "Undefined when ..." |
| Constructor | "Creates a ..." |
| Derived value | "Indicates ..." or "Returns ..." |

---

## 24. Complete Example

```typescript
/**
 * Represents a lexical Word within the vocabulary.
 *
 * A Word identifies a lexical entry under a particular grammatical
 * classification and references its associated WordForms and Senses.
 *
 * Invariants:
 * - `uuid` uniquely identifies the Word.
 * - Each `formIds` entry identifies a WordForm belonging to this Word.
 * - Each `senseIds` entry identifies a Sense associated with this Word.
 * - Duplicate reference identifiers are not permitted.
 */
export class Word {

  // ── Identity ───────────────────────────────────────────

  /** Unique identifier of this Word. */
  uuid: UUID;


  // ── Classification ─────────────────────────────────────

  /** Grammatical part of speech under which this Word is defined. */
  partOfSpeech: PartOfSpeech;


  // ── Data Attributes ────────────────────────────────────

  /** Canonical lexical text represented by this Word. */
  text: Text;


  // ── References ─────────────────────────────────────────

  /** Identifiers of the WordForms belonging to this Word. */
  formIds: UUID[];

  /** Identifiers of the Senses associated with this Word. */
  senseIds: UUID[];


  // ── System Metadata ────────────────────────────────────

  /** System-managed properties associated with this Word. */
  systemProperties: SystemProperties;


  // ── Construction ───────────────────────────────────────

  /**
   * Creates a Word with its required identity, lexical text,
   * and grammatical classification.
   */
  constructor(
    uuid: UUID,
    text: Text,
    partOfSpeech: PartOfSpeech,
    systemProperties: SystemProperties,
  ) {
    this.uuid = uuid;
    this.text = text;
    this.partOfSpeech = partOfSpeech;
    this.systemProperties = systemProperties;

    this.formIds = [];
    this.senseIds = [];
  }


  // ── Derived State ──────────────────────────────────────

  /** Indicates whether this Word has at least one associated Sense. */
  get hasSenses(): boolean {
    return this.senseIds.length > 0;
  }
}
```

---

## 25. Governing Rule

> *"A Data Entity Class documents what the data is, what it means, and how its elements relate. Other architectural components document what the system does with that data."*

The purpose of this separation is to preserve the Data Entity Class as a clear representation of the domain model while allowing repositories, registries, services, indexes, and processing mechanisms to evolve independently.
