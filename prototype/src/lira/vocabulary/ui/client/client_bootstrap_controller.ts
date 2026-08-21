/** Verbatim slice of the embedded client script (original dictionary_view.ts
 * lines 5113-5271) -- renderUnresolved/renderAll/selectTab, every top-level
 * event-listener wiring, the initial populate-then-renderAll() bootstrap calls,
 * and window.liraDictionaryGoToWord. The last piece of the script body. */
export const CLIENT_BOOTSTRAP_CONTROLLER = `function renderUnresolved() {
  const panel = document.getElementById("unresolved-panel");
  if (!UNRESOLVED.length) {
    panel.style.display = "none";
    return;
  }
  panel.style.display = "block";
  document.getElementById("unresolved-list").innerHTML = UNRESOLVED
    .map(w => \`<span class="word-form">\${w}</span>\`).join('');
}

function renderAll() {
  renderWords();
  renderPhrases();
  renderSenses();
  renderRels();
  renderDetailPanel("words");
  renderDetailPanel("phrases");
  renderDetailPanel("senses");
  renderDetailPanel("hierarchy");
  renderDetailPanel("cyclic");
  renderUnresolved();
  refreshHierarchyKindCounts();
  renderHierarchy();
  renderCyclic();
}

function selectTab(tab) {
  state.tab = tab;
  document.getElementById("tab-words").setAttribute("aria-selected", tab === "words");
  document.getElementById("tab-phrases").setAttribute("aria-selected", tab === "phrases");
  document.getElementById("tab-senses").setAttribute("aria-selected", tab === "senses");
  document.getElementById("tab-rels").setAttribute("aria-selected", tab === "rels");
  document.getElementById("tab-hierarchy").setAttribute("aria-selected", tab === "hierarchy");
  document.getElementById("tab-cyclic").setAttribute("aria-selected", tab === "cyclic");
  document.getElementById("panel-words").classList.toggle("active", tab === "words");
  document.getElementById("panel-phrases").classList.toggle("active", tab === "phrases");
  document.getElementById("panel-senses").classList.toggle("active", tab === "senses");
  document.getElementById("panel-rels").classList.toggle("active", tab === "rels");
  document.getElementById("panel-hierarchy").classList.toggle("active", tab === "hierarchy");
  document.getElementById("panel-cyclic").classList.toggle("active", tab === "cyclic");
}

document.getElementById("tab-words").addEventListener("click", () => { selectTab("words"); });
document.getElementById("tab-phrases").addEventListener("click", () => { selectTab("phrases"); });
document.getElementById("tab-senses").addEventListener("click", () => { selectTab("senses"); });
document.getElementById("tab-rels").addEventListener("click", () => { selectTab("rels"); });
document.getElementById("tab-hierarchy").addEventListener("click", () => { selectTab("hierarchy"); });
document.getElementById("tab-cyclic").addEventListener("click", () => { selectTab("cyclic"); });

document.getElementById("hierarchy-kind").addEventListener("change", (e) => {
  state.hierarchyKind = e.target.value || null;
  // The shared selection is left as-is on a kind change, unlike an
  // earlier version of this handler that cleared it -- selectWord()'s
  // own docstring on why it's shared across every tab now: clearing it
  // here would also deselect the Words/Relationships/Cyclic tabs' own
  // view of the same word, just because the Hierarchy dropdown changed.
  // If the selected word doesn't exist in the new kind's own graph,
  // resolveHierarchy() already degrades gracefully (an empty tree with
  // an honest "No relationships of this kind yet" message, not a crash)
  // rather than needing a reset here to avoid one.
  renderHierarchy();
});

document.getElementById("cyclic-kind").addEventListener("change", (e) => {
  state.cyclicKind = e.target.value || null;
  renderCyclic();
});

document.getElementById("search-word").addEventListener("input", (e) => {
  state.search.word = e.target.value;
  renderAll();
});

document.getElementById("search-gloss").addEventListener("input", (e) => {
  state.search.gloss = e.target.value;
  renderAll();
});

document.getElementById("search-definition").addEventListener("input", (e) => {
  state.search.definition = e.target.value;
  renderAll();
});

document.getElementById("pos-filter").addEventListener("change", (e) => {
  state.pos = e.target.value;
  renderWords();
  renderPhrases();
  renderSenses();
});

document.getElementById("domain-filter").addEventListener("change", (e) => {
  state.domain = e.target.value;
  renderWords();
});

document.getElementById("root-word-filter").addEventListener("change", (e) => {
  state.rootWordsOnly = e.target.checked;
  renderWords();
  renderSenses();
});

document.getElementById("words-body").addEventListener("click", (e) => {
  const row = e.target.closest("tr[data-word-id]");
  if (row) selectWord(row.dataset.wordId);
});

document.getElementById("phrases-body").addEventListener("click", (e) => {
  const row = e.target.closest("tr[data-word-id]");
  if (row) selectWord(row.dataset.wordId);
});

document.getElementById("senses-body").addEventListener("click", (e) => {
  const row = e.target.closest("tr[data-word-id]");
  if (row) selectWord(row.dataset.wordId);
});

document.querySelectorAll("#panel-words thead th[data-sort]").forEach(th => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    const [curKey, curDir] = state.sort.words;
    state.sort.words = [key, curKey === key ? -curDir : 1];
    renderWords();
  });
});

document.querySelectorAll("#panel-rels thead th[data-sort]").forEach(th => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    const [curKey, curDir] = state.sort.rels;
    state.sort.rels = [key, curKey === key ? -curDir : 1];
    renderRels();
  });
});

populatePosFilter();
populateDomainFilter();
populateHierarchyKindFilter();
populateCyclicKindFilter();
renderAll();

// Additive external hook (knowledge/ui/knowledge_view.py) -- lets a
// combined page embedding this fragment as its own "Vocabulary" tab
// pivot straight to one word's detail panel from outside this script's
// own IIFE scope, the same way selectTab/selectWord do it internally.
// window-scoped since render_fragment()'s IIFE wrapping (module
// docstring) otherwise hides every name here from a sibling script.
// Returns false (a no-op) rather than throwing when wordId isn't in
// WORDS -- a Concept the caller holds may have no Word behind it at all
// (e.g. a reified "is-a"/"causes" verb Concept, knowledge/role/dictionary_seeder.py).
// Existing call sites (every current DictionaryView.save()/render()
// caller) are unaffected -- this only adds a global, it changes no
// existing behaviour.
window.liraDictionaryGoToWord = function (wordId) {
  if (!WORDS.some(w => w.id === wordId)) return false;
  selectTab("words");
  selectWord(wordId);
  return true;
};`;
