from enum import Enum


class RegisterCode(Enum):
    """Values are numeric codes for use in a tensor, not string labels --
    same convention as PartOfSpeech and LinguisticUnitKind.

    Matches the Vocabulary Layer developer specification, 6.5."""

    FORMAL = 0
    INFORMAL = 1
    SLANG = 2
    TECHNICAL = 3
    LITERARY = 4
    COLLOQUIAL = 5
    VULGAR = 6
    NEUTRAL = 7
