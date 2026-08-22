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
  real for every Word, not just AUXILIARY.** `Word.formIds`
  (`data/entities/word.ts`) + the `WordForms` store give exactly this
  shape -- `WordForm` already carries its own `senseIds: readonly
  Identifier[]`, matching "each `WordForm` has its own `Senses`"
  precisely, and both `WordForm` and `Sense` are stored once in a
  per-Domain master store (`WordForms`/`Senses` on `VocabularyContext`)
  and referenced by `Identifier`, never copied -- the "dictionary master
  level" invariant above already holds for these two stores
  specifically. Every Word gets at least a base-lemma `WordForm`
  (`WordForms.registerBaseLemmaForm()`); AUXILIARY still gets several
  more, one per inflected form. The Word Detail UI reflects this nesting
  directly (`ui/server/builder_word.ts`'s `wordFormsFor()`/`sensesFor()`,
  `WordFormEntry.senses`) -- every other POS subtype (Noun, Verb,
  Adjective, Adverb, Pronoun, Determiner) still ALSO spells its own
  *inflected* forms as scalar `*_Form` fields directly on the Word
  (`data/pos_form_fields.ts`), not through their own `WordForm` records
  -- only the base/canonical spelling has a real `WordForm` for those
  six subtypes; this document's Section 1 is their inflected forms' own
  target shape, not their current one.

- **`SemanticRelationship` (`data/semantic_relationship.ts`) is close
  to Section 2's shape, but Sense-only, no `WordForm` dimension.** It
  already connects two Senses directly (`sourceSenseId`/`targetSenseId`),
  matching this document's `wheel`/`car` MERONYM/HOLONYM example
  exactly -- a semantic fact never needs to name a specific spelling.
  It has no `Source.WordForm`/`Destination.WordForm` fields at all,
  since nothing built so far has needed one.

  **Its real blocker -- a base-lemma `WordForm` for `Source.WordForm`/
  `Destination.WordForm` to point at, for every Word, not just the 11
  AUXILIARY lemmas -- is now closed.** Every ordinary base-form Word
  (every WordNet-seeded Noun/Verb/Adjective/Adverb, and every
  hand-curated closed-class entry) gets its own `WordForm` with
  `field === "baseLemmaCanonicalForm"`, created and populated by
  `WordForms.registerBaseLemmaForm()`/`registerSense()`
  (`data/word_forms.ts`), called from the same two places a base-form
  Word's Sense was already being registered: `role/word_seeder.ts`'s
  `registerUniqueSense()` (hand-curated closed-class entries) and
  `seedWordNet()`'s pass 1 (every WordNet synset member, the dominant,
  ~100k+-Word source). Every Sense already reaching a Word via
  `senses.registerMember(sense, word)` now also reaches that same
  Word's own base-lemma `WordForm` via `wordForms.registerSense()` --
  the identical dual-registration pattern `role/auxiliary_seeder.ts`
  already used, generalised to every Word instead of just AUXILIARY's
  inflected forms. AUXILIARY itself is untouched by this (it never runs
  through either of those two functions), so "be"'s own
  `bareInfinitiveForm` WordForm isn't duplicated by a redundant
  `baseLemmaCanonicalForm` one.

  This also finally gives `Word.baseLemmaCanonicalForm` a real
  consumer. Grepped the whole codebase (TS and JSON, camelCase and
  snake_case): no production seeder has ever written it -- but it's
  real, tested machinery (`vocabulary.test.ts`'s own coverage of
  `validateWordFormAttributes()` and the UI's `word_forms` output), so
  it was kept rather than retired. Its own intended case -- a Word that
  itself models one specific inflected surface form, pointing back to a
  different lemma's spelling (its own docstring's "ran" example, and
  concretely the real promoted VERB Words "was"/"is"/"has"/... this
  session's own Auxiliary work turned up) -- is now the preferred
  `text` source for that Word's own base-lemma `WordForm` whenever it's
  set, falling back to `Word.lexicalForm`/`Word.text` (the two already
  agree for the ordinary case, where a Word's own stored spelling
  already is its canonical form).

- **`LexicalRelationship` now matches Section 2's shape directly.**
  What used to be the Word-to-Word working structure (`sourceWordId`/
  `targetWordId`, seeding-internal, discarded after use) is renamed to
  `MorphologicalPointerRelationship` (`data/morphological_pointer_relationship.ts`)
  -- untouched in behaviour, still exactly what its own docstring there
  describes. The freed-up `LexicalRelationship` name now names the real
  thing: `sourceWordFormId`/`sourceSenseId`/`targetWordFormId`/
  `targetSenseId` (`data/lexical_relationship.ts`), `SemanticRelationship`'s
  own exact shape one dimension wider, permanent and directly queryable
  via `VocabularyContext.lexicalRelationships` (`LexicalRelationshipStore`,
  `SemanticRelationshipStore`'s own exact counterpart) -- nothing reads
  it once and discards it any more. Populated at the same two call sites
  that already resolve the exact Sense/Word pair a fact is about --
  `role/word_seeder.ts`'s `copyLexicalRelationship()` (every WordNet
  Morphological/Orthographic-group pointer, `copySemanticRelationship()`'s
  own sibling) and `role/relationship_seeder.ts`'s own parallel addition
  (the hand-curated Common Relationship Cache, `CONTRACTION` included) --
  both resolve `WordForm` via `WordForms.registerBaseLemmaForm()`. The
  Word Detail UI reads it directly now too: each Sense's own row carries
  a "Sense.Lexical.Relationships" section
  (`ui/server/builder_lexical_relationship.ts`, `client_senses_section_html.ts`),
  `SemanticRelationship`'s own "Sense.Semantic.Relationships" sibling,
  nested under the WordForm it belongs to rather than flat under the
  Word (Section 1's own nesting, now real for every Word, not just
  AUXILIARY -- `wordFormsFor()`/`sensesFor()`, `ui/server/builder_word.ts`).

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

- The **dual-registration pattern from `role/auxiliary_seeder.ts`, now
  generalised to every Word** (a Sense registered onto both its owning
  `WordForm.senseIds` and the Word's own `senseIds`) is proof the
  master-store/by-reference shape works in real seeded data at
  WordNet scale, not just as a target diagram.

### Next Step

Two of the three gaps the previous "Next Step" named are now closed:
`LexicalRelationship` matches Section 2's `(WordForm, Sense)`-on-each-side
shape and is a real, permanent, queryable part of the model, and the
Word Detail UI reflects Section 1's Word -> WordForm -> Senses nesting
for every Word. What's left:

- **`SemanticRelationship` still has no `Source.WordForm`/`Destination.WordForm`
  dimension** -- it connects two Senses directly, which is correct for
  a genuine Sense-to-Sense semantic fact (this document's `wheel`/`car`
  example never needed a spelling), but doesn't yet let a caller ask
  "which specific WordForm was this fact recorded against." Nothing
  built so far has needed that; revisit if a real case turns up.
- **Compound and Verbalisation still have no relationship representation**
  -- Compound has no enum member, no Word-level field, no seeded data
  at all (`act -> speech act` in Section 4 stays aspirational); Verbalisation
  stays a Word-level boolean+pointer field pair
  (`Noun.isVerbalised`/`Verb.isNominalisedIndicator` and siblings)
  rather than its own relationship kind, per this document's own
  Validity Rule (Section 10) -- don't manufacture either without real
  data behind it.
