"""Applies the 37 corrections `examples/relationship_contradiction_audit.py`
found and `examples/relationship_contradiction_report.md` reasoned
through: word pairs in `semantic_relationships.json` that carried more
than one Lexical Semantic relationship kind at once (e.g. SYNONYM and
HYPERNYM/HYPONYM between the same two words -- logically impossible,
since a pair can't both mean the same thing and be broader/narrower
than each other).

Reads `examples/relationship_contradiction_corrections.json` (the
reviewed correction list -- each entry's `edges_to_remove`/
`edges_to_add`) and applies it directly: removes the 74 losing edges
(picked per-pair by the report's own reasoning, grounded in each
word's seeded definition -- see the report for the full case-by-case
justification) and adds the 2 edges that fix `method`/`procedure`'s
reversed HYPERNYM/HYPONYM direction (the one pair that was a genuine
direction bug, not just a redundant edge). Recomputes
`semantic_relationships.json`'s count and the relationship cache
manifest's checksum, the same pattern every other fix script in this
directory uses.

Run: python3 examples/relationship_contradiction_fix.py
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from definition_gap_vocabulary_seeding import (  # noqa: E402
    RELATIONSHIPS_DIR,
    _compute_checksum,
    _load_json,
    _save_json,
)

from lira.vocabulary.role.word_seeder import WordSeeder  # noqa: E402
from lira.vocabulary.role.relationship_seeder import RelationshipSeeder  # noqa: E402

CORRECTIONS_PATH = Path(__file__).resolve().parent / "relationship_contradiction_corrections.json"
SEMANTIC_PATH = RELATIONSHIPS_DIR / "semantic_relationships.json"


def _edge_key(source, kind, target) -> tuple:
    src_form, src_pos, src_tag = source
    tgt_form, tgt_pos, tgt_tag = target
    return (src_form, src_pos, src_tag, kind, tgt_form, tgt_pos, tgt_tag)


def _to_entry(source, kind, target) -> dict:
    src_form, src_pos, src_tag = source
    tgt_form, tgt_pos, tgt_tag = target
    entry = {
        "source_lexical_form": src_form,
        "target_lexical_form": tgt_form,
        "relationship_kind": kind,
    }
    if src_pos:
        entry["source_part_of_speech"] = src_pos
    if src_tag:
        entry["source_domain_tag"] = src_tag
    if tgt_pos:
        entry["target_part_of_speech"] = tgt_pos
    if tgt_tag:
        entry["target_domain_tag"] = tgt_tag
    return entry


def apply_corrections() -> dict:
    corrections = json.loads(CORRECTIONS_PATH.read_text())

    remove_keys = set()
    add_entries = []
    for correction in corrections:
        for ed in correction["edges_to_remove"]:
            remove_keys.add(_edge_key(tuple(ed["source"]), ed["kind"], tuple(ed["target"])))
        for ed in correction["edges_to_add"]:
            add_entries.append(_to_entry(tuple(ed["source"]), ed["kind"], tuple(ed["target"])))

    sem_doc = _load_json(SEMANTIC_PATH)
    existing_keys = {
        _edge_key(
            (r["source_lexical_form"], r.get("source_part_of_speech"), r.get("source_domain_tag")),
            r["relationship_kind"],
            (r["target_lexical_form"], r.get("target_part_of_speech"), r.get("target_domain_tag")),
        )
        for r in sem_doc["relationships"]
    }

    before = len(sem_doc["relationships"])
    kept = [r for r in sem_doc["relationships"] if _edge_key(
        (r["source_lexical_form"], r.get("source_part_of_speech"), r.get("source_domain_tag")),
        r["relationship_kind"],
        (r["target_lexical_form"], r.get("target_part_of_speech"), r.get("target_domain_tag")),
    ) not in remove_keys]
    removed = before - len(kept)

    added = 0
    for entry in add_entries:
        key = _edge_key(
            (entry["source_lexical_form"], entry.get("source_part_of_speech"), entry.get("source_domain_tag")),
            entry["relationship_kind"],
            (entry["target_lexical_form"], entry.get("target_part_of_speech"), entry.get("target_domain_tag")),
        )
        if key in existing_keys:
            continue
        kept.append(entry)
        existing_keys.add(key)
        added += 1

    sem_doc["relationships"] = kept
    sem_doc["count"] = len(kept)
    _save_json(SEMANTIC_PATH, sem_doc)

    manifest_path = RELATIONSHIPS_DIR / "manifest.json"
    manifest = _load_json(manifest_path)
    for file_entry in manifest["files"]:
        if file_entry["file"] == "semantic_relationships.json":
            file_entry["count"] = sem_doc["count"]
    manifest["relationship_count"] = sum(fe["count"] for fe in manifest["files"])
    manifest["checksum"] = _compute_checksum()
    _save_json(manifest_path, manifest)

    return {
        "corrections_applied": len(corrections),
        "edges_removed": removed,
        "edges_added": added,
        "before": before,
        "after": len(kept),
    }


def run() -> dict:
    result = apply_corrections()
    WordSeeder().validate_assets()
    RelationshipSeeder().validate_assets()
    return result


if __name__ == "__main__":
    result = run()
    print("Corrections applied:", result["corrections_applied"])
    print("Edges removed:", result["edges_removed"])
    print("Edges added:", result["edges_added"])
    print(f"semantic_relationships.json: {result['before']} -> {result['after']}")
