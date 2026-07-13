# Knowledge Layer

The only layer that assigns semantic meaning (Rule 20) -- qualifies
Value Objects through Concepts, Attributes and Relationships.

See the repository root's `ARCHITECTURE.md` for the full component tree
and design rules.

## Layout

- `data_classes/` -- `KnowledgeLayer`; `TensorLiraGraph` (the dense,
  persistent confidence/provenance/temporal/activation tensors) and its
  reference/view types (`ConceptRef`, `SystemPropertyRef`,
  `RelationshipRef`) and enums (`ConceptKind`, `FactOrigin`, `Band`,
  `ValueTypeKind`).
- `agents_role/` -- `KnowledgeAgent` and the Band 1-5 concrete agents
  (`BindAgent`, `InferAgent`, `TrainAgent`, `EvaluateAgent`,
  `PromoteAgent`, `CompartmentaliseAgent`).
- `apis/`, `uis/`, `assets/` -- none yet.
