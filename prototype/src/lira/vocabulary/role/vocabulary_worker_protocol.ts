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

export type VocabularyWorkerRequest = InitRequest | RenderRequest;

export interface StatusMessage {
  type: "status";
  state: VocabularyServiceState;
  detail?: string;
}

export interface ReadyMessage {
  type: "ready";
  domains: readonly VocabularyDomainSummary[];
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

export interface ErrorMessage {
  type: "error";
  message: string;
}

export type VocabularyWorkerMessage = StatusMessage | ReadyMessage | RenderedMessage | ErrorMessage;
