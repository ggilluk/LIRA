"""Linguistics Layer read path verification runner --
`Phrase.read()`/`Clause.read()`/`Sentence.read()` (see
linguistics/documentation/README.md for the full developer specification
this exercises).

Drives the read path exclusively through LinguisticController.read_sentence
-- the same public entry point linguistics/__init__.py exports -- against
a live Common Domain (LIRAHost), never a mock or a hand-built
ReadingContext, so this is exactly what any real caller gets.

Precondition pass: reports every corpus token's seeded status up front,
against the live Dictionary, before any assertion runs (Linguistics
Layer developer specification 23's own rule: a test must not silently
assume a word is seeded or unseeded).

Corpus A (linguistics_sentence_reading_corpus.CORPUS_A_UNSEEDED_WORD_SENTENCES):
asserts spec 7's unknown-word behaviour against whatever the live
Dictionary actually reports as unseeded for each sentence -- not a
hard-coded guess.

Corpus B (linguistics_sentence_reading_corpus.CORPUS_B_CONTROL_SENTENCES):
asserts full valid/invalid readings with correct contextual part-of-
speech selection, phrase-internal coordination, and the spec 20 "valid
phrases, invalid clause" shape, against sentences verified word-by-word
seeded before inclusion.

Run: python3 examples/linguistics_sentence_reading.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from linguistics_sentence_reading_corpus import (  # noqa: E402
    CORPUS_A_UNSEEDED_WORD_SENTENCES,
    CORPUS_B_CONTROL_SENTENCES,
)

from lira.knowledge.data.host import LIRAHost  # noqa: E402
from lira.linguistics import ReadingErrorKind, ValidationOutcome  # noqa: E402


def _phrase_words(phrase):
    return [w.text for w in phrase.words] if phrase is not None else None


def _unknown_error_texts(sentence):
    return {e.token_text for e in sentence.errors if e.kind == ReadingErrorKind.UNKNOWN_VOCABULARY_WORD}


def run_precondition_pass(host, sentences, report):
    common = host.get_or_create_domain("Common")
    dp = common.vocabulary.dictionary_processor
    seen = {}
    for text in sentences:
        tokens = common.linguistics.reading_context.token_resolver.resolve_sentence(text)
        for token in tokens:
            if token.text in seen or token.is_punctuation:
                continue
            seen[token.text] = tuple(c.part_of_speech.name for c in token.candidates)
    report.append("| Token | Seeded parts of speech |")
    report.append("|---|---|")
    for text in sorted(seen, key=str.lower):
        pos = seen[text]
        report.append(f"| {text} | {', '.join(pos) if pos else '_(unseeded)_'} |")
    return seen


def run_corpus_a(host, report):
    common = host.get_or_create_domain("Common")
    lc = common.linguistics
    failures = []
    report.append("\n## Corpus A -- unseeded-word behaviour (spec 7)\n")
    report.append("| Sentence | Unseeded tokens (live) | Validation | Unknown-word errors match? |")
    report.append("|---|---|---|---|")

    for text in CORPUS_A_UNSEEDED_WORD_SENTENCES:
        tokens = lc.reading_context.token_resolver.resolve_sentence(text)
        expected_unseeded = {t.text for t in tokens if not t.is_known and not t.is_punctuation}
        sentence = lc.read_sentence(text)
        actual_unknown = _unknown_error_texts(sentence)

        errors_match = actual_unknown == expected_unseeded
        if not errors_match:
            failures.append(
                f'"{text}": expected UNKNOWN_VOCABULARY_WORD for {sorted(expected_unseeded)}, got {sorted(actual_unknown)}'
            )
        if expected_unseeded and sentence.validation == ValidationOutcome.VALID:
            failures.append(f'"{text}": has unseeded tokens {sorted(expected_unseeded)} but Sentence.read() reported VALID')
        if not expected_unseeded and actual_unknown:
            failures.append(f'"{text}": no unseeded tokens found live, but got unknown-word errors for {sorted(actual_unknown)}')

        report.append(
            f"| {text} | {', '.join(sorted(expected_unseeded)) or '_(none)_'} | {sentence.validation.name} | {'yes' if errors_match else '**NO**'} |"
        )
    return failures


_CORPUS_B_EXPECTATIONS = {
    "A meaning is a representation.": dict(
        validation=ValidationOutcome.VALID, subject=["A", "meaning"], predicate=["is"], complement=["a", "representation"],
    ),
    "The word over the meaning.": dict(
        validation=ValidationOutcome.INVALID, subject=["The", "word"], predicate=None,
        required_error=ReadingErrorKind.MISSING_PREDICATE,
    ),
    "The use is a state.": dict(
        validation=ValidationOutcome.VALID, subject=["The", "use"], predicate=["is"], complement=["a", "state"],
    ),
    "The word wants to use the meaning.": dict(
        validation=ValidationOutcome.VALID, subject=["The", "word"], predicate=["wants"], object=["the", "meaning"],
        modifier_words=["to", "use"],
    ),
    "The meaning and the word perceive the state.": dict(
        validation=ValidationOutcome.VALID, subject=["The", "meaning", "and", "the", "word"],
        predicate=["perceive"], object=["the", "state"],
    ),
    "A meaning is in the word.": dict(
        validation=ValidationOutcome.VALID, subject=["A", "meaning"], predicate=["is"],
        modifier_words=["in", "the", "word"],
    ),
}


def run_corpus_b(host, report):
    common = host.get_or_create_domain("Common")
    lc = common.linguistics
    failures = []
    report.append("\n## Corpus B -- fully-seeded control corpus\n")
    report.append("| Sentence | Construct | Validation | Subject | Predicate |")
    report.append("|---|---|---|---|---|")

    for text, construct in CORPUS_B_CONTROL_SENTENCES:
        expectation = _CORPUS_B_EXPECTATIONS[text]
        sentence = lc.read_sentence(text)
        clause = sentence.clauses[0]

        if sentence.validation != expectation["validation"]:
            failures.append(f'"{text}": expected validation {expectation["validation"].name}, got {sentence.validation.name}')
        if "subject" in expectation and _phrase_words(clause.subject) != expectation["subject"]:
            failures.append(f'"{text}": expected subject {expectation["subject"]}, got {_phrase_words(clause.subject)}')
        if "predicate" in expectation and _phrase_words(clause.predicate) != expectation["predicate"]:
            failures.append(f'"{text}": expected predicate {expectation["predicate"]}, got {_phrase_words(clause.predicate)}')
        if "complement" in expectation and _phrase_words(clause.complement) != expectation["complement"]:
            failures.append(f'"{text}": expected complement {expectation["complement"]}, got {_phrase_words(clause.complement)}')
        if "object" in expectation and _phrase_words(clause.object) != expectation["object"]:
            failures.append(f'"{text}": expected object {expectation["object"]}, got {_phrase_words(clause.object)}')
        if "modifier_words" in expectation:
            modifier_word_lists = [_phrase_words(m) for m in clause.modifiers]
            if expectation["modifier_words"] not in modifier_word_lists:
                failures.append(f'"{text}": expected a modifier {expectation["modifier_words"]}, got {modifier_word_lists}')
        if "required_error" in expectation and not any(e.kind == expectation["required_error"] for e in sentence.errors):
            failures.append(f'"{text}": expected a {expectation["required_error"].name} error, got {[e.kind.name for e in sentence.errors]}')

        report.append(
            f"| {text} | {construct} | {sentence.validation.name} | "
            f"{' '.join(_phrase_words(clause.subject) or [])} | {' '.join(_phrase_words(clause.predicate) or [])} |"
        )
    return failures


def run_dictionary_untouched_check(host, report):
    """spec 24: resolving an ambiguous word for one reading must not
    disturb Dictionary.lookup_all's own candidate set for that lexical
    form -- Sentence.read() only ever copies a Word (materialise_token,
    same as the write path's process_token), never mutates the seeded
    entry itself."""
    common = host.get_or_create_domain("Common")
    dp = common.vocabulary.dictionary_processor
    before = dp.dictionary.lookup_all("is")
    common.linguistics.read_sentence("The use is a state.")
    after = dp.dictionary.lookup_all("is")
    ok = tuple(w.part_of_speech for w in before) == tuple(w.part_of_speech for w in after) and len(before) == len(after)
    report.append("\n## Dictionary untouched by reading (spec 24)\n")
    report.append(f"`Dictionary.lookup_all(\"is\")` candidates before: {len(before)}, after: {len(after)} -- {'unchanged' if ok else '**CHANGED**'}")
    return [] if ok else ['Dictionary.lookup_all("is") changed after Sentence.read()']


def main():
    host = LIRAHost("LinguisticsSentenceReadingVerification")
    report = ["# Linguistics Layer Read Path Verification Report\n"]

    report.append("## Precondition pass -- live seeded status of every corpus token\n")
    all_sentences = CORPUS_A_UNSEEDED_WORD_SENTENCES + [text for text, _ in CORPUS_B_CONTROL_SENTENCES]
    run_precondition_pass(host, all_sentences, report)

    failures = []
    failures += run_corpus_a(host, report)
    failures += run_corpus_b(host, report)
    failures += run_dictionary_untouched_check(host, report)

    report.append("\n## Result\n")
    if failures:
        report.append(f"**{len(failures)} FAILURE(S):**\n")
        for failure in failures:
            report.append(f"- {failure}")
    else:
        report.append("All assertions passed.")

    report_text = "\n".join(report)
    report_path = Path(__file__).resolve().parent / "linguistics_sentence_reading_report.md"
    report_path.write_text(report_text + "\n")
    print(report_text)
    print(f"\nReport written to {report_path}")

    if failures:
        sys.exit(1)


if __name__ == "__main__":
    main()
