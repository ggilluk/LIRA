/** Verbatim slice of the embedded client script (original dictionary_view.ts
 * lines 3885-4108) -- connectedComponents/cliqueGroups/buildClusters and
 * buildHierarchy(): the pure graph/tree-building algorithm, no markup. */
export const CLIENT_HIERARCHY_LAYOUT = `// Connected components of a relationship-edge list, treating every edge
// as undirected -- shared by the Hierarchy tab's symmetric-kind
// clustering below and the Cyclic tab's cycle-finding (buildCyclicComponents).
function connectedComponents(edges) {
  const undirected = new Map();
  const nodeIds = new Set();
  edges.forEach(r => {
    nodeIds.add(r.source_id);
    nodeIds.add(r.target_id);
    if (!undirected.has(r.source_id)) undirected.set(r.source_id, new Set());
    if (!undirected.has(r.target_id)) undirected.set(r.target_id, new Set());
    undirected.get(r.source_id).add(r.target_id);
    undirected.get(r.target_id).add(r.source_id);
  });
  const visited = new Set();
  const components = [];
  nodeIds.forEach(start => {
    if (visited.has(start)) return;
    const stack = [start];
    const comp = new Set();
    visited.add(start);
    while (stack.length) {
      const cur = stack.pop();
      comp.add(cur);
      (undirected.get(cur) || new Set()).forEach(next => {
        if (!visited.has(next)) { visited.add(next); stack.push(next); }
      });
    }
    components.push(comp);
  });
  return components;
}

// Groups words into genuine cliques of the given edges -- every word in
// a group is directly connected to every other word in that same group,
// not merely reachable through a chain of separate edges. Plain
// connected components get this wrong for a symmetric kind: e.g.
// keep-retain, retain-store, and store-reserve might each be a real,
// direct SYNONYM edge, but that doesn't make "keep" and "reserve"
// synonyms of each other, and a component would have silently merged
// them (and everything else transitively reachable through the chain --
// one real case in this dictionary chained 18 words into a single
// component over just 19 direct edges out of 153 possible pairs, i.e.
// mostly NOT directly related). Grown greedily instead: process words
// alphabetically, start a group with the first unassigned one, then
// keep adding any of its direct neighbours that are *also* directly
// connected to every word already in the group, until no more
// candidates qualify -- every resulting group is a real clique. (This
// is a greedy approximation, not a guaranteed-maximum clique cover -- a
// word already claimed by an earlier, alphabetically-prior group stays
// there even if it would also fit a later one -- but every group it
// produces is still fully, genuinely mutually connected, which is the
// property that matters here.)
function cliqueGroups(edges, wordById) {
  const neighbors = new Map();
  edges.forEach(r => {
    if (!neighbors.has(r.source_id)) neighbors.set(r.source_id, new Set());
    if (!neighbors.has(r.target_id)) neighbors.set(r.target_id, new Set());
    neighbors.get(r.source_id).add(r.target_id);
    neighbors.get(r.target_id).add(r.source_id);
  });
  const byLabel = (a, b) => wordById.get(a).lexical_form.localeCompare(wordById.get(b).lexical_form);
  const assigned = new Set();
  const groups = [];
  [...neighbors.keys()].sort(byLabel).forEach(start => {
    if (assigned.has(start)) return;
    const group = [start];
    [...neighbors.get(start)].filter(id => !assigned.has(id)).sort(byLabel).forEach(candidate => {
      if (group.every(member => neighbors.get(member).has(candidate))) group.push(candidate);
    });
    groups.push(group);
    group.forEach(w => assigned.add(w));
  });
  return { groups, neighbors };
}

// Every mutually-related group of words for a symmetric kind (SYNONYM,
// ANTONYM, RELATED -- any kind where every edge's reverse is also
// stored), used by buildHierarchy's fallback below: keeps every clique
// of 2+ words, not just the more visually interesting larger ones -- a
// plain mutual pair is still a real cluster, just the smallest possible
// one, and Hierarchy's job here is to replace the flat "every word its
// own root" forest entirely, not to single out anything.
function buildClusters(kind) {
  const wordById = new Map(WORDS.map(w => [w.id, w]));
  const edges = RELS.filter(r => r.kind === kind && wordById.has(r.source_id) && wordById.has(r.target_id));
  const clusters = cliqueGroups(edges, wordById).groups.filter(g => g.length >= 2);
  clusters.sort((a, b) => b.length - a.length);
  return { clusters, wordById };
}

// Mirrors the server-side HIERARCHY_INVERTED_KINDS (dictionary_view.ts's
// own DictionaryView.resolveHierarchy(), the class this file's own
// render() method is a method of) -- kept as a literal duplicate rather
// than shared, since that Set lives in TypeScript-enum-keyed code this
// client script has no import access to; the two kind *names* below
// are the stable, load-bearing part, not the enum values behind them.
const HIERARCHY_INVERTED_KINDS = new Set(["HYPERNYM", "MERONYM"]);

// Mirrors the server-side SYMMETRIC_HIERARCHY_KINDS (same class,
// same reasoning as HIERARCHY_INVERTED_KINDS just above for why this
// is a literal duplicate rather than a shared import) -- checked by
// kind, not inferred from "no root candidates" (buildHierarchy()'s own
// \`fellBack\` used to do exactly that, and broke the same way
// resolveHierarchy()'s own version did once SYNONYM/ANTONYM/etc.
// stopped being stored as two edges per fact).
const SYMMETRIC_HIERARCHY_KINDS = new Set(["SYNONYM", "ANTONYM", "VERB_GROUP", "ATTRIBUTE", "ALSO_SEE", "DERIVED_FORM"]);

// Builds the full forest for one relationship kind. source_id becomes
// the parent, target_id the child for most kinds -- the same literal
// (source, kind, target) triple the Relationships tab already shows --
// *except* HIERARCHY_INVERTED_KINDS (HYPERNYM, MERONYM), which are
// stored (narrower/part, kind, broader/whole) --
// source is the *child* for these, not the parent, so building the tree
// straight off source/target would put narrower concepts to the tree's
// own root side and broader ones toward the leaves, backwards from
// "broad root, narrow leaves".
// Mirrors resolveHierarchy()'s own server-side HIERARCHY_INVERTED_KINDS
// swap (dictionary_view.ts's server-side class) so the under-capacity
// and WordNet-scale paths agree on which side of a HYPERNYM-like edge
// is broader, not just this client script's own two rendering paths
// agreeing with each other.
// Roots are words with no incoming edge of this kind -- except
// SYMMETRIC_HIERARCHY_KINDS (SYNONYM, ANTONYM, ...), which fall back to
// buildClusters unconditionally regardless of what root-detection would
// say, rather than a forest of redundant per-word roots (each of which
// would otherwise show largely the same members as every other root in
// the same mutually-related group). Named explicitly, not inferred from
// "zero root candidates" -- SYMMETRIC_HIERARCHY_KINDS's own docstring
// on why that check alone stopped being reliable.
//
// When state.selectedWordId names a word that's actually part of this
// kind's graph, the returned tree is centred on it instead of showing
// every root's own full forest -- the under-capacity counterpart to
// resolveHierarchy()'s own server-side wordId mode (dictionary_view.ts's
// server-side class), mirrored here rather than shared with it since
// this path runs entirely against the already-embedded WORDS/RELS
// arrays: walk *up* the first-parent-at-each-step chain to build a
// single ancestor path (not every ancestor's other children -- a
// multiply-inherited node, e.g. two WordNet hypernyms, picks one path,
// same rare-case tradeoff the server-side version makes), then descend
// from the selected word's own real children as normal, capped at
// HIERARCHY_NODE_LIMIT the same way an over-capacity request is. Falls
// through to the full, unscoped forest if nothing is selected or the
// selection isn't part of this kind's graph at all (centred stays
// false either way -- renderHierarchy()'s own docstring on the latter
// case, which gets its own explicit "no relationships for this word"
// message rather than silently showing the unrelated full forest).
function buildHierarchy(kind) {
  const edges = RELS.filter(r => r.kind === kind);
  const wordById = new Map(WORDS.map(w => [w.id, w]));
  const inverted = HIERARCHY_INVERTED_KINDS.has(kind);
  const childrenOf = new Map();
  const parentsOf = new Map();
  const hasIncoming = new Set();
  const nodeIds = new Set();
  edges.forEach(r => {
    if (!wordById.has(r.source_id) || !wordById.has(r.target_id)) return;
    const parentId = inverted ? r.target_id : r.source_id;
    const childId = inverted ? r.source_id : r.target_id;
    nodeIds.add(parentId);
    nodeIds.add(childId);
    hasIncoming.add(childId);
    if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
    childrenOf.get(parentId).push(childId);
    if (!parentsOf.has(childId)) parentsOf.set(childId, []);
    parentsOf.get(childId).push(parentId);
  });
  const byLabel = id => (wordById.get(id) || {}).lexical_form || "";
  let roots = [...nodeIds].filter(id => !hasIncoming.has(id));
  const fellBack = SYMMETRIC_HIERARCHY_KINDS.has(kind) ? nodeIds.size > 0 : roots.length === 0 && nodeIds.size > 0;
  let clusters = null;
  let centred = false;
  let shownNodeCount = nodeIds.size;
  let truncated = false;
  const selectedId = state.selectedWordId;
  if (fellBack) {
    clusters = buildClusters(kind).clusters;
  } else if (selectedId && nodeIds.has(selectedId)) {
    centred = true;
    const ancestorChain = [];
    let cur = selectedId;
    const seen = new Set([cur]);
    for (;;) {
      const parents = parentsOf.get(cur);
      if (!parents || !parents.length) break;
      const next = parents[0];
      if (seen.has(next)) break;
      ancestorChain.push(next);
      seen.add(next);
      cur = next;
    }
    ancestorChain.reverse();

    const scopedChildrenOf = new Map();
    for (let i = 0; i < ancestorChain.length; i++) {
      scopedChildrenOf.set(ancestorChain[i], [i + 1 < ancestorChain.length ? ancestorChain[i + 1] : selectedId]);
    }
    const included = new Set(ancestorChain);
    included.add(selectedId);
    const queue = [selectedId];
    let queueIndex = 0;
    while (queueIndex < queue.length) {
      const current = queue[queueIndex];
      queueIndex += 1;
      const kids = (childrenOf.get(current) || []).slice().sort((a, b) => byLabel(a).localeCompare(byLabel(b)));
      const list = [];
      kids.forEach(childId => {
        if (!included.has(childId) && included.size >= HIERARCHY_NODE_LIMIT) { truncated = true; return; }
        list.push(childId);
        if (!included.has(childId)) { included.add(childId); queue.push(childId); }
      });
      if (list.length) scopedChildrenOf.set(current, list);
    }
    roots = [ancestorChain.length ? ancestorChain[0] : selectedId];
    shownNodeCount = included.size;
    return { roots, childrenOf: scopedChildrenOf, wordById, edgeCount: edges.length, nodeCount: nodeIds.size, fellBack, clusters, centred, shownNodeCount, truncated, inverted };
  } else {
    roots.sort((a, b) => byLabel(a).localeCompare(byLabel(b)));
    childrenOf.forEach(list => list.sort((a, b) => byLabel(a).localeCompare(byLabel(b))));
  }
  return { roots, childrenOf, wordById, edgeCount: edges.length, nodeCount: nodeIds.size, fellBack, clusters, centred, shownNodeCount, truncated, inverted };
}
`;
