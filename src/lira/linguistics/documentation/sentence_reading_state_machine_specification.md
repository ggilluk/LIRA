# LIRA Linguistics Layer -- Sentence Reading State Machine Specification

Version 2 -- aligned to the current deterministic reader and scoped
tensor-learning extension.

Each heading below carries a status tag: `[Built]` describes the reader
as it exists today (`SequenceEngine`, `GrammarConfigurator`,
`ReadingScorer`); `[Proposed]` describes a scoped future learning phase
that has not been implemented; `[Deferred]` describes scope explicitly
excluded from the current phase; combined tags mark sections that
describe both.

## 1. Purpose `[Built + Proposed]`

The LIRA Linguistics Layer Sentence Reading State Machine is a
deterministic, confidence-ranked sentence reader. The current
implementation uses seeded vocabulary, phrase-specific grammars,
sequencing obligations, bounded multi-path search, clause templates,
deterministic validation and `ReadingScorer` ranking. A future scoped
phase adds learned lexical transition evidence without replacing or
competing with the existing scoring mechanism.

Deterministic validity constrains interpretation; ranking selects among
valid or unresolved candidates; future learning contributes lexical
evidence.

**Statistical preference must not override deterministic validity.**

## 2. Current Working Baseline `[Built]`

The current baseline is already executable and visible through
`examples/linguistics_sentence_reader_ui.py` and
`linguistics/ui/sentence_reader_server.py`. It exposes confidence
scores at phrase, clause and sentence level and a full
per-token-position attempt trace. The missing capability is
persistence and update of learned evidence across observations.

- `SequenceEngine` performs bounded sequence search.
- `GrammarConfigurator` supplies phrase grammars and clause/sentence
  templates.
- `ReadingScorer.rank_key` deterministically ranks candidate
  interpretations.
- `ValidationOutcome` is the primary validity ordering.
- `Interpretation.alternatives` retains non-selected candidate
  interpretations.

## 3. Layer Responsibility `[Built]`

- Read linear text and construct token readings.
- Resolve seeded vocabulary and candidate Parts of Speech.
- Build candidate phrase sequences using phrase-specific deterministic
  grammars.
- Raise and discharge sequencing obligations.
- Assign phrase candidates to clause roles.
- Validate and rank complete interpretations.
- Expose confidence, errors and attempt traces.
- Produce Linguistics Layer structures for later Knowledge Layer
  interpretation.

The pipeline does not create Knowledge Layer objects.

## 4. Input Model `[Built + Future Surfacing]`

The concrete `TokenReading` input contains: `text`, `token_index`,
`sentence_index`, `is_sentence_start`, and `candidates`.

Lemma, morphology, Domain and confidence may be available today through
the underlying `Word`/`WordIdentification` associated with a candidate.
They are not asserted as direct `TokenReading` fields. Surfacing these
values directly at token level is a future convenience where not
already exposed.

```
UnknownWord != GrammarError
```

## 5. Phrase-Specific Deterministic Grammars `[Built]`

There is no single flat POS truth table. `GrammarConfigurator.phrase_grammars`
maintains an independent sequencing grammar for each `PhraseType`. Each
grammar owns its start states, transitions, end states and sequencing
obligations.

| PhraseType | Role |
|---|---|
| `NOUN_PHRASE` | Nominal phrase sequencing |
| `VERB_PHRASE` | Verb and auxiliary sequencing |
| `ADJECTIVE_PHRASE` | Adjectival sequencing |
| `ADVERB_PHRASE` | Adverbial sequencing |
| `PREPOSITIONAL_PHRASE` | Preposition plus object sequencing |
| `INFINITIVE_PHRASE` | Infinitive marker plus compatible verb sequencing |

Cross-phrase clause composition is deliberately separate from
within-phrase POS sequencing.

## 6. Sequencing Obligations `[Built]`

Validity is obligation-based rather than a static forbidden-pair
lookup. A state may raise a `SequencingObligation` that must be
discharged by a compatible later state.

| Obligation | Required discharge |
|---|---|
| `DETERMINER_REQUIRES_NOMINAL_HEAD` | A compatible nominal head |
| `PREPOSITION_REQUIRES_OBJECT` | An object phrase |
| `AUXILIARY_REQUIRES_COMPATIBLE_VERB_FORM` | A morphologically compatible verb form |
| `INFINITIVE_MARKER_REQUIRES_BASE_VERB` | A base-form verb |
| `CONJUNCTION_REQUIRES_COORDINATED_ELEMENT` | A compatible coordinated element |
| `DECLARATIVE_CLAUSE_REQUIRES_FINITE_VERB` | A finite verb phrase |

```
Open obligation at completion => INVALID
```

A wildcard/unknown step can keep an interpretation unresolved without
making it invalid.

## 7. Clause Role Assignment `[Built]`

Phrase construction and clause composition are separate stages.
`ClauseTemplate` assigns complete phrase candidates to permitted clause
roles.

| Clause role | Typical phrase-type set / rule |
|---|---|
| Subject | Nominal-capable phrase types permitted by the `ClauseTemplate` |
| Predicate | Finite `VERB_PHRASE` satisfying the declarative finite-verb obligation |
| Object | Object-compatible phrase types following a non-copular predicate |
| Complement | Complement-compatible phrase types; used after lexical copular verbs |
| Modifier | Modifier-capable phrase types permitted by the `ClauseTemplate` |

Lexical copular verbs -- `is`, `are`, `was`, `were`, `be`, `been`,
`being`, `am` -- select a complement rather than an object.

## 8. Validation Outcomes and Error Granularity `[Built]`

Candidate and final validation align exactly with `ValidationOutcome`
ordering:

```
VALID = 2  >  UNRESOLVED = 1  >  INVALID = 0
```

`UNRESOLVED` represents incomplete knowledge such as wildcard
absorption. `INVALID` represents failed deterministic obligations or
structure.

| ReadingErrorKind | Meaning / failure locus |
|---|---|
| `UNKNOWN_VOCABULARY_WORD` | Vocabulary resolution |
| `NO_SEEDED_PART_OF_SPEECH` | Vocabulary/POS resolution |
| `NO_VALID_PHRASE_SEQUENCE` | Phrase sequencing |
| `MISSING_PHRASE_HEAD` | Phrase completeness |
| `INCOMPLETE_DETERMINER_SEQUENCE` | Open determiner obligation |
| `PREPOSITION_MISSING_OBJECT` | Open preposition obligation |
| `INFINITIVE_MISSING_VERB` | Open infinitive obligation |
| `NO_VALID_CLAUSE_SEQUENCE` | Clause composition |
| `MISSING_PREDICATE` | Clause role assignment |
| `MISSING_FINITE_VERB` | Finite-verb requirement |
| `INCOMPLETE_COORDINATION` | Open coordination obligation |
| `INVALID_PUNCTUATION_SEQUENCE` | Punctuation sequencing |
| `NO_VALID_SENTENCE_INTERPRETATION` | Sentence-level selection |
| `MULTIPLE_EQUALLY_RANKED_INTERPRETATIONS` | Ambiguous top rank |
| `UNCLOSED_RELATIVE_CLAUSE` | Reserved/structural closure failure |
| `UNCLOSED_SCOPE` | Scope closure failure |

## 9. Bounded Multi-Path Reading Algorithm `[Built]`

The reader is not a single-token greedy argmax. It performs bounded
multi-path search and ranks completed candidates afterward.

1. Run a bounded beam search over the token span for each applicable
   `PhraseType`. Beam width is 8 and total exploration is capped by
   `max_sequence_search_nodes`.
2. Produce complete candidate `SequencePath` objects.
3. Validate each candidate: `VALID` when deterministic requirements are
   satisfied; `INVALID` when obligations remain open; `UNRESOLVED` when
   wildcard/unknown steps prevent full resolution.
4. Compose phrase candidates into the currently supported clause
   template.
5. Rank complete interpretations with `ReadingScorer.rank_key`.
6. Select the top-ranked interpretation and retain remaining candidates
   in `Interpretation.alternatives`.

`ReadingScorer.rank_key` orders candidates by:

- Validation outcome.
- Span length / maximal-munch preference.
- Unresolved-token count.
- Undischarged-obligation count.
- `finite_verb_phrase_count` fit.
- Phrase count.
- Lexical evidence.
- Seeded-candidate-rank tie-break.

## 10. Unknown and Invalid Semantics `[Built]`

```
UnknownGrammar != InvalidGrammar
```

Unknown vocabulary or wildcard absorption may produce `UNRESOLVED`.
Deterministic structural failure produces `INVALID`. A rare but valid
structure remains valid because validation precedes lexical evidence in
`rank_key`.

## 11. Sentence and Clause Scope `[Built + Deferred]`

The current declarative sentence scope is `ClauseType.INDEPENDENT` with
`SentenceTemplate.max_clauses = 1`. The specification must therefore
not imply general multi-clause segmentation today.

Relative, dependent and coordinated clause segmentation are deferred
future capabilities, consistent with the Linguistics documentation
"Not Yet Built" scope (see `README.md`, section 15).

Current segmentation/interpretation signals are deterministic
vocabulary, phrase grammars, punctuation, sequencing obligations,
clause templates and scorer factors. Learned transition prevalence is
not a current segmentation signal.

## 12. Punctuation `[Built]`

Punctuation is classified input and participates in deterministic
phrase/sentence sequencing and error reporting. Invalid punctuation
sequences are reported explicitly through
`ReadingErrorKind.INVALID_PUNCTUATION_SEQUENCE`.

## 13. Determinism `[Built]`

For the same token readings, seeded candidates, `GrammarConfigurator`
state, search limits and `ReadingScorer` inputs, the reader must return
the same ranking and interpretation. Candidate rank and deterministic
tie-breaks prevent intrinsic randomness.

## 14. Relationship to the Knowledge Layer `[Built]`

```
LinguisticStructure != KnowledgeStructure
```

The sentence reader resolves linguistic structure only. Knowledge Layer
Concept identity, semantic Relationships, Domain placement, Attributes,
ValueTypes, vector-space mechanics and execution remain downstream
responsibilities.

## 15. Learned Lexical Transition Evidence `[Proposed]`

Persistent learned transition evidence is a scoped future phase. It
must be added explicitly to `linguistics/documentation/README.md`
section 15, "Not Yet Built".

The proposed learned value `w_ij` is not a second scoring tensor or a
replacement for `ReadingScorer`. It feeds the existing
`ScoringFactors.lexical_evidence_sum` field, which is declared but
currently remains `0.0`.

```
w_ij observations -> lexical_evidence_sum -> ReadingScorer.rank_key
```

Because validation outcome is ranked before lexical evidence, learned
statistics cannot make an `INVALID` interpretation outrank a `VALID`
interpretation.

## 16. Proposed Evidence Model `[Proposed]`

For a linguistically relevant transition or candidate association `i ->
j`, learned evidence `w_ij` represents observed lexical support. The
storage representation may be tensor-backed, but its only
sentence-reader scoring interface is `lexical_evidence_sum`.

- Positive evidence comes from independently validated observations.
- Negative/error evidence must remain distinguishable from absence of
  positive evidence.
- Evidence carries observation count, provenance and recency where
  supported.
- The proposal must reuse the existing scoring pipeline rather than
  introduce a competing ranker.

## 17. Proposed Positive Learning `[Proposed]`

```
Validated observation => lexical evidence increases
```

Only validated observations may reinforce lexical evidence. Repetition
changes preference among candidates that remain admissible under
deterministic grammar.

## 18. Proposed Evidence Reduction `[Proposed]`

Evidence may decay or be reduced when an association is repeatedly
rejected in context, superseded by stronger validated evidence, ages,
or is corrected. The decay function is a learning-policy concern and is
not part of deterministic grammar.

## 19. Proposed Multi-Pass Learning `[Proposed]`

```
Read -> Validate -> Accumulate Evidence -> Re-read
```

Across repeated observations, persisted evidence changes
`lexical_evidence_sum` and therefore later tie-breaking/ranking while
leaving deterministic grammar unchanged.

## 20. Proposed Missing-Pattern Discovery `[Proposed]`

If independently validated material repeatedly exposes a linguistic
pattern not covered by current grammar, the observation may become a
grammar-change hypothesis. **Learned lexical evidence alone must never
mutate `GrammarConfigurator`.**

```
Observed pattern -> Evidence -> Review/Validation -> Explicit grammar change
```

## 21. Proposed Controlled Error Learning `[Proposed]`

Validated correct sentences may be transformed into
provenance-preserving controlled corruptions to test and improve error
discrimination. This is a future validation/learning facility, not
current reader behaviour.

- Token-position swaps
- Required-token removal
- Inappropriate insertion
- Agreement corruption
- Phrase-order corruption
- Punctuation corruption

## 22. Proposed Error Exposure Schedule `[Proposed]`

```
ErrorExposure = f(ValidatedCorrectExposure)
```

Negative-example volume should grow only after a sufficient positive
baseline exists. The exact schedule must be calibrated empirically.

## 23. Proposed Positive and Negative Evidence `[Proposed]`

Positive support and confirmed error evidence should remain separate so
that rare valid grammar is not treated as invalid merely because it has
low frequency.

```
Valid but rare != Invalid
```

## 24. Tensor/Storage Scope `[Proposed]`

Any tensor-backed persistence for learned lexical evidence is an
implementation detail of the future learning phase. It must extend the
current `ScoringFactors.lexical_evidence_sum` input and must not create
a parallel sentence-ranking mechanism.

The minimal proposed evidence record is conceptually: transition/
candidate identity, positive evidence, negative evidence, observation
count, provenance and recency.

## 25. Validation and Metrics `[Built + Proposed]`

Current deterministic behaviour can already be tested for
interpretation correctness, traceability and confidence. Future
learning adds convergence and persistence metrics.

| Metric | Status |
|---|---|
| ValidationOutcome accuracy | Built-testable |
| ReadingErrorKind accuracy | Built-testable |
| Alternative interpretation ranking | Built-testable |
| Attempt-trace completeness | Built-testable |
| Confidence/rank stability | Built-testable |
| Lexical evidence improvement | Proposed |
| Passes/observations to convergence | Proposed |
| Error-detection improvement after controlled corruption | Proposed |

## 26. Architectural Invariants `[Built]`

- Statistical preference must not override deterministic validity.
- `UnknownWord != GrammarError`.
- `UnknownGrammar != InvalidGrammar`.
- `LinguisticStructure != KnowledgeStructure`.
- Within-phrase sequencing != cross-phrase clause composition.
- Open deterministic obligation at completion => `INVALID`.
- Wildcard/unknown absorption may yield `UNRESOLVED`.
- `ReadingScorer` remains the single ranking mechanism.

## 27. Current and Future Processing Loops `[Built + Proposed]`

Current:

```
TokenReading -> Candidate POS -> Phrase-specific beam search ->
Obligation validation -> Clause role assignment ->
ReadingScorer.rank_key -> Interpretation + alternatives
```

Future learning extension:

```
Validated observations -> learned w_ij evidence -> lexical_evidence_sum
-> existing ReadingScorer.rank_key
```

The future loop augments the current implementation; it does not
replace `SequenceEngine`, `GrammarConfigurator`, `ValidationOutcome` or
`ReadingScorer`.

## 28. Implementation Status Summary `[Built + Proposed]`

| Capability | Status |
|---|---|
| Seeded candidate vocabulary | Built |
| Phrase-specific deterministic grammars | Built |
| Sequencing obligations | Built |
| Bounded beam search | Built |
| Clause role assignment | Built |
| Independent declarative clause scope | Built |
| ValidationOutcome and ReadingErrorKind reporting | Built |
| ReadingScorer deterministic ranking | Built |
| Confidence and per-token attempt trace UI | Built |
| Interpretation alternatives | Built |
| Persistent learned lexical evidence | Proposed |
| `lexical_evidence_sum` population from learned `w_ij` | Proposed |
| Controlled error learning | Proposed |
| Relative/dependent/coordinated multi-clause segmentation | Deferred |

## 29. Core Architectural Principle `[Built + Proposed]`

LIRA's sentence reader is a deterministic, bounded, multi-path
linguistic interpreter with confidence ranking. The proposed learning
phase adds persisted lexical evidence inside the existing scorer rather
than turning the reader into a probabilistic grammar engine.

Grammar defines admissibility; obligations define completeness; search
preserves alternatives; ranking selects; learning may refine lexical
evidence.
