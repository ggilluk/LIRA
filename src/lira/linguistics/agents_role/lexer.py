"""Rules-based lexer: sentence splitting and token extraction."""

import re
from typing import List

from ..data_classes.grammar_configuration import LinguisticGrammarConfiguration


class LinguisticLexer:
    TOKEN_REGEX = re.compile(r'(?:[A-Z]\.)+|(?:\d+\.\d+)+|\w+(?:\'\w+)?|[.,!?;]')

    @classmethod
    def split_sentences(cls, text: str, config: LinguisticGrammarConfiguration) -> List[str]:
        # Use explicit boundary lookbehinds compiled dynamically from current configuration
        split_pattern = re.compile(config.sentence_abbreviation_exceptions + r'(?<=[.!?])\s+')
        return [s.strip() for s in split_pattern.split(text) if s.strip()]

    @classmethod
    def extract_tokens(cls, text: str) -> List[str]:
        return cls.TOKEN_REGEX.findall(text)
