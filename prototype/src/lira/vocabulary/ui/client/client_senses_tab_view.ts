/** Verbatim slice of the embedded client script (original dictionary_view.ts
 * lines 3297-3419) -- the Senses tab's own filtering, row rendering, and
 * over-capacity search dispatch/listener. */
export const CLIENT_SENSES_TAB_VIEW = `// Senses reuse the same free-text search fields and pos-filter Phrases
// already does (matchesPhraseQuery()'s own docstring on why both are
// meaningful) -- \`word\` matches against \`lexical_form\`, itself every
// member's own lexical form joined together (SenseRecord's own
// docstring, dictionary_view.ts), not a spelling Sense has of its own.
function matchesSenseQuery(sense) {
  const { word: wordQuery, gloss: glossQuery, definition: definitionQuery } = state.search;
  if (wordQuery && !sense.lexical_form.toLowerCase().includes(wordQuery.toLowerCase())) return false;
  if (glossQuery && !sense.gloss.toLowerCase().includes(glossQuery.toLowerCase())) return false;
  if (definitionQuery && !sense.definition.toLowerCase().includes(definitionQuery.toLowerCase())) return false;
  return true;
}

function filteredSenses() {
  return SENSES.filter(s => matchesSenseQuery(s) && (!state.pos || s.pos === state.pos) && (!state.rootWordsOnly || s.is_root_word));
}

// data-word-id, not data-sense-id -- phraseRowHtml()'s own exact
// reasoning: a Sense's own uuid lives in the identical shared selection
// every other tab reads/writes (state.selectedWordId), resolved to its
// first-registered member's own full Word detail via the shared
// "lira-search-words"/wordId path (DictionaryView.searchWords()'s own
// Senses fallback), not a parallel selection/lookup mechanism of its
// own.
function senseRowHtml(s) {
  return \`
    <tr data-word-id="\${s.id}" class="\${s.id === state.selectedWordId ? 'selected' : ''}">
      <td><span class="word-form">\${s.lexical_form}</span>\${s.is_common ? ' <span class="badge-common">common</span>' : ''}</td>
      <td>\${s.pos ? posPill(s.pos) : ''}</td>
      <td>\${domainPill(s.domain)}</td>
      <td class="definition">\${s.definition || s.gloss || '<span style="opacity:.5">&mdash;</span>'}</td>
      <td style="text-align:right;font-variant-numeric:tabular-nums">\${s.sense_frequency === null ? '<span style="opacity:.5">&mdash;</span>' : s.sense_frequency.toLocaleString()}</td>
      <td>\${s.is_root_word ? '<span class="badge-root-word">root word</span>' : ''}</td>
    </tr>\`;
}

// MAX_PHRASE_ROWS_SHOWN's own exact counterpart, same reasoning -- a
// WordNet-seeded Senses store can carry over a hundred thousand
// entries.
const MAX_SENSE_ROWS_SHOWN = 1000;

function renderSenses() {
  if (OVER_CAPACITY_SENSES) {
    renderSensesOverCapacity();
    return;
  }
  const rows = filteredSenses().slice().sort((a, b) => a.lexical_form.toLowerCase().localeCompare(b.lexical_form.toLowerCase()));
  const shown = rows.slice(0, MAX_SENSE_ROWS_SHOWN);
  const body = document.getElementById("senses-body");
  document.getElementById("senses-empty").style.display = rows.length ? "none" : "block";
  const note = document.getElementById("senses-note");
  if (rows.length > shown.length) {
    note.style.display = "block";
    note.textContent = \`Showing the first \${shown.length.toLocaleString()} of \${rows.length.toLocaleString()} matching senses -- search or filter to narrow.\`;
  } else {
    note.style.display = "none";
  }
  body.innerHTML = shown.map(senseRowHtml).join('');
  document.getElementById("stat-senses").textContent = rows.length;
}

// requestId of the most recently *dispatched* over-capacity Senses
// search -- latestPhraseSearchRequestId's own exact counterpart, same
// stale-response guard.
let latestSenseSearchRequestId = null;
let senseSearchDebounceTimer = null;

// renderPhrasesOverCapacity()'s own exact counterpart for the Senses
// tab -- dispatches a "lira-search-senses" DOM event instead of
// filtering an already-embedded SENSES array (there isn't one, past
// OVER_CAPACITY_SENSES).
function renderSensesOverCapacity() {
  if (senseSearchDebounceTimer !== null) clearTimeout(senseSearchDebounceTimer);
  senseSearchDebounceTimer = setTimeout(() => {
    const requestId = 'sense-search-' + Math.random().toString(36).slice(2);
    latestSenseSearchRequestId = requestId;
    document.getElementById("senses-note").style.display = "none";
    document.getElementById("senses-empty").style.display = "none";
    document.getElementById("senses-body").innerHTML =
      '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--ink-muted,#5B6660)">Searching…</td></tr>';
    document.dispatchEvent(new CustomEvent("lira-search-senses", {
      detail: {
        requestId,
        word: state.search.word,
        gloss: state.search.gloss,
        definition: state.search.definition,
        pos: state.pos,
        limit: MAX_SENSE_ROWS_SHOWN,
      },
    }));
  }, WORD_SEARCH_DEBOUNCE_MS);
}

// "lira-search-phrases-result"'s own exact counterpart for Senses --
// renders the row list only; a selected Sense's own detail-panel data
// always resolves via the shared "lira-search-words"/wordId path
// instead (DictionaryView.searchWords()'s own Senses fallback), same
// reasoning as the Phrases listener just above.
document.addEventListener("lira-search-senses-result", (e) => {
  const { requestId, senses, totalMatches } = e.detail;
  if (requestId !== latestSenseSearchRequestId) return;

  const body = document.getElementById("senses-body");
  const empty = document.getElementById("senses-empty");
  const note = document.getElementById("senses-note");
  if (senses.length === 0) {
    body.innerHTML = "";
    empty.style.display = "block";
    note.style.display = "none";
  } else {
    empty.style.display = "none";
    body.innerHTML = senses.map(senseRowHtml).join('');
    if (totalMatches > senses.length) {
      note.style.display = "block";
      note.textContent = \`Showing the first \${senses.length.toLocaleString()} of \${totalMatches.toLocaleString()} matching senses -- narrow your search to see the rest.\`;
    } else {
      note.style.display = "none";
    }
  }
  document.getElementById("stat-senses").textContent = TOTAL_SENSE_COUNT;
  renderDetailPanel("senses");
});
`;
