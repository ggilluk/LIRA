"""Knowledge Layer: agents that operate over the Domain's tensor-native
LiraGraph -- attribute completion, generalisation discovery,
compartmentalisation, cross-domain generalisation, output attribute
completion (Bands 1-5)."""


class KnowledgeAgent:
    def __init__(self, name: str):
        self.name = name

    def run(self, *args, **kwargs):
        raise NotImplementedError
