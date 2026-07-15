"""DictionaryView: renders a Dictionary and its LexicalRelationshipStore
as a single self-contained HTML page (vocabulary/documentation/README.md
covers the data this reads; see vocabulary/ui/README.md for this
artefact). All Word and LexicalRelationship data is embedded as JSON and
searched/filtered/sorted client-side in vanilla JS -- no server, no
external requests -- so the generated file can be opened directly or
served as a static asset. Uses only system font stacks (no CDN or
embedded webfont) so the output stays a single dependency-free file."""

import json
from html import escape
from typing import Dict, List

from ..data.dictionary import Dictionary
from ..data.lexical_relationship_store import LexicalRelationshipStore
from ..data.part_of_speech import PartOfSpeech

GROUP_NAMES = {0: "Morphological", 1: "Lexical Semantic", 2: "Orthographic and Naming"}

GROUP_COLORS = {0: "#3B6EA5", 1: "#B2542D", 2: "#7A5CA6"}

POS_COLORS = {
    PartOfSpeech.NOUN.name: "#3B6EA5",
    PartOfSpeech.PROPER_NOUN.name: "#274472",
    PartOfSpeech.VERB.name: "#B2542D",
    PartOfSpeech.ADJECTIVE.name: "#7A5CA6",
    PartOfSpeech.ADVERB.name: "#B08900",
    PartOfSpeech.PRONOUN.name: "#5B7B6F",
    PartOfSpeech.DETERMINER.name: "#6E7B8B",
    PartOfSpeech.PREPOSITION.name: "#7B6E5B",
    PartOfSpeech.CONJUNCTION.name: "#6B7280",
    PartOfSpeech.PARTICLE.name: "#8A7B6E",
    PartOfSpeech.AUXILIARY.name: "#5B6E8B",
    PartOfSpeech.INTERJECTION.name: "#C2544B",
    PartOfSpeech.NUMERAL.name: "#4B8A7B",
    PartOfSpeech.SYMBOL.name: "#8A8A8A",
    PartOfSpeech.PUNCTUATION.name: "#9A9A9A",
    PartOfSpeech.OTHER.name: "#7A7A7A",
}


class DictionaryView:
    """Builds the HTML page. Construct with the Dictionary and
    LexicalRelationshipStore to display -- typically a Domain's
    `domain.vocabulary.dictionary` and `domain.vocabulary.lexical_relationships`
    -- call `render()` for the HTML string or `save(path)` to write it."""

    def __init__(self, dictionary: Dictionary, relationships: LexicalRelationshipStore, *, title: str = "LIRA Dictionary"):
        self.dictionary = dictionary
        self.relationships = relationships
        self.title = title

    def render(self) -> str:
        words = self._word_records()
        rels = self._relationship_records()
        common_count = sum(1 for w in words if w["is_common"])
        pos_counts: Dict[str, int] = {}
        for w in words:
            pos_counts[w["pos"]] = pos_counts.get(w["pos"], 0) + 1
        group_counts: Dict[int, int] = {}
        for r in rels:
            group_counts[r["group"]] = group_counts.get(r["group"], 0) + 1

        html = _PAGE_TEMPLATE
        for token, value in {
            "TITLE": escape(self.title),
            "WORD_COUNT": str(len(words)),
            "RELATIONSHIP_COUNT": str(len(rels)),
            "COMMON_COUNT": str(common_count),
            "DOMAIN_SPECIFIC_COUNT": str(len(words) - common_count),
            "POS_COUNT": str(len(pos_counts)),
            "WORDS_JSON": json.dumps(words),
            "RELS_JSON": json.dumps(rels),
            "POS_COLORS_JSON": json.dumps(POS_COLORS),
            "GROUP_COLORS_JSON": json.dumps(GROUP_COLORS),
            "GROUP_NAMES_JSON": json.dumps(GROUP_NAMES),
        }.items():
            html = html.replace("@@%s@@" % token, value)
        return html

    def save(self, path: str) -> None:
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(self.render())

    def _word_records(self) -> List[dict]:
        records = []
        for word in self.dictionary.all():
            word_id = word.uuid.value
            relationship_count = len(self.relationships.outgoing(word_id)) + len(self.relationships.incoming(word_id))
            records.append({
                "id": word_id,
                "lexical_form": word.lexical_form.value if word.lexical_form else word.text,
                "text": word.text,
                "pos": word.part_of_speech.name,
                "definition": word.definition.value if word.definition else "",
                "gloss": word.gloss.value if word.gloss else "",
                "register_codes": [code.name for code in word.register_codes],
                "dialect_codes": [code.value for code in word.dialect_codes],
                "editorial_labels": [label.name for label in word.editorial_labels],
                "is_common": word.is_common,
                "relationship_count": relationship_count,
            })
        records.sort(key=lambda r: r["lexical_form"].lower())
        return records

    def _relationship_records(self) -> List[dict]:
        records = []
        for rel in self.relationships.all():
            source = self.dictionary.find_by_uuid(rel.source_word_id.value)
            target = self.dictionary.find_by_uuid(rel.target_word_id.value)
            records.append({
                "id": rel.uuid.value,
                "source_id": rel.source_word_id.value,
                "source_text": source.text if source is not None else "?",
                "target_id": rel.target_word_id.value,
                "target_text": target.text if target is not None else "?",
                "kind": rel.relationship_type.name,
                "group": rel.relationship_type.group,
                "category": rel.relationship_type.category,
                "confidence": round(rel.system_properties.confidence_weight, 3),
            })
        return records


_PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>@@TITLE@@</title>
<style>
:root {
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
select#pos-filter {
  padding: 9px 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 0.88rem;
}
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
.active-filter {
  display: none;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: var(--ink-muted);
  margin-bottom: 10px;
}
.active-filter.showing { display: flex; }
.active-filter button {
  border: 1px solid var(--line-strong);
  background: var(--surface);
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 0.78rem;
}
footer {
  margin-top: 28px;
  font-size: 0.76rem;
  color: var(--ink-muted);
  text-align: center;
}
</style>
</head>
<body>
<div class="page">
  <header class="masthead">
    <h1>@@TITLE@@</h1>
    <div class="subtitle">@@WORD_COUNT@@ words &middot; @@RELATIONSHIP_COUNT@@ relationships</div>
  </header>

  <div class="stat-row">
    <div class="stat"><div class="value" id="stat-words">@@WORD_COUNT@@</div><div class="label">Words</div></div>
    <div class="stat"><div class="value" id="stat-rels">@@RELATIONSHIP_COUNT@@</div><div class="label">Relationships</div></div>
    <div class="stat"><div class="value">@@COMMON_COUNT@@</div><div class="label">Common vocabulary</div></div>
    <div class="stat"><div class="value">@@DOMAIN_SPECIFIC_COUNT@@</div><div class="label">Domain-specific</div></div>
    <div class="stat"><div class="value">@@POS_COUNT@@</div><div class="label">Parts of speech</div></div>
  </div>

  <div class="toolbar">
    <div class="search-field"><input id="search" type="text" placeholder="Search word, gloss, or definition&hellip;" autocomplete="off"></div>
    <select id="pos-filter"><option value="">All parts of speech</option></select>
    <div class="tabs" role="tablist">
      <button id="tab-words" role="tab" aria-selected="true">Words</button>
      <button id="tab-rels" role="tab" aria-selected="false">Relationships</button>
    </div>
  </div>

  <div class="active-filter" id="active-filter">
    <span id="active-filter-text"></span>
    <button id="clear-filter">Clear</button>
  </div>

  <section class="panel active" id="panel-words">
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th data-sort="lexical_form">Word</th>
            <th data-sort="pos">Part of speech</th>
            <th data-sort="definition">Definition</th>
            <th>Labels</th>
            <th data-sort="relationship_count" style="text-align:right">Relationships</th>
          </tr>
        </thead>
        <tbody id="words-body"></tbody>
      </table>
      <div class="empty-state" id="words-empty" style="display:none">No words match this search.</div>
    </div>
  </section>

  <section class="panel" id="panel-rels">
    <div class="table-wrap">
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
      <div class="empty-state" id="rels-empty" style="display:none">No relationships match this search.</div>
    </div>
  </section>

  <footer>Generated by DictionaryView (lira.vocabulary.ui)</footer>
</div>

<script>
const WORDS = @@WORDS_JSON@@;
const RELS = @@RELS_JSON@@;
const POS_COLORS = @@POS_COLORS_JSON@@;
const GROUP_COLORS = @@GROUP_COLORS_JSON@@;
const GROUP_NAMES = @@GROUP_NAMES_JSON@@;

const state = { tab: "words", query: "", pos: "", wordFilterId: null, wordFilterText: "", sort: { words: ["lexical_form", 1], rels: ["source_text", 1] } };

function titleCase(s) {
  return s.toLowerCase().split("_").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function posPill(pos) {
  const color = POS_COLORS[pos] || "#7A7A7A";
  return `<span class="pill" style="background:${color}">${titleCase(pos)}</span>`;
}

function relPill(kind, group) {
  const color = GROUP_COLORS[group] !== undefined ? GROUP_COLORS[group] : "#7A7A7A";
  return `<span class="pill" style="background:${color}" title="${GROUP_NAMES[group] || ''}">${titleCase(kind)}</span>`;
}

function populatePosFilter() {
  const select = document.getElementById("pos-filter");
  const seen = new Set(WORDS.map(w => w.pos));
  [...seen].sort().forEach(pos => {
    const opt = document.createElement("option");
    opt.value = pos;
    opt.textContent = titleCase(pos);
    select.appendChild(opt);
  });
}

function matchesQuery(word) {
  if (!state.query) return true;
  const q = state.query.toLowerCase();
  return word.lexical_form.toLowerCase().includes(q)
    || word.definition.toLowerCase().includes(q)
    || word.gloss.toLowerCase().includes(q);
}

function filteredWords() {
  return WORDS.filter(w => matchesQuery(w) && (!state.pos || w.pos === state.pos));
}

function filteredRels() {
  return RELS.filter(r => {
    if (state.wordFilterId && r.source_id !== state.wordFilterId && r.target_id !== state.wordFilterId) return false;
    if (!state.query) return true;
    const q = state.query.toLowerCase();
    return r.source_text.toLowerCase().includes(q) || r.target_text.toLowerCase().includes(q) || r.kind.toLowerCase().includes(q);
  });
}

function sortRows(rows, key, dir) {
  return rows.slice().sort((a, b) => {
    const av = a[key], bv = b[key];
    if (typeof av === "number") return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
}

function renderWords() {
  let rows = filteredWords();
  const [key, dir] = state.sort.words;
  rows = sortRows(rows, key, dir);
  const body = document.getElementById("words-body");
  document.getElementById("words-empty").style.display = rows.length ? "none" : "block";
  body.innerHTML = rows.map(w => `
    <tr>
      <td><span class="word-form">${w.lexical_form}</span>${w.is_common ? ' <span class="badge-common">common</span>' : ''}</td>
      <td>${posPill(w.pos)}</td>
      <td class="definition">${w.definition || w.gloss || '<span style="opacity:.5">&mdash;</span>'}</td>
      <td>${w.register_codes.concat(w.editorial_labels).map(t => `<span class="tag">${titleCase(t)}</span>`).join('')}</td>
      <td style="text-align:right">${w.relationship_count > 0
        ? `<button class="link-btn rel-count" data-word-id="${w.id}" data-word-text="${w.lexical_form}">${w.relationship_count}</button>`
        : `<span class="rel-count" style="color:var(--ink-muted)">0</span>`}</td>
    </tr>`).join('');
  document.getElementById("stat-words").textContent = rows.length;
  body.querySelectorAll("button[data-word-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.wordFilterId = btn.dataset.wordId;
      state.wordFilterText = btn.dataset.wordText;
      selectTab("rels");
      renderAll();
    });
  });
}

function renderRels() {
  let rows = filteredRels();
  const [key, dir] = state.sort.rels;
  rows = sortRows(rows, key, dir);
  const body = document.getElementById("rels-body");
  document.getElementById("rels-empty").style.display = rows.length ? "none" : "block";
  body.innerHTML = rows.map(r => `
    <tr>
      <td><span class="word-form">${r.source_text}</span></td>
      <td>${relPill(r.kind, r.group)}</td>
      <td><span class="word-form">${r.target_text}</span></td>
      <td style="text-align:right" class="confidence">${r.confidence.toFixed(3)}</td>
    </tr>`).join('');
  document.getElementById("stat-rels").textContent = rows.length;

  const filterBar = document.getElementById("active-filter");
  if (state.wordFilterId) {
    filterBar.classList.add("showing");
    document.getElementById("active-filter-text").textContent = `Showing relationships for "${state.wordFilterText}"`;
  } else {
    filterBar.classList.remove("showing");
  }
}

function renderAll() {
  renderWords();
  renderRels();
}

function selectTab(tab) {
  state.tab = tab;
  document.getElementById("tab-words").setAttribute("aria-selected", tab === "words");
  document.getElementById("tab-rels").setAttribute("aria-selected", tab === "rels");
  document.getElementById("panel-words").classList.toggle("active", tab === "words");
  document.getElementById("panel-rels").classList.toggle("active", tab === "rels");
}

document.getElementById("tab-words").addEventListener("click", () => { selectTab("words"); });
document.getElementById("tab-rels").addEventListener("click", () => { selectTab("rels"); });

document.getElementById("search").addEventListener("input", (e) => {
  state.query = e.target.value;
  renderAll();
});

document.getElementById("pos-filter").addEventListener("change", (e) => {
  state.pos = e.target.value;
  renderWords();
});

document.getElementById("clear-filter").addEventListener("click", () => {
  state.wordFilterId = null;
  state.wordFilterText = "";
  renderRels();
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
renderAll();
</script>
</body>
</html>
"""
