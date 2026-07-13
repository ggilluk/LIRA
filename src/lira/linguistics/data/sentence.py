from dataclasses import dataclass, field
from typing import List, Optional

from .clause import Clause
from .linguistic_unit import LinguisticUnit


@dataclass
class Sentence(LinguisticUnit):
    clauses: List[Clause] = field(default_factory=list, kw_only=True)
    requires_punctuation: Optional[bool] = field(default=None, kw_only=True)
