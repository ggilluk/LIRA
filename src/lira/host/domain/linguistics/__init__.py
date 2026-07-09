from .agents import LinguisticsAgent


class LinguisticsLayer:
    def __init__(self):
        self.agents: list[LinguisticsAgent] = []

    def register(self, agent: LinguisticsAgent):
        self.agents.append(agent)


__all__ = ["LinguisticsLayer", "LinguisticsAgent"]
