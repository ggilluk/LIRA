/** Verbatim slice of PAGE_TEMPLATE's HTML body shell (original
 * dictionary_view.ts lines 2507-2680) -- the
 * <!--@@BODY_FRAGMENT_START/END@@--> markers stay embedded in place. */
export const CLIENT_SHELL_HTML = `<body>
<div class="page">
  <header class="masthead">
    <h1>@@TITLE@@</h1>
    <div class="subtitle">@@WORD_COUNT@@ words &middot; @@RELATIONSHIP_COUNT@@ relationships &middot; compiled @@COMPILED_AT@@</div>
  </header>
  <!--@@BODY_FRAGMENT_START@@-->

  <div class="stat-row">
    <div class="stat"><div class="value" id="stat-words">@@WORD_COUNT@@</div><div class="label">Words</div></div>
    <div class="stat"><div class="value" id="stat-phrases">@@PHRASE_COUNT@@</div><div class="label">Phrases</div></div>
    <div class="stat"><div class="value" id="stat-senses">@@SENSE_COUNT@@</div><div class="label">Senses</div></div>
    <div class="stat"><div class="value" id="stat-rels">@@RELATIONSHIP_COUNT@@</div><div class="label">Relationships</div></div>
    <div class="stat"><div class="value">@@COMMON_COUNT@@</div><div class="label">Common vocabulary</div></div>
    <div class="stat"><div class="value">@@DOMAIN_SPECIFIC_COUNT@@</div><div class="label">Domain-specific</div></div>
    <div class="stat"><div class="value">@@POS_COUNT@@</div><div class="label">Parts of speech</div></div>
    <div class="stat"><div class="value">@@UNRESOLVED_COUNT@@</div><div class="label">Unresolved</div></div>
  </div>

  <div class="toolbar">
    <div class="search-field"><input id="search-word" type="text" placeholder="Search word&hellip;" aria-label="Search word" autocomplete="off"></div>
    <div class="search-field"><input id="search-gloss" type="text" placeholder="Search gloss&hellip;" aria-label="Search gloss" autocomplete="off"></div>
    <div class="search-field"><input id="search-definition" type="text" placeholder="Search definition&hellip;" aria-label="Search definition" autocomplete="off"></div>
    <select id="pos-filter"><option value="">All parts of speech</option></select>
    <select id="domain-filter"><option value="">All domains</option></select>
    <label class="root-word-toggle-label"><input type="checkbox" id="root-word-filter"> Root words only</label>
    <div class="tabs" role="tablist">
      <button id="tab-words" role="tab" aria-selected="true">Words</button>
      <button id="tab-phrases" role="tab" aria-selected="false">Phrases</button>
      <button id="tab-senses" role="tab" aria-selected="false">Senses</button>
      <button id="tab-rels" role="tab" aria-selected="false">Relationships</button>
      <button id="tab-hierarchy" role="tab" aria-selected="false">Hierarchy</button>
      <button id="tab-cyclic" role="tab" aria-selected="false">Cyclic</button>
    </div>
  </div>

  <section class="unresolved-panel" id="unresolved-panel" style="display:none">
    <div class="detail-section-title" style="margin-top:0">Unresolved &mdash; no seeded sense, no successful hydration</div>
    <div id="unresolved-list"></div>
  </section>

  <section class="panel active" id="panel-words">
    <div class="words-layout">
      <aside class="detail-panel">
        <div class="detail-empty" id="detail-empty-words">Select a word below to see its relationships.</div>
        <div id="detail-content-words" style="display:none"></div>
      </aside>
      <div class="table-wrap">
        <div class="cyclic-note" id="words-note" style="display:none"></div>
        <table>
          <thead>
            <tr>
              <th data-sort="lexical_form">Word</th>
              <th data-sort="pos">Part of speech</th>
              <th data-sort="domain">Domain</th>
              <th data-sort="definition">Definition</th>
              <th>Labels</th>
              <th data-sort="relationship_count" style="text-align:right">Relationships</th>
            </tr>
          </thead>
          <tbody id="words-body"></tbody>
        </table>
        <div class="empty-state" id="words-empty" style="display:none">@@WORDS_EMPTY_MESSAGE@@</div>
      </div>
    </div>
  </section>

  <section class="panel" id="panel-phrases">
    <div class="words-layout">
      <aside class="detail-panel">
        <div class="detail-empty" id="detail-empty-phrases">Select a phrase below to see its relationships.</div>
        <div id="detail-content-phrases" style="display:none"></div>
      </aside>
      <div class="table-wrap">
        <div class="cyclic-note" id="phrases-note" style="display:none"></div>
        <table>
          <thead>
            <tr>
              <th data-sort="lexical_form">Phrase</th>
              <th data-sort="pos">Part of speech</th>
              <th data-sort="phrase_type">Phrase type</th>
              <th data-sort="definition">Definition</th>
              <th>Labels</th>
            </tr>
          </thead>
          <tbody id="phrases-body"></tbody>
        </table>
        <div class="empty-state" id="phrases-empty" style="display:none">@@PHRASES_EMPTY_MESSAGE@@</div>
      </div>
    </div>
  </section>

  <section class="panel" id="panel-senses">
    <div class="words-layout">
      <aside class="detail-panel">
        <div class="detail-empty" id="detail-empty-senses">Select a sense below to see its relationships.</div>
        <div id="detail-content-senses" style="display:none"></div>
      </aside>
      <div class="table-wrap">
        <div class="cyclic-note" id="senses-note" style="display:none"></div>
        <table>
          <thead>
            <tr>
              <th data-sort="lexical_form">Members</th>
              <th data-sort="pos">Part of speech</th>
              <th data-sort="domain">Domain</th>
              <th data-sort="definition">Definition</th>
              <th data-sort="sense_frequency" style="text-align:right">Frequency</th>
              <th>Labels</th>
            </tr>
          </thead>
          <tbody id="senses-body"></tbody>
        </table>
        <div class="empty-state" id="senses-empty" style="display:none">@@SENSES_EMPTY_MESSAGE@@</div>
      </div>
    </div>
  </section>

  <section class="panel" id="panel-rels">
    <div class="table-wrap">
      <div class="cyclic-note" id="rels-note" style="display:none"></div>
      <table>
        <thead>
          <tr>
            <th data-sort="source_text">Source</th>
            <th data-sort="kind">Relationship</th>
            <th data-sort="target_text">Target</th>
            <th data-sort="confidence" style="text-align:right">Confidence</th>
          </tr>
        </thead>
        <tbody id="rels-body"></tbody>
      </table>
      <div class="empty-state" id="rels-empty" style="display:none">@@RELS_EMPTY_MESSAGE@@</div>
    </div>
  </section>

  <section class="panel" id="panel-hierarchy">
    <div class="stack-layout">
      <aside class="detail-panel">
        <div class="detail-empty" id="detail-empty-hierarchy">Select a word in the tree below to see its relationships.</div>
        <div id="detail-content-hierarchy" style="display:none"></div>
      </aside>
      <div class="detail-panel" style="max-height:none">
        <div class="hierarchy-toolbar">
          <label for="hierarchy-kind">Relationship kind</label>
          <select id="hierarchy-kind"></select>
        </div>
        <div class="hierarchy-note" id="hierarchy-note"></div>
        <div id="hierarchy-tree"></div>
      </div>
    </div>
  </section>

  <section class="panel" id="panel-cyclic">
    <div class="stack-layout">
      <aside class="detail-panel">
        <div class="detail-empty" id="detail-empty-cyclic">Select a word in a cluster below to see its relationships.</div>
        <div id="detail-content-cyclic" style="display:none"></div>
      </aside>
      <div class="detail-panel" style="max-height:none">
        <div class="cyclic-toolbar">
          <label for="cyclic-kind">Relationship kind</label>
          <select id="cyclic-kind"></select>
        </div>
        <div class="cyclic-note" id="cyclic-note"></div>
        <div class="cyclic-clusters" id="cyclic-clusters"></div>
      </div>
    </div>
  </section>

  <!--@@BODY_FRAGMENT_END@@-->
  <footer>Generated by DictionaryView (lira.vocabulary.ui)</footer>
</div>
`;
