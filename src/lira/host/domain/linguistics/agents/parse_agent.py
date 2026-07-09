"""Parses a run of Word tokens into a Clause (Layer Summary: Linguistics Layer)."""

from . import LinguisticsAgent
from ..system_property import LinguisticSystemProperty
from ..tensor import LinguisticSystemPropertyTensor
from ..units import Clause, LinguisticUnitKind, Word


class ParseAgent(LinguisticsAgent):
    def __init__(self, name: str, store: LinguisticSystemPropertyTensor):
        super().__init__(name)
        self.store = store

    def run(self, text: str, tokens: list[Word], sequence_number: int = 0) -> Clause:
        row = self.store.allocate_row(LinguisticUnitKind.Clause, sequence_number)
        return Clause(text=text, tokens=tokens, system_property=LinguisticSystemProperty(self.store, row))
