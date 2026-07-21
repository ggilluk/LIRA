"""LIRA Vocabulary Layer Domain Seeding demonstration -- Physics.

Uses the existing, unmodified Vocabulary Layer pipeline
(DictionaryProcessor.identify_word, PartOfSpeechIdentifier,
AsyncDictionaryHydrator, ExternalDictionaryAdapter) to seed a "Physics"
Domain from a representative source text, exactly the way any other
Domain would be seeded. No Vocabulary Layer class is modified for this
demonstration -- see vocabulary/documentation/README.md for the
pipeline this drives.

Network caveat: this sandbox's network policy rejects outbound calls
to api.dictionaryapi.dev (the only external provider
AsyncDictionaryHydrator is wired to) with a 403 policy denial --
confirmed directly, not assumed. So urllib.request.urlopen is patched,
for the duration of this script only, to serve curated fixture
responses (physics_domain_seeding_fixtures.py, in that API's own real
response shape) instead of making a live call. Every other line of
the real pipeline runs unmodified: ExternalDictionaryAdapter parses
the exact same JSON shape a live response would have, ranks candidates
by the same domain-relevance formula, and AsyncDictionaryHydrator
creates Words from the result the same way it would from a live
response. Every hydrated Word's source_references names this
substitution explicitly (FIXTURE_SOURCE_NAME below), so provenance
never overstates what actually happened.

Run: python3 examples/physics_domain_seeding.py
"""

import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent))
from physics_domain_seeding_fixtures import PHYSICS_FIXTURES  # noqa: E402
from physics_source_text import PHYSICS_SOURCE_TEXT  # noqa: E402

from lira.knowledge.data.host import LIRAHost  # noqa: E402
from lira.linguistics.role.grammar_configurator import GrammarConfigurator  # noqa: E402
from lira.linguistics.role.lexer import LinguisticLexer  # noqa: E402
from lira.linguistics.ui.user_prompt import UserPrompt  # noqa: E402
from lira.vocabulary import DictionaryView  # noqa: E402

FIXTURE_SOURCE_NAME = (
    "Curated fixture data, dictionaryapi.dev response shape "
    "(this sandbox blocks live calls to api.dictionaryapi.dev -- see this file's module docstring)"
)
PUNCTUATION = {".", ",", ";", "!", "?"}
DOMAIN_NAME = "Physics"


class _FakeResponse:
    def __init__(self, payload):
        self._data = json.dumps(payload).encode()

    def read(self):
        return self._data

    def __enter__(self):
        return self

    def __exit__(self, *exc_info):
        return False


def _fixture_urlopen(request, timeout=None):
    """Stands in for urllib.request.urlopen: serves PHYSICS_FIXTURES by
    the exact word dictionaryapi.dev's own URL shape encodes, or raises
    HTTPError(404) for a word with no fixture entry -- the same outcome
    a real "not found" response would produce, exercising the same
    except-and-report-unresolved path AsyncDictionaryHydrator already
    has."""
    url = request.full_url if hasattr(request, "full_url") else str(request)
    word = urllib.parse.unquote(url.rsplit("/", 1)[-1])
    payload = PHYSICS_FIXTURES.get(word)
    if payload is None:
        raise urllib.error.HTTPError(url, 404, "Not Found", hdrs=None, fp=None)
    return _FakeResponse(payload)


def _unique_content_tokens(text: str, config: GrammarConfigurator):
    tokens = []
    for sentence in LinguisticLexer.split_sentences(text, config):
        tokens.extend(LinguisticLexer.extract_tokens(sentence))
    return sorted({t.lower() for t in tokens if t not in PUNCTUATION})


def _pos_set(dictionary, word: str):
    return {w.part_of_speech.name for w in dictionary.lookup_all(word)}


def run() -> dict:
    host = LIRAHost(name="physics-domain-seeding-demo")
    physics = host.get_or_create_domain(DOMAIN_NAME)
    dictionary = physics.vocabulary.dictionary
    hydrator = physics.vocabulary.hydrator
    config = GrammarConfigurator()

    tokens = _unique_content_tokens(PHYSICS_SOURCE_TEXT, config)

    # Baseline: what the Common cache already gives this Domain for
    # free, before a single sentence of Physics text is processed
    # (Domain creation already seeded Physics from Common -- 9.3).
    already_covered = sorted(t for t in tokens if dictionary.lookup_all(t))
    pos_before = {t: _pos_set(dictionary, t) for t in tokens}

    with mock.patch("urllib.request.urlopen", side_effect=_fixture_urlopen):
        physics.linguistics.tokenize_prompt(UserPrompt(text=PHYSICS_SOURCE_TEXT))
        hydrator.work_queue.join()

        first_run_telemetry = dict(hydrator.telemetry)
        word_count_after_first_run = dictionary.total_entries()

        # Repeat-processing test: same text, same Domain, second pass.
        physics.linguistics.tokenize_prompt(UserPrompt(text=PHYSICS_SOURCE_TEXT))
        hydrator.work_queue.join()

    second_run_telemetry = dict(hydrator.telemetry)
    word_count_after_second_run = dictionary.total_entries()

    pos_after = {t: _pos_set(dictionary, t) for t in tokens}

    new_words = []       # token had nothing before, has senses now
    enriched_words = []  # token had some sense(s) before, gained more
    unresolved_words = []  # token had nothing before and still has nothing

    for t in tokens:
        before, after = pos_before[t], pos_after[t]
        if not before and after:
            new_words.append((t, sorted(after)))
        elif before and after - before:
            enriched_words.append((t, sorted(before), sorted(after)))
        elif not before and not after:
            unresolved_words.append(t)

    report = {
        "domain": DOMAIN_NAME,
        "source_sentences": len(LinguisticLexer.split_sentences(PHYSICS_SOURCE_TEXT, config)),
        "unique_tokens": len(tokens),
        "already_covered_by_common_seed": already_covered,
        "new_words": new_words,
        "enriched_words": enriched_words,
        "unresolved_words": sorted(unresolved_words),
        "word_count_after_first_run": word_count_after_first_run,
        "word_count_after_second_run": word_count_after_second_run,
        "duplicate_prevention_confirmed": word_count_after_first_run == word_count_after_second_run,
        "first_run_telemetry": first_run_telemetry,
        "second_run_telemetry": second_run_telemetry,
        "final_word_count": dictionary.total_entries(),
        "final_relationship_count": len(physics.vocabulary.lexical_relationships.relationships),
    }
    return report, physics


def _format_report(report: dict) -> str:
    lines = []
    lines.append(f"# Physics Domain Seeding -- Test Report\n")
    lines.append(f"Domain: **{report['domain']}**  ")
    lines.append(f"Source: {report['source_sentences']} sentences, {report['unique_tokens']} unique tokens\n")

    lines.append("## Words already covered by the Common seed\n")
    lines.append(f"{len(report['already_covered_by_common_seed'])} tokens resolved immediately, no external lookup: "
                  + ", ".join(report["already_covered_by_common_seed"]) + "\n")

    lines.append("## New words hydrated\n")
    lines.append(f"{len(report['new_words'])} lexical forms newly added, with every externally-evidenced part of speech:\n")
    for word, pos in report["new_words"]:
        lines.append(f"- **{word}** -> {', '.join(pos)}")
    lines.append("")

    lines.append("## Existing words enriched\n")
    if report["enriched_words"]:
        for word, before, after in report["enriched_words"]:
            added = sorted(set(after) - set(before))
            lines.append(f"- **{word}**: had {', '.join(before)}; added {', '.join(added)}")
    else:
        lines.append("None in this run -- none of the Physics-specific content words in this source text "
                      "happened to already exist in the Common seed (Common is closed-class function words plus "
                      "a narrow set of metalinguistic grammar terms, not general content vocabulary), so every "
                      "discovered word here was genuinely new rather than a missing-sense addition to an "
                      "existing entry. The pipeline supports this case (a new external part of speech is added "
                      "to an existing lexical form whenever it doesn't already have that exact (text, "
                      "part_of_speech) pair) -- this run simply didn't exercise it.")
    lines.append("")

    lines.append("## Unresolved words\n")
    lines.append(f"{len(report['unresolved_words'])} tokens had no seeded sense and no fixture evidence, and were "
                  "correctly left unresolved rather than guessed: " + ", ".join(report["unresolved_words"]) + "\n")

    lines.append("## Duplicate prevention (repeat-processing test)\n")
    lines.append(f"- Dictionary size after first run: {report['word_count_after_first_run']}")
    lines.append(f"- Dictionary size after second run: {report['word_count_after_second_run']}")
    lines.append(f"- Confirmed no duplicates created on reprocessing: **{report['duplicate_prevention_confirmed']}**\n")

    lines.append("## Hydrator telemetry\n")
    lines.append(f"- First run: {report['first_run_telemetry']}")
    lines.append(f"- Second run (cumulative): {report['second_run_telemetry']}")
    lines.append("  (successful_fetches/created_words do not grow on the second run for anything already "
                  "resolved; the deliberately-unresolved words are retried and fail again each pass, since "
                  "nothing in this pipeline blacklists a word after one failed lookup.)\n")

    lines.append("## Final state\n")
    lines.append(f"- Total words in the Physics Dictionary: {report['final_word_count']}")
    lines.append(f"- Total relationships: {report['final_relationship_count']}")
    return "\n".join(lines)


if __name__ == "__main__":
    report, physics_domain = run()
    text_report = _format_report(report)
    print(text_report)

    report_path = Path(__file__).resolve().parent / "physics_domain_seeding_report.md"
    report_path.write_text(text_report + "\n")
    print(f"\nReport written to {report_path}")

    ui_path = Path(__file__).resolve().parents[1] / "src/lira/vocabulary/assets/example_ui/dictionary_view_example.html"
    DictionaryView(
        physics_domain.vocabulary.dictionary,
        physics_domain.vocabulary.lexical_relationships,
        title="LIRA Dictionary -- Physics Domain (hydrated words sourced from curated fixture "
              "data standing in for Free Dictionary API -- see examples/README.md)",
        unresolved=tuple(report["unresolved_words"]),
    ).save(str(ui_path))
    print(f"Example UI regenerated at {ui_path}")
