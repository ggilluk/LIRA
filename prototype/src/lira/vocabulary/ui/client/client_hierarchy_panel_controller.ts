/** Verbatim slice of the embedded client script (original dictionary_view.ts
 * lines 4342-4512) -- HIERARCHY_NODE_LIMIT/renderHierarchy/
 * renderHierarchyOverCapacity and the Hierarchy tab's own fetch/event/state
 * glue. */
export const CLIENT_HIERARCHY_PANEL_CONTROLLER = `// Server-resolved Hierarchy trees (over MAX_INTERACTIVE_WORDS) are
// capped at this many nodes -- resolveHierarchy()'s own default
// (DictionaryView.resolveHierarchy(), dictionary_view.ts's server-side
// class), passed explicitly here so this file's own docstring lives
// next to the number actually sent, not just the server-side default it
// happens to match.
const HIERARCHY_NODE_LIMIT = 500;

function renderHierarchy() {
  if (OVER_CAPACITY) {
    renderHierarchyOverCapacity();
    return;
  }
  const note = document.getElementById("hierarchy-note");
  const container = document.getElementById("hierarchy-tree");
  if (!state.hierarchyKind) {
    note.textContent = "No relationships in this Dictionary yet.";
    container.innerHTML = "";
    return;
  }
  const tree = buildHierarchy(state.hierarchyKind);

  if (tree.fellBack) {
    // Symmetric kind (every edge's reverse is also stored, e.g. SYNONYM)
    // -- a tree of per-word roots would be almost entirely redundant
    // (each root's children are largely the same mutually-related
    // group as every other root's), so cluster instead: one group per
    // set of mutually-related words.
    const clusters = tree.clusters;
    const totalWords = new Set(clusters.flat()).size;
    const parts = [
      \`\${tree.edgeCount} edge\${tree.edgeCount === 1 ? '' : 's'}\`,
      \`\${clusters.length} cluster\${clusters.length === 1 ? '' : 's'}\`,
      \`\${totalWords} word\${totalWords === 1 ? '' : 's'}\`,
    ];
    note.textContent = parts.join(" · ")
      + " -- every word here has both an incoming and an outgoing edge of this kind (a symmetric relationship), so mutually related words are grouped into clusters instead of a tree of largely-redundant roots.";
    if (!clusters.length) {
      container.innerHTML = '<div class="detail-empty" style="padding:8px 0">No relationships of this kind yet.</div>';
      return;
    }
    container.innerHTML = \`<div class="hierarchy-clusters">\${clusters.map(c => hierarchyClusterHTML(c, tree.wordById)).join('')}</div>\`;
    container.querySelectorAll("button[data-pivot-id]").forEach(btn => {
      btn.addEventListener("click", () => selectWord(btn.dataset.pivotId));
    });
    return;
  }

  // A word is selected but has no edges of this kind at all -- distinct
  // from "no relationships of this kind yet" below, which is about the
  // whole Dictionary, not the selection specifically. Without this
  // check the code below would silently fall through to the full,
  // unscoped forest (buildHierarchy()'s own centred=false case), which
  // reads exactly like the "selection is ignored" bug this whole
  // function exists to fix.
  if (state.selectedWordId && !tree.centred) {
    const selWord = WORDS.find(w => w.id === state.selectedWordId);
    note.innerHTML = \`No relationships of this kind for <strong>\${selWord ? selWord.lexical_form : 'the selected word'}</strong>. \`
      + '<button type="button" class="link-btn" id="hierarchy-reset">show the full tree</button>';
    document.getElementById("hierarchy-reset").addEventListener("click", () => selectWord(null));
    container.innerHTML = "";
    return;
  }

  if (tree.centred) {
    const selWord = tree.wordById.get(state.selectedWordId);
    const parts = [
      \`\${tree.edgeCount} total edge\${tree.edgeCount === 1 ? '' : 's'} of this kind\`,
      \`\${tree.nodeCount} total word\${tree.nodeCount === 1 ? '' : 's'}\`,
      \`showing \${tree.shownNodeCount}\${tree.truncated ? '+' : ''}\`,
    ];
    note.innerHTML = parts.join(" · ")
      + (selWord ? \` -- centred on <strong>\${selWord.lexical_form}</strong>\` : "")
      + (tree.truncated ? ' <span class="hierarchy-cross-ref">(narrowed by node limit -- click a word below to centre the tree there)</span>' : '')
      + ' &middot; <button type="button" class="link-btn" id="hierarchy-reset">back to full tree</button>';
    document.getElementById("hierarchy-reset").addEventListener("click", () => selectWord(null));
  } else {
    const parts = [
      \`\${tree.edgeCount} edge\${tree.edgeCount === 1 ? '' : 's'}\`,
      \`\${tree.nodeCount} word\${tree.nodeCount === 1 ? '' : 's'}\`,
      \`\${tree.roots.length} root\${tree.roots.length === 1 ? '' : 's'}\`,
    ];
    note.textContent = parts.join(" · ");
  }
  if (!tree.roots.length) {
    container.innerHTML = '<div class="detail-empty" style="padding:8px 0">No relationships of this kind yet.</div>';
    return;
  }
  container.innerHTML = hierarchyTreeSVG(tree, tree.inverted);
  wireHierarchyGraphNodes(container);
}

// The over-capacity counterpart to renderHierarchy()'s own local-array
// path: instead of building a forest from an already-embedded RELS
// array (there isn't one -- MAX_INTERACTIVE_WORDS's own docstring),
// this dispatches a "lira-resolve-hierarchy" DOM event and waits for
// whatever's listening (PortalShell's own resolveHierarchyBridge()) to
// resolve it server-side (DictionaryView.resolveHierarchy()) and fire
// back "lira-resolve-hierarchy-result". \`state.selectedWordId\` doubles
// as this view's own "centre word" here (undefined/null means "show
// this kind's own broadest root" -- resolveHierarchy()'s own no-wordId
// mode) -- the same shared selection every other tab reads
// (selectWord()'s own docstring): clicking any node calls selectWord()
// like everywhere else, which re-centres the whole tree on it as a
// natural consequence of renderAll() calling this function again with
// the new selection, rather than a Hierarchy-only "recentre" step. There
// is no small, bounded "this word's own relationships" view to fall
// back on at this scale, so the tree itself has to be the navigable
// surface.
function renderHierarchyOverCapacity() {
  const note = document.getElementById("hierarchy-note");
  const container = document.getElementById("hierarchy-tree");
  if (!state.hierarchyKind) {
    note.textContent = "No relationships in this Dictionary yet.";
    container.innerHTML = "";
    return;
  }
  note.textContent = "Loading…";
  container.innerHTML = "";
  const requestId = 'hierarchy-' + Math.random().toString(36).slice(2);
  latestHierarchyRequestId = requestId;
  document.dispatchEvent(new CustomEvent("lira-resolve-hierarchy", {
    detail: { requestId, kind: state.hierarchyKind, wordId: state.selectedWordId || undefined, limit: HIERARCHY_NODE_LIMIT },
  }));
}

let latestHierarchyRequestId = null;

document.addEventListener("lira-resolve-hierarchy-result", (e) => {
  const { requestId, nodes, edges, roots, totalEdgeCount, totalNodeCount, fellBack, truncated } = e.detail;
  if (requestId !== latestHierarchyRequestId) return; // superseded by a later request
  const note = document.getElementById("hierarchy-note");
  const container = document.getElementById("hierarchy-tree");

  if (fellBack) {
    note.textContent = \`\${totalEdgeCount.toLocaleString()} edges -- every word touched by this kind has both an incoming and an outgoing edge (a symmetric relationship), so there's no meaningful root to centre a tree on. Search the Relationships tab instead.\`;
    container.innerHTML = "";
    return;
  }
  if (!nodes.length) {
    note.textContent = "No relationships of this kind yet.";
    container.innerHTML = "";
    return;
  }

  const wordById = new Map(nodes.map(n => [n.id, n]));
  const childrenOf = new Map();
  edges.forEach(({ parentId, childId }) => {
    if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
    childrenOf.get(parentId).push(childId);
  });
  childrenOf.forEach(list => list.sort((a, b) => (wordById.get(a)?.lexical_form || "").localeCompare(wordById.get(b)?.lexical_form || "")));
  const tree = { wordById, childrenOf, roots };

  const centreWord = state.selectedWordId ? wordById.get(state.selectedWordId) : null;
  const parts = [
    \`\${totalEdgeCount.toLocaleString()} total edge\${totalEdgeCount === 1 ? '' : 's'} of this kind\`,
    \`\${totalNodeCount.toLocaleString()} total word\${totalNodeCount === 1 ? '' : 's'}\`,
    \`showing \${nodes.length.toLocaleString()}\${truncated ? '+' : ''}\`,
  ];
  note.innerHTML = parts.join(" · ")
    + (centreWord ? \` -- centred on <strong>\${centreWord.lexical_form}</strong>\` : " -- centred on this kind's broadest root")
    + (truncated ? ' <span class="hierarchy-cross-ref">(narrowed by node limit -- click a word below to centre the tree there)</span>' : '')
    + (state.selectedWordId ? ' &middot; <button type="button" class="link-btn" id="hierarchy-reset">back to broadest root</button>' : '');

  container.innerHTML = hierarchyTreeSVG(tree, HIERARCHY_INVERTED_KINDS.has(state.hierarchyKind));
  wireHierarchyGraphNodes(container);
  const resetBtn = document.getElementById("hierarchy-reset");
  if (resetBtn) resetBtn.addEventListener("click", () => selectWord(null));
});
`;
