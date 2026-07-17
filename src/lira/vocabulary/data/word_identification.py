"""Represents one candidate resolution of a raw token occurrence to a
grammatical category -- never a guess. DictionaryProcessor.identify_word
returns zero or more of these; zero means the occurrence has no
resolved sense yet (external hydration has been queued, not that the
occurrence is a NOUN by default). This is what lets the Vocabulary
Layer stop pretending an unresolved occurrence has already been
classified (see vocabulary/documentation/README.md)."""

from dataclasses import dataclass
from enum import Enum
from typing import Optional

from .part_of_speech import PartOfSpeech
from .word import Word


class IdentificationSource(Enum):
    SEEDED_VOCABULARY = "seeded_vocabulary"
    ORTHOGRAPHIC_EVIDENCE = "orthographic_evidence"
    EXTERNAL_REFERENCE = "external_reference"


@dataclass(frozen=True)
class WordIdentification:
    word: Optional[Word]
    part_of_speech: PartOfSpeech
    source: IdentificationSource
    confidence: float
    reason: str
