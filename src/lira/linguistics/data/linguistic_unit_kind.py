from enum import Enum


class LinguisticUnitKind(Enum):
    Word = "Word"
    Punctuation = "Punctuation"
    Clause = "Clause"
    Sentence = "Sentence"
    Paragraph = "Paragraph"
    Subject = "Subject"
    UserPrompt = "UserPrompt"
