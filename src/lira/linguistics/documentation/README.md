# Linguistics Layer

Grammar/syntax-level processing (parsing, morphology) that feeds concept
and relationship extraction. Contains language structure only (Rule 18).

See the repository root's `ARCHITECTURE.md` for the full component tree
and design rules.

## Layout

- `data/` -- the `Phrase`/`Clause`/`Sentence`/`Paragraph`/`Subject` tree,
  one class per file (`linguistic_unit.py` for the shared base,
  `phrase.py`, `clause.py`, `sentence.py`, `paragraph.py`, `subject.py`)
  plus their enums (`linguistic_unit_kind.py`, `linguistic_relation_type.py`,
  `phrase_type.py`, `clause_type.py`, `sentence_type.py`,
  `linguistic_scope.py`, `sequencing_obligation.py`, `validation_outcome.py`,
  `reading_error.py`); the read path's own supporting records
  (`token_reading.py`, `interpretation.py`); `LinguisticSystemPropertyTensor`
  and the by-reference `LinguisticSystemProperty` view (Rule 14).
  `Word` lives in `vocabulary/data/`, not here -- a word's lexical unit
  status, its part of speech, and its meaning are all lexical
  attributes (Rule 17), even though it still subclasses this layer's
  `LinguisticUnit`. There is no separate `Punctuation` class: a
  punctuation mark is a `Word` with `part_of_speech=PUNCTUATION`,
  seeded from Vocabulary's mandatory `punctuation.json` like any other
  closed-class word.
- `agents/` -- `LinguisticsAgent` (no concrete subclasses yet).
- `role/` -- `LinguisticController` (wires this layer together, same as
  `DomainController` does for `Domain`), `GraphProcessor`,
  `PromptTokenizer`, `LinguisticLexer`, `ClauseSegmentationUtility`,
  `GrammarConfigurator` (every rule table both the write path and the
  read path are configured by); the read path's own roles --
  `TokenResolver`, `SequenceEngine`, `ReadingScorer`, `PhraseReader`,
  `ClauseReader`, `SentenceReader`, `ReadingContext` (the service bundle
  `.read()` calls are given -- see 13 below). This layer doesn't use the
  `*Agent`-subclass convention the other three layers use -- its
  processing doesn't decompose cleanly into that shape -- but every
  class here still plays an active role rather than just holding state.
- `ui/` -- `UserPrompt`, the raw input at the layer's boundary, before
  `GraphProcessor` has done anything to it.
- `api/`, `assets/` -- none yet.

The lexicon (`Dictionary`, `Word`, `PartOfSpeech`) and everything that
resolves/seeds/hydrates it (`DictionaryProcessor`,
`PartOfSpeechIdentifier`, `AsyncDictionaryHydrator`,
`ExternalDictionaryAdapter`) live in the Vocabulary Layer, not here --
`GraphProcessor` takes a `lira.vocabulary` `DictionaryProcessor` to
resolve tokens (Rule 17). `LinguisticUnit.text` (inherited by every node
`GraphProcessor` builds, `Word` included) stays a plain `str`, never a
`value_objects` `Text` (Rule 18: Linguistics contains language structure
only, not typed value objects).

## Developer Specification

### Table of Contents

1. [Purpose](#1-purpose)
2. [Design Principles](#2-design-principles)
3. [Linguistic Hierarchy](#3-linguistic-hierarchy)
4. [Phrase](#4-phrase)
5. [Clause](#5-clause)
6. [Sentence](#6-sentence)
7. [Enumerations](#7-enumerations)
8. [Sequencing Engine](#8-sequencing-engine)
9. [Grammar Configuration](#9-grammar-configuration)
10. [Scopes and Obligations](#10-scopes-and-obligations)
11. [Validation](#11-validation)
12. [Structured Errors](#12-structured-errors)
13. [Reading Pipeline](#13-reading-pipeline)
14. [Graph Construction](#14-graph-construction)
15. [Not Yet Built](#15-not-yet-built)

### 1. Purpose

Read English text using vocabulary already seeded in LIRA: given a
sentence, determine which seeded part of speech applies to each word by
sequencing through the candidates the Vocabulary Layer already returns
-- never inventing a part of speech for a known or unknown word.

Three entry points do this: `Phrase.read()`, `Clause.read()`,
`Sentence.read()` (sections 4-6). The Vocabulary Layer (assets,
dictionary processing, seeded words, parts of speech, morphology) is
unchanged and used exactly as-is; this is read-only structural
sequencing, not sentence generation, vocabulary seeding, semantic
extraction, or automatic correction (section 15).

### 2. Design Principles

- **Never invent a part of speech.** A word's candidate parts of speech
  come only from `DictionaryProcessor.identify_word` (already ranked,
  already correct -- `vocabulary/documentation/README.md`, 9.6).
  Sequencing chooses *among* those candidates by context; it never adds
  one that wasn't seeded, and an unseeded word's occurrence is never
  guessed into any part of speech (section 12).
- **Extend, don't duplicate.** `LinguisticController`, `GraphProcessor`,
  `GrammarConfigurator`, and `ClauseSegmentationUtility` are extended,
  not replaced. The write path (`tokenize_prompt`) and the read path
  (`read_sentence`/`read_text`) share the same `GraphProcessor`,
  `GrammarConfigurator`, and tensor -- see 13.5 on `process_token`'s
  split into `process_token_candidates` + `materialise_token`.
- **One shared sequencing engine.** `SequenceEngine` (8) holds no
  grammar of its own; every rule comes from `GrammarConfigurator` (9).
  `PhraseReader`, `ClauseReader`, and `SentenceReader` all consult the
  same engine and the same rule tables -- there is exactly one
  implementation of "what can follow what," not three.
- **Rule 17 (Vocabulary owns the lexicon)** and **Rule 18 (Linguistics
  never stores typed value objects)** apply to every new class in this
  change the same way they apply to the write path: `PartOfSpeech`,
  `Word`, and `WordIdentification` are used only as type hints, deferred
  behind `TYPE_CHECKING` or local imports, never imported at module
  scope in anything reachable from `linguistics/__init__.py` -- see any
  new file's own module docstring for the specific import-cycle
  reasoning (Vocabulary's own modules import this layer's
  `linguistic_unit.py`).
- **Retain ambiguity, don't collapse it prematurely.** Where more than
  one reading is credible, the losing readings are kept as lightweight
  `Interpretation` records (not full trees) on the winner's
  `alternatives` field, with their own confidence -- see 4, 8.4.

### 3. Linguistic Hierarchy

```
Subject -> Paragraph -> Sentence -> Clause -> Phrase -> Word / Punctuation
```

Unchanged from the write path: `Sentence -> Paragraph -> Subject`
containment, tensor conventions (every unit gets a
`LinguisticSystemProperty` view into `LinguisticSystemPropertyTensor`,
Rule 14), and the fact that punctuation is a `Word`
(`part_of_speech=PUNCTUATION`), not a separate type. `Phrase` (4) is new
in this hierarchy -- it did not exist before this change. A `Clause`
that reads at least one `Phrase` now also has `phrases`,
`subject`/`predicate`/`object`/`complement`/`modifiers` (role-classified
references into that same `phrases` list, section 5), and `finite_verb`.
No Knowledge Layer concepts (concepts, semantic relationships) are
created anywhere in this pipeline -- see 15.

### 4. Phrase

`data/phrase.py`. A sequence of Vocabulary words functioning as one
grammatical unit within a clause. References Vocabulary `Word`s and
`WordIdentification`s -- never copies or replaces their lexical data
(Rule 17).

**Fields** (beyond the inherited `text`, `system_property`):
`phrase_type` (`Optional[PhraseType]`, 7.1 -- `None` only for the
degenerate "no phrase grammar accepts a token here" result), `words`,
`selected_parts_of_speech`, `selected_identifications`, `head_word`,
`head_part_of_speech`, `modifiers`, `nested_phrases` (a
`PREPOSITIONAL_PHRASE`'s own object lives here), `parent_clause`,
`start_position`/`end_position` (token indices, end exclusive),
`open_obligations`, `validation` (7.6), `confidence`, `alternatives`
(`Interpretation` records, section 2), `errors` (12).

**`Phrase.read(tokens, *, context, start_index=0, end_index=None,
parent_clause=None, grammar=None)`**: one delegation to
`context.phrase_reader.read(...)` -- no grammar or sequencing logic of
its own. `PhraseReader` (`role/phrase_reader.py`) tries every
`PhraseType` at `start_index` (a `NOUN_PHRASE` and a `VERB_PHRASE` can
both plausibly start at the same ambiguous token, e.g. "state" is
seeded `NOUN`/`VERB`), ranks every completed candidate with
`ReadingScorer` (8.4), and materialises only the winner into
tensor-backed `Word`s (`GraphProcessor.materialise_token`) -- every
other candidate stays an `Interpretation`, never a second tree of
tensor rows.

Head selection scans `phrase_grammar.head_preference` in priority order
and picks the *last* matching, non-wildcard step (so "the big dog"
heads on "dog"); if nothing in `head_preference` matched (an unseeded
head, e.g. "the cat"), the wildcard step itself stands in as head so the
phrase still has something to point to, correctly staying `UNRESOLVED`
rather than headless.

`PREPOSITIONAL_PHRASE` is the one phrase type `SequenceEngine.find_valid_sequences`
cannot walk alone (its grammar has no POS-to-POS transitions at all --
9.2): `PhraseReader` composes it directly, confirming the `PREPOSITION`
start via `SequenceEngine.get_allowed_next_states`, then recursing into
a nested `NOUN_PHRASE` via `SequenceEngine.nested_phrase_for`.
`INFINITIVE_PHRASE` is lexically anchored ("to" is seeded only as
`PREPOSITION` -- there is no seeded `PARTICLE` sense) -- its marker is
matched by token *text*, never by relabelling a seeded part of speech
(9.2).

### 5. Clause

`data/clause.py`. A grammatical unit built from one or more `Phrase`s,
centred on a single finite predicate.

**Fields** (beyond the write path's existing `tokens`,
`is_independent`): `clause_type` (7.2 -- only `INDEPENDENT` has a
populated template, see 9.3), `phrases`, `subject`/`predicate`/`object`/
`complement`/`modifiers`, `finite_verb`, `nested_clauses` (always empty
in this phase -- 15), `start_position`/`end_position`, `validation`,
`confidence`, `alternatives`, `errors`.

**`Clause.read(tokens, *, context, start_index=0, end_index=None,
grammar=None)`**: delegates to `context.clause_reader.read(...)`.
`ClauseReader` (`role/clause_reader.py`) reads its span as a sequence of
`Phrase`s (repeatedly calling `PhraseReader.read` and advancing past
each result), then assigns each phrase a clause role against
`GrammarConfigurator.clause_element_templates[ClauseType.INDEPENDENT]`
(9.3): the first phrase matching `subject_phrase_types` before any
predicate is found becomes the subject; the first phrase matching
`predicate_phrase_types` becomes the predicate; after the predicate, the
first phrase matching `complement_phrase_types` becomes either the
object or the complement -- **object** unless the predicate's own head
word is a closed set of copular/linking forms (`is`, `are`, `was`,
`were`, `be`, `been`, `being`, `am`), in which case it's a
**complement** ("A meaning IS a representation." -> complement, not
object); everything else attaches as a modifier. This is a hand-picked
lexical set, not a morphological transitivity test -- real
transitivity/linking-verb classification isn't seeded data this phase
has access to.

**Clause validity is not simply the worst of its phrases' validity**
(11.2): spec's own worked example, "The fox over the dog." (with `fox`/
`dog` seeded), has two individually `VALID` phrases (a `NOUN_PHRASE`, a
`PREPOSITIONAL_PHRASE`) but an `INVALID` clause, because no
`VERB_PHRASE` predicate exists at all. `ClauseReader._validate` combines
its own template-level check (`subject_required`/`predicate_required`/
`predicate_head_requires`) with the worst outcome among its phrases --
whichever is worse wins.

"Finite verb" in this phase is approximated as *any* `VERB_PHRASE` whose
head is `PartOfSpeech.VERB` (`predicate_head_requires`, 9.3) -- real
tense/finiteness morphology is section 15 work. This approximation still
correctly flags a clause with no `VERB_PHRASE` at all as missing its
finite verb, which is the shape the worked example above needs.

### 6. Sentence

`data/sentence.py`. The top-level read/write unit: one or more `Clause`s
plus terminal punctuation.

**Fields** (beyond the write path's existing `clauses`,
`requires_punctuation`): `tokens` (every materialised `Word` in the
sentence, clause tokens plus terminal punctuation), `sentence_type` (7.3
-- only `DECLARATIVE` has a populated template, see 9.4),
`selected_parts_of_speech`, `punctuation`, `validation`, `confidence`,
`alternatives`, `errors`.

**`Sentence.read(text_or_tokens, *, context, grammar=None)`**:
delegates to `context.sentence_reader.read(...)`. Accepts either raw
text (tokenised via `TokenResolver.resolve_sentence` as exactly one
sentence -- splitting a longer string into several sentences is
`LinguisticController.read_text`'s job, 14.2, not this method's) or an
already-resolved `TokenReading` sequence. `SentenceReader`
(`role/sentence_reader.py`) splits off trailing punctuation, reads the
remainder as one `ClauseType.INDEPENDENT` clause (5 -- this phase reads
exactly one clause per sentence, 15), and checks the punctuation and
overall outcome against `sentence_templates[SentenceType.DECLARATIVE]`.

### 7. Enumerations

All integer-valued, sequentially assigned, for direct use as tensor
codes (Design Principle 12 -- same convention `PartOfSpeech`/
`LinguisticUnitKind` already use).

7.1 **`PhraseType`** (`data/phrase_type.py`) -- `NOUN_PHRASE`,
`VERB_PHRASE`, `ADJECTIVE_PHRASE`, `ADVERB_PHRASE`,
`PREPOSITIONAL_PHRASE`, `INFINITIVE_PHRASE`.

7.2 **`ClauseType`** (`data/clause_type.py`) -- `INDEPENDENT`,
`DEPENDENT`, `RELATIVE`, `COORDINATED`. Only `INDEPENDENT` has a
populated `ClauseTemplate` this phase (15).

7.3 **`SentenceType`** (`data/sentence_type.py`) -- `DECLARATIVE`,
`INTERROGATIVE`, `IMPERATIVE`, `EXCLAMATORY`. Only `DECLARATIVE` has a
populated `SentenceTemplate` this phase (15).

7.4 **`LinguisticScope`** (`data/linguistic_scope.py`) -- `SENTENCE`,
`CLAUSE`, one per `PhraseType` (7.1), `RELATIVE_CLAUSE`, `COORDINATION`,
`ENUMERATION`, `PARENTHETICAL`, `QUOTATION`. `RELATIVE_CLAUSE`,
`PARENTHETICAL`, `QUOTATION`, and `ENUMERATION` are defined for a stable
value space but not yet opened by any rule this phase (15).

7.5 **`ObligationKind`** (`data/sequencing_obligation.py`) -- see 10 for
the worked list and 9.5 for discharge conditions.

7.6 **`ValidationOutcome`** (`data/validation_outcome.py`) --
`INVALID` (0), `UNRESOLVED` (1), `VALID` (2). `UNRESOLVED` means
sequencing could not reach a conclusion (an unknown word blocked a
required slot); `INVALID` means sequencing reached a definite negative
conclusion (e.g. no finite predicate). Ordered so `min(outcomes,
key=lambda o: o.value)` picks the worst one (11.2), and `ReadingScorer`
ranks `VALID` above `UNRESOLVED` above `INVALID` (8.4).

7.7 **`ReadingErrorKind`** (`data/reading_error.py`) -- all sixteen
kinds, see 12.

### 8. Sequencing Engine

`role/sequence_engine.py`. One `SequenceEngine` instance per
`LinguisticController`, held by `ReadingContext.sequence_engine` (13.6)
and consulted by every reader.

8.1 **Primitive state-table queries**: `get_allowed_next_states(current_state,
phrase_grammar)` (returns `phrase_grammar.start_states` when
`current_state=None`), `validate_transition(from_state, to_state,
phrase_grammar)`, `nested_phrase_for(phrase_grammar, state)` (looks up
`nested_phrase_after` -- `PREPOSITIONAL_PHRASE`'s own continuation, 4).

8.2 **`find_valid_sequences(tokens, start_index, phrase_type,
end_index=None)`**: a bounded beam search (width 8, capped at
`grammar.max_sequence_search_nodes` total nodes explored -- an early
prototype's naive exhaustive search hit a 200k-node cap on one
14-token sentence) walking `phrase_type`'s `PhraseGrammar` transition
table token by token. Handles the five phrase types with an ordinary
POS transition table (or, for `INFINITIVE_PHRASE`, a lexical marker via
`_find_marker_sequences`) directly; always returns an empty tuple for
`PREPOSITIONAL_PHRASE` (composed by `PhraseReader` instead, 4).

An unresolved (unseeded) token becomes a wildcard state, admissible at
*any* position (start or continuation) inside a
`grammar.unknown_token_absorbing_scopes` phrase (`NOUN_PHRASE`,
`VERB_PHRASE` by default, 9.6), satisfying and discharging no
obligation, forcing the enclosing phrase to `UNRESOLVED`. The token
immediately after a wildcard is checked against *every* state the
grammar can ever be in (not one specific transition row), since the
wildcard's real part of speech is unknowable -- permissive, but still
bounded to this grammar's own small, fixed state set.

8.3 **`validate_sequence(path)`**: `UNRESOLVED` if any step (including
in a nested `PREPOSITIONAL_PHRASE` object) is a wildcard; `INVALID` if
any obligation is still open (own or nested); `VALID` otherwise.

8.4 **`rank_sequences(paths, tokens)` / `scoring_factors(path, tokens)`**:
delegates to `ReadingScorer` (`role/reading_scorer.py`). `rank_key` is a
tuple ordered so ascending sort places the best candidate first:
validation outcome, then **span length** (maximal munch -- among
equally-valid candidates starting at the same position, the longer
completion wins, e.g. "the meaning and the word" reads as one
coordinated `NOUN_PHRASE` rather than stopping at "the meaning" and
leaving a stray "and" to be read as its own seeded `VERB` sense),
unresolved-token count, undischarged-obligation count, `abs(finite_verb_phrase_count
- 1)` (clause/sentence level only), phrase count, lexical evidence sum,
then `candidate_rank_index_sum` -- a final tie-break preferring
`identify_word`'s own top-ranked seeded sense for each token, so that
when nothing structural distinguishes two readings, the higher-confidence
seeded sense wins rather than an accidental ordering (e.g. `PhraseType`
declaration order). `confidence(factors, tie_count=1)` is a separate
`[0, 1]` estimate (`base_validity * obligation_factor * ambiguity_factor
* tie_factor`), distinct from the ordering `rank_key` gives.

### 9. Grammar Configuration

`role/grammar_configurator.py`. Every table below is built by a
deferred-import factory function (`_build_*`, passed to
`field(default_factory=...)`) -- `PartOfSpeech` is imported inside the
factory, never at module scope (Design Principle 2's import-cycle
constraint).

9.1 **`PhraseGrammar`** (one per `PhraseType`): `start_states`,
`transitions` (`Dict[PartOfSpeech, FrozenSet[PartOfSpeech]]`),
`end_states`, `head_preference`, `obligations_raised`
(`Dict[PartOfSpeech, ObligationKind]`), and, for the two phrase types
that need them, `nested_phrase_after` (`PREPOSITIONAL_PHRASE`) and
`marker_forms`/`marker_next_states`/`marker_obligation`
(`INFINITIVE_PHRASE`).

9.2 **Concrete Phase 1 values**, hand-verified against the live seeded
Common Dictionary:

- `NOUN_PHRASE`: `DETERMINER`/`NUMERAL`/`ADJECTIVE` precede a
  `NOUN`/`PROPER_NOUN`/`PRONOUN`/`NUMERAL` head; `NOUN`/`PROPER_NOUN`
  continue *only* via `CONJUNCTION` (coordination, "cats and dogs"),
  never via a bare `NOUN`->`NOUN` self-loop -- an unrestricted
  compound-noun chain is too eager against an ambiguous `NOUN`/`VERB`
  word (e.g. "word use the state" would otherwise swallow "use" into
  the subject instead of leaving it available as the clause's verb).
- `VERB_PHRASE`: end states are `VERB`/`PARTICLE`, **deliberately
  excluding `AUXILIARY`** -- a bare "is"/"have"/"been" never completes a
  `VERB_PHRASE` on its own. This is what makes "is" resolve to `VERB`
  (not `AUXILIARY`) in "A meaning is a representation.": `AUXILIARY` is
  a valid *start* but not a valid *end*, so the single-token reading
  "is"=`AUXILIARY` never completes and loses to "is"=`VERB`.
- `PREPOSITIONAL_PHRASE`: `start_states={PREPOSITION}`, no ordinary
  transitions or end states -- see 8.2. `PREPOSITION` raises
  `PREPOSITION_REQUIRES_OBJECT`, discharged by `nested_phrase_after`
  producing at least one candidate `NOUN_PHRASE` (discharge is
  structural -- the object existing at all -- not contingent on the
  object's own validity, 8.3).
- `INFINITIVE_PHRASE`: `marker_forms={"to"}` (text-matched, since "to"
  is seeded only as `PREPOSITION`), `marker_next_states={VERB}`.

9.3 **`ClauseTemplate`** (`clause_element_templates`): only
`ClauseType.INDEPENDENT` is populated -- `subject_phrase_types={NOUN_PHRASE}`,
`predicate_phrase_types={VERB_PHRASE}`, `object_phrase_types={NOUN_PHRASE}`,
`complement_phrase_types={NOUN_PHRASE, ADJECTIVE_PHRASE}`,
`modifier_phrase_types={ADVERB_PHRASE, PREPOSITIONAL_PHRASE}`,
`subject_required=True`, `predicate_required=True`,
`predicate_head_requires={VERB}`.

9.4 **`SentenceTemplate`** (`sentence_templates`): only
`SentenceType.DECLARATIVE` is populated -- `clause_types={INDEPENDENT}`,
`min_clauses=max_clauses=1` (this phase's own scope boundary: one
independent clause per sentence, non-recursive, 15), `terminal_punctuation={"."}`.

9.5 **`obligation_discharges`** (`Dict[ObligationKind, FrozenSet[PartOfSpeech]]`):
see 10 for the full worked table.

9.6 **`unknown_token_absorbing_scopes`** (default `{NOUN_PHRASE,
VERB_PHRASE}`) and **`coordinable_scopes`** (the four open-class phrase
scopes) -- see 8.2 and 9.2.

9.7 **`max_sequence_search_nodes`** (4000), **`max_alternative_interpretations`**
(3) -- search/retention bounds, 8.2 and Design Principle "retain
ambiguity, don't collapse it prematurely."

9.8 **`GrammarConfigurator.validate_against_vocabulary()`**: runs at
`LinguisticController.__init__` time. Checks every rule table for
internal consistency -- every raised obligation has a discharge entry,
every `head_preference` entry is a reachable state, every phrase type
can actually close (via `end_states`, a marker, or `nested_phrase_after`),
every `ClauseTemplate`/`SentenceTemplate` cross-reference resolves. A
typo in a rule table fails here, at construction time, not mid-parse.

### 10. Scopes and Obligations

A scope (7.4) is what makes adjacent-state-transition validity
insufficient on its own: the same part-of-speech pair can be valid in
one scope and invalid in another, and a scope can raise obligations that
must be discharged before it's allowed to close. `SequencingObligation`
(`kind`, `scope`, `raised_at_index`, `description`) is one instance of
an obligation raised during sequencing.

| `ObligationKind` | Raised by | Discharged by | Phase |
|---|---|---|---|
| `DETERMINER_REQUIRES_NOMINAL_HEAD` | `DETERMINER` in `NOUN_PHRASE` | `NOUN`/`PROPER_NOUN`/`NUMERAL` | 1 |
| `PREPOSITION_REQUIRES_OBJECT` | `PREPOSITION` in `PREPOSITIONAL_PHRASE` | a nested `NOUN_PHRASE` existing | 1 |
| `AUXILIARY_REQUIRES_COMPATIBLE_VERB_FORM` | `AUXILIARY` in `VERB_PHRASE` | `VERB` | 1 |
| `INFINITIVE_MARKER_REQUIRES_BASE_VERB` | the "to" marker in `INFINITIVE_PHRASE` | `VERB` | 1 |
| `CONJUNCTION_REQUIRES_COORDINATED_ELEMENT` | `CONJUNCTION` in a coordinable scope | any open-class/determiner part of speech | 1 |
| `DECLARATIVE_CLAUSE_REQUIRES_FINITE_VERB` | `ClauseType.INDEPENDENT`'s own template | `VERB`-headed `VERB_PHRASE` | 1 |
| `RELATIVE_PRONOUN_OPENS_RELATIVE_CLAUSE` | -- | -- | 2 |
| `QUOTATION_MUST_CLOSE` | -- | -- | 2 |
| `PARENTHETICAL_MUST_CLOSE` | -- | -- | 2 |

A phrase/clause/sentence is not `VALID` while any obligation it raised
remains undischarged (11).

### 11. Validation

Three levels, each with its own `ValidationOutcome` (7.6):

11.1 **Phrase**: `SequenceEngine.validate_sequence` (8.3) -- `UNRESOLVED`
if any step (including a nested `PREPOSITIONAL_PHRASE` object) is a
wildcard, `INVALID` if any obligation is open, `VALID` otherwise.

11.2 **Clause**: `ClauseReader._validate` (5) -- combines its own
template check (subject/predicate/finite-verb presence) with the worst
outcome among its phrases (`min` by `ValidationOutcome.value`, so
`INVALID` always wins over `UNRESOLVED` wins over `VALID`). This is what
lets "The fox over the dog." (all words seeded) be `INVALID` -- two
individually `VALID` phrases, no predicate at all.

11.3 **Sentence**: `SentenceReader.read` (6) -- starts from the clause's
own outcome, then checks terminal punctuation against
`sentence_templates[SentenceType.DECLARATIVE].terminal_punctuation`.

### 12. Structured Errors

`data/reading_error.py`. `ReadingError` (`kind`, `level`, `message`,
`token_index`, `token_text`, `word_entry_id`,
`seeded_candidate_parts_of_speech`, `current_state`, `expected_states`,
`open_scope`, `unfinished_obligation`) identifies, where applicable,
everything needed to locate and explain a reading failure.

All sixteen `ReadingErrorKind` values are defined from the outset for a
stable value space; the four marked below wait for section 15's
constructs to exist:

`UNKNOWN_VOCABULARY_WORD`, `NO_SEEDED_PART_OF_SPEECH`,
`NO_VALID_PHRASE_SEQUENCE`, `MISSING_PHRASE_HEAD`,
`INCOMPLETE_DETERMINER_SEQUENCE`, `PREPOSITION_MISSING_OBJECT`,
`INFINITIVE_MISSING_VERB`, `NO_VALID_CLAUSE_SEQUENCE`,
`MISSING_PREDICATE`, `MISSING_FINITE_VERB`, `INCOMPLETE_COORDINATION`,
`INVALID_PUNCTUATION_SEQUENCE`, `NO_VALID_SENTENCE_INTERPRETATION`,
`MULTIPLE_EQUALLY_RANKED_INTERPRETATIONS` (emitted this phase);
`UNCLOSED_RELATIVE_CLAUSE`, `UNCLOSED_SCOPE` -- this phase's scopes are
phrase-only, so nothing raises these until relative clauses / quotation
/ parenthetical scopes exist (15).

Errors from a phrase's own nested phrases (a `PREPOSITIONAL_PHRASE`'s
object) are **not** duplicated onto the outer phrase's `errors` -- each
nested `Phrase` carries its own. `Clause`/`Sentence`-level error
collection (`ClauseReader._all_phrase_errors`) walks `nested_phrases`
recursively so every error is still reachable from the sentence, without
storing it twice.

### 13. Reading Pipeline

1. **`TokenResolver.resolve_sentence`/`resolve_text`** (`role/token_resolver.py`)
   -- tokenises via the same `LinguisticLexer` the write path uses, then
   calls `GraphProcessor.process_token_candidates` (13.5) per token,
   keeping every seeded candidate as a `TokenReading` (`data/token_reading.py`).
2. **`PhraseReader.read`** (4) -- for a token span, tries every
   `PhraseType`, ranks the results (8.4), materialises the winner.
3. **`ClauseReader.read`** (5) -- repeatedly calls `PhraseReader.read`
   across its span, assigns clause roles, validates.
4. **`SentenceReader.read`** (6) -- splits off punctuation, calls
   `ClauseReader.read` once, checks against the sentence template.
5. `GraphProcessor.process_token` is **split, not replaced**:
   `process_token_candidates` (resolves + keeps every candidate, no
   tensor row) and `materialise_token` (turns one chosen candidate into
   a tensor-backed `Word`, same as `process_token` always did) compose
   so that `process_token` itself is now a two-line wrapper calling both
   with `candidates[0]` -- byte-for-byte identical to its pre-split
   behaviour (verified against `examples/physics_domain_seeding.py`).
6. **`ReadingContext`** (`role/reading_context.py`) bundles `grammar`,
   `sequence_engine`, `token_resolver`, `phrase_reader`, `clause_reader`,
   `sentence_reader`, `graph_processor` -- built once by
   `LinguisticController.__init__`, held as `LinguisticController.reading_context`,
   and passed explicitly to `Phrase.read()`/`Clause.read()`/`Sentence.read()`
   rather than those methods reaching for a controller directly. This
   keeps them testable in isolation (a test can build a `ReadingContext`
   by hand around a bare `GrammarConfigurator`) while every real call
   still goes through the one controller-owned instance.
7. **`LinguisticController.read_sentence(text)`** / **`read_text(text)`**
   -- the public entry points. `read_text` splits multi-sentence input
   the same way `tokenize_prompt` does (`LinguisticLexer.split_sentences`)
   and reads each sentence independently (no cross-sentence discourse
   structure exists yet, 15).

### 14. Graph Construction

Every `Phrase`/`Clause`/`Sentence` the winning reading produces gets its
own `LinguisticSystemProperty` tensor row (`GraphProcessor.create_property_wrapper`,
origin `"PhraseReader_ReadLayer"` / `"ClauseReader_ReadLayer"` /
`"SentenceReader_ReadLayer"`) -- the same tensor, same `LinguisticUnitKind`
convention (`LinguisticUnitKind.Phrase = 7`, appended, never renumbered)
the write path already uses. A candidate that loses ranking is never
materialised -- it stays a lightweight `Interpretation` record (4, 8.4),
so retaining several alternatives never allocates several trees' worth
of tensor rows. `Sentence -> Paragraph -> Subject` containment above the
sentence level, and the tensor conventions generally, are unchanged from
the write path. No Knowledge Layer concepts (concepts, semantic
relationships) are created anywhere in this pipeline.

### 15. Not Yet Built

Deferred to a later phase, not built or stubbed with fake behaviour in
this change:

- **Clause-level recursion**: relative clauses (`ClauseType.RELATIVE`),
  subordinate/dependent clauses (`ClauseType.DEPENDENT`), and
  coordinated clauses (`ClauseType.COORDINATED`) -- all three are
  defined in `ClauseType` (7.2) for a stable value space, but
  `ClauseReader` only ever attempts `ClauseType.INDEPENDENT`; a sentence
  that would need one of the other three is reported `UNRESOLVED`, never
  guessed. This is also why `SentenceTemplate.max_clauses=1` for
  `DECLARATIVE` (9.4) -- multi-clause sentences are this same boundary.
- **Quotation and parenthetical scopes** (`LinguisticScope.QUOTATION`/
  `PARENTHETICAL`, `ObligationKind.QUOTATION_MUST_CLOSE`/
  `PARENTHETICAL_MUST_CLOSE`, `ReadingErrorKind.UNCLOSED_SCOPE`) --
  defined for a stable value space, never opened by any rule this phase.
- **Real morphological agreement scoring**. `LinguisticController`
  accepts an optional `lexical_relationships` constructor parameter,
  plumbed through now (a one-time signature change) but unused by every
  reader this phase -- roughly half of the seeded noun/verb forms lack
  `PLURAL_FORM`/`THIRD_PERSON_FORM` edges, so real subject-verb agreement
  checking will only ever be safe as a `ReadingScorer` ranking bonus
  (confirmed agreement adds confidence; absent data stays neutral),
  never a hard validity gate.
- **Imperative / implicit-subject clauses** -- `SentenceType.IMPERATIVE`
  is defined (7.3) but never produced; `ClauseTemplate.subject_required`
  has no per-clause-type override yet.
- **Interrogative and exclamatory sentences** -- `SentenceType.INTERROGATIVE`/
  `EXCLAMATORY` are defined (7.3) but never produced.
- **Semantic decomposition** -- breaking a read `Clause`/`Sentence` down
  into its constituent semantic units and relations (who did what to
  whom, under what condition), not just the syntactic tree this layer
  builds. The tree this layer produces (write path and now read path
  alike) is structural; it doesn't yet represent *meaning*. This is
  Knowledge Layer work, not Linguistics Layer work.
- **Semantic disambiguation** -- as distinct from the **syntactic**
  disambiguation this change *does* build (choosing among a word's
  seeded *parts of speech* by grammatical context, section 8) --
  choosing among two candidates that share one part of speech (e.g. the
  Common Dictionary's `sense` having two distinct seeded `NOUN` senses
  under different `domain_tag`s). Nothing in this layer attempts that;
  `TokenReading.candidate_parts_of_speech()` deliberately deduplicates by
  part of speech precisely because sequencing operates at that
  granularity and no finer.

Both semantic items above are prerequisites for treating this layer's
output as meaningful input elsewhere, not incremental improvements to
bolt on after the fact.
