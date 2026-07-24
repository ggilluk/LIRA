"""Seeds common_semantic_completion.py's 1307 Lexical Semantic
relationships (LexicalRelationshipType group 1) into the static Common
relationship cache, materialising every reciprocal edge the same way
this cache's own README documents: HYPERNYM -> reciprocal HYPONYM,
MERONYM -> reciprocal HOLONYM, SYNONYM/ANTONYM/RELATED -> reciprocal
same-kind edge in the reverse direction (they're symmetric).
TROPONYM/ENTAILMENT/CAUSE get no reciprocal -- one-directional by
definition, no inverse kind exists for them.

Every word referenced already exists in the Common Vocabulary Cache
(common_semantic_completion.py's own drafting process only ever used
words from a supplied, verified-real list) -- this script adds
relationships only, no new words, unlike the morphology-completion
batch before it.

Run: python3 examples/common_semantic_completion_seeding.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common_semantic_completion import RELATIONSHIPS  # noqa: E402
from common_core_vocabulary_seeding import run as seed_common_core_vocabulary  # noqa: E402
from definition_gap_vocabulary_seeding import (  # noqa: E402
    RELATIONSHIPS_DIR,
    _compute_checksum,
    _load_json,
    _save_json,
)

from lira.vocabulary.role.word_seeder import WordSeeder  # noqa: E402

RECIPROCAL_KIND = {
    "HYPERNYM": "HYPONYM",
    "MERONYM": "HOLONYM",
    "SYNONYM": "SYNONYM",
    "ANTONYM": "ANTONYM",
    "RELATED": "RELATED",
    # TROPONYM/ENTAILMENT/CAUSE: no reciprocal, one-directional by design.
}


def add_semantic_relationships() -> dict:
    sem_path = RELATIONSHIPS_DIR / "semantic_relationships.json"
    sem_doc = _load_json(sem_path)
    existing_keys = {
        (r["source_lexical_form"], r.get("source_part_of_speech"), r["relationship_kind"],
         r["target_lexical_form"], r.get("target_part_of_speech"))
        for r in sem_doc["relationships"]
    }

    added = 0
    for source_form, source_pos, kind, target_form, target_pos in RELATIONSHIPS:
        edges = [(source_form, source_pos, kind, target_form, target_pos)]
        recip = RECIPROCAL_KIND.get(kind)
        if recip:
            edges.append((target_form, target_pos, recip, source_form, source_pos))

        for src_f, src_p, rel_kind, tgt_f, tgt_p in edges:
            key = (src_f, src_p, rel_kind, tgt_f, tgt_p)
            if key in existing_keys:
                continue
            sem_doc["relationships"].append({
                "source_lexical_form": src_f,
                "source_part_of_speech": src_p,
                "target_lexical_form": tgt_f,
                "target_part_of_speech": tgt_p,
                "relationship_kind": rel_kind,
            })
            existing_keys.add(key)
            added += 1

    sem_doc["count"] = len(sem_doc["relationships"])
    _save_json(sem_path, sem_doc)
    return {"edges_added": added}


def run() -> dict:
    semantic_report = add_semantic_relationships()

    rel_manifest_path = RELATIONSHIPS_DIR / "manifest.json"
    rel_manifest = _load_json(rel_manifest_path)
    for file_entry in rel_manifest["files"]:
        if file_entry["file"] == "semantic_relationships.json":
            sem_doc = _load_json(RELATIONSHIPS_DIR / "semantic_relationships.json")
            file_entry["count"] = sem_doc["count"]
    rel_manifest["relationship_count"] = sum(fe["count"] for fe in rel_manifest["files"])
    rel_manifest["asset_version"] = "1.11.0"
    rel_manifest["checksum"] = _compute_checksum()
    _save_json(rel_manifest_path, rel_manifest)

    WordSeeder().validate_assets()

    core_result = seed_common_core_vocabulary()

    return {
        "semantic": semantic_report,
        "core_result": core_result,
        "physics_domain": core_result["physics_domain"],
        "sentence_unresolved_words": core_result["sentence_unresolved_words"],
    }


if __name__ == "__main__":
    from lira.vocabulary import DictionaryView

    result = run()
    print("Semantic edges added:", result["semantic"]["edges_added"])

    physics_domain = result["physics_domain"]
    print("Final Physics Dictionary size:", physics_domain.vocabulary.dictionary.total_entries())
    print("Final Physics relationship count:", len(physics_domain.vocabulary.lexical_relationships.relationships))

    ui_path = Path(__file__).resolve().parents[1] / "src/lira/vocabulary/assets/example_ui/dictionary_view_example.html"
    DictionaryView(
        physics_domain.vocabulary.dictionary,
        physics_domain.vocabulary.lexical_relationships,
        title="LIRA Dictionary -- Physics Domain (hydrated words sourced from curated fixture "
              "data standing in for Free Dictionary API -- see examples/README.md)",
        domain_name=physics_domain.name,
        unresolved=tuple(result["sentence_unresolved_words"]),
    ).save(str(ui_path))
    print(f"Example UI regenerated at {ui_path}")
