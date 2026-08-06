"""Backfills the missing companion edge for every existing CAUSE or
ENTAILMENT pair, in both directions.

CAUSE and ENTAILMENT are required companions of each other, same
direction: "kill" CAUSE "die" and "kill" ENTAILMENT "die" name the
same two endpoints in the same order. An earlier version of this
cache treated the pairing as one-way (every CAUSE got a matching
ENTAILMENT, but a pure ENTAILMENT pair was left alone on the reasoning
that not every entailment is causal -- `assets/common/en/relationships/
README.md`'s `asset_version 1.18.0` entry, and `cause_entailment_backfill.py`,
which this script supersedes). `asset_version 1.21.0` makes the pairing
fully reciprocal instead, the same way HYPERNYM/HYPONYM and MERONYM/
HOLONYM are always paired: every CAUSE edge must have a matching
ENTAILMENT edge, and every ENTAILMENT edge must have a matching CAUSE
edge.

No existing edge is touched, only the missing companion edge is added.
Found and fixed 3 ENTAILMENT-only pairs that predate this rule:
`enclose`/`contain`, `lead`/`precede`, `rest`/`stop` -- each already
had its ENTAILMENT edge (from before the reciprocal rule existed) but
no CAUSE edge. The 3 CAUSE pairs from the earlier one-way fix
(`acquire`/`possess`, `attract`/`move`, `trigger`/`start`) already have
both edges and are left untouched.

Run: python3 examples/cause_entailment_reciprocal_backfill.py
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


def find_missing_companions(sem_doc: dict, have_kind: str, want_kind: str) -> list:
    rels = sem_doc["relationships"]
    edge_set = {
        (r["source_lexical_form"], r.get("source_part_of_speech"), r["relationship_kind"],
         r["target_lexical_form"], r.get("target_part_of_speech"))
        for r in rels
    }
    missing = []
    for r in rels:
        if r["relationship_kind"] != have_kind:
            continue
        key = (r["source_lexical_form"], r.get("source_part_of_speech"), want_kind,
               r["target_lexical_form"], r.get("target_part_of_speech"))
        if key not in edge_set:
            missing.append(r)
    return missing


def backfill_companion_edges() -> dict:
    sem_doc = _load_json(SEMANTIC_PATH)
    cause_missing_entailment = find_missing_companions(sem_doc, "CAUSE", "ENTAILMENT")
    entailment_missing_cause = find_missing_companions(sem_doc, "ENTAILMENT", "CAUSE")

    existing_keys = {
        (r["source_lexical_form"], r.get("source_part_of_speech"), r["relationship_kind"],
         r["target_lexical_form"], r.get("target_part_of_speech"))
        for r in sem_doc["relationships"]
    }

    added = 0
    for want_kind, missing in (("ENTAILMENT", cause_missing_entailment), ("CAUSE", entailment_missing_cause)):
        for r in missing:
            entry = {
                "source_lexical_form": r["source_lexical_form"],
                "target_lexical_form": r["target_lexical_form"],
                "relationship_kind": want_kind,
            }
            if r.get("source_part_of_speech"):
                entry["source_part_of_speech"] = r["source_part_of_speech"]
            if r.get("target_part_of_speech"):
                entry["target_part_of_speech"] = r["target_part_of_speech"]
            key = (entry["source_lexical_form"], entry.get("source_part_of_speech"), want_kind,
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

    return {
        "cause_pairs_missing_entailment": len(cause_missing_entailment),
        "entailment_pairs_missing_cause": len(entailment_missing_cause),
        "edges_added": added,
    }


def run() -> dict:
    result = backfill_companion_edges()
    WordSeeder().validate_assets()
    RelationshipSeeder().validate_assets()
    return result


if __name__ == "__main__":
    result = run()
    print("CAUSE pairs missing an ENTAILMENT edge:", result["cause_pairs_missing_entailment"])
    print("ENTAILMENT pairs missing a CAUSE edge:", result["entailment_pairs_missing_cause"])
    print("Edges added:", result["edges_added"])
