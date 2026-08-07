"""Seeds a real Knowledge Vector Space TensorLiraGraph from a
Vocabulary Layer Dictionary + LexicalRelationshipStore, via
`DictionarySeeder` (`knowledge/role/dictionary_seeder.py`) --
`knowledge_vector_space_specification.md` section 41.11's own
"reinterpretation layer... rather than a requirement to replace the
seeded semantic_relationships data model", made runnable end to end.

Reuses `examples/physics_domain_seeding.py`'s own fully hydrated
Physics Domain (3169 words, 6164 relationships, PAD already seeded on
every Common-cache word via `examples/pad_seeding.py`) as real,
already-verified input -- not a toy graph built by hand, the same data
every other example in this directory demonstrates against. Reports
what got seeded and what didn't (and why), runs the companion audit
(spec 41.10) against the result, and spot-checks a handful of concrete
facts end to end: a real HYPERNYM pair's D1 ordering, a real CAUSE
pair's `causes`/`entails` edges (this session's own reciprocal-pairing
work), and a real seeded PAD triple flowing from `Word` straight
through to its `ConceptRef.pad`.

Run: python3 examples/knowledge_vector_space_dictionary_seeding.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from physics_domain_seeding import run as run_physics_domain  # noqa: E402

from lira.knowledge.data.tensor_graph import ConceptKind, TensorLiraGraph  # noqa: E402
from lira.knowledge.role.dictionary_seeder import DictionarySeeder  # noqa: E402


def run() -> dict:
    _, physics_domain = run_physics_domain()
    dictionary = physics_domain.vocabulary.dictionary
    relationships = physics_domain.vocabulary.lexical_relationships

    graph = TensorLiraGraph()
    seeder = DictionarySeeder(graph)
    seeding_report = seeder.seed_dictionary(dictionary, relationships)
    audit = graph.vector_space_audit()

    return {
        "physics_domain": physics_domain,
        "graph": graph,
        "seeder": seeder,
        "seeding_report": seeding_report,
        "audit": audit,
    }


def _find_concept(seeder: DictionarySeeder, dictionary, text: str, part_of_speech):
    word = next((w for w in dictionary.lookup_all(text) if w.part_of_speech == part_of_speech), None)
    if word is None:
        return None
    return seeder._concept_for_word_uuid.get(word.uuid.value)


if __name__ == "__main__":
    from lira.vocabulary.data.part_of_speech import PartOfSpeech as POS

    result = run()
    dictionary = result["physics_domain"].vocabulary.dictionary
    seeder = result["seeder"]
    seeding_report = result["seeding_report"]
    audit = result["audit"]

    print("-- Seeding report --")
    print(f"  Concepts created: {seeding_report.concepts_created}")
    print(f"  Words skipped (part of speech not Concept-eligible): "
          f"{sum(seeding_report.words_skipped_part_of_speech.values())} "
          f"({seeding_report.words_skipped_part_of_speech})")
    print(f"  Edges seeded by dimension: {seeding_report.edges_by_dimension}")
    print(f"  Relationships skipped -- reciprocal (already covered): {seeding_report.relationships_skipped_reciprocal}")
    print(f"  Relationships skipped -- no Knowledge Vector Space mapping: {seeding_report.relationships_skipped_no_mapping}")
    print(f"  Relationships skipped -- endpoint not Concept-eligible: {seeding_report.relationships_skipped_endpoint_not_seedable}")
    print(f"  Relationships skipped -- genuine Side/Sign conflict: {seeding_report.relationships_skipped_conflict}")

    print()
    print("-- Companion vector-space audit (spec 41.10) --")
    print(f"  wrong_kind_d1_d2: {len(audit['wrong_kind_d1_d2'])}")
    print(f"  wrong_kind_d3: {len(audit['wrong_kind_d3'])}")
    print(f"  d4_no_duplicate_d3_coordinate: {audit['d4_no_duplicate_d3_coordinate']}")
    print(f"  open_causal_chains: {len(audit['open_causal_chains'])} "
          "(expected -- nothing was grouped into a chain by this seeder, spec 40.4's valid incomplete state)")
    print(f"  coincident_concepts (review evidence, not errors): {len(audit['coincident_concepts'])}")
    print(f"  cluster_side_inconsistencies: {len(audit['cluster_side_inconsistencies'])}")
    assert not audit["wrong_kind_d1_d2"] and not audit["wrong_kind_d3"] and not audit["cluster_side_inconsistencies"]

    print()
    print("-- Spot checks against real seeded data --")
    electron = _find_concept(seeder, dictionary, "electron", POS.NOUN)
    particle = _find_concept(seeder, dictionary, "particle", POS.NOUN)
    print(f"  electron.d1_z={electron.d1_z:.6f} < particle.d1_z={particle.d1_z:.6f}: {electron.d1_z < particle.d1_z}")
    assert electron.d1_z < particle.d1_z, "electron (HYPONYM) must sit below particle (HYPERNYM)"

    attract = _find_concept(seeder, dictionary, "attract", POS.VERB)
    move = _find_concept(seeder, dictionary, "move", POS.VERB)
    graph = result["graph"]
    causes_col = graph._col_key_to_idx.get((seeder.causes.uuid, move.idx))
    entails_col = graph._col_key_to_idx.get((seeder.entails.uuid, move.idx))
    has_causes = causes_col is not None and graph._M_confidence[attract.idx, causes_col] > 0
    has_entails = entails_col is not None and graph._M_confidence[attract.idx, entails_col] > 0
    print(f"  attract -causes-> move: {has_causes}   attract -entails-> move: {has_entails}")
    assert has_causes and has_entails, "CAUSE must seed both its own edge and its required ENTAILMENT companion"

    kill = _find_concept(seeder, dictionary, "kill", POS.VERB)
    print(f"  kill.pad = {kill.pad}  (seeded via pad_seeding.py, flowed through DictionarySeeder unchanged)")
    assert kill.pad == (-0.9, 0.7, 0.8)

    print()
    print("All spot checks passed against a real, fully hydrated Physics Domain.")
