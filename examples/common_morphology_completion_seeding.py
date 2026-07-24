"""Completes the Common Vocabulary Cache's morphological relationship
coverage (Group 0 of LexicalRelationshipType): VERB conjugation (third-
person/past-tense/past-participle/present-participle), NOUN
pluralisation, ADJECTIVE/ADVERB comparative/superlative, and the
remaining PRONOUN paradigm gaps -- plus a self-documenting back-edge fix
(common_morphology_completion.py's SELF_DOCUMENTING_BACKEDGES) for words
whose own definition already announces them as an inflected form of
another word ("Third person singular of single (out); ...") but whose
LEMMA_FORM edge back to that base, and the base's own forward edge, were
never actually wired.

Found by cross-referencing a user-supplied per-part-of-speech relationship
export (an XLSX built from build_relationship_tables.py, one sheet per
POS, one column per LexicalRelationshipType kind) against which kinds are
grammatically valid for which part of speech -- most of that export's raw
"X is missing" cells are cells where the relationship kind doesn't apply
to that word's part of speech at all (a Noun sheet's Past Tense Form
column, say), so this batch only ever fills a cell whose kind is
grammatically applicable to that word, per common_morphology_completion.py's
rule engine and exclusion sets: irregular-verb/plural/degree lookup
tables, an uncountable-noun exclusion list, and a non-gradable-adjective
exclusion list -- built from real linguistic judgement, not a blanket
"fill every cell" pass, and confirmed against the live Common dictionary
before being written (see examples/README.md for full methodology and
counts).

Every newly created inflected-form word gets a plain, mechanical
definition ("Third person singular of denote.") rather than the hand-
tuned prose the rest of this dictionary uses for existing inflected
forms -- see common_morphology_completion.py's own module docstring for
why.

Lexical-semantic (SYNONYM/ANTONYM/HYPERNYM/...) and orthographic
(CONTRACTION/ABBREVIATION/...) relationship gaps are NOT addressed here;
those require real per-word lexicographic judgement at a much larger
scale and are separate, later batches.

Run: python3 examples/common_morphology_completion_seeding.py
"""

import sys
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common_morphology_completion import (  # noqa: E402
    NEW_BASE_VERBS,
    PRONOUN_PARADIGM_LINKS,
    SELF_DOCUMENTING_BACKEDGES,
    conjugate_verb,
    degree_forms,
    pluralize_noun,
)
from common_core_vocabulary_seeding import run as seed_common_core_vocabulary  # noqa: E402
from definition_gap_vocabulary_seeding import (  # noqa: E402
    RELATIONSHIPS_DIR,
    _build_word,
    _compute_checksum,
    _load_json,
    _save_json,
)

from lira.knowledge.data.host import LIRAHost  # noqa: E402
from lira.value_objects import Text  # noqa: E402
from lira.vocabulary.data.source_reference import SourceReference  # noqa: E402
from lira.vocabulary.role.word_seeder import WordSeeder  # noqa: E402

COMMON_SOURCE = SourceReference(
    source_name=Text(value="LIRA English Morphology Completion v1"),
    source_version=Text(value="1.0.0"),
)
ASSETS_DIR = Path(__file__).resolve().parents[1] / "src/lira/vocabulary/assets/common/en"

VERB_KIND_DEFINITIONS = {
    "THIRD_PERSON_FORM": "Third person singular of {base}.",
    "PAST_TENSE_FORM": "Past tense of {base}.",
    "PAST_PARTICIPLE_FORM": "Past participle of {base}.",
    "PRESENT_PARTICIPLE_FORM": "Present participle of {base}.",
}


def _snapshot():
    """Read-only pass over the live Common dictionary to discover, per
    POS, which words are "base" (no outgoing LEMMA_FORM edge) and which
    lexical forms already exist under a given POS -- used to decide reuse
    vs. create for every candidate inflected form."""
    host = LIRAHost(name="morphology-completion-snapshot")
    common = host.hosted_domains.get("Common")
    dictionary = common.vocabulary.dictionary
    store = common.vocabulary.lexical_relationships

    derived_ids = {r.source_word_id.value for r in store.relationships if r.relationship_type.name == "LEMMA_FORM"}
    existing_edges = {
        (r.source_word_id.value, r.relationship_type.name, r.target_word_id.value)
        for r in store.relationships
    }
    by_form_pos = {}
    by_uuid = {}
    for w in dictionary.all():
        by_form_pos.setdefault((w.lexical_form.value.lower(), w.part_of_speech.name), []).append(w)
        by_uuid[w.uuid.value] = w

    def base_words(pos_name: str, exclude=frozenset()):
        return [
            w for w in dictionary.all()
            if w.part_of_speech.name == pos_name
            and w.uuid.value not in derived_ids
            and w.lexical_form.value not in exclude
        ]

    return {
        "dictionary": dictionary,
        "by_form_pos": by_form_pos,
        "by_uuid": by_uuid,
        "existing_edges": existing_edges,
        "base_words": base_words,
    }


# -- Step 1: self-documenting back-edge fix (existing words only) --

def add_self_documenting_backedges(morph_doc, existing_keys) -> int:
    added = 0
    for derived, derived_pos, kind, base, base_pos in SELF_DOCUMENTING_BACKEDGES:
        for source_form, source_pos, rel_kind, target_form, target_pos in (
            (base, base_pos, kind, derived, derived_pos),
            (derived, derived_pos, "LEMMA_FORM", base, base_pos),
        ):
            key = (source_form, source_pos, rel_kind, target_form, target_pos)
            if key in existing_keys:
                continue
            morph_doc["relationships"].append({
                "source_lexical_form": source_form,
                "source_part_of_speech": source_pos,
                "target_lexical_form": target_form,
                "target_part_of_speech": target_pos,
                "relationship_kind": rel_kind,
            })
            existing_keys.add(key)
            added += 1
    return added


# -- Step 2: new VERB base senses (account/control/use/single) --

def add_new_base_verbs() -> list:
    seeder = WordSeeder()
    added = []
    for lexical_form, definition in NEW_BASE_VERBS.items():
        word = _build_word(lexical_form, "VERB", definition, source=COMMON_SOURCE)
        if seeder.promote_word(word, reference_count=seeder.promotion_threshold + 1):
            added.append(lexical_form)
    return added


# -- Step 3: VERB conjugation --

def add_verb_conjugations(snapshot, morph_doc, existing_keys) -> dict:
    seeder = WordSeeder()
    exclude = set(w for w in ()) | _BACKEDGE_DERIVED_VERBS | _OPERATOR_VERBS
    bases = [(w.lexical_form.value, "VERB") for w in snapshot["base_words"]("VERB", exclude=exclude)]
    bases += [(lf, "VERB") for lf in NEW_BASE_VERBS]

    new_words, edges_added = [], 0
    for base_form, base_pos in sorted(set(bases)):
        third, past, past_p, pres_p = conjugate_verb(base_form)
        for kind, derived_form in (
            ("THIRD_PERSON_FORM", third), ("PAST_TENSE_FORM", past),
            ("PAST_PARTICIPLE_FORM", past_p), ("PRESENT_PARTICIPLE_FORM", pres_p),
        ):
            key_fwd = (base_form, base_pos, kind, derived_form, "VERB")
            if key_fwd in existing_keys:
                continue
            if not snapshot["by_form_pos"].get((derived_form.lower(), "VERB")):
                word = _build_word(
                    derived_form, "VERB",
                    VERB_KIND_DEFINITIONS[kind].format(base=base_form),
                    source=COMMON_SOURCE,
                )
                if seeder.promote_word(word, reference_count=seeder.promotion_threshold + 1):
                    new_words.append(derived_form)
                snapshot["by_form_pos"].setdefault((derived_form.lower(), "VERB"), []).append(word)
            for source_form, source_pos, rel_kind, target_form, target_pos in (
                (base_form, base_pos, kind, derived_form, "VERB"),
                (derived_form, "VERB", "LEMMA_FORM", base_form, base_pos),
            ):
                edge_key = (source_form, source_pos, rel_kind, target_form, target_pos)
                if edge_key in existing_keys:
                    continue
                morph_doc["relationships"].append({
                    "source_lexical_form": source_form,
                    "source_part_of_speech": source_pos,
                    "target_lexical_form": target_form,
                    "target_part_of_speech": target_pos,
                    "relationship_kind": rel_kind,
                })
                existing_keys.add(edge_key)
                edges_added += 1
    return {"new_words": new_words, "edges_added": edges_added}


# -- Step 4: NOUN pluralisation --

def add_noun_plurals(snapshot, morph_doc, existing_keys) -> dict:
    seeder = WordSeeder()
    bases = snapshot["base_words"]("NOUN")
    new_words, edges_added = [], 0
    for w in sorted(bases, key=lambda w: w.lexical_form.value):
        base_form = w.lexical_form.value
        plural = pluralize_noun(base_form)
        if plural is None:
            continue
        key_fwd = (base_form, "NOUN", "PLURAL_FORM", plural, "NOUN")
        if key_fwd in existing_keys:
            continue
        if not snapshot["by_form_pos"].get((plural.lower(), "NOUN")):
            word = _build_word(plural, "NOUN", f"Plural of {base_form}.", source=COMMON_SOURCE)
            if seeder.promote_word(word, reference_count=seeder.promotion_threshold + 1):
                new_words.append(plural)
            snapshot["by_form_pos"].setdefault((plural.lower(), "NOUN"), []).append(word)
        for source_form, source_pos, rel_kind, target_form, target_pos in (
            (base_form, "NOUN", "PLURAL_FORM", plural, "NOUN"),
            (plural, "NOUN", "LEMMA_FORM", base_form, "NOUN"),
        ):
            edge_key = (source_form, source_pos, rel_kind, target_form, target_pos)
            if edge_key in existing_keys:
                continue
            morph_doc["relationships"].append({
                "source_lexical_form": source_form,
                "source_part_of_speech": source_pos,
                "target_lexical_form": target_form,
                "target_part_of_speech": target_pos,
                "relationship_kind": rel_kind,
            })
            existing_keys.add(edge_key)
            edges_added += 1
    return {"new_words": new_words, "edges_added": edges_added}


# -- Step 5: ADJECTIVE/ADVERB degree forms --

def add_degree_forms(snapshot, morph_doc, existing_keys) -> dict:
    seeder = WordSeeder()
    new_words, edges_added = [], 0
    for pos in ("ADJECTIVE", "ADVERB"):
        bases = snapshot["base_words"](pos)
        for w in sorted(bases, key=lambda w: w.lexical_form.value):
            base_form = w.lexical_form.value
            forms = degree_forms(base_form, part_of_speech=pos)
            if forms is None:
                continue
            comparative, superlative = forms
            for kind, derived_form, definition in (
                ("COMPARATIVE_FORM", comparative, f"Comparative of {base_form}."),
                ("SUPERLATIVE_FORM", superlative, f"Superlative of {base_form}."),
            ):
                key_fwd = (base_form, pos, kind, derived_form, pos)
                if key_fwd in existing_keys:
                    continue
                if not snapshot["by_form_pos"].get((derived_form.lower(), pos)):
                    word = _build_word(derived_form, pos, definition, source=COMMON_SOURCE)
                    if seeder.promote_word(word, reference_count=seeder.promotion_threshold + 1):
                        new_words.append(derived_form)
                    snapshot["by_form_pos"].setdefault((derived_form.lower(), pos), []).append(word)
                for source_form, source_pos, rel_kind, target_form, target_pos in (
                    (base_form, pos, kind, derived_form, pos),
                    (derived_form, pos, "LEMMA_FORM", base_form, pos),
                ):
                    edge_key = (source_form, source_pos, rel_kind, target_form, target_pos)
                    if edge_key in existing_keys:
                        continue
                    morph_doc["relationships"].append({
                        "source_lexical_form": source_form,
                        "source_part_of_speech": source_pos,
                        "target_lexical_form": target_form,
                        "target_part_of_speech": target_pos,
                        "relationship_kind": rel_kind,
                    })
                    existing_keys.add(edge_key)
                    edges_added += 1
    return {"new_words": new_words, "edges_added": edges_added}


# -- Step 6: remaining PRONOUN paradigm gaps (existing words only) --

def add_pronoun_paradigm(morph_doc, existing_keys) -> int:
    reciprocal_kind = {
        "PRONOUN_OBJECT_FORM": "PRONOUN_SUBJECT_FORM",
        "PRONOUN_POSSESSIVE_FORM": "LEMMA_FORM",
        "PRONOUN_POSSESSIVE_DETERMINER_FORM": "LEMMA_FORM",
        "PRONOUN_REFLEXIVE_FORM": "LEMMA_FORM",
    }
    added = 0
    for source_form, source_pos, kind, target_form, target_pos in PRONOUN_PARADIGM_LINKS:
        edges = [(source_form, source_pos, kind, target_form, target_pos)]
        recip = reciprocal_kind[kind]
        edges.append((target_form, target_pos, recip, source_form, source_pos))
        for source_f, source_p, rel_kind, target_f, target_p in edges:
            key = (source_f, source_p, rel_kind, target_f, target_p)
            if key in existing_keys:
                continue
            morph_doc["relationships"].append({
                "source_lexical_form": source_f,
                "source_part_of_speech": source_p,
                "target_lexical_form": target_f,
                "target_part_of_speech": target_p,
                "relationship_kind": rel_kind,
            })
            existing_keys.add(key)
            added += 1
    return added


_BACKEDGE_DERIVED_VERBS = frozenset(
    derived for derived, derived_pos, kind, base, base_pos in SELF_DOCUMENTING_BACKEDGES if derived_pos == "VERB"
)
_OPERATOR_VERBS = frozenset({"and", "or", "nor", "nand", "not", "plus", "minus", "xor", "xnor", "equals"})


def run() -> dict:
    new_base_verbs = add_new_base_verbs()

    morph_path = RELATIONSHIPS_DIR / "morphological_relationships.json"
    morph_doc = _load_json(morph_path)
    existing_keys = {
        (r["source_lexical_form"], r.get("source_part_of_speech"), r["relationship_kind"],
         r["target_lexical_form"], r.get("target_part_of_speech"))
        for r in morph_doc["relationships"]
    }

    backedge_count = add_self_documenting_backedges(morph_doc, existing_keys)

    snapshot = _snapshot()
    verb_result = add_verb_conjugations(snapshot, morph_doc, existing_keys)
    noun_result = add_noun_plurals(snapshot, morph_doc, existing_keys)
    degree_result = add_degree_forms(snapshot, morph_doc, existing_keys)
    pronoun_count = add_pronoun_paradigm(morph_doc, existing_keys)

    morph_doc["count"] = len(morph_doc["relationships"])
    _save_json(morph_path, morph_doc)

    word_manifest_path = ASSETS_DIR / "manifest.json"
    word_manifest = _load_json(word_manifest_path)
    word_manifest["asset_version"] = "1.16.0"
    promoted_path = ASSETS_DIR / "promoted_words.json"
    promoted_count = _load_json(promoted_path)["count"]
    for file_entry in word_manifest["files"]:
        if file_entry["file"] == "promoted_words.json":
            file_entry["count"] = promoted_count
    _save_json(word_manifest_path, word_manifest)

    rel_manifest_path = RELATIONSHIPS_DIR / "manifest.json"
    rel_manifest = _load_json(rel_manifest_path)
    for file_entry in rel_manifest["files"]:
        if file_entry["file"] == "morphological_relationships.json":
            file_entry["count"] = morph_doc["count"]
    rel_manifest["relationship_count"] = sum(fe["count"] for fe in rel_manifest["files"])
    rel_manifest["asset_version"] = "1.10.0"
    rel_manifest["checksum"] = _compute_checksum()
    _save_json(rel_manifest_path, rel_manifest)

    WordSeeder().validate_assets()

    core_result = seed_common_core_vocabulary()

    return {
        "new_base_verbs": new_base_verbs,
        "self_documenting_backedges": backedge_count,
        "verb": verb_result,
        "noun": noun_result,
        "degree": degree_result,
        "pronoun_paradigm": pronoun_count,
        "core_result": core_result,
        "physics_domain": core_result["physics_domain"],
        "sentence_unresolved_words": core_result["sentence_unresolved_words"],
    }


if __name__ == "__main__":
    from lira.vocabulary import DictionaryView

    result = run()
    print("New base verbs added:", result["new_base_verbs"])
    print("Self-documenting back-edges wired:", result["self_documenting_backedges"])
    print(f"Verb conjugation: {len(result['verb']['new_words'])} new words, {result['verb']['edges_added']} edges")
    print(f"Noun plurals: {len(result['noun']['new_words'])} new words, {result['noun']['edges_added']} edges")
    print(f"Degree forms: {len(result['degree']['new_words'])} new words, {result['degree']['edges_added']} edges")
    print("Pronoun paradigm edges:", result["pronoun_paradigm"])

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
