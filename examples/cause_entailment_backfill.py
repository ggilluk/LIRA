"""Backfills the missing ENTAILMENT edge for every existing CAUSE pair.

CAUSE is a subtype of ENTAILMENT: causation is a stronger claim than
entailment (if X causes Y, X's occurrence logically entails Y's), but
not every entailment is causal ("snore" entails "sleep" without
snoring causing sleep). `assets/common/en/relationships/README.md`'s
`asset_version 1.18.0` entry has the full reasoning -- the same subtype
relationship TROPONYM has to HYPERNYM/HYPONYM, except CAUSE's
companion is in the *same* direction, not reversed: "kill" CAUSE "die"
and "kill" ENTAILMENT "die" name the same two endpoints in the same
order.

No existing edge is touched, only the missing ENTAILMENT edge is
added, for each of the 3 pairs found: `acquire`/`possess` ("acquire"
is defined as "to gain or come to possess something" -- possession is
named directly in its own definition), `attract`/`move`, `trigger`/
`start` ("trigger" is defined as "to cause something to happen or
start" -- naming "start" directly).

Run: python3 examples/cause_entailment_backfill.py
"""

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

SEMANTIC_PATH = RELATIONSHIPS_DIR / "semantic_relationships.json"


def find_cause_pairs_missing_entailment() -> list:
    sem_doc = _load_json(SEMANTIC_PATH)
    rels = sem_doc["relationships"]

    edge_set = {
        (r["source_lexical_form"], r.get("source_part_of_speech"), r["relationship_kind"],
         r["target_lexical_form"], r.get("target_part_of_speech"))
        for r in rels
    }

    missing = []
    for r in rels:
        if r["relationship_kind"] != "CAUSE":
            continue
        key = (r["source_lexical_form"], r.get("source_part_of_speech"), "ENTAILMENT",
               r["target_lexical_form"], r.get("target_part_of_speech"))
        if key not in edge_set:
            missing.append(r)
    return missing


def backfill_entailment_edges() -> dict:
    missing = find_cause_pairs_missing_entailment()

    sem_doc = _load_json(SEMANTIC_PATH)
    existing_keys = {
        (r["source_lexical_form"], r.get("source_part_of_speech"), r["relationship_kind"],
         r["target_lexical_form"], r.get("target_part_of_speech"))
        for r in sem_doc["relationships"]
    }

    added = 0
    for r in missing:
        entry = {
            "source_lexical_form": r["source_lexical_form"],
            "target_lexical_form": r["target_lexical_form"],
            "relationship_kind": "ENTAILMENT",
        }
        if r.get("source_part_of_speech"):
            entry["source_part_of_speech"] = r["source_part_of_speech"]
        if r.get("target_part_of_speech"):
            entry["target_part_of_speech"] = r["target_part_of_speech"]
        key = (entry["source_lexical_form"], entry.get("source_part_of_speech"), "ENTAILMENT",
               entry["target_lexical_form"], entry.get("target_part_of_speech"))
        if key in existing_keys:
            continue
        sem_doc["relationships"].append(entry)
        existing_keys.add(key)
        added += 1

    sem_doc["count"] = len(sem_doc["relationships"])
    _save_json(SEMANTIC_PATH, sem_doc)

    manifest_path = RELATIONSHIPS_DIR / "manifest.json"
    manifest = _load_json(manifest_path)
    for file_entry in manifest["files"]:
        if file_entry["file"] == "semantic_relationships.json":
            file_entry["count"] = sem_doc["count"]
    manifest["relationship_count"] = sum(fe["count"] for fe in manifest["files"])
    manifest["checksum"] = _compute_checksum()
    _save_json(manifest_path, manifest)

    return {"pairs_found": len(missing), "edges_added": added}


def run() -> dict:
    result = backfill_entailment_edges()
    WordSeeder().validate_assets()
    RelationshipSeeder().validate_assets()
    return result


if __name__ == "__main__":
    result = run()
    print("CAUSE pairs missing an ENTAILMENT edge:", result["pairs_found"])
    print("ENTAILMENT edges added:", result["edges_added"])
