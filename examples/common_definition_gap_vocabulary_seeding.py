"""Seeds the 1163-word Common definition-gap batch (examples/
common_definition_gap_vocabulary.py holds the classification, the
morphological links, and the full reasoning) -- every word a Common
Vocabulary Cache word's own definition depended on but that wasn't
itself seeded, plus the base lemmas and homograph senses discovered
while wiring those words' relationships back to the rest of the cache.

Three actions:
1. Hand-add concerning/including (PREPOSITION) and themself (PRONOUN)
   directly to prepositions.json/pronouns.json -- WORD_ENTRIES itself
   only holds the other 1158, open-class words; these three are
   genuine closed-class words promote_word categorically refuses
   (WordSeeder.OPEN_CLASSES), discovered by running this script and
   watching it reject them rather than guessed in advance -- see
   common_definition_gap_vocabulary.py's own module docstring for the
   two (non, semi) that got excluded outright instead.
2. Promote every WORD_ENTRIES tuple via WordSeeder.promote_word, the
   same path every previous promotion batch in this directory used.
3. Wire every MORPHOLOGICAL_LINKS pair (plus its reciprocal LEMMA_FORM
   edge, the Common relationship cache's own convention) into the
   static relationship cache, always with an explicit
   source_part_of_speech/target_part_of_speech on both edges --
   several bases here (cause, form, name, point, state) are pre-
   existing Common homographs, and the disambiguator is what keeps a
   plain Dictionary.lookup() from silently attaching to the wrong
   sense (relationships/README.md, asset_version 1.8.0). Every edge
   this batch adds ends up replayed against every Domain
   RelationshipSeeder ever seeds, Physics included, the same as any
   other Common relationship cache entry -- nothing here is
   Physics-specific.

Reuses definition_gap_vocabulary_seeding.py's JSON/checksum helpers
rather than duplicating them.

Run: python3 examples/common_definition_gap_vocabulary_seeding.py
"""

import re
import sys
import uuid
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common_definition_gap_vocabulary import (  # noqa: E402
    MORPHOLOGICAL_LINKS,
    WORD_ENTRIES,
)
from common_core_vocabulary_seeding import run as seed_common_core_vocabulary  # noqa: E402
from definition_gap_vocabulary_seeding import (  # noqa: E402
    RELATIONSHIPS_DIR,
    _build_word,
    _compute_checksum,
    _load_json,
    _save_json,
)

from lira.value_objects import Text  # noqa: E402
from lira.vocabulary.data.source_reference import SourceReference  # noqa: E402
from lira.vocabulary.role.word_seeder import MANDATORY_FILES, WordSeeder  # noqa: E402

COMMON_SOURCE = SourceReference(
    source_name=Text(value="LIRA English Common Definition-Gap Vocabulary v1"),
    source_version=Text(value="1.0.0"),
)

ASSETS_DIR = Path(__file__).resolve().parents[1] / "src/lira/vocabulary/assets/common/en"
MANDATORY_SOURCE_NAME = "LIRA English Common Definition-Gap Vocabulary v1"

# (lexical_form, part_of_speech, target_file, closed_class_kind, definition)
MANDATORY_ENTRIES = (
    ("concerning", "PREPOSITION", "prepositions.json", "preposition", "About; on the subject of."),
    ("including", "PREPOSITION", "prepositions.json", "preposition",
     "Present participle of include, used prepositionally; containing as a part of the whole, used to "
     "introduce an example or additional item forming part of a larger group."),
    ("themself", "PRONOUN", "pronouns.json", "pronoun",
     "A gender-neutral reflexive pronoun referring back to a single person previously mentioned."),
)

_VOWEL_GROUPS = re.compile(r"[aeiouy]+")


def _syllable_count(lexical_form: str) -> int:
    return max(1, len(_VOWEL_GROUPS.findall(lexical_form.lower())))


# -- Step 1: hand-add the three genuinely closed-class words --

def add_mandatory_entries() -> dict:
    added = []
    docs_by_file = {}
    for lexical_form, pos, filename, closed_class_kind, definition in MANDATORY_ENTRIES:
        doc = docs_by_file.setdefault(filename, _load_json(ASSETS_DIR / filename))
        already_present = any(w["lexical_form"] == lexical_form and w["part_of_speech"] == pos for w in doc["words"])
        if already_present:
            continue
        doc["words"].append({
            "entry_id": str(uuid.uuid4()),
            "lexical_form": lexical_form,
            "normalised_form": lexical_form.lower(),
            "text": lexical_form,
            "version": "1.0",
            "language_code": "en",
            "script_code": "Latn",
            "part_of_speech": pos,
            "closed_class": True,
            "closed_class_kind": closed_class_kind,
            "definition": definition,
            "gloss": definition,
            "usage_notes": [],
            "register_codes": ["NEUTRAL"],
            "editorial_labels": [],
            "dialect_codes": [],
            "pronunciations": [],
            "syllable_representation": None,
            "syllable_count": _syllable_count(lexical_form),
            "stress_pattern": None,
            "frequency_value": None,
            "frequency_scale": None,
            "etymology_text": None,
            "first_recorded_use": None,
            "source_references": [{
                "source_name": MANDATORY_SOURCE_NAME,
                "source_version": "1.0.0",
                "external_identifier": None,
                "reference_uri": None,
                "licence_identifier": None,
            }],
        })
        added.append((lexical_form, pos))

    for filename, doc in docs_by_file.items():
        doc["count"] = len(doc["words"])
        _save_json(ASSETS_DIR / filename, doc)

    # Recomputed unconditionally, not just when `added` is non-empty --
    # idempotent by construction (matches each file's actual current
    # count either way), and self-heals the manifest if an earlier,
    # partial run already touched the word files without leaving
    # total_lexical_forms consistent.
    manifest_path = ASSETS_DIR / "manifest.json"
    manifest = _load_json(manifest_path)
    for file_entry in manifest["files"]:
        if file_entry["file"] in docs_by_file:
            file_entry["count"] = docs_by_file[file_entry["file"]]["count"]
    # total_lexical_forms is the *mandatory* total only -- the same
    # WordSeeder.MANDATORY_FILES set validate_assets() itself sums,
    # excluding SUPPLEMENTARY_FILES (metalinguistic_*.json, open-class
    # but not counted toward this total) and promoted_words.json.
    manifest["total_lexical_forms"] = sum(
        fe["count"] for fe in manifest["files"] if fe["file"] in MANDATORY_FILES
    )
    _save_json(manifest_path, manifest)

    return {"added": added}


# -- Step 2: promote every word into the Common Vocabulary Cache --

def promote_words() -> dict:
    seeder = WordSeeder()
    promoted, already_present = [], []
    for lexical_form, pos, domain, definition in WORD_ENTRIES:
        assert domain == "common", f"{lexical_form}: unexpected domain {domain!r}, this batch is common-only"
        word = _build_word(lexical_form, pos, definition, source=COMMON_SOURCE)
        added = seeder.promote_word(word, reference_count=seeder.promotion_threshold + 1)
        (promoted if added else already_present).append((lexical_form, pos))

    word_manifest_path = ASSETS_DIR / "manifest.json"
    word_manifest = _load_json(word_manifest_path)
    word_manifest["asset_version"] = "1.15.0"
    # promoted_words.json's own row in the manifest's files list --
    # unlike total_lexical_forms (mandatory-only, validated), this row
    # was never mechanically kept in sync by any previous promote_word-
    # based seeding script (WordSeeder.promote_word only updates
    # promoted_words.json itself); corrected here since it's directly
    # adjacent to the asset_version bump this step already makes.
    promoted_path = ASSETS_DIR / "promoted_words.json"
    promoted_count = _load_json(promoted_path)["count"]
    for file_entry in word_manifest["files"]:
        if file_entry["file"] == "promoted_words.json":
            file_entry["count"] = promoted_count
    _save_json(word_manifest_path, word_manifest)

    seeder.validate_assets()
    return {"promoted": promoted, "already_present": already_present}


# -- Step 3: wire relationships into the static Common relationship cache --

def add_relationships() -> dict:
    morph_path = RELATIONSHIPS_DIR / "morphological_relationships.json"
    morph_doc = _load_json(morph_path)
    existing = {
        (r["source_lexical_form"], r.get("source_part_of_speech"), r["relationship_kind"],
         r["target_lexical_form"], r.get("target_part_of_speech"))
        for r in morph_doc["relationships"]
    }

    word_pos_by_form = {}
    for lexical_form, pos, domain, definition in WORD_ENTRIES:
        word_pos_by_form.setdefault(lexical_form, set()).add(pos)
    # "including" (MORPHOLOGICAL_LINKS' one link into MANDATORY_ENTRIES,
    # include VERB PRESENT_PARTICIPLE_FORM including) needs its POS here
    # too, even though it's hand-added via add_mandatory_entries(), not
    # WORD_ENTRIES -- the relationship itself is still real regardless of
    # which file the word ended up seeded from.
    for lexical_form, pos, filename, closed_class_kind, definition in MANDATORY_ENTRIES:
        word_pos_by_form.setdefault(lexical_form, set()).add(pos)

    def derived_pos(lexical_form: str) -> str:
        # Each derived word appears exactly once in WORD_ENTRIES under
        # one specific POS (validated when common_definition_gap_vocabulary.py
        # was authored) -- pick it directly rather than guessing.
        poses = word_pos_by_form.get(lexical_form)
        assert poses and len(poses) == 1, f"{lexical_form}: expected exactly one POS in this batch, found {poses}"
        return next(iter(poses))

    added = 0
    for base, base_pos, kind, derived in MORPHOLOGICAL_LINKS:
        target_pos = derived_pos(derived)
        for source_form, source_pos, rel_kind, target_form, target_form_pos in (
            (base, base_pos, kind, derived, target_pos),
            (derived, target_pos, "LEMMA_FORM", base, base_pos),
        ):
            key = (source_form, source_pos, rel_kind, target_form, target_form_pos)
            if key in existing:
                continue
            morph_doc["relationships"].append({
                "source_lexical_form": source_form,
                "source_part_of_speech": source_pos,
                "target_lexical_form": target_form,
                "target_part_of_speech": target_form_pos,
                "relationship_kind": rel_kind,
            })
            existing.add(key)
            added += 1
    morph_doc["count"] = len(morph_doc["relationships"])
    _save_json(morph_path, morph_doc)

    manifest_path = RELATIONSHIPS_DIR / "manifest.json"
    manifest = _load_json(manifest_path)
    for file_entry in manifest["files"]:
        if file_entry["file"] == "morphological_relationships.json":
            file_entry["count"] = morph_doc["count"]
    manifest["relationship_count"] = sum(fe["count"] for fe in manifest["files"])
    manifest["asset_version"] = "1.9.0"
    manifest["checksum"] = _compute_checksum()
    _save_json(manifest_path, manifest)

    return {"morphological_edges_added": added}


def run() -> dict:
    # Mandatory entries and relationships must land on disk before any
    # Domain gets created below -- RelationshipSeeder resolves every
    # relationship cache entry against an already-seeded Word the
    # moment a Domain is built (seed_common_core_vocabulary's own
    # chain creates the Physics Domain), so "including" has to already
    # be a real Word by then, not added afterwards.
    mandatory_report = add_mandatory_entries()
    promotion_report = promote_words()
    relationship_report = add_relationships()

    core_result = seed_common_core_vocabulary()

    return {
        "core_result": core_result,
        "mandatory": mandatory_report,
        "promotion": promotion_report,
        "relationships": relationship_report,
        "physics_domain": core_result["physics_domain"],
        "sentence_unresolved_words": core_result["sentence_unresolved_words"],
    }


if __name__ == "__main__":
    from lira.vocabulary import DictionaryView

    result = run()
    print("Mandatory entries added:", result["mandatory"]["added"])
    print("Words promoted:", len(result["promotion"]["promoted"]))
    print("Words already present:", len(result["promotion"]["already_present"]), result["promotion"]["already_present"])
    print("Relationship edges added:", result["relationships"])

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
