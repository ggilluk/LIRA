"""Top-level entry point: wraps a UserPrompt and drives GraphProcessor
to build its full Subject tree."""

from .graph_processor import GraphProcessor
from ..data.linguistic_unit_kind import LinguisticUnitKind
from ..data.subject import Subject
from ..data.user_prompt import UserPrompt


class PromptTokenizer:
    def __init__(self, graph_processor: GraphProcessor):
        self.graph_processor = graph_processor

    def tokenize_prompt(self, prompt: UserPrompt) -> Subject:
        prompt.system_property = self.graph_processor.create_property_wrapper(
            prompt, LinguisticUnitKind.UserPrompt, 0, "PromptTokenizer_Gateway"
        )
        return self.graph_processor.process_subject(prompt.text, 0)
