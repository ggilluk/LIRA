"""One externally-sourced grammatical-category candidate for a lexical
form, parsed from an external dictionary API response
(ExternalDictionaryAdapter) before it becomes a Word. Field set
mirrors what Word already supports (definition, gloss, usage_notes,
source_references, ...) rather than introducing an unrelated schema --
see Word's own field set (vocabulary/data/word.py)."""

from dataclasses import dataclass
from typing import Optional, Tuple

from lira.value_objects import Code, Text

from .part_of_speech import PartOfSpeech
from .source_reference import SourceReference


@dataclass(frozen=True)
class ExternalWordCandidate:
    text: str
    lexical_form: str
    normalised_form: str
    language_code: Code
    part_of_speech: PartOfSpeech

    definition: Optional[Text] = None
    gloss: Optional[Text] = None
    usage_notes: Tuple[Text, ...] = ()

    domain_concept: Optional[Text] = None
    domain_relevance: float = 0.0
    source_confidence: float = 0.0

    source_references: Tuple[SourceReference, ...] = ()

    @property
    def combined_confidence(self) -> float:
        # The domain hint ranks candidates the external source already
        # supports; it never manufactures confidence on its own --
        # source_confidence always carries the majority weight.
        return min(1.0, (self.source_confidence * 0.65) + (self.domain_relevance * 0.35))
