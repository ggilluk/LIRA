/** A hosted Domain, as seen by the Portal shell (knowledge/ui/portal_shell.ts).
 *
 * This is deliberately NOT a port of the real `Domain`
 * (knowledge/data/domain.py) or `HostedDomains`
 * (knowledge/data/hosted_domains.py) -- those compose Linguistics,
 * Value Objects, and the Knowledge Layer's own tensor graph (D5/D6
 * Domain generalisation/composition with fractional-midpoint z
 * positions), none of which are ported yet. `PortalDomain` carries only
 * what the shell needs to draw a folder tree: a name, an optional
 * parent for nesting, and the counts its tree row displays.
 * `parentName` is set by hand (e.g. "Physics" under "Common") rather
 * than derived from any D5/D6 registration -- when the real
 * `HostedDomains` is ported, this type should be replaced by it, not
 * extended to fake the parts it's missing.
 *
 * Unlike the shell's first version, this no longer carries a live
 * `VocabularyLayer` -- seeding and rendering now run inside the
 * Vocabulary Service worker (vocabulary/role/vocabulary_worker.ts), off
 * the main thread; the main thread only holds this summary (posted back
 * by the worker once seeding finishes) and asks the worker to render a
 * Domain's view on demand (VocabularyWorkerClient.renderDomain). */
export interface PortalDomain {
  name: string;
  parentName?: string;
  wordCount: number;
  relationshipCount: number;
}

/** The set of Domains the Portal shell can navigate -- a minimal stand-in
 * for `HostedDomains`, scoped to what a folder tree needs (add/get/
 * children/roots). See `PortalDomain`'s own docstring for what this
 * deliberately leaves out. */
export class PortalDomainRegistry {
  private readonly domains = new Map<string, PortalDomain>();

  constructor(domains: readonly PortalDomain[] = []) {
    for (const domain of domains) this.add(domain);
  }

  add(domain: PortalDomain): void {
    this.domains.set(domain.name, domain);
  }

  get(name: string): PortalDomain | undefined {
    return this.domains.get(name);
  }

  all(): readonly PortalDomain[] {
    return [...this.domains.values()];
  }

  roots(): readonly PortalDomain[] {
    return this.all().filter((domain) => domain.parentName === undefined);
  }

  children(name: string): readonly PortalDomain[] {
    return this.all().filter((domain) => domain.parentName === name);
  }

  /** This Domain's own chain of ancestors, root first, itself last --
   * the breadcrumb trail (`All Domains / Common / Physics`). */
  ancestryOf(name: string): readonly PortalDomain[] {
    const chain: PortalDomain[] = [];
    let current = this.get(name);
    while (current !== undefined) {
      chain.unshift(current);
      current = current.parentName !== undefined ? this.get(current.parentName) : undefined;
    }
    return chain;
  }
}
