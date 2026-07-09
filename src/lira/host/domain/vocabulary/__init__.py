from .agents import VocabularyAgent


class VocabularyLayer:
    def __init__(self):
        self.agents: list[VocabularyAgent] = []

    def register(self, agent: VocabularyAgent):
        self.agents.append(agent)


__all__ = ["VocabularyLayer", "VocabularyAgent"]
