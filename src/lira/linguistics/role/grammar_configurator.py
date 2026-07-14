"""Decouples linguistic configuration parameters from core processing
logic. GrammarConfigurator is the role LinguisticLexer and
ClauseSegmentationUtility consult for the grammar rules (conjunctions,
delimiters, sentence-abbreviation exceptions) that drive their
decisions -- not a passive data record, the thing those two roles are
configured by."""

from dataclasses import dataclass, field
from typing import Set


@dataclass
class GrammarConfigurator:
    coordinating_conjunctions: Set[str] = field(
        default_factory=lambda: {"and", "but", "or", "so", "yet", "for"}
    )
    clause_delimiters: Set[str] = field(
        default_factory=lambda: {","}
    )
    sentence_abbreviation_exceptions: str = r'(?<!\bDr)(?<!\bEd)(?<!\bJan)(?<!\bU\.S)'
