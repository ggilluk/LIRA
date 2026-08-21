/** Verbatim slice of the embedded client script (original dictionary_view.ts
 * lines 4970-5112) -- the Relationships tab's own row rendering and
 * over-capacity search dispatch/listener. Physically located near the very
 * end of the original script (after the Hierarchy/Cyclic tabs' own code),
 * not adjacent to the Words/Phrases/Senses tab files above -- reproduced
 * here in that same true position, not reordered next to its sibling tab
 * files, to keep the reassembled script byte-identical to the original. */
export const CLIENT_RELATIONSHIPS_TAB_VIEW = `// Same reasoning as MAX_WORD_ROWS_SHOWN above -- a generous safety cap
// on <tr> elements laid out at once, not a curation choice.
const MAX_REL_ROWS_SHOWN = 1000;

function relRowHtml(r) {
  return \`
    <tr>
      <td><span class="word-form">\${r.source_text}</span> \${r.source_pos ? posPill(r.source_pos) : ''}</td>
      <td>\${relPill(r.kind, r.group)}</td>
      <td><span class="word-form">\${r.target_text}</span> \${r.target_pos ? posPill(r.target_pos) : ''}</td>
      <td style="text-align:right" class="confidence">\${r.confidence.toFixed(4)}</td>
    </tr>\`;
}

let latestRelSearchRequestId = null;
let relSearchDebounceTimer = null;

function renderRels() {
  if (OVER_CAPACITY) {
    renderRelsOverCapacity();
    return;
  }
  let rows = filteredRels();
  const [key, dir] = state.sort.rels;
  rows = sortRows(rows, key, dir);
  const shown = rows.slice(0, MAX_REL_ROWS_SHOWN);
  const body = document.getElementById("rels-body");
  document.getElementById("rels-empty").style.display = rows.length ? "none" : "block";
  const note = document.getElementById("rels-note");
  if (rows.length > shown.length) {
    note.style.display = "block";
    note.textContent = \`Showing the first \${shown.length.toLocaleString()} of \${rows.length.toLocaleString()} matching relationships -- search to narrow.\`;
  } else {
    note.style.display = "none";
  }
  body.innerHTML = shown.map(relRowHtml).join('');
  document.getElementById("stat-rels").textContent = rows.length;
}

// The over-capacity counterpart to renderRels()'s own local-array path
// -- same "lira-search-words"/renderWordsOverCapacity() pattern
// (word_seeder.ts... rather, dictionary_view.ts's own renderWordsOverCapacity()
// docstring), a "lira-search-relationships" event instead. Reuses
// state.search.word as its query -- the Relationships tab has always
// filtered against that one search box (filteredRels()'s own body),
// never a separate relationship-specific one -- and now state.selectedWordId
// too, the shared selection every tab reads (selectWord()'s own
// docstring), scoping the results server-side (searchRelationships()'s
// own \`wordId\` option) the same way filteredRels() scopes them
// client-side under capacity.
function renderRelsOverCapacity() {
  if (relSearchDebounceTimer !== null) clearTimeout(relSearchDebounceTimer);
  relSearchDebounceTimer = setTimeout(() => {
    const requestId = 'rel-search-' + Math.random().toString(36).slice(2);
    latestRelSearchRequestId = requestId;
    document.getElementById("rels-note").style.display = "none";
    document.getElementById("rels-empty").style.display = "none";
    document.getElementById("rels-body").innerHTML =
      '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--ink-muted,#5B6660)">Searching…</td></tr>';
    document.dispatchEvent(new CustomEvent("lira-search-relationships", {
      detail: { requestId, wordId: state.selectedWordId || undefined, query: state.search.word, limit: MAX_REL_ROWS_SHOWN },
    }));
  }, WORD_SEARCH_DEBOUNCE_MS);
}

// Two independent callers share this one event: the Relationships tab's
// own renderRelsOverCapacity() (latestRelSearchRequestId) and the
// shared selection's own detail-panel relationship list
// (pendingDetailRelLookups, fetchDetailRelsIfNeeded()'s own docstring).
// requestId alone tells them apart -- each caller only ever recognises
// its own.
document.addEventListener("lira-search-relationships-result", (e) => {
  const { requestId, relationships, totalMatches } = e.detail;

  if (requestId === latestRelSearchRequestId) {
    const body = document.getElementById("rels-body");
    const empty = document.getElementById("rels-empty");
    const note = document.getElementById("rels-note");
    if (relationships.length === 0) {
      body.innerHTML = "";
      empty.style.display = "block";
      note.style.display = "none";
    } else {
      empty.style.display = "none";
      body.innerHTML = relationships.map(relRowHtml).join('');
      if (totalMatches > relationships.length) {
        note.style.display = "block";
        note.textContent = \`Showing the first \${relationships.length.toLocaleString()} of \${totalMatches.toLocaleString()} matching relationships -- narrow your search to see the rest.\`;
      } else {
        note.style.display = "none";
      }
    }
    document.getElementById("stat-rels").textContent = TOTAL_RELATIONSHIP_COUNT;
    return;
  }

  if (pendingDetailRelLookups.has(requestId)) {
    const wordId = pendingDetailRelLookups.get(requestId);
    pendingDetailRelLookups.delete(requestId);
    detailRelsInFlight.delete(wordId);
    const rels = relationships
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
    detailRelsCache.set(wordId, rels);
    if (state.selectedWordId !== wordId) return;
    refreshHierarchyKindCounts();
    // Every detail panel currently showing this word gets the same
    // patch -- a full detailHTML() re-render off the already-resolved
    // Word/Phrase (no re-fetch, no re-resolve, same cheap "plain DOM
    // update" this used to be for the old flat relationships list), not
    // another renderDetailPanel() call. A narrow .detail-relationships-section
    // replace stopped being enough once relationships were also nested
    // per-sense (sensesSectionHTML()'s own docstring) -- each sense's
    // own count/list needs the same refresh the general section does,
    // so the whole panel body is rebuilt from the one already-known
    // Word/Phrase instead. Includes "phrases" alongside "words"/
    // "hierarchy"/"cyclic" -- a selected Phrase's own detail panel needs
    // this same live relationship patch just as much as a Word's own
    // does, detailHTML()'s own dispatch handles either shape correctly
    // either way.
    ["words", "phrases", "hierarchy", "cyclic"].forEach(panel => {
      const content = document.getElementById(\`detail-content-\${panel}\`);
      if (!content || content.style.display === "none") return;
      const panelWord = wordForDetailPanel(panel);
      if (!panelWord) return;
      content.innerHTML = detailHTML(panelWord, rels);
      wireDetailPivotButtons(content);
    });
  }
});
`;
