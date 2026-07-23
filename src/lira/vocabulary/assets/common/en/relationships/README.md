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
| `morphological_relationships.json` | Morphological (6.2.1) | Person, tense, participle, and plural forms (`be`/`have`/`do` conjugations, `this`/`that` plurals); comparative/superlative forms (`few`/`many`/`much`/`little`); pronoun paradigm forms (`PRONOUN_OBJECT_FORM`, `PRONOUN_SUBJECT_FORM`, `PRONOUN_POSSESSIVE_DETERMINER_FORM`, `PRONOUN_POSSESSIVE_FORM`, `PRONOUN_REFLEXIVE_FORM`); `LEMMA_FORM` (every edge's materialised reverse -- see Symmetric and inverse edges); 25 base/derived pairs among the promoted words added in `asset_version 1.5.0`; 36 `NOMINALISATION` pairs added in `asset_version 1.6.0`; 6 more `NOMINALISATION` pairs plus 1 `THIRD_PERSON_FORM` pair (`occur`/`occurs`) added in `asset_version 1.7.0`; 3 homograph-safe pairs (`cause`/`causing`, `cause`/`causation`, `state`/`statement`) added in `asset_version 1.8.0` using the new `source_part_of_speech`/`target_part_of_speech` disambiguator (see Version below) | 238 |
| `semantic_relationships.json` | Lexical Semantic (6.2.2) | `ANTONYM` (spatial/temporal opposites: above/below, before/after, ...; discrete/continuous, high/low, push/pull, negative/positive among the promoted words) and `SYNONYM` (equivalent prepositions: beneath/under, amid/among, due to/owing to, ...; the discourse-marker pair however/nevertheless; idea/concept among the promoted words), each materialised in both directions | 34 |
| `orthographic_relationships.json` | Orthographic and Naming (6.2.3) | `CONTRACTION` -- not/n't, plus each full contraction's component words (do/not -> don't, can/not -> can't, I/am -> I'm, it/is/has -> it's, is/not -> isn't, was/not -> wasn't, had/not -> hadn't) | 16 |

No `HYPERNYM`, `MERONYM`, or `TROPONYM` relationships are seeded for
closed-class Words -- those hierarchy/part-whole/manner relationships
describe how open-class concepts relate to each other, and don't apply
to a fixed set of grammatical function words the way conjugation,
pronoun paradigms, and near-synonymy do.

`PRONOUN_RECIPROCAL_FORM` is defined (6.2.1, Pronoun Form) but not
currently seeded in either direction -- see Known gaps.

Total relationships: **288**.

## Symmetric and inverse edges

Every entry in `semantic_relationships.json`, and every entry in
`morphological_relationships.json` originally seeded (49 of the 98
entries there today), has its reverse materialised as a second, real
edge -- not left to be inferred at query time:

- **Semantic (`SYNONYM`/`ANTONYM`)**: genuinely symmetric relationships
  -- if `above` is the `ANTONYM` of `below`, `below` is the `ANTONYM`
  of `above` just as much, so both directions are stored (`above` →
  `below` and `below` → `above`, each `ANTONYM`).
- **Morphological, `PRONOUN_OBJECT_FORM` pairs**: the reverse of `I` →
  `me` (`PRONOUN_OBJECT_FORM`) is `me` → `I`, seeded as
  `PRONOUN_SUBJECT_FORM` -- the enum's own defined inverse of
  `PRONOUN_OBJECT_FORM` (6.2.1's worked example for
  `PRONOUN_SUBJECT_FORM` is exactly `"me" → "I"`).
- **Every other morphological pair** (tense, number, aspect, degree,
  the non-object pronoun-paradigm forms): the reverse is seeded as
  `LEMMA_FORM` -- e.g. the reverse of `be` → `am`
  (`FIRST_PERSON_FORM`) is `am` → `be` (`LEMMA_FORM`), and the reverse
  of `I` → `myself` (`PRONOUN_REFLEXIVE_FORM`) is `myself` → `I`
  (`LEMMA_FORM`). No separate, more-specific inverse kind exists for
  these pairs the way `PRONOUN_SUBJECT_FORM` exists for
  `PRONOUN_OBJECT_FORM`, so `LEMMA_FORM` -- "target is the lemma of
  the source" -- is the correct fit: in every one of these pairs the
  original edge's source genuinely is the more canonical, paradigm-
  anchor form.
- **A generic forward `INFLECTION` edge is deliberately never seeded**
  alongside the specific kind an edge already has (e.g. no redundant
  `be` → `am` `INFLECTION` on top of the existing `be` → `am`
  `FIRST_PERSON_FORM`) -- it would assert the same `(source, target)`
  pair twice under a less specific kind for no additional queryable
  value. `Word.inflections()` gets the equivalent of a generic
  `INFLECTION` view for free by querying `LEMMA_FORM` from the
  *incoming* direction instead (`vocabulary/documentation/README.md`,
  4.3) -- every seeded `LEMMA_FORM` edge already serves both
  directions' derived properties.
- **A word that fills two paradigm roles gets two reverse edges under
  two different kinds**: `her` is both the object form and the
  possessive-determiner form of `she`, so it has both `her` → `she`
  (`PRONOUN_SUBJECT_FORM`, the reverse of the object-form edge) and
  `her` → `she` (`LEMMA_FORM`, the reverse of the possessive-determiner
  edge).
- **No `orthographic_relationships.json` entry is reversed** -- `not` →
  `n't` and every full-contraction edge added in `asset_version 1.4.0`
  (e.g. `do` → `don't`, `not` → `don't`) point from full form to
  contracted form only. There's no defined inverse kind for "target is
  the expanded form", the way `LEMMA_FORM` covers every morphological
  case. A contraction with two contracted components (`don't`,
  `isn't`, `wasn't`, `hadn't`: auxiliary + `not`; `I'm`: pronoun +
  auxiliary) gets two separate forward `CONTRACTION` edges, one per
  component, rather than one edge to a two-word phrase that has no
  single matching Word -- `it's` gets three, since it genuinely
  contracts either `it is` or `it has` and this cache doesn't attempt
  to disambiguate which reading a given occurrence intends.

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

### Disambiguating a homograph endpoint

`Dictionary + lexical form` alone isn't always a unique `Word` --
a homograph (`vocabulary/assets/common/en/README.md`'s own Homographs
table, e.g. `cause` `NOUN`/`VERB`, `state` `NOUN`/`VERB`) has more than
one `Word` sharing one lexical form. Without more information,
`RelationshipSeeder` resolves a JSON entry's `source_lexical_form`/
`target_lexical_form` via `Dictionary.lookup()` -- first-seeded-wins by
text, ignoring part_of_speech entirely -- which is exact and
unambiguous for every closed-class/mandatory word (the load order
`vocabulary/role/word_seeder.py`'s `MANDATORY_FILES`/
`SUPPLEMENTARY_FILES` comments already document deliberately keeps it
that way) but silently wrong whenever a relationship genuinely needs
the *other* sense.

An entry can name the sense explicitly instead: an optional
`source_part_of_speech` and/or `target_part_of_speech` key, one of
`PartOfSpeech`'s member names (`NOUN`, `VERB`, ...). When present,
`RelationshipSeeder._resolve` resolves that endpoint via
`Dictionary.lookup_all(lexical_form)` and picks the matching sense,
ignoring load order entirely, instead of `Dictionary.lookup()`'s
default:

```json
{
  "source_lexical_form": "state",
  "source_part_of_speech": "VERB",
  "target_lexical_form": "statement",
  "relationship_kind": "NOMINALISATION"
}
```

Most entries never need this -- it exists purely for the rare case
where an endpoint is a genuine homograph *and* the relationship must
target a specific sense (`state` `VERB` -> `statement`, not `state`
`NOUN` -> `statement`, which wouldn't mean anything). Omit both fields
and behaviour is byte-for-byte what it always was.

## Relationship identity and duplicate prevention

Every `LexicalRelationship` references a source Word UUID, a
relationship kind, and a target Word UUID. `RelationshipSeeder` treats
two relationships as duplicates only when all three match exactly (the
same rule as documented in the Vocabulary Layer developer
specification, 12.3) -- the same source and target Word under two
*different* kinds is not a duplicate. This is exercised for real by
`her` → `she`, which is seeded under both `PRONOUN_SUBJECT_FORM` (the
reverse of `she` → `her`'s object-form edge) and `LEMMA_FORM` (the
reverse of `she` → `her`'s possessive-determiner edge) -- two distinct,
legitimate relationships between the same pair of Words.

## Validation

`RelationshipSeeder.validate_assets()` checks:

- JSON schema (required keys present on every file and manifest)
- `count` matches the actual number of `relationships` entries
- Every `relationship_kind` names a real `LexicalRelationshipType`
  member
- Every present `source_part_of_speech`/`target_part_of_speech` (both
  optional -- see Disambiguating a homograph endpoint above) names a
  real `PartOfSpeech` member
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

## Known gaps

`PRONOUN_RECIPROCAL_FORM` (e.g. "they" -> "each other") is a real
`LexicalRelationshipType` member with no relationships seeded under it
in either direction -- unlike the rest of the Pronoun Form category,
this one was never seeded even in its forward direction, so there was
no existing edge for the Symmetric and inverse edges pass above to
reverse. Adding it requires a new forward relationship (and possibly
new target words, e.g. "each other"/"one another", if they aren't
already in the mandatory word cache), not just materialising a reverse
of something already present -- left open as a separate scope decision
rather than folded into this pass.

`PRESENT_TENSE_FORM` and `SINGULAR_FORM` are no longer gaps: every
existing morphological edge, including tense and number pairs, now has
its reverse materialised (as `LEMMA_FORM`, per Symmetric and inverse
edges above) rather than the more specific inverse-tense/inverse-number
kind. This means `PRESENT_TENSE_FORM` and `SINGULAR_FORM` themselves
remain unused as *kinds* (no edge is seeded under those specific
names), even though the relationship they'd represent -- "was" back to
"be", "these" back to "this" -- is fully covered via `LEMMA_FORM`.
Whether to additionally re-seed those specific reverse edges under
their own more precise kind, instead of the generic `LEMMA_FORM`, is a
possible future refinement, not required for `lemma_forms()`/
`inflections()` to work correctly today.

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

`v1` / `schema_version 1.0.0` / `asset_version 1.8.0` (282 -> 288
relationships). `RelationshipSeeder` gained the part-of-speech
disambiguator described in Disambiguating a homograph endpoint above
(`_resolve`, an optional `source_part_of_speech`/`target_part_of_speech`
per entry) -- the fix that `asset_version 1.7.0` below explicitly held
back as out of scope for the `WordSeeder` fix it was written alongside.
With it, three relationships a part-of-speech blind spot had made
unsafe were seeded correctly for the first time:
`cause` (`VERB`) -> `PRESENT_PARTICIPLE_FORM` -> `causing` and
`cause` (`VERB`) -> `NOMINALISATION` -> `causation` -- both removed
from earlier batches after being found silently attached to the `NOUN`
sense of `cause`; and `state` (`VERB`) -> `NOMINALISATION` ->
`statement` -- the pair `asset_version 1.7.0` deliberately left
unseeded, above. Each gets its reciprocal `LEMMA_FORM` edge too, an
explicit `target_part_of_speech` on the reverse edge since the lemma
being pointed back to is the ambiguous endpoint there
(`morphological_relationships.json` 232 -> 238).

Verified directly, not assumed: seeding a fresh Domain now attaches
every edge to the `VERB` sense of `cause`/`state` and leaves the `NOUN`
sense's own relationship list empty, confirmed both by inspecting the
`LexicalRelationshipStore` directly and by checking the rendered UI in
headless Chromium. Existing entries are untouched -- neither
`source_part_of_speech` nor `target_part_of_speech` is set on any of
them, so every one of them resolves exactly as it always did via
`Dictionary.lookup()`'s first-seeded-wins default; a fresh Common
Domain still seeds all 282 pre-existing relationships unchanged before
these 6 new ones are added. See `examples/relationship_cache_homograph_fix.py`.

`v1` / `schema_version 1.0.0` / `asset_version 1.7.0` (266 -> 282
relationships, alongside `../README.md`'s `asset_version 1.12.0`
common-core vocabulary batch: 6 more `NOMINALISATION` pairs
(`occur`/`occurrence`, `produce`/`production`, `introduce`/`introduction`,
`contain`/`containment`, `accompany`/`accompaniment`,
`receive`/`reception`), each with its reciprocal `LEMMA_FORM` edge,
taking `morphological_relationships.json` 218 -> 230; 1
`THIRD_PERSON_FORM` pair (`occur`/`occurs`) plus reciprocal
`LEMMA_FORM`, retroactively linking `occurs` -- seeded unlinked in
`asset_version 1.5.0`, its true lemma `occur` didn't exist yet -- to
its now-seeded lemma, taking `morphological_relationships.json` 230 ->
232; and 1 `SYNONYM` pair (`idea`/`concept`), both directions, taking
`semantic_relationships.json` 32 -> 34. `orthographic_relationships.json`
is unchanged at 16. `examples/common_core_vocabulary.py` has the full
reasoning, including which words a user-supplied audit flagged as
missing but turned out already seeded from earlier batches.

`v1` / `schema_version 1.0.0` / `asset_version 1.6.0` (196 -> 266
relationships, alongside `../README.md`'s `asset_version 1.11.0`
promoted-words batch: `NOMINALISATION` (6.2.1 Derivation -- defined
since `schema_version 1.0.0` but never seeded until now) for 36
base-form verbs, each a (verb, `NOMINALISATION`, noun) edge plus its
materialised reverse (noun, `LEMMA_FORM`, verb) -- taking
`morphological_relationships.json` 148 -> 222, then 222 -> 218 net
after also removing 4 wrong edges (below). `semantic_relationships.json`
and `orthographic_relationships.json` are unchanged at 32 and 16.
`examples/verb_nominalisation_vocabulary.py` has the full
verb-by-verb reasoning (which verbs qualify, which don't, and why).

While seeding this batch, `cause` -> `causation` (a genuine
nominalisation) proved unseedable correctly: `cause` is a Common
homograph (`NOUN` and `VERB`, both open-class), and
`RelationshipSeeder.seed_domain` resolves a cache entry's
`source_lexical_form` via `Dictionary.lookup()` -- first-seeded-wins by
text alone, not part-of-speech-aware -- so an entry naming `cause` as
source can only ever attach to the `NOUN` sense. Checking the actual
resulting edge confirmed it: the `NOMINALISATION` edge had attached to
`cause` (`NOUN`), not `cause` (`VERB`). Rather than ship a wrong edge,
it was removed, and `causation` stays a promoted Word with no formal
relationship (`../README.md`'s Version section has the reasoning).
Checking for the same failure mode elsewhere in the cache found one
more, pre-existing since `asset_version 1.5.0`: `cause` -> `causing`
(`PRESENT_PARTICIPLE_FORM`) had the identical problem, silently
attached to the `NOUN` sense the whole time. Both `cause`-involving
pairs (4 edges total: `cause`/`causing` `PRESENT_PARTICIPLE_FORM` +
reverse `LEMMA_FORM`, `cause`/`causation` `NOMINALISATION` + reverse
`LEMMA_FORM`) were removed together. `causing` and `causation` keep
their own accurate definitions (each already states the relationship
in prose); only the formal graph edges are gone. Surfaced, not fixed:
making `seed_domain`'s resolution part-of-speech-aware would be a
change to a shared pipeline class, well beyond either of these two
batches' scope.

`v1` / `schema_version 1.0.0` / `asset_version 1.5.0` (138 -> 196
relationships, alongside `../README.md`'s `asset_version 1.10.0`
promoted-words batch: 25 base/derived morphological pairs among the 221
newly-promoted words -- each a (base, specific-form-kind, derived) edge
plus its materialised reverse (derived, `LEMMA_FORM`, base), the same
convention as every other pair in this cache -- taking
`morphological_relationships.json` 98 -> 148; and 4 `ANTONYM` pairs
(discrete/continuous, high/low, push/pull, negative/positive), each
materialised in both directions, taking `semantic_relationships.json`
24 -> 32. `orthographic_relationships.json` is unchanged at 16. Kept
deliberately small -- only pairs found directly while classifying the
promoted words, not an attempted full taxonomy for 221 new words in one
pass; see `examples/README.md`'s Definition-gap vocabulary section.
`asset_version 1.4.0` (121 -> 138
relationships: added 15 `CONTRACTION` edges to
`orthographic_relationships.json` (1 -> 16) for the seven full
contractions added to `../auxiliaries.json` -- see Symmetric and
inverse edges above for why each gets one edge per component rather
than a reverse. Added a `however` <-> `nevertheless` `SYNONYM` pair,
both directions, to `semantic_relationships.json` (22 -> 24) -- the
only relationship among the four new discourse markers with a clear,
already-seeded partner; `therefore` and `moreover` have no existing
semantic neighbour in this cache to link to, so neither was forced
into an artificial relationship. `morphological_relationships.json` is
unchanged at 98. `asset_version 1.3.0` (61 -> 121
relationships: materialised the reverse of every existing morphological
and semantic edge -- see Symmetric and inverse edges above -- taking
`morphological_relationships.json` 49 -> 98 and
`semantic_relationships.json` 11 -> 22; `orthographic_relationships.json`
is unchanged at 1. `asset_version 1.2.0` took 60 -> 61, adding the
missing `she` -> `her` `PRONOUN_POSSESSIVE_DETERMINER_FORM` edge --
"her" is dual-role, both the object form and the possessive determiner
form of "she", unlike `him`/`his` where those are distinct words, so it
needed two edges, not one. `asset_version 1.1.0` took 53 -> 60,
resolving the seven gaps in Resolved Gaps above; `asset_version 1.0.0`'s
53 relationships are unchanged).

## Future languages

This directory is `assets/common/en/relationships/`. Additional
languages follow the same `assets/common/<language_code>/relationships/`
structure and file format; `RelationshipSeeder` is not
language-specific -- like `WordSeeder`, it loads whichever
`assets/common/<language_code>/relationships/` directory matches the
Domain's language code, without any change to the seeder itself.
