"""Tokenises text into Word units (Layer Summary: Linguistics Layer)."""

from . import LinguisticsAgent
from ..system_property import LinguisticSystemProperty
from ..tensor import LinguisticSystemPropertyTensor
from ..units import LinguisticUnitKind, Word


class TokeniseAgent(LinguisticsAgent):
    def __init__(self, name: str, store: LinguisticSystemPropertyTensor):
        super().__init__(name)
        self.store = store

    def run(self, text: str) -> list[Word]:
        words = []
        for sequence_number, token in enumerate(text.split()):
            row = self.store.allocate_row(LinguisticUnitKind.Word, sequence_number)
            words.append(Word(text=token, system_property=LinguisticSystemProperty(self.store, row)))
        return words
