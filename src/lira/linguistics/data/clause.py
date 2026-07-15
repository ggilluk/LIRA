from dataclasses import dataclass, field
from typing import List, Optional

from .linguistic_unit import LinguisticUnit

# Word (lira.vocabulary) is used only as a type hint here -- left
# unimported because Vocabulary's own modules import this tree's
# LinguisticUnit base, and a top-level import here would form an
# import-time cycle between the two layers (same reasoning as
# GraphProcessor's DictionaryProcessor hint -- see graph_processor.py).
# Punctuation is a Word (part_of_speech=PUNCTUATION), not a separate
# type, so tokens is uniformly List["Word"].


@dataclass
class Clause(LinguisticUnit):
    tokens: List["Word"] = field(default_factory=list, kw_only=True)
    is_independent: Optional[bool] = field(default=True, kw_only=True)
