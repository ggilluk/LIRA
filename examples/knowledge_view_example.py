"""Generates the Knowledge Layer's own example UI -- KnowledgeView
(`knowledge/ui/knowledge_view.py`), a single self-contained, offline HTML
page drawing every Knowledge Vector Space dimension (D1-D6) graphically
over a real `TensorLiraGraph` that has been through *both* seeding and
the follow-up Knowledge Vector Space passes (`knowledge/role/
vector_space_passes.py`'s own `run_vector_space_passes`), never rendered
straight off a freshly-seeded graph -- that ordering is this script's own
`run()`, made explicit below rather than left implicit. Concepts that
trace back to a seeded Word are clickable straight through to that
Word's own detail panel -- rendered by a real embedded `DictionaryView`
(vocabulary/ui/dictionary_view.py), the *same* component
`examples/dictionary_view_example.html` uses, not a re-implementation.

Reuses `physics_domain_seeding.py`'s own fully hydrated Physics Domain
(3169 words, 6164 relationships, PAD already seeded) as real input.
Pipeline, in order:

1. Seed -- `DictionarySeeder.seed_dictionary` (`knowledge/role/
   dictionary_seeder.py`; see `examples/knowledge_vector_space_dictionary_seeding.py`
   for that pipeline's own worked example and report). Materialises
   every eligible Word as a Concept and every mapped LexicalRelationship
   as a D1/D2/D3/D4-theta edge or Synonym/Antonym Side-Sign registration.
2. Vector Space passes -- `run_vector_space_passes` (`knowledge/role/
   vector_space_passes.py`). Walks the freshly-seeded CAUSE/ENTAILMENT
   edges as a directed graph and threads each connected run into a
   chain; a chain that doesn't already close gets a real
   `ConceptKind.Unknown` Concept inserted at its own geometrically
   implied position (spec 40.4/40.5) rather than left open, so
   `assign_causal_chain` closes and assigns theta to every edge --
   DictionarySeeder alone never calls it, so skipping this pass leaves
   D4's theta 100% unassigned. Then runs a closing `vector_space_audit`
   over the result.
3. Render -- `KnowledgeView`, only after both passes above have run.

Also registers one real, true D5 fact this codebase's own README
already states in prose (every Domain inherits Common's vocabulary,
i.e. Physics generalises from Common) so the Domains tab has something
genuine to draw rather than an empty placeholder -- not a fabricated
hierarchy, just this one fact made explicit via
`register_domain_generalisation`.

Run: python3 examples/knowledge_view_example.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from physics_domain_seeding import run as run_physics_domain  # noqa: E402

from lira.knowledge.data.domain import Domain  # noqa: E402
from lira.knowledge.data.hosted_domains import HostedDomains  # noqa: E402
from lira.knowledge.data.tensor_graph import TensorLiraGraph  # noqa: E402
from lira.knowledge.role.dictionary_seeder import DictionarySeeder  # noqa: E402
from lira.knowledge.role.vector_space_passes import run_vector_space_passes  # noqa: E402
from lira.knowledge.ui.knowledge_view import KnowledgeView  # noqa: E402
from lira.vocabulary.ui.dictionary_view import DictionaryView  # noqa: E402

OUTPUT_PATH = str(
    Path(__file__).resolve().parent.parent
    / "src" / "lira" / "knowledge" / "assets" / "example_ui" / "knowledge_view_example.html"
)


def run() -> dict:
    _, physics_domain = run_physics_domain()
    dictionary = physics_domain.vocabulary.dictionary
    relationships = physics_domain.vocabulary.lexical_relationships

    # Pass 1: seed.
    graph = TensorLiraGraph()
    seeder = DictionarySeeder(graph)
    seeding_report = seeder.seed_dictionary(dictionary, relationships)

    # Pass 2: Knowledge Vector Space logic over the seeded graph --
    # causal/entailment chain detection + assignment, then a closing
    # audit. KnowledgeView is only built (below) after this returns.
    passes_report = run_vector_space_passes(graph, seeder)

    hosted_domains = HostedDomains()
    common_domain = Domain(name="Common")
    hosted_domains.add(common_domain)
    hosted_domains.add(physics_domain)
    hosted_domains.register_domain_generalisation(physics_domain, common_domain)

    dictionary_view = DictionaryView(
        dictionary, relationships,
        title="LIRA Physics Domain",
        domain_name="Physics",
    )
    knowledge_view = KnowledgeView(
        graph, seeder, dictionary_view, hosted_domains,
        title="LIRA Knowledge -- Physics Domain",
        subtitle="Knowledge Vector Space (D1-D6), seeded from the Physics Domain Dictionary",
    )

    return {
        "physics_domain": physics_domain,
        "graph": graph,
        "seeder": seeder,
        "seeding_report": seeding_report,
        "passes_report": passes_report,
        "hosted_domains": hosted_domains,
        "dictionary_view": dictionary_view,
        "knowledge_view": knowledge_view,
    }


if __name__ == "__main__":
    result = run()
    result["knowledge_view"].save(OUTPUT_PATH)

    print(f"Wrote {OUTPUT_PATH}")
    print(f"  Pass 1 (seed) -- Concepts seeded: {result['seeding_report'].concepts_created}")
    print(f"  Pass 1 (seed) -- Edges by dimension: {result['seeding_report'].edges_by_dimension}")
    print(f"  Pass 2 (vector space logic) -- causal chains: {result['passes_report']['causal_chains']}")
    print(f"  Pass 2 (vector space logic) -- audit: "
          f"{ {k: (len(v) if isinstance(v, list) else v) for k, v in result['passes_report']['audit'].items()} }")
    print("  Open the file in a browser -- fully offline, no server, no external requests.")
