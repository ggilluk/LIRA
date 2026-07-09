"""Linguistics Agents: agents handling grammar/syntax-level processing
(parsing, morphology) that feeds concept and relationship extraction.
Concrete agents live as sibling modules in this package (Extensibility
principle: agents operate inside the layer whose artefacts they
manage -- Agents are not a separate layer, Rule 15)."""


class LinguisticsAgent:
    def __init__(self, name: str):
        self.name = name

    def run(self, *args, **kwargs):
        raise NotImplementedError
