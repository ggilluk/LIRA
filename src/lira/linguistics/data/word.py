from dataclasses import dataclass, field
from typing import Optional

from .linguistic_unit import LinguisticUnit
from .part_of_speech import PartOfSpeech


@dataclass
class Word(LinguisticUnit):
    part_of_speech: Optional[PartOfSpeech] = field(default=None, kw_only=True)
    definition: Optional[str] = field(default=None, kw_only=True)
