from ..agents import VocabularyAgent
from ..role.dictionary_hydrator import AsyncDictionaryHydrator
from ..role.dictionary_processor import DictionaryProcessor
from .dictionary import Dictionary


class VocabularyLayer:
    def __init__(self):
        self.agents: list[VocabularyAgent] = []
        self.dictionary = Dictionary()  # the lexicon -- lexical inventory only (Rule 17)
        self.hydrator = AsyncDictionaryHydrator(self.dictionary)  # starts a background hydration thread
        self.dictionary_processor = DictionaryProcessor(self.dictionary, self.hydrator)

    def register(self, agent: VocabularyAgent):
        self.agents.append(agent)
