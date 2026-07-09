"""Vocabulary Agents: agents responsible for term/lexeme-level concept
identity within a Domain (e.g. surface-form to concept resolution).
Concrete agents live as sibling modules in this package (Extensibility
principle: agents operate inside the layer whose artefacts they
manage -- Agents are not a separate layer, Rule 15)."""


class VocabularyAgent:
    def __init__(self, name: str):
        self.name = name

    def run(self, *args, **kwargs):
        raise NotImplementedError
