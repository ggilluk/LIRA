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
from physics_domain_relationships import (  # noqa: E402
    ANTONYM_PAIRS,
    CAUSE_PAIRS,
    ENTAILMENT_PAIRS,
    HYPERNYM_HYPONYM_PAIRS,
    MERONYM_HOLONYM_PAIRS,
    RELATED_PAIRS,
    SYNONYM_PAIRS,
    TROPONYM_PAIRS,
)
from physics_domain_seeding_fixtures import PHYSICS_FIXTURES  # noqa: E402
from physics_source_text import PHYSICS_SOURCE_TEXT  # noqa: E402

from lira.knowledge.data.host import LIRAHost  # noqa: E402
from lira.linguistics.role.grammar_configurator import GrammarConfigurator  # noqa: E402
from lira.linguistics.role.lexer import LinguisticLexer  # noqa: E402
from lira.linguistics.ui.user_prompt import UserPrompt  # noqa: E402
from lira.value_objects import Text  # noqa: E402
from lira.vocabulary import LexicalRelationshipType, PartOfSpeech, Word  # noqa: E402
from lira.vocabulary.data.source_reference import SourceReference  # noqa: E402
from lira.vocabulary.data.word_lookup_context import WordLookupContext  # noqa: E402
from lira.vocabulary.role.external_dictionary_adapter import ExternalDictionaryAdapter  # noqa: E402

FIXTURE_SOURCE_NAME = (
    "Curated fixture data, dictionaryapi.dev response shape "
    "(this sandbox blocks live calls to api.dictionaryapi.dev -- see this file's module docstring)"
)
RELATIONSHIP_SOURCE_NAME = (
    "Hand-curated for this demonstration (examples/physics_domain_relationships.py) -- "
    "RelationshipSeeder has no path to relate a word added by hydration, see that file's module docstring"
)
PUNCTUATION = {".", ",", ";", "!", "?"}
DOMAIN_NAME = "Physics"

# Words whose Physics-specific fixture sense never got a chance to
# hydrate, because the Common seed already has *some* sense of the same
# text -- identify_word() only queues hydration when NO existing sense
# at all matches, regardless of part_of_speech (see examples/README.md's
# "Known, pre-existing limitation" section), so these were silently
# resolving to the wrong sense the whole time. Two ways this shows up:
# object/particle share the *same* part_of_speech as Common's
# conflicting sense (both NOUN -- "particle" -> Common's grammatical-
# particle metalinguistic term, not the subatomic-particle physics
# sense this domain's relationships need); wave/moving/flow share the
# *text* but need a *different* part_of_speech than whatever Common
# happens to have (Common's "wave" is VERB, Physics needs the NOUN
# sense; Common's "moving" is VERB, Physics needs the ADJECTIVE sense;
# Common's "flow" is NOUN, Physics needs the VERB sense) -- the
# 1163-word Common definition-gap batch (examples/
# common_definition_gap_vocabulary.py) added exactly those three Common
# senses and immediately re-triggered this same limitation, caught by
# re-running this script and watching ANTONYM/RELATED/MERONYM/HOLONYM/
# TROPONYM/ENTAILMENT pairs that used to resolve start reporting "word
# or sense not found". Discovered by checking every PHYSICS_FIXTURES
# word against the Common seed directly: "depend" and "position" also
# already exist in Common, but with compatible general-English
# definitions that serve physics usage just as well -- those two are
# not genuine conflicts.
CONFLICTING_SENSE_WORDS = (
    ("object", "NOUN"),
    ("particle", "NOUN"),
    ("wave", "NOUN"),
    ("moving", "ADJECTIVE"),
    ("flow", "VERB"),
)


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


def _register_conflicting_senses(physics_domain) -> dict:
    """Registers the Physics-specific sense of each word in
    CONFLICTING_SENSE_WORDS as a distinct Word, via the same
    DictionaryProcessor.register_conflicting_sense path a Domain owner
    would use for any other word-sense conflict (vocabulary/documentation/README.md,
    9.2) -- not a new mechanism. Reuses ExternalDictionaryAdapter to
    parse the fixture payload into a candidate (identical to what
    AsyncDictionaryHydrator would have produced, had identify_word ever
    queued this word for hydration), so the resulting Word is built
    exactly the way a hydrated one is. Idempotent: skips a word already
    registered (matched by definition text, since that's what's
    actually distinct between the two senses), safe to call more than
    once against the same Domain."""
    dictionary = physics_domain.vocabulary.dictionary
    dict_processor = physics_domain.vocabulary.dictionary_processor
    registered = []

    for word_text, pos_name in CONFLICTING_SENSE_WORDS:
        pos = PartOfSpeech[pos_name]
        payload = PHYSICS_FIXTURES[word_text]
        fixture_definition = payload[0]["meanings"][0]["definitions"][0]["definition"]

        already_registered = any(
            w.part_of_speech == pos and w.definition is not None and w.definition.value == fixture_definition
            for w in dictionary.lookup_all(word_text)
        )
        if already_registered:
            continue

        context = WordLookupContext(raw_text=word_text, normalised_text=word_text, domain_name=DOMAIN_NAME)
        candidates = ExternalDictionaryAdapter.parse_api_payload(payload=payload, context=context, source_uri="fixture:" + word_text)
        candidate = next((c for c in candidates if c.part_of_speech == pos), None)
        if candidate is None:
            continue

        word = Word(
            text=candidate.text,
            lexical_form=Text(value=candidate.lexical_form),
            normalised_form=Text(value=candidate.normalised_form),
            language_code=candidate.language_code,
            part_of_speech=candidate.part_of_speech,
            definition=candidate.definition,
            gloss=candidate.gloss,
            usage_notes=candidate.usage_notes,
            source_references=candidate.source_references,
            is_common=False,
            is_fully_hydrated=True,
        )
        registered_word = dict_processor.register_conflicting_sense(word)
        registered.append((word_text, pos_name, registered_word.entry_id.value))

    return {"registered": registered}


def _seed_physics_relationships(physics_domain) -> dict:
    """Hand-curated relationships among the hydrated Physics words --
    see physics_domain_relationships.py's module docstring for why
    this exists (RelationshipSeeder never runs again after Domain
    creation, so nothing else relates a word hydration adds) and for
    the directional convention each kind uses (verified against
    Word.py's derived properties -- meronyms()/holonyms() read incoming
    edges, hypernyms()/hyponyms()/troponyms() read outgoing).

    Three materialisation patterns, one per physics_domain_relationships.py
    list shape:
    - Symmetric, same kind both directions (SYNONYM_PAIRS, ANTONYM_PAIRS,
      RELATED_PAIRS): (text_a, pos_a, text_b, pos_b).
    - Inverse-kind pairs, one conceptual fact producing two different
      kinds (HYPERNYM_HYPONYM_PAIRS, MERONYM_HOLONYM_PAIRS):
      (narrower/part, pos, broader/whole, pos).
    - One-directional, no inverse kind defined in LexicalRelationshipType
      (TROPONYM_PAIRS, ENTAILMENT_PAIRS, CAUSE_PAIRS): (source, pos,
      target, pos) -- matches the not-reversed CONTRACTION precedent.

    Resolves every word by exact (text, part_of_speech), since several
    are homographs; skips (and reports) any pair where a word or the
    exact sense named isn't present. Idempotent like
    RelationshipSeeder.seed_domain: checks for an existing identical
    edge before creating one, safe to call more than once against the
    same Domain."""
    dictionary = physics_domain.vocabulary.dictionary
    store = physics_domain.vocabulary.lexical_relationships
    processor = physics_domain.vocabulary.lexical_relationship_processor
    source_reference = SourceReference(source_name=Text(value=RELATIONSHIP_SOURCE_NAME))

    def resolve(text: str, pos_name: str):
        pos = PartOfSpeech[pos_name]
        candidates = [w for w in dictionary.lookup_all(text) if w.part_of_speech == pos]
        if not candidates:
            return None
        # Prefer the Physics-specific sense when a same-(text, POS)
        # Common sense also exists (e.g. "particle": Common's
        # grammatical-particle metalinguistic term vs the physics
        # subatomic-particle sense _register_conflicting_senses
        # registers) -- every relationship curated here is about the
        # Physics-domain concept, never the Common one.
        return next((w for w in candidates if not w.is_common), candidates[0])

    def edge_exists(source_id: str, target_id: str, kind: LexicalRelationshipType) -> bool:
        return any(r.target_word_id.value == target_id and r.relationship_type == kind for r in store.outgoing(source_id))

    per_kind_created = {}
    skipped = []

    def make_edge(a, kind: LexicalRelationshipType, b) -> None:
        if edge_exists(a.uuid.value, b.uuid.value, kind):
            return
        processor.create(
            source_word_id=a.uuid.value, target_word_id=b.uuid.value,
            relationship_type=kind, source_references=(source_reference,),
            confidence=0.9999, provenance=0.9999, temporal=0.9999, activation=0.9999,
        )
        per_kind_created[kind.name] = per_kind_created.get(kind.name, 0) + 1

    def resolve_pair(text_a, pos_a, text_b, pos_b, label: str):
        word_a = resolve(text_a, pos_a)
        word_b = resolve(text_b, pos_b)
        if word_a is None or word_b is None:
            skipped.append(f"{label}: {text_a} ({pos_a}) / {text_b} ({pos_b}) -- word or sense not found")
            return None
        return word_a, word_b

    attempted_pairs = 0

    for text_a, pos_a, text_b, pos_b in SYNONYM_PAIRS:
        attempted_pairs += 1
        resolved = resolve_pair(text_a, pos_a, text_b, pos_b, "SYNONYM")
        if resolved:
            a, b = resolved
            make_edge(a, LexicalRelationshipType.SYNONYM, b)
            make_edge(b, LexicalRelationshipType.SYNONYM, a)

    for text_a, pos_a, text_b, pos_b in ANTONYM_PAIRS:
        attempted_pairs += 1
        resolved = resolve_pair(text_a, pos_a, text_b, pos_b, "ANTONYM")
        if resolved:
            a, b = resolved
            make_edge(a, LexicalRelationshipType.ANTONYM, b)
            make_edge(b, LexicalRelationshipType.ANTONYM, a)

    for text_a, pos_a, text_b, pos_b in RELATED_PAIRS:
        attempted_pairs += 1
        resolved = resolve_pair(text_a, pos_a, text_b, pos_b, "RELATED")
        if resolved:
            a, b = resolved
            make_edge(a, LexicalRelationshipType.RELATED, b)
            make_edge(b, LexicalRelationshipType.RELATED, a)

    for narrower_text, narrower_pos, broader_text, broader_pos in HYPERNYM_HYPONYM_PAIRS:
        attempted_pairs += 1
        resolved = resolve_pair(narrower_text, narrower_pos, broader_text, broader_pos, "HYPERNYM/HYPONYM")
        if resolved:
            narrower, broader = resolved
            make_edge(narrower, LexicalRelationshipType.HYPERNYM, broader)
            make_edge(broader, LexicalRelationshipType.HYPONYM, narrower)

    for part_text, part_pos, whole_text, whole_pos in MERONYM_HOLONYM_PAIRS:
        attempted_pairs += 1
        resolved = resolve_pair(part_text, part_pos, whole_text, whole_pos, "MERONYM/HOLONYM")
        if resolved:
            part, whole = resolved
            make_edge(part, LexicalRelationshipType.MERONYM, whole)
            make_edge(whole, LexicalRelationshipType.HOLONYM, part)

    for general_text, general_pos, specific_text, specific_pos in TROPONYM_PAIRS:
        attempted_pairs += 1
        resolved = resolve_pair(general_text, general_pos, specific_text, specific_pos, "TROPONYM")
        if resolved:
            general, specific = resolved
            make_edge(general, LexicalRelationshipType.TROPONYM, specific)

    for entailing_text, entailing_pos, entailed_text, entailed_pos in ENTAILMENT_PAIRS:
        attempted_pairs += 1
        resolved = resolve_pair(entailing_text, entailing_pos, entailed_text, entailed_pos, "ENTAILMENT")
        if resolved:
            entailing, entailed = resolved
            make_edge(entailing, LexicalRelationshipType.ENTAILMENT, entailed)

    for causing_text, causing_pos, caused_text, caused_pos in CAUSE_PAIRS:
        attempted_pairs += 1
        resolved = resolve_pair(causing_text, causing_pos, caused_text, caused_pos, "CAUSE")
        if resolved:
            causing, caused = resolved
            make_edge(causing, LexicalRelationshipType.CAUSE, caused)

    return {
        "created": sum(per_kind_created.values()),
        "per_kind_created": per_kind_created,
        "skipped": skipped,
        "attempted_pairs": attempted_pairs,
    }


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
    relationship_count_before = len(physics.vocabulary.lexical_relationships.relationships)

    with mock.patch("urllib.request.urlopen", side_effect=_fixture_urlopen):
        physics.linguistics.tokenize_prompt(UserPrompt(text=PHYSICS_SOURCE_TEXT))
        hydrator.work_queue.join()

        first_run_telemetry = dict(hydrator.telemetry)

        conflicting_senses = _register_conflicting_senses(physics)
        relationship_seeding = _seed_physics_relationships(physics)

        # Captured after conflicting-sense registration (which also adds
        # Words) so the repeat-processing duplicate check below compares
        # like with like.
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
        "conflicting_senses": conflicting_senses,
        "relationship_seeding": relationship_seeding,
        "relationship_count_before": relationship_count_before,
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

    lines.append("## Word-sense conflicts found and resolved\n")
    lines.append("Checking every fixture word against the Common seed directly found collisions "
                  "(`object`, `depend`, `position`, `particle`, and -- once the 1163-word Common "
                  "definition-gap batch added Common senses of its own for them -- `wave`, `moving`, "
                  "`flow`) -- identify_word() only queues hydration when *no* existing sense at all "
                  "matches, regardless of part_of_speech, so these never reached "
                  "ExternalDictionaryAdapter. `depend`/`position` turned out to have compatible general-"
                  "English definitions already in Common, fine as-is. The rest are genuine "
                  "conflicts -- `object`/`particle` because Common's senses are the grammatical terms "
                  "(\"the noun that receives the action of a verb\", \"a function word that does not fit "
                  "the main parts of speech\"); `wave`/`moving`/`flow` because Common's new sense is a "
                  "different part_of_speech entirely (Common's `wave` is VERB, Physics needs NOUN; "
                  "Common's `moving` is VERB, Physics needs ADJECTIVE; Common's `flow` is NOUN, Physics "
                  "needs VERB) -- neither is the physics one this domain's own relationships need. "
                  "Resolved via "
                  "`DictionaryProcessor.register_conflicting_sense` -- the same, pre-existing conflict-"
                  "resolution path a Domain owner would use for any other word-sense conflict "
                  "(`vocabulary/documentation/README.md`, 9.2), not a new mechanism. Both senses keep "
                  "the identical, unmangled `lexical_form` -- no `_2`-style suffix -- and are told apart "
                  "by their own `entry_id` (Word 4.2) plus the Domain pill the UI already shows:\n")
    conflicts = report["conflicting_senses"]["registered"]
    if conflicts:
        for word_text, pos_name, entry_id in conflicts:
            lines.append(f"- `{word_text}` ({pos_name}) registered as a second, Physics-domain sense, `entry_id=\"{entry_id}\"`")
    else:
        lines.append("- (already registered by a previous run of this script -- idempotent, nothing to do)")
    lines.append("")

    lines.append("## Relationships among hydrated words\n")
    rel_seed = report["relationship_seeding"]
    lines.append("RelationshipSeeder only runs once, at Domain creation, against the static Common "
                  "relationship cache -- it never relates a word added later by hydration. "
                  f"{rel_seed['attempted_pairs']} pairs hand-curated for this domain "
                  "(examples/physics_domain_relationships.py), covering every Lexical Semantic kind "
                  "with at least 5 real examples, RELATED kept deliberately smallest as the lowest-"
                  f"priority catch-all: **{rel_seed['created']} edges created**.\n")
    lines.append("| Kind | Edges created |")
    lines.append("|------|---------------|")
    for kind in ("SYNONYM", "ANTONYM", "HYPERNYM", "HYPONYM", "MERONYM", "HOLONYM", "TROPONYM", "ENTAILMENT", "CAUSE", "RELATED"):
        lines.append(f"| {kind} | {rel_seed['per_kind_created'].get(kind, 0)} |")
    if rel_seed["skipped"]:
        lines.append(f"\n{len(rel_seed['skipped'])} pair(s) skipped (word or exact sense not found):")
        for reason in rel_seed["skipped"]:
            lines.append(f"- {reason}")
    lines.append("")

    lines.append("## Final state\n")
    lines.append(f"- Total words in the Physics Dictionary: {report['final_word_count']}")
    lines.append(f"- Total relationships: {report['final_relationship_count']} "
                  f"({report['relationship_count_before']} inherited from Common + "
                  f"{report['final_relationship_count'] - report['relationship_count_before']} "
                  "hand-curated for this domain)")
    return "\n".join(lines)


if __name__ == "__main__":
    report, physics_domain = run()
    text_report = _format_report(report)
    print(text_report)

    report_path = Path(__file__).resolve().parent / "physics_domain_seeding_report.md"
    report_path.write_text(text_report + "\n")
    print(f"\nReport written to {report_path}")

    # The example UI (assets/example_ui/dictionary_view_example.html) is
    # regenerated by definition_gap_vocabulary_seeding.py instead, not
    # here -- that script seeds this same Physics Domain and then adds
    # the definition-gap vocabulary pass on top, so it reflects the
    # fuller, more complete state. Regenerating it from this run alone
    # would silently regress it back to the pre-definition-gap content.
