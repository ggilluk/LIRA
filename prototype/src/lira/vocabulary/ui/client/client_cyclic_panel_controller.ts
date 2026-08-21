/** Verbatim slice of the embedded client script (original dictionary_view.ts
 * lines 4845-4969) -- MAX_CYCLIC_GROUPS_SHOWN/renderCyclic/
 * populateCyclicKindFilter: the Cyclic tab's own orchestration. */
export const CLIENT_CYCLIC_PANEL_CONTROLLER = `// A generous safety cap, not a curation choice.
const MAX_CYCLIC_GROUPS_SHOWN = 400;

function renderCyclic() {
  const note = document.getElementById("cyclic-note");
  const container = document.getElementById("cyclic-clusters");
  if (!state.cyclicKind) {
    note.textContent = "No relationships in this Dictionary yet.";
    container.innerHTML = "";
    return;
  }
  if (OVER_CAPACITY) {
    // buildClusterGraphs() (below) reads WORDS/RELS directly, both []
    // past MAX_INTERACTIVE_WORDS -- unlike the Words/Relationships/
    // Hierarchy tabs, this view has no server-resolved counterpart yet
    // (it boxes every synonym-clustered word in the whole Dictionary,
    // then draws every cross-box edge of the chosen kind -- a
    // whole-graph analysis, not a single word's own neighbourhood, so
    // it doesn't reduce to a bounded per-word query the way Hierarchy's
    // own resolveHierarchy() does). An honest "not available" message,
    // not the misleading "No relationships" text a caller would see
    // otherwise (empty RELS reading as "this Dictionary has no data"
    // rather than "this view can't be built at this Domain's size").
    note.textContent = \`Cyclic isn't available for a Domain this large yet (\${TOTAL_RELATIONSHIP_COUNT.toLocaleString()} relationships) -- search the Relationships tab instead.\`;
    container.innerHTML = "";
    return;
  }
  const { groups, wordById } = buildClusterGraphs(state.cyclicKind);
  if (!groups.length) {
    note.textContent = \`No \${titleCase(state.cyclicKind).toLowerCase()} relationships connect any synonym-clustered words for this kind.\`;
    container.innerHTML = "";
    return;
  }

  // Scope to just the group(s) containing the shared selection, the
  // same way Hierarchy centres its own tree on it (buildHierarchy()'s
  // own docstring) -- without this, every tab keeps showing whichever
  // groups happen to sort largest regardless of what's selected, which
  // reads as "the selection is ignored" even though the selected node
  // IS highlighted wherever it happens to already be on screen
  // (clusterGraphSVG()'s own isSelected). A word with no edges of this
  // kind at all has no group to scope to -- shows an explicit message
  // rather than silently falling back to every unrelated group.
  let scopedGroups = groups;
  let centred = false;
  if (state.selectedWordId) {
    const matching = groups.filter(g => g.clusters.some(c => c.wordIds.includes(state.selectedWordId)));
    if (!matching.length) {
      const selWord = wordById.get(state.selectedWordId);
      note.innerHTML = \`No \${titleCase(state.cyclicKind).toLowerCase()} relationships connect <strong>\${selWord ? selWord.lexical_form : 'the selected word'}</strong> to any synonym-clustered word for this kind. \`
        + '<button type="button" class="link-btn" id="cyclic-reset">show every group</button>';
      document.getElementById("cyclic-reset").addEventListener("click", () => selectWord(null));
      container.innerHTML = "";
      return;
    }
    scopedGroups = matching;
    centred = true;
  }

  const shown = scopedGroups.slice(0, MAX_CYCLIC_GROUPS_SHOWN);
  const totalBoxes = scopedGroups.reduce((s, g) => s + g.clusters.length, 0);
  const totalWords = new Set(scopedGroups.flatMap(g => g.clusters.flatMap(c => c.wordIds))).size;
  const selWord = centred ? wordById.get(state.selectedWordId) : null;
  note.innerHTML = \`Synonyms boxed together, \${titleCase(state.cyclicKind).toLowerCase()} drawn between boxes: \`
    + \`\${scopedGroups.length} group\${scopedGroups.length === 1 ? '' : 's'} &middot; \${totalBoxes} boxes &middot; \${totalWords} words\`
    + (scopedGroups.length > shown.length ? \` -- showing the \${shown.length} largest\` : '') + '.'
    + (centred ? \` -- showing only the group\${scopedGroups.length === 1 ? '' : 's'} containing <strong>\${selWord ? selWord.lexical_form : 'the selected word'}</strong> &middot; <button type="button" class="link-btn" id="cyclic-reset">show every group</button>\` : '');
  container.innerHTML = shown.map(g => \`
    <div class="cyclic-cluster">
      <div class="cyclic-cluster-title">\${g.clusters.length} synonym boxes &middot; \${g.edges.length} \${titleCase(state.cyclicKind).toLowerCase()} edges</div>
      \${clusterGraphSVG(g, wordById, state.cyclicKind)}
    </div>\`).join('');
  const cyclicResetBtn = document.getElementById("cyclic-reset");
  if (cyclicResetBtn) cyclicResetBtn.addEventListener("click", () => selectWord(null));
  container.querySelectorAll(".cyclic-node[data-pivot-id]").forEach(node => {
    node.addEventListener("click", () => selectWord(node.dataset.pivotId));
    node.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectWord(node.dataset.pivotId); }
    });
  });
}

// SYNONYM itself is excluded from this dropdown -- it's what defines
// the boxes (synonymBoxes), not a kind you'd pick to draw lines between
// them (every SYNONYM pair is, by definition, already inside one box
// together, so there'd never be a cross-box SYNONYM line to draw).
// Restricted to group 1 (Lexical Semantic -- ANTONYM, HYPERNYM/HYPONYM,
// MERONYM/HOLONYM, TROPONYM, ENTAILMENT, CAUSE, RELATED), not every
// kind in the Dictionary: this tab's whole premise -- box the synonyms,
// draw lines for what they mean in relation to other words -- is itself
// a Lexical Semantic idea (SYNONYM is group 1), so pairing it with a
// Morphological kind (PLURAL_FORM, LEMMA_FORM, ...) or an Orthographic
// one (CONTRACTION, ...) doesn't read as a meaningful combination -- and
// in practice a high-volume morphological kind like LEMMA_FORM (every
// inflected form has one) would otherwise win the "most edges" default
// and bury the whole page under a wall of a thousand-plus tiny boxes
// that doesn't illustrate what this view is for.
function populateCyclicKindFilter() {
  const select = document.getElementById("cyclic-kind");
  const counts = {};
  RELATIONSHIP_KIND_COUNTS.forEach(({ kind, group, count }) => { if (kind !== "SYNONYM" && group === 1) counts[kind] = count; });
  const kinds = Object.keys(counts).sort();
  appendKindOptions(select, counts);
  // Default to the first kind (by edge count) that actually connects
  // two or more synonym boxes, rather than whichever kind sorts first
  // alphabetically -- most kinds never do (a HYPERNYM edge, say, is far
  // more likely to land entirely within one existing synonym box, or on
  // a word with no synonyms at all, than to bridge two different ones).
  // RELATED is deliberately pushed to the back of that ordering even
  // though it usually has the most edges of any kind here -- it's this
  // whole relationship group's own "unspecified" catch-all (see
  // examples/physics_domain_relationships.py's module docstring:
  // "never as a default when a more specific kind would apply"), so
  // raw edge count alone would make it win the default almost every
  // time, which is exactly the outcome that convention exists to avoid.
  const byCount = [...kinds].sort((a, b) => {
    if (a === "RELATED") return 1;
    if (b === "RELATED") return -1;
    return counts[b] - counts[a];
  });
  const withGroups = byCount.find(kind => buildClusterGraphs(kind).groups.length > 0);
  state.cyclicKind = withGroups || kinds[0] || null;
  if (state.cyclicKind) select.value = state.cyclicKind;
}
`;
