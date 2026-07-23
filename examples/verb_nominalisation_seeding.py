"""Seeds the NOMINALISATION relationship (examples/verb_nominalisation_vocabulary.py
holds the classification) for every base-form verb already seeded, in
both the Common Vocabulary Cache and the Physics Domain -- see that
file's module docstring for the linguistic reasoning (which verbs
qualify, which don't, and why).

Reuses definition_gap_vocabulary_seeding.py's own infrastructure
(_build_word, COMMON_SOURCE, the relationship-file helpers, the
fixture-patched hydration path) rather than duplicating it -- this is
the same two-tier pattern (Common promotion + static relationship
cache vs. Physics-scoped hydration + script-created relationships)
applied to a new relationship kind instead of a new batch of missing
words.

Run: python3 examples/verb_nominalisation_seeding.py
"""

import sys
import urllib.error
import urllib.parse
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
from definition_gap_vocabulary_seeding import (  # noqa: E402
    COMMON_SOURCE,
    RELATIONSHIPS_DIR,
    RELATIONSHIP_SOURCE,
    _build_word,
    _compute_checksum,
    _FakeResponse,
    _load_json,
    _save_json,
)
from definition_gap_vocabulary_seeding import run as seed_definition_gap_vocabulary  # noqa: E402
from physics_domain_seeding_fixtures import PHYSICS_FIXTURES  # noqa: E402
from verb_nominalisation_vocabulary import (  # noqa: E402
    COMMON_NOMINALISATION_PAIRS,
    COMMON_NOMINALISATION_WORD_ONLY,
    PHYSICS_NOMINALISATION_PAIRS,
)

from lira.vocabulary import LexicalRelationshipType, PartOfSpeech  # noqa: E402
from lira.vocabulary.data.word_lookup_context import WordLookupContext  # noqa: E402
from lira.vocabulary.role.word_seeder import WordSeeder  # noqa: E402


# -- Step 1: promote any missing Common-side nouns --

def promote_common_nouns() -> dict:
    seeder = WordSeeder()
    promoted, already_present = [], []
    for noun, definition in COMMON_NOMINALISATION_WORD_ONLY:
        word = _build_word(noun, "NOUN", definition, source=COMMON_SOURCE)
        added = seeder.promote_word(word, reference_count=seeder.promotion_threshold + 1)
        (promoted if added else already_present).append(noun)
    for verb, noun, definition in COMMON_NOMINALISATION_PAIRS:
        if definition is None:
            already_present.append(noun)
            continue
        word = _build_word(noun, "NOUN", definition, source=COMMON_SOURCE)
        added = seeder.promote_word(word, reference_count=seeder.promotion_threshold + 1)
        (promoted if added else already_present).append(noun)
    seeder.validate_assets()
    return {"promoted": promoted, "already_present": already_present}


# -- Step 2: add the NOMINALISATION + reciprocal LEMMA_FORM edges to the static Common cache --

def add_common_relationships() -> dict:
    morph_path = RELATIONSHIPS_DIR / "morphological_relationships.json"
    morph_doc = _load_json(morph_path)
    existing = {(r["source_lexical_form"], r["relationship_kind"], r["target_lexical_form"]) for r in morph_doc["relationships"]}

    added = 0
    for verb, noun, _definition in COMMON_NOMINALISATION_PAIRS:
        for source_form, kind, target_form in ((verb, "NOMINALISATION", noun), (noun, "LEMMA_FORM", verb)):
            key = (source_form, kind, target_form)
            if key in existing:
                continue
            morph_doc["relationships"].append({"source_lexical_form": source_form, "target_lexical_form": target_form, "relationship_kind": kind})
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
    manifest["checksum"] = _compute_checksum()
    _save_json(manifest_path, manifest)

    return {"morphological_edges_added": added}


# -- Step 3: hydrate any missing Physics-side nouns, via the same fixture-patched pipeline --

def _payload_for(lexical_form: str, definition: str) -> list:
    return [{"word": lexical_form, "meanings": [{"partOfSpeech": "noun", "definitions": [{"definition": definition}]}]}]


PHYSICS_NOMINALISATION_FIXTURES = {
    noun: _payload_for(noun, definition)
    for verb, noun, definition in PHYSICS_NOMINALISATION_PAIRS
    if definition is not None
}


def _fixture_urlopen(request, timeout=None):
    url = request.full_url if hasattr(request, "full_url") else str(request)
    word = urllib.parse.unquote(url.rsplit("/", 1)[-1])
    payload = PHYSICS_NOMINALISATION_FIXTURES.get(word) or PHYSICS_FIXTURES.get(word)
    if payload is None:
        raise urllib.error.HTTPError(url, 404, "Not Found", hdrs=None, fp=None)
    return _FakeResponse(payload)


def hydrate_physics_nouns(physics_domain) -> dict:
    dictionary = physics_domain.vocabulary.dictionary
    hydrator = physics_domain.vocabulary.hydrator
    targets = sorted(noun for _verb, noun, definition in PHYSICS_NOMINALISATION_PAIRS if definition is not None)

    with mock.patch("urllib.request.urlopen", side_effect=_fixture_urlopen):
        for noun in targets:
            context = WordLookupContext(raw_text=noun, normalised_text=noun, domain_name=physics_domain.name)
            hydrator.queue_hydration(context)
        hydrator.work_queue.join()

    resolved = [n for n in targets if dictionary.lookup(n) is not None]
    unresolved = [n for n in targets if dictionary.lookup(n) is None]
    return {"targets": targets, "resolved": resolved, "unresolved": unresolved}


# -- Step 4: Physics-side NOMINALISATION + reciprocal LEMMA_FORM edges (script-scoped) --

def add_physics_relationships(physics_domain) -> dict:
    dictionary = physics_domain.vocabulary.dictionary
    store = physics_domain.vocabulary.lexical_relationships
    processor = physics_domain.vocabulary.lexical_relationship_processor

    def resolve(text: str, pos: PartOfSpeech):
        candidates = [w for w in dictionary.lookup_all(text) if w.part_of_speech == pos]
        if not candidates:
            return None
        return next((w for w in candidates if not w.is_common), candidates[0])

    def edge_exists(source_id, target_id, kind) -> bool:
        return any(r.target_word_id.value == target_id and r.relationship_type == kind for r in store.outgoing(source_id))

    def make_edge(a, kind, b) -> bool:
        if edge_exists(a.uuid.value, b.uuid.value, kind):
            return False
        processor.create(
            source_word_id=a.uuid.value, target_word_id=b.uuid.value,
            relationship_type=kind, source_references=(RELATIONSHIP_SOURCE,),
            confidence=0.9999, provenance=0.9999, temporal=0.9999, activation=0.9999,
        )
        return True

    created, skipped = 0, []
    for verb, noun, _definition in PHYSICS_NOMINALISATION_PAIRS:
        verb_word = resolve(verb, PartOfSpeech.VERB)
        noun_word = resolve(noun, PartOfSpeech.NOUN)
        if verb_word is None or noun_word is None:
            skipped.append(f"{verb} -> {noun}")
            continue
        if make_edge(verb_word, LexicalRelationshipType.NOMINALISATION, noun_word):
            created += 1
        if make_edge(noun_word, LexicalRelationshipType.LEMMA_FORM, verb_word):
            created += 1

    return {"attempted_pairs": len(PHYSICS_NOMINALISATION_PAIRS), "edges_created": created, "skipped": skipped}


# -- Step 5: Common-side NOMINALISATION + reciprocal LEMMA_FORM verification against a live Dictionary --

def verify_common_relationships(dictionary, store) -> dict:
    """Common relationships are seeded from the static cache at Domain
    creation (RelationshipSeeder), not created directly here the way
    the Physics ones are -- this just confirms every pair actually
    resolved and linked in a freshly seeded Dictionary, the same
    verification role physics_domain_seeding.py's own repeat-processing
    check plays."""
    missing = []
    for verb, noun, _definition in COMMON_NOMINALISATION_PAIRS:
        verb_word = next((w for w in dictionary.lookup_all(verb) if w.part_of_speech == PartOfSpeech.VERB), None)
        noun_word = next((w for w in dictionary.lookup_all(noun) if w.part_of_speech == PartOfSpeech.NOUN), None)
        if verb_word is None or noun_word is None:
            missing.append(f"{verb} -> {noun} (word not found)")
            continue
        has_edge = any(
            r.target_word_id.value == noun_word.uuid.value and r.relationship_type == LexicalRelationshipType.NOMINALISATION
            for r in store.outgoing(verb_word.uuid.value)
        )
        if not has_edge:
            missing.append(f"{verb} -> {noun} (edge not found)")
    return {"pairs_checked": len(COMMON_NOMINALISATION_PAIRS), "missing": missing}


def run() -> dict:
    promotion_report = promote_common_nouns()
    common_relationship_report = add_common_relationships()

    gap_result = seed_definition_gap_vocabulary()
    physics_domain = gap_result["physics_domain"]

    hydration_report = hydrate_physics_nouns(physics_domain)
    physics_relationship_report = add_physics_relationships(physics_domain)
    verification_report = verify_common_relationships(physics_domain.vocabulary.dictionary, physics_domain.vocabulary.lexical_relationships)

    return {
        "promotion": promotion_report,
        "common_relationships": common_relationship_report,
        "hydration": hydration_report,
        "physics_relationships": physics_relationship_report,
        "verification": verification_report,
        "physics_domain": physics_domain,
        "sentence_unresolved_words": gap_result["sentence_unresolved_words"],
    }


if __name__ == "__main__":
    result = run()
    print("Common nouns promoted:", result["promotion"]["promoted"])
    print("Common nouns already present:", result["promotion"]["already_present"])
    print("Common relationship edges added:", result["common_relationships"])
    print("Physics nouns targeted:", result["hydration"]["targets"])
    print("Physics nouns resolved:", result["hydration"]["resolved"])
    print("Physics nouns UNRESOLVED (unexpected if non-empty):", result["hydration"]["unresolved"])
    print("Physics relationship edges added:", result["physics_relationships"])
    print("Common NOMINALISATION verification:", result["verification"])

    physics_domain = result["physics_domain"]
    print("Final Physics Dictionary size:", physics_domain.vocabulary.dictionary.total_entries())
    print("Final Physics relationship count:", len(physics_domain.vocabulary.lexical_relationships.relationships))

    # The example UI is regenerated by common_core_vocabulary_seeding.py
    # instead, not here -- same reasoning as physics_domain_seeding.py
    # and definition_gap_vocabulary_seeding.py before it: regenerating
    # from this run alone would silently regress the file back to a
    # less complete state.
