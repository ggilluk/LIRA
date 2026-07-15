from enum import Enum


class LinguisticUnitKind(Enum):
    """Values are the numeric codes this kind is stored as in
    LinguisticSystemPropertyTensor (Rule 14) -- .value is used directly
    as the tensor cell, not just a label.

    Word and Punctuation are both Vocabulary's Word class at the Python
    type level (a punctuation mark is a Word with
    part_of_speech=PartOfSpeech.PUNCTUATION, not a separate class) --
    GraphProcessor.process_token still tags a token's tensor row with
    the Punctuation kind rather than Word when that's the case, derived
    from part_of_speech instead of an isinstance check."""

    Word = 0
    Punctuation = 1
    Clause = 2
    Sentence = 3
    Paragraph = 4
    Subject = 5
    UserPrompt = 6
