# Knowledge Layer

The only layer that assigns semantic meaning (Rule 20) -- qualifies
Value Objects through Concepts, Attributes and Relationships. Also the
repository's home for core Host and Domain artefacts generally, not
just Knowledge-layer-specific ones (see ARCHITECTURE.md's Repository
Layout section).

See the repository root's `ARCHITECTURE.md` for the full component tree
and design rules.

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
