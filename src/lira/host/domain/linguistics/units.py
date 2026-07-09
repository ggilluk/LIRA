"""Linguistics Layer artefacts: tokens, phrases, syntax and sentence
structures (Layer Summary: Linguistics Layer). Structure only, no
semantic qualification (Rule 18) -- the Knowledge Layer is the only
layer that assigns semantic meaning (Rule 20)."""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional


class LinguisticUnitKind(Enum):
    Word = 0
    Clause = 1
    Sentence = 2
    Paragraph = 3
    Subject = 4


@dataclass
class LinguisticUnit:
    text: str
    system_property: Optional["LinguisticSystemProperty"] = None


@dataclass
class Word(LinguisticUnit):
    pass


@dataclass
class Clause(LinguisticUnit):
    tokens: List[Word] = field(default_factory=list)


@dataclass
class Sentence(LinguisticUnit):
    clauses: List[Clause] = field(default_factory=list)


@dataclass
class Paragraph(LinguisticUnit):
    sentences: List[Sentence] = field(default_factory=list)


@dataclass
class Subject(LinguisticUnit):
    paragraphs: List[Paragraph] = field(default_factory=list)
