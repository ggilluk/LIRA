"""Audits `semantic_relationships.json` for logically impossible
relationship combinations -- the same pair of words carrying more than
one Lexical Semantic relationship kind at once (e.g. SYNONYM *and*
HYPERNYM/HYPONYM between the same two words: a pair can't both mean
the same thing and be broader/narrower than each other).

Read-only: this script only detects and reports, it does not write to
any asset file. It found 37 contradictory pairs (74 directed edges),
all traced back to the 14-parallel-subagent drafting pass behind
`common_semantic_completion.py` -- the aggregation pass that followed
it only deduplicated the reverse direction of *identical* proposals,
never checked whether two different subagents proposed a *different*
kind for the same pair. One of the 37 (`method`/`procedure`) is a
genuine HYPERNYM/HYPONYM direction error, not just a redundant edge.

`examples/relationship_contradiction_report.md` is this script's own
generated output (human-readable) and
`examples/relationship_contradiction_corrections.json` is the same
findings as structured data -- both a snapshot from the run that found
them, kept as the reviewable correction list until someone applies (or
overrides) each recommendation. Also checks for exact duplicate edges
and genuine HYPERNYM/HYPERNYM or MERONYM/MERONYM 2-cycles (both found
zero instances against the current cache).

TROPONYM is treated as part of the HYPERNYM_HYPONYM family, not a
contradiction against it: HYPERNYM is the one kind shared between nouns
(HYPERNYM/HYPONYM) and verbs (TROPONYM/HYPERNYM), so a TROPONYM edge
co-occurring with a HYPERNYM edge on the same pair is expected, not
flagged. HYPONYM itself is noun-only -- a TROPONYM edge should *not*
co-occur with a HYPONYM edge (a bug an earlier version of the seeding
scripts introduced by over-applying "troponymy is verb-specific
hyponymy" to also mean a literal HYPONYM edge; fixed in
`examples/troponym_hyponym_removal_fix.py`, see
`assets/common/en/relationships/README.md`'s `asset_version 1.17.0`
entry). `find_missing_troponym_companions()` checks a TROPONYM edge is
*missing* its HYPERNYM companion (reverse direction); `find_verb_hyponym_edges()`
checks the opposite mistake -- any HYPONYM edge that shouldn't exist at
all because both endpoints are verbs.

`find_verb_hypernym_without_troponym()` checks a different gap: a
verb-verb HYPERNYM pair with no TROPONYM edge at all
(`examples/troponym_verb_backfill.py`'s own module docstring; 41 pairs
found, predating the TROPONYM/HYPERNYM convention entirely).
Resolves each endpoint's part of speech against the full word cache
(mandatory + supplementary + promoted files), not just a relationship
entry's own optional `source_part_of_speech`/`target_part_of_speech`
fields, since most existing HYPERNYM entries predate that field and
omit it.

CAUSE is treated as part of the ENTAILMENT family too, for the same
reason as TROPONYM above: CAUSE and ENTAILMENT are required companions
of each other, so a CAUSE edge co-occurring with an ENTAILMENT edge on
the same pair, *same direction*, is expected, not flagged
(`assets/common/en/relationships/README.md`'s `asset_version 1.21.0`
entry). The check is now symmetric, unlike TROPONYM's one-way HYPERNYM
companion: `missing_cause_companions` (in `find_contradictions()`'s
returned dict) checks a CAUSE edge is *missing* its same-direction
ENTAILMENT companion, and `missing_entailment_companions` checks the
reverse -- an ENTAILMENT edge missing its same-direction CAUSE
companion. "kill" CAUSE "die" and "kill" ENTAILMENT "die" name the
same two endpoints in the same order either way.

Run: python3 examples/relationship_contradiction_audit.py
"""

import json
from collections import defaultdict
from pathlib import Path

SEMANTIC_PATH = (Path(__file__).resolve().parents[1]
                  / "src/lira/vocabulary/assets/common/en/relationships/semantic_relationships.json")
RELATIONSHIPS_DIR = SEMANTIC_PATH.parent
WORD_CACHE_DIR = RELATIONSHIPS_DIR.parent
WORD_CACHE_FILES = (
    "determiners.json", "pronouns.json", "auxiliaries.json", "prepositions.json",
    "coordinating_conjunctions.json", "subordinating_conjunctions.json", "particles.json",
    "punctuation.json", "symbols.json", "numerals.json",
    "metalinguistic_nouns.json", "metalinguistic_verbs.json", "metalinguistic_adjectives.json",
    "metalinguistic_adverbs.json", "metalinguistic_proper_nouns.json", "metalinguistic_interjections.json",
    "promoted_words.json",
)

FAMILY = {
    "SYNONYM": "SYNONYM",
    "ANTONYM": "ANTONYM",
    "RELATED": "RELATED",
    "HYPERNYM": "HYPERNYM_HYPONYM",
    "HYPONYM": "HYPERNYM_HYPONYM",
    # TROPONYM is verb-specific hyponymy -- it's expected to co-occur
    # with a HYPERNYM/HYPONYM edge on the same pair, not a contradiction
    # against it (see module docstring).
    "TROPONYM": "HYPERNYM_HYPONYM",
    "MERONYM": "MERONYM_HOLONYM",
    "HOLONYM": "MERONYM_HOLONYM",
    # CAUSE and ENTAILMENT are required companions -- it's expected for
    # both to co-occur (same direction) on the same pair, not a
    # contradiction (see module docstring).
    "ENTAILMENT": "ENTAILMENT",
    "CAUSE": "ENTAILMENT",
}


def _endpoint(form: str, pos, tag) -> tuple:
    return (form, pos, tag)


def _pos_by_form() -> dict:
    pos_by_form: dict = {}
    for filename in WORD_CACHE_FILES:
        doc = json.loads((WORD_CACHE_DIR / filename).read_text())
        for w in doc["words"]:
            pos_by_form.setdefault(w["lexical_form"], set()).add(w["part_of_speech"])
    return pos_by_form


def find_verb_hyponym_edges(rels: list) -> list:
    """HYPONYM is noun-only -- a verb-verb HYPONYM edge should never
    exist (verbs use TROPONYM for their narrower form, not HYPONYM)."""
    pos_by_form = _pos_by_form()

    def resolve_pos(form, explicit):
        return {explicit} if explicit else pos_by_form.get(form, set())

    found = []
    for r in rels:
        if r["relationship_kind"] != "HYPONYM":
            continue
        s, t = r["source_lexical_form"], r["target_lexical_form"]
        sp = resolve_pos(s, r.get("source_part_of_speech"))
        tp = resolve_pos(t, r.get("target_part_of_speech"))
        if sp == {"VERB"} and tp == {"VERB"}:
            found.append({"source": s, "target": t})
    return found


def find_verb_hypernym_without_troponym(rels: list) -> list:
    pos_by_form = _pos_by_form()

    def resolve_pos(form, explicit):
        return {explicit} if explicit else pos_by_form.get(form, set())

    tropo_pairs = set()
    for r in rels:
        if r["relationship_kind"] == "TROPONYM":
            tropo_pairs.add((r["source_lexical_form"], r["target_lexical_form"]))
            tropo_pairs.add((r["target_lexical_form"], r["source_lexical_form"]))

    missing = []
    for r in rels:
        if r["relationship_kind"] != "HYPERNYM":
            continue
        specific, general = r["source_lexical_form"], r["target_lexical_form"]
        specific_pos = resolve_pos(specific, r.get("source_part_of_speech"))
        general_pos = resolve_pos(general, r.get("target_part_of_speech"))
        if specific_pos == {"VERB"} and general_pos == {"VERB"} and (specific, general) not in tropo_pairs:
            missing.append({"specific": specific, "general": general})
    return missing


def find_contradictions() -> dict:
    data = json.loads(SEMANTIC_PATH.read_text())
    rels = data["relationships"]

    pair_edges = defaultdict(list)
    exact_dupes = defaultdict(int)
    directed_kinds = defaultdict(set)
    edge_set = set()
    hyper_pairs, mero_pairs = set(), set()
    tropo_pairs = []
    cause_pairs = []
    entailment_pairs = []

    for r in rels:
        s = _endpoint(r["source_lexical_form"], r.get("source_part_of_speech"), r.get("source_domain_tag"))
        t = _endpoint(r["target_lexical_form"], r.get("target_part_of_speech"), r.get("target_domain_tag"))
        kind = r["relationship_kind"]
        pair_edges[frozenset((s, t))].append((kind, s, t))
        exact_dupes[(s, t, kind)] += 1
        directed_kinds[(s, t)].add(kind)
        edge_set.add((s, kind, t))
        if kind == "HYPERNYM":
            hyper_pairs.add((s, t))
        if kind == "MERONYM":
            mero_pairs.add((s, t))
        if kind == "TROPONYM":
            tropo_pairs.append((s, t))
        if kind == "CAUSE":
            cause_pairs.append((s, t))
        if kind == "ENTAILMENT":
            entailment_pairs.append((s, t))

    duplicate_edges = [(s, t, k) for (s, t, k), n in exact_dupes.items() if n > 1]
    hypernym_2cycles = [(s, t) for (s, t) in hyper_pairs if (t, s) in hyper_pairs]
    meronym_2cycles = [(s, t) for (s, t) in mero_pairs if (t, s) in mero_pairs]

    cross_family = []
    for key, edges in pair_edges.items():
        families = sorted(set(FAMILY[k] for k, s, t in edges))
        if len(families) > 1:
            cross_family.append({
                "pair": sorted(str(e) for e in key),
                "families": families,
                "edges": [{"kind": k, "source": s, "target": t} for k, s, t in edges],
            })

    missing_troponym_companions = []
    for general, specific in tropo_pairs:
        if (specific, "HYPERNYM", general) not in edge_set:
            missing_troponym_companions.append({
                "pair": [str(general), str(specific)],
                "missing_edges": [f"{specific} -HYPERNYM-> {general}"],
            })

    missing_cause_companions = []
    for causing, caused in cause_pairs:
        if (causing, "ENTAILMENT", caused) not in edge_set:
            missing_cause_companions.append({
                "pair": [str(causing), str(caused)],
                "missing_edges": [f"{causing} -ENTAILMENT-> {caused}"],
            })

    missing_entailment_companions = []
    for entailing, entailed in entailment_pairs:
        if (entailing, "CAUSE", entailed) not in edge_set:
            missing_entailment_companions.append({
                "pair": [str(entailing), str(entailed)],
                "missing_edges": [f"{entailing} -CAUSE-> {entailed}"],
            })

    verb_hypernym_without_troponym = find_verb_hypernym_without_troponym(rels)
    verb_hyponym_edges = find_verb_hyponym_edges(rels)

    return {
        "total_relationships": len(rels),
        "duplicate_edges": duplicate_edges,
        "hypernym_2cycles": hypernym_2cycles,
        "meronym_2cycles": meronym_2cycles,
        "cross_family_contradictions": cross_family,
        "missing_troponym_companions": missing_troponym_companions,
        "verb_hypernym_without_troponym": verb_hypernym_without_troponym,
        "verb_hyponym_edges": verb_hyponym_edges,
        "missing_cause_companions": missing_cause_companions,
        "missing_entailment_companions": missing_entailment_companions,
    }


if __name__ == "__main__":
    result = find_contradictions()
    print("Total relationships scanned:", result["total_relationships"])
    print("Exact duplicate edges:", len(result["duplicate_edges"]))
    print("HYPERNYM/HYPERNYM 2-cycles:", len(result["hypernym_2cycles"]))
    print("MERONYM/MERONYM 2-cycles:", len(result["meronym_2cycles"]))
    print("Word pairs carrying more than one relationship kind:", len(result["cross_family_contradictions"]))
    print("TROPONYM edges missing their HYPERNYM companion:", len(result["missing_troponym_companions"]))
    for m in result["missing_troponym_companions"]:
        print("  ", m["pair"], "missing:", m["missing_edges"])
    print("Verb-verb HYPERNYM pairs with no TROPONYM edge:", len(result["verb_hypernym_without_troponym"]))
    for m in result["verb_hypernym_without_troponym"]:
        print(f"   {m['specific']} -HYPERNYM-> {m['general']}  (expected {m['general']} -TROPONYM-> {m['specific']})")
    print("Verb-verb HYPONYM edges (should never exist -- HYPONYM is noun-only):", len(result["verb_hyponym_edges"]))
    for m in result["verb_hyponym_edges"]:
        print(f"   {m['source']} -HYPONYM-> {m['target']}")
    print("CAUSE edges missing their ENTAILMENT companion:", len(result["missing_cause_companions"]))
    for m in result["missing_cause_companions"]:
        print("  ", m["pair"], "missing:", m["missing_edges"])
    print("ENTAILMENT edges missing their CAUSE companion:", len(result["missing_entailment_companions"]))
    for m in result["missing_entailment_companions"]:
        print("  ", m["pair"], "missing:", m["missing_edges"])
    print()
    print("See examples/relationship_contradiction_report.md for the full, reviewed correction list "
          "(recommended fix + reasoning per pair) and "
          "examples/relationship_contradiction_corrections.json for the same data, structured. "
          "See examples/troponym_verb_backfill.py to fix any verb-verb HYPERNYM pairs missing a TROPONYM edge, "
          "examples/troponym_hyponym_removal_fix.py to remove any stray verb-verb HYPONYM edges, "
          "or examples/cause_entailment_reciprocal_backfill.py to fix any CAUSE/ENTAILMENT pair "
          "missing its companion in either direction.")
