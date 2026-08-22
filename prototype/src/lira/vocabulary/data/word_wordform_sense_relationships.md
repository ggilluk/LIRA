# Word, WordForm, Sense and Lexical Relationships

The target conceptual model for how a `Word`'s inflected spellings
(`WordForm`), their meanings (`Sense`), and the relationships between
meanings (`SemanticRelationship`, `LexicalRelationship`) fit together --
recorded here as a design reference, not a claim that every part of it
is already built. See **Current Implementation State** at the end for
exactly what exists today versus what this document specifies as the
target.

## 1. Core Vocabulary Structure

```
Word
 └── WordForms
      └── (ByRef) WordForm
           └── Senses
                └── (ByRef) Sense
```

**Word**
The lexical word represented within the vocabulary.

**WordForms**
Collection of `WordForm` references associated with a `Word`.

**WordForm**
A specific lexical or grammatical form associated with a `Word`.
Stored/referenced ByRef so that the canonical `WordForm` is not
duplicated.

**Senses**
Collection of `Sense` references associated with a `WordForm`.

**Sense**
A specific meaning applicable to a `WordForm`.
Stored/referenced ByRef so that the canonical `Sense` is not
duplicated.

## 2. Relationship Structure

There are two primary meaning relationship classes:

- `SemanticRelationship`
- `LexicalRelationship`

Both use the same general directional structure:

```
Relationship
    Source
        WordForm
        Sense

    Destination
        WordForm
        Sense
```

**SemanticRelationship**
Relates senses according to semantic meaning.

Example:

```
    wheel [Sense]
        Meronym
            ->
        Holonym
    car [Sense]
```

**LexicalRelationship**
Relates senses where a lexical `WordForm` affects, modifies, derives,
specialises or changes the interpretation or representation of another
lexical sense.

General structure:

```
LexicalRelationship
    Source.WordForm
    Source.Sense
        ->
    Destination.WordForm
    Destination.Sense
```

Interpretation:

- **Source** -- Provides the base `WordForm` and base `Sense`.
- **Destination** -- Provides the `WordForm` that modifies, derives,
  specialises or changes the interpretation/representation of the
  Source `Sense`.
- **Base Sense (Of Meaning)** -- Meaning of the Source before
  application of the `LexicalRelationship`.
- **Modified Sense (Of Meaning)** -- Interpretation of that Source
  meaning after application of the Destination `WordForm`.

## 3. Lexical Relationship Types

- Derivation
- Inflection
- Nominalisation
- Verbalisation
- Adjectivisation
- Adverbialisation
- Compound
- Abbreviation
- Contraction
- Orthographic Variant

## 4. Test Matrix -- Base Word: ACT

| Lexical Relationship | Source WordForm | Destination WordForm | Example | Base Sense (Of Meaning) | Modified Sense (Of Meaning) |
|---|---|---|---|---|---|
| Derivation | Base | Derived | act -> action | act: to do something | act: understood as the resulting/related action |
| Inflection | Base | Inflected | act -> acted | act: to do something | act: to do something in the past |
| Nominalisation | Base | Nominalised | act -> action | act: to do something | act: understood as the act/action itself |
| Verbalisation | Base | Verbalised | act (noun) -> act (verb) | act: something done | act: to perform an act |
| Adjectivisation | Base | Adjectivised | act -> active | act: to do something | act: characterised by action/activity |
| Adverbialisation | Base | Adverbialised | act -> actively | act: to do something | act: performed in an active manner |
| Compound | Head | Modifier | act -> speech act | act: something done | act: an act specifically performed through speech |
| Abbreviation | Expanded | Abbreviation | act -> act. | act: an act | act: same meaning represented by act. |
| Contraction | Expanded | Contracted | N/A | act: an act | N/A |
| Orthographic Variant | Base | Variant | N/A | act: an act | N/A |

## 5. Test Matrix -- Base Word: CANNOT

| Lexical Relationship | Source WordForm | Destination WordForm | Example | Base Sense (Of Meaning) | Modified Sense (Of Meaning) |
|---|---|---|---|---|---|
| Derivation | Base | Derived | N/A | cannot: be unable to | N/A |
| Inflection | Base | Inflected | N/A | cannot: be unable to | N/A |
| Nominalisation | Base | Nominalised | N/A | cannot: be unable to | N/A |
| Verbalisation | Base | Verbalised | N/A | cannot: be unable to | N/A |
| Adjectivisation | Base | Adjectivised | N/A | cannot: be unable to | N/A |
| Adverbialisation | Base | Adverbialised | N/A | cannot: be unable to | N/A |
| Compound | Head | Modifier | N/A | cannot: be unable to | N/A |
| Abbreviation | Expanded | Abbreviation | N/A | cannot: be unable to | N/A |
| Contraction | Expanded | Contracted | cannot -> can't | cannot: be unable to | cannot: same meaning represented by can't |
| Orthographic Variant | Base | Variant | N/A | cannot: be unable to | N/A |

## 6. Test Matrix -- Base Word: COLOUR

| Lexical Relationship | Source WordForm | Destination WordForm | Example | Base Sense (Of Meaning) | Modified Sense (Of Meaning) |
|---|---|---|---|---|---|
| Derivation | Base | Derived | colour -> colourful | colour: visual property | colour: characterised by having much/varied colour |
| Inflection | Base | Inflected | colour -> colours | colour: a visual property/category | colour: more than one colour |
| Nominalisation | Base | Nominalised | colour (verb) -> colour (noun) | colour: to give something colour | colour: the colour/property itself |
| Verbalisation | Base | Verbalised | colour (noun) -> colour (verb) | colour: a visual property | colour: to give something colour |
| Adjectivisation | Base | Adjectivised | colour -> colourful | colour: visual property | colour: characterised by having colour |
| Adverbialisation | Base | Adverbialised | colour -> colourfully | colour: visual property | colour: expressed in a colourful manner |
| Compound | Head | Modifier | colour -> colour scheme | colour: visual property | colour: specifically colour organised as part of a scheme |
| Abbreviation | Expanded | Abbreviation | colour -> col. | colour: visual property | colour: same meaning represented by an abbreviated form |
| Contraction | Expanded | Contracted | N/A | colour: visual property | N/A |
| Orthographic Variant | Base | Variant | colour -> color | colour: visual property | colour: same meaning represented using US orthography |

## 7. Directional Rule

`LexicalRelationship` direction is:

```
    Base Sense
        ->
    Modified Sense
```

The Source identifies the meaning being operated upon.

The Destination identifies the `WordForm` that modifies, derives,
specialises or changes the interpretation/representation of that
Source meaning.

## 8. Important Invariant

The Base Sense and Modified Sense describe the SAME base lexical
meaning from the perspective of the Source.

The Modified Sense does NOT simply become the definition of the
Destination word.

Example:

```
    Source:
        WordForm = act
        Sense = "something done"

    Destination:
        WordForm = speech act

    Base Sense:
        act = "something done"

    Modified Sense:
        act = "an act specifically performed through speech"
```

## 9. Meaning-Changing vs. Meaning-Preserving

`LexicalRelationship`s may either modify semantic interpretation or
modify only its lexical representation.

**Meaning-changing / specialising:**

- Derivation
- Inflection
- Nominalisation
- Verbalisation
- Adjectivisation
- Adverbialisation
- Compound

**Meaning-preserving / representational:**

- Abbreviation
- Contraction
- Orthographic Variant

## 10. Validity Rule

Do NOT manufacture a `LexicalRelationship` merely to populate the
model.

If a Word does not genuinely support a particular relationship, the
relationship does not exist for that Word.

Example:

```
    act -> contraction
        N/A

    cannot -> contraction
        cannot -> can't

    colour -> orthographic variant
        colour -> color
```

## 11. Overall Model

```
Word
 │
 └── WordForms
      │
      └── (ByRef) WordForm
           │
           └── Senses
                │
                └── (ByRef) Sense
                     │
                     ├── SemanticRelationship
                     │      │
                     │      ├── Source.WordForm
                     │      ├── Source.Sense
                     │      ├── Destination.WordForm
                     │      └── Destination.Sense
                     │
                     └── LexicalRelationship
                            │
                            ├── Source.WordForm
                            ├── Source.Sense
                            ├── Destination.WordForm
                            └── Destination.Sense
```

`WordForms` is an attribute of the `Word` class. `Senses` is an
attribute of the `WordForm` class.

**Core invariant to preserve in any implementation**: `WordForm` and
`Sense` are referenced objects -- a relationship connects those
references rather than creating copies of either. Lexical realization
(`WordForm`), meaning (`Sense`), and the relationships between them
stay independently addressable. This requires a dictionary master
level of `WordForm`s and `Sense`s: one canonical store per Domain that
every reference resolves against, never a relationship-local or
per-Word copy.

## Current Implementation State

What of this model is already real code today, and where it diverges,
as of the `WordForm`/`WordForms` introduction
(`data/word_form.ts`/`data/word_forms.ts`):

- **Section 1 (Word -> WordForms -> WordForm -> Senses -> Sense) is
  real, but AUXILIARY-only.** `Word.formIds` (`data/entities/word.ts`)
  + the `WordForms` store give exactly this shape -- `WordForm` already
  carries its own `senseIds: readonly Identifier[]`, matching "each
  `WordForm` has its own `Senses`" precisely, and both `WordForm` and
  `Sense` are stored once in a per-Domain master store (`WordForms`/
  `Senses` on `VocabularyContext`) and referenced by `Identifier`, never
  copied -- the "dictionary master level" invariant above already holds
  for these two stores specifically. Every other POS subtype (Noun,
  Verb, Adjective, Adverb, Pronoun, Determiner) still spells its own
  forms as scalar `*_Form` fields directly on the Word
  (`data/pos_form_fields.ts`), not through a `WordForm` -- this
  document's Section 1 is these subtypes' own target shape, not their
  current one.

- **`SemanticRelationship` (`data/semantic_relationship.ts`) is close
  to Section 2's shape, but Sense-only, no `WordForm` dimension.** It
  already connects two Senses directly (`sourceSenseId`/`targetSenseId`),
  matching this document's `wheel`/`car` MERONYM/HOLONYM example
  exactly -- a semantic fact never needs to name a specific spelling.
  It has no `Source.WordForm`/`Destination.WordForm` fields at all,
  since nothing built so far has needed one.

  **The real blocker to adding that dimension: there is no base-lemma
  `WordForm` for `Source.WordForm`/`Destination.WordForm` to point at,
  for any Word outside the 11 AUXILIARY lemmas.** `WordForm` today only
  ever represents an *inflected* spelling ("am", "was") -- there is no
  WordForm standing for a Word's own base/canonical spelling ("wheel"
  itself, "car" itself), so a base-form Sense (which is most Senses --
  every WordNet-seeded Noun/Verb/Adjective/Adverb sense) still attaches
  only to `Word.senseIds` directly, with no `WordForm` hop to reach at
  all. Wiring `Source.WordForm` onto `SemanticRelationship` (or
  `LexicalRelationship`) needs that hop to exist for every Word first,
  not just the inflected ones.

  This concept -- "the canonical/base spelling of this Word" -- already
  exists in the codebase, but scattered across several different,
  not-fully-reconciled names/shapes, none of them a `WordForm`:
  `Word.text` (the stored spelling itself), `Word.lexicalForm` (a
  separate field, defaults to `text`), `Word.normalisedForm` (lower-
  cased), and `Word.baseLemmaCanonicalForm` (a scalar `Text` pointer
  *by spelling* back to a different Word's lemma, used when a Word is
  itself modelled as one specific inflected form, e.g. a hypothetical
  "ran" Word carrying `baseLemmaCanonicalForm: "run"`) --
  `data/entities/word.ts`'s own docstring on that last one. That field
  is itself a second, competing shape for "inflected form <-> lemma"
  alongside the one `WordForm`/`Auxiliary` just established (one Word
  with `WordForm` children, vs. one Word per surface form with a
  scalar back-pointer) -- reconciling the two, not just adding a fifth
  name for the same idea, is part of closing this gap.

- **`LexicalRelationship` (`data/lexical_relationship.ts`) is the
  biggest gap against this document.** Today it connects two *Words*
  directly (`sourceWordId`/`targetWordId`), not `(WordForm, Sense)`
  pairs on each side -- there is no Base Sense / Modified Sense
  distinction in the data at all, and no `WordForm` reference on either
  side. It's also explicitly seeding-internal working state rather than
  a permanent, queryable part of the model
  (`VocabularyContext`'s own docstring: "nothing outside
  role/word_seeder.ts and role/relationship_seeder.ts is meant to read
  `lexicalRelationships` again once a seeding pass returns") -- the
  facts it captures get read back once, at the end of seeding, onto
  either a Word-level attribute pair (see below) or into
  `SemanticRelationship`. Section 2's `LexicalRelationship` shape
  (Source/Destination each carrying both a `WordForm` and a `Sense`,
  permanent and directly queryable) does not exist as its own object
  yet.

- **Section 3's ten `LexicalRelationshipType` categories mostly already
  have real enum members** (`data/enums/lexical_relationship_type.ts`),
  though not wired through a Source/Destination `WordForm`+`Sense`
  shape:
  - Derivation -> `DERIVED_FORM` (plus `AGENT_NOUN_DERIVATION`/`PERTAINYM`
    as more specific subtypes)
  - Inflection -> `INFLECTION`
  - Nominalisation -> `NOMINALISATION`
  - Adjectivisation -> `ADJECTIVAL_DERIVATION`
  - Adverbialisation -> `ADVERBIAL_DERIVATION`
  - Abbreviation -> `ABBREVIATION` (siblings: `ACRONYM`/`INITIALISM`)
  - Contraction -> `CONTRACTION`
  - Orthographic Variant -> `SPELLING_VARIANT`/`HISTORICAL_SPELLING`
  - **Verbalisation has no dedicated enum member** -- it's tracked as a
    Word-level boolean+pointer field pair instead (e.g.
    `Noun.isVerbalised`/`Verb.isNominalisedIndicator` and their
    siblings, `data/entities/verb.ts` and others), read back from the
    seeding-internal `LexicalRelationship` graph once, onto the two
    Words directly involved, rather than staying its own permanent
    relationship record.
  - **Compound has no representation at all yet** -- no enum member, no
    Word-level field, no seeded data (`act -> speech act` in Section 4
    is aspirational, not resolvable against today's Dictionary).

- The **dual-registration pattern already in `role/auxiliary_seeder.ts`**
  (a Sense registered onto both its owning `WordForm.senseIds` and the
  Word's own `senseIds`) is a practical, narrower version of this
  document's "by-reference, independently addressable" principle --
  proof the master-store/by-reference shape works in real seeded data,
  not just as a target diagram.

### Suggested First Step

Give every Word a base-lemma `WordForm` before touching either
relationship type's own shape. Every other gap listed above --
`SemanticRelationship`'s missing `WordForm` dimension, `LexicalRelationship`'s
Word-to-Word shape, Compound/Verbalisation having no relationship
representation at all -- needs `Source.WordForm`/`Destination.WordForm`
to be populable for an *ordinary* base-form Word (a Noun, a Verb, not
just one of the 11 Auxiliary lemmas), not only an inflected one. Doing
this first, once, is a smaller and more foundational step than fixing
either relationship type's shape directly, and both of those already
depend on it. It also forces the `baseLemmaCanonicalForm` reconciliation
above to actually get settled, rather than accumulating a fifth name
for the same idea alongside it.
