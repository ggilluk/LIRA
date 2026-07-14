"""UserPrompt: the artefact at the UI boundary -- raw user input, before
GraphProcessor has done anything to it."""

from dataclasses import dataclass

from ..data.linguistic_unit import LinguisticUnit


@dataclass
class UserPrompt(LinguisticUnit):
    pass
