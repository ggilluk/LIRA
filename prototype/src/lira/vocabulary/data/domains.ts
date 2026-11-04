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
 * │ Module Name     │ lira/vocabulary/data/domains
 * │ Filename        │ domains.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-09-08
 * │ Modified Date   │ 2026-09-11
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Domains: the shared registry of subject Domains.
 * │                 │
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/vocabulary/data/domains
 * @file domains.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { createFreshUuidDomainCopy, graphUuid } from "../role/domain_processor";
import type { Domain } from "./entities/domain";

/** Domain storage: Coordinations's own counterpart for Domain
 * (data/entities/domain.ts's own docstring on why this is a separate,
 * shared registry rather than each Word/Sense/Phrase carrying its own
 * copy of the same topic-domain text). One Domains store per
 * knowledge-Domain, alongside that knowledge-Domain's own
 * Dictionary/Phrases/Senses/Coordinations (VocabularyContext.domains,
 * data/vocabulary_context.ts).
 *
 * Indexed by text as well as uuid, case-insensitively -- the same
 * `byText` shape `Dictionary`'s own lookup already uses -- since
 * seeding needs to find-or-create the one canonical Domain for a given
 * raw domain-tag string (word_seeder.ts's own `resolveDomain()`) rather
 * than ever appending a duplicate for the same text. Unlike Dictionary,
 * a given text never has more than one Domain: a topic-domain tag
 * carries no homograph concept the way a lexical form does. */
export class Domains {
  private domains: Domain[] = [];
  private readonly byUuid = new Map<number, Domain>();
  private readonly byText = new Map<string, Domain>();

  all(): readonly Domain[] {
    return this.domains.slice();
  }

  findByUuid(domainId: number): Domain | undefined {
    return this.byUuid.get(domainId);
  }

  /** Case-insensitive lookup by `domainText.value` -- `findByUuid()`'s
   * own text-keyed counterpart, `Dictionary.lookup()`'s own
   * case-insensitivity convention. */
  findByText(text: string): Domain | undefined {
    return this.byText.get(text.toLowerCase());
  }

  append(domain: Domain): void {
    this.domains.push(domain);
    this.byUuid.set(graphUuid(domain), domain);
    this.byText.set(domain.domainText.value.toLowerCase(), domain);
  }

  totalEntries(): number {
    return this.domains.length;
  }

  /** Bootstraps this Domains store with a copy of every Domain in
   * `other` -- Dictionary.seedFrom/Phrases.seedFrom/Senses.seedFrom/
   * Coordinations.seedFrom's own exact counterpart, used the same way
   * (VocabularyContext's own Physics-from-Common snapshot). */
  seedFrom(other: Domains): void {
    for (const domain of other.domains) this.append(createFreshUuidDomainCopy(domain));
  }
}
