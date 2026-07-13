from enum import Enum


class LinguisticUnitKind(Enum):
    """Values are the numeric codes this kind is stored as in
    LinguisticSystemPropertyTensor (Rule 14) -- .value is used directly
    as the tensor cell, not just a label."""

    Word = 0
    Punctuation = 1
    Clause = 2
    Sentence = 3
    Paragraph = 4
    Subject = 5
    UserPrompt = 6
