# Vocabulary Layer

Term/lexeme-level concept identity within a Domain (surface-form to
concept resolution). Contains lexical inventory only (Rule 17) --
prevents words and symbols being confused with meaning.

See the repository root's `ARCHITECTURE.md` for the full component tree
and design rules.

## Layout

- `data_classes/` -- `VocabularyLayer`.
- `agents_role/` -- `VocabularyAgent` and its concrete agents (`SeedAgent`,
  `LookupAgent`, `HydrateAgent`, `NormaliseAgent`).
- `apis/`, `uis/`, `assets/` -- none yet.
