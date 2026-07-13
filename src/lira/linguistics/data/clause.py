from dataclasses import dataclass, field
from typing import List, Optional, Union

from .linguistic_unit import LinguisticUnit
from .punctuation import Punctuation
from .word import Word


@dataclass
class Clause(LinguisticUnit):
    tokens: List[Union[Word, Punctuation]] = field(default_factory=list, kw_only=True)
    is_independent: Optional[bool] = field(default=True, kw_only=True)
