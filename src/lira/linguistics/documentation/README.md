# Linguistics Layer

Grammar/syntax-level processing (parsing, morphology) that feeds concept
and relationship extraction. Contains language structure only (Rule 18).

See the repository root's `ARCHITECTURE.md` for the full component tree
and design rules.

## Layout

- `data/` -- the `Clause`/`Sentence`/`Paragraph`/`Subject` tree, one
  class per file (`linguistic_unit.py` for the shared base, `clause.py`,
  `sentence.py`, `paragraph.py`, `subject.py`) plus
  their enums (`linguistic_unit_kind.py`,
  `linguistic_relation_type.py`); `LinguisticSystemPropertyTensor` and
  the by-reference `LinguisticSystemProperty` view (Rule 14).
  `Word` lives in `vocabulary/data/`, not here -- a word's lexical unit
  status, its part of speech, and its meaning are all lexical
  attributes (Rule 17), even though it still subclasses this layer's
  `LinguisticUnit`. There is no separate `Punctuation` class: a
  punctuation mark is a `Word` with `part_of_speech=PUNCTUATION`,
  seeded from Vocabulary's mandatory `punctuation.json` like any other
  closed-class word. `Clause.tokens` and `ClauseSegmentationUtility`
  reference `Word` only as a string-quoted, unimported type hint;
  `GraphProcessor` (which actually constructs `Word` instances) imports
  it locally inside its methods instead, deferred until first call.
  `GraphProcessor.process_token` derives a token's `LinguisticUnitKind`
  (`Word` vs `Punctuation` -- still two distinct tensor-row kinds, see
  `linguistic_unit_kind.py`) from `part_of_speech` rather than an
  `isinstance` check, since both are the same Python type now.
- `agents/` -- `LinguisticsAgent` (no concrete subclasses yet).
- `role/` -- `LinguisticController` (wires this layer together, same as
  `DomainController` does for `Domain`), `GraphProcessor`,
  `PromptTokenizer`, `LinguisticLexer`, `ClauseSegmentationUtility`,
  `GrammarConfigurator` (the rules -- conjunctions, delimiters,
  sentence-abbreviation exceptions -- `LinguisticLexer` and
  `ClauseSegmentationUtility` are configured by). This layer doesn't
  use the `*Agent`-subclass convention the other three layers use --
  its processing doesn't decompose cleanly into that shape -- but
  every class here still plays an active role rather than just holding
  state.
- `ui/` -- `UserPrompt`, the raw input at the layer's boundary, before
  `GraphProcessor` has done anything to it.
- `api/`, `assets/` -- none yet.

The lexicon (`Dictionary`, `DictionaryEntry`, `PartOfSpeech`) and
everything that seeds/looks up/hydrates it (`DictionaryProcessor`,
`AsyncDictionaryHydrator`, `ExternalDictionaryAdapter`) live in the
Vocabulary Layer, not here -- `GraphProcessor` takes a
`lira.vocabulary` `DictionaryProcessor` to resolve tokens (Rule 17).
`Word.definition` is populated from `DictionaryEntry.meaning.value` --
Vocabulary's `meaning` is a `value_objects` `Text`, but `Word` keeps a
plain `str` (Rule 18: Linguistics contains language structure only,
not typed value objects).

## TODO: Semantic decomposition and semantic disambiguation

Nothing downstream of this layer (Knowledge Layer concept/relationship
extraction in particular) should be built against what `GraphProcessor`
produces today without first doing two things:

1. **Semantic decomposition** -- breaking a parsed `Clause`/`Sentence`
   down into its constituent semantic units and relations (who did
   what to whom, under what condition), not just the syntactic
   `Word`/`Clause`/`Sentence`/`Paragraph`/`Subject` tree
   `GraphProcessor` builds today. The current tree is structural
   (tokens grouped into clauses grouped into sentences); it doesn't yet
   represent *meaning*.
2. **Semantic disambiguation** -- resolving a `Word` to its correct
   sense in context wherever more than one is possible.
   `GraphProcessor.process_token` currently calls
   `DictionaryProcessor.get_or_create_word`, which resolves via
   `Dictionary.lookup(text)` -- first match only, by seeding order, not
   by meaning (`vocabulary/documentation/README.md`, 9.2). This was a
   theoretical limitation before homographs existed in the seeded data;
   it's now a concrete, live one -- `that`/`this`/`these`/`those`
   (`DETERMINER`/`PRONOUN`), `which`/`what` (`PRONOUN`/`DETERMINER`),
   `be`/`have`/`do`/`cause`/`result` (`AUXILIARY or NOUN`/`VERB`),
   `past`/`opposite` (`PREPOSITION`/`ADJECTIVE`) all currently resolve
   to whichever sense was seeded first, regardless of which sense the
   surrounding sentence actually calls for. `Dictionary.lookup_all(text)`
   already returns every candidate sense; nothing yet picks among them
   using context.

Both are prerequisites for treating this layer's output as meaningful
input elsewhere, not incremental improvements to bolt on after the
fact.
