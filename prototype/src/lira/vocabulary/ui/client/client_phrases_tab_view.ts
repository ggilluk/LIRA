/** Verbatim slice of the embedded client script (original dictionary_view.ts
 * lines 3166-3296) -- the Phrases tab's own filtering, row rendering, and
 * over-capacity search dispatch/listener. */
export const CLIENT_PHRASES_TAB_VIEW = `
// Phrases reuse the same free-text search fields (search-word/-gloss/
// -definition) and the shared pos-filter Words already has -- both are
// meaningful for a Phrase (Phrase's own docstring, data/entities/phrase.ts, on
// why it's still a real part-of-speech-tagged lexical entry) -- but not
// domain-filter or the root-word toggle, neither of which a Phrase has
// a field for. Same MAX_INTERACTIVE_WORDS-style capacity split Words
// has now too (renderPhrases()'s own OVER_CAPACITY_PHRASES branch below)
// -- a WordNet-seeded Phrases is tens of thousands of entries, not
// the "always embedded" scale an earlier version of this comment
// assumed.
function matchesPhraseQuery(phrase) {
  const { word: wordQuery, gloss: glossQuery, definition: definitionQuery } = state.search;
  if (wordQuery && !phrase.lexical_form.toLowerCase().includes(wordQuery.toLowerCase())) return false;
  if (glossQuery && !phrase.gloss.toLowerCase().includes(glossQuery.toLowerCase())) return false;
  if (definitionQuery && !phrase.definition.toLowerCase().includes(definitionQuery.toLowerCase())) return false;
  return true;
}

function filteredPhrases() {
  return PHRASES.filter(p => matchesPhraseQuery(p) && (!state.pos || p.pos === state.pos));
}

// data-word-id, not data-phrase-id -- a Phrase's own uuid lives in the
// exact same shared selection every other tab reads/writes
// (state.selectedWordId, selectWord()'s own docstring), so a Phrase row
// picks up the identical CSS (tbody tr[data-word-id]{cursor:pointer},
// .selected highlight) and click-delegation shape the Words table
// already has, rather than needing its own parallel set of both.
function phraseRowHtml(p) {
  return \`
    <tr data-word-id="\${p.id}" class="\${p.id === state.selectedWordId ? 'selected' : ''}">
      <td><span class="word-form">\${p.lexical_form}</span>\${p.is_common ? ' <span class="badge-common">common</span>' : ''}</td>
      <td>\${posPill(p.pos)}</td>
      <td>\${p.phrase_type ? phraseTypePill(p.phrase_type) : '<span style="opacity:.5">&mdash;</span>'}</td>
      <td class="definition">\${p.definition || p.gloss || '<span style="opacity:.5">&mdash;</span>'}</td>
      <td>\${p.register_codes.concat(p.editorial_labels).map(t => \`<span class="tag">\${titleCase(t)}</span>\`).join('')}</td>
    </tr>\`;
}

// A generous safety cap, not a curation choice -- same reasoning as
// MAX_WORD_ROWS_SHOWN above: a WordNet-seeded Phrases can carry tens
// of thousands of Phrases, and laying out that many <tr> elements in
// one innerHTML assignment is what actually locks up the tab, not
// anything about the data itself. Narrow with search/filters to reach a
// phrase outside the first MAX_PHRASE_ROWS_SHOWN.
const MAX_PHRASE_ROWS_SHOWN = 1000;

function renderPhrases() {
  if (OVER_CAPACITY_PHRASES) {
    renderPhrasesOverCapacity();
    return;
  }
  const rows = filteredPhrases().slice().sort((a, b) => a.lexical_form.toLowerCase().localeCompare(b.lexical_form.toLowerCase()));
  const shown = rows.slice(0, MAX_PHRASE_ROWS_SHOWN);
  const body = document.getElementById("phrases-body");
  document.getElementById("phrases-empty").style.display = rows.length ? "none" : "block";
  const note = document.getElementById("phrases-note");
  if (rows.length > shown.length) {
    note.style.display = "block";
    note.textContent = \`Showing the first \${shown.length.toLocaleString()} of \${rows.length.toLocaleString()} matching phrases -- search or filter to narrow.\`;
  } else {
    note.style.display = "none";
  }
  body.innerHTML = shown.map(phraseRowHtml).join('');
  document.getElementById("stat-phrases").textContent = rows.length;
}

// requestId of the most recently *dispatched* over-capacity Phrases
// search -- latestWordSearchRequestId's own exact counterpart, same
// stale-response guard.
let latestPhraseSearchRequestId = null;
let phraseSearchDebounceTimer = null;

// renderWordsOverCapacity()'s own exact counterpart for the Phrases tab
// -- see that function's own docstring for why this dispatches a
// "lira-search-phrases" DOM event instead of filtering an already-
// embedded PHRASES array (there isn't one, past OVER_CAPACITY_PHRASES).
function renderPhrasesOverCapacity() {
  if (phraseSearchDebounceTimer !== null) clearTimeout(phraseSearchDebounceTimer);
  phraseSearchDebounceTimer = setTimeout(() => {
    const requestId = 'phrase-search-' + Math.random().toString(36).slice(2);
    latestPhraseSearchRequestId = requestId;
    document.getElementById("phrases-note").style.display = "none";
    document.getElementById("phrases-empty").style.display = "none";
    document.getElementById("phrases-body").innerHTML =
      '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--ink-muted,#5B6660)">Searching…</td></tr>';
    document.dispatchEvent(new CustomEvent("lira-search-phrases", {
      detail: {
        requestId,
        word: state.search.word,
        gloss: state.search.gloss,
        definition: state.search.definition,
        pos: state.pos,
        limit: MAX_PHRASE_ROWS_SHOWN,
      },
    }));
  }, WORD_SEARCH_DEBOUNCE_MS);
}

// "lira-search-words-result"'s own exact counterpart for Phrases --
// renders the row list only (this event's own phrases are plain
// PhraseRecords, phraseRowHtml()'s own leaner shape -- not enough to
// feed the detail panel, wordForDetailPanel()'s own docstring on why a
// Phrase's own detail-panel resolution always goes through the shared
// "lira-search-words"/wordId path instead, regardless of this event).
document.addEventListener("lira-search-phrases-result", (e) => {
  const { requestId, phrases, totalMatches } = e.detail;
  if (requestId !== latestPhraseSearchRequestId) return;

  const body = document.getElementById("phrases-body");
  const empty = document.getElementById("phrases-empty");
  const note = document.getElementById("phrases-note");
  if (phrases.length === 0) {
    body.innerHTML = "";
    empty.style.display = "block";
    note.style.display = "none";
  } else {
    empty.style.display = "none";
    body.innerHTML = phrases.map(phraseRowHtml).join('');
    if (totalMatches > phrases.length) {
      note.style.display = "block";
      note.textContent = \`Showing the first \${phrases.length.toLocaleString()} of \${totalMatches.toLocaleString()} matching phrases -- narrow your search to see the rest.\`;
    } else {
      note.style.display = "none";
    }
  }
  document.getElementById("stat-phrases").textContent = TOTAL_PHRASE_COUNT;
  renderDetailPanel("phrases");
});
`;
