"""TokenResolver: the read path's own tokenizer + candidate-resolution
step (Linguistics Layer developer specification, 8.8). Wraps
LinguisticLexer (sentence/token splitting, unchanged) and
GraphProcessor.process_token_candidates (candidate resolution, unchanged
identify_word integration) into the TokenReading sequences
Phrase.read()/Clause.read()/Sentence.read() consume -- this is the "text
or pre-resolved tokens" split spec 14.3 asks Sentence.read() to accept:
raw text always passes through here first, and always through the same
LinguisticLexer the write path uses, so a token or sentence boundary
never differs between LinguisticController.tokenize_prompt (write) and
LinguisticController.read_text (read) for the same input."""

from typing import Tuple

from ..data.token_reading import TokenReading
from .grammar_configurator import GrammarConfigurator
from .graph_processor import GraphProcessor
from .lexer import LinguisticLexer


class TokenResolver:
    def __init__(self, graph_processor: GraphProcessor):
        self.graph_processor = graph_processor

    def resolve_sentence(
        self, raw_sentence_text: str, *, sentence_index: int = 0,
    ) -> Tuple[TokenReading, ...]:
        """One sentence's worth of TokenReadings, in order -- every
        seeded candidate retained per token (spec 7's "candidate parts
        of speech"), none collapsed to a single sense the way
        process_token's materialisation step does."""
        raw_tokens = LinguisticLexer.extract_tokens(raw_sentence_text)
        return tuple(
            self.graph_processor.process_token_candidates(
                token_text,
                sentence_index=sentence_index, token_index=idx, is_sentence_start=(idx == 0),
                preceding_words=tuple(raw_tokens[:idx]), following_words=tuple(raw_tokens[idx + 1:]),
            )
            for idx, token_text in enumerate(raw_tokens)
        )

    def resolve_text(
        self, raw_text: str, *, grammar: GrammarConfigurator,
    ) -> Tuple[Tuple[TokenReading, ...], ...]:
        """One tuple of TokenReadings per sentence in `raw_text`, split
        by the same LinguisticLexer.split_sentences the write path uses.
        Sentence.read(text=...) uses this when handed a raw string;
        given an already-resolved TokenReading sequence instead, it
        skips this method entirely (spec 14.3's "text or pre-resolved
        tokens")."""
        raw_sentences = LinguisticLexer.split_sentences(raw_text, grammar)
        return tuple(
            self.resolve_sentence(sentence_text, sentence_index=idx)
            for idx, sentence_text in enumerate(raw_sentences)
            if sentence_text
        )
