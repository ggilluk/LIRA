"""Resolves the 262 definition-breakdown words physics_definition_completeness.py
found unresolved (examples/definition_gap_vocabulary.py holds the
classification): each is either promoted into the Common Vocabulary
Cache (assets/common/en/), hydrated into the Physics Domain directly,
or left out with a documented reason -- never guessed into a domain it
doesn't belong to.

Common promotion reuses WordSeeder.promote_word (vocabulary/documentation/
README.md, 9.4) -- the same, pre-existing "add an open-class word to the
Common cache" path, not a new mechanism. reference_count is supplied as
a fixed value above promotion_threshold, the same documented judgement
call dictionary_hydrator.py already notes: "this class has no
visibility into how many Domains reference a Word; that tracking
doesn't exist yet elsewhere in this codebase" -- an editorial "this
word is genuinely common" decision, not a fabricated empirical tally.

Physics-specific words are hydrated the same way the original Physics
demonstration was (examples/physics_domain_seeding.py): fixture-patched
AsyncDictionaryHydrator.queue_hydration, against a payload set scoped to
this batch (PHYSICS_GAP_FIXTURES below), since physics_domain_seeding_fixtures.py's
own set is deliberately scoped to the original 23-sentence source
text's vocabulary (see that file's own comments).

Morphological relationships (base -> specific form, plus the reciprocal
LEMMA_FORM edge -- assets/common/en/relationships/README.md's own
convention) are added for every linked pair in definition_gap_vocabulary.py:
into the static Common relationship cache (with its checksum
recomputed) when both words land in Common, or created directly against
this run's Physics Domain (the same hand-curation pattern
physics_domain_relationships.py already uses) when both land in
Physics. The four EXTRA_SEMANTIC_LINKS ANTONYM pairs are all
Common-side and go into the static cache the same way.

Run: python3 examples/definition_gap_vocabulary_seeding.py
"""

import hashlib
import json
import re
import sys
import urllib.error
import urllib.parse
from decimal import Decimal
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
from definition_gap_vocabulary import (  # noqa: E402
    EXCLUDED_WORDS,
    EXTRA_SEMANTIC_LINKS,
    MORPHOLOGICAL_LINKS,
    WORD_ENTRIES,
)
from physics_domain_seeding import _FakeResponse  # noqa: E402
from physics_domain_seeding import run as seed_physics_domain  # noqa: E402
from physics_domain_seeding_fixtures import PHYSICS_FIXTURES  # noqa: E402

from lira.value_objects import Code, Number, Text  # noqa: E402
from lira.vocabulary import LexicalRelationshipType, PartOfSpeech, RegisterCode, Word  # noqa: E402
from lira.vocabulary.data.source_reference import SourceReference  # noqa: E402
from lira.vocabulary.data.word_lookup_context import WordLookupContext  # noqa: E402
from lira.vocabulary.role.word_seeder import WordSeeder  # noqa: E402

COMMON_SOURCE = SourceReference(
    source_name=Text(value="LIRA English Definition-Gap Vocabulary v1"),
    source_version=Text(value="1.0.0"),
)
PHYSICS_GAP_SOURCE_NAME = (
    "Curated fixture data, dictionaryapi.dev response shape -- definition-gap "
    "vocabulary batch (this sandbox blocks live calls to api.dictionaryapi.dev, "
    "see physics_domain_seeding.py's module docstring)"
)
RELATIONSHIP_SOURCE = SourceReference(
    source_name=Text(value="LIRA English Definition-Gap Vocabulary Relationships v1"),
    source_version=Text(value="1.0.0"),
)

_VOWEL_GROUPS = re.compile(r"[aeiouy]+")


def _syllable_count(lexical_form: str) -> int:
    return max(1, len(_VOWEL_GROUPS.findall(lexical_form.lower())))


def _build_word(lexical_form: str, pos_name: str, definition: str, *, source: SourceReference) -> Word:
    return Word(
        text=lexical_form,
        lexical_form=Text(value=lexical_form),
        normalised_form=Text(value=lexical_form.lower()),
        part_of_speech=PartOfSpeech[pos_name],
        script_code=Code(value="Latn"),
        definition=Text(value=definition),
        gloss=Text(value=definition),
        register_codes=(RegisterCode.NEUTRAL,),
        syllable_count=Number(value=Decimal(_syllable_count(lexical_form))),
        source_references=(source,),
        is_common=(source is COMMON_SOURCE),
        is_fully_hydrated=True,
    )


# -- Step 1: promote the "common" words into the Common Vocabulary Cache --

def promote_common_words() -> dict:
    seeder = WordSeeder()
    promoted, already_present = [], []
    for lexical_form, (pos, domain, definition) in sorted(WORD_ENTRIES.items()):
        if domain != "common":
            continue
        word = _build_word(lexical_form, pos, definition, source=COMMON_SOURCE)
        added = seeder.promote_word(word, reference_count=seeder.promotion_threshold + 1)
        (promoted if added else already_present).append(lexical_form)
    seeder.validate_assets()
    return {"promoted": promoted, "already_present": already_present}


# -- Step 2: append Common relationship entries + recompute the checksum --

RELATIONSHIPS_DIR = Path(__file__).resolve().parents[1] / "src/lira/vocabulary/assets/common/en/relationships"
CATEGORY_FILES = ("morphological_relationships.json", "semantic_relationships.json", "orthographic_relationships.json")


def _common_side_links():
    morph = []
    for base, kind, derived, origin in MORPHOLOGICAL_LINKS:
        if origin == "existing_as_derived":
            continue  # exist/exists -- both Physics, handled in Step 4
        if WORD_ENTRIES[derived][1] != "common":
            continue
        morph.append((base, kind, derived))
    semantic = list(EXTRA_SEMANTIC_LINKS)
    return morph, semantic


def _load_json(path: Path) -> dict:
    return json.loads(path.read_text())


def _save_json(path: Path, doc: dict) -> None:
    path.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")


def _compute_checksum() -> str:
    digest = hashlib.sha256()
    for filename in sorted(CATEGORY_FILES):
        digest.update((RELATIONSHIPS_DIR / filename).read_bytes())
    return digest.hexdigest()


def add_common_relationships() -> dict:
    morph_links, semantic_links = _common_side_links()

    morph_path = RELATIONSHIPS_DIR / "morphological_relationships.json"
    morph_doc = _load_json(morph_path)
    existing_morph = {(r["source_lexical_form"], r["relationship_kind"], r["target_lexical_form"]) for r in morph_doc["relationships"]}
    added_morph = 0
    for base, kind, derived in morph_links:
        for source_form, rel_kind, target_form in ((base, kind, derived), (derived, "LEMMA_FORM", base)):
            key = (source_form, rel_kind, target_form)
            if key in existing_morph:
                continue
            morph_doc["relationships"].append({"source_lexical_form": source_form, "target_lexical_form": target_form, "relationship_kind": rel_kind})
            existing_morph.add(key)
            added_morph += 1
    morph_doc["count"] = len(morph_doc["relationships"])
    _save_json(morph_path, morph_doc)

    sem_path = RELATIONSHIPS_DIR / "semantic_relationships.json"
    sem_doc = _load_json(sem_path)
    existing_sem = {(r["source_lexical_form"], r["relationship_kind"], r["target_lexical_form"]) for r in sem_doc["relationships"]}
    added_sem = 0
    for a, kind, b in semantic_links:
        for source_form, target_form in ((a, b), (b, a)):
            key = (source_form, kind, target_form)
            if key in existing_sem:
                continue
            sem_doc["relationships"].append({"source_lexical_form": source_form, "target_lexical_form": target_form, "relationship_kind": kind})
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


# -- Step 3: fresh Physics Domain (now inherits the newly-promoted Common words) --

def _payload_for(lexical_form: str, pos_name: str, definition: str) -> list:
    external_pos = {"NOUN": "noun", "VERB": "verb", "ADJECTIVE": "adjective", "ADVERB": "adverb"}[pos_name]
    return [{"word": lexical_form, "meanings": [{"partOfSpeech": external_pos, "definitions": [{"definition": definition}]}]}]


PHYSICS_GAP_FIXTURES = {
    lexical_form: _payload_for(lexical_form, pos, definition)
    for lexical_form, (pos, domain, definition) in WORD_ENTRIES.items()
    if domain == "physics"
}


def _gap_fixture_urlopen(request, timeout=None):
    url = request.full_url if hasattr(request, "full_url") else str(request)
    word = urllib.parse.unquote(url.rsplit("/", 1)[-1])
    payload = PHYSICS_GAP_FIXTURES.get(word) or PHYSICS_FIXTURES.get(word)
    if payload is None:
        raise urllib.error.HTTPError(url, 404, "Not Found", hdrs=None, fp=None)
    return _FakeResponse(payload)


def hydrate_physics_words(physics_domain) -> dict:
    dictionary = physics_domain.vocabulary.dictionary
    hydrator = physics_domain.vocabulary.hydrator
    physics_targets = sorted(lf for lf, (pos, domain, definition) in WORD_ENTRIES.items() if domain == "physics")

    with mock.patch("urllib.request.urlopen", side_effect=_gap_fixture_urlopen):
        for lexical_form in physics_targets:
            context = WordLookupContext(raw_text=lexical_form, normalised_text=lexical_form, domain_name=physics_domain.name)
            hydrator.queue_hydration(context)
        hydrator.work_queue.join()

    resolved = [lf for lf in physics_targets if dictionary.lookup(lf) is not None]
    unresolved = [lf for lf in physics_targets if dictionary.lookup(lf) is None]
    return {"targets": physics_targets, "resolved": resolved, "unresolved": unresolved}


# -- Step 4: Physics-side relationship edges (script-scoped, like physics_domain_relationships.py) --

def add_physics_relationships(physics_domain) -> dict:
    dictionary = physics_domain.vocabulary.dictionary
    store = physics_domain.vocabulary.lexical_relationships
    processor = physics_domain.vocabulary.lexical_relationship_processor

    def resolve(text: str):
        candidates = dictionary.lookup_all(text)
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

    physics_links = [
        (base, kind, derived) for base, kind, derived, origin in MORPHOLOGICAL_LINKS
        if origin == "existing_as_derived" or WORD_ENTRIES.get(derived, (None, None, None))[1] == "physics"
    ]

    created, skipped = 0, []
    for base, kind, derived in physics_links:
        base_word, derived_word = resolve(base), resolve(derived)
        if base_word is None or derived_word is None:
            skipped.append(f"{base} ({kind}) {derived}")
            continue
        if make_edge(base_word, LexicalRelationshipType[kind], derived_word):
            created += 1
        if make_edge(derived_word, LexicalRelationshipType.LEMMA_FORM, base_word):
            created += 1

    return {"attempted_pairs": len(physics_links), "edges_created": created, "skipped": skipped}


def run() -> dict:
    promotion_report = promote_common_words()
    relationship_report = add_common_relationships()

    base_report, physics_domain = seed_physics_domain()
    hydration_report = hydrate_physics_words(physics_domain)
    physics_relationship_report = add_physics_relationships(physics_domain)

    return {
        "promotion": promotion_report,
        "common_relationships": relationship_report,
        "hydration": hydration_report,
        "physics_relationships": physics_relationship_report,
        "excluded": EXCLUDED_WORDS,
        "physics_domain": physics_domain,
        "sentence_unresolved_words": base_report["unresolved_words"],
        "final_word_count": physics_domain.vocabulary.dictionary.total_entries(),
        "final_relationship_count": len(physics_domain.vocabulary.lexical_relationships.relationships),
    }


if __name__ == "__main__":
    result = run()
    print("Common words promoted:", len(result["promotion"]["promoted"]))
    print("Common words already present (idempotent re-run):", len(result["promotion"]["already_present"]))
    print("Common relationship edges added:", result["common_relationships"])
    print("Physics words targeted:", len(result["hydration"]["targets"]))
    print("Physics words resolved:", len(result["hydration"]["resolved"]))
    print("Physics words UNRESOLVED (unexpected if non-empty):", result["hydration"]["unresolved"])
    print("Physics relationship edges added:", result["physics_relationships"])
    print("Excluded words:", result["excluded"])
    print("Final Physics Dictionary size:", result["final_word_count"])
    print("Final Physics relationship count:", result["final_relationship_count"])

    # The example UI is regenerated by verb_nominalisation_seeding.py
    # instead, not here -- that script seeds this same Physics Domain
    # and then adds the NOMINALISATION pass on top, so it reflects the
    # fuller, more complete state. Regenerating it from this run alone
    # would silently regress it back to the pre-NOMINALISATION content
    # (the same reasoning physics_domain_seeding.py's own __main__
    # already documents for why it stopped writing this file).
