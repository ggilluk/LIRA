"""Decouples linguistic configuration parameters from core processing logic."""

from dataclasses import dataclass, field
from typing import Set


@dataclass
class LinguisticGrammarConfiguration:
    coordinating_conjunctions: Set[str] = field(
        default_factory=lambda: {"and", "but", "or", "so", "yet", "for"}
    )
    clause_delimiters: Set[str] = field(
        default_factory=lambda: {","}
    )
    sentence_abbreviation_exceptions: str = r'(?<!\bDr)(?<!\bEd)(?<!\bJan)(?<!\bU\.S)'
