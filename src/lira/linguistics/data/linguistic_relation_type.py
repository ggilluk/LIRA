from enum import Enum


class LinguisticRelationType(Enum):
    SYNONYM = "Synonym"
    ANTONYM = "Antonym"
    HYPONYM = "Hyponym"
    HYPERNYM = "Hypernym"
