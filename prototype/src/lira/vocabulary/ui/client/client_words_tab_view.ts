/** Verbatim slice of the embedded client script (original dictionary_view.ts
 * lines 3056-3165) -- the Words tab's own filtering + row rendering
 * (matchesQuery/filteredWords/wordRowHtml/renderWords), plus filteredRels/
 * relationshipsForWord/sortRows, which the original script physically
 * interleaves here even though they're shared by other tabs too. */
export const CLIENT_WORDS_TAB_VIEW = `
// Three independent substring filters (AND'd together, each one a
// no-op while empty) rather than one combined "word, gloss, or
// definition" box -- a search for a gloss term no longer also surfaces
// unrelated words whose *definition* happens to share that substring,
// and vice versa.
function matchesQuery(word) {
  const { word: wordQuery, gloss: glossQuery, definition: definitionQuery } = state.search;
  if (wordQuery && !word.lexical_form.toLowerCase().includes(wordQuery.toLowerCase())) return false;
  if (glossQuery && !word.gloss.toLowerCase().includes(glossQuery.toLowerCase())) return false;
  if (definitionQuery && !word.definition.toLowerCase().includes(definitionQuery.toLowerCase())) return false;
  return true;
}

function filteredWords() {
  return WORDS.filter(w => matchesQuery(w) && (!state.pos || w.pos === state.pos) && (!state.domain || w.domain === state.domain) && (!state.rootWordsOnly || w.is_root_word));
}

// AND's two independent conditions: the shared selection (any word
// selected in any tab -- selectWord()'s own docstring on why every tab
// reads the same value) scopes the table down to just that word's own
// relationships, on top of whichever free-text query is still typed
// into the search box, exactly the way the Words tab's own pos/domain/
// rootWordsOnly filters already compose with its own text search.
function filteredRels() {
  return RELS.filter(r => {
    if (state.selectedWordId && r.source_id !== state.selectedWordId && r.target_id !== state.selectedWordId) return false;
    const q = state.search.word;
    if (!q) return true;
    const ql = q.toLowerCase();
    return r.source_text.toLowerCase().includes(ql) || r.target_text.toLowerCase().includes(ql) || r.kind.toLowerCase().includes(ql);
  });
}

function relationshipsForWord(wordId) {
  return RELS.filter(r => r.source_id === wordId || r.target_id === wordId)
    .map(r => {
      const outgoing = r.source_id === wordId;
      return {
        ...r, outgoing,
        otherId: outgoing ? r.target_id : r.source_id,
        otherText: outgoing ? r.target_text : r.source_text,
        otherDomain: outgoing ? r.target_domain : r.source_domain,
        otherSenseId: outgoing ? r.target_sense_id : r.source_sense_id,
        otherCategory: outgoing ? r.target_category : r.source_category,
        otherGloss: outgoing ? r.target_gloss : r.source_gloss,
        pillKind: displayKind(r.kind, outgoing),
      };
    })
    .sort((a, b) => (a.group - b.group) || a.kind.localeCompare(b.kind));
}

function sortRows(rows, key, dir) {
  return rows.slice().sort((a, b) => {
    const av = a[key], bv = b[key];
    if (typeof av === "number") return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
}

// A generous safety cap, not a curation choice -- same reasoning as
// MAX_CYCLIC_GROUPS_SHOWN above: a Domain seeded from WordNet can carry
// hundreds of thousands of Words, and laying out that many <tr>
// elements in one innerHTML assignment is what actually locks up the
// tab, not anything about the data itself. Narrow with search/filters
// to reach a word outside the first MAX_WORD_ROWS_SHOWN.
const MAX_WORD_ROWS_SHOWN = 1000;

function wordRowHtml(w) {
  return \`
    <tr data-word-id="\${w.id}" class="\${w.id === state.selectedWordId ? 'selected' : ''}">
      <td><span class="word-form">\${w.lexical_form}</span> \${senseIdBadge(w.sense_id)}\${w.is_common ? ' <span class="badge-common">common</span>' : ''}\${w.is_root_word ? ' <span class="badge-root-word">root word</span>' : ''}\${w.is_derivable_noun ? ' <span class="badge-derivable-noun">derivable noun</span>' : ''}</td>
      <td>\${posPill(w.pos)}</td>
      <td>\${domainPill(w.domain)}</td>
      <td class="definition">\${w.definition || w.gloss || '<span style="opacity:.5">&mdash;</span>'}</td>
      <td>\${w.register_codes.concat(w.editorial_labels).map(t => \`<span class="tag">\${titleCase(t)}</span>\`).join('')}</td>
      <td style="text-align:right" class="rel-count">\${w.relationship_count}</td>
    </tr>\`;
}

// requestId of the most recently *dispatched* over-capacity search --
// renderWordsOverCapacity's own lira-search-words-result listener
// compares against this so a slow earlier search's response can never
// clobber a faster later one's (the same stale-response guard
// PortalShell's own render()/loadView() apply to a Vocabulary fragment
// fetch, portal_shell.ts's own comment on renderToken).
let latestWordSearchRequestId = null;
let wordSearchDebounceTimer = null;

function renderWords() {
  if (OVER_CAPACITY) {
    renderWordsOverCapacity();
    return;
  }
  let rows = filteredWords();
  const [key, dir] = state.sort.words;
  rows = sortRows(rows, key, dir);
  const shown = rows.slice(0, MAX_WORD_ROWS_SHOWN);
  const body = document.getElementById("words-body");
  document.getElementById("words-empty").style.display = rows.length ? "none" : "block";
  const note = document.getElementById("words-note");
  if (rows.length > shown.length) {
    note.style.display = "block";
    note.textContent = \`Showing the first \${shown.length.toLocaleString()} of \${rows.length.toLocaleString()} matching words -- search or filter to narrow.\`;
  } else {
    note.style.display = "none";
  }
  body.innerHTML = shown.map(wordRowHtml).join('');
  document.getElementById("stat-words").textContent = rows.length;
}`;
