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
contradiction against it: troponymy is verb-specific hyponymy (WordNet
models it as the same hypernym/hyponym relation, just named "troponym"
for the narrower verb), so `common_semantic_completion_seeding.py` and
`physics_domain_seeding.py` both materialise a matching HYPONYM/HYPERNYM
pair alongside every TROPONYM edge -- that co-occurrence is expected,
not flagged. `find_missing_troponym_companions()` instead checks the
opposite failure mode: a TROPONYM edge that is *missing* its companion
HYPONYM/HYPERNYM pair (e.g. seeded before this convention existed, or
added later by hand without it).

Run: python3 examples/relationship_contradiction_audit.py
"""

import json
from collections import defaultdict
from pathlib import Path

SEMANTIC_PATH = (Path(__file__).resolve().parents[1]
                  / "src/lira/vocabulary/assets/common/en/relationships/semantic_relationships.json")

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
    "ENTAILMENT": "ENTAILMENT",
    "CAUSE": "CAUSE",
}


def _endpoint(form: str, pos, tag) -> tuple:
    return (form, pos, tag)


def find_contradictions() -> dict:
    data = json.loads(SEMANTIC_PATH.read_text())
    rels = data["relationships"]

    pair_edges = defaultdict(list)
    exact_dupes = defaultdict(int)
    directed_kinds = defaultdict(set)
    edge_set = set()
    hyper_pairs, mero_pairs = set(), set()
    tropo_pairs = []

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
        missing = []
        if (general, "HYPONYM", specific) not in edge_set:
            missing.append(f"{general} -HYPONYM-> {specific}")
        if (specific, "HYPERNYM", general) not in edge_set:
            missing.append(f"{specific} -HYPERNYM-> {general}")
        if missing:
            missing_troponym_companions.append({"pair": [str(general), str(specific)], "missing_edges": missing})

    return {
        "total_relationships": len(rels),
        "duplicate_edges": duplicate_edges,
        "hypernym_2cycles": hypernym_2cycles,
        "meronym_2cycles": meronym_2cycles,
        "cross_family_contradictions": cross_family,
        "missing_troponym_companions": missing_troponym_companions,
    }


if __name__ == "__main__":
    result = find_contradictions()
    print("Total relationships scanned:", result["total_relationships"])
    print("Exact duplicate edges:", len(result["duplicate_edges"]))
    print("HYPERNYM/HYPERNYM 2-cycles:", len(result["hypernym_2cycles"]))
    print("MERONYM/MERONYM 2-cycles:", len(result["meronym_2cycles"]))
    print("Word pairs carrying more than one relationship kind:", len(result["cross_family_contradictions"]))
    print("TROPONYM edges missing their HYPONYM/HYPERNYM companion:", len(result["missing_troponym_companions"]))
    for m in result["missing_troponym_companions"]:
        print("  ", m["pair"], "missing:", m["missing_edges"])
    print()
    print("See examples/relationship_contradiction_report.md for the full, reviewed correction list "
          "(recommended fix + reasoning per pair) and "
          "examples/relationship_contradiction_corrections.json for the same data, structured.")
