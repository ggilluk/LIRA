from dataclasses import dataclass, field
from typing import List

from .linguistic_unit import LinguisticUnit
from .sentence import Sentence


@dataclass
class Paragraph(LinguisticUnit):
    sentences: List[Sentence] = field(default_factory=list, kw_only=True)
