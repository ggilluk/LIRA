"""KnowledgeView: renders a TensorLiraGraph's Knowledge Vector Space
geometry (D1-D6, knowledge/documentation/knowledge_vector_space_specification.md)
as a single self-contained, offline HTML page -- generated once a
Domain's Knowledge graph has actually been seeded (DictionarySeeder,
knowledge/role/dictionary_seeder.py), the same "static file, vanilla JS,
no server" discipline every other view in this codebase already uses
(vocabulary/ui/dictionary_view.py, linguistics/ui/sentence_reader_view.py,
knowledge/ui/lira_view.py).

Every dimension is drawn as an actual diagram, not a table: D1 (noun
generalisation) and D3 (verb/Relationship generalisation) as SVG trees
positioned top-down by is-a depth; D2 (noun composition) as an SVG tree
by part-of depth; D5 (Domain generalisation) and D6 (Domain composition)
the same way over HostedDomains. D4 (Relationship composition and
mechanics) is drawn as a labelled arrow diagram over every seeded
CAUSE/ENTAILMENT edge instead of a polar theta plot -- D4's own theta
stays unassigned (spec 40.4's valid incomplete state) until a caller
explicitly calls assign_causal_chain, which DictionarySeeder deliberately
never does (its own module docstring: "nothing about one pairwise
Vocabulary fact identifies which cycle it belongs to"), so a polar plot
would have nowhere real to place these edges; see
examples/knowledge_vector_space_d3_d4.py for a worked example where
theta *is* assigned, on a hand-built closed causal chain. Every drawn
edge still reports its own r (PAD amplitude) and theta-or-"unassigned"
so the honest, incomplete state is visible rather than hidden.

Only Concepts/Domains that actually participate in at least one edge for
a given dimension are drawn -- every fresh Concept/Domain defaults to
D1_D2_ROOT until explicitly positioned (tensor_graph.py's own module
docstring), and a forest of thousands of same-point roots would be
noise, not a diagram (the same filtering reasoning
TensorLiraGraph.vector_space_audit()'s own coincident_concepts check
already applies to this graph's data).

Every Concept node that traces back to a seeded Word (DictionarySeeder's
own Concept-per-Word materialisation) is clickable -- selecting it pivots
to this page's own "Vocabulary" tab, a real embedded DictionaryView
(vocabulary/ui/dictionary_view.py -- the *same* component the standalone
vocabulary dictionary viewer example uses, not a re-implementation) and
opens that Word's detail panel there, via a small additive hook
DictionaryView's own script now exposes (window.liraDictionaryGoToWord,
dictionary_view.py's own render_fragment() output). The four reified
verb Concepts DictionarySeeder itself creates to write edges against
(is-a/part-of/causes/entails) have no Word behind them and render as
plain, non-clickable nodes."""

import json
from datetime import datetime, timezone
from html import escape
from typing import Dict, List, Optional

from ..data.hosted_domains import HostedDomains
from ..data.tensor_graph import ConceptKind, ConceptRef, RelationshipRef, TensorLiraGraph
from ..role.dictionary_seeder import DictionarySeeder
from ...vocabulary.ui.dictionary_view import DictionaryView

DEFAULT_TITLE = "LIRA Knowledge"
DEFAULT_SUBTITLE = "Knowledge Vector Space -- Dimensions 1-6"

_EMPTY_TREE = {"nodes": {}, "children": {}, "roots": []}


class KnowledgeView:
    """Construct with an already-seeded `TensorLiraGraph` and the
    `DictionarySeeder` that seeded it (for Concept->Word linkage), plus
    the `DictionaryView` to embed as this page's own Vocabulary tab
    (typically built over the same Dictionary/LexicalRelationshipStore
    the seeder read from). `hosted_domains` is optional -- omit it (or
    pass one with no D5/D6 registrations yet) and the Domains tab
    reports that honestly rather than fabricating a hierarchy."""

    def __init__(self, graph: TensorLiraGraph, seeder: DictionarySeeder, dictionary_view: DictionaryView,
                 hosted_domains: Optional[HostedDomains] = None, *,
                 title: str = DEFAULT_TITLE, subtitle: str = DEFAULT_SUBTITLE):
        self.graph = graph
        self.seeder = seeder
        self.dictionary_view = dictionary_view
        self.hosted_domains = hosted_domains
        self.title = title
        self.subtitle = subtitle

    @staticmethod
    def _compiled_at() -> str:
        """The moment render() is actually called, not construction time
        -- matches every other view's own _compiled_at() in this codebase."""
        return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    def render(self) -> str:
        dict_style, dict_body, dict_script = self.dictionary_view.render_fragment()

        d1 = self._concept_tree(self._isa_edges(ConceptKind.Noun), lambda c: c.d1_z)
        d2 = self._concept_tree(self.graph.edges_by_verb(self.seeder.part_of), lambda c: c.d2_z)
        d3 = self._concept_tree(self._isa_edges(ConceptKind.Relationship), lambda c: c.d3_z)
        d4 = self._d4_edges()
        if self.hosted_domains is not None:
            d5 = self._domain_tree(self.hosted_domains.d5_z, self.hosted_domains.d5_parent)
            d6 = self._domain_tree(self.hosted_domains.d6_z, self.hosted_domains.d6_whole)
        else:
            d5 = d6 = _EMPTY_TREE

        html = _PAGE_TEMPLATE
        for token, value in {
            "TITLE": escape(self.title),
            "SUBTITLE": escape(self.subtitle),
            "COMPILED_AT": escape(self._compiled_at()),
            "CONCEPT_COUNT": str(len(self.graph.all_concepts())),
            "D1_COUNT": str(len(d1["nodes"])),
            "D2_COUNT": str(len(d2["nodes"])),
            "D3_COUNT": str(len(d3["nodes"])),
            "D4_COUNT": str(len(d4)),
            "D5_COUNT": str(len(d5["nodes"])),
            "D6_COUNT": str(len(d6["nodes"])),
            "DICTIONARY_STYLE": dict_style,
            "DICTIONARY_BODY": dict_body,
            "DICTIONARY_SCRIPT": dict_script,
            "D1_JSON": json.dumps(d1),
            "D2_JSON": json.dumps(d2),
            "D3_JSON": json.dumps(d3),
            "D4_JSON": json.dumps(d4),
            "D5_JSON": json.dumps(d5),
            "D6_JSON": json.dumps(d6),
        }.items():
            html = html.replace("@@%s@@" % token, value)
        return html

    def save(self, path: str) -> None:
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(self.render())

    # -- data extraction --

    def _isa_edges(self, kind: ConceptKind) -> List[RelationshipRef]:
        """Every is-a edge whose *source* is the given Concept kind --
        the same split add_relationship's own D1/D3 branch already makes
        (source.kind alone decides which Dimension an is-a edge
        positions, tensor_graph.py's own comment there), reused here to
        separate D1 (Noun) from D3 (Relationship) out of one shared
        edge set (DictionarySeeder always writes is-a edges through the
        one reified `is_a` Concept regardless of kind)."""
        return [e for e in self.graph.edges_by_verb(self.seeder.is_a) if e.source.kind == kind]

    @staticmethod
    def _label(concept: ConceptRef) -> str:
        """This Concept's display label -- strips the "::<uuid8>"
        disambiguation suffix DictionarySeeder.seed_word appends to a
        Word-backed Concept's own name (to keep two distinct Word senses
        that happen to share surface text from colliding, its own
        docstring), which a reader has no reason to see in a diagram."""
        name = concept.name
        return name.split("::", 1)[0] if "::" in name else name

    def _concept_tree(self, edges: List[RelationshipRef], z_getter) -> dict:
        """Builds a {nodes, children, roots} forest payload (string-keyed
        throughout, by Concept row index, so every id round-trips through
        JSON/JS property access identically) from a flat is-a/part-of edge
        list -- a node with no incoming parent_of entry is a root of its
        own subtree, not necessarily D1_D2_ROOT itself (a subtree can be
        rooted at any already-positioned Concept that itself has no
        further recorded parent)."""
        nodes: Dict[str, dict] = {}
        parent_of: Dict[str, str] = {}

        def register(concept: ConceptRef) -> None:
            key = str(concept.idx)
            if key in nodes:
                return
            nodes[key] = {
                "id": key,
                "label": self._label(concept),
                "z": round(float(z_getter(concept)), 6),
                "word_id": self.seeder.word_uuid_for_concept(concept.idx),
            }

        for edge in edges:
            destination = edge.destination
            if destination is None:
                continue
            register(edge.source)
            register(destination)
            parent_of[str(edge.source.idx)] = str(destination.idx)

        children: Dict[str, List[str]] = {}
        for child_key, parent_key in parent_of.items():
            children.setdefault(parent_key, []).append(child_key)
        roots = [key for key in nodes if key not in parent_of]
        return {"nodes": nodes, "children": children, "roots": roots}

    def _d4_edges(self) -> List[dict]:
        """Every seeded CAUSE/ENTAILMENT edge as a flat (source, target)
        record carrying its own r (D4's PAD amplitude) and theta-or-None
        (module docstring's "honest, incomplete state") -- the arrow
        diagram's own data, not a tree (D4 isn't a hierarchy)."""
        records = []
        for kind_name, verb in (("CAUSE", self.seeder.causes), ("ENTAILMENT", self.seeder.entails)):
            for edge in self.graph.edges_by_verb(verb):
                destination = edge.destination
                if destination is None:
                    continue
                records.append({
                    "source_id": edge.source.idx,
                    "source_label": self._label(edge.source),
                    "source_word_id": self.seeder.word_uuid_for_concept(edge.source.idx),
                    "target_id": destination.idx,
                    "target_label": self._label(destination),
                    "target_word_id": self.seeder.word_uuid_for_concept(destination.idx),
                    "kind": kind_name,
                    "r": round(float(self.graph.d4_pad_amplitude(edge)), 6),
                    "theta": None if self.graph.is_unassigned_theta(edge) else round(float(self.graph.theta(edge)), 6),
                })
        return records

    def _domain_tree(self, z_getter, parent_getter) -> dict:
        """Mirrors _concept_tree above at Domain scale (HostedDomains'
        own D5/D6, keyed by Domain name rather than a row index -- same
        "only what's actually positioned" filtering: a Domain never
        given a parent_getter result is left out entirely, the Domain
        equivalent of a Concept still sitting at D1_D2_ROOT on both axes."""
        nodes: Dict[str, dict] = {}
        parent_of: Dict[str, str] = {}
        for domain in self.hosted_domains:
            parent = parent_getter(domain)
            if parent is None:
                continue
            nodes[domain.name] = {"id": domain.name, "label": domain.name,
                                   "z": round(float(z_getter(domain)), 6), "word_id": None}
            nodes[parent.name] = {"id": parent.name, "label": parent.name,
                                   "z": round(float(z_getter(parent)), 6), "word_id": None}
            parent_of[domain.name] = parent.name
        children: Dict[str, List[str]] = {}
        for child, parent in parent_of.items():
            children.setdefault(parent, []).append(child)
        roots = [name for name in nodes if name not in parent_of]
        return {"nodes": nodes, "children": children, "roots": roots}


_PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>@@TITLE@@ -- compiled @@COMPILED_AT@@</title>
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
.tab-switcher {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 4px;
}
.tab-switcher button {
  background: none;
  border: none;
  border-radius: 4px;
  padding: 7px 16px;
  font-size: 0.88rem;
  font-weight: 600;
  font-family: var(--font-body);
  color: var(--ink-muted);
  cursor: pointer;
}
.tab-switcher button.active {
  background: var(--accent);
  color: var(--accent-ink);
}
.tab-switcher button:not(.active):hover { color: var(--ink); }
.lira-tab-content { display: none; }
.lira-tab-content.active { display: block; }
.kv-stat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}
.kv-stat {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 14px 16px;
  box-shadow: var(--shadow);
}
.kv-stat .value {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.kv-stat .label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
  margin-top: 4px;
}
.kv-subtabs {
  display: inline-flex;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 16px;
}
.kv-subtabs button {
  border: none;
  background: var(--surface);
  color: var(--ink-muted);
  font-family: var(--font-body);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 9px 16px;
  cursor: pointer;
}
.kv-subtabs button + button { border-left: 1px solid var(--line-strong); }
.kv-subtabs button[aria-selected="true"] {
  background: var(--accent);
  color: var(--accent-ink);
}
.kv-panel { display: none; }
.kv-panel.active { display: block; }
.kv-note {
  font-size: 0.82rem;
  color: var(--ink-muted);
  margin-bottom: 14px;
  line-height: 1.45;
}
.kv-svg-wrap {
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow);
  padding: 12px;
  overflow: auto;
  max-height: 640px;
}
.kv-empty {
  padding: 40px 16px;
  text-align: center;
  color: var(--ink-muted);
  font-size: 0.9rem;
  display: none;
}
.kv-edge {
  stroke: var(--line-strong);
  stroke-width: 1.4;
  fill: none;
}
.kv-node circle {
  fill: var(--surface);
  stroke: var(--ink-muted);
  stroke-width: 1.6;
}
.kv-node text {
  font-family: var(--font-mono);
  font-size: 11px;
  fill: var(--ink);
}
.kv-node .kv-node-z {
  font-size: 9px;
  fill: var(--ink-muted);
}
.kv-node-clickable { cursor: pointer; }
.kv-node-clickable circle { stroke: var(--accent); }
.kv-node-clickable:hover circle, .kv-node-clickable:focus circle { fill: var(--accent); }
.kv-node-clickable:hover text.kv-node-label, .kv-node-clickable:focus text.kv-node-label { fill: var(--accent); text-decoration: underline; }
.kv-node:focus { outline: none; }
.kv-arrowhead { fill: var(--line-strong); }
.kv-d4-label {
  font-family: var(--font-mono);
  font-size: 10px;
  fill: var(--ink-muted);
}
footer.lira-footer {
  margin-top: 28px;
  font-size: 0.76rem;
  color: var(--ink-muted);
  text-align: center;
}
</style>
<style>
@@DICTIONARY_STYLE@@
</style>
</head>
<body>
<div class="page">
  <header class="masthead">
    <div>
      <h1>@@TITLE@@</h1>
      <div class="subtitle">@@SUBTITLE@@ &middot; compiled @@COMPILED_AT@@</div>
    </div>
    <nav class="tab-switcher" role="tablist">
      <button class="lira-tab-btn active" type="button" data-tab="nouns" role="tab" aria-selected="true">Nouns (D1 &middot; D2)</button>
      <button class="lira-tab-btn" type="button" data-tab="relationships" role="tab" aria-selected="false">Relationships (D3 &middot; D4)</button>
      <button class="lira-tab-btn" type="button" data-tab="domains" role="tab" aria-selected="false">Domains (D5 &middot; D6)</button>
      <button class="lira-tab-btn" type="button" data-tab="vocabulary" role="tab" aria-selected="false">Vocabulary</button>
    </nav>
  </header>

  <div class="kv-stat-row">
    <div class="kv-stat"><div class="value">@@CONCEPT_COUNT@@</div><div class="label">Concepts</div></div>
    <div class="kv-stat"><div class="value">@@D1_COUNT@@</div><div class="label">D1 positioned (nouns)</div></div>
    <div class="kv-stat"><div class="value">@@D2_COUNT@@</div><div class="label">D2 positioned (nouns)</div></div>
    <div class="kv-stat"><div class="value">@@D3_COUNT@@</div><div class="label">D3 positioned (verbs)</div></div>
    <div class="kv-stat"><div class="value">@@D4_COUNT@@</div><div class="label">D4 edges (cause/entail)</div></div>
    <div class="kv-stat"><div class="value">@@D5_COUNT@@</div><div class="label">D5 positioned (domains)</div></div>
    <div class="kv-stat"><div class="value">@@D6_COUNT@@</div><div class="label">D6 positioned (domains)</div></div>
  </div>

  <div class="lira-tab-content active" id="lira-tab-nouns">
    <div class="kv-subtabs" role="tablist">
      <button data-subtab="d1" aria-selected="true">D1 &middot; Generalisation</button>
      <button data-subtab="d2" aria-selected="false">D2 &middot; Composition</button>
    </div>
    <div class="kv-panel active" id="kv-panel-d1">
      <div class="kv-note">Noun Concept generalisation (Hypernym &rarr; Hyponym, spec &sect;7). Depth = distance below Root; each node's own z is shown beneath it. Click a Concept that traces back to a seeded Word to see it in the Vocabulary tab.</div>
      <div class="kv-svg-wrap"><svg id="kv-svg-d1"></svg></div>
      <div class="kv-empty" id="kv-empty-d1">No D1-positioned Concepts yet -- every Concept defaults to Root until an is-a edge is recorded against it.</div>
    </div>
    <div class="kv-panel" id="kv-panel-d2">
      <div class="kv-note">Noun Concept composition (Holonym &rarr; Meronym, spec &sect;8), an entirely independent tree from D1 over the same Concepts.</div>
      <div class="kv-svg-wrap"><svg id="kv-svg-d2"></svg></div>
      <div class="kv-empty" id="kv-empty-d2">No D2-positioned Concepts yet -- every Concept defaults to Root until a part-of edge is recorded against it.</div>
    </div>
  </div>

  <div class="lira-tab-content" id="lira-tab-relationships">
    <div class="kv-subtabs" role="tablist">
      <button data-subtab="d3" aria-selected="true">D3 &middot; Generalisation</button>
      <button data-subtab="d4" aria-selected="false">D4 &middot; Composition &amp; Mechanics</button>
    </div>
    <div class="kv-panel active" id="kv-panel-d3">
      <div class="kv-note">Relationship/Verb Concept generalisation (Hypernym &rarr; Troponym, spec &sect;41.5), same is-a tree as D1, scoped to Relationship-kind Concepts.</div>
      <div class="kv-svg-wrap"><svg id="kv-svg-d3"></svg></div>
      <div class="kv-empty" id="kv-empty-d3">No D3-positioned Concepts yet -- every Relationship Concept defaults to Root until an is-a edge is recorded against it.</div>
    </div>
    <div class="kv-panel" id="kv-panel-d4">
      <div class="kv-note">Relationship composition and mechanics (D4 = (Qc, &theta;, r, s), spec &sect;9/41.1) -- every seeded CAUSE/ENTAILMENT edge, with its own r (source Concept's PAD amplitude). &theta; only exists once a caller groups edges into a closed causal chain (assign_causal_chain) -- this seeder never does, so it reads "unassigned" here rather than a fabricated angle; see examples/knowledge_vector_space_d3_d4.py for a worked example with &theta; assigned.</div>
      <div class="kv-svg-wrap"><svg id="kv-svg-d4"></svg></div>
      <div class="kv-empty" id="kv-empty-d4">No CAUSE/ENTAILMENT edges seeded yet.</div>
    </div>
  </div>

  <div class="lira-tab-content" id="lira-tab-domains">
    <div class="kv-subtabs" role="tablist">
      <button data-subtab="d5" aria-selected="true">D5 &middot; Generalisation</button>
      <button data-subtab="d6" aria-selected="false">D6 &middot; Composition</button>
    </div>
    <div class="kv-panel active" id="kv-panel-d5">
      <div class="kv-note">Domain generalisation (Domain Hypernym &rarr; Domain Hyponym, spec &sect;14) -- the Common Domain is the permanent outer boundary (D1_D2_ROOT on both axes).</div>
      <div class="kv-svg-wrap"><svg id="kv-svg-d5"></svg></div>
      <div class="kv-empty" id="kv-empty-d5">No Domain generalisation registered yet -- register_domain_generalisation (or register_domain_hierarchy_from_name) hasn't been called for this Host.</div>
    </div>
    <div class="kv-panel" id="kv-panel-d6">
      <div class="kv-note">Domain composition (Domain Holonym &rarr; Domain Meronym, spec &sect;15), an entirely independent tree from D5 over the same Domains.</div>
      <div class="kv-svg-wrap"><svg id="kv-svg-d6"></svg></div>
      <div class="kv-empty" id="kv-empty-d6">No Domain composition registered yet -- register_domain_composition hasn't been called for this Host.</div>
    </div>
  </div>

  <div class="lira-tab-content" id="lira-tab-vocabulary">
@@DICTIONARY_BODY@@
  </div>

  <footer class="lira-footer">Generated by KnowledgeView (lira.knowledge.ui) &middot; Vocabulary tab generated by DictionaryView (lira.vocabulary.ui)</footer>
</div>

<script>
(function () {
@@DICTIONARY_SCRIPT@@
})();
</script>
<script>
(function () {
  const D1 = @@D1_JSON@@;
  const D2 = @@D2_JSON@@;
  const D3 = @@D3_JSON@@;
  const D4 = @@D4_JSON@@;
  const D5 = @@D5_JSON@@;
  const D6 = @@D6_JSON@@;

  const COL_WIDTH = 92;
  const ROW_HEIGHT = 66;
  const MARGIN = 44;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function goToWord(wordId) {
    if (!wordId) return;
    selectOuterTab("vocabulary");
    if (window.liraDictionaryGoToWord) window.liraDictionaryGoToWord(wordId);
  }

  // Tidy-tree layout: a leaf gets the next integer column in visiting
  // order, an internal node centres over the mean of its own children's
  // columns -- simple, deterministic, no overlap for a genuine tree
  // (every id here has at most one parent, add_relationship's own
  // "assumes single inheritance" and register_domain_generalisation/
  // composition's own equivalent).
  function computeLayout(tree) {
    const { children, roots } = tree;
    let leafCounter = 0;
    const posOf = {};
    const depthOf = {};
    function visit(id, depth) {
      depthOf[id] = depth;
      const kids = children[id] || [];
      if (kids.length === 0) {
        posOf[id] = leafCounter;
        leafCounter += 1;
        return posOf[id];
      }
      const kidPositions = kids.map(k => visit(k, depth + 1));
      posOf[id] = kidPositions.reduce((a, b) => a + b, 0) / kidPositions.length;
      return posOf[id];
    }
    roots.forEach(r => visit(r, 0));
    return { posOf, depthOf, leafCount: Math.max(leafCounter, 1) };
  }

  function renderVectorTree(svgId, emptyId, tree) {
    const svg = document.getElementById(svgId);
    const emptyEl = document.getElementById(emptyId);
    const nodeIds = Object.keys(tree.nodes);
    if (nodeIds.length === 0) {
      svg.style.display = "none";
      emptyEl.style.display = "block";
      return;
    }
    svg.style.display = "block";
    emptyEl.style.display = "none";
    const { posOf, depthOf, leafCount } = computeLayout(tree);
    const maxDepth = Math.max(0, ...nodeIds.map(id => depthOf[id]));
    const width = MARGIN * 2 + Math.max(leafCount - 1, 0) * COL_WIDTH;
    const height = MARGIN * 2 + maxDepth * ROW_HEIGHT + 20;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    const x = id => MARGIN + posOf[id] * COL_WIDTH;
    const y = id => MARGIN + depthOf[id] * ROW_HEIGHT;

    let edgesSvg = "";
    Object.keys(tree.children).forEach(parentId => {
      tree.children[parentId].forEach(childId => {
        edgesSvg += `<line class="kv-edge" x1="${x(parentId)}" y1="${y(parentId)}" x2="${x(childId)}" y2="${y(childId)}"></line>`;
      });
    });

    let nodesSvg = "";
    nodeIds.forEach(id => {
      const node = tree.nodes[id];
      const clickable = !!node.word_id;
      nodesSvg += `
        <g class="kv-node${clickable ? ' kv-node-clickable' : ''}" tabindex="0" data-word-id="${node.word_id || ''}" transform="translate(${x(id)},${y(id)})">
          <circle r="7"></circle>
          <text class="kv-node-label" y="-12" text-anchor="middle">${escapeHtml(node.label)}</text>
          <text class="kv-node-z" y="20" text-anchor="middle">z=${node.z.toFixed(3)}</text>
        </g>`;
    });

    svg.innerHTML = edgesSvg + nodesSvg;
    svg.querySelectorAll(".kv-node-clickable").forEach(g => {
      g.addEventListener("click", () => goToWord(g.dataset.wordId));
      g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goToWord(g.dataset.wordId); } });
    });
  }

  function renderD4(svgId, emptyId, edges) {
    const svg = document.getElementById(svgId);
    const emptyEl = document.getElementById(emptyId);
    if (!edges.length) {
      svg.style.display = "none";
      emptyEl.style.display = "block";
      return;
    }
    svg.style.display = "block";
    emptyEl.style.display = "none";
    const rowHeight = 52;
    const width = 680;
    const height = rowHeight * edges.length + 24;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    let body = `<defs><marker id="kv-arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" class="kv-arrowhead"></path></marker></defs>`;
    edges.forEach((e, i) => {
      const cy = 30 + i * rowHeight;
      const thetaLabel = e.theta === null ? "&theta; unassigned" : `&theta;=${e.theta.toFixed(3)}`;
      body += `
        <g class="kv-node${e.source_word_id ? ' kv-node-clickable' : ''}" tabindex="0" data-word-id="${e.source_word_id || ''}" transform="translate(64,${cy})">
          <circle r="7"></circle>
          <text class="kv-node-label" y="-12" text-anchor="middle">${escapeHtml(e.source_label)}</text>
        </g>
        <line class="kv-edge" x1="84" y1="${cy}" x2="${width - 104}" y2="${cy}" marker-end="url(#kv-arrowhead)"></line>
        <text class="kv-d4-label" x="${width / 2}" y="${cy - 10}" text-anchor="middle">${e.kind} &middot; r=${e.r.toFixed(2)} &middot; ${thetaLabel}</text>
        <g class="kv-node${e.target_word_id ? ' kv-node-clickable' : ''}" tabindex="0" data-word-id="${e.target_word_id || ''}" transform="translate(${width - 64},${cy})">
          <circle r="7"></circle>
          <text class="kv-node-label" y="-12" text-anchor="middle">${escapeHtml(e.target_label)}</text>
        </g>`;
    });
    svg.innerHTML = body;
    svg.querySelectorAll(".kv-node-clickable").forEach(g => {
      g.addEventListener("click", () => goToWord(g.dataset.wordId));
      g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goToWord(g.dataset.wordId); } });
    });
  }

  function selectOuterTab(tab) {
    document.querySelectorAll(".lira-tab-btn").forEach(btn => {
      const active = btn.dataset.tab === tab;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll(".lira-tab-content").forEach(panel => {
      panel.classList.toggle("active", panel.id === `lira-tab-${tab}`);
    });
  }
  window.selectOuterTab = selectOuterTab;

  document.querySelectorAll(".lira-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => selectOuterTab(btn.dataset.tab));
  });

  document.querySelectorAll(".kv-subtabs").forEach(group => {
    const buttons = group.querySelectorAll("button[data-subtab]");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        buttons.forEach(other => other.setAttribute("aria-selected", other === btn ? "true" : "false"));
        group.parentElement.querySelectorAll(".kv-panel").forEach(panel => {
          panel.classList.toggle("active", panel.id === `kv-panel-${btn.dataset.subtab}`);
        });
      });
    });
  });

  renderVectorTree("kv-svg-d1", "kv-empty-d1", D1);
  renderVectorTree("kv-svg-d2", "kv-empty-d2", D2);
  renderVectorTree("kv-svg-d3", "kv-empty-d3", D3);
  renderD4("kv-svg-d4", "kv-empty-d4", D4);
  renderVectorTree("kv-svg-d5", "kv-empty-d5", D5);
  renderVectorTree("kv-svg-d6", "kv-empty-d6", D6);
})();
</script>
</body>
</html>
"""
