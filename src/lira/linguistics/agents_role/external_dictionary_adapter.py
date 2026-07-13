"""Insulates core engine data structures against external JSON schema breakage."""

from typing import Any, Tuple

from ..data_classes.units import PartOfSpeech


class ExternalDictionaryAdapter:
    @staticmethod
    def parse_api_payload(payload: Any) -> Tuple[str, PartOfSpeech]:
        fallback_meaning = "Dynamically discovered via runtime prompt parsing."
        fallback_pos = PartOfSpeech.Noun

        if not payload or not isinstance(payload, list) or len(payload) == 0:
            return fallback_meaning, fallback_pos

        first_entry = payload[0]
        if not isinstance(first_entry, dict):
            return fallback_meaning, fallback_pos

        meanings = first_entry.get("meanings", [])
        if not meanings or not isinstance(meanings, list) or len(meanings) == 0:
            return fallback_meaning, fallback_pos

        first_meaning = meanings[0]
        if not isinstance(first_meaning, dict):
            return fallback_meaning, fallback_pos

        raw_pos = str(first_meaning.get("partOfSpeech", "")).strip().capitalize()
        matched_pos = fallback_pos
        for pos in PartOfSpeech:
            if pos.name == raw_pos:
                matched_pos = pos
                break

        definitions = first_meaning.get("definitions", [])
        meaning_text = fallback_meaning
        if definitions and isinstance(definitions, list) and len(definitions) > 0:
            first_def_block = definitions[0]
            if isinstance(first_def_block, dict):
                meaning_text = first_def_block.get("definition", fallback_meaning)

        return meaning_text, matched_pos
