/** Numeric. Type, per the UN/CEFACT Core Components Technical
 * Specification (CCTS) Core Component Type catalogue -- a pure numeric
 * value with no supplementary components (Layer Summary: Value Objects
 * Layer). Ported from value_objects/data/number.py; `value` is a plain
 * `number` here rather than Python's `Decimal` -- the browser has no
 * arbitrary-precision decimal type in the standard library, and the
 * source data (seeded cache JSON) only ever carries ordinary floats. */
export interface Number_ {
  value: number;
}

export function number(value: number): Number_ {
  return { value };
}
