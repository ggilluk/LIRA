from ..agents import VocabularyAgent
from ..role.dictionary_hydrator import AsyncDictionaryHydrator
from ..role.dictionary_processor import DictionaryProcessor
from ..role.lexical_relationship_processor import LexicalRelationshipProcessor
from .dictionary import Dictionary
from .lexical_relationship_store import LexicalRelationshipStore
from .lexical_relationship_tensor import LexicalRelationshipSystemPropertyTensor


class VocabularyLayer:
    def __init__(self, domain_name: str):
        self.agents: list[VocabularyAgent] = []
        self.dictionary = Dictionary()  # the lexicon -- lexical inventory only (Rule 17)
        self.hydrator = AsyncDictionaryHydrator(self.dictionary)  # starts a background hydration thread
        # domain_name is a lookup hint for external hydration (ranks,
        # never proves, which externally-supported sense applies --
        # DictionaryProcessor.identify_word, ExternalDictionaryAdapter),
        # not a new piece of Domain state duplicated here.
        self.dictionary_processor = DictionaryProcessor(self.dictionary, self.hydrator, domain_name=domain_name)

        self.lexical_relationships = LexicalRelationshipStore()
        self.lexical_relationship_tensor = LexicalRelationshipSystemPropertyTensor()  # Design Principle 8
        self.lexical_relationship_processor = LexicalRelationshipProcessor(
            self.lexical_relationships, self.lexical_relationship_tensor
        )

    def register(self, agent: VocabularyAgent):
        self.agents.append(agent)
