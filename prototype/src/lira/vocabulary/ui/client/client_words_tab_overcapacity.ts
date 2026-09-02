/** Verbatim slice of the embedded client script (original dictionary_view.ts
 * lines 3420-3547) -- the Words tab's own over-capacity search dispatch/
 * listener (WORD_SEARCH_DEBOUNCE_MS/renderWordsOverCapacity, shared by the
 * Phrases/Senses over-capacity paths above via forward closure reference)
 * plus selectWord(), the one place the shared selection is ever written --
 * physically adjacent here in the original script, not next to the rest of
 * the Words tab's own code above. */
export const CLIENT_WORDS_TAB_OVERCAPACITY = `// How long to wait after the last keystroke before actually dispatching
// an over-capacity search -- WORDS/RELS are both [] past
// MAX_INTERACTIVE_WORDS, so unlike the local-array paths above (instant,
// in-process filtering), every keystroke here is a round trip out to the
// Vocabulary Service worker (lira-search-words/lira-search-relationships
// below, shared by both renderWordsOverCapacity() and
// renderRelsOverCapacity()); debouncing keeps a fast typist from firing
// a search per character.
const WORD_SEARCH_DEBOUNCE_MS = 250;

// The over-capacity counterpart to renderWords()'s own local-array
// path: instead of filtering an already-embedded WORDS array (there
// isn't one -- MAX_INTERACTIVE_WORDS's own docstring), this dispatches
// a "lira-search-words" DOM event carrying the current search/filter
// state and waits for whatever's listening (PortalShell, when this
// fragment is embedded in the Portal -- portal_shell.ts's own listener)
// to resolve it against the real Dictionary and fire back
// "lira-search-words-result" with the same requestId. A standalone
// render()/downloadAsFile() page (no Portal, no worker to ask) has
// nothing listening for the event at all, so an over-capacity Domain
// there stays non-interactive beyond the stat tiles -- a real
// limitation of a page with no server behind it, not a bug.
function renderWordsOverCapacity() {
  if (wordSearchDebounceTimer !== null) clearTimeout(wordSearchDebounceTimer);
  wordSearchDebounceTimer = setTimeout(() => {
    const requestId = 'word-search-' + Math.random().toString(36).slice(2);
    latestWordSearchRequestId = requestId;
    document.getElementById("words-note").style.display = "none";
    document.getElementById("words-empty").style.display = "none";
    document.getElementById("words-body").innerHTML =
      // 33 columns: Word, the 27 WordForm columns, Part of speech,
      // Domain, Definition, Labels, Relationships (client_shell_html.ts's
      // own <thead> row) -- kept in sync by hand alongside it.
      '<tr><td colspan="33" style="text-align:center;padding:24px;color:var(--ink-muted,#5B6660)">Searching…</td></tr>';
    document.dispatchEvent(new CustomEvent("lira-search-words", {
      detail: {
        requestId,
        word: state.search.word,
        gloss: state.search.gloss,
        definition: state.search.definition,
        pos: state.pos,
        domain: state.domain,
        rootWordsOnly: state.rootWordsOnly,
        limit: MAX_WORD_ROWS_SHOWN,
      },
    }));
  }, WORD_SEARCH_DEBOUNCE_MS);
}

// Two independent callers share this one event: the Words tab's own
// renderWordsOverCapacity() (latestWordSearchRequestId) and the shared
// selection's own per-id lookup (pendingDetailWordLookups,
// lookupWordForDetailPanel()'s own docstring). requestId alone tells
// them apart -- each caller only ever recognises its own, the same
// pattern the "lira-search-relationships-result" listener already uses.
document.addEventListener("lira-search-words-result", (e) => {
  const { requestId, words, totalMatches } = e.detail;

  if (requestId === latestWordSearchRequestId) {
    lastWordSearchResults = words;
    const body = document.getElementById("words-body");
    const empty = document.getElementById("words-empty");
    const note = document.getElementById("words-note");
    if (words.length === 0) {
      body.innerHTML = "";
      empty.style.display = "block";
      note.style.display = "none";
    } else {
      empty.style.display = "none";
      body.innerHTML = words.map(wordRowHtml).join('');
      if (totalMatches > words.length) {
        note.style.display = "block";
        note.textContent = \`Showing the first \${words.length.toLocaleString()} of \${totalMatches.toLocaleString()} matching words -- narrow your search to see the rest.\`;
      } else {
        note.style.display = "none";
      }
    }
    document.getElementById("stat-words").textContent = TOTAL_WORD_COUNT;
    // Refreshes against the just-updated lastWordSearchResults -- clears
    // the detail panel back to empty if whatever was selected isn't in
    // this search's own results, same as the local-array path's own
    // renderAll() already does for every other search keystroke.
    renderDetailPanel("words");
    return;
  }

  if (pendingDetailWordLookups.has(requestId)) {
    const wordId = pendingDetailWordLookups.get(requestId);
    pendingDetailWordLookups.delete(requestId);
    wordLookupInFlight.delete(wordId);
    if (words.length > 0) wordLookupCache.set(wordId, words[0]);
    else wordLookupFailed.add(wordId);
    // Only re-render if this id is still the shared selection -- a
    // lookup answering a click that's since been superseded by a newer
    // one is simply dropped, same guard latestWordSearchRequestId
    // applies above. All detail panels share this one lookup
    // (selectWord()'s own docstring on why selection is shared), so all
    // of them refresh together rather than each firing its own redundant
    // request for the identical word.
    if (state.selectedWordId === wordId) {
      renderDetailPanel("words");
      renderDetailPanel("phrases");
      renderDetailPanel("senses");
      renderDetailPanel("hierarchy");
      renderDetailPanel("cyclic");
    }
  }
});

// The one place state.selectedWordId is ever written -- every tab's own
// click handler (a Words row, a related-word pivot, a Hierarchy tree
// node, a Cyclic cluster node) calls this instead of keeping its own
// independent selection the way an earlier version of this script did.
// renderAll() then refreshes every view against the new shared value:
// Words (row highlight + detail panel), Relationships (re-scopes its
// own table to just this word, filteredRels()'s/renderRelsOverCapacity()'s
// own docstrings), Hierarchy (re-centres its tree on it, over capacity --
// renderHierarchyOverCapacity()'s own docstring on why there's no
// separate "recentre" step needed beyond this), and Cyclic (highlights
// its own cluster). The Words-row highlight is also toggled directly,
// synchronously, ahead of renderAll()'s own (possibly debounced, over
// capacity) re-render -- a plain class toggle so clicking a row you can
// already see responds instantly instead of waiting on a round trip.
function selectWord(wordId) {
  state.selectedWordId = wordId;
  document.querySelectorAll("#words-body tr[data-word-id], #phrases-body tr[data-word-id], #senses-body tr[data-word-id]").forEach(tr => {
    tr.classList.toggle("selected", tr.dataset.wordId === wordId);
  });
  renderAll();
}
`;
