/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/value_objects/data/measure
 * │ Filename        │ measure.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-04
 * │ Modified Date   │ 2026-10-04
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Measure: the CCTS Measure. Type value object.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/value_objects/data/measure
 * @file measure.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/** Measure. Type, per the UN/CEFACT Core Components Technical
 * Specification (CCTS) Core Component Type catalogue (Layer Summary:
 * Value Objects Layer). Ported from value_objects/data/measure.py;
 * `value` is a plain `number` here rather than Python's `Decimal` --
 * Number_'s own docstring (value_objects/data/number.ts) on why: the
 * browser has no arbitrary-precision decimal type in the standard
 * library, and the source data (seeded cache JSON) only ever carries
 * ordinary floats. */
export interface Measure {
  value: number;
  unitCode?: string;
  unitCodeListId?: string;
  unitCodeListAgencyId?: string;
  unitCodeListAgencyName?: string;
}

export function measure(value: number, extra: Omit<Measure, "value"> = {}): Measure {
  return { value, ...extra };
}
