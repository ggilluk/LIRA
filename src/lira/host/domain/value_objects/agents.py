"""Value Objects Layer: agents responsible for parsing and normalising
primitive values (measures, quantities, codes, identifiers, dates) into
typed ValueTypeKind instances before they enter the Knowledge Layer."""


class ValueObjectAgent:
    def __init__(self, name: str):
        self.name = name

    def run(self, *args, **kwargs):
        raise NotImplementedError
