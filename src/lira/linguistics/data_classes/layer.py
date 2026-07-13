from ..agents_role.dictionary_processor import DictionaryProcessor
from ..agents_role.dictionary_hydrator import AsyncDictionaryHydrator
from ..agents_role.graph_processor import GraphProcessor
from ..agents_role.prompt_tokenizer import PromptTokenizer
from .dictionary import Dictionary
from .grammar_configuration import LinguisticGrammarConfiguration
from .tensor import LinguisticSystemPropertyTensor
from .units import Subject, UserPrompt


class LinguisticsLayer:
    def __init__(self, use_clause_segmentation: bool = True):
        self.grammar_configuration = LinguisticGrammarConfiguration()
        self.dictionary = Dictionary()
        self.hydrator = AsyncDictionaryHydrator(self.dictionary)  # starts a background hydration thread
        self.dictionary_processor = DictionaryProcessor(self.dictionary, self.hydrator)
        self.tensor = LinguisticSystemPropertyTensor()  # persistent, canonical store for every unit's numeric fields (Rule 14)
        self.graph_processor = GraphProcessor(self.dictionary_processor, self.grammar_configuration, self.tensor, use_clause_segmentation)
        self.tokenizer = PromptTokenizer(self.graph_processor)

    def tokenize_prompt(self, prompt: UserPrompt) -> Subject:
        return self.tokenizer.tokenize_prompt(prompt)
