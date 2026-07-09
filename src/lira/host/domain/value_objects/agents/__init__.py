"""Value Object Agents: agents responsible for parsing and normalising
primitive values (measures, quantities, codes, identifiers, dates) into
typed ValueTypeKind instances before they enter the Knowledge Layer.
Concrete agents live as sibling modules in this package (Extensibility
principle: agents operate inside the layer whose artefacts they
manage -- Agents are not a separate layer, Rule 15)."""


class ValueObjectAgent:
    def __init__(self, name: str):
        self.name = name

    def run(self, *args, **kwargs):
        raise NotImplementedError
