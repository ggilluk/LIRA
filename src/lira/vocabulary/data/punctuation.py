from dataclasses import dataclass, field
from typing import Optional

from lira.linguistics.data.linguistic_unit import LinguisticUnit


@dataclass
class Punctuation(LinguisticUnit):
    symbol: Optional[str] = field(default=None, kw_only=True)
