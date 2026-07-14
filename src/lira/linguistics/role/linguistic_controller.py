from .graph_processor import GraphProcessor
from .grammar_configurator import GrammarConfigurator
from .prompt_tokenizer import PromptTokenizer
from ..data.tensor import LinguisticSystemPropertyTensor
from ..data.subject import Subject
from ..ui.user_prompt import UserPrompt

# DictionaryProcessor (lira.vocabulary) is used only as a type hint here --
# see graph_processor.py for why it's deliberately left unimported.


class LinguisticController:
    def __init__(self, dictionary_processor: "DictionaryProcessor", use_clause_segmentation: bool = True):
        """dictionary_processor: Vocabulary owns the lexicon (Rule 17);
        Linguistics resolves tokens through it rather than keeping its
        own copy (typically Domain.vocabulary.dictionary_processor)."""
        self.grammar_configurator = GrammarConfigurator()
        self.tensor = LinguisticSystemPropertyTensor()  # persistent, canonical store for every unit's numeric fields (Rule 14)
        self.graph_processor = GraphProcessor(dictionary_processor, self.grammar_configurator, self.tensor, use_clause_segmentation)
        self.tokenizer = PromptTokenizer(self.graph_processor)

    def tokenize_prompt(self, prompt: UserPrompt) -> Subject:
        return self.tokenizer.tokenize_prompt(prompt)
