/** Message protocol between the main thread (VocabularyWorkerClient) and
 * the Vocabulary Service worker (vocabulary_worker.ts) -- shared here so
 * both sides are typed against the same shapes instead of each guessing
 * at the other's message format. */

/** The Vocabulary Service's own status vocabulary -- deliberately not
 * knowledge/data/service_status.ts's `ServiceState` (which also has
 * `"not-ported"`, a state only the UI ever assigns to a layer with no
 * worker at all): Vocabulary must not depend on Knowledge. The Portal
 * shell maps this onto its own `ServiceState` when it forwards a
 * status message to its ServiceStatusBoard. */
export type VocabularyServiceState = "idle" | "running" | "done" | "error";

/** One seeded Domain, as summarised for whichever UI is watching this
 * worker -- name, optional parent (for tree nesting), and the counts a
 * tree row displays. Deliberately not knowledge/data/portal_domain.ts's
 * `PortalDomain` type itself: that type belongs to the Knowledge Layer's
 * Portal shell, and this module must not import from Knowledge. */
export interface VocabularyDomainSummary {
  name: string;
  parentName?: string;
  wordCount: number;
  relationshipCount: number;
}

export interface InitRequest {
  type: "init";
}

export interface RenderRequest {
  type: "render";
  requestId: string;
  domain: string;
}

/** Triggers WordSeeder.seedWordNet (role/word_seeder.ts) on demand
 * against the named Domain's own VocabularyLayer -- an on-demand
 * seeding pass, never implied by "init" (vocabulary_worker.ts's own
 * handleInit only ever runs seedClosedClassWords/RelationshipSeeder).
 * `domain` is a real target, not always "Common", but the worker's own
 * PortalShell caller (portal_shell.ts) only ever asks for "Common" --
 * WordNet is a general-English lexical resource, not a Domain-specific
 * fact, and Physics's own Dictionary is a one-time snapshot copy taken
 * at boot (VocabularyLayer.seedFrom), so seeding a child Domain
 * directly here wouldn't do anything a Common seed doesn't already
 * cover for it going forward, while seeding Common retroactively into
 * an already-copied child would need its own separate propagation this
 * protocol doesn't attempt. */
export interface SeedWordNetRequest {
  type: "seed-wordnet";
  domain: string;
}

export type VocabularyWorkerRequest = InitRequest | RenderRequest | SeedWordNetRequest;

export interface StatusMessage {
  type: "status";
  state: VocabularyServiceState;
  detail?: string;
  // Fraction in [0, 1] for a run with a known length (seedWordNet's own
  // (processed, total) synset count) -- undefined means either no
  // progress-bearing work is in flight, or its length isn't known yet,
  // never "0%"; a listener should treat undefined as "no bar to show",
  // not "just started".
  progress?: number;
}

export interface ReadyMessage {
  type: "ready";
  domains: readonly VocabularyDomainSummary[];
}

/** Posted once a seed-wordnet request finishes -- the target Domain's
 * refreshed summary (wordCount/relationshipCount now reflecting the
 * newly-seeded WordNet Words/SYNONYM relationships), so whichever UI
 * asked for the seed can update its own copy of that Domain's counts
 * (e.g. PortalDomainRegistry's tree row) without re-requesting "ready"
 * for every Domain. */
export interface DomainUpdatedMessage {
  type: "domain-updated";
  domain: VocabularyDomainSummary;
}

/** A rendered Domain's DictionaryView, as its three renderFragment()
 * pieces -- style/body/script -- rather than one self-contained HTML
 * string. The Portal shell mounts these directly into its own DOM
 * (matching the Python `LiraView` combiner's pattern) instead of an
 * `<iframe srcdoc>`, so the fragment inherits the shell's own width,
 * fonts, and theme tokens instead of laying out for a full-page
 * viewport -- and so DictionaryView's own masthead/title, which
 * renderFragment() excludes by design, never duplicates the Portal
 * topbar's breadcrumb. */
export interface RenderedFragment {
  style: string;
  body: string;
  script: string;
}

export interface RenderedMessage {
  type: "rendered";
  requestId: string;
  domain: string;
  fragment: RenderedFragment;
}

/** Posted instead of RenderedMessage when a render request fails --
 * an unknown Domain name, or DictionaryView.renderFragment() itself
 * throwing (dictionary_view.ts's own MAX_INTERACTIVE_WORDS docstring).
 * Carries the same `requestId` a RenderedMessage would have, so
 * VocabularyWorkerClient.renderDomain()'s matching pending Promise can
 * reject instead of hanging forever -- the failure mode before this
 * message type existed. */
export interface RenderErrorMessage {
  type: "render-error";
  requestId: string;
  message: string;
}

export interface ErrorMessage {
  type: "error";
  message: string;
}

export type VocabularyWorkerMessage =
  | StatusMessage
  | ReadyMessage
  | RenderedMessage
  | RenderErrorMessage
  | ErrorMessage
  | DomainUpdatedMessage;
