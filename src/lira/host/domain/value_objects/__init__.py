from .agents import ValueObjectAgent


class ValueObjectsLayer:
    def __init__(self):
        self.agents: list[ValueObjectAgent] = []

    def register(self, agent: ValueObjectAgent):
        self.agents.append(agent)


__all__ = ["ValueObjectsLayer", "ValueObjectAgent"]
