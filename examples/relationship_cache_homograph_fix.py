"""Seeds the three relationships that a part-of-speech blind spot in
RelationshipSeeder.seed_domain's resolution (vocabulary/role/relationship_seeder.py)
previously made unsafe to add: each names a Common homograph (a
lexical_form with more than one part_of_speech) as an endpoint, and the
static relationship cache had no way to say *which* sense was meant --
`Dictionary.lookup()` is first-seeded-wins by text alone.

Now that RelationshipSeeder resolves an endpoint via an optional
`source_part_of_speech`/`target_part_of_speech` field (see
relationships/README.md's schema section), all three can be seeded
correctly:

- `cause` (VERB) -> `PRESENT_PARTICIPLE_FORM` -> `causing` -- removed in
  examples/definition_gap_vocabulary.py's own batch after being found
  silently attached to the NOUN sense of `cause`.
- `cause` (VERB) -> `NOMINALISATION` -> `causation` -- removed in
  examples/verb_nominalisation_vocabulary.py's own batch for the
  identical reason.
- `state` (VERB) -> `NOMINALISATION` -> `statement` -- considered and
  deliberately left unseeded in examples/common_core_vocabulary.py's
  own batch, having learned the `cause` lesson.

Each gets its reciprocal LEMMA_FORM edge too (target -> LEMMA_FORM ->
source), the Common relationship cache's own established convention --
with an explicit target_part_of_speech on the *reverse* edge, since the
lemma being pointed back to is the ambiguous endpoint there.

Run: python3 examples/relationship_cache_homograph_fix.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from definition_gap_vocabulary_seeding import RELATIONSHIPS_DIR, _compute_checksum, _load_json, _save_json  # noqa: E402

# (source_lexical_form, source_pos_or_None, target_lexical_form, target_pos_or_None, kind)
HOMOGRAPH_SAFE_RELATIONSHIPS = [
    ("cause", "VERB", "causing", None, "PRESENT_PARTICIPLE_FORM"),
    ("causing", None, "cause", "VERB", "LEMMA_FORM"),
    ("cause", "VERB", "causation", None, "NOMINALISATION"),
    ("causation", None, "cause", "VERB", "LEMMA_FORM"),
    ("state", "VERB", "statement", None, "NOMINALISATION"),
    ("statement", None, "state", "VERB", "LEMMA_FORM"),
]


def run() -> dict:
    morph_path = RELATIONSHIPS_DIR / "morphological_relationships.json"
    morph_doc = _load_json(morph_path)
    existing = {
        (r["source_lexical_form"], r.get("source_part_of_speech"), r["target_lexical_form"], r.get("target_part_of_speech"), r["relationship_kind"])
        for r in morph_doc["relationships"]
    }

    added = []
    for source_form, source_pos, target_form, target_pos, kind in HOMOGRAPH_SAFE_RELATIONSHIPS:
        key = (source_form, source_pos, target_form, target_pos, kind)
        if key in existing:
            continue
        entry = {"source_lexical_form": source_form, "target_lexical_form": target_form, "relationship_kind": kind}
        if source_pos:
            entry["source_part_of_speech"] = source_pos
        if target_pos:
            entry["target_part_of_speech"] = target_pos
        morph_doc["relationships"].append(entry)
        existing.add(key)
        added.append(entry)

    morph_doc["count"] = len(morph_doc["relationships"])
    _save_json(morph_path, morph_doc)

    manifest_path = RELATIONSHIPS_DIR / "manifest.json"
    manifest = _load_json(manifest_path)
    for file_entry in manifest["files"]:
        if file_entry["file"] == "morphological_relationships.json":
            file_entry["count"] = morph_doc["count"]
    manifest["relationship_count"] = sum(fe["count"] for fe in manifest["files"])
    manifest["checksum"] = _compute_checksum()
    _save_json(manifest_path, manifest)

    return {"added": added, "final_morphological_count": morph_doc["count"], "final_relationship_count": manifest["relationship_count"]}


if __name__ == "__main__":
    result = run()
    print("Edges added:", len(result["added"]))
    for entry in result["added"]:
        print(" ", entry)
    print("Final morphological_relationships.json count:", result["final_morphological_count"])
    print("Final total relationship count:", result["final_relationship_count"])
