/** Uri: this prototype's own addition, no CCTS Core Component Type or
 * Python original behind it (identifier.ts's own `uuid`/`hash` are the
 * precedent for a TS-port-only value object living here). Carries every
 * `*Uri`-suffixed supplementary attribute in this layer that's a real,
 * dereferenceable locator rather than an identifying reference in its
 * own right -- `Code.listUri`/`listSchemeUri` (code.ts), `Identifier.schemeUri`/
 * `schemeDataUri` (identifier.ts), and every `code/*.ts` CCTS `Code`
 * specialisation's own `listUri`/`listSchemeUri` -- instead of a bare
 * `string`. `vocabulary/data/source_reference.ts`'s own `referenceUri`
 * is the one real `*Uri`-named field that deliberately stayed
 * `Identifier`-typed -- that file's own docstring on why the name alone
 * isn't enough to tell the two apart.
 *
 * Deliberately a thin wrapper around the platform's own `URL`, not a
 * hand-rolled RFC 3986 parser -- `URL`'s own parser already is one,
 * dependency-free (identical reasoning to fnv1aHash()'s own "no
 * crypto.subtle" choice, identifier.ts), and every real `*Uri` value
 * already in this layer is a plain, absolute, dereferenceable address
 * (`LanguageCode.listSchemeUri`, `"https://www.iso.org/iso-639-language-code"`,
 * data/code/languageCode.ts) -- exactly what `URL` parses.
 *
 * Only accepts an *absolute* URI (one with a scheme) -- `xsd:anyURI`
 * (the CCTS supplementary-attribute type these fields correspond to)
 * technically also allows a bare relative reference, but `URL`'s own
 * constructor requires a `base` to resolve one against, and nothing in
 * this codebase has one to offer: every real `*Uri` field is a
 * standalone external address, never resolved against a page or
 * document URL of its own.
 *
 * `value` is kept exactly as given, unvalidated-but-for-parseability --
 * construction never rewrites it to `URL`'s own normalised form
 * (lower-cased scheme/host, a trailing `/` on a bare origin, ...), the
 * same "the value object's own `value` is never silently mutated" rule
 * every other value object in this layer already follows (`Code.value`/
 * `Identifier.value` are never normalised by their own constructors
 * either). `toUrl()` is where that normalisation becomes visible --
 * `new URL(this.value).href` can differ from `this.value` itself, never
 * the other way around. */
export class Uri {
  readonly value: string;

  constructor(value: string) {
    if (!Uri.isValid(value)) throw new Error(`not a valid absolute URI: '${value}'`);
    this.value = value;
  }

  /** `value`'s own format check, without constructing -- the same
   * parseability test the constructor itself runs, exposed separately
   * for a caller that wants to check first rather than catch a throw --
   * text.ts's own `dialectCodeFor()`/`scriptCodeFor()` "don't throw,
   * return undefined for an unrecognised value" precedent is the shape
   * a future `*UriFor()` resolver would build on top of this, the same
   * way those two build on `xCodelistFromCode()`. */
  static isValid(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  /** `url`'s own `href` (already absolute and already normalised --
   * every `URL` instance's own invariant) as a fresh `Uri` -- the
   * platform-`URL`-to-this-layer direction of the round-trip this
   * class's own docstring describes. Never throws: a real `URL`
   * instance's own `href` is always itself a valid absolute URI `Uri`'s
   * own constructor accepts. */
  static fromUrl(url: URL): Uri {
    return new Uri(url.href);
  }

  /** This layer's own `Uri` back out to the platform's `URL` -- the
   * other direction of the round-trip, and what actually does the
   * parsing/normalising (query params, path segments, `origin`, ...)
   * this class's own constructor deliberately doesn't. Can't throw in
   * practice -- `value` already parsed once, in the constructor, via
   * this exact same `new URL()` call. */
  toUrl(): URL {
    return new URL(this.value);
  }
}
