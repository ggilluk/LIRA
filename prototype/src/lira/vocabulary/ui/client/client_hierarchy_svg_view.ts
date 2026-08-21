/** Verbatim slice of the embedded client script (original dictionary_view.ts
 * lines 4109-4341) -- hierarchyClusterHTML/groupIdsBySense/hierarchyTreeSVG/
 * wireHierarchyGraphNodes: SVG (and cluster-fallback HTML) generation from
 * layout data. */
export const CLIENT_HIERARCHY_SVG_VIEW = `function hierarchyClusterHTML(cluster, wordById) {
  const words = cluster.map(id => wordById.get(id)).filter(Boolean);
  return \`<div class="hierarchy-cluster">
    <div class="hierarchy-cluster-title">\${words.length} words clustered together</div>
    <div class="hierarchy-cluster-words">\${words.map(w =>
      \`<span class="hierarchy-cluster-chip"><button class="link-btn" data-pivot-id="\${w.id}">\${w.lexical_form}</button> \${posPill(w.pos)}</span>\`
    ).join('')}</div>
  </div>\`;
}

// Every id in \`ids\` that shares a WordNet synset (sense_id) is grouped
// into one array, in first-encountered order -- a word with no
// sense_id (not WordNet-sourced) gets a singleton group of its own,
// same as a synset none of whose fellow members are also in \`ids\`.
// hierarchyTreeSVG's own boxing: WordNet's pointer data fans a HYPERNYM
// (or any other) edge out to *every* member of the target synset
// individually (word_seeder.ts's own seedPointerRelationship docstring
// -- "dog"/"domestic dog"/"Canis familiaris" all separately, for the
// identical fact), so without this a tree would show three redundant
// sibling branches for what's really one concept.
function groupIdsBySense(ids, tree) {
  const bySense = new Map();
  const order = [];
  ids.forEach(id => {
    const word = tree.wordById.get(id);
    if (!word) return;
    const key = word.sense_id ? "s:" + word.sense_id : "w:" + id;
    if (!bySense.has(key)) { bySense.set(key, []); order.push(key); }
    bySense.get(key).push(id);
  });
  return order.map(key => bySense.get(key));
}

// Lays out a Hierarchy tree as a left-to-right dendrogram (root column
// at the left, each generation one column further right) instead of an
// indented text list -- an org-chart-style node-and-edge diagram reads
// the actual branching shape of a hierarchy at a glance, the same way
// Cyclic's own box-and-line graph (clusterGraphSVG below) does for its
// cluster relationships, rather than asking the eye to reconstruct it
// from indentation depth. Every *occurrence* here is actually a
// same-synset GROUP (groupIdsBySense above), rendered as a boxed,
// multi-line cluster (mirroring clusterGraphSVG's own per-word-in-box
// treatment) when it has more than one member, or a plain dot + label
// -- unchanged from a single word's own old rendering -- when it doesn't,
// so a non-WordNet hierarchy (e.g. Lemma Form, where sense_id is never
// set) never shows an unnecessary box around every single node.
//
// \`inverted\` (HIERARCHY_INVERTED_KINDS.has(kind)) flips which end of a
// connecting line gets the arrowhead, independent of layout position:
// tree.childrenOf already orients parent = broader/root-ward,
// child = narrower/leaf-ward for these kinds (buildHierarchy()'s own
// docstring on why), but the *edge itself* is still stored child->parent
// (the narrower word's own HYPERNYM pointer names its broader parent),
// so the arrow needs to point from the child's own position back toward
// the parent's -- backward along the tree's own left-to-right layout --
// to actually depict that stored direction, not the reverse.
//
// One pass assigns every group's row top-down, pre-order: a node is
// placed at the next free row *before* its own children are laid out,
// which then stack immediately beneath it -- not the classic centred-
// dendrogram rule (a parent positioned at the midpoint of its already-
// laid-out children), deliberately. WordNet's own broadest root, e.g.
// "entity" for Hypernym, can have hundreds of thousands of descendants;
// centring it over all of them buries its own row deep in the middle of
// a many-thousand-pixel-tall diagram, nowhere near the top a reader
// actually sees first -- exactly the "entity isn't at the top of the
// hierarchy" bug this pre-order layout avoids. Pre-order also means the
// row order matches the old indented text list's own top-to-bottom
// reading order exactly (root, then its first child's whole subtree,
// then its second child's, ...), just drawn instead of indented. Depth
// fixes the column (x); row fixes the vertical position (y) once scaled
// by each row's own height (a multi-member box is taller than a single
// dot, same as clusterGraphSVG's own boxDims).
//
// Two independent guards keep this finite even though the underlying
// graph isn't guaranteed to be a tree (or even acyclic) -- the same
// pair the old text-list version used, now keyed by group rather than
// word: pathSet catches a true cycle within the current branch,
// globalSeen catches a group reached a second time via a *different*
// parent (a legitimate DAG shape, e.g. a word with two hypernyms). Both
// render as a dashed, non-expanding leaf rather than re-entering the
// subtree -- but as their own *occurrence* (a fresh synthetic id,
// tracked separately from any member's own word id), because the same
// group can legitimately appear at more than one position in the
// diagram; edges and layout are keyed by occurrence, so two occurrences
// of one group never fight over a single position, while data-pivot-id
// on every member row still names that member's own real word id for
// click/selection purposes.
function hierarchyTreeSVG(tree, inverted) {
  const LINE_H = 15, ROW_GAP = 12, COL_GAP = 46, MARGIN = 20;
  const occY = new Map();
  const occurrences = [];
  const edges = [];
  let cursorY = MARGIN;
  let occSeq = 0;

  function dims(members) {
    if (members.length === 1) return { width: Math.max(60, members[0].lexical_form.length * 6.3 + 30), height: 22, boxed: false };
    const width = Math.max(70, Math.max(...members.map(m => m.lexical_form.length)) * 6.6 + 30);
    const height = members.length * LINE_H + 14;
    return { width, height, boxed: true };
  }

  function groupKey(group) {
    const word = tree.wordById.get(group[0]);
    return word.sense_id ? "s:" + word.sense_id : "w:" + group[0];
  }

  function visit(group, depth, pathSet, globalSeen) {
    const members = group.map(id => tree.wordById.get(id)).filter(Boolean);
    if (!members.length) return null;
    const key = groupKey(group);
    const occId = "o" + (occSeq++);
    const { width, height, boxed } = dims(members);
    const base = { occId, ids: group, members, depth, width, height, boxed };

    const pushLeaf = kind => {
      const oy = cursorY + height / 2;
      cursorY += height + ROW_GAP;
      occY.set(occId, oy);
      occurrences.push({ ...base, kind });
      return occId;
    };

    if (pathSet.has(key)) return pushLeaf("cycle");

    const childIdsRaw = [];
    group.forEach(id => (tree.childrenOf.get(id) || []).forEach(c => childIdsRaw.push(c)));
    const childGroups = groupIdsBySense([...new Set(childIdsRaw)], tree);

    const firstTimeSeen = !globalSeen.has(key);
    globalSeen.add(key);
    if ((!firstTimeSeen || depth > 14) && childGroups.length) return pushLeaf("seen");
    if (!childGroups.length) return pushLeaf(null);

    // Place this node's own row *before* recursing -- pre-order, not
    // the midpoint-of-children rule pushLeaf's sibling case doesn't
    // need (a leaf has no children to be misplaced relative to).
    const oy = cursorY + height / 2;
    cursorY += height + ROW_GAP;
    occY.set(occId, oy);
    occurrences.push({ ...base, kind: null });

    const nextPath = new Set(pathSet);
    nextPath.add(key);
    const childOccIds = childGroups.map(g => visit(g, depth + 1, nextPath, globalSeen)).filter(Boolean);
    childOccIds.forEach(childOccId => edges.push({ parentOccId: occId, childOccId }));
    return occId;
  }

  groupIdsBySense(tree.roots, tree).forEach(group => visit(group, 0, new Set(), new Set()));
  if (!occurrences.length) return "";

  const maxDepth = Math.max(...occurrences.map(o => o.depth));
  const colWidthByDepth = [];
  for (let d = 0; d <= maxDepth; d++) {
    colWidthByDepth.push(Math.max(...occurrences.filter(o => o.depth === d).map(o => o.width)));
  }
  const colX = [MARGIN];
  for (let d = 1; d <= maxDepth; d++) colX.push(colX[d - 1] + colWidthByDepth[d - 1] + COL_GAP);

  const width = colX[maxDepth] + colWidthByDepth[maxDepth] + MARGIN;
  const height = cursorY + MARGIN;
  const occById = new Map(occurrences.map(o => [o.occId, o]));
  const y = occId => occY.get(occId);
  const x = occId => colX[occById.get(occId).depth];

  let linesHTML = "";
  edges.forEach(({ parentOccId, childOccId }) => {
    const parentOcc = occById.get(parentOccId), childOcc = occById.get(childOccId);
    const px = x(parentOccId) + parentOcc.width, py = y(parentOccId);
    const cx = x(childOccId), cy = y(childOccId);
    const branchX = px + (cx - px) / 2;
    // \`inverted\` swaps which endpoint the arrowhead sits at -- the line
    // itself always runs the same visual path (parent's own right edge
    // to child's own left edge, the layout's own broad-to-narrow
    // direction), only marker-start/marker-end trade places.
    const startMarker = inverted ? \` marker-start="url(#hierarchy-arrow)"\` : '';
    const endMarker = inverted ? '' : \` marker-end="url(#hierarchy-arrow)"\`;
    linesHTML += \`<path d="M\${px.toFixed(1)},\${py.toFixed(1)} H\${branchX.toFixed(1)} V\${cy.toFixed(1)} H\${cx.toFixed(1)}" class="hierarchy-edge"\${startMarker}\${endMarker} />\`;
  });

  let nodesHTML = "";
  occurrences.forEach(o => {
    const nx = x(o.occId), ny = y(o.occId);
    const crossRef = o.kind ? " hierarchy-node-cross-ref" : "";
    const title = o.kind === "cycle" ? "cycle -- already above in this branch" : o.kind === "seen" ? "see elsewhere in this tree" : "";
    const titleHTML = title ? \`<title>\${title}</title>\` : '';
    const suffix = o.kind ? ' ⋯' : '';
    if (!o.boxed) {
      const m = o.members[0];
      const color = POS_COLORS[m.pos] || "#7A7A7A";
      const isSelected = m.id === state.selectedWordId;
      nodesHTML += \`<g class="hierarchy-node-svg\${isSelected ? ' hierarchy-node-selected' : ''}\${crossRef}" data-pivot-id="\${m.id}" tabindex="0" transform="translate(\${nx.toFixed(1)},\${ny.toFixed(1)})">\`
        + titleHTML + \`<circle r="4" fill="\${color}" />\`
        + \`<text x="9" y="4" text-anchor="start">\${m.lexical_form}\${suffix}</text></g>\`;
      return;
    }
    const top = ny - o.height / 2;
    nodesHTML += \`<g class="hierarchy-node-group\${crossRef}">\`
      + titleHTML
      + \`<rect x="\${nx.toFixed(1)}" y="\${top.toFixed(1)}" width="\${o.width.toFixed(1)}" height="\${o.height.toFixed(1)}" rx="6" class="hierarchy-box" />\`;
    o.members.forEach((m, idx) => {
      const color = POS_COLORS[m.pos] || "#7A7A7A";
      const isSelected = m.id === state.selectedWordId;
      const my = top + 11 + idx * LINE_H;
      nodesHTML += \`<g class="hierarchy-node-svg\${isSelected ? ' hierarchy-node-selected' : ''}" data-pivot-id="\${m.id}" tabindex="0" transform="translate(\${(nx + 10).toFixed(1)},\${my.toFixed(1)})">\`
        + \`<circle r="3.5" cx="0" fill="\${color}" />\`
        + \`<text x="8" y="4" text-anchor="start">\${m.lexical_form}\${idx === o.members.length - 1 ? suffix : ''}</text></g>\`;
    });
    nodesHTML += '</g>';
  });

  return \`<div class="hierarchy-svg-wrap"><svg viewBox="0 0 \${width} \${height}" width="\${width}" height="\${height}" class="hierarchy-graph">\`
    + \`<defs><marker id="hierarchy-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">\`
    + \`<path d="M0,0 L10,5 L0,10 z" class="hierarchy-arrow" /></marker></defs>\`
    + \`\${linesHTML}\${nodesHTML}</svg></div>\`;
}

// Wires click/keyboard selection for every node hierarchyTreeSVG() just
// drew into \`container\` -- the same click-or-Enter/Space pattern
// clusterGraphSVG's own \`.cyclic-node[data-pivot-id]\` wiring uses,
// mirrored here rather than shared with it since the two draw into
// different containers at different times.
function wireHierarchyGraphNodes(container) {
  container.querySelectorAll(".hierarchy-node-svg[data-pivot-id]").forEach(node => {
    node.addEventListener("click", () => selectWord(node.dataset.pivotId));
    node.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectWord(node.dataset.pivotId); }
    });
  });
}
`;
