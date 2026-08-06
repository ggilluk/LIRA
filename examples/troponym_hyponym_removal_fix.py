"""Removes every verb-verb HYPONYM edge from `semantic_relationships.json`.

Corrects an over-application from the TROPONYM/HYPERNYM fix
(`assets/common/en/relationships/README.md`'s `asset_version 1.15.0`/
`1.16.0` entries): HYPONYM is a noun-only kind --
HYPERNYM/HYPONYM applies to nouns, TROPONYM/HYPERNYM applies to verbs
(HYPERNYM is the one kind shared between the two; HYPONYM is not). The
original fix reasoned "troponymy is verb-specific hyponymy" and
concluded a TROPONYM edge should materialise *both* a same-direction
HYPONYM edge and a reverse-direction HYPERNYM edge -- but the correct
rule only wanted the HYPERNYM reciprocal. The extra HYPONYM edges made
verbs show up under the Hierarchy tab's Hyponym selector, which should
be noun-only.

Removes all 50 verb-verb HYPONYM edges found: both the 9 materialised
as TROPONYM companions and the 41 that predate the TROPONYM/HYPERNYM
fix entirely (from the original 14-subagent drafting pass and the
37-pair contradiction fix). Every corresponding HYPERNYM edge (broader,
shared with nouns) and TROPONYM edge (narrower, verb-specific) is left
untouched -- only the HYPONYM edge is removed.

Run: python3 examples/troponym_hyponym_removal_fix.py
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
WORD_CACHE_DIR = RELATIONSHIPS_DIR.parent
WORD_CACHE_FILES = (
    "determiners.json", "pronouns.json", "auxiliaries.json", "prepositions.json",
    "coordinating_conjunctions.json", "subordinating_conjunctions.json", "particles.json",
    "punctuation.json", "symbols.json", "numerals.json",
    "metalinguistic_nouns.json", "metalinguistic_verbs.json", "metalinguistic_adjectives.json",
    "metalinguistic_adverbs.json", "metalinguistic_proper_nouns.json", "metalinguistic_interjections.json",
    "promoted_words.json",
)


def _pos_by_form() -> dict:
    pos_by_form: dict = {}
    for filename in WORD_CACHE_FILES:
        doc = _load_json(WORD_CACHE_DIR / filename)
        for w in doc["words"]:
            pos_by_form.setdefault(w["lexical_form"], set()).add(w["part_of_speech"])
    return pos_by_form


def remove_verb_hyponym_edges() -> dict:
    pos_by_form = _pos_by_form()

    def resolve_pos(form, explicit):
        return {explicit} if explicit else pos_by_form.get(form, set())

    sem_doc = _load_json(SEMANTIC_PATH)
    before = len(sem_doc["relationships"])

    removed = []
    kept = []
    for r in sem_doc["relationships"]:
        if r["relationship_kind"] == "HYPONYM":
            s, t = r["source_lexical_form"], r["target_lexical_form"]
            sp = resolve_pos(s, r.get("source_part_of_speech"))
            tp = resolve_pos(t, r.get("target_part_of_speech"))
            if sp == {"VERB"} and tp == {"VERB"}:
                removed.append(r)
                continue
        kept.append(r)

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

    return {"before": before, "after": len(kept), "edges_removed": len(removed), "removed": removed}


def run() -> dict:
    result = remove_verb_hyponym_edges()
    WordSeeder().validate_assets()
    RelationshipSeeder().validate_assets()
    return result


if __name__ == "__main__":
    result = run()
    print(f"semantic_relationships.json: {result['before']} -> {result['after']}")
    print("Verb-verb HYPONYM edges removed:", result["edges_removed"])
    for r in result["removed"]:
        print(f"   {r['source_lexical_form']} -HYPONYM-> {r['target_lexical_form']}")
