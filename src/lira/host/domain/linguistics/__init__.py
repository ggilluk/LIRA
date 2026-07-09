"""Linguistics Layer: grammar/syntax-level processing (parsing,
morphology) that feeds concept and relationship extraction. Contains
language structure only (Rule 18) -- Tokens, phrases, syntax, sentence
structures (Layer Summary: Linguistics Layer)."""

from .agents import LinguisticsAgent
from .system_property import LinguisticSystemProperty
from .tensor import LinguisticSystemPropertyTensor
from .units import Clause, LinguisticUnit, LinguisticUnitKind, Paragraph, Sentence, Subject, Word


class LinguisticsLayer:
    def __init__(self):
        self.tensor = LinguisticSystemPropertyTensor()  # persistent store for Word/Clause/Sentence/Paragraph/Subject rows
        self.agents: list[LinguisticsAgent] = []

    def register(self, agent: LinguisticsAgent):
        self.agents.append(agent)


__all__ = [
    "LinguisticsLayer",
    "LinguisticsAgent",
    "LinguisticSystemPropertyTensor",
    "LinguisticSystemProperty",
    "LinguisticUnitKind",
    "LinguisticUnit",
    "Word",
    "Clause",
    "Sentence",
    "Paragraph",
    "Subject",
]
