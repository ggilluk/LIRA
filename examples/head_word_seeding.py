"""Adds the word "head" to the Common Vocabulary Cache -- a genuine
homograph, missing from the cache entirely (checked directly against
the live Dictionary before writing anything: no `head` entry, NOUN or
VERB, exists anywhere in `assets/common/en/`).

Two senses, both open-class, promoted via the same `WordSeeder.promote_word`
path every other batch in this project uses (`examples/README.md`'s
Common core vocabulary section, `assets/common/en/README.md`'s 9.4):

- `head` (NOUN) -- "The upper part of the human body, or the front or
  uppermost part of an animal's body, containing the brain, eyes,
  ears, nose, and mouth." A body part is a `part` (already Common,
  "A piece or segment of something that, together with other pieces,
  makes up the whole.") -- the same HYPERNYM choice this cache already
  makes for `rest`, `segment`, `share`, and `subdivision`.
- `head` (VERB) -- "To be in charge of; to lead or direct." A specific
  manner of `lead` (already Common, "To guide, direct, or cause a
  person or thing to go with oneself to a place, especially by going
  in front.").

`head` (NOUN) -> `part` gets its reciprocal HYPONYM edge materialised
(`part` -> HYPONYM -> `head`) -- the same "every HYPERNYM edge gets its
reciprocal HYPONYM, not left to be inferred at query time" discipline
`common_semantic_completion_seeding.py` already established
(`assets/common/en/relationships/README.md`'s Symmetric and inverse
edges section). `head` (VERB) -> `lead` is seeded as TROPONYM, not
HYPERNYM, with its reciprocal HYPERNYM edge materialised the reverse
direction (`lead` -TROPONYM-> `head`; `head` -HYPERNYM-> `lead`) --
HYPONYM is a noun-only kind (HYPERNYM/HYPONYM applies to nouns,
TROPONYM/HYPERNYM applies to verbs, `assets/common/en/relationships/
README.md`'s `asset_version 1.17.0` entry), so `lead`/`head` gets no
HYPONYM edge at all. Without this, `part` would show a HYPERNYM
sentence pointing at `head` but `head` itself would show no matching
HYPONYM entry in its own detail panel or Hierarchy tab -- the exact
kind of asymmetric edge this cache's own convention exists to prevent.

Neither `part` nor `lead` is a homograph, so no `source_part_of_speech`/
`target_part_of_speech` disambiguation is needed on those two endpoints
-- but `head` itself becomes one the moment both senses are promoted,
so every edge involving `head` names its part_of_speech explicitly
(the same `relationship_cache_homograph_fix.py` discipline), even
though `Dictionary.lookup()`'s first-seeded-wins default would happen
to resolve correctly here too (NOUN is promoted first) -- explicit
rather than relying on load order.

Run: python3 examples/head_word_seeding.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from definition_gap_vocabulary_seeding import (  # noqa: E402
    COMMON_SOURCE,
    RELATIONSHIPS_DIR,
    _build_word,
    _compute_checksum,
    _load_json,
    _save_json,
)

from lira.vocabulary.role.word_seeder import WordSeeder  # noqa: E402

HEAD_SENSES = (
    ("NOUN", "The upper part of the human body, or the front or uppermost part of "
              "an animal's body, containing the brain, eyes, ears, nose, and mouth."),
    ("VERB", "To be in charge of; to lead or direct."),
)

# (source_lexical_form, source_pos, target_lexical_form, target_pos) --
# always the (narrower, HYPERNYM, broader) direction this cache's own
# README documents; the reciprocal HYPONYM edge is derived below, not
# hand-written twice. Nouns only -- see TROPONYM_PAIRS below for verbs.
HYPERNYM_PAIRS = (
    ("head", "NOUN", "part", "NOUN"),
)

# (specific_lexical_form, specific_pos, general_lexical_form, general_pos)
# -- always the (specific, TROPONYM, general) direction (troponymy is
# verb-specific hyponymy); the reciprocal HYPERNYM edge, reverse
# direction, is derived below, not hand-written twice. No HYPONYM edge
# -- HYPONYM is noun-only.
TROPONYM_PAIRS = (
    ("head", "VERB", "lead", "VERB"),
)


def promote_head_word() -> dict:
    seeder = WordSeeder()
    promoted, already_present = [], []
    for pos, definition in HEAD_SENSES:
        word = _build_word("head", pos, definition, source=COMMON_SOURCE)
        added = seeder.promote_word(word, reference_count=seeder.promotion_threshold + 1)
        (promoted if added else already_present).append(pos)
    seeder.validate_assets()
    return {"promoted": promoted, "already_present": already_present}


def add_head_relationships() -> dict:
    sem_path = RELATIONSHIPS_DIR / "semantic_relationships.json"
    sem_doc = _load_json(sem_path)
    existing_keys = {
        (r["source_lexical_form"], r.get("source_part_of_speech"), r["relationship_kind"],
         r["target_lexical_form"], r.get("target_part_of_speech"))
        for r in sem_doc["relationships"]
    }

    added = 0
    all_edges = []
    for src_form, src_pos, tgt_form, tgt_pos in HYPERNYM_PAIRS:
        all_edges.append((src_form, src_pos, "HYPERNYM", tgt_form, tgt_pos))
        all_edges.append((tgt_form, tgt_pos, "HYPONYM", src_form, src_pos))
    for specific_form, specific_pos, general_form, general_pos in TROPONYM_PAIRS:
        all_edges.append((general_form, general_pos, "TROPONYM", specific_form, specific_pos))
        all_edges.append((specific_form, specific_pos, "HYPERNYM", general_form, general_pos))

    for source_form, source_pos, kind, target_form, target_pos in all_edges:
        key = (source_form, source_pos, kind, target_form, target_pos)
        if key in existing_keys:
            continue
        sem_doc["relationships"].append({
            "source_lexical_form": source_form,
            "source_part_of_speech": source_pos,
            "target_lexical_form": target_form,
            "target_part_of_speech": target_pos,
            "relationship_kind": kind,
        })
        existing_keys.add(key)
        added += 1

    sem_doc["count"] = len(sem_doc["relationships"])
    _save_json(sem_path, sem_doc)

    manifest_path = RELATIONSHIPS_DIR / "manifest.json"
    manifest = _load_json(manifest_path)
    for file_entry in manifest["files"]:
        if file_entry["file"] == "semantic_relationships.json":
            file_entry["count"] = sem_doc["count"]
    manifest["relationship_count"] = sum(fe["count"] for fe in manifest["files"])
    manifest["checksum"] = _compute_checksum()
    _save_json(manifest_path, manifest)

    return {"edges_added": added}


def run() -> dict:
    promotion_report = promote_head_word()
    relationship_report = add_head_relationships()
    WordSeeder().validate_assets()
    return {"promotion": promotion_report, "relationships": relationship_report}


if __name__ == "__main__":
    result = run()
    print("head senses promoted:", result["promotion"]["promoted"])
    print("head senses already present (idempotent re-run):", result["promotion"]["already_present"])
    print("Semantic edges added (HYPERNYM/HYPONYM for nouns, TROPONYM/HYPERNYM for verbs):",
          result["relationships"]["edges_added"])
