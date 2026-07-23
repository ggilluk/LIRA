"""Seeds a user-supplied audit of missing core Common vocabulary
(examples/common_core_vocabulary.py holds the classification and the
reasoning for each placement decision) -- words repeatedly needed by
the Common Vocabulary Cache's own existing definitions but not
themselves seeded.

Three actions, matching the three tiers in the data file:
1. Hand-add METALINGUISTIC_NOUNS/METALINGUISTIC_VERBS directly to
   metalinguistic_nouns.json/metalinguistic_verbs.json -- these are
   genuine grammar terminology (mood, voice, predicate) or a homograph
   of one (form, VERB), the same file `tense`/`aspect`/`person`/`subject`
   and `cause`/`result` already live in, not general vocabulary.
2. Promote PROMOTED_NOUNS/PROMOTED_VERBS via WordSeeder.promote_word,
   the same path the previous two batches used.
3. Wire NOMINALISATION, THIRD_PERSON_FORM, and SYNONYM relationships
   (each with its reciprocal/both-direction edge, the Common
   relationship cache's own convention) into the static relationship
   cache, checksum recomputed.

Reuses definition_gap_vocabulary_seeding.py's helpers rather than
duplicating them.

Run: python3 examples/common_core_vocabulary_seeding.py
"""

import json
import re
import sys
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common_core_vocabulary import (  # noqa: E402
    METALINGUISTIC_NOUNS,
    METALINGUISTIC_VERBS,
    NOMINALISATION_PAIRS,
    PROMOTED_NOUNS,
    PROMOTED_VERBS,
    SYNONYM_PAIRS,
    THIRD_PERSON_FORM_PAIRS,
)
from definition_gap_vocabulary_seeding import (  # noqa: E402
    COMMON_SOURCE,
    RELATIONSHIPS_DIR,
    _build_word,
    _compute_checksum,
    _load_json,
    _save_json,
)
from definition_gap_vocabulary_seeding import run as seed_definition_gap_vocabulary  # noqa: E402
from verb_nominalisation_seeding import run as seed_verb_nominalisation  # noqa: E402

from lira.value_objects import Code, Text  # noqa: E402
from lira.vocabulary.role.word_seeder import WordSeeder  # noqa: E402

ASSETS_DIR = Path(__file__).resolve().parents[1] / "src/lira/vocabulary/assets/common/en"
METALINGUISTIC_SOURCE_NAME = "LIRA English Metalinguistic Vocabulary v1"
_VOWEL_GROUPS = re.compile(r"[aeiouy]+")


def _syllable_count(lexical_form: str) -> int:
    return max(1, len(_VOWEL_GROUPS.findall(lexical_form.lower())))


# -- Step 1: hand-add metalinguistic entries (own file, own curation discipline) --

def _metalinguistic_entry(lexical_form: str, pos: str, definition: str) -> dict:
    return {
        "lexical_form": lexical_form,
        "normalised_form": lexical_form.lower(),
        "text": lexical_form,
        "version": "1.0",
        "language_code": "en",
        "script_code": "Latn",
        "part_of_speech": pos,
        "closed_class": False,
        "closed_class_kind": "metalinguistic_term",
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
            "source_name": METALINGUISTIC_SOURCE_NAME,
            "source_version": "1.0.0",
            "external_identifier": None,
            "reference_uri": None,
            "licence_identifier": None,
        }],
    }


def add_metalinguistic_entries() -> dict:
    added = {"nouns": [], "verbs": []}

    nouns_path = ASSETS_DIR / "metalinguistic_nouns.json"
    nouns_doc = _load_json(nouns_path)
    existing_nouns = {w["lexical_form"] for w in nouns_doc["words"]}
    for lexical_form, (pos, definition) in METALINGUISTIC_NOUNS.items():
        if lexical_form in existing_nouns:
            continue
        nouns_doc["words"].append(_metalinguistic_entry(lexical_form, pos, definition))
        added["nouns"].append(lexical_form)
    nouns_doc["count"] = len(nouns_doc["words"])
    _save_json(nouns_path, nouns_doc)

    verbs_path = ASSETS_DIR / "metalinguistic_verbs.json"
    verbs_doc = _load_json(verbs_path)
    existing_verbs = {(w["lexical_form"], w["part_of_speech"]) for w in verbs_doc["words"]}
    for lexical_form, (pos, definition) in METALINGUISTIC_VERBS.items():
        if (lexical_form, pos) in existing_verbs:
            continue
        verbs_doc["words"].append(_metalinguistic_entry(lexical_form, pos, definition))
        added["verbs"].append(lexical_form)
    verbs_doc["count"] = len(verbs_doc["words"])
    _save_json(verbs_path, verbs_doc)

    manifest_path = ASSETS_DIR / "manifest.json"
    manifest = _load_json(manifest_path)
    for file_entry in manifest["files"]:
        if file_entry["file"] == "metalinguistic_nouns.json":
            file_entry["count"] = nouns_doc["count"]
        elif file_entry["file"] == "metalinguistic_verbs.json":
            file_entry["count"] = verbs_doc["count"]
    _save_json(manifest_path, manifest)

    return added


# -- Step 2: promote general vocabulary --

def promote_words() -> dict:
    seeder = WordSeeder()
    promoted, already_present = [], []
    for lexical_form, definition in PROMOTED_NOUNS.items():
        word = _build_word(lexical_form, "NOUN", definition, source=COMMON_SOURCE)
        added = seeder.promote_word(word, reference_count=seeder.promotion_threshold + 1)
        (promoted if added else already_present).append(lexical_form)
    for lexical_form, definition in PROMOTED_VERBS.items():
        word = _build_word(lexical_form, "VERB", definition, source=COMMON_SOURCE)
        added = seeder.promote_word(word, reference_count=seeder.promotion_threshold + 1)
        (promoted if added else already_present).append(lexical_form)
    seeder.validate_assets()
    return {"promoted": promoted, "already_present": already_present}


# -- Step 3: relationships (static Common cache) --

def add_relationships() -> dict:
    morph_path = RELATIONSHIPS_DIR / "morphological_relationships.json"
    morph_doc = _load_json(morph_path)
    existing_morph = {(r["source_lexical_form"], r["relationship_kind"], r["target_lexical_form"]) for r in morph_doc["relationships"]}

    added_morph = 0
    for verb, noun in NOMINALISATION_PAIRS:
        for source_form, kind, target_form in ((verb, "NOMINALISATION", noun), (noun, "LEMMA_FORM", verb)):
            key = (source_form, kind, target_form)
            if key in existing_morph:
                continue
            morph_doc["relationships"].append({"source_lexical_form": source_form, "target_lexical_form": target_form, "relationship_kind": kind})
            existing_morph.add(key)
            added_morph += 1
    for lemma, inflected in THIRD_PERSON_FORM_PAIRS:
        for source_form, kind, target_form in ((lemma, "THIRD_PERSON_FORM", inflected), (inflected, "LEMMA_FORM", lemma)):
            key = (source_form, kind, target_form)
            if key in existing_morph:
                continue
            morph_doc["relationships"].append({"source_lexical_form": source_form, "target_lexical_form": target_form, "relationship_kind": kind})
            existing_morph.add(key)
            added_morph += 1
    morph_doc["count"] = len(morph_doc["relationships"])
    _save_json(morph_path, morph_doc)

    sem_path = RELATIONSHIPS_DIR / "semantic_relationships.json"
    sem_doc = _load_json(sem_path)
    existing_sem = {(r["source_lexical_form"], r["relationship_kind"], r["target_lexical_form"]) for r in sem_doc["relationships"]}
    added_sem = 0
    for a, b in SYNONYM_PAIRS:
        for source_form, target_form in ((a, b), (b, a)):
            key = (source_form, "SYNONYM", target_form)
            if key in existing_sem:
                continue
            sem_doc["relationships"].append({"source_lexical_form": source_form, "target_lexical_form": target_form, "relationship_kind": "SYNONYM"})
            existing_sem.add(key)
            added_sem += 1
    sem_doc["count"] = len(sem_doc["relationships"])
    _save_json(sem_path, sem_doc)

    manifest_path = RELATIONSHIPS_DIR / "manifest.json"
    manifest = _load_json(manifest_path)
    for file_entry in manifest["files"]:
        if file_entry["file"] == "morphological_relationships.json":
            file_entry["count"] = morph_doc["count"]
        elif file_entry["file"] == "semantic_relationships.json":
            file_entry["count"] = sem_doc["count"]
    manifest["relationship_count"] = sum(fe["count"] for fe in manifest["files"])
    manifest["checksum"] = _compute_checksum()
    _save_json(manifest_path, manifest)

    return {"morphological_edges_added": added_morph, "semantic_edges_added": added_sem}


def run() -> dict:
    metalinguistic_report = add_metalinguistic_entries()
    promotion_report = promote_words()
    relationship_report = add_relationships()

    nominalisation_result = seed_verb_nominalisation()
    physics_domain = nominalisation_result["physics_domain"]

    return {
        "metalinguistic": metalinguistic_report,
        "promotion": promotion_report,
        "relationships": relationship_report,
        "physics_domain": physics_domain,
        "sentence_unresolved_words": nominalisation_result["sentence_unresolved_words"],
    }


if __name__ == "__main__":
    from lira.vocabulary import DictionaryView

    result = run()
    print("Metalinguistic entries added:", result["metalinguistic"])
    print("Words promoted:", result["promotion"]["promoted"])
    print("Words already present:", result["promotion"]["already_present"])
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
