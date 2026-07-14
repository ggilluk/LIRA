"""A single lexicon record: the word/punctuation unit it describes, its
meaning, and its possible parts of speech."""

from dataclasses import dataclass, field
from typing import List, Union

from lira.linguistics.data.punctuation import Punctuation
from lira.linguistics.data.word import Word
from lira.value_objects import Text

from .part_of_speech import PartOfSpeech


@dataclass
class DictionaryEntry:
    unit: Union[Word, Punctuation]
    meaning: Text
    parts_of_speech: List[PartOfSpeech] = field(default_factory=list)
    is_fully_hydrated: bool = True
