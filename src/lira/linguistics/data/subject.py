from dataclasses import dataclass, field
from typing import List

from .linguistic_unit import LinguisticUnit
from .paragraph import Paragraph


@dataclass
class Subject(LinguisticUnit):
    paragraphs: List[Paragraph] = field(default_factory=list, kw_only=True)
