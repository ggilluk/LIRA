"""Applies common_polysemy_split.py's WORD_SPLITS to the Common
Vocabulary Cache: edits promoted_words.json (trims each KEEP entry's
definition to one sense, adds domain_tag, appends a brand-new entry per
additional sense), edits morphological_relationships.json and
semantic_relationships.json (adds domain_tag to every existing edge
that stays with its word's KEEP sense or moves to a specific NEW sense,
adds the HYPERNYM/HYPONYM pair backing each sense's domain_tag when it
doesn't already exist, adds PLURAL_FORM/LEMMA_FORM for every new sense,
and rebuilds positive/negative's ANTONYM pairs per-sense-family), then
recomputes the relationship cache's manifest and checksum. Also applies
the times (VERB) definition fix (a stray leftover clause, not a split
-- see common_polysemy_split.py's own module docstring).

Run: python3 examples/common_polysemy_split_seeding.py
"""

import json
import sys
import uuid as uuid_module
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common_polysemy_split import (  # noqa: E402
    ANTONYM_PAIRS,
    REFERENCE_COUNT,
    TIMES_VERB_ENTRY_ID,
    TIMES_VERB_FIXED_DEFINITION,
    WORD_SPLITS,
)
from definition_gap_vocabulary_seeding import (  # noqa: E402
    RELATIONSHIPS_DIR,
    _compute_checksum,
    _load_json,
    _save_json,
)

from lira.vocabulary.role.word_seeder import WordSeeder  # noqa: E402
from lira.vocabulary.role.relationship_seeder import RelationshipSeeder  # noqa: E402

ASSETS_DIR = Path(__file__).resolve().parents[1] / "src/lira/vocabulary/assets/common/en"
PROMOTED_PATH = ASSETS_DIR / "promoted_words.json"
MORPHOLOGICAL_PATH = RELATIONSHIPS_DIR / "morphological_relationships.json"
SEMANTIC_PATH = RELATIONSHIPS_DIR / "semantic_relationships.json"


def split_words() -> dict:
    """Edits promoted_words.json in place: KEEP entries trimmed to one
    sense (definition + domain_tag), one brand-new entry appended per
    additional sense (fresh entry_id, every other field copied from the
    KEEP entry as it stood before editing) -- skipped when a matching
    (lexical_form, part_of_speech, domain_tag) entry already exists, the
    same idempotency discipline every other field in this cache
    follows, so re-running this script (e.g. as part of the canonical
    seeding chain) never appends a second copy of a sense already
    split out. Also applies the times (VERB) definition fix. Returns a
    report dict."""
    doc = _load_json(PROMOTED_PATH)
    by_entry_id = {w["entry_id"]: w for w in doc["words"]}

    times_entry = by_entry_id[TIMES_VERB_ENTRY_ID]
    times_entry["definition"] = TIMES_VERB_FIXED_DEFINITION
    times_entry["gloss"] = TIMES_VERB_FIXED_DEFINITION

    existing_keys = {(w["lexical_form"], w["part_of_speech"], w.get("domain_tag")) for w in doc["words"]}
    new_entries = []
    for split in WORD_SPLITS:
        original = by_entry_id[split.entry_id]
        keep = split.senses[0]
        # Discard the pre-edit key before adding KEEP's own -- the
        # original entry's (lexical_form, part_of_speech, domain_tag)
        # triple no longer describes any real entry once its
        # domain_tag is rewritten below, so a later NEW sense that
        # happens to want that same (now-vacated) triple (e.g. a
        # None-tagged sense, when the original's own domain_tag was
        # already None) must not be mistaken for a duplicate of it.
        existing_keys.discard((split.lexical_form, split.part_of_speech, original.get("domain_tag")))
        original["definition"] = keep.definition
        original["gloss"] = keep.definition
        original["domain_tag"] = keep.domain_tag
        existing_keys.add((split.lexical_form, split.part_of_speech, keep.domain_tag))

        for sense in split.senses[1:]:
            key = (sense.lexical_form, sense.part_of_speech, sense.domain_tag)
            if key in existing_keys:
                continue
            entry = dict(original)
            entry["entry_id"] = str(uuid_module.uuid4())
            entry["definition"] = sense.definition
            entry["gloss"] = sense.definition
            entry["domain_tag"] = sense.domain_tag
            entry["reference_count"] = REFERENCE_COUNT
            new_entries.append(entry)
            existing_keys.add(key)

    doc["words"].extend(new_entries)
    doc["count"] = len(doc["words"])
    _save_json(PROMOTED_PATH, doc)
    return {"words_added": len(new_entries), "words_edited": len(WORD_SPLITS) + 1}


def _matches(entry: dict, side: str, lexical_form: str, part_of_speech: str) -> bool:
    return entry.get(f"{side}_lexical_form") == lexical_form and entry.get(f"{side}_part_of_speech") == part_of_speech


def _patch_relationship_file(path: Path) -> int:
    """For every WordSplit, tags each *unclaimed* existing relationship
    edge that touches that word with the correct sense's domain_tag: an
    edge matching one of the word's `moves` gets the destination NEW
    sense's domain_tag (on whichever side is this word); every other
    unclaimed edge touching the word gets the KEEP sense's domain_tag
    (same side). "Unclaimed" means that side has no source_domain_tag/
    target_domain_tag *key at all yet* -- checked with `"...tag" not in
    entry`, deliberately not `entry.get("...tag") is None`, because a
    sense can legitimately want a domain_tag of None (the plain
    "common" sense), and once assigned that reads identically to
    "never assigned" under a None check. Getting this wrong is exactly
    what caused a real bug: on a second run, "charge"'s price sense
    (domain_tag None, added fresh by add_morphology_for_new_senses with
    the key explicitly set to null) looked "unclaimed" under a None
    check the same as a genuinely-never-processed legacy edge, so this
    method reassigned it to the KEEP sense's tag ("property.common"),
    leaving two separate PLURAL_FORM edges both claiming
    "property.common" -- and since the reassignment vacated the price
    sense's None-tagged edge, add_morphology_for_new_senses' own
    _has_edge check no longer found it and added a fresh replacement,
    so the file grew a duplicate on every subsequent run. The key
    check requires add_hypernym_edges/add_morphology_for_new_senses to
    always write their domain_tag fields explicitly (even when the
    value is None) -- see both functions -- so "key absent" reliably
    means "genuinely never processed" and nothing else. Once a side
    has a key (any value, including null), it is never touched again --
    this is also what stops a NEW sense's own freshly-tagged edges
    (matching the same lexical_form/part_of_speech as every other
    sense of the word) from being reassigned to KEEP's tag on a later
    run. Positive/negative's ANTONYM edges are excluded here (rebuilt
    separately, since both endpoints of those specific edges are
    themselves split words -- see rebuild_antonyms below) -- every
    other pair in WORD_SPLITS has exactly one split endpoint, so this
    method never has to arbitrate two splits' conflicting claims on the
    same edge. Returns the number of edges patched."""
    doc = _load_json(path)
    rels = doc["relationships"]
    patched = 0

    for split in WORD_SPLITS:
        keep = split.senses[0]
        lf, pos = split.lexical_form, split.part_of_speech
        move_lookup = {}
        for kind, other_form, other_pos, direction, idx in split.moves:
            move_lookup[(kind, other_form, other_pos, direction)] = split.senses[1 + idx].domain_tag

        for entry in rels:
            kind = entry.get("relationship_kind")
            if split.part_of_speech == "ADJECTIVE" and kind == "ANTONYM" and lf in ("positive", "negative"):
                continue  # rebuilt separately -- see rebuild_antonyms.

            if _matches(entry, "source", lf, pos) and "source_domain_tag" not in entry:
                other_form = entry.get("target_lexical_form")
                other_pos = entry.get("target_part_of_speech")
                key = (kind, other_form, other_pos, "outgoing")
                tag = move_lookup[key] if key in move_lookup else keep.domain_tag
                entry["source_domain_tag"] = tag
                patched += 1
            if _matches(entry, "target", lf, pos) and "target_domain_tag" not in entry:
                other_form = entry.get("source_lexical_form")
                other_pos = entry.get("source_part_of_speech")
                key = (kind, other_form, other_pos, "incoming")
                tag = move_lookup[key] if key in move_lookup else keep.domain_tag
                entry["target_domain_tag"] = tag
                patched += 1

    doc["count"] = len(rels)
    _save_json(path, doc)
    return patched


def rebuild_antonyms() -> int:
    """Deletes the one explicit ADJECTIVE<->ADJECTIVE ANTONYM pair
    between the original merged positive/negative entries (it no longer
    names one specific sense once both words split into a numerical
    sense and an electric sense) and replaces it with one ANTONYM pair
    per sense-family named in ANTONYM_PAIRS. positive's general/
    optimistic sense keeps no ANTONYM edge -- this vocabulary never
    gave "negative" a matching general/pessimistic sense to pair it
    with, and not every word has a recorded antonym. The plain
    no-part_of_speech legacy ANTONYM pair (source_lexical_form
    "negative"/"positive" with no part_of_speech at all) is left
    untouched -- it already resolves via Dictionary.lookup()'s
    first-seeded-wins default exactly as it did before this split,
    since the KEEP entries keep their original entry_id and file
    position."""
    doc = _load_json(SEMANTIC_PATH)
    rels = doc["relationships"]

    def is_old_pair(entry):
        return (
            entry.get("relationship_kind") == "ANTONYM"
            and entry.get("source_part_of_speech") == "ADJECTIVE"
            and entry.get("target_part_of_speech") == "ADJECTIVE"
            and {entry.get("source_lexical_form"), entry.get("target_lexical_form")} == {"positive", "negative"}
            # Only the untagged original pair -- not one of ANTONYM_PAIRS'
            # own tagged replacements, so a second run doesn't delete and
            # immediately recreate them (harmless, since _has_edge would
            # just re-add the identical entry, but pointless churn and a
            # spurious diff every run).
            and "source_domain_tag" not in entry and "target_domain_tag" not in entry
        )

    rels[:] = [entry for entry in rels if not is_old_pair(entry)]

    added = 0
    for tag_a, tag_b in ANTONYM_PAIRS:
        if not _has_edge(rels, "positive", "ADJECTIVE", tag_a, "ANTONYM", "negative", "ADJECTIVE"):
            rels.append({
                "source_lexical_form": "positive", "source_part_of_speech": "ADJECTIVE", "source_domain_tag": tag_a,
                "target_lexical_form": "negative", "target_part_of_speech": "ADJECTIVE", "target_domain_tag": tag_b,
                "relationship_kind": "ANTONYM",
            })
            added += 1
        if not _has_edge(rels, "negative", "ADJECTIVE", tag_b, "ANTONYM", "positive", "ADJECTIVE"):
            rels.append({
                "source_lexical_form": "negative", "source_part_of_speech": "ADJECTIVE", "source_domain_tag": tag_b,
                "target_lexical_form": "positive", "target_part_of_speech": "ADJECTIVE", "target_domain_tag": tag_a,
                "relationship_kind": "ANTONYM",
            })
            added += 1

    doc["count"] = len(rels)
    _save_json(SEMANTIC_PATH, doc)
    return added


def _has_edge(rels: list, source_form, source_pos, source_tag, kind, target_form, target_pos) -> bool:
    return any(
        r.get("relationship_kind") == kind
        and r.get("source_lexical_form") == source_form and r.get("source_part_of_speech") == source_pos
        and r.get("source_domain_tag") == source_tag
        and r.get("target_lexical_form") == target_form and r.get("target_part_of_speech") == target_pos
        for r in rels
    )


def add_hypernym_edges() -> int:
    """Ensures every sense with a `hypernym` set has a HYPERNYM edge
    (plus its reciprocal HYPONYM) pointing at it, tagged with that
    sense's own domain_tag -- adding the pair fresh if
    _patch_relationship_file's domain-tag pass didn't already find and
    tag a pre-existing one (e.g. "bar"'s existing HYPERNYM -> "symbol"
    edge just got tagged in place; "character"'s HYPERNYM -> "quality"
    never existed and is added here instead). Every hypernym target
    here is a plain, unambiguous Common word (none of them is itself a
    split word), so its own part_of_speech alone resolves it -- no
    domain_tag needed on that side."""
    doc = _load_json(SEMANTIC_PATH)
    rels = doc["relationships"]
    added = 0

    for split in WORD_SPLITS:
        lf, pos = split.lexical_form, split.part_of_speech
        for sense in split.senses:
            if sense.hypernym is None:
                continue
            if _has_edge(rels, lf, pos, sense.domain_tag, "HYPERNYM", sense.hypernym, pos):
                continue
            rels.append({
                "source_lexical_form": lf, "source_part_of_speech": pos, "source_domain_tag": sense.domain_tag,
                "target_lexical_form": sense.hypernym, "target_part_of_speech": pos,
                "relationship_kind": "HYPERNYM",
            })
            rels.append({
                "source_lexical_form": sense.hypernym, "source_part_of_speech": pos,
                "target_lexical_form": lf, "target_part_of_speech": pos, "target_domain_tag": sense.domain_tag,
                "relationship_kind": "HYPONYM",
            })
            added += 2

    doc["count"] = len(rels)
    _save_json(SEMANTIC_PATH, doc)
    return added


def add_morphology_for_new_senses() -> int:
    """Every brand-new sense that's a NOUN with an existing plural Word
    (`plural`) gets its own PLURAL_FORM edge to that plural, plus the
    plural's own reciprocal LEMMA_FORM edge back -- the same morphology
    its KEEP sibling already has, since both senses genuinely inflect
    the same way (e.g. both senses of "bar" pluralize to "bars"). The
    KEEP sense's own PLURAL_FORM/LEMMA_FORM edges are handled by
    _patch_relationship_file instead (they already exist; this only
    adds the new ones)."""
    doc = _load_json(MORPHOLOGICAL_PATH)
    rels = doc["relationships"]
    added = 0

    for split in WORD_SPLITS:
        lf, pos = split.lexical_form, split.part_of_speech
        for sense in split.senses[1:]:
            if sense.plural is None:
                continue
            if _has_edge(rels, lf, pos, sense.domain_tag, "PLURAL_FORM", sense.plural, "NOUN"):
                continue
            rels.append({
                "source_lexical_form": lf, "source_part_of_speech": pos, "source_domain_tag": sense.domain_tag,
                "target_lexical_form": sense.plural, "target_part_of_speech": "NOUN",
                "relationship_kind": "PLURAL_FORM",
            })
            rels.append({
                "source_lexical_form": sense.plural, "source_part_of_speech": "NOUN",
                "target_lexical_form": lf, "target_part_of_speech": pos, "target_domain_tag": sense.domain_tag,
                "relationship_kind": "LEMMA_FORM",
            })
            added += 2

    doc["count"] = len(rels)
    _save_json(MORPHOLOGICAL_PATH, doc)
    return added


def _recompute_relationship_manifest() -> None:
    manifest_path = RELATIONSHIPS_DIR / "manifest.json"
    manifest = _load_json(manifest_path)
    for file_entry in manifest["files"]:
        doc = _load_json(RELATIONSHIPS_DIR / file_entry["file"])
        file_entry["count"] = doc["count"]
    manifest["relationship_count"] = sum(fe["count"] for fe in manifest["files"])
    manifest["asset_version"] = "1.12.0"
    manifest["checksum"] = _compute_checksum()
    _save_json(manifest_path, manifest)


def run() -> dict:
    word_report = split_words()
    morph_patched = _patch_relationship_file(MORPHOLOGICAL_PATH)
    sem_patched = _patch_relationship_file(SEMANTIC_PATH)
    antonyms_added = rebuild_antonyms()
    hypernyms_added = add_hypernym_edges()
    morphology_added = add_morphology_for_new_senses()
    _recompute_relationship_manifest()

    WordSeeder().validate_assets()
    RelationshipSeeder().validate_assets()

    return {
        **word_report,
        "morphological_edges_patched": morph_patched,
        "semantic_edges_patched": sem_patched,
        "antonym_edges_rebuilt": antonyms_added,
        "hypernym_edges_added": hypernyms_added,
        "new_sense_morphology_added": morphology_added,
    }


if __name__ == "__main__":
    result = run()
    for key, value in result.items():
        print(f"{key}: {value}")
