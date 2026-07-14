from dataclasses import dataclass, field
from typing import Optional

from .linguistic_unit import LinguisticUnit

# PartOfSpeech (lira.vocabulary) is used only as a type hint here -- left
# unimported because Vocabulary's own modules import Linguistics's
# word.py/punctuation.py, and a top-level import here would form an
# import-time cycle between the two layers (same reasoning as
# GraphProcessor's DictionaryProcessor hint -- see graph_processor.py).


@dataclass
class Word(LinguisticUnit):
    part_of_speech: Optional["PartOfSpeech"] = field(default=None, kw_only=True)
    definition: Optional[str] = field(default=None, kw_only=True)
