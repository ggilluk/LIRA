/** Hierarchy-tab tree resolution -- split out of ui/dictionary_view.ts's
 * own DictionaryView class (formerly the public method resolveHierarchy
 * and its supporting module-level constants). */

import type { Dictionary } from "../../data/dictionary";
import { PartOfSpeech } from "../../data/enums/part_of_speech";
import { SemanticRelationshipKind } from "../../data/enums/semantic_relationship_kind";
import type { Phrases } from "../../data/phrases";
import type { SemanticRelationshipStore } from "../../data/semantic_relationship_store";
import type { Senses } from "../../data/senses";
import { domainLabel } from "./resolver_domain";
import { resolveEntry } from "./resolver_entity";

// One resolved Word, as much as a Hierarchy tree node needs to render
// itself (posPill/domainPill/senseIdBadge) -- deliberately not a full
// WordRecord (relationship_count, definition, PAD, ... none of that is
// shown inside a tree node).
export interface HierarchyNode {
  id: string;
  lexical_form: string;
  pos: string;
  domain: string | null;
  sense_id: string | null;
}

export interface HierarchyEdge {
  parentId: string;
  childId: string;
}

// resolveHierarchy()'s own result -- see that function's docstring for
// what each field means and how `fellBack`/`truncated` should be
// handled by a caller.
export interface HierarchyResolution {
  nodes: readonly HierarchyNode[];
  edges: readonly HierarchyEdge[];
  roots: readonly string[];
  totalEdgeCount: number;
  totalNodeCount: number;
  fellBack: boolean;
  truncated: boolean;
}

// The kinds word_seeder.ts's own relationshipKindForPointer stores as
// only ONE edge per fact, always oriented child -> kind -> parent (that
// function's own docstring on why: WordNet redundantly lists every
// hypernym/meronym fact from both ends, so the parent-listed side is
// canonicalized onto the child-listed side's kind instead of creating a
// second, fully redundant edge). resolveHierarchy() needs to know this
// to orient a tree correctly -- for any OTHER kind, the stored
// (source, target) pair already reads source-as-parent/target-as-child
// (the Relationships tab's own literal reading), but for these two,
// the *parent* is the edge's target and the *child* is its source --
// backwards from every other kind, because there is no longer a
// separately-stored HYPONYM/HOLONYM edge whose own (source, target)
// would already read the natural way. MERONYM covers every WordNet
// part/member/substance fact alike now (its own meronymKind qualifier
// distinguishes which, lexical_relationship_type.ts's own docstring) --
// there is no longer a separate PART_MERONYM/MEMBER_MERONYM/
// SUBSTANCE_MERONYM kind to list here. INSTANCE_HYPERNYM/
// INSTANCE_HYPONYM (WordNet's own `@i`/`~i`, instance-of) are retired
// too -- word_seeder.ts's own relationshipKindForPointer never seeds
// them at all, so there is nothing of that kind to orient here either.
const HIERARCHY_INVERTED_KINDS: ReadonlySet<SemanticRelationshipKind> = new Set([
  SemanticRelationshipKind.HYPERNYM,
  SemanticRelationshipKind.MERONYM,
]);

// Kinds with no meaningful "broader/narrower" direction at all -- every
// member of a mutually-related group is as broad or narrow as every
// other, so resolveHierarchy() should offer its own cluster view
// (buildClusters()'s own client-side equivalent) instead of a tree with
// an arbitrary "root". SYNONYM (allPairs()'s own i<j-only pairing,
// word_seeder.ts) and word_seeder.ts's own SYMMETRIC_RELATIONSHIP_KINDS
// (ANTONYM, VERB_GROUP, ATTRIBUTE, ALSO_SEE, DERIVED_FORM) are all
// stored as exactly ONE directed edge per fact, not two -- so
// `rootCandidates.length === 0` (every node has both directions) is
// NOT a reliable way to detect these anymore: a mutually-synonymous
// clique of N words under i<j pairing always has at least one word
// with no *incoming* edge (whichever sorts first), so the naive check
// would pick that word as a "root" and draw a nonsensical tree instead
// of falling back to clusters, exactly the "buttocks" -- a real WordNet
// SYNONYM "root" -- bug this Set exists to prevent. Named explicitly,
// not inferred, because inferring it from stored edge shape is exactly
// what broke the first time (word_seeder.ts's own reciprocal-dedup fix
// changed that shape without this function's own root detection noticing).
// DERIVED_FORM (a LexicalRelationshipType-only, word-to-word kind now)
// dropped from this list -- SemanticRelationshipKind has no counterpart
// for it at all, the Hierarchy tab's own kind dropdown can never offer
// it any more (relationshipKindCounts()'s own docstring on why: it only
// ever enumerates relationships, SemanticRelationshipStore now).
const SYMMETRIC_HIERARCHY_KINDS: ReadonlySet<SemanticRelationshipKind> = new Set([
  SemanticRelationshipKind.SYNONYM,
  SemanticRelationshipKind.ANTONYM,
  SemanticRelationshipKind.VERB_GROUP,
  SemanticRelationshipKind.ATTRIBUTE,
  SemanticRelationshipKind.ALSO_SEE,
]);

// resolveHierarchy()'s own default node cap when a caller doesn't pass
// its own `limit` -- generous enough to show a genuinely useful subtree
// (HIERARCHY_NODE_LIMIT's own client-side docstring, ui/client/'s own
// embedded script) without risking the same JSON.stringify-on-too-much-
// data ceiling MAX_INTERACTIVE_WORDS exists to avoid in the first place.
const DEFAULT_HIERARCHY_NODE_LIMIT = 500;

/** Resolves one Hierarchy-tab tree for `options.kind`, server-side,
 * regardless of scale -- the on-demand counterpart to the small-
 * Domain client-side buildHierarchy() (ui/client/'s own embedded
 * script), for a Domain over MAX_INTERACTIVE_WORDS where there's no
 * client-embedded RELS array left to build a tree from in the browser
 * at all (that constant's own docstring).
 *
 * Two modes, chosen by whether `options.wordId` is given:
 *  - No wordId: finds this kind's own "broadest root" -- among every
 *    node with no parent edge of this kind, the one with the most
 *    total *reachable descendants* (not merely the most direct
 *    children -- an earlier version of this function used that cheaper
 *    but misleading proxy: WordNet's own verb taxonomy is much
 *    shallower than its noun one, so a broad verb concept like
 *    "change" can have more direct hyponyms than "entity" does, while
 *    entity's own subtree still covers the overwhelming majority of
 *    every noun in the Dictionary). Computed via one memoized DFS
 *    shared across every candidate (subtreeSize() below), not one
 *    traversal per candidate, so this stays O(nodes + edges) overall
 *    even when there are many root candidates -- then returns that
 *    root's own descendant subtree, breadth-first, capped at
 *    `options.limit` nodes.
 *  - `wordId` given: walks *up* from that Word, one parent at a time
 *    (the first parent found at each step -- a rare multiple-parent
 *    case, e.g. a noun with two WordNet hypernyms, picks one path
 *    rather than returning a merged DAG of ancestors), to build the
 *    root-to-word ancestor chain, then returns that Word's own
 *    descendant subtree the same breadth-first, capped way.
 *
 * HIERARCHY_INVERTED_KINDS's own docstring on why `parentId`/`childId`
 * aren't always simply `sourceWordId`/`targetWordId`. Every edge of
 * the chosen kind is scanned once regardless of mode
 * (`relationships.all()` filtered by kind) -- at WordNet scale
 * that's up to a few hundred thousand comparisons, comfortably
 * sub-second work for an on-demand Worker request, the same order of
 * magnitude searchWords()/searchRelationships() already do per call.
 * `fellBack: true` means every node touched by this kind has both
 * directions (a fully symmetric kind, e.g. ANTONYM) -- there is no
 * meaningful root to start from; a caller should offer its own
 * clustering view instead (buildClusters()'s own small-Domain
 * equivalent) rather than treat this as "no data". `truncated: true`
 * means the descendant walk hit `options.limit` before it ran out of
 * children to include. */
export function resolveHierarchy(
  relationships: SemanticRelationshipStore,
  dictionary: Dictionary,
  phrases: Phrases,
  senses: Senses,
  domainName: string,
  options: { kind: string; wordId?: string; limit?: number },
): HierarchyResolution {
  const empty: HierarchyResolution = { nodes: [], edges: [], roots: [], totalEdgeCount: 0, totalNodeCount: 0, fellBack: false, truncated: false };
  const kindEnum = SemanticRelationshipKind[options.kind as keyof typeof SemanticRelationshipKind];
  if (kindEnum === undefined) return empty;

  const inverted = HIERARCHY_INVERTED_KINDS.has(kindEnum);
  const limit = options.limit ?? DEFAULT_HIERARCHY_NODE_LIMIT;

  const childrenOf = new Map<string, Set<string>>();
  const parentsOf = new Map<string, Set<string>>();
  const allNodeIds = new Set<string>();
  let totalEdgeCount = 0;
  for (const rel of relationships.all()) {
    if (rel.relationshipType !== kindEnum) continue;
    totalEdgeCount += 1;
    const parentId = inverted ? rel.targetSenseId.value : rel.sourceSenseId.value;
    const childId = inverted ? rel.sourceSenseId.value : rel.targetSenseId.value;
    allNodeIds.add(parentId);
    allNodeIds.add(childId);
    let children = childrenOf.get(parentId);
    if (!children) {
      children = new Set();
      childrenOf.set(parentId, children);
    }
    children.add(childId);
    let parents = parentsOf.get(childId);
    if (!parents) {
      parents = new Set();
      parentsOf.set(childId, parents);
    }
    parents.add(parentId);
  }
  const totalNodeCount = allNodeIds.size;
  if (totalEdgeCount === 0) return empty;
  // Checked by kind, not inferred from the stored edge shape --
  // SYMMETRIC_HIERARCHY_KINDS's own docstring on why
  // `rootCandidates.length === 0` alone no longer reliably detects
  // this. Applies regardless of `wordId`: a "centred" tree makes no
  // more sense for a symmetric kind with a word selected than without
  // one, and the cluster view this falls back to (buildClusters()'s
  // own client-side equivalent) doesn't take a centring word anyway.
  if (SYMMETRIC_HIERARCHY_KINDS.has(kindEnum)) return { ...empty, totalEdgeCount, totalNodeCount, fellBack: true };

  const ancestorChain: string[] = [];
  let startId: string;

  if (options.wordId !== undefined) {
    // `options.wordId` names a Word/Phrase, but this kind's own graph
    // (`allNodeIds`, built from `relationships.all()` just above)
    // is always keyed by Sense uuid now (SemanticRelationshipStore's
    // own docstring) -- the raw Word/Phrase uuid is never itself a
    // node, so this always falls back to its own Sense's uuid instead.
    // The tree then centres on that Sense (rendered via resolveEntry()'s
    // own representative-member simplification below), not literally
    // `options.wordId` itself -- a deliberate simplification, the same
    // one searchRelationships() avoids by fanning out instead
    // (senseExpandedRelationships()'s own docstring), acceptable here
    // since a Hierarchy tree already collapses a whole synset onto one
    // node by design.
    let cur = options.wordId;
    if (!allNodeIds.has(cur)) {
      // senseIds[0] -- the primary, highest-Sense.senseFrequency sense
      // (Word.senseIds's own docstring) -- same "collapse a whole synset onto one node"
      // simplification this fallback already documents above.
      const senseId = resolveEntry(dictionary, phrases, senses, options.wordId)?.senseIds[0]?.value;
      if (senseId !== undefined && allNodeIds.has(senseId)) cur = senseId;
    }
    if (!allNodeIds.has(cur)) return { ...empty, totalEdgeCount, totalNodeCount };
    startId = cur;
    const seen = new Set([cur]);
    for (;;) {
      const parents = parentsOf.get(cur);
      if (!parents || parents.size === 0) break;
      const next = [...parents][0];
      if (seen.has(next)) break;
      ancestorChain.push(next);
      seen.add(next);
      cur = next;
    }
    ancestorChain.reverse();
  } else {
    const rootCandidates = [...allNodeIds].filter((id) => !parentsOf.has(id));
    if (rootCandidates.length === 0) return { ...empty, totalEdgeCount, totalNodeCount, fellBack: true };

    // Reachable-descendant count, memoized once per node and reused
    // across every root candidate's own comparison below -- this
    // function's own docstring on why (a cheap per-candidate proxy like
    // direct-child-count picks a shallow-but-wide root instead of the
    // genuinely broadest one). A DAG's rare multiply-inherited node
    // (a WordNet synset with two hypernyms) gets counted under each of
    // its parents -- a defensible approximation for "which root is
    // broadest", not a guarantee every count is a distinct
    // reachable-node total.
    const subtreeSize = new Map<string, number>();
    const computing = new Set<string>();
    const sizeOf = (id: string): number => {
      const cached = subtreeSize.get(id);
      if (cached !== undefined) return cached;
      if (computing.has(id)) return 0; // cycle guard
      computing.add(id);
      let size = 1;
      for (const child of childrenOf.get(id) ?? []) size += sizeOf(child);
      computing.delete(id);
      subtreeSize.set(id, size);
      return size;
    };
    rootCandidates.sort((a, b) => sizeOf(b) - sizeOf(a));
    startId = rootCandidates[0];
  }

  const includedIds = new Set<string>(ancestorChain);
  includedIds.add(startId);
  const edges: HierarchyEdge[] = [];
  for (let i = 0; i < ancestorChain.length - 1; i++) {
    edges.push({ parentId: ancestorChain[i], childId: ancestorChain[i + 1] });
  }
  if (ancestorChain.length > 0) {
    edges.push({ parentId: ancestorChain[ancestorChain.length - 1], childId: startId });
  }

  let truncated = false;
  const queue: string[] = [startId];
  let queueIndex = 0;
  while (queueIndex < queue.length) {
    const current = queue[queueIndex];
    queueIndex += 1;
    const children = childrenOf.get(current);
    if (!children) continue;
    for (const childId of children) {
      const alreadyIncluded = includedIds.has(childId);
      if (!alreadyIncluded && includedIds.size >= limit) {
        truncated = true;
        continue;
      }
      edges.push({ parentId: current, childId });
      if (!alreadyIncluded) {
        includedIds.add(childId);
        queue.push(childId);
      }
    }
  }

  const nodes: HierarchyNode[] = [];
  for (const id of includedIds) {
    const word = resolveEntry(dictionary, phrases, senses, id);
    if (!word) continue;
    nodes.push({
      id,
      lexical_form: word.lexicalForm?.value ?? word.text,
      pos: PartOfSpeech[word.partOfSpeech],
      domain: domainLabel(senses, domainName, word),
      sense_id: word.synsetId?.value ?? null,
    });
  }

  const roots = ancestorChain.length > 0 ? [ancestorChain[0]] : [startId];
  return { nodes, edges, roots, totalEdgeCount, totalNodeCount, fellBack: false, truncated };
}
