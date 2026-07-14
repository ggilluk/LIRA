from dataclasses import dataclass, field
from typing import List, Optional, Union

from .linguistic_unit import LinguisticUnit

# Word, Punctuation (lira.vocabulary) are used only as type hints here --
# left unimported because Vocabulary's own modules import this tree's
# LinguisticUnit base, and a top-level import here would form an
# import-time cycle between the two layers (same reasoning as
# GraphProcessor's DictionaryProcessor hint -- see graph_processor.py).


@dataclass
class Clause(LinguisticUnit):
    tokens: List[Union["Word", "Punctuation"]] = field(default_factory=list, kw_only=True)
    is_independent: Optional[bool] = field(default=True, kw_only=True)
