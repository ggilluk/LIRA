"""Translates an external dictionary API response into LIRA vocabulary
candidates, insulating core engine data structures against external
JSON schema breakage. Returns every grammatical category the external
source actually supports for the surface form -- never just the first
meaning, and never a fallback NOUN guess when the source gives no
usable evidence: an entry this adapter can't confidently classify
against a real PartOfSpeech member is dropped, not defaulted."""

import re
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple

from lira.value_objects import Code, Identifier, Text

from ..data.external_word_candidate import ExternalWordCandidate
from ..data.part_of_speech import PartOfSpeech
from ..data.source_reference import SourceReference
from ..data.word_lookup_context import WordLookupContext

_EXTERNAL_POS_NAMES = {
    "noun": PartOfSpeech.NOUN,
    "verb": PartOfSpeech.VERB,
    "adjective": PartOfSpeech.ADJECTIVE,
    "adverb": PartOfSpeech.ADVERB,
    "pronoun": PartOfSpeech.PRONOUN,
    "determiner": PartOfSpeech.DETERMINER,
    "preposition": PartOfSpeech.PREPOSITION,
    "conjunction": PartOfSpeech.CONJUNCTION,
    "interjection": PartOfSpeech.INTERJECTION,
    "numeral": PartOfSpeech.NUMERAL,
    "particle": PartOfSpeech.PARTICLE,
    "auxiliary": PartOfSpeech.AUXILIARY,
    "proper noun": PartOfSpeech.PROPER_NOUN,
    "symbol": PartOfSpeech.SYMBOL,
}


class ExternalDictionaryAdapter:
    @classmethod
    def parse_api_payload(cls, payload: Any, context: WordLookupContext, source_uri: str) -> Tuple[ExternalWordCandidate, ...]:
        if not isinstance(payload, list):
            return ()

        candidates: List[ExternalWordCandidate] = []

        for entry in payload:
            if not isinstance(entry, dict):
                continue

            source_word = str(entry.get("word", context.raw_text)).strip()

            meanings = entry.get("meanings", ())
            if not isinstance(meanings, list):
                continue

            for meaning in meanings:
                candidate = cls._parse_meaning(
                    meaning=meaning,
                    source_word=source_word,
                    context=context,
                    source_uri=source_uri,
                )
                if candidate is not None:
                    candidates.append(candidate)

        return cls._deduplicate(candidates)

    @classmethod
    def _parse_meaning(cls, meaning: Any, source_word: str, context: WordLookupContext, source_uri: str) -> Optional[ExternalWordCandidate]:
        if not isinstance(meaning, dict):
            return None

        raw_part_of_speech = str(meaning.get("partOfSpeech", "")).strip().lower()
        part_of_speech = _EXTERNAL_POS_NAMES.get(raw_part_of_speech)
        if part_of_speech is None:
            # No fallback NOUN here -- an entry this adapter can't map
            # to a real PartOfSpeech member is dropped, not guessed at.
            return None

        definitions = meaning.get("definitions", ())
        if not isinstance(definitions, list):
            definitions = ()

        first_definition = next(
            (definition for definition in definitions if isinstance(definition, dict) and definition.get("definition")),
            None,
        )
        definition_text = Text(value=str(first_definition["definition"])) if first_definition else None

        usage_notes = tuple(
            Text(value=str(definition["example"]))
            for definition in definitions
            if isinstance(definition, dict) and definition.get("example")
        )

        domain_relevance = cls._calculate_domain_relevance(
            definition=definition_text.value if definition_text is not None else "",
            domain_name=context.domain_name,
            surrounding_words=(*context.preceding_words, *context.following_words),
        )

        source_reference = SourceReference(
            source_name=Text(value="Free Dictionary API"),
            external_identifier=Identifier(value=f"{source_word}:{raw_part_of_speech}"),
            reference_uri=Identifier(value=source_uri),
        )

        return ExternalWordCandidate(
            text=context.raw_text,
            lexical_form=context.normalised_text,
            normalised_form=context.normalised_text,
            language_code=Code(value="en"),
            part_of_speech=part_of_speech,
            definition=definition_text,
            usage_notes=usage_notes,
            domain_relevance=domain_relevance,
            source_confidence=0.85,
            source_references=(source_reference,),
        )

    @staticmethod
    def _word_terms(text: str) -> Set[str]:
        """Lowercased word tokens, stripped of surrounding punctuation
        (a definition's final word carries a trailing period more often
        than not) and split on hyphens, so "gas-fired" contributes both
        "gas" and "fired" the same way a compound domain name does."""
        return set(re.findall(r"[^\W_]+", text.casefold().replace("-", " ")))

    @classmethod
    def _calculate_domain_relevance(cls, definition: str, domain_name: str, surrounding_words: Iterable[str]) -> float:
        """Simple deterministic ranking only. The domain hint ranks
        externally returned dictionary senses (e.g. "plant" + "Energy
        Power Generation" should rank the power-station sense above the
        biological one); it never invents a new definition or POS, and
        every sense the source actually supports is still returned by
        parse_api_payload -- ranking, not filtering."""
        definition_terms = cls._word_terms(definition)
        domain_terms = cls._word_terms(domain_name)
        context_terms = {term for word in surrounding_words for term in cls._word_terms(word)}

        domain_overlap = len(definition_terms.intersection(domain_terms))
        context_overlap = len(definition_terms.intersection(context_terms))

        score = 0.25 + min(0.50, domain_overlap * 0.15) + min(0.25, context_overlap * 0.10)

        return min(1.0, score)

    @staticmethod
    def _deduplicate(candidates: Iterable[ExternalWordCandidate]) -> Tuple[ExternalWordCandidate, ...]:
        """One candidate per grammatical category -- LIRA models
        different POS as separate Word records, but not a same-form/
        same-POS meaning conflict (that needs explicit sense handling,
        see DictionaryProcessor.register_conflicting_sense), so within
        one external POS category only the highest-ranked candidate
        survives."""
        best_by_category: Dict[PartOfSpeech, ExternalWordCandidate] = {}

        for candidate in candidates:
            existing = best_by_category.get(candidate.part_of_speech)
            if existing is None or candidate.combined_confidence > existing.combined_confidence:
                best_by_category[candidate.part_of_speech] = candidate

        return tuple(sorted(best_by_category.values(), key=lambda candidate: candidate.combined_confidence, reverse=True))
