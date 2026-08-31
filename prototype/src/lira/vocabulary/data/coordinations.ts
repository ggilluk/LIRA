import { copyCoordinationWithFreshUuid, graphUuid } from "../role/coordination_processor";
import type { LinguisticUnit } from "../../linguistics/data/linguistic_unit";
import type { Coordination } from "./entities/coordination";

/** Coordination storage: Senses/Phrases's own counterpart for
 * Coordination (data/entities/coordination.ts). One Coordinations store
 * per Domain, alongside that Domain's own Dictionary/Phrases/Senses
 * (VocabularyContext.coordinations, data/vocabulary_context.ts).
 *
 * Deliberately a smaller surface than Phrases/Senses: no text/lemma
 * index (a Coordination carries no `text` of its own to index -- it's
 * not a LinguisticUnit itself, only its own `coordinates` are), no
 * synsetId/partOfSpeech side index (no WordNet concept applies to a
 * Coordination the way it does to a Word/Phrase's own seeded sense).
 * Holds every specialisation (WordCoordination, NounCoordination, ...)
 * mixed together under one shared `Coordination<LinguisticUnit>`
 * generic parameter, the same "store broadly, narrow on read" choice
 * Dictionary already makes for Word's own POS subtypes -- narrowing a
 * `Coordination<LinguisticUnit>` back down to a specific specialisation
 * is left to the caller (no isXCoordination() guard family exists yet,
 * mirroring how Coordination itself still has no seeder/UI consumer of
 * its own). */
export class Coordinations<T extends LinguisticUnit> {
  private coordinations: Coordination<T>[] = [];
  private readonly byUuid = new Map<string, Coordination<T>>();

  all(): readonly Coordination<T>[] {
    return this.coordinations.slice();
  }

  findByUuid(coordinationId: string): Coordination<T> | undefined {
    return this.byUuid.get(coordinationId);
  }

  append(coordination: Coordination<T>): void {
    this.coordinations.push(coordination);
    this.byUuid.set(graphUuid(coordination), coordination);
  }

  totalEntries(): number {
    return this.coordinations.length;
  }

  /** Bootstraps this Coordinations store with a copy of every
   * Coordination in `other` -- Dictionary.seedFrom/Phrases.seedFrom/
   * Senses.seedFrom's own exact counterpart, used the same way
   * (VocabularyContext's own Physics-from-Common snapshot). */
  seedFrom(other: Coordinations<T>): void {
    for (const coordination of other.coordinations) this.append(copyCoordinationWithFreshUuid(coordination));
  }
}
