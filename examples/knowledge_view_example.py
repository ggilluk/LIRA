"""Generates the Knowledge Layer's own example UI -- KnowledgeView
(`knowledge/ui/knowledge_view.py`), a single self-contained, offline HTML
page drawing every Knowledge Vector Space dimension (D1-D6) graphically
over a real, already-seeded `TensorLiraGraph`, with a Concept that traces
back to a seeded Word clickable straight through to that Word's own
detail panel -- rendered by a real embedded `DictionaryView`
(vocabulary/ui/dictionary_view.py), the *same* component
`examples/dictionary_view_example.html` uses, not a re-implementation.

Reuses `physics_domain_seeding.py`'s own fully hydrated Physics Domain
(3169 words, 6164 relationships, PAD already seeded) as real input,
seeds a `TensorLiraGraph` from it via `DictionarySeeder`
(`knowledge/role/dictionary_seeder.py` -- see
`examples/knowledge_vector_space_dictionary_seeding.py` for that
pipeline's own worked example and report), and additionally registers
one real, true D5 fact this codebase's own README already states in
prose (every Domain inherits Common's vocabulary, i.e. Physics
generalises from Common) so the Domains tab has something genuine to
draw rather than an empty placeholder -- not a fabricated hierarchy,
just this one fact made explicit via `register_domain_generalisation`.

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

    graph = TensorLiraGraph()
    seeder = DictionarySeeder(graph)
    seeding_report = seeder.seed_dictionary(dictionary, relationships)

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
        "hosted_domains": hosted_domains,
        "dictionary_view": dictionary_view,
        "knowledge_view": knowledge_view,
    }


if __name__ == "__main__":
    result = run()
    result["knowledge_view"].save(OUTPUT_PATH)

    print(f"Wrote {OUTPUT_PATH}")
    print(f"  Concepts seeded: {result['seeding_report'].concepts_created}")
    print(f"  Edges by dimension: {result['seeding_report'].edges_by_dimension}")
    print("  Open the file in a browser -- fully offline, no server, no external requests.")
