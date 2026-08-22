/** Verbatim slice of the embedded client script (original dictionary_view.ts
 * lines 3626-3884) -- the whole Detail Panel subsystem: wordFormsSectionHTML,
 * the shared-selection word/relationship lookup caches, relationshipsSectionHTML,
 * headwordHTML, wordDetailHTML, phraseDetailHTML, detailHTML, and
 * renderDetailPanel(). Kept as one file rather than split further -- the
 * original script interleaves these tightly (e.g. fetchDetailRelsIfNeeded sits
 * between wordFormsSectionHTML and relationshipsSectionHTML), so separating them
 * into the plan's originally-envisioned client_relationships_section_html.ts/
 * client_word_detail_html.ts/client_phrase_detail_html.ts would require either
 * reordering physical content (breaking byte-identical render() output) or
 * fragmenting into non-contiguous pieces with no real benefit. */
export const CLIENT_DETAIL_PANEL_CONTROLLER = `function wordFormsSectionHTML(word) {
  const hasForms = word.word_forms && word.word_forms.length;
  const hasDerivations = word.derivations && word.derivations.length;
  if (!hasForms && !hasDerivations) {
    return '<div class="detail-section-title">Word Forms</div><div class="detail-empty" style="padding:4px 0">No word forms seeded yet.</div>';
  }
  return \`
    <div class="detail-section-title">Word Forms</div>
    \${(word.word_forms || []).map(f => \`
      <div class="word-form-row">
        <span class="word-form-label">\${f.label}</span>
        <span class="word-form-value">\${f.value}</span>
      </div>\`).join('')}
    \${(word.derivations || []).map(d => \`
      <div class="word-form-row">
        <span class="word-form-label">\${d.label}</span>
        <span class="word-form-value"><button class="link-btn" data-pivot-id="\${d.target.id}">\${d.target.text}</button></span>
      </div>\`).join('')}
  \`;
}

// Search results currently shown in the Words tab, over capacity only --
// renderDetailPanel("words") reads a clicked row's own Word data from
// here instead of WORDS (always [] past MAX_INTERACTIVE_WORDS), kept in
// lockstep with whatever the last "lira-search-words-result" rendered.
let lastWordSearchResults = [];

// Words resolved via a direct id lookup (DictionaryView.searchWords()'s
// own \`wordId\` fast path -- see that method's docstring) after
// wordForDetailPanel() couldn't find them in WORDS/lastWordSearchResults
// -- a related word clicked from inside the detail panel itself is very
// often outside whichever list happens to be loaded right now (a
// different search's own results, or nothing fetched there at all over
// capacity). Keyed by id (shared across every panel, now that selection
// itself is shared -- selectWord()'s own docstring), kept for the
// page's whole lifetime -- a resolved Word's own record never changes
// shape under it, so nothing here ever needs invalidating.
// wordLookupFailed tracks the opposite outcome (an id whose lookup came
// back with nothing -- should never happen for a real relationship's
// own source/target id, but a page bug elsewhere or stale data
// shouldn't loop forever re-requesting it) so renderDetailPanel() can
// show a real "not found" message instead of "Loading…" stuck forever.
// wordLookupInFlight/pendingDetailWordLookups together guard against
// the three detail panels (words/hierarchy/cyclic), all now watching
// the same selection, each independently firing an identical lookup
// for the same id in the same renderAll() pass.
const wordLookupCache = new Map();
const wordLookupFailed = new Set();
const wordLookupInFlight = new Set();
const pendingDetailWordLookups = new Map(); // requestId -> wordId

// panel === "phrases" always falls through to wordLookupCache below,
// never a locally-embedded array the way "words" can -- a selected
// Phrase's own detail data (relationship_count/definition_segments/
// domain/pad/phrase_word_segments, phraseDetailHTML()'s own fields, via
// detailHTML()'s dispatch) only ever comes from the shared
// "lira-search-words"/wordId path (DictionaryView.searchWords()'s own
// Phrases fallback, phraseAsWord() plus phraseWordSegments()) -- the
// Phrases tab's own search results (renderPhrasesOverCapacity()'s
// "lira-search-phrases", plain PhraseRecords, phraseRowHtml()'s own
// leaner shape) are enough for the row list but not this.
function wordForDetailPanel(panel) {
  const selectedId = state.selectedWordId;
  if (selectedId === undefined || selectedId === null) return undefined;
  const source = panel === "words" && OVER_CAPACITY ? lastWordSearchResults : WORDS;
  return source.find(w => w.id === selectedId) || wordLookupCache.get(selectedId);
}

// Dispatches a "lira-search-words" lookup for exactly one Word by id
// (PortalShell's own searchWordsBridge() answers it the same way it
// answers every other "lira-search-words" event -- this is just a
// \`wordId\`-only query instead of a text/filter one). A no-op if
// \`wordId\` is already known to fail (wordLookupFailed's own docstring above) or
// already has a request in flight -- renderDetailPanel() calls this
// once per panel that needs it, but only the first actually dispatches.
function lookupWordForDetailPanel(wordId) {
  if (wordLookupFailed.has(wordId) || wordLookupInFlight.has(wordId)) return;
  wordLookupInFlight.add(wordId);
  const requestId = "detail-word-" + Math.random().toString(36).slice(2);
  pendingDetailWordLookups.set(requestId, wordId);
  document.dispatchEvent(new CustomEvent("lira-search-words", {
    detail: { requestId, wordId, limit: 1 },
  }));
}

// Each detail-empty-<panel> element's own static "Select a word..."
// prompt, captured the first time renderDetailPanel() touches it (a
// data-* attribute survives that element being left in place, unlike a
// module-level constant duplicating the template's own text by hand) --
// swapped out for "Loading…" while a lookupWordForDetailPanel() call is
// in flight, then restored once nothing is selected again.
function emptyPanelDefaultText(el) {
  if (el.dataset.defaultText === undefined) el.dataset.defaultText = el.textContent;
  return el.dataset.defaultText;
}

// Relationship lists for the shared selection's own detail-panel view
// (relationshipsSectionHTML()'s own rels array), fetched once per word
// id and reused by every detail panel showing it -- same sharing
// reasoning, and the same in-flight/cache/pending-requestId shape, as
// wordLookupCache/wordLookupInFlight/pendingDetailWordLookups above.
const detailRelsCache = new Map();
const detailRelsInFlight = new Set();
const pendingDetailRelLookups = new Map(); // requestId -> wordId

function fetchDetailRelsIfNeeded(wordId) {
  if (detailRelsCache.has(wordId) || detailRelsInFlight.has(wordId)) return;
  detailRelsInFlight.add(wordId);
  const requestId = 'detail-rels-' + Math.random().toString(36).slice(2);
  pendingDetailRelLookups.set(requestId, wordId);
  document.dispatchEvent(new CustomEvent("lira-search-relationships", {
    detail: { requestId, wordId, limit: 500 },
  }));
}

// fetchDetailRelsIfNeeded()'s own exact mirror for the new
// LexicalRelationship store -- Sense.Lexical.Relationships
// (sensesSectionHTML(), client_senses_section_html.ts) fetched the same
// way, over its own independent cache/in-flight/pending-requestId set so
// the two relationship kinds never block or clobber each other.
const detailLexicalRelsCache = new Map();
const detailLexicalRelsInFlight = new Set();
const pendingDetailLexicalRelLookups = new Map(); // requestId -> wordId

function fetchDetailLexicalRelsIfNeeded(wordId) {
  if (detailLexicalRelsCache.has(wordId) || detailLexicalRelsInFlight.has(wordId)) return;
  detailLexicalRelsInFlight.add(wordId);
  const requestId = 'detail-lexical-rels-' + Math.random().toString(36).slice(2);
  pendingDetailLexicalRelLookups.set(requestId, wordId);
  document.dispatchEvent(new CustomEvent("lira-search-lexical-relationships", {
    detail: { requestId, wordId, limit: 500 },
  }));
}

// \`rels\` is \`null\` while a selected word's own relationship list is
// still loading over capacity (relationshipsSectionHTML's own "Loading…"
// branch) -- distinct from \`[]\`, which means the fetch already resolved
// and there really are none.
function relationshipsSectionHTML(rels) {
  if (rels === null) return '<div class="detail-empty" style="padding:8px 0">Loading relationships…</div>';
  if (rels.length === 0) return '<div class="detail-empty" style="padding:8px 0">No relationships recorded.</div>';
  return rels.map(r => \`
    <div class="rel-entry">
      <div class="rel-row">
        <span class="rel-dir" title="\${r.outgoing ? 'Outgoing' : 'Incoming'}">\${r.outgoing ? '&rarr;' : '&larr;'}</span>
        \${relPill(r.pillKind || r.kind, r.group)}
        <button class="link-btn" data-pivot-id="\${r.otherId}">\${r.otherText}</button>
        \${senseIdBadge(r.otherSenseId)}
        \${domainPill(r.otherDomain)}
      </div>
      <div class="rel-sentence">\${relationshipSentence(r.kind, r.source_text, r.target_text, r.qualifier)}</div>
      \${(r.otherCategory || r.otherGloss) ? \`<div class="rel-gloss">\${categoryBadge(r.otherCategory)}\${r.otherGloss ? \` \${r.otherGloss}\` : ''}</div>\` : ''}
    </div>\`).join('');
}

// \`rels\` follows relationshipsSectionHTML's own null/[]/populated
// convention.
// A Phrase's own headword ("toy poodle") linked, token by token, to
// each of its constituent Words -- word.phrase_word_segments's own
// docstring (DictionaryView.phraseWordSegments, dictionary_view.ts) on
// why this exists only for a Phrase-resolved record. Reuses
// definitionSegmentHTML() as-is (same hover-tooltip markup a
// definition's own word tokens already get), joined back together with
// plain spaces -- phrase.words has no punctuation of its own to
// preserve between tokens, just the whitespace isMultiWordLemma()
// itself split on. Falls back to the plain lexical_form for an
// ordinary Word, which never carries this field.
function headwordHTML(word) {
  if (!word.phrase_word_segments || !word.phrase_word_segments.length) return word.lexical_form;
  return \`<span class="def-text">\${word.phrase_word_segments.map(definitionSegmentHTML).join(' ')}</span>\`;
}

function wordDetailHTML(word, rels, lexicalRels) {
  return \`
    <div class="detail-word">\${headwordHTML(word)}\${word.is_common ? ' <span class="badge-common">common</span>' : ''}\${word.is_root_word ? ' <span class="badge-root-word">root word</span>' : ''}\${word.is_derivable_noun ? ' <span class="badge-derivable-noun">derivable noun</span>' : ''}\${word.is_fully_hydrated ? '' : ' <span class="badge-common" style="color:#C2544B;border-color:#C2544B">hydration pending</span>'}</div>
    <div style="margin-top:6px">\${posPill(word.pos)} \${domainPill(word.domain)}</div>
    \${word.related_domains && word.related_domains.length ? \`<div class="detail-related-domains" style="margin-top:4px"><span style="opacity:.6">Also:</span> \${word.related_domains.map(domainPill).join(' ')}</div>\` : ''}
    <div class="detail-entry-id" title="Persistent Qualified Word Identity (domain + part of speech + word) -- stable across regenerations, unlike this word's transient graph id">Entry ID <code>\${word.entry_id}</code></div>
    <div class="detail-definition">\${renderDefinition(word)}</div>
    \${sensesSectionHTML(word, rels, lexicalRels)}
    \${wordFormsSectionHTML(word)}
    <div class="detail-section-title">Provenance</div>
    <div class="detail-definition" style="margin-top:0">\${word.sources && word.sources.length ? word.sources.map(s => \`<span class="tag">\${s}</span>\`).join('') : '<span style="opacity:.6">No source recorded.</span>'}</div>
  \`;
}

// Phrase's own detail-panel renderer -- previously the Phrases tab's
// own detail panel rendered a Phrase through wordDetailHTML() above
// unchanged, since searchWords()'s own \`wordId\` branch already resolves
// a Phrase into a WordRecord-shaped object via phraseAsWord() (that
// branch's own docstring) so every WordRecord field wordDetailHTML()
// reads technically exists. But three of those fields name concepts
// that only ever apply to a genuine Word -- is_root_word/
// is_derivable_noun/is_fully_hydrated (phraseAsWord() never sets any of
// them, so they silently read as false/false/false for every Phrase --
// not wrong, exactly, just never meaningful) -- and word_forms is
// always empty for a Phrase too (wordFormsFor() reads Noun/Verb/
// Adjective/Adverb/Pronoun-subtype fields no Phrase carries). Rather
// than keep reusing a function whose own badges and Word Forms section
// name Word-only concepts a Phrase can never actually have, this is its
// own renderer, built from the same section building blocks
// (headwordHTML/posPill/domainPill/phraseTypePill/renderDefinition/
// sensesSectionHTML/relationshipsSectionHTML, all already generic over
// any WordRecord-shaped record) so the Phrases tab's own detail panel
// stays visually aligned with the Words tab's -- same section order,
// same CSS classes, same spacing -- while only ever showing fields a
// Phrase genuinely has: is_common (a Phrase does carry its own
// isCommon, phrase.ts's own docstring), the phrase_type pill
// (word.phrase_type's own docstring -- present only on a Phrase-
// resolved record, never a genuine Word's), and no Word Forms section
// at all, rather than an empty one.
function phraseDetailHTML(phrase, rels, lexicalRels) {
  return \`
    <div class="detail-word">\${headwordHTML(phrase)}\${phrase.is_common ? ' <span class="badge-common">common</span>' : ''}</div>
    <div style="margin-top:6px">\${posPill(phrase.pos)} \${domainPill(phrase.domain)}\${phrase.phrase_type ? ' ' + phraseTypePill(phrase.phrase_type) : ''}</div>
    \${phrase.related_domains && phrase.related_domains.length ? \`<div class="detail-related-domains" style="margin-top:4px"><span style="opacity:.6">Also:</span> \${phrase.related_domains.map(domainPill).join(' ')}</div>\` : ''}
    <div class="detail-entry-id" title="Persistent Qualified Word Identity (domain + part of speech + word) -- stable across regenerations, unlike this phrase's transient graph id">Entry ID <code>\${phrase.entry_id}</code></div>
    \${phrase.head_word ? \`<div class="detail-head-word" style="margin-top:4px" title="The one word whose own lexical class determines this Phrase's phraseType (Head Identification Rule, data/phrase_type_patterns_and_word_roles.md) -- text shown here is its Head Word Form, the phrase-local spelling; the link resolves its own Head Word entity"><span style="opacity:.6">Head Word:</span> \${definitionSegmentHTML(phrase.head_word)}</div>\` : ''}
    <div class="detail-definition">\${renderDefinition(phrase)}</div>
    \${sensesSectionHTML(phrase, rels, lexicalRels)}
    <div class="detail-section-title">Provenance</div>
    <div class="detail-definition" style="margin-top:0">\${phrase.sources && phrase.sources.length ? phrase.sources.map(s => \`<span class="tag">\${s}</span>\`).join('') : '<span style="opacity:.6">No source recorded.</span>'}</div>
  \`;
}

// Dispatches to phraseDetailHTML() or wordDetailHTML() -- every call
// site that used to call wordDetailHTML() directly regardless of
// whether the resolved record actually came from a Word or a Phrase
// now goes through this instead. word.phrase_word_segments's own
// presence is the discriminator, not word.phrase_type (a WordNet-seeded
// Phrase classifyPhraseType() couldn't classify has no phrase_type
// either, but is still a Phrase, not a Word) -- that field's own
// docstring already documents it as set "only when this record was
// resolved from a Phrase", exactly the distinction needed here.
function detailHTML(word, rels, lexicalRels) {
  return word.phrase_word_segments !== undefined ? phraseDetailHTML(word, rels, lexicalRels) : wordDetailHTML(word, rels, lexicalRels);
}

function wireDetailPivotButtons(content) {
  content.querySelectorAll("button[data-pivot-id]").forEach(btn => {
    btn.addEventListener("click", () => selectWord(btn.dataset.pivotId));
  });
}

function renderDetailPanel(panel) {
  const empty = document.getElementById(\`detail-empty-\${panel}\`);
  const content = document.getElementById(\`detail-content-\${panel}\`);
  const selectedId = state.selectedWordId;
  const word = wordForDetailPanel(panel);
  if (!word) {
    content.style.display = "none";
    empty.style.display = "block";
    if (selectedId !== undefined && selectedId !== null && wordLookupFailed.has(selectedId)) {
      empty.textContent = "This word could not be found.";
    } else if (selectedId !== undefined && selectedId !== null) {
      // A selection exists but isn't resolved locally yet -- kick off
      // (or wait on) an id lookup rather than claiming nothing is
      // selected; the "lira-search-words-result" listener below
      // re-renders this panel once it resolves.
      lookupWordForDetailPanel(selectedId);
      empty.textContent = "Loading…";
    } else {
      empty.textContent = emptyPanelDefaultText(empty);
    }
    return;
  }
  const overCapacityRels = OVER_CAPACITY;
  empty.style.display = "none";
  content.style.display = "block";
  const rels = overCapacityRels ? (detailRelsCache.get(word.id) ?? null) : relationshipsForWord(word.id);
  const lexicalRels = overCapacityRels ? (detailLexicalRelsCache.get(word.id) ?? null) : lexicalRelationshipsForWord(word.id);
  content.innerHTML = detailHTML(word, rels, lexicalRels);
  wireDetailPivotButtons(content);

  if (overCapacityRels && !detailRelsCache.has(word.id)) {
    fetchDetailRelsIfNeeded(word.id);
  }
  if (overCapacityRels && !detailLexicalRelsCache.has(word.id)) {
    fetchDetailLexicalRelsIfNeeded(word.id);
  }
}
`;
