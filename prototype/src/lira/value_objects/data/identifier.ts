/** Identifier. Type, per the UN/CEFACT Core Components Technical
 * Specification (CCTS) Core Component Type catalogue (Layer Summary:
 * Value Objects Layer). Ported from value_objects/data/identifier.py,
 * plus two TS-port-only additions with no Python counterpart: `uuid`
 * and `hash` (both below). */
export interface Identifier {
  value: string;
  schemeId?: string;
  schemeName?: string;
  schemeAgencyId?: string;
  schemeAgencyName?: string;
  schemeVersionId?: string;
  schemeDataUri?: string;
  schemeUri?: string;
  /** A fresh v4 UUID naming this Identifier value object instance
   * itself -- distinct from `value`, which names whatever `value` is
   * an Identifier *for* (a Word's own uuid, a WordNet synset id, ...).
   * Auto-assigned by identifier() below unless the caller's own
   * `extra` supplies one. */
  uuid?: string;
  /** A deterministic content hash of `value` (fnv1aHash() below) --
   * lets two Identifiers be compared/deduplicated by their own value's
   * content without a full string comparison. Auto-computed by
   * identifier() below from `value` unless the caller's own `extra`
   * supplies one. */
  hash?: string;
}

/** FNV-1a, 32-bit, hex-encoded -- fnv1aHash("") is FNV-1a's own
 * standard offset basis, unaffected by the loop below since an empty
 * `value` never runs it. Deterministic and dependency-free (no
 * crypto.subtle, which is async); not cryptographic -- collision
 * resistance isn't this hash's job, deduplicating/comparing Identifier
 * values cheaply is. */
export function fnv1aHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function identifier(value: string, extra: Omit<Identifier, "value"> = {}): Identifier {
  return { value, uuid: crypto.randomUUID(), hash: fnv1aHash(value), ...extra };
}
