/**
 * Represents a Domain -- a subject/topic-domain tag (e.g. "medicine",
 * "chemistry", "botany") that a Word/Sense/Phrase's own sense belongs
 * to, the closed, shared vocabulary Word.domainTag/relatedDomainTags,
 * Sense.domainTag/relatedDomainTags, and Phrase.domainTag/relatedDomainTags
 * (their own docstrings) all reference by identifier now, instead of
 * each carrying its own duplicate copy of the same `Text`.
 *
 * NOT the same "Domain" `knowledge/data/portal_domain.ts`'s own docstring
 * and `VocabularyContext`'s own `domainName` constructor parameter mean
 * (a hosted vocabulary partition like "Common"/"Physics", composing an
 * entire Vocabulary/Linguistics/Value-Objects/Knowledge layer stack --
 * the eventual port target of `knowledge/data/domain.py`). This Domain
 * is a lightweight, shared classification tag: dozens of these, not a
 * handful of knowledge partitions, and every one of them lives inside
 * one knowledge-Domain's own `Domains` store (`data/domains.ts`),
 * mirroring every other lexical entity in this folder -- not something
 * a knowledge-Domain itself is or contains.
 *
 * See `documentation/architecture/data_entity_design_decisions_log.md`
 * for the design history behind this shape.
 */

import type { Identifier, Text } from "../../../value_objects";

export interface Domain {

  // ── Identity ─────────────────────────────────────────────

  /**
   * Identifier of the underlying topic-domain tag this record
   * represents.
   *
   * `domainId.value` is stable across every knowledge-Domain that holds
   * a copy of this Domain; `domainId.uuid` is this Domain's own unique
   * identifier within its own knowledge-Domain, freshly regenerated
   * every time this Domain is copied into another knowledge-Domain.
   */
  domainId: Identifier;


  // ── Data Attributes ──────────────────────────────────────

  /** This Domain's own canonical written form (e.g. "medicine"). */
  domainText: Text;
}
