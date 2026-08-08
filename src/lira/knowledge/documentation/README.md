# Knowledge Layer

The only layer that assigns semantic meaning (Rule 20) -- qualifies
Value Objects through Concepts, Attributes and SemanticNeuralRelationships. Also the
repository's home for core Host and Domain artefacts generally, not
just Knowledge-layer-specific ones (see ARCHITECTURE.md's Repository
Layout section).

See the repository root's `ARCHITECTURE.md` for the full component tree
and design rules.

See `knowledge_vector_space_specification.md` for the full semantic and
mathematical definition of the Knowledge Vector Space -- the six-dimension
tensor geometry (`K = (D1, D2, D3, D4, D5, D6)`) underlying Concept,
SemanticNeuralRelationship and Domain structure: noun generalisation/composition (D1/D2),
SemanticNeuralRelationship generalisation/composition and mechanics including PAD
amplitude and operator state (D3/D4), Domain generalisation/composition
(D5/D6), synonym/antonym geometry, Euclidean semantic distance and identity
evidence, completeness rules, and the runtime evolution loop (seeding,
incremental re-indexing, and Unknown-placeholder recovery for open
causal/entailment chains). Its Section 41 (v2) makes the model
implementable: D3/D4 orthogonality, PAD-magnitude radius derivation,
configurable identity thresholds, worked numeric examples, part-of-speech
scoping, the Domain Naming Convention -> D5/D6 mapping, NaN storage
separation, antonym-over-synonym placement precedence, fractional
hierarchy indexing, a companion audit checklist, and an explicit
`LexicalRelationshipType` -> dimension mapping table.

## Layout

- `data/` -- `KnowledgeLayer`; `TensorLiraGraph` (the dense, persistent
  confidence/provenance/temporal/activation tensors) and its
  reference/view types (`ConceptRef`, `SystemPropertyRef`,
  `RelationshipRef`) and enums (`ConceptKind`, `FactOrigin`, `Band`,
  `ValueTypeKind`); `Domain`, `DomainSystemProperties`,
  `DomainSystemTensor`, `KnownDomains`; `LIRAHost`,
  `HostSystemProperties`, `HostSystemTensor`, `HostedDomains`,
  `KnownHosts`; the shared `NamedTensor`/`NamedTensorProperties` base
  (`tensor_view.py`).
- `agents/` -- `KnowledgeAgent` and the Band 1-5 concrete agents
  (`BindAgent`, `InferAgent`, `TrainAgent`, `EvaluateAgent`,
  `PromoteAgent`, `CompartmentaliseAgent`); `DomainAgent`.
- `role/` -- `DomainController`, `HostController` (LIRA's own class for
  talking to the Kubernetes/WASI substrate); `DictionarySeeder`
  (materialises a Vocabulary Layer Dictionary/LexicalRelationshipStore
  into a `TensorLiraGraph`'s Concepts/edges, spec 41.11);
  `run_vector_space_passes` (`vector_space_passes.py` -- causal/
  entailment chain detection and assignment, then a closing audit, run
  once over an already-seeded graph, before any view renders it).
- `ui/` -- `LiraView` (combines `DictionaryView` and
  `SentenceReaderView` into one tabbed offline page); `KnowledgeView`
  (draws a seeded `TensorLiraGraph`'s own D1-D6 Knowledge Vector Space
  geometry graphically, with an embedded `DictionaryView` tab a Concept
  node can pivot straight to for its backing Word).
- `assets/example_ui/` -- pre-generated `LiraView`/`KnowledgeView`
  output, open directly in a browser.
- `api/` -- none yet.
