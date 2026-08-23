# Architecture Coding Guideline — Data Entity Interface — Documentation And Code Comments

## 1. Purpose

This guideline defines the documentation and code-comment convention for Data Entity Interfaces.

A Data Entity Interface represents a persistent or identifiable domain object. Its documentation should describe:

- what the entity represents;
- what each property means;
- how the entity is identified;
- how it relates to other entities;
- what constraints apply to its data.

Entity documentation should describe the meaning and structure of the data, not the internal behaviour of repositories, indexes, services, or processors that operate on the entity.

**Implementation note:** in this codebase a Data Entity is a plain TypeScript `interface` (`export interface Word { ... }`), not a `class`. It declares data only — no constructor, no methods, no getters. Construction and behaviour live in standalone exported functions in a companion file (typically `role/processor/<entity>_processor.ts`, or `role/word_processor.ts` for `Word` itself), never inside the interface declaration. See sections 15–17 below.

---

## 2. General Principle

Documentation should answer:

> *"What does this entity and each of its properties mean?"*

It should not normally answer:

> *"How is this entity processed elsewhere in the system?"*

For example:

```typescript
/** Identifiers of the WordForms belonging to this Word. */
formIds: readonly Identifier[];
```

is preferred over:

```typescript
/** IDs populated by WordForms.registerMember() and indexed by formsByWordId. */
formIds: readonly Identifier[];
```

The first describes the entity.

The second describes an external implementation mechanism.

---

## 3. Entity Interface Element Order

An entity's own interface declaration (`data/entities/<entity>.ts`) should use the following element order.

| Order | Section | Purpose | Lives in |
|---|---|---|---|
| 1 | Interface Documentation | Defines what the entity represents | the interface's own file |
| 2 | Identity | Properties that identify the entity | the interface's own file |
| 3 | Classification | Properties that classify or type the entity | the interface's own file |
| 4 | Data Attributes | Values intrinsic to the entity | the interface's own file |
| 5 | References | References to related entities | the interface's own file |
| 6 | System Metadata | Technical or lifecycle metadata | the interface's own file |
| 7 | Construction | Establishes the entity's initial valid state | the companion processor file |
| 8 | Derived State | Computed values derived from entity data | the companion processor file |

Sections with no properties should be omitted.

Sections 7 and 8 are never declared inside the interface itself (an interface cannot hold a constructor, a method body, or a getter) — they are standalone exported functions in the entity's companion processor file. They are listed here because the same ordering and documentation conventions apply to them; see sections 15–17.

---

## 4. Interface Documentation

Every Data Entity Interface should have an interface-level documentation comment.

The first sentence should state what the entity represents.

Preferred pattern:

```typescript
/**
 * Represents <domain concept>.
 */
export interface Word {
}
```

Example:

```typescript
/**
 * Represents a lexical Word within the vocabulary.
 */
export interface Word {
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
export interface Word {
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

They should appear first in the interface.

```typescript
// ── Identity ─────────────────────────────────────────────

/** Unique identifier of this Word. */
uuid: Identifier;
```

If identity is composite, document the semantic role of each component.

```typescript
/** Domain in which this Word is defined. */
domainId: Identifier;

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
formIds: readonly Identifier[];

/** Identifiers of the Senses associated with this Word. */
senseIds: readonly Identifier[];
```

Avoid documenting how those references are populated.

Weak:

```typescript
/** IDs added by registerMember(). */
formIds: readonly Identifier[];
```

Preferred:

```typescript
/** Identifiers of the WordForms belonging to this Word. */
formIds: readonly Identifier[];
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
wordId: Identifier;
```

means:

> *"The identifier of the referenced Word."*

Collections follow the same convention:

```typescript
wordIds: readonly Identifier[];
```

Preferred naming:

| Meaning | Convention |
|---|---|
| Single entity | `word` |
| Multiple entities | `words` |
| Single entity identifier | `wordId` |
| Multiple entity identifiers | `wordIds` |

A Data Entity Interface in this codebase almost always stores the identifier form (`wordId`/`wordIds`), not the object form (`word`/`words`) — entities reference each other by `Identifier` and are resolved through a store (`Dictionary`, `Senses`, `WordForms`, ...), never embedded by value. Document the reference as what it points to, not as "an identifier" in the abstract — see section 8.

---

## 10. Ownership And Membership

Where a reference expresses ownership or membership, document the semantic direction explicitly.

```typescript
/** Identifiers of the WordForms belonging to this Word. */
formIds: readonly Identifier[];
```

For the opposite direction:

```typescript
/** Identifier of the Word to which this WordForm belongs. */
wordId: Identifier;
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
sourceSenseId?: Identifier;
```

Avoid:

```typescript
/** Optional Sense ID. */
sourceSenseId?: Identifier;
```

The TypeScript syntax already communicates optionality. The documentation should communicate its meaning.

---

## 12. Collections

Collection documentation should describe what the collection members represent.

```typescript
/** Identifiers of the Senses associated with this Word. */
senseIds: readonly Identifier[];
```

Where an empty collection has semantic meaning, document it.

```typescript
/**
 * Identifiers of the Senses associated with this Word.
 *
 * An empty collection indicates that no Senses are currently associated.
 */
senseIds: readonly Identifier[];
```

Do not document ordinary array mechanics.

Prefer `readonly X[]` over `X[]` for a collection property — the entity itself never mutates its own collection in place; a companion function that adds a member returns/assigns a new array (see section 16).

---

## 13. Enumerated Values

Enum-backed properties should document the semantic meaning of the selected value.

```typescript
/** Grammatical part of speech under which this Word is defined. */
partOfSpeech: PartOfSpeech;
```

The Data Entity Interface should not duplicate the complete definition of the enum.

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

## 15. Construction

A Data Entity Interface has no constructor — TypeScript interfaces cannot declare one. Construction is a standalone exported factory function, conventionally named `create<Entity>()`, living in the entity's companion processor file (`role/processor/<entity>_processor.ts`, or `role/word_processor.ts` for `Word` itself), not inside `data/entities/<entity>.ts`.

The factory function establishes the minimum valid initial state of the entity: required fields come from its `init` parameter, every other field gets an explicit default.

Factory function documentation should describe construction semantics rather than implementation details.

```typescript
// data/entities/word.ts

/**
 * Represents a lexical Word within the vocabulary.
 */
export interface Word {
  uuid: Identifier;
  text: Text;
  partOfSpeech: PartOfSpeech;
  formIds: readonly Identifier[];
  senseIds: readonly Identifier[];
}
```

```typescript
// role/word_processor.ts

export type WordInit = Pick<Word, "text" | "partOfSpeech"> & Partial<Omit<Word, "text" | "partOfSpeech">>;

/**
 * Creates a Word with its required lexical text and grammatical
 * classification, generating a fresh identity when none is supplied.
 */
export function createWord(init: WordInit): Word {
  return {
    uuid: init.uuid ?? { value: newUuid() },
    formIds: [],
    senseIds: [],
    ...init,
  };
}
```

Extensive parameter documentation is unnecessary where parameter meaning is already clear from the entity's own properties and types.

---

## 16. Behaviour And Data Entity Interfaces

A Data Entity Interface declares no behaviour of its own — no method signatures, no getters. It is data only. Every operation that reads or changes entity data, however small, is a standalone exported function taking the entity as a parameter, living in the entity's companion processor file (the same file as its `create<Entity>()` factory).

This applies even to behaviour that would be "intrinsic to the entity" in a class-based design, such as:

- simple state-derived queries (section 17);
- invariant-preserving entity changes;
- value comparisons;
- domain-valid convenience operations.

Behaviour involving several entities, lookup indexes, persistence mechanisms, repositories, or registries belongs even further out — in a registry, collection, repository, or domain service, never in an entity's own processor file.

For example:

```typescript
registerMember(form: WordForm, word: Word): void
```

coordinates:

- a `Word`;
- a `WordForm`;
- relationship registration;
- lookup indexes.

That behaviour belongs to a registry, collection, repository, or domain service (in this codebase, the `WordForms` store, `data/word_forms.ts`) — not to either entity's own processor file, and certainly not to the entity interface itself.

---

## 17. Derived State

A Data Entity Interface has no getters — derived values are standalone exported functions, living alongside the entity's `create<Entity>()` factory in its companion processor file, taking the entity as their first parameter.

Function documentation should describe the semantic value the function represents, rather than merely explaining the implementation expression.

Preferred:

```typescript
/** Indicates whether `word` has at least one associated Sense. */
export function hasSenses(word: Word): boolean {
  return word.senseIds.length > 0;
}
```

Avoid:

```typescript
/** Returns whether word.senseIds.length is greater than zero. */
```

---

## 18. Entity Invariants

Entity-wide invariants should be documented at interface level where they form part of the entity contract.

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
export interface Word {
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
uuid: Identifier;
```

Exception documentation is primarily appropriate for a `create<Entity>()` factory function or a companion-file function with validation behaviour — never for a plain property on the interface itself.

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
formIds: readonly Identifier[];

// Always [] at construction -- WordForms.registerMember() appends to it later.
```

Implementation comments should be used only where the implementation is not sufficiently clear from the code itself.

---

## 21. Section Comments

Larger Data Entity Interfaces should use consistent structural comments, within the interface's own file:

```typescript
// ── Identity ─────────────────────────────────────────────

// ── Classification ───────────────────────────────────────

// ── Data Attributes ──────────────────────────────────────

// ── References ───────────────────────────────────────────

// ── System Metadata ──────────────────────────────────────
```

and, matching the same section names, within the entity's companion processor file:

```typescript
// ── Construction ─────────────────────────────────────────

// ── Derived State ────────────────────────────────────────
```

Small entity interfaces, and small processor files, may omit section comments where they would add unnecessary visual noise.

---

## 22. Documentation Style Rules

Data Entity Interface documentation shall follow these rules:

1. Describe semantic meaning, not implementation mechanics.
2. Use domain terminology consistently.
3. Use "Represents…" for the primary interface definition.
4. Use "Unique identifier of…" for entity identity.
5. Use "Identifier of…" or "Identifiers of…" for entity references.
6. State relationship direction explicitly.
7. Document the semantic meaning of "undefined" or "null" where relevant.
8. Document meaningful constraints and invariants.
9. Do not repeat information already obvious from the TypeScript type.
10. Do not describe repository, indexing, caching, lookup, registration, or persistence implementation unless it forms part of the entity contract.
11. Keep documentation stable when implementation mechanisms change.
12. Prefer domain language over framework or programming terminology.
13. Never declare a constructor, method, or getter directly on the interface — construction and derived state are standalone functions in the entity's companion processor file (sections 15–17).

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
| Factory function | "Creates a ..." |
| Derived value | "Indicates ..." or "Returns ..." |

---

## 24. Complete Example

The entity's own interface declaration:

```typescript
// data/entities/word.ts

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
export interface Word {

  // ── Identity ───────────────────────────────────────────

  /** Unique identifier of this Word. */
  uuid: Identifier;


  // ── Classification ─────────────────────────────────────

  /** Grammatical part of speech under which this Word is defined. */
  partOfSpeech: PartOfSpeech;


  // ── Data Attributes ────────────────────────────────────

  /** Canonical lexical text represented by this Word. */
  text: Text;


  // ── References ─────────────────────────────────────────

  /** Identifiers of the WordForms belonging to this Word. */
  formIds: readonly Identifier[];

  /** Identifiers of the Senses associated with this Word. */
  senseIds: readonly Identifier[];


  // ── System Metadata ────────────────────────────────────

  /** System-managed properties associated with this Word. */
  systemProperties: SystemProperties;
}
```

Its companion processor file:

```typescript
// role/word_processor.ts

export type WordInit = Pick<Word, "text" | "partOfSpeech"> & Partial<Omit<Word, "text" | "partOfSpeech">>;

// ── Construction ───────────────────────────────────────

/**
 * Creates a Word with its required lexical text and grammatical
 * classification, generating a fresh identity and empty reference
 * collections when none are supplied.
 */
export function createWord(init: WordInit): Word {
  return {
    uuid: init.uuid ?? { value: newUuid() },
    formIds: [],
    senseIds: [],
    systemProperties: init.systemProperties ?? createSystemProperties(),
    ...init,
  };
}


// ── Derived State ──────────────────────────────────────

/** Indicates whether `word` has at least one associated Sense. */
export function hasSenses(word: Word): boolean {
  return word.senseIds.length > 0;
}
```

---

## 25. Governing Rule

> *"A Data Entity Interface documents what the data is, what it means, and how its elements relate. Other architectural components document what the system does with that data."*

The purpose of this separation is to preserve the Data Entity Interface as a clear representation of the domain model while allowing repositories, registries, services, indexes, and processing mechanisms — including the entity's own construction and derived-state functions — to evolve independently, in their own companion files.
