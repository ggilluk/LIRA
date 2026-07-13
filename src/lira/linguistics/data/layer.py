from ..role.graph_processor import GraphProcessor
from ..role.prompt_tokenizer import PromptTokenizer
from .grammar_configuration import LinguisticGrammarConfiguration
from .tensor import LinguisticSystemPropertyTensor
from .units import Subject, UserPrompt

# DictionaryProcessor (lira.vocabulary) is used only as a type hint here --
# see graph_processor.py for why it's deliberately left unimported.


class LinguisticsLayer:
    def __init__(self, dictionary_processor: "DictionaryProcessor", use_clause_segmentation: bool = True):
        """dictionary_processor: Vocabulary owns the lexicon (Rule 17);
        Linguistics resolves tokens through it rather than keeping its
        own copy (typically Domain.vocabulary.dictionary_processor)."""
        self.grammar_configuration = LinguisticGrammarConfiguration()
        self.tensor = LinguisticSystemPropertyTensor()  # persistent, canonical store for every unit's numeric fields (Rule 14)
        self.graph_processor = GraphProcessor(dictionary_processor, self.grammar_configuration, self.tensor, use_clause_segmentation)
        self.tokenizer = PromptTokenizer(self.graph_processor)

    def tokenize_prompt(self, prompt: UserPrompt) -> Subject:
        return self.tokenizer.tokenize_prompt(prompt)
