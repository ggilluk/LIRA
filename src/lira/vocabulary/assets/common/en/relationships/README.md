# English Common Vocabulary Relationship Cache (v1)

## Purpose

This cache provides the intrinsic lexical relationships between the
mandatory English closed-class Words (`../determiners.json`,
`../pronouns.json`, etc.) -- verb conjugations, pronoun paradigms,
comparative/superlative forms, and a small set of universally-true
prepositional synonym/antonym pairs. Relationships are seeded after
the Words themselves, never before (a relationship can't resolve a
Word that doesn't exist yet).

**Relationship assets are generated bootstrap assets. They are not the
authoritative source of lexical knowledge.** The authoritative record
of every `LexicalRelationship` is the `Domain` it was created in --
these files are a portable template `RelationshipSeeder` replays
against a specific Domain's already-seeded `Word`s, not a store of
`LexicalRelationship` objects themselves.

## Relationship categories

| File | Category | Kinds seeded | Count |
|------|----------|----------------|-------|
| `morphological_relationships.json` | Morphological (6.2.1) | Person, tense, participle, and plural forms (`be`/`have`/`do` conjugations, `this`/`that` plurals); comparative/superlative forms (`few`/`many`/`much`/`little`); pronoun paradigm forms (`PRONOUN_OBJECT_FORM`, `PRONOUN_SUBJECT_FORM`, `PRONOUN_POSSESSIVE_DETERMINER_FORM`, `PRONOUN_POSSESSIVE_FORM`, `PRONOUN_REFLEXIVE_FORM`) | 48 |
| `semantic_relationships.json` | Lexical Semantic (6.2.2) | `ANTONYM` (spatial/temporal opposites: above/below, before/after, ...) and `SYNONYM` (equivalent prepositions: beneath/under, amid/among, due to/owing to, ...) only | 11 |
| `orthographic_relationships.json` | Orthographic and Naming (6.2.3) | `CONTRACTION` (not/n't) | 1 |

No `HYPERNYM`, `MERONYM`, or `TROPONYM` relationships are seeded for
closed-class Words -- those hierarchy/part-whole/manner relationships
describe how open-class concepts relate to each other, and don't apply
to a fixed set of grammatical function words the way conjugation,
pronoun paradigms, and near-synonymy do.

Total relationships: **60**.

## Seeding order

Relationships are always seeded in this order, enforced by
`RelationshipSeeder.seed_domain`:

1. The Domain's Words are already seeded (`WordSeeder`, precondition --
   `RelationshipSeeder` never creates a Word).
2. Build a lookup index -- in practice, `domain.vocabulary.dictionary`
   itself, which already indexes every seeded Word by lexical form.
3. Load the relationship assets (this directory).
4. Resolve the source Word by lexical form, within this Domain's
   Dictionary.
5. Resolve the target Word the same way.
6. Allocate the `LexicalRelationship` (`domain.vocabulary.lexical_relationship_processor.create`),
   passing `confidence`/`provenance`/`temporal`/`activation` all as
   `RelationshipSeeder.SEEDER_DEFAULT_WEIGHT` (`0.9999`) -- these are
   curated facts from this cache, not unweighted placeholders, so they
   don't get `LexicalRelationshipProcessor.create`'s `0.0` default.
7. That allocation call also allocates the relationship's
   tensor-backed `SystemPropertiesRef` row (Design Principle 8).
8. Validate the resulting graph (duplicate edges, unresolved
   references) after the batch completes.

## Qualified Word resolution

Every relationship shall reference a Word by its **Qualified Word**
identity -- Domain + Lexical Form -- never lexical form alone. These
JSON files are domain-agnostic templates (the same file seeds every
Domain's relationships), so they can only specify lexical forms; the
Domain half of the qualification comes from *which Dictionary
`RelationshipSeeder` resolves against* -- `domain.vocabulary.dictionary.lookup(lexical_form)`
is called against one specific Domain's Dictionary, so the (Domain,
lexical form) pair is what actually gets resolved, even though a
single JSON entry is replayed across many Domains, once per Domain,
each time resolving to that Domain's own distinct `Word` instances and
UUIDs.

This is also why relationships can't simply be copied from `Common`'s
Dictionary the way Words are (`Dictionary.seed_from`): a
`LexicalRelationship` references specific `Word` UUIDs, and every
Domain has its own distinct `Word` instances (Design: `Dictionary.seed_from`
shallow-copies each Word, giving it a new identity). Relationships
must be re-resolved and re-created fresh for every Domain.

## Relationship identity and duplicate prevention

Every `LexicalRelationship` references a source Word UUID, a
relationship kind, and a target Word UUID. `RelationshipSeeder` treats
two relationships as duplicates only when all three match exactly (the
same rule as documented in the Vocabulary Layer developer
specification, 12.3) -- the same source and target Word under two
*different* kinds (e.g. `his` as both `PRONOUN_POSSESSIVE_DETERMINER_FORM`
and, in a future revision, `PRONOUN_POSSESSIVE_FORM`) is not a
duplicate.

## Validation

`RelationshipSeeder.validate_assets()` checks:

- JSON schema (required keys present on every file and manifest)
- `count` matches the actual number of `relationships` entries
- Every `relationship_kind` names a real `LexicalRelationshipType`
  member
- `manifest.json`'s `relationship_count` matches the computed total
  across all three files
- Mandatory file existence (all three category files plus the
  manifest)

`RelationshipSeeder.seed_domain()` raises `ValueError` -- it does not
skip -- if either the source or target Word of a relationship cannot
be resolved in that Domain's Dictionary. This is treated as a cache/
asset inconsistency (a relationship referencing a lexical form the
mandatory word cache doesn't contain), not something to seed around
silently; see Resolved gaps below for the one case this actually
happened.

## Resolved gaps

Seven relationships described in the original developer instructions
for this cache referenced target words that weren't in the mandatory
300-word word cache at `asset_version 1.1.0` (`done`, `doing`,
`little`, `fewest`, `least`, `owing to`, `n't`), so they were left out
of these files entirely rather than seeded as dangling references:

| Source → Target | Kind |
|-------------------|------|
| do → done | `PAST_PARTICIPLE_FORM` |
| do → doing | `PRESENT_PARTICIPLE_FORM` |
| few → fewest | `SUPERLATIVE_FORM` |
| little → less | `COMPARATIVE_FORM` |
| little → least | `SUPERLATIVE_FORM` |
| due to → owing to | `SYNONYM` |
| not → n't | `CONTRACTION` |

The word cache's `asset_version 1.2.0` added those seven words
(`../README.md`, 300 -> 307), and this cache's `asset_version 1.1.0`
adds these seven relationships -- all now present in
`morphological_relationships.json`, `semantic_relationships.json`, and
`orthographic_relationships.json` above.

## Version

`v1` / `schema_version 1.0.0` / `asset_version 1.1.0` (53 -> 60
relationships, resolving the seven gaps above; `asset_version 1.0.0`'s
53 relationships are unchanged).

## Future languages

This directory is `assets/common/en/relationships/`. Additional
languages follow the same `assets/common/<language_code>/relationships/`
structure and file format; `RelationshipSeeder` is not
language-specific -- like `WordSeeder`, it loads whichever
`assets/common/<language_code>/relationships/` directory matches the
Domain's language code, without any change to the seeder itself.
