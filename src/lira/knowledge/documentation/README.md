# Knowledge Layer

The only layer that assigns semantic meaning (Rule 20) -- qualifies
Value Objects through Concepts, Attributes and Relationships. Also the
repository's home for core Host and Domain artefacts generally, not
just Knowledge-layer-specific ones (see ARCHITECTURE.md's Repository
Layout section).

See the repository root's `ARCHITECTURE.md` for the full component tree
and design rules.

See `knowledge_vector_space_specification.md` for the full semantic and
mathematical definition of the Knowledge Vector Space -- the six-dimension
tensor geometry (`K = (D1, D2, D3, D4, D5, D6)`) underlying Concept,
Relationship and Domain structure: noun generalisation/composition (D1/D2),
Relationship generalisation/composition and mechanics including PAD
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
  talking to the Kubernetes/WASI substrate).
- `api/`, `ui/`, `assets/` -- none yet.
