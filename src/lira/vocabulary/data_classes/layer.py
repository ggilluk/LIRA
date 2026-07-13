from ..agents_role import VocabularyAgent


class VocabularyLayer:
    def __init__(self):
        self.agents: list[VocabularyAgent] = []

    def register(self, agent: VocabularyAgent):
        self.agents.append(agent)
