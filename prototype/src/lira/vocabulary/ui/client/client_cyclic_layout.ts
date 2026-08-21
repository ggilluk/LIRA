/** Verbatim slice of the embedded client script (original dictionary_view.ts
 * lines 4513-4758) -- synonymBoxes/buildClusterGraphs and the box-graph
 * level/crossing-reduction layout algorithm, no markup. */
export const CLIENT_CYCLIC_LAYOUT = `// SYNONYM defines the boxes here -- via cliqueGroups above, so only
// words that are ALL directly synonymous with EACH OTHER go in the same
// box, not merely reachable from one another through a chain of
// separate synonym pairs (see cliqueGroups' own comment for why that
// distinction matters and a real example from this dictionary). A word
// with no SYNONYM edge at all still needs a box to be a valid line
// endpoint, so it gets a box of its own.
function synonymBoxes(wordById) {
  const synEdges = RELS.filter(r => r.kind === "SYNONYM" && wordById.has(r.source_id) && wordById.has(r.target_id));
  const boxOfWord = new Map();
  const wordsOfBox = new Map();
  cliqueGroups(synEdges, wordById).groups.forEach((box, i) => {
    const id = "syn" + i;
    wordsOfBox.set(id, box);
    box.forEach(w => boxOfWord.set(w, id));
  });
  function boxFor(wordId) {
    if (boxOfWord.has(wordId)) return boxOfWord.get(wordId);
    const id = "single_" + wordId;
    wordsOfBox.set(id, [wordId]);
    boxOfWord.set(wordId, id);
    return id;
  }
  return { boxFor, wordsOfBox };
}

// For one chosen non-SYNONYM kind, draws the lines *between* synonym
// boxes: an ANTONYM edge from present to missing becomes a line from
// present's box (present + current) to missing's box, so you see the
// synonym pair held together and its antonym relationships fanning out
// from it, not scattered across separate unconnected views the way a
// plain per-word graph would show them. Groups (independent connected
// sets of boxes, so unrelated pairs don't share one giant drawing) are
// found the same way buildCyclicComponents used to find word-level
// cycles, just one level up -- boxes are the nodes here, not words.
function buildClusterGraphs(kind) {
  const wordById = new Map(WORDS.map(w => [w.id, w]));
  const { boxFor, wordsOfBox } = synonymBoxes(wordById);
  const kindEdges = RELS.filter(r => r.kind === kind && wordById.has(r.source_id) && wordById.has(r.target_id));
  const boxEdges = kindEdges.map(r => ({ ...r, sourceBox: boxFor(r.source_id), targetBox: boxFor(r.target_id) }));
  const boxGraphEdges = boxEdges.map(e => ({ source_id: e.sourceBox, target_id: e.targetBox }));

  const groups = [];
  connectedComponents(boxGraphEdges).forEach(boxIdSet => {
    if (boxIdSet.size < 2) return;
    const clusters = [...boxIdSet]
      .map(id => ({ id, wordIds: wordsOfBox.get(id).slice().sort((a, b) => wordById.get(a).lexical_form.localeCompare(wordById.get(b).lexical_form)) }))
      .sort((a, b) => wordById.get(a.wordIds[0]).lexical_form.localeCompare(wordById.get(b.wordIds[0]).lexical_form));
    const edges = boxEdges.filter(e => boxIdSet.has(e.sourceBox) && boxIdSet.has(e.targetBox));
    groups.push({ clusters, edges });
  });
  groups.sort((a, b) => b.clusters.length - a.clusters.length);
  return { groups, wordById };
}

// Each word inside a box gets its own position along a small vertical
// stack, so a line lands on the specific word it's from/to, not just
// the box's centre -- present's antonym line and current's antonym
// line are visually distinguishable even though both start inside the
// same box.

// Which side of a raw (source, kind, target) edge names the *broader*
// term, for every kind with a genuine broader/narrower direction
// ("type of", "part of") -- as opposed to a symmetric kind like
// ANTONYM, which has no broader side at all. Matches each kind's own
// stored direction convention (assets/common/en/relationships/README.md,
// examples/physics_domain_relationships.py's Directional conventions):
// HYPERNYM is (narrower, HYPERNYM, broader) -- broader is the target;
// HYPONYM is (broader, HYPONYM, narrower) -- broader is the source;
// MERONYM is (part, MERONYM, whole) -- the whole is broader, the target;
// HOLONYM is (whole, HOLONYM, part) -- the whole is broader, the source;
// TROPONYM is (general, TROPONYM, specific) -- the general verb is
// broader, the source (troponymy is verb-specific hyponymy, so its
// "broader" side reads the same way HYPERNYM's does for nouns).
const HIERARCHY_BROADER_SIDE = {
  HYPERNYM: "target", HYPONYM: "source",
  MERONYM: "target", HOLONYM: "source",
  TROPONYM: "source",
};

// Distance, in box-graph hops, from the group's most-connected box
// (BFS, edges treated as undirected -- a box's actual line direction
// under the selected kind doesn't determine which side of the layout
// it belongs on, only how far it is from the hub). Ties for "most
// connected" broken alphabetically by the box's first word, for
// determinism. Used by clusterGraphSVG to place boxes in left-to-right
// columns by level -- most lines then run from a column to the next
// one over, reading left to right.
//
// For a kind in HIERARCHY_BROADER_SIDE, this undirected/most-connected
// approach is skipped entirely in favour of hierarchyLevels() below --
// broader-than-narrower has a real meaning for these kinds, so the
// broadest box always belongs at column 0 (left), not whichever box
// happens to have the most edges.
//
// flatten folds every level down to its BFS-distance *parity*
// (level % 2) instead of the raw hop count -- two columns only (the
// hub's, and everything else's), same as a plain min(level, 1) clamp,
// but clamping breaks the "lines read left to right" goal the moment
// a box lands two-or-more hops out: box C, reachable only through
// B (itself one hop from the hub), clamps to the same column as B,
// so the real B-C edge is drawn within one column -- vertical, not
// left-to-right. Parity avoids this: C is two hops out (even), same
// parity as the hub (column 0), while B is one hop out (odd, column
// 1) -- so the B-C edge still crosses from column 0 to column 1,
// exactly like every other edge, as long as the box graph is
// bipartite (true here: ANTONYM is symmetric with no inherent
// hierarchy, so a chain of antonym-sharing boxes alternates like a
// path, never closing an odd cycle back on itself in practice). Used
// for a symmetric kind like ANTONYM, where a box two hops from the
// hub isn't the hub's antonym at all, just something its antonym
// happens to also oppose (a coincidence of two unrelated word pairs
// sharing one box) -- DEPTH_CAPPED_KINDS below opts specific kinds
// into this.
function undirectedLevels(clusters, edges, flatten) {
  const adjacency = new Map();
  clusters.forEach(c => adjacency.set(c.id, new Set()));
  edges.forEach(e => {
    adjacency.get(e.sourceBox).add(e.targetBox);
    adjacency.get(e.targetBox).add(e.sourceBox);
  });
  const byLabel = (a, b) => a.wordIds[0].localeCompare(b.wordIds[0]);
  const root = clusters.slice().sort((a, b) => (adjacency.get(b.id).size - adjacency.get(a.id).size) || byLabel(a, b))[0];

  const level = new Map();
  level.set(root.id, 0);
  const queue = [root.id];
  while (queue.length) {
    const cur = queue.shift();
    adjacency.get(cur).forEach(next => {
      if (!level.has(next)) { level.set(next, level.get(cur) + 1); queue.push(next); }
    });
  }
  clusters.forEach(c => { if (!level.has(c.id)) level.set(c.id, 0); });
  if (flatten) {
    level.forEach((lvl, id) => level.set(id, lvl % 2));
  }
  return level;
}

// Column 0 (left) is always the broadest term for a hierarchy kind --
// a box's level is the length of its longest directed path, along the
// narrower-to-broader edges HIERARCHY_BROADER_SIDE derives from the
// raw edges, up to a box with no broader term of its own within this
// group (a "root" of the hierarchy: nothing here is broader than it).
// Plain memoised recursion over that DAG, broadest boxes (out-degree 0
// in the narrower->broader direction) hitting the base case first.
// \`visiting\` breaks a cycle defensively (two boxes each claiming to be
// broader than the other, e.g. from two different word-level edges
// landing on the same box pair in opposite directions) by treating the
// back-edge's target as already resolved at level 0 rather than
// recursing forever -- the same guard style hierarchyTreeSVG uses for
// the Hierarchy tab's own tree. Multiple broader terms (e.g. "aircraft"
// having both "machine" and "vehicle" as hypernyms) place the box one
// column to the right of *all* of them, via the max() below, so every
// broader-to-narrower edge still reads strictly left to right.
function hierarchyLevels(clusters, edges, kind) {
  const broaderSide = HIERARCHY_BROADER_SIDE[kind];
  const narrowerToBroader = new Map();
  clusters.forEach(c => narrowerToBroader.set(c.id, new Set()));
  edges.forEach(e => {
    const broader = broaderSide === "source" ? e.sourceBox : e.targetBox;
    const narrower = broaderSide === "source" ? e.targetBox : e.sourceBox;
    if (narrower !== broader) narrowerToBroader.get(narrower).add(broader);
  });

  const level = new Map();
  const visiting = new Set();
  function resolve(id) {
    if (level.has(id)) return level.get(id);
    if (visiting.has(id)) return 0; // cycle guard -- see docstring above
    visiting.add(id);
    const broaderTargets = [...narrowerToBroader.get(id)];
    const result = broaderTargets.length ? 1 + Math.max(...broaderTargets.map(resolve)) : 0;
    visiting.delete(id);
    level.set(id, result);
    return result;
  }
  clusters.forEach(c => resolve(c.id));
  return level;
}

function boxLevels(clusters, edges, kind) {
  if (kind in HIERARCHY_BROADER_SIDE) return hierarchyLevels(clusters, edges, kind);
  return undirectedLevels(clusters, edges, DEPTH_CAPPED_KINDS.has(kind));
}

// ANTONYM has no inherent hierarchy -- a chain beyond one hop is
// coincidence (two different word pairs sharing a box), not a real
// multi-level structure, so its Cyclic view is capped at two columns
// (the hub's column and everything else's). Only applies to kinds not
// already handled by HIERARCHY_BROADER_SIDE above.
const DEPTH_CAPPED_KINDS = new Set(["ANTONYM"]);

// Reorders the boxes within each column to reduce edge crossings,
// leaving which column a box is in (set by boxLevels) untouched --
// only the vertical order within a column changes. Standard layered-
// graph crossing reduction (the barycenter/median heuristic Sugiyama-
// style layout tools use): repeatedly re-sort each column by the
// average vertical position, in the adjacent column, of the boxes it
// connects to, alternating left-to-right and right-to-left sweeps so
// influence propagates across more than just one column pair per pass.
// Doesn't guarantee zero crossings (that's NP-hard in general) but
// noticeably untangles the small graphs this view actually draws.
// Ties (no edge into the neighbouring column, or an identical average)
// keep the incoming order, so the very first pass's alphabetical
// ordering still acts as the deterministic tie-break it always did.
function reduceCrossings(byLevel, edges) {
  const adjacency = new Map();
  byLevel.forEach(list => list.forEach(c => adjacency.set(c.id, [])));
  edges.forEach(e => {
    if (e.sourceBox === e.targetBox) return;
    adjacency.get(e.sourceBox).push(e.targetBox);
    adjacency.get(e.targetBox).push(e.sourceBox);
  });

  const indexOf = (list) => new Map(list.map((c, i) => [c.id, i]));

  function reordered(list, neighbourIndex) {
    const scored = list.map((c, i) => {
      const positions = adjacency.get(c.id)
        .filter(nb => neighbourIndex.has(nb))
        .map(nb => neighbourIndex.get(nb));
      const score = positions.length ? positions.reduce((a, b) => a + b, 0) / positions.length : null;
      return { c, i, score };
    });
    scored.sort((a, b) => {
      if (a.score === null || b.score === null) return a.i - b.i;
      if (a.score !== b.score) return a.score - b.score;
      return a.i - b.i;
    });
    return scored.map(s => s.c);
  }

  const columns = byLevel.map(list => list.slice());
  const sweeps = 4;
  for (let pass = 0; pass < sweeps; pass++) {
    if (pass % 2 === 0) {
      for (let k = 1; k < columns.length; k++) columns[k] = reordered(columns[k], indexOf(columns[k - 1]));
    } else {
      for (let k = columns.length - 2; k >= 0; k--) columns[k] = reordered(columns[k], indexOf(columns[k + 1]));
    }
  }
  return columns;
}
`;
