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
CAUSE/ENTAILMENT edge, plus every structural closing edge
knowledge/role/vector_space_passes.py's own close_open_causal_chains
inserted (spec 40.4/40.5 -- see that module's own docstring), drawn
dashed and distinct. Every drawn edge reports its own r (PAD amplitude)
and theta -- theta is essentially always assigned once that pass has
run, since it closes every open chain with a real Unknown Concept
rather than leaving theta unassigned; see examples/knowledge_vector_space_d3_d4.py
for a worked example on a hand-built chain that closes on its own, with
no Unknown needed.

Meant to be generated only after a graph has been through *both*
seeding (DictionarySeeder) and the follow-up Knowledge Vector Space
passes over the seeded result (knowledge/role/vector_space_passes.py's
own `run_vector_space_passes`) -- see examples/knowledge_view_example.py
for that ordering made explicit. Rendering straight off a freshly-seeded
graph still works (every field this view reads has a defined default),
it just shows D4's theta as 100% unassigned and no Unknown Concepts at
all, since DictionarySeeder alone never calls assign_causal_chain.

D1/D2/D3 Concepts are grouped and boxed by Domain (the same Domain
label DictionaryView.word_domain_labels() already reports for a
Concept's own backing Word -- Common vs. a Domain's own words, see
that method's docstring) -- one box per Domain when every Domain is
being shown at once, collapsing to that one Domain's box alone when a
specific Domain is selected via this page's own Domain filter. Within
a Domain's box, a dashed sub-box additionally groups any Concepts that
share a synonym cluster (TensorLiraGraph.synonym_cluster, spec 10/41.8)
-- the same "boxed together" visual language DictionaryView's own
Cyclic tab already uses for a SYNONYM cluster -- unless a checkbox next
to that Domain filter has been switched off, since a busy Domain can
have enough clusters that the boxes themselves become the noise.

Only a Concept this dimension has actually positioned is shown -- a
Concept still sitting at the unpositioned default is left out entirely,
not shown at a placeholder coordinate. (An earlier revision of this
view showed every Concept of the relevant kind, giving an unpositioned
one a z = -5.0 display-layer sentinel; that made every Domain's box
mostly noise on real data and was removed.)

Every Concept node that traces back to a seeded Word (DictionarySeeder's
own Concept-per-Word materialisation) is clickable -- selecting it pivots
to this page's own "Vocabulary" tab, a real embedded DictionaryView
(vocabulary/ui/dictionary_view.py -- the *same* component the standalone
vocabulary dictionary viewer example uses, not a re-implementation) and
opens that Word's detail panel there, via a small additive hook
DictionaryView's own script now exposes (window.liraDictionaryGoToWord,
dictionary_view.py's own render_fragment() output). The reified verb
Concepts DictionarySeeder and close_open_causal_chains create to write
edges against (is-a/part-of/causes/entails/unknown-link) have no Word
behind them and are never Concept-tree nodes themselves (D1/D2/D3 only
ever show a *source*/*destination* Concept of an is-a/part-of edge, and
none of these five is ever one); a Concept close_open_causal_chains
itself created (ConceptKind.Unknown) has no Word either and renders
distinctly wherever D4 shows it."""

import json
from datetime import datetime, timezone
from html import escape
from typing import Dict, List, Optional

from ..data.hosted_domains import HostedDomains
from ..data.tensor_graph import ConceptKind, ConceptRef, RelationshipRef, TensorLiraGraph
from ..role.dictionary_seeder import DictionarySeeder
from ..role.vector_space_passes import find_unknown_link_concept
from ...vocabulary.ui.dictionary_view import DictionaryView

DEFAULT_TITLE = "LIRA Knowledge"
DEFAULT_SUBTITLE = "Knowledge Vector Space -- Dimensions 1-6"

_EMPTY_TREE = {"nodes": {}, "children": {}, "roots": []}

# A Concept whose backing Word this view can't resolve a Domain label
# for (module docstring's own domain-boxing) -- practically, only the
# ConceptKind.Unknown Concepts close_open_causal_chains itself creates,
# which have no backing Word by definition (spec 40.5); kept as an
# explicit fallback rather than a raised
# KeyError so a future caller that seeds Concepts some other way still
# gets a labelled box instead of a crash.
_UNKNOWN_DOMAIN = "Unknown"


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
        word_domain = self.dictionary_view.word_domain_labels()

        d1 = self._dimension_payload(self._isa_edges(ConceptKind.Noun), lambda c: c.d1_z, word_domain)
        d2 = self._dimension_payload(self.graph.edges_by_verb(self.seeder.part_of), lambda c: c.d2_z, word_domain)
        d3 = self._dimension_payload(self._isa_edges(ConceptKind.Relationship), lambda c: c.d3_z, word_domain)
        d4 = self._d4_payload(word_domain)
        if self.hosted_domains is not None:
            d5 = self._domain_tree(self.hosted_domains.d5_z, self.hosted_domains.d5_parent)
            d6 = self._domain_tree(self.hosted_domains.d6_z, self.hosted_domains.d6_whole)
        else:
            d5 = d6 = _EMPTY_TREE

        def node_count(payload: dict) -> int:
            return sum(len(bucket["nodes"]) for bucket in payload.values())

        def edge_count(payload: dict) -> int:
            return sum(len(rows) for rows in payload.values())

        html = _PAGE_TEMPLATE
        for token, value in {
            "TITLE": escape(self.title),
            "SUBTITLE": escape(self.subtitle),
            "COMPILED_AT": escape(self._compiled_at()),
            "CONCEPT_COUNT": str(len(self.graph.all_concepts())),
            "D1_COUNT": str(node_count(d1)),
            "D2_COUNT": str(node_count(d2)),
            "D3_COUNT": str(node_count(d3)),
            "D4_COUNT": str(edge_count(d4)),
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

    def _dimension_payload(self, tree_edges: List[RelationshipRef], z_getter,
                            word_domain: Dict[str, str]) -> Dict[str, dict]:
        """Every Concept actually touched by `tree_edges` (as a source or
        destination -- a Concept this dimension has never positioned at
        all is left out entirely, not shown at a placeholder coordinate,
        module docstring), grouped into one {nodes, children, roots,
        synonym_clusters} payload per Domain -- module docstring's own
        Domain-boxing and synonym-cluster-boxing rules, decided here
        rather than in JS so the rendering script only ever lays out
        what this method already decided. `tree_edges` is already
        scoped to the right Concept kind/verb by the caller (D1: Noun
        is-a edges, D2: part-of edges, D3: Relationship is-a edges), so
        this method never needs to filter by kind itself -- and, since
        the reified is-a/part-of/causes/entails/unknown-link Concepts
        are never a *source or destination* of an is-a/part-of edge
        (only ever the *relationship* column of one), they can never
        appear here regardless."""
        parent_of: Dict[str, str] = {}
        referenced: Dict[str, ConceptRef] = {}
        for edge in tree_edges:
            destination = edge.destination
            if destination is None:
                continue
            parent_of[str(edge.source.idx)] = str(destination.idx)
            referenced[str(edge.source.idx)] = edge.source
            referenced[str(destination.idx)] = destination

        home_domain: Dict[str, str] = {}
        domains: Dict[str, dict] = {}

        def bucket(name: str) -> dict:
            return domains.setdefault(name, {"nodes": {}, "children": {}, "roots": [], "synonym_clusters": []})

        def node_record(concept: ConceptRef, key: str) -> dict:
            return {
                "id": key,
                "label": self._label(concept),
                "z": round(float(z_getter(concept)), 6),
                "word_id": self.seeder.word_uuid_for_concept(concept.idx),
            }

        for key, concept in referenced.items():
            word_id = self.seeder.word_uuid_for_concept(concept.idx)
            domain = word_domain.get(word_id, _UNKNOWN_DOMAIN) if word_id else _UNKNOWN_DOMAIN
            home_domain[key] = domain
            bucket(domain)["nodes"][key] = node_record(concept, key)

        for child_key, parent_key in parent_of.items():
            child_domain = home_domain.get(child_key)
            if child_domain is None:
                continue
            child_bucket = bucket(child_domain)
            child_bucket["children"].setdefault(parent_key, []).append(child_key)
            if parent_key not in child_bucket["nodes"]:
                # The parent lives in a different Domain's own box (a
                # real, common case -- e.g. a Domain-specific word's
                # HYPERNYM parent inherited from Common) -- copied in so
                # this box's own tree stays self-contained and
                # renderable; the copy carries its own true domain, not
                # this box's, so the frontend can still label it
                # distinctly rather than silently mislabel it.
                child_bucket["nodes"][parent_key] = {
                    **node_record(referenced[parent_key], parent_key),
                    "foreign_domain": home_domain.get(parent_key, _UNKNOWN_DOMAIN),
                }

        for data in domains.values():
            child_keys = {child for kids in data["children"].values() for child in kids}
            data["roots"] = [key for key in data["nodes"] if key not in child_keys]
            seen_clusters = set()
            for key in data["nodes"]:
                cluster = self.graph.synonym_cluster(ConceptRef(self.graph, int(key)))
                member_keys = frozenset(str(c.idx) for c in cluster if str(c.idx) in data["nodes"])
                if len(member_keys) < 2 or member_keys in seen_clusters:
                    continue
                seen_clusters.add(member_keys)
                data["synonym_clusters"].append(sorted(member_keys, key=int))

        return domains

    def _d4_payload(self, word_domain: Dict[str, str]) -> Dict[str, list]:
        """Every seeded CAUSE/ENTAILMENT edge, plus every structural
        closing edge close_open_causal_chains itself inserted (spec
        40.4/40.5 -- vector_space_passes.py's own module docstring),
        grouped by its own source Concept's Domain (module docstring's
        Domain-boxing, applied to D4's flat edge list rather than a
        tree) -- carrying its own r (D4's PAD amplitude) and theta.
        find_unknown_link_concept returns None when
        close_open_causal_chains has never run against this graph (a
        page rendered straight off a freshly-seeded graph, module
        docstring) -- the UNKNOWN_LINK kind is simply absent then, not
        an error. A target Concept in a different Domain still renders
        -- the arrow reaches across that Domain's own box, the same
        honest cross-Domain signal _dimension_payload's own
        foreign_domain copies carry for D1/D2/D3."""
        domains: Dict[str, list] = {}
        kinds = [("CAUSE", self.seeder.causes), ("ENTAILMENT", self.seeder.entails)]
        unknown_link = find_unknown_link_concept(self.graph)
        if unknown_link is not None:
            kinds.append(("UNKNOWN_LINK", unknown_link))
        for kind_name, verb in kinds:
            for edge in self.graph.edges_by_verb(verb):
                destination = edge.destination
                if destination is None:
                    continue
                source_word_id = self.seeder.word_uuid_for_concept(edge.source.idx)
                target_word_id = self.seeder.word_uuid_for_concept(destination.idx)
                source_domain = word_domain.get(source_word_id, _UNKNOWN_DOMAIN) if source_word_id else _UNKNOWN_DOMAIN
                target_domain = word_domain.get(target_word_id, _UNKNOWN_DOMAIN) if target_word_id else _UNKNOWN_DOMAIN
                domains.setdefault(source_domain, []).append({
                    "source_id": edge.source.idx,
                    "source_label": self._label(edge.source),
                    "source_word_id": source_word_id,
                    "source_unknown": edge.source.kind == ConceptKind.Unknown,
                    "target_id": destination.idx,
                    "target_label": self._label(destination),
                    "target_word_id": target_word_id,
                    "target_domain": target_domain,
                    "target_unknown": destination.kind == ConceptKind.Unknown,
                    "kind": kind_name,
                    "r": round(float(self.graph.d4_pad_amplitude(edge)), 6),
                    "theta": None if self.graph.is_unassigned_theta(edge) else round(float(self.graph.theta(edge)), 6),
                })
        return domains

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
.kv-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  font-size: 0.82rem;
  color: var(--ink-muted);
}
.kv-toolbar select {
  padding: 6px 10px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 0.85rem;
}
.kv-toolbar label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
.kv-node-foreign text.kv-node-label { font-style: italic; }
.kv-node-unknown circle {
  stroke-dasharray: 2 2;
  fill: color-mix(in srgb, var(--ink-muted) 12%, transparent);
}
.kv-node-unknown text.kv-node-label { font-style: italic; fill: var(--ink-muted); }
.kv-edge-unknown-link {
  stroke-dasharray: 3 3;
  opacity: 0.7;
}
.kv-arrowhead { fill: var(--line-strong); }
.kv-d4-label {
  font-family: var(--font-mono);
  font-size: 10px;
  fill: var(--ink-muted);
}
.kv-domain-box {
  fill: none;
  stroke: var(--line-strong);
  stroke-width: 1.4;
  rx: 8;
}
.kv-domain-label {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 12px;
  fill: var(--ink);
}
.kv-domain-sublabel {
  font-family: var(--font-body);
  font-size: 10px;
  fill: var(--ink-muted);
}
.kv-synonym-box {
  fill: color-mix(in srgb, var(--accent) 8%, transparent);
  stroke: var(--accent);
  stroke-width: 1;
  stroke-dasharray: 3 3;
  rx: 6;
}
.kv-synonym-label {
  font-family: var(--font-body);
  font-size: 9px;
  fill: var(--accent);
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
      <div class="kv-note">Noun Concept generalisation (Hypernym &rarr; Hyponym, spec &sect;7). Depth = distance below Root; each node's own z is shown beneath it. One box per Domain (dashed sub-boxes optionally group synonym clusters within it); only a Concept this dimension has actually positioned is shown. Click a Concept that traces back to a seeded Word to see it in the Vocabulary tab.</div>
      <div class="kv-toolbar">
        <label>Domain <select class="kv-domain-filter" data-target="d1"></select></label>
        <label><input type="checkbox" class="kv-synonym-toggle" data-target="d1" checked> Box synonyms</label>
      </div>
      <div class="kv-svg-wrap"><svg id="kv-svg-d1"></svg></div>
      <div class="kv-empty" id="kv-empty-d1">No positioned Concepts of this kind yet.</div>
    </div>
    <div class="kv-panel" id="kv-panel-d2">
      <div class="kv-note">Noun Concept composition (Holonym &rarr; Meronym, spec &sect;8), an entirely independent tree from D1 over the same Concepts.</div>
      <div class="kv-toolbar">
        <label>Domain <select class="kv-domain-filter" data-target="d2"></select></label>
        <label><input type="checkbox" class="kv-synonym-toggle" data-target="d2" checked> Box synonyms</label>
      </div>
      <div class="kv-svg-wrap"><svg id="kv-svg-d2"></svg></div>
      <div class="kv-empty" id="kv-empty-d2">No positioned Concepts of this kind yet.</div>
    </div>
  </div>

  <div class="lira-tab-content" id="lira-tab-relationships">
    <div class="kv-subtabs" role="tablist">
      <button data-subtab="d3" aria-selected="true">D3 &middot; Generalisation</button>
      <button data-subtab="d4" aria-selected="false">D4 &middot; Composition &amp; Mechanics</button>
    </div>
    <div class="kv-panel active" id="kv-panel-d3">
      <div class="kv-note">Relationship/Verb Concept generalisation (Hypernym &rarr; Troponym, spec &sect;41.5), same is-a tree as D1, scoped to Relationship-kind Concepts.</div>
      <div class="kv-toolbar">
        <label>Domain <select class="kv-domain-filter" data-target="d3"></select></label>
        <label><input type="checkbox" class="kv-synonym-toggle" data-target="d3" checked> Box synonyms</label>
      </div>
      <div class="kv-svg-wrap"><svg id="kv-svg-d3"></svg></div>
      <div class="kv-empty" id="kv-empty-d3">No positioned Concepts of this kind yet.</div>
    </div>
    <div class="kv-panel" id="kv-panel-d4">
      <div class="kv-note">Relationship composition and mechanics (D4 = (Qc, &theta;, r, s), spec &sect;9/41.1) -- every seeded CAUSE/ENTAILMENT edge, grouped into a box per source Domain, with its own r (source Concept's PAD amplitude). An open chain (spec &sect;40.4) is closed with a real, dashed Unknown Concept at its own geometrically implied position (spec &sect;40.5) rather than left with an unassigned &theta; -- see knowledge/role/vector_space_passes.py's close_open_causal_chains, run as a second pass after seeding (examples/knowledge_view_example.py).</div>
      <div class="kv-toolbar"><label>Domain <select class="kv-domain-filter" data-target="d4"></select></label></div>
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

  // Lays out one Domain box's own is-a/part-of tree (computeLayout).
  // Returns pixel positions for every node id in this box's own local
  // coordinate space, so the caller can draw edges and synonym-cluster
  // bounding boxes against real coordinates.
  function layoutDomainContent(data) {
    const childIds = new Set();
    Object.values(data.children).forEach(kids => kids.forEach(id => childIds.add(id)));
    const treeIds = [...new Set([...data.roots, ...childIds])];
    const { posOf, depthOf, leafCount } = computeLayout({ children: data.children, roots: data.roots });
    const maxDepth = Math.max(0, ...treeIds.map(id => depthOf[id] || 0));
    const width = treeIds.length ? MARGIN * 2 + Math.max(leafCount - 1, 0) * COL_WIDTH : 160;
    const height = treeIds.length ? MARGIN + maxDepth * ROW_HEIGHT + 30 : 10;

    const positions = {};
    treeIds.forEach(id => {
      positions[id] = { x: MARGIN + (posOf[id] || 0) * COL_WIDTH, y: MARGIN + (depthOf[id] || 0) * ROW_HEIGHT };
    });

    return { width, height, positions, treeIds };
  }

  // Draws one Domain's own box: a labelled outer rect containing its
  // tree (layoutDomainContent above), with a dashed sub-box behind
  // every synonym cluster this Domain bucket actually has two or more
  // members of present (module docstring's own synonym-cluster boxing,
  // the same "boxed together" language DictionaryView's own Cyclic tab
  // already uses for a SYNONYM cluster) -- unless `boxSynonyms` is off.
  function renderDomainBox(domainName, data, offsetY, boxSynonyms) {
    const layout = layoutDomainContent(data);
    const headerHeight = 34;
    const contentX = 16, contentY = headerHeight + 6;
    const boxWidth = layout.width + 32;
    const boxHeight = layout.height + headerHeight + 20;

    let svg = `<g transform="translate(0,${offsetY})">`;
    svg += `<rect class="kv-domain-box" x="0" y="0" width="${boxWidth}" height="${boxHeight}"></rect>`;
    svg += `<text class="kv-domain-label" x="14" y="20">${escapeHtml(domainName)}</text>`;
    svg += `<text class="kv-domain-sublabel" x="14" y="32">${Object.keys(data.nodes).length} concepts &middot; ${data.synonym_clusters.length} synonym cluster(s)</text>`;

    if (boxSynonyms) {
      data.synonym_clusters.forEach(memberIds => {
        const pts = memberIds.map(id => layout.positions[id]).filter(Boolean);
        if (pts.length < 2) return;
        const minX = Math.min(...pts.map(p => p.x)) - 14, maxX = Math.max(...pts.map(p => p.x)) + 14;
        const minY = Math.min(...pts.map(p => p.y)) - 20, maxY = Math.max(...pts.map(p => p.y)) + 14;
        svg += `<rect class="kv-synonym-box" x="${contentX + minX}" y="${contentY + minY}" width="${maxX - minX}" height="${maxY - minY}"></rect>`;
        svg += `<text class="kv-synonym-label" x="${contentX + minX + 4}" y="${contentY + minY + 10}">synonyms</text>`;
      });
    }

    Object.keys(data.children).forEach(parentId => {
      data.children[parentId].forEach(childId => {
        const p = layout.positions[parentId], c = layout.positions[childId];
        if (!p || !c) return;
        svg += `<line class="kv-edge" x1="${contentX + p.x}" y1="${contentY + p.y}" x2="${contentX + c.x}" y2="${contentY + c.y}"></line>`;
      });
    });

    layout.treeIds.forEach(id => {
      const node = data.nodes[id];
      const pos = layout.positions[id];
      if (!node || !pos) return;
      const classes = ["kv-node"];
      if (node.word_id) classes.push("kv-node-clickable");
      if (node.foreign_domain) classes.push("kv-node-foreign");
      const titleBits = [`${node.label} · z=${node.z.toFixed(3)}`];
      if (node.foreign_domain) titleBits.push(`from ${node.foreign_domain}`);
      svg += `<g class="${classes.join(' ')}" tabindex="0" data-word-id="${node.word_id || ''}" transform="translate(${contentX + pos.x},${contentY + pos.y})">`;
      svg += `<title>${escapeHtml(titleBits.join(' · '))}</title><circle r="7"></circle>`;
      svg += `<text class="kv-node-label" y="-12" text-anchor="middle">${escapeHtml(node.label)}</text>`;
      svg += `<text class="kv-node-z" y="20" text-anchor="middle">z=${node.z.toFixed(3)}</text>`;
      svg += `</g>`;
    });

    svg += `</g>`;
    return { svg, width: boxWidth, height: boxHeight };
  }

  function bindNodeClicks(svg) {
    svg.querySelectorAll(".kv-node-clickable").forEach(g => {
      g.addEventListener("click", () => goToWord(g.dataset.wordId));
      g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goToWord(g.dataset.wordId); } });
    });
  }

  function populateDomainFilter(prefix, domainNames, onChange) {
    const select = document.querySelector(`.kv-domain-filter[data-target="${prefix}"]`);
    if (!select || select.dataset.populated) return select;
    select.innerHTML = `<option value="">All Domains</option>` +
      domainNames.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
    select.dataset.populated = "1";
    select.addEventListener("change", onChange);
    return select;
  }

  function bindSynonymToggle(prefix, onChange) {
    const toggle = document.querySelector(`.kv-synonym-toggle[data-target="${prefix}"]`);
    if (!toggle) return true; // D4's own toolbar has no synonym toggle -- boxing always on there is moot, it never draws one
    if (!toggle.dataset.bound) {
      toggle.dataset.bound = "1";
      toggle.addEventListener("change", onChange);
    }
    return toggle.checked;
  }

  // D1/D2/D3: one Domain-boxed tree per Domain (or just the selected
  // one), stacked vertically -- module docstring's own Domain-boxing.
  function renderDimensionTab(prefix, payload) {
    const svg = document.getElementById(`kv-svg-${prefix}`);
    const emptyEl = document.getElementById(`kv-empty-${prefix}`);
    const domainNames = Object.keys(payload).sort();
    const rerender = () => renderDimensionTab(prefix, payload);
    const select = populateDomainFilter(prefix, domainNames, rerender);
    const boxSynonyms = bindSynonymToggle(prefix, rerender);
    const selected = select ? select.value : "";
    const domainsToShow = (selected ? [selected] : domainNames).filter(name => Object.keys(payload[name].nodes).length);

    if (domainsToShow.length === 0) {
      svg.style.display = "none";
      emptyEl.style.display = "block";
      return;
    }
    svg.style.display = "block";
    emptyEl.style.display = "none";

    let offsetY = 0, maxWidth = 0, body = "";
    domainsToShow.forEach(name => {
      const { svg: boxSvg, width, height } = renderDomainBox(name, payload[name], offsetY, boxSynonyms);
      body += boxSvg;
      offsetY += height + 24;
      maxWidth = Math.max(maxWidth, width);
    });
    const totalHeight = Math.max(offsetY - 24, 40);
    svg.setAttribute("viewBox", `0 0 ${maxWidth} ${totalHeight}`);
    svg.setAttribute("width", maxWidth);
    svg.setAttribute("height", totalHeight);
    svg.innerHTML = body;
    bindNodeClicks(svg);
  }

  // D4: one Domain-boxed stack of CAUSE/ENTAILMENT arrow-rows per
  // source Domain (or just the selected one) -- a target Concept in a
  // different Domain still renders, labelled, the arrow simply reaching
  // across that Domain's own box (module docstring's own cross-Domain
  // honesty, mirroring _dimension_payload's foreign_domain copies). An
  // UNKNOWN_LINK row (spec 40.4/40.5 -- vector_space_passes.py's own
  // close_open_causal_chains) draws its arrow dashed and either
  // endpoint that's the Unknown Concept itself styled distinctly, so
  // a structurally-inserted closing edge never reads as an ordinary
  // seeded CAUSE/ENTAILMENT fact.
  function renderD4Box(domainName, edges, offsetY) {
    const rowHeight = 52;
    const headerHeight = 34;
    const width = 680;
    const height = rowHeight * edges.length + headerHeight + 20;
    let svg = `<g transform="translate(0,${offsetY})">`;
    svg += `<rect class="kv-domain-box" x="0" y="0" width="${width}" height="${height}"></rect>`;
    svg += `<text class="kv-domain-label" x="14" y="20">${escapeHtml(domainName)}</text>`;
    svg += `<text class="kv-domain-sublabel" x="14" y="32">${edges.length} edge(s)</text>`;
    edges.forEach((e, i) => {
      const cy = headerHeight + 26 + i * rowHeight;
      const thetaLabel = e.theta === null ? "&theta; unassigned" : `&theta;=${e.theta.toFixed(3)}`;
      const crossDomain = e.target_domain && e.target_domain !== domainName;
      const sourceClasses = ["kv-node"];
      if (e.source_word_id) sourceClasses.push("kv-node-clickable");
      if (e.source_unknown) sourceClasses.push("kv-node-unknown");
      const targetClasses = ["kv-node"];
      if (e.target_word_id) targetClasses.push("kv-node-clickable");
      if (crossDomain) targetClasses.push("kv-node-foreign");
      if (e.target_unknown) targetClasses.push("kv-node-unknown");
      svg += `
        <g class="${sourceClasses.join(' ')}" tabindex="0" data-word-id="${e.source_word_id || ''}" transform="translate(64,${cy})">
          <circle r="7"></circle>
          <text class="kv-node-label" y="-12" text-anchor="middle">${escapeHtml(e.source_label)}</text>
        </g>
        <line class="kv-edge${e.kind === 'UNKNOWN_LINK' ? ' kv-edge-unknown-link' : ''}" x1="84" y1="${cy}" x2="${width - 104}" y2="${cy}" marker-end="url(#kv-arrowhead)"></line>
        <text class="kv-d4-label" x="${width / 2}" y="${cy - 10}" text-anchor="middle">${e.kind} &middot; r=${e.r.toFixed(2)} &middot; ${thetaLabel}</text>
        <g class="${targetClasses.join(' ')}" tabindex="0" data-word-id="${e.target_word_id || ''}" transform="translate(${width - 64},${cy})">
          <title>${escapeHtml(e.target_label)}${crossDomain ? ' · ' + escapeHtml(e.target_domain) : ''}</title>
          <circle r="7"></circle>
          <text class="kv-node-label" y="-12" text-anchor="middle">${escapeHtml(e.target_label)}${crossDomain ? ` (${escapeHtml(e.target_domain)})` : ''}</text>
        </g>`;
    });
    svg += `</g>`;
    return { svg, width, height };
  }

  function renderD4Tab(payload) {
    const svg = document.getElementById("kv-svg-d4");
    const emptyEl = document.getElementById("kv-empty-d4");
    const domainNames = Object.keys(payload).sort();
    const select = populateDomainFilter("d4", domainNames, () => renderD4Tab(payload));
    const selected = select ? select.value : "";
    const domainsToShow = (selected ? [selected] : domainNames).filter(name => (payload[name] || []).length);

    if (domainsToShow.length === 0) {
      svg.style.display = "none";
      emptyEl.style.display = "block";
      return;
    }
    svg.style.display = "block";
    emptyEl.style.display = "none";

    let offsetY = 0, maxWidth = 0;
    let body = `<defs><marker id="kv-arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" class="kv-arrowhead"></path></marker></defs>`;
    domainsToShow.forEach(name => {
      const { svg: boxSvg, width, height } = renderD4Box(name, payload[name], offsetY);
      body += boxSvg;
      offsetY += height + 24;
      maxWidth = Math.max(maxWidth, width);
    });
    const totalHeight = Math.max(offsetY - 24, 40);
    svg.setAttribute("viewBox", `0 0 ${maxWidth} ${totalHeight}`);
    svg.setAttribute("width", maxWidth);
    svg.setAttribute("height", totalHeight);
    svg.innerHTML = body;
    bindNodeClicks(svg);
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

  renderDimensionTab("d1", D1);
  renderDimensionTab("d2", D2);
  renderDimensionTab("d3", D3);
  renderD4Tab(D4);
  renderVectorTree("kv-svg-d5", "kv-empty-d5", D5);
  renderVectorTree("kv-svg-d6", "kv-empty-d6", D6);
})();
</script>
</body>
</html>
"""
