"""Linguistics Layer: agents handling grammar/syntax-level processing
(parsing, morphology) that feeds concept and relationship extraction."""


class LinguisticsAgent:
    def __init__(self, name: str):
        self.name = name

    def run(self, *args, **kwargs):
        raise NotImplementedError
