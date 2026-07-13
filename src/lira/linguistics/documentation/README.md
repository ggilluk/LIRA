# Linguistics Layer

Grammar/syntax-level processing (parsing, morphology) that feeds concept
and relationship extraction. Contains language structure only (Rule 18).

See the repository root's `ARCHITECTURE.md` for the full component tree
and design rules.

## Layout

- `data_classes/` -- `LinguisticsLayer`; the `Word`/`Punctuation`/
  `Clause`/`Sentence`/`Paragraph`/`Subject`/`UserPrompt` tree and their
  enums (`units.py`); `LinguisticSystemPropertyTensor` and the
  by-reference `LinguisticSystemProperty` view (Rule 14); `Dictionary`/
  `DictionaryEntry`; `LinguisticGrammarConfiguration`.
- `agents_role/` -- `GraphProcessor`, `PromptTokenizer`,
  `LinguisticLexer`, `ClauseSegmentationUtility`, `DictionaryProcessor`,
  `AsyncDictionaryHydrator`, `ExternalDictionaryAdapter`. This layer
  doesn't use the `*Agent`-subclass convention the other three layers
  use -- its processing doesn't decompose cleanly into that shape -- but
  every class here still plays an active role rather than just holding
  state.
- `apis/`, `uis/`, `assets/` -- none yet.
