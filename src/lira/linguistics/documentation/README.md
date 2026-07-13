# Linguistics Layer

Grammar/syntax-level processing (parsing, morphology) that feeds concept
and relationship extraction. Contains language structure only (Rule 18).

See the repository root's `ARCHITECTURE.md` for the full component tree
and design rules.

## Layout

- `data/` -- the `Word`/`Punctuation`/`Clause`/`Sentence`/`Paragraph`/
  `Subject`/`UserPrompt` tree, one class per file (`linguistic_unit.py`
  for the shared base, `word.py`, `punctuation.py`, `clause.py`,
  `sentence.py`, `paragraph.py`, `subject.py`, `user_prompt.py`) plus
  their enums (`linguistic_unit_kind.py`, `part_of_speech.py`,
  `linguistic_relation_type.py`); `LinguisticSystemPropertyTensor` and
  the by-reference `LinguisticSystemProperty` view (Rule 14);
  `LinguisticGrammarConfiguration`.
- `agents/` -- `LinguisticsAgent` (no concrete subclasses yet).
- `role/` -- `LinguisticController` (wires this layer together, same as
  `DomainController` does for `Domain`), `GraphProcessor`,
  `PromptTokenizer`, `LinguisticLexer`, `ClauseSegmentationUtility`.
  This layer doesn't use the `*Agent`-subclass convention the other
  three layers use -- its processing doesn't decompose cleanly into
  that shape -- but every class here still plays an active role rather
  than just holding state.
- `api/`, `ui/`, `assets/` -- none yet.

The lexicon (`Dictionary`) and everything that seeds/looks up/hydrates
it (`DictionaryProcessor`, `AsyncDictionaryHydrator`,
`ExternalDictionaryAdapter`) live in the Vocabulary Layer, not here --
`GraphProcessor` takes a `lira.vocabulary` `DictionaryProcessor` to
resolve tokens (Rule 17).
