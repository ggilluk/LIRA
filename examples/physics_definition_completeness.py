"""LIRA Vocabulary Layer Definition Word Breakdown demonstration -- Physics.

Prototypes Word.definition_words() and DictionaryProcessor.queue_definition_hydration
(vocabulary/documentation/README.md, 4.4 and 9.7) against the same Physics
Domain physics_domain_seeding.py seeds. No Vocabulary Layer class is
modified for this demonstration either -- it drives definition_words()
and queue_definition_hydration() exactly the way any other caller would.

Two things are measured:

1. Completeness -- for every hydrated (or conflict-registered) Physics
   Word, how many of its own definition's tokens resolve to a Word
   already in this Domain's Dictionary, and how many don't. An
   unresolved token isn't a bug in this run; it's the expected result
   of definitions naming general-English vocabulary this Physics
   demonstration's narrow fixture set was never meant to cover fully
   (see examples/README.md's Network caveat) -- reported honestly, not
   hidden.
2. Recursive discovery -- one Physics Word with an unresolved definition
   token is picked, and DictionaryProcessor.queue_definition_hydration
   is called on it, demonstrating the gap actually being acted on
   through the same AsyncDictionaryHydrator.queue_hydration path
   identify_word itself uses. Most gap words won't have fixture
   coverage either (they were never anticipated by the Physics source
   text), so most stay unresolved even after this round -- that's the
   honest result of a deliberately narrow fixture set, not a demo
   failure.

Run: python3 examples/physics_definition_completeness.py
(seeds its own Physics Domain via physics_domain_seeding.run() first --
no separate seeding step needed.)
"""

import sys
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
from physics_domain_seeding import DOMAIN_NAME, _fixture_urlopen  # noqa: E402
from physics_domain_seeding import run as seed_physics_domain  # noqa: E402


def _completeness(physics_domain) -> dict:
    dictionary = physics_domain.vocabulary.dictionary
    physics_words = sorted(
        (w for w in dictionary.all() if not w.is_common and w.definition is not None),
        key=lambda w: w.lexical_form.value,
    )

    total_tokens = 0
    total_unresolved = 0
    unresolved_frequency = {}
    per_word = []

    for word in physics_words:
        references = word.definition_words(dictionary)
        unresolved = [r.text for r in references if r.word is None]
        total_tokens += len(references)
        total_unresolved += len(unresolved)
        for text in unresolved:
            key = text.casefold()
            unresolved_frequency[key] = unresolved_frequency.get(key, 0) + 1
        per_word.append((word.lexical_form.value, len(references), len(unresolved)))

    return {
        "words_checked": len(physics_words),
        "total_definition_tokens": total_tokens,
        "resolved_tokens": total_tokens - total_unresolved,
        "unresolved_tokens": total_unresolved,
        "distinct_unresolved": sorted(unresolved_frequency.items(), key=lambda kv: (-kv[1], kv[0])),
        "fully_resolved_words": sorted(w for w, _total, gaps in per_word if gaps == 0),
        "per_word_with_gaps": sorted(
            ((w, total, gaps) for w, total, gaps in per_word if gaps > 0),
            key=lambda row: (-row[2], row[0]),
        ),
    }


def _demonstrate_recursive_discovery(physics_domain, sample_word_text: str) -> dict:
    """Calls DictionaryProcessor.queue_definition_hydration on one Physics
    Word known to have an unresolved definition token, patching
    urllib.request.urlopen for the duration the same way
    physics_domain_seeding.py's own run() does (this sandbox blocks live
    calls to api.dictionaryapi.dev -- see that file's module docstring),
    then recomputes definition_words() on the same Word to show what, if
    anything, resolved as a result."""
    dictionary = physics_domain.vocabulary.dictionary
    hydrator = physics_domain.vocabulary.hydrator
    processor = physics_domain.vocabulary.dictionary_processor

    word = next(w for w in dictionary.lookup_all(sample_word_text) if not w.is_common)
    unresolved_before = sorted({r.text for r in word.definition_words(dictionary) if r.word is None})

    with mock.patch("urllib.request.urlopen", side_effect=_fixture_urlopen):
        queued = processor.queue_definition_hydration(word)
        hydrator.work_queue.join()

    unresolved_after = sorted({r.text for r in word.definition_words(dictionary) if r.word is None})

    return {
        "word": sample_word_text,
        "definition": word.definition.value,
        "unresolved_before": unresolved_before,
        "queued": queued,
        "unresolved_after": unresolved_after,
        "newly_resolved": sorted(set(unresolved_before) - set(unresolved_after)),
    }


def run() -> dict:
    _, physics_domain = seed_physics_domain()
    completeness = _completeness(physics_domain)

    # Smallest, cleanest gap first (fewest unresolved tokens, then fewest
    # total tokens) rather than the largest -- makes for a legible
    # before/after demonstration; report['completeness']['per_word_with_gaps']
    # still lists every gap, largest first, for the completeness picture.
    tractable = sorted(completeness["per_word_with_gaps"], key=lambda row: (row[2], row[1]))
    sample_word = tractable[0][0] if tractable else None
    discovery = _demonstrate_recursive_discovery(physics_domain, sample_word) if sample_word else None

    return {"domain": DOMAIN_NAME, "completeness": completeness, "discovery": discovery}


def _format_report(report: dict) -> str:
    lines = ["# Physics Domain -- Definition Word Breakdown Report\n"]
    lines.append(f"Domain: **{report['domain']}**\n")

    c = report["completeness"]
    lines.append("## Completeness\n")
    lines.append(f"- Physics Words checked (hydrated or conflict-registered, `definition` present): {c['words_checked']}")
    lines.append(f"- Total definition tokens across all of them: {c['total_definition_tokens']}")
    lines.append(f"- Resolved against this Domain's Dictionary: {c['resolved_tokens']}")
    lines.append(f"- Unresolved: {c['unresolved_tokens']}\n")

    lines.append(f"### Fully self-contained definitions ({len(c['fully_resolved_words'])})\n")
    lines.append("Every token in these Words' own definitions already resolves to a Word in this Domain:\n")
    lines.append(", ".join(c["fully_resolved_words"]) if c["fully_resolved_words"] else "(none)")
    lines.append("")

    lines.append(f"### Definitions with gaps ({len(c['per_word_with_gaps'])})\n")
    lines.append("| Word | Definition tokens | Unresolved |")
    lines.append("|------|--------------------|------------|")
    for word_text, total, gaps in c["per_word_with_gaps"]:
        lines.append(f"| {word_text} | {total} | {gaps} |")
    lines.append("")

    lines.append(f"### Most frequently unresolved tokens ({len(c['distinct_unresolved'])} distinct)\n")
    lines.append("| Token | Occurrences |")
    lines.append("|-------|-------------|")
    for token, count in c["distinct_unresolved"][:15]:
        lines.append(f"| {token} | {count} |")
    lines.append("")
    lines.append("These are overwhelmingly ordinary general-English vocabulary (\"basic\", \"consisting\", "
                  "\"characteristic\", plural inflections like \"electrons\" that don't exact-match the "
                  "singular `electron` Word's `text`) -- expected, since this demonstration's fixture set "
                  "(examples/physics_domain_seeding_fixtures.py) was curated for the Physics source text's own "
                  "vocabulary, not for exhaustive coverage of every word any dictionary definition might use.\n")

    d = report["discovery"]
    lines.append("## Recursive discovery demonstration\n")
    if d is None:
        lines.append("No Word with an unresolved definition token was found -- nothing to demonstrate.\n")
    else:
        lines.append(f"Sample Word: **{d['word']}**  ")
        lines.append(f"Definition: \"{d['definition']}\"\n")
        lines.append(f"- Unresolved before: {', '.join(d['unresolved_before']) if d['unresolved_before'] else '(none)'}")
        lines.append(f"- `queue_definition_hydration` queued: {', '.join(d['queued']) if d['queued'] else '(nothing -- already all queued/resolved)'}")
        lines.append(f"- Unresolved after: {', '.join(d['unresolved_after']) if d['unresolved_after'] else '(none)'}")
        lines.append(f"- Newly resolved by this round: {', '.join(d['newly_resolved']) if d['newly_resolved'] else '(none -- expected, see below)'}\n")
        lines.append("Most queued tokens stay unresolved even after hydration is queued and drained: this "
                      "demonstration's fixture set only covers the Physics source text's own vocabulary "
                      "(examples/physics_domain_seeding_fixtures.py), not the general-English words a "
                      "dictionary definition happens to use. That's the honest result of a deliberately narrow "
                      "fixture set standing in for a live API this sandbox can't reach (examples/README.md's "
                      "Network caveat), not a flaw in queue_definition_hydration itself -- against the real "
                      "Free Dictionary API in production, most of these would resolve.\n")

    return "\n".join(lines)


if __name__ == "__main__":
    report = run()
    text_report = _format_report(report)
    print(text_report)

    report_path = Path(__file__).resolve().parent / "physics_definition_completeness_report.md"
    report_path.write_text(text_report + "\n")
    print(f"\nReport written to {report_path}")
