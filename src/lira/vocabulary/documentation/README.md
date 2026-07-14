# Vocabulary Layer

Term/lexeme-level concept identity within a Domain (surface-form to
concept resolution). Contains lexical inventory only (Rule 17) --
prevents words and symbols being confused with meaning. Also owns the
lexicon (Dictionary) and everything that seeds/looks up/hydrates it.

See the repository root's `ARCHITECTURE.md` for the full component tree
and design rules.

## Layout

- `data/` -- `VocabularyLayer`; `Dictionary`, `DictionaryEntry`, one
  class per file; `PartOfSpeech` (numeric tensor-ready values, same
  convention as Linguistics's `LinguisticUnitKind` -- lives here, not
  Linguistics, since classifying a word's part of speech is a lexical
  attribute, same as its meaning). `DictionaryEntry.meaning` is a
  `value_objects` `Text` rather than a plain `str`.
- `agents/` -- `VocabularyAgent` and its concrete agents (`SeedAgent`,
  `LookupAgent`, `HydrateAgent`, `NormaliseAgent`).
- `role/` -- `DictionaryProcessor`, `AsyncDictionaryHydrator`,
  `ExternalDictionaryAdapter` -- plain service classes for the lexicon,
  not `*Agent` subclasses.
- `api/`, `ui/`, `assets/` -- none yet.
