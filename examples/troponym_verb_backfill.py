"""Backfills the missing TROPONYM edge for every verb-verb HYPERNYM/
HYPONYM pair already in `semantic_relationships.json`.

Troponymy is verb-specific hyponymy (see `assets/common/en/
relationships/README.md`'s `asset_version 1.15.0` entry and
`examples/common_semantic_completion_seeding.py`'s own docstring): a
verb pair's broader/narrower relationship should always carry both the
general HYPERNYM/HYPONYM pair *and* the more specific TROPONYM edge,
the same way `move`/`flow` does. `examples/relationship_contradiction_audit.py`'s
`find_missing_troponym_companions()` only checked the other direction
(a TROPONYM edge missing its HYPONYM/HYPERNYM companion) -- it had no
way to notice a verb-verb HYPERNYM/HYPONYM pair that was never given a
TROPONYM edge to begin with, because every one of those 41 pairs
predates the TROPONYM/HYPERNYM fix entirely (they were seeded as plain
verb hyponymy by the original 14-subagent drafting pass and the 37-pair
contradiction fix, before troponymy was modelled as a first-class
relationship at all).

Direction: an existing HYPERNYM edge is (narrower/specific, HYPERNYM,
broader/general) -- e.g. `advance -HYPERNYM-> move`. The TROPONYM edge
for the same pair is (general, TROPONYM, specific), the opposite
direction of the HYPERNYM edge -- `move -TROPONYM-> advance`. No
existing edge is touched; this only adds the one new TROPONYM edge per
pair.

Run: python3 examples/troponym_verb_backfill.py
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


def find_verb_hypernym_pairs_missing_troponym() -> list:
    """Returns [(specific, general), ...] for every HYPERNYM edge whose
    source and target both resolve to VERB and which has no TROPONYM
    edge (either direction) already covering the same pair."""
    sem_doc = _load_json(SEMANTIC_PATH)
    rels = sem_doc["relationships"]

    pos_by_form = {}
    base = RELATIONSHIPS_DIR.parent
    files = (
        "determiners.json", "pronouns.json", "auxiliaries.json", "prepositions.json",
        "coordinating_conjunctions.json", "subordinating_conjunctions.json", "particles.json",
        "punctuation.json", "symbols.json", "numerals.json",
        "metalinguistic_nouns.json", "metalinguistic_verbs.json", "metalinguistic_adjectives.json",
        "metalinguistic_adverbs.json", "metalinguistic_proper_nouns.json", "metalinguistic_interjections.json",
        "promoted_words.json",
    )
    for filename in files:
        doc = _load_json(base / filename)
        for w in doc["words"]:
            pos_by_form.setdefault(w["lexical_form"], set()).add(w["part_of_speech"])

    def resolve_pos(form, explicit):
        return {explicit} if explicit else pos_by_form.get(form, set())

    tropo_pairs = set()
    for r in rels:
        if r["relationship_kind"] == "TROPONYM":
            tropo_pairs.add((r["source_lexical_form"], r["target_lexical_form"]))
            tropo_pairs.add((r["target_lexical_form"], r["source_lexical_form"]))

    missing = []
    for r in rels:
        if r["relationship_kind"] != "HYPERNYM":
            continue
        specific, general = r["source_lexical_form"], r["target_lexical_form"]
        specific_pos = resolve_pos(specific, r.get("source_part_of_speech"))
        general_pos = resolve_pos(general, r.get("target_part_of_speech"))
        if specific_pos == {"VERB"} and general_pos == {"VERB"} and (specific, general) not in tropo_pairs:
            missing.append((specific, general))
    return missing


def backfill_troponym_edges() -> dict:
    missing = find_verb_hypernym_pairs_missing_troponym()

    sem_doc = _load_json(SEMANTIC_PATH)
    existing_keys = {
        (r["source_lexical_form"], r.get("source_part_of_speech"), r["relationship_kind"],
         r["target_lexical_form"], r.get("target_part_of_speech"))
        for r in sem_doc["relationships"]
    }

    added = 0
    for specific, general in missing:
        key = (general, "VERB", "TROPONYM", specific, "VERB")
        if key in existing_keys:
            continue
        sem_doc["relationships"].append({
            "source_lexical_form": general,
            "source_part_of_speech": "VERB",
            "target_lexical_form": specific,
            "target_part_of_speech": "VERB",
            "relationship_kind": "TROPONYM",
        })
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
    result = backfill_troponym_edges()
    WordSeeder().validate_assets()
    RelationshipSeeder().validate_assets()
    return result


if __name__ == "__main__":
    result = run()
    print("Verb HYPERNYM pairs missing a TROPONYM edge:", result["pairs_found"])
    print("TROPONYM edges added:", result["edges_added"])
