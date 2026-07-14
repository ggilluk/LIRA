# Vocabulary Layer

Term/lexeme-level concept identity within a Domain (surface-form to
concept resolution). Contains lexical inventory only (Rule 17) --
prevents words and symbols being confused with meaning. Also owns the
lexicon (Dictionary) and everything that seeds/looks up/hydrates it.

See the repository root's `ARCHITECTURE.md` for the full component tree
and design rules. See `DEVELOPER_SPECIFICATION.md` in this folder for
the Vocabulary Layer developer specification (`Dictionary`, `Word`,
`LexicalRelationship`, enumerations, and supporting value objects).
Note: that specification's `Word` is a forward-looking, richer model
and is not the same as this layer's current, much simpler `Word` class
described below -- see the specification document's own note on this.

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
