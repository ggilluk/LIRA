"""DictionaryView: renders a Dictionary and its LexicalRelationshipStore
as a single self-contained HTML page (vocabulary/documentation/README.md
covers the data this reads; see vocabulary/ui/README.md for this
artefact). All Word and LexicalRelationship data is embedded as JSON and
searched/filtered/sorted client-side in vanilla JS -- no server, no
external requests -- so the generated file can be opened directly or
served as a static asset. Uses only system font stacks (no CDN or
embedded webfont) so the output stays a single dependency-free file."""

import json
import re
from html import escape
from typing import Dict, List, Optional, Tuple

from ..data.dictionary import Dictionary
from ..data.lexical_relationship_store import LexicalRelationshipStore
from ..data.part_of_speech import PartOfSpeech
from ..data.word import Word

# Matches word.py's own _definition_tokens pattern (same literal, same
# reasoning -- see external_dictionary_adapter.py's _word_terms for the
# existing precedent of this small tokenizer being duplicated rather
# than cross-imported as a private helper). Used with finditer, not
# findall, so each match's position in the original definition text is
# available to reconstruct the surrounding punctuation/whitespace
# Word.definition_words() itself discards -- the two must tokenize
# identically, or _definition_segments' zip() below would misalign a
# resolved/unresolved DefinitionWordReference with the wrong surface span.
_DEFINITION_TOKEN_PATTERN = re.compile(r"[^\W_]+")

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

    def __init__(self, dictionary: Dictionary, relationships: LexicalRelationshipStore, *,
                 title: str = "LIRA Dictionary", domain_name: str = "Domain", unresolved: Tuple[str, ...] = ()):
        self.dictionary = dictionary
        self.relationships = relationships
        self.title = title
        # A Word carries no domain field of its own (a Domain owns its
        # Dictionary; the Word doesn't know which Domain it's in) --
        # this view renders exactly one Domain's Dictionary at a time,
        # so every Word in it is either that Domain's own
        # (word.is_common is False) or inherited from Common
        # (word.is_common is True, vocabulary/documentation/README.md,
        # 9.3). domain_name supplies the label for the former; "Common"
        # is never overridden, since that's the one label every
        # Domain's inherited words genuinely share.
        self.domain_name = domain_name
        # Words a caller looked up and could not resolve (no seeded
        # sense, no successful hydration) -- optional, since most
        # callers render a Dictionary on its own with no such list to
        # hand in. Never derived from the Dictionary itself: an
        # unresolved word by definition has no Word record to find
        # here (vocabulary/documentation/README.md, 9.6).
        self.unresolved = tuple(unresolved)

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
        # Just two labels are ever possible for one DictionaryView render
        # ("Common" and this.domain_name -- see domain_name's docstring
        # above), so a fixed two-color assignment, not a per-domain
        # palette, is enough.
        domain_colors = {"Common": "#6E7B8B", self.domain_name: "#2B6E63"}

        html = _PAGE_TEMPLATE
        for token, value in {
            "TITLE": escape(self.title),
            "WORD_COUNT": str(len(words)),
            "RELATIONSHIP_COUNT": str(len(rels)),
            "COMMON_COUNT": str(common_count),
            "DOMAIN_SPECIFIC_COUNT": str(len(words) - common_count),
            "POS_COUNT": str(len(pos_counts)),
            "UNRESOLVED_COUNT": str(len(self.unresolved)),
            "WORDS_JSON": json.dumps(words),
            "RELS_JSON": json.dumps(rels),
            "UNRESOLVED_JSON": json.dumps(sorted(self.unresolved)),
            "POS_COLORS_JSON": json.dumps(POS_COLORS),
            "GROUP_COLORS_JSON": json.dumps(GROUP_COLORS),
            "GROUP_NAMES_JSON": json.dumps(GROUP_NAMES),
            "DOMAIN_COLORS_JSON": json.dumps(domain_colors),
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
                "domain": "Common" if word.is_common else self.domain_name,
                "is_fully_hydrated": word.is_fully_hydrated,
                "sources": [ref.source_name.value for ref in word.source_references],
                "relationship_count": relationship_count,
                "definition_segments": self._definition_segments(word),
            })
        records.sort(key=lambda r: r["lexical_form"].lower())
        return records

    def _definition_segments(self, word: Word) -> List[dict]:
        """Reconstructs word.definition's text as an ordered list of
        segments -- plain text (punctuation, whitespace) interleaved with
        word-token segments carrying each token's own resolution from
        Word.definition_words() (vocabulary/documentation/README.md, 4.4)
        -- so the detail panel can render the definition with each word
        individually identifiable (a tooltip popup), without re-deriving
        the resolution itself in JS. Empty when there's no definition."""
        if word.definition is None:
            return []
        text = word.definition.value
        references = word.definition_words(self.dictionary)
        segments: List[dict] = []
        last_end = 0
        for match, reference in zip(_DEFINITION_TOKEN_PATTERN.finditer(text), references):
            if match.start() > last_end:
                segments.append({"text": text[last_end:match.start()]})
            segments.append(self._definition_word_segment(match.group(), reference.word))
            last_end = match.end()
        if last_end < len(text):
            segments.append({"text": text[last_end:]})
        return segments

    def _definition_word_segment(self, surface_text: str, resolved: Optional[Word]) -> dict:
        if resolved is None:
            return {"text": surface_text, "word": True, "resolved": False}
        return {
            "text": surface_text,
            "word": True,
            "resolved": True,
            "word_id": resolved.uuid.value,
            "lexical_form": resolved.lexical_form.value if resolved.lexical_form else resolved.text,
            "pos": resolved.part_of_speech.name,
            "domain": self._domain_label(resolved),
            "gloss": resolved.gloss.value if resolved.gloss else (resolved.definition.value if resolved.definition else ""),
        }

    def _relationship_records(self) -> List[dict]:
        records = []
        for rel in self.relationships.all():
            source = self.dictionary.find_by_uuid(rel.source_word_id.value)
            target = self.dictionary.find_by_uuid(rel.target_word_id.value)
            records.append({
                "id": rel.uuid.value,
                "source_id": rel.source_word_id.value,
                "source_text": source.text if source is not None else "?",
                "source_pos": source.part_of_speech.name if source is not None else None,
                "source_domain": self._domain_label(source),
                "target_id": rel.target_word_id.value,
                "target_text": target.text if target is not None else "?",
                "target_pos": target.part_of_speech.name if target is not None else None,
                "target_domain": self._domain_label(target),
                "kind": rel.relationship_type.name,
                "group": rel.relationship_type.group,
                "category": rel.relationship_type.category,
                "confidence": round(rel.system_properties.confidence_weight, 4),
            })
        return records

    def _domain_label(self, word: Optional[Word]) -> Optional[str]:
        if word is None:
            return None
        return "Common" if word.is_common else self.domain_name


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
select#pos-filter, select#domain-filter {
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
.words-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 16px;
  align-items: start;
}
tbody tr[data-word-id] { cursor: pointer; }
tbody tr[data-word-id].selected { background: color-mix(in srgb, var(--accent) 14%, transparent); }
.detail-panel {
  position: sticky;
  top: 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 18px;
  max-height: calc(100vh - 32px);
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
@media (max-width: 860px) {
  .words-layout { grid-template-columns: 1fr; }
  .detail-panel { position: static; max-height: none; }
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
    <div class="stat"><div class="value">@@UNRESOLVED_COUNT@@</div><div class="label">Unresolved</div></div>
  </div>

  <div class="toolbar">
    <div class="search-field"><input id="search" type="text" placeholder="Search word, gloss, or definition&hellip;" autocomplete="off"></div>
    <select id="pos-filter"><option value="">All parts of speech</option></select>
    <select id="domain-filter"><option value="">All domains</option></select>
    <div class="tabs" role="tablist">
      <button id="tab-words" role="tab" aria-selected="true">Words</button>
      <button id="tab-rels" role="tab" aria-selected="false">Relationships</button>
    </div>
  </div>

  <section class="unresolved-panel" id="unresolved-panel" style="display:none">
    <div class="detail-section-title" style="margin-top:0">Unresolved &mdash; no seeded sense, no successful hydration</div>
    <div id="unresolved-list"></div>
  </section>

  <section class="panel active" id="panel-words">
    <div class="words-layout">
      <div class="table-wrap">
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
        <div class="empty-state" id="words-empty" style="display:none">No words match this search.</div>
      </div>
      <aside class="detail-panel">
        <div class="detail-empty" id="detail-empty">Select a word to see its relationships.</div>
        <div id="detail-content" style="display:none"></div>
      </aside>
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
const UNRESOLVED = @@UNRESOLVED_JSON@@;
const POS_COLORS = @@POS_COLORS_JSON@@;
const GROUP_COLORS = @@GROUP_COLORS_JSON@@;
const GROUP_NAMES = @@GROUP_NAMES_JSON@@;
const DOMAIN_COLORS = @@DOMAIN_COLORS_JSON@@;

const state = { tab: "words", query: "", pos: "", domain: "", selectedWordId: null, sort: { words: ["lexical_form", 1], rels: ["source_text", 1] } };

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

function domainPill(domain) {
  if (!domain) return "";
  const color = DOMAIN_COLORS[domain] || "#7A7A7A";
  return `<span class="pill" style="background:${color}">${domain}</span>`;
}

// One plain-English sentence per relationship kind, always phrased in
// terms of the edge's own (source, target) -- e.g. a HYPERNYM edge is
// stored as (narrower, HYPERNYM, broader), so "source is a type of
// target" reads correctly regardless of which side the viewer selected
// (relationshipsForWord's otherText/outgoing only control the arrow and
// which word is clickable, not this sentence). Kinds not listed fall
// back to a generic "source is target-kind-related to target".
const RELATIONSHIP_SENTENCES = {
  // Lexical Semantic
  SYNONYM: (s, t) => `${s} means the same as ${t}.`,
  ANTONYM: (s, t) => `${s} is the opposite of ${t}.`,
  HYPERNYM: (s, t) => `${s} is a type of ${t}.`,
  HYPONYM: (s, t) => `${t} is a type of ${s}.`,
  MERONYM: (s, t) => `${s} is part of ${t}.`,
  HOLONYM: (s, t) => `${t} is part of ${s}.`,
  TROPONYM: (s, t) => `${t} is a specific manner of ${s}.`,
  ENTAILMENT: (s, t) => `${s} entails ${t}.`,
  CAUSE: (s, t) => `${s} causes ${t}.`,
  RELATED: (s, t) => `${s} is related to ${t}.`,
  // Morphological -- base relation
  LEMMA_FORM: (s, t) => `${t} is the base (lemma) form of ${s}.`,
  INFLECTION: (s, t) => `${t} is an inflected form of ${s}.`,
  // Morphological -- number
  SINGULAR_FORM: (s, t) => `${t} is the singular form of ${s}.`,
  PLURAL_FORM: (s, t) => `${t} is the plural form of ${s}.`,
  // Morphological -- tense
  PRESENT_TENSE_FORM: (s, t) => `${t} is the present-tense form of ${s}.`,
  PAST_TENSE_FORM: (s, t) => `${t} is the past-tense form of ${s}.`,
  // Morphological -- aspect
  PRESENT_PARTICIPLE_FORM: (s, t) => `${t} is the present-participle form of ${s}.`,
  PAST_PARTICIPLE_FORM: (s, t) => `${t} is the past-participle form of ${s}.`,
  // Morphological -- person
  FIRST_PERSON_FORM: (s, t) => `${t} is the first-person form of ${s}.`,
  SECOND_PERSON_FORM: (s, t) => `${t} is the second-person form of ${s}.`,
  THIRD_PERSON_FORM: (s, t) => `${t} is the third-person form of ${s}.`,
  // Morphological -- degree
  COMPARATIVE_FORM: (s, t) => `${t} is the comparative form of ${s}.`,
  SUPERLATIVE_FORM: (s, t) => `${t} is the superlative form of ${s}.`,
  // Morphological -- derivation
  DERIVED_FORM: (s, t) => `${t} is derived from ${s}.`,
  AGENT_NOUN_DERIVATION: (s, t) => `${t} is the agent-noun form of ${s}.`,
  NOMINALISATION: (s, t) => `${t} is the noun form of ${s}.`,
  ADJECTIVAL_DERIVATION: (s, t) => `${t} is the adjective form of ${s}.`,
  ADVERBIAL_DERIVATION: (s, t) => `${t} is the adverb form of ${s}.`,
  // Morphological -- pronoun form
  PRONOUN_OBJECT_FORM: (s, t) => `${t} is the object form of ${s}.`,
  PRONOUN_SUBJECT_FORM: (s, t) => `${t} is the subject form of ${s}.`,
  PRONOUN_POSSESSIVE_DETERMINER_FORM: (s, t) => `${t} is the possessive-determiner form of ${s}.`,
  PRONOUN_POSSESSIVE_FORM: (s, t) => `${t} is the possessive form of ${s}.`,
  PRONOUN_REFLEXIVE_FORM: (s, t) => `${t} is the reflexive form of ${s}.`,
  PRONOUN_RECIPROCAL_FORM: (s, t) => `${t} is the reciprocal form of ${s}.`,
  // Orthographic and Naming
  SPELLING_VARIANT: (s, t) => `${t} is a spelling variant of ${s}.`,
  HISTORICAL_SPELLING: (s, t) => `${t} is a historical spelling of ${s}.`,
  ABBREVIATION: (s, t) => `${t} is an abbreviation of ${s}.`,
  ACRONYM: (s, t) => `${t} is an acronym formed from ${s}.`,
  INITIALISM: (s, t) => `${t} is an initialism formed from ${s}.`,
  CONTRACTION: (s, t) => `${t} is a contracted form of ${s}.`,
  TRANSLITERATION: (s, t) => `${t} is a transliteration of ${s}.`,
  CAPITALISATION: (s, t) => `${t} is a capitalisation variant of ${s}.`,
  DIACRITIC_VARIANT: (s, t) => `${t} is a diacritic variant of ${s}.`,
};

function relationshipSentence(kind, sourceText, targetText) {
  const template = RELATIONSHIP_SENTENCES[kind];
  if (template) return template(sourceText, targetText);
  return `${sourceText} is ${titleCase(kind).toLowerCase()}-related to ${targetText}.`;
}

function truncate(text, max) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
}

// Renders word.definition_segments (DictionaryView._definition_segments)
// as inline text with each word token wrapped in a hover/focus tooltip
// identifying its own part of speech, domain, and a short gloss -- built
// from Word.definition_words() (vocabulary/documentation/README.md, 4.4)
// on the Python side, not re-derived here. Plain-text segments
// (punctuation, whitespace) pass through unwrapped, so the sentence
// reads exactly as word.definition itself does.
function definitionSegmentHTML(seg) {
  if (!seg.word) return seg.text;
  if (!seg.resolved) {
    return `<span class="def-word def-word-unresolved" tabindex="0">${seg.text}`
      + `<span class="def-tooltip"><span class="tt-title">${seg.text}</span>`
      + `<span class="tt-meta">Not in this Dictionary</span></span></span>`;
  }
  const meta = [titleCase(seg.pos)];
  if (seg.domain) meta.push(seg.domain);
  return `<span class="def-word" tabindex="0" data-word-id="${seg.word_id}">${seg.text}`
    + `<span class="def-tooltip"><span class="tt-title">${seg.lexical_form}</span>`
    + `<span class="tt-meta">${meta.join(" &middot; ")}</span>${truncate(seg.gloss, 110)}</span></span>`;
}

function renderDefinition(word) {
  if (!word.definition_segments || !word.definition_segments.length) {
    return word.definition || word.gloss || "No definition on record.";
  }
  return `<span class="def-text">${word.definition_segments.map(definitionSegmentHTML).join("")}</span>`;
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

function populateDomainFilter() {
  const select = document.getElementById("domain-filter");
  const seen = new Set(WORDS.map(w => w.domain));
  [...seen].sort().forEach(domain => {
    const opt = document.createElement("option");
    opt.value = domain;
    opt.textContent = domain;
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
  return WORDS.filter(w => matchesQuery(w) && (!state.pos || w.pos === state.pos) && (!state.domain || w.domain === state.domain));
}

function filteredRels() {
  return RELS.filter(r => {
    if (!state.query) return true;
    const q = state.query.toLowerCase();
    return r.source_text.toLowerCase().includes(q) || r.target_text.toLowerCase().includes(q) || r.kind.toLowerCase().includes(q);
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

function renderWords() {
  let rows = filteredWords();
  const [key, dir] = state.sort.words;
  rows = sortRows(rows, key, dir);
  const body = document.getElementById("words-body");
  document.getElementById("words-empty").style.display = rows.length ? "none" : "block";
  body.innerHTML = rows.map(w => `
    <tr data-word-id="${w.id}" class="${w.id === state.selectedWordId ? 'selected' : ''}">
      <td><span class="word-form">${w.lexical_form}</span>${w.is_common ? ' <span class="badge-common">common</span>' : ''}</td>
      <td>${posPill(w.pos)}</td>
      <td>${domainPill(w.domain)}</td>
      <td class="definition">${w.definition || w.gloss || '<span style="opacity:.5">&mdash;</span>'}</td>
      <td>${w.register_codes.concat(w.editorial_labels).map(t => `<span class="tag">${titleCase(t)}</span>`).join('')}</td>
      <td style="text-align:right" class="rel-count">${w.relationship_count}</td>
    </tr>`).join('');
  document.getElementById("stat-words").textContent = rows.length;
}

function selectWord(wordId) {
  state.selectedWordId = wordId;
  document.querySelectorAll("#words-body tr[data-word-id]").forEach(tr => {
    tr.classList.toggle("selected", tr.dataset.wordId === wordId);
  });
  renderDetail();
}

function renderDetail() {
  const empty = document.getElementById("detail-empty");
  const content = document.getElementById("detail-content");
  const word = WORDS.find(w => w.id === state.selectedWordId);
  if (!word) {
    empty.style.display = "block";
    content.style.display = "none";
    return;
  }
  const rels = relationshipsForWord(word.id);
  empty.style.display = "none";
  content.style.display = "block";
  content.innerHTML = `
    <div class="detail-word">${word.lexical_form}${word.is_common ? ' <span class="badge-common">common</span>' : ''}${word.is_fully_hydrated ? '' : ' <span class="badge-common" style="color:#C2544B;border-color:#C2544B">hydration pending</span>'}</div>
    <div style="margin-top:6px">${posPill(word.pos)} ${domainPill(word.domain)}</div>
    <div class="detail-definition">${renderDefinition(word)}</div>
    <div class="detail-section-title">Provenance</div>
    <div class="detail-definition" style="margin-top:0">${word.sources && word.sources.length ? word.sources.map(s => `<span class="tag">${s}</span>`).join('') : '<span style="opacity:.6">No source recorded.</span>'}</div>
    <div class="detail-section-title">Relationships (${rels.length})</div>
    ${rels.length === 0 ? '<div class="detail-empty" style="padding:8px 0">No relationships recorded.</div>' : rels.map(r => `
      <div class="rel-entry">
        <div class="rel-row">
          <span class="rel-dir" title="${r.outgoing ? 'Outgoing' : 'Incoming'}">${r.outgoing ? '&rarr;' : '&larr;'}</span>
          ${relPill(r.kind, r.group)}
          <button class="link-btn" data-pivot-id="${r.otherId}">${r.otherText}</button>
          ${domainPill(r.otherDomain)}
        </div>
        <div class="rel-sentence">${relationshipSentence(r.kind, r.source_text, r.target_text)}</div>
      </div>`).join('')}
  `;
  content.querySelectorAll("button[data-pivot-id]").forEach(btn => {
    btn.addEventListener("click", () => selectWord(btn.dataset.pivotId));
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
      <td><span class="word-form">${r.source_text}</span> ${r.source_pos ? posPill(r.source_pos) : ''}</td>
      <td>${relPill(r.kind, r.group)}</td>
      <td><span class="word-form">${r.target_text}</span> ${r.target_pos ? posPill(r.target_pos) : ''}</td>
      <td style="text-align:right" class="confidence">${r.confidence.toFixed(4)}</td>
    </tr>`).join('');
  document.getElementById("stat-rels").textContent = rows.length;
}

function renderUnresolved() {
  const panel = document.getElementById("unresolved-panel");
  if (!UNRESOLVED.length) {
    panel.style.display = "none";
    return;
  }
  panel.style.display = "block";
  document.getElementById("unresolved-list").innerHTML = UNRESOLVED
    .map(w => `<span class="word-form">${w}</span>`).join('');
}

function renderAll() {
  renderWords();
  renderRels();
  renderDetail();
  renderUnresolved();
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

document.getElementById("domain-filter").addEventListener("change", (e) => {
  state.domain = e.target.value;
  renderWords();
});

document.getElementById("words-body").addEventListener("click", (e) => {
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
renderAll();
</script>
</body>
</html>
"""
