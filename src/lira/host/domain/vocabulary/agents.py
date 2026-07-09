"""Vocabulary Layer: agents responsible for term/lexeme-level concept
identity within a Domain (e.g. surface-form to concept resolution)."""


class VocabularyAgent:
    def __init__(self, name: str):
        self.name = name

    def run(self, *args, **kwargs):
        raise NotImplementedError
