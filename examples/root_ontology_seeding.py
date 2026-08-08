"""Seeds the root ontology (examples/root_ontology.py holds the table
and the reasoning) into the Common Vocabulary Cache: three genuinely
new metalinguistic words (being NOUN, contribution NOUN, interact
VERB), their standard morphological forms, four new NOMINALISATION
"Verb Basis" links (cause -> causation already existed), and removes
two pre-existing relationships that would otherwise have disqualified
a would-be root from actually being unparented (member/group,
operation/process -- see root_ontology.py's own module docstring for
why).

Four actions:
1. Hand-add NEW_METALINGUISTIC_NOUNS/NEW_METALINGUISTIC_VERBS directly
   to metalinguistic_nouns.json/metalinguistic_verbs.json, reusing
   common_core_vocabulary_seeding.py's own `_metalinguistic_entry`
   helper -- entity/place/time/cause's own precedent, not
   WordSeeder.promote_word (root_ontology.py's own docstring explains
   why).
2. Add NEW_MORPHOLOGICAL_FORMS (+ reciprocal LEMMA_FORM) and
   NOMINALISATION_PAIRS (+ reciprocal LEMMA_FORM) to the static Common
   relationship cache.
3. Remove DISQUALIFYING_EDGES_TO_REMOVE from the same cache.
4. Verify: seed a real TensorLiraGraph from the result (DictionarySeeder)
   and confirm every one of the twelve root Concepts genuinely lands at
   D1_D2_ROOT with no parent on the axis its own table row claims --
   not just that the words/relationships exist on disk.

Run: python3 examples/root_ontology_seeding.py
"""

import json
import re
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common_core_vocabulary_seeding import _metalinguistic_entry  # noqa: E402
from definition_gap_vocabulary_seeding import (  # noqa: E402
    COMMON_SOURCE,
    RELATIONSHIPS_DIR,
    _build_word,
    _compute_checksum,
    _load_json,
    _save_json,
)
from physics_domain_seeding import run as run_physics_domain  # noqa: E402
from root_ontology import (  # noqa: E402
    ALL_ROOT_FORMS,
    ALL_VERB_BASIS_FORMS,
    DISQUALIFYING_EDGES_TO_REMOVE,
    NEW_INFLECTED_FORMS,
    NEW_METALINGUISTIC_NOUNS,
    NEW_METALINGUISTIC_VERBS,
    NEW_MORPHOLOGICAL_FORMS,
    NOMINALISATION_PAIRS,
    ROOT_ONTOLOGY,
)

from lira.knowledge.data.tensor_graph import ConceptKind, TensorLiraGraph  # noqa: E402
from lira.knowledge.role.dictionary_seeder import DictionarySeeder  # noqa: E402
from lira.vocabulary.data.part_of_speech import PartOfSpeech as POS  # noqa: E402
from lira.vocabulary.role.word_seeder import WordSeeder  # noqa: E402

ASSETS_DIR = Path(__file__).resolve().parents[1] / "src/lira/vocabulary/assets/common/en"


# -- Step 1: hand-add the three genuinely new metalinguistic words --

def _entry_with_id(lexical_form: str, pos: str, definition: str) -> dict:
    # _metalinguistic_entry itself never sets entry_id (a latent gap in
    # that helper -- every existing entry it produced historically only
    # has one because of a separate, later backfill; nothing generates
    # it going forward), so it's added here explicitly. entry_id is
    # WordSeeder's own required, persistent Qualified Word Identity
    # field (validate_assets() rejects a missing one), not optional.
    entry = _metalinguistic_entry(lexical_form, pos, definition)
    entry["entry_id"] = str(uuid.uuid4())
    return entry


def add_metalinguistic_entries() -> dict:
    added = {"nouns": [], "verbs": []}

    nouns_path = ASSETS_DIR / "metalinguistic_nouns.json"
    nouns_doc = _load_json(nouns_path)
    existing_nouns = {(w["lexical_form"], w["part_of_speech"]) for w in nouns_doc["words"]}
    for lexical_form, (pos, definition) in NEW_METALINGUISTIC_NOUNS.items():
        if (lexical_form, pos) in existing_nouns:
            continue
        nouns_doc["words"].append(_entry_with_id(lexical_form, pos, definition))
        added["nouns"].append(lexical_form)
    nouns_doc["count"] = len(nouns_doc["words"])
    _save_json(nouns_path, nouns_doc)

    verbs_path = ASSETS_DIR / "metalinguistic_verbs.json"
    verbs_doc = _load_json(verbs_path)
    existing_verbs = {(w["lexical_form"], w["part_of_speech"]) for w in verbs_doc["words"]}
    for lexical_form, (pos, definition) in NEW_METALINGUISTIC_VERBS.items():
        if (lexical_form, pos) in existing_verbs:
            continue
        verbs_doc["words"].append(_entry_with_id(lexical_form, pos, definition))
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
    # total_lexical_forms intentionally untouched -- WordSeeder.validate_assets()
    # computes it only from MANDATORY_FILES; SUPPLEMENTARY_FILES (this
    # file included) are validated/counted but excluded from that total
    # (common_core_vocabulary_seeding.py's own add_metalinguistic_entries
    # does the same).
    _save_json(manifest_path, manifest)

    return added


# -- Step 1b: promote the inflected forms NEW_MORPHOLOGICAL_FORMS references --
# (their lemmas were hand-added above; an inflected form itself is
# ordinary demand-driven vocabulary, the same tier causing/caused/causes
# and operates/operated/operating already live in -- WordSeeder.promote_word,
# not the metalinguistic path.)

def promote_inflected_forms() -> dict:
    seeder = WordSeeder()
    promoted, already_present = [], []
    for lexical_form, (pos, definition) in NEW_INFLECTED_FORMS.items():
        word = _build_word(lexical_form, pos, definition, source=COMMON_SOURCE)
        added = seeder.promote_word(word, reference_count=seeder.promotion_threshold + 1)
        (promoted if added else already_present).append(lexical_form)
    seeder.validate_assets()
    return {"promoted": promoted, "already_present": already_present}


# -- Step 2 + 3: relationship cache (add morphology/nominalisation, remove disqualifying edges) --

def update_relationships() -> dict:
    morph_path = RELATIONSHIPS_DIR / "morphological_relationships.json"
    morph_doc = _load_json(morph_path)
    existing_morph = {(r["source_lexical_form"], r["relationship_kind"], r["target_lexical_form"]) for r in morph_doc["relationships"]}

    added_morph = 0
    for lemma, kind, inflected in NEW_MORPHOLOGICAL_FORMS:
        for source_form, rel_kind, target_form in ((lemma, kind, inflected), (inflected, "LEMMA_FORM", lemma)):
            key = (source_form, rel_kind, target_form)
            if key in existing_morph:
                continue
            morph_doc["relationships"].append({"source_lexical_form": source_form, "target_lexical_form": target_form, "relationship_kind": rel_kind})
            existing_morph.add(key)
            added_morph += 1

    added_nominalisation = 0
    for verb, noun in NOMINALISATION_PAIRS:
        for source_form, kind, target_form in ((verb, "NOMINALISATION", noun), (noun, "LEMMA_FORM", verb)):
            key = (source_form, kind, target_form)
            if key in existing_morph:
                continue
            morph_doc["relationships"].append({"source_lexical_form": source_form, "target_lexical_form": target_form, "relationship_kind": kind})
            existing_morph.add(key)
            added_nominalisation += 1

    morph_doc["count"] = len(morph_doc["relationships"])
    _save_json(morph_path, morph_doc)

    sem_path = RELATIONSHIPS_DIR / "semantic_relationships.json"
    sem_doc = _load_json(sem_path)
    before = len(sem_doc["relationships"])
    to_remove = {(s, k, t) for s, s_pos, k, t, t_pos in DISQUALIFYING_EDGES_TO_REMOVE}
    sem_doc["relationships"] = [
        r for r in sem_doc["relationships"]
        if (r["source_lexical_form"], r["relationship_kind"], r["target_lexical_form"]) not in to_remove
    ]
    removed = before - len(sem_doc["relationships"])
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

    return {
        "morphological_edges_added": added_morph,
        "nominalisation_edges_added": added_nominalisation,
        "disqualifying_edges_removed": removed,
    }


# -- Step 4: verify against a real seeded graph --

def verify(physics_domain) -> dict:
    dictionary = physics_domain.vocabulary.dictionary
    relationships = physics_domain.vocabulary.lexical_relationships
    graph = TensorLiraGraph()
    seeder = DictionarySeeder(graph)
    seeder.seed_dictionary(dictionary, relationships)

    def concept_for(text: str, pos: POS):
        word = next((w for w in dictionary.lookup_all(text) if w.part_of_speech == pos), None)
        if word is None:
            return None
        return seeder._concept_for_word_uuid.get(word.uuid.value)

    hypernym_roots = {row[1] for row in ROOT_ONTOLOGY}
    meronym_roots = {row[3] for row in ROOT_ONTOLOGY}
    problems = []
    checked = []

    for question, hyper_root, hyper_verb, mero_root, mero_verb, _distinction in ROOT_ONTOLOGY:
        hyper_concept = concept_for(hyper_root.lower(), POS.NOUN)
        if hyper_concept is None:
            problems.append(f"{hyper_root} (Hypernym root for {question}): not seeded as a Noun Concept")
        elif hyper_concept.d1_z != 1.0:
            problems.append(f"{hyper_root} (Hypernym root for {question}): d1_z={hyper_concept.d1_z}, not D1_D2_ROOT -- has a parent")
        else:
            checked.append(f"{hyper_root} (D1 root, {question})")

        mero_concept = concept_for(mero_root.lower(), POS.NOUN)
        if mero_concept is None:
            problems.append(f"{mero_root} (Meronym root for {question}): not seeded as a Noun Concept")
        elif mero_concept.d2_z != 1.0:
            problems.append(f"{mero_root} (Meronym root for {question}): d2_z={mero_concept.d2_z}, not D1_D2_ROOT -- has a whole")
        else:
            checked.append(f"{mero_root} (D2 root, {question})")

        if hyper_verb:
            verb_concept = concept_for(hyper_verb, POS.VERB)
            if verb_concept is None:
                problems.append(f"{hyper_verb} (Verb Basis for {hyper_root}): not seeded as a Relationship Concept")
        if mero_verb:
            verb_concept = concept_for(mero_verb, POS.VERB)
            if verb_concept is None:
                problems.append(f"{mero_verb} (Verb Basis for {mero_root}): not seeded as a Relationship Concept")

    return {"checked": checked, "problems": problems}


def run() -> dict:
    metalinguistic_report = add_metalinguistic_entries()
    inflected_report = promote_inflected_forms()
    relationships_report = update_relationships()
    _, physics_domain = run_physics_domain()
    verification = verify(physics_domain)
    return {
        "metalinguistic": metalinguistic_report,
        "inflected_forms": inflected_report,
        "relationships": relationships_report,
        "verification": verification,
        "physics_domain": physics_domain,
    }


if __name__ == "__main__":
    result = run()
    print("Metalinguistic entries added:", result["metalinguistic"])
    print("Inflected forms promoted:", result["inflected_forms"])
    print("Relationship changes:", result["relationships"])
    print()
    print("-- Verification against a real seeded graph --")
    for line in result["verification"]["checked"]:
        print(f"  OK: {line}")
    if result["verification"]["problems"]:
        print("  PROBLEMS:")
        for line in result["verification"]["problems"]:
            print(f"    {line}")
    else:
        print("  All twelve roots and five Verb Basis anchors verified.")
    assert not result["verification"]["problems"], "root ontology verification failed -- see PROBLEMS above"
