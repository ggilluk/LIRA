# Value Objects Layer

Parses and normalises primitive values (measures, quantities, codes,
identifiers, dates) into typed `ValueTypeKind` instances before they
enter the Knowledge Layer. Contains typed unqualified data only (Rule 19).

See the repository root's `ARCHITECTURE.md` for the full component tree
and design rules.

## Layout

- `data/` -- `ValueObjectsLayer`; `Text`, `Number`, `Code`,
  `Indicator`, `Quantity`, `BinaryObject` -- Core Component Types from
  the UN/CEFACT Core Components Technical Specification (CCTS), each
  with a content component (`value`) plus that type's supplementary
  components (e.g. `Code.list_id`/`list_agency_id`,
  `Quantity.unit_code`, `BinaryObject.mime_code`/`filename`).
- `agents/` -- `ValueObjectAgent` and its concrete agents
  (`ParseAgent`, `ValidateAgent`, `ConvertAgent`, `NormaliseAgent`).
- `role/`, `api/`, `ui/`, `assets/` -- none yet.
