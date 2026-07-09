"""Linguistics Layer artefacts: tokens, phrases, syntax and sentence
structures (Layer Summary: Linguistics Layer)."""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional, Union


class LinguisticUnitKind(Enum):
    Word = "Word"
    Punctuation = "Punctuation"
    Clause = "Clause"
    Sentence = "Sentence"
    Paragraph = "Paragraph"
    Subject = "Subject"
    UserPrompt = "UserPrompt"


class PartOfSpeech(Enum):
    Noun = "Noun"
    Verb = "Verb"
    Adjective = "Adjective"
    Adverb = "Adverb"
    Pronoun = "Pronoun"
    Preposition = "Preposition"
    Conjunction = "Conjunction"
    Interjection = "Interjection"
    Determiner = "Determiner"


class LinguisticRelationType(Enum):
    SYNONYM = "Synonym"
    ANTONYM = "Antonym"
    HYPONYM = "Hyponym"
    HYPERNYM = "Hypernym"


@dataclass
class LinguisticUnit:
    text: str
    system_property: Optional["LinguisticSystemProperty"] = None


@dataclass
class UserPrompt(LinguisticUnit):
    pass


@dataclass
class Word(LinguisticUnit):
    part_of_speech: Optional[PartOfSpeech] = field(default=None, kw_only=True)
    definition: Optional[str] = field(default=None, kw_only=True)


@dataclass
class Punctuation(LinguisticUnit):
    symbol: Optional[str] = field(default=None, kw_only=True)


@dataclass
class Clause(LinguisticUnit):
    tokens: List[Union[Word, Punctuation]] = field(default_factory=list, kw_only=True)
    is_independent: Optional[bool] = field(default=True, kw_only=True)


@dataclass
class Sentence(LinguisticUnit):
    clauses: List[Clause] = field(default_factory=list, kw_only=True)
    requires_punctuation: Optional[bool] = field(default=None, kw_only=True)


@dataclass
class Paragraph(LinguisticUnit):
    sentences: List[Sentence] = field(default_factory=list, kw_only=True)


@dataclass
class Subject(LinguisticUnit):
    paragraphs: List[Paragraph] = field(default_factory=list, kw_only=True)
