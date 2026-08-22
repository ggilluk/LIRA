/** Verbatim slice of PAGE_TEMPLATE's <style> block content (original
 * dictionary_view.ts lines 1765-2504) -- the @@STYLE_FRAGMENT_START/END@@
 * markers stay embedded in place, unmoved; renderFragment() finds them by
 * plain text search after page_template.ts reassembles the full page. */
export const CLIENT_STYLES = `:root {
  --ground: #F4F5F1;
  --surface: #FFFFFF;
  --ink: #1C2321;
  --ink-muted: #5B6660;
  --accent: #2B6E63;
  --accent-ink: #FFFFFF;
  --line: #DDE0DA;
  --line-strong: #C4C9BF;
  --shadow: 0 1px 2px rgba(28, 35, 33, 0.06), 0 4px 12px rgba(28, 35, 33, 0.04);
  --radius: 6px;
  --font-display: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
  --font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-mono: 'SF Mono', 'Cascadia Code', Consolas, 'Liberation Mono', Menlo, monospace;
}
@media (prefers-color-scheme: dark) {
  :root {
    --ground: #12211D;
    --surface: #182A24;
    --ink: #E7EEEA;
    --ink-muted: #90A69D;
    --accent: #4FBBA6;
    --accent-ink: #0B1613;
    --line: #2A3B34;
    --line-strong: #3B4F47;
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.25);
  }
}
:root[data-theme="dark"] {
  --ground: #12211D;
  --surface: #182A24;
  --ink: #E7EEEA;
  --ink-muted: #90A69D;
  --accent: #4FBBA6;
  --accent-ink: #0B1613;
  --line: #2A3B34;
  --line-strong: #3B4F47;
  --shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.25);
}
:root[data-theme="light"] {
  --ground: #F4F5F1;
  --surface: #FFFFFF;
  --ink: #1C2321;
  --ink-muted: #5B6660;
  --accent: #2B6E63;
  --accent-ink: #FFFFFF;
  --line: #DDE0DA;
  --line-strong: #C4C9BF;
  --shadow: 0 1px 2px rgba(28, 35, 33, 0.06), 0 4px 12px rgba(28, 35, 33, 0.04);
}
* { box-sizing: border-box; }
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
html, body {
  margin: 0;
  background: var(--ground);
  color: var(--ink);
  font-family: var(--font-body);
}
body {
  padding: 32px clamp(16px, 4vw, 48px) 64px;
}
.page { max-width: 1180px; margin: 0 auto; }
header.masthead {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line-strong);
  margin-bottom: 24px;
}
h1 {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 2rem;
  margin: 0;
  text-wrap: balance;
  letter-spacing: -0.01em;
}
.masthead .subtitle {
  font-size: 0.9rem;
  color: var(--ink-muted);
}
/* Everything below, to the matching end marker, is this view's own
   page-specific CSS -- render_fragment() (below) extracts it for
   embedding in a combined page (knowledge/ui/lira_view.py) on top of
   the shared chrome (:root tokens, reset, masthead) above, which such
   a page only needs once. */
/*@@STYLE_FRAGMENT_START@@*/
.stat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}
.stat {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 14px 16px;
  box-shadow: var(--shadow);
}
.stat .value {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.stat .label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
  margin-top: 4px;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}
.search-field {
  flex: 1 1 260px;
  position: relative;
}
.search-field input {
  width: 100%;
  padding: 9px 12px 9px 34px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 0.92rem;
}
.search-field input:focus {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}
.search-field::before {
  content: "";
  position: absolute;
  left: 11px;
  top: 50%;
  width: 13px;
  height: 13px;
  transform: translateY(-50%);
  border: 1.5px solid var(--ink-muted);
  border-radius: 50%;
  box-shadow: 4px 4px 0 -2px var(--ink-muted);
}
select#pos-filter, select#domain-filter {
  padding: 9px 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 0.88rem;
}
.root-word-toggle-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--ink-muted);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
.root-word-toggle-label input { accent-color: var(--accent); cursor: pointer; margin: 0; }
.tabs {
  display: inline-flex;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  overflow: hidden;
}
.tabs button {
  border: none;
  background: var(--surface);
  color: var(--ink-muted);
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 9px 16px;
  cursor: pointer;
}
.tabs button + button { border-left: 1px solid var(--line-strong); }
.tabs button[aria-selected="true"] {
  background: var(--accent);
  color: var(--accent-ink);
}
.tabs button:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.panel { display: none; }
.panel.active { display: block; }
.table-wrap {
  overflow-x: auto;
  overflow-y: auto;
  max-height: min(65vh, 640px);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow);
}
table { width: 100%; border-collapse: collapse; font-size: 0.87rem; }
thead th {
  position: sticky;
  top: 0;
  background: var(--surface);
  text-align: left;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-muted);
  padding: 10px 14px;
  border-bottom: 1px solid var(--line-strong);
  cursor: pointer;
  white-space: nowrap;
}
thead th:hover { color: var(--ink); }
thead th .arrow { opacity: 0.5; margin-left: 3px; }
tbody td {
  padding: 9px 14px;
  border-bottom: 1px solid var(--line);
  vertical-align: top;
}
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover { background: color-mix(in srgb, var(--accent) 6%, transparent); }
.word-form {
  font-family: var(--font-mono);
  font-weight: 600;
}
.definition { color: var(--ink-muted); max-width: 360px; }
.pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}
.tag {
  display: inline-block;
  padding: 1px 6px;
  margin: 0 3px 3px 0;
  border-radius: 4px;
  font-size: 0.68rem;
  border: 1px solid var(--line-strong);
  color: var(--ink-muted);
}
.badge-common {
  font-size: 0.68rem;
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 4px;
  padding: 1px 6px;
}
.badge-root-word {
  font-size: 0.68rem;
  color: #7A5CA6;
  border: 1px solid #7A5CA6;
  border-radius: 4px;
  padding: 1px 6px;
}
.badge-derivable-noun {
  font-size: 0.68rem;
  color: #B08900;
  border: 1px solid #B08900;
  border-radius: 4px;
  padding: 1px 6px;
}
.sense-id {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  color: var(--ink-faint);
  white-space: nowrap;
}
.link-btn {
  background: none;
  border: none;
  padding: 0;
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 0.87rem;
  cursor: pointer;
  text-decoration: none;
  font-weight: 600;
}
.link-btn:hover { text-decoration: underline; }
.rel-count { font-variant-numeric: tabular-nums; }
.confidence { font-variant-numeric: tabular-nums; color: var(--ink-muted); }
.empty-state {
  padding: 40px 16px;
  text-align: center;
  color: var(--ink-muted);
  font-size: 0.9rem;
}
.unresolved-panel {
  background: var(--surface);
  border: 1px solid var(--line);
  border-left: 3px solid #C2544B;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 14px 16px;
  margin-bottom: 16px;
}
.unresolved-panel .word-form {
  display: inline-block;
  margin: 0 6px 6px 0;
  padding: 2px 8px;
  border-radius: 4px;
  background: color-mix(in srgb, #C2544B 12%, transparent);
  font-size: 0.82rem;
}
.words-layout, .stack-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
tbody tr[data-word-id] { cursor: pointer; }
tbody tr[data-word-id].selected { background: color-mix(in srgb, var(--accent) 14%, transparent); }
.detail-panel {
  position: sticky;
  top: 16px;
  z-index: 2;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 18px;
  max-height: min(52vh, 520px);
  overflow-y: auto;
}
.detail-empty {
  color: var(--ink-muted);
  font-size: 0.85rem;
  text-align: center;
  padding: 28px 8px;
}
.detail-word {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 1.15rem;
}
.detail-entry-id {
  margin-top: 4px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--ink-muted);
  user-select: all;
}
.detail-entry-id code {
  font-family: inherit;
}
.detail-definition {
  color: var(--ink-muted);
  font-size: 0.85rem;
  margin-top: 8px;
  line-height: 1.4;
}
.detail-section-title {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ink-muted);
  margin: 16px 0 6px;
}
summary.detail-section-title {
  cursor: pointer;
  user-select: none;
  margin: 16px 0 4px;
}
summary.detail-section-title::marker { color: var(--ink-muted); }
.rel-entry {
  padding: 7px 0;
  border-bottom: 1px solid var(--line);
}
.rel-entry:last-child { border-bottom: none; }
.rel-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.83rem;
}
.rel-row .rel-dir { color: var(--ink-muted); font-size: 0.8rem; width: 12px; text-align: center; flex: none; }
.rel-row .link-btn { margin-left: auto; text-align: right; }
.rel-sentence {
  margin: 4px 0 0 20px;
  color: var(--ink-muted);
  font-size: 0.8rem;
  line-height: 1.4;
}
.rel-gloss {
  margin: 3px 0 0 20px;
  color: var(--ink-muted);
  font-size: 0.78rem;
  line-height: 1.4;
}
.category-tag {
  display: inline-block;
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 0.72rem;
  color: var(--ink-muted);
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 0 4px;
  margin-right: 5px;
}
.pad-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  margin: 6px 0;
}
.pad-row .pad-label {
  width: 118px;
  flex: none;
  color: var(--ink-muted);
}
.pad-row .pad-value {
  width: 42px;
  flex: none;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.pad-track {
  position: relative;
  flex: 1;
  height: 8px;
  background: var(--line);
  border-radius: 4px;
  overflow: hidden;
}
.pad-track::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--ink-muted);
  opacity: 0.5;
}
.pad-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  background: var(--accent);
}
.pad-fill.negative { background: #C2544B; }
.word-form-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 0.83rem;
  margin: 4px 0;
}
.word-form-row .word-form-label {
  width: 190px;
  flex: none;
  color: var(--ink-muted);
}
.word-form-row .word-form-value {
  font-family: var(--font-mono);
}
.sense-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
/* A Sense list directly follows its own owning WordForm's label/value
   row (wordFormsSectionHTML(), client_detail_panel_controller.ts) --
   indented and left-bordered so it visibly reads as nested under that
   row, not a second, unrelated section. phraseSensesSectionHTML()'s own
   ungrouped list (no owning .word-form-row sibling) is unaffected. */
.word-form-row + .sense-list {
  margin: 2px 0 10px 14px;
  padding-left: 10px;
  border-left: 2px solid var(--line);
}
.sense-row {
  padding: 7px 0;
  border-bottom: 1px solid var(--line);
  font-size: 0.83rem;
}
.sense-row:last-child { border-bottom: none; }
.sense-row.primary { font-weight: 600; }
.sense-number {
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
  margin-right: 6px;
}
.sense-primary-tag {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--accent);
  font-weight: 700;
  margin-left: 2px;
}
.sense-definition { font-weight: 400; }
.sense-meta {
  display: block;
  margin-top: 2px;
  font-size: 0.78rem;
  color: var(--ink-muted);
}
.sense-synonyms { margin-left: 6px; }
.sense-frequency {
  margin-left: 6px;
  font-variant-numeric: tabular-nums;
}
.sense-frequency::before { content: "\\2022  "; }
.sense-rels {
  margin-top: 4px;
}
.sense-rels summary {
  cursor: pointer;
  user-select: none;
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-muted);
}
.sense-rels summary::marker { color: var(--ink-muted); }
.sense-rels .detail-relationships-section,
.sense-rels .detail-empty {
  margin-top: 4px;
}
.sense-pad {
  margin-top: 4px;
}
.sense-pad summary {
  cursor: pointer;
  user-select: none;
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-muted);
}
.sense-pad summary::marker { color: var(--ink-muted); }
.sense-pad .pad-meters { margin-top: 4px; }
.sense-frames {
  margin-top: 4px;
}
.sense-frames summary {
  cursor: pointer;
  user-select: none;
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-muted);
}
.sense-frames summary::marker { color: var(--ink-muted); }
.sense-frames .sense-frame-list {
  margin: 4px 0 0;
  padding-left: 18px;
  font-size: 0.8rem;
  color: var(--ink);
}
.sense-frames .sense-frame-list li { margin: 2px 0; }
.def-text { line-height: 1.7; }
.def-word {
  position: relative;
  border-bottom: 1px dotted var(--ink-muted);
  cursor: help;
}
.def-word.def-word-unresolved {
  border-bottom-style: dashed;
  border-bottom-color: #C2544B;
}
.def-word .def-tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 7px);
  transform: translate(-50%, 4px);
  width: max-content;
  max-width: 220px;
  background: var(--ink);
  color: var(--ground);
  font-size: 0.74rem;
  line-height: 1.4;
  padding: 8px 10px;
  border-radius: 5px;
  box-shadow: var(--shadow);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ease, transform 0.12s ease;
  z-index: 5;
}
.def-word .def-tooltip .tt-title {
  display: block;
  font-family: var(--font-mono);
  font-weight: 700;
  margin-bottom: 2px;
}
.def-word .def-tooltip .tt-meta {
  display: block;
  opacity: 0.75;
  margin-bottom: 4px;
}
.def-word:hover .def-tooltip, .def-word:focus .def-tooltip, .def-word:focus-visible .def-tooltip {
  opacity: 1;
  transform: translate(-50%, 0);
}
.hierarchy-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.hierarchy-toolbar label {
  font-size: 0.8rem;
  color: var(--ink-muted);
}
select#hierarchy-kind {
  padding: 9px 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 0.88rem;
}
.hierarchy-note {
  font-size: 0.8rem;
  color: var(--ink-muted);
  margin-bottom: 12px;
  line-height: 1.4;
}
.hierarchy-svg-wrap {
  overflow-x: auto;
}
svg.hierarchy-graph { display: block; }
.hierarchy-edge {
  stroke: var(--line-strong);
  stroke-width: 1.4;
  fill: none;
}
.hierarchy-arrow { fill: var(--line-strong); }
.hierarchy-node-svg { cursor: pointer; }
.hierarchy-node-svg circle { stroke: var(--surface); stroke-width: 2; }
.hierarchy-node-svg text {
  font-family: var(--font-mono);
  font-size: 11px;
  fill: var(--ink);
}
.hierarchy-node-svg:hover text, .hierarchy-node-svg:focus text { fill: var(--accent); text-decoration: underline; }
.hierarchy-node-svg:hover circle, .hierarchy-node-svg:focus circle { stroke: var(--accent); }
.hierarchy-node-selected text { fill: var(--accent); font-weight: 700; }
.hierarchy-node-selected circle { stroke: var(--accent); stroke-width: 3; }
.hierarchy-node-cross-ref circle { stroke-dasharray: 2 2; opacity: .65; }
.hierarchy-node-cross-ref text { opacity: .65; font-style: italic; }
.hierarchy-node-cross-ref .hierarchy-box { stroke-dasharray: 3 3; opacity: .65; }
.hierarchy-box {
  fill: var(--ground);
  stroke: var(--line-strong);
  stroke-width: 1.2;
}
.hierarchy-cross-ref {
  font-size: 0.78rem;
  color: var(--ink-muted);
  font-style: italic;
}
.hierarchy-clusters {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.hierarchy-cluster {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 10px 12px;
}
.hierarchy-cluster-title {
  font-size: 0.72rem;
  color: var(--ink-muted);
  margin-bottom: 6px;
}
.hierarchy-cluster-words {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
}
.hierarchy-cluster-chip { white-space: nowrap; }
.cyclic-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.cyclic-toolbar label {
  font-size: 0.8rem;
  color: var(--ink-muted);
}
select#cyclic-kind {
  padding: 9px 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 0.88rem;
}
.cyclic-note {
  font-size: 0.8rem;
  color: var(--ink-muted);
  margin-bottom: 12px;
  line-height: 1.4;
}
.cyclic-clusters {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.cyclic-cluster {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 14px;
}
.cyclic-cluster-title {
  font-size: 0.78rem;
  color: var(--ink-muted);
  margin-bottom: 8px;
}
.cyclic-svg-wrap {
  overflow-x: auto;
}
svg.cyclic-graph { display: block; }
.cyclic-edge {
  stroke: var(--line-strong);
  stroke-width: 1.4;
}
.cyclic-arrow { fill: var(--line-strong); }
.cyclic-box {
  fill: var(--ground);
  stroke: var(--line-strong);
  stroke-width: 1.2;
}
.cyclic-node { cursor: pointer; }
.cyclic-node circle { stroke: var(--surface); stroke-width: 2; }
.cyclic-node text {
  font-family: var(--font-mono);
  font-size: 11px;
  fill: var(--ink);
}
.cyclic-node:hover text, .cyclic-node:focus text { fill: var(--accent); text-decoration: underline; }
.cyclic-node:hover circle, .cyclic-node:focus circle { stroke: var(--accent); }
.cyclic-node-selected text { fill: var(--accent); font-weight: 700; }
.cyclic-node-selected circle { stroke: var(--accent); stroke-width: 3; }
@media (max-width: 860px) {
  .detail-panel { position: static; max-height: none; }
}
footer {
  margin-top: 28px;
  font-size: 0.76rem;
  color: var(--ink-muted);
  text-align: center;
}
/*@@STYLE_FRAGMENT_END@@*/`;
