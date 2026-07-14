"""Insulates core engine data structures against external JSON schema breakage."""

from typing import Any, Tuple

from lira.value_objects import Text

from ..data.part_of_speech import PartOfSpeech


class ExternalDictionaryAdapter:
    @staticmethod
    def parse_api_payload(payload: Any) -> Tuple[Text, PartOfSpeech]:
        fallback_meaning = "Dynamically discovered via runtime prompt parsing."
        fallback_pos = PartOfSpeech.NOUN

        if not payload or not isinstance(payload, list) or len(payload) == 0:
            return Text(value=fallback_meaning), fallback_pos

        first_entry = payload[0]
        if not isinstance(first_entry, dict):
            return Text(value=fallback_meaning), fallback_pos

        meanings = first_entry.get("meanings", [])
        if not meanings or not isinstance(meanings, list) or len(meanings) == 0:
            return Text(value=fallback_meaning), fallback_pos

        first_meaning = meanings[0]
        if not isinstance(first_meaning, dict):
            return Text(value=fallback_meaning), fallback_pos

        raw_pos = str(first_meaning.get("partOfSpeech", "")).strip().upper()
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

        return Text(value=meaning_text), matched_pos
