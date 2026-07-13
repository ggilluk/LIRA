# Value Objects Layer

Parses and normalises primitive values (measures, quantities, codes,
identifiers, dates) into typed `ValueTypeKind` instances before they
enter the Knowledge Layer. Contains typed unqualified data only (Rule 19).

See the repository root's `ARCHITECTURE.md` for the full component tree
and design rules.

## Layout

- `data/` -- `ValueObjectsLayer`.
- `agents/` -- `ValueObjectAgent` and its concrete agents
  (`ParseAgent`, `ValidateAgent`, `ConvertAgent`, `NormaliseAgent`).
- `role/`, `api/`, `ui/`, `assets/` -- none yet.
