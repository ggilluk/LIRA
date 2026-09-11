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
  /** A fresh random 53-bit graph-identity number naming this Identifier
   * value object instance itself -- distinct from `value`, which names
   * whatever `value` is an Identifier *for* (a Word's own uuid, a
   * WordNet synset id, ...). A `number`, not a v4 UUID string
   * (randomGraphUuid()'s own docstring on why) -- kept the name `uuid`
   * regardless, since every real caller still reads it as this
   * Identifier's own per-Domain graph identity, the same role a real
   * UUID played here before. Auto-assigned by identifier() below unless
   * the caller's own `extra` supplies one. */
  uuid?: number;
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

/** A cryptographically random unsigned integer in `[0, 2^53)` -- the
 * full range a JS `number` can hold as an exact integer
 * (`Number.MAX_SAFE_INTEGER` is `2^53 - 1`), used as `Identifier.uuid`'s
 * own per-Domain graph-identity value. Deliberately not a v4 UUID: a
 * real UUID is 128 bits and doesn't fit a `number` without truncation,
 * so `Identifier.uuid` moved to a `number` primitive instead
 * (`byUuid` Map lookups across every store that keys on it --
 * `Dictionary`/`Senses`/`WordForms`/`Phrases`/`Domains`/`Coordinations`
 * -- key on the numeric value directly now, not a string comparison).
 *
 * 53 random bits is still collision-safe at this codebase's real scale:
 * `Dictionary` alone seeds ~92,000 Words from bundled WordNet, and the
 * one real requirement every `graphUuid()` accessor's own docstring
 * across this codebase already states -- two Domains' independently-
 * generated identifiers must never collide when merged into one -- has
 * to hold across every entity, not just one store. Even at ten times
 * that scale (a generous upper bound for two merged Domains' combined
 * Word/Sense/WordForm/Phrase/Domain/Coordination count), the birthday-
 * bound collision probability (`n^2 / (2 * 2^53)` for `n` ~ 1,000,000)
 * stays below 1 in 18 billion -- a monotonic per-process counter was
 * considered and rejected specifically because it can't offer this at
 * all: two Domains seeded independently, each starting its own counter
 * at 0, would collide immediately and permanently on merge, the exact
 * failure mode this function exists to avoid. */
export function randomGraphUuid(): number {
  const bytes = new Uint32Array(2);
  crypto.getRandomValues(bytes);
  return (bytes[1] & 0x1fffff) * 0x100000000 + bytes[0];
}

export function identifier(value: string, extra: Omit<Identifier, "value"> = {}): Identifier {
  return { value, uuid: randomGraphUuid(), hash: fnv1aHash(value), ...extra };
}
