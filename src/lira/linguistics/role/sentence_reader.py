"""SentenceReader: spec 14.3's actual `Sentence.read()` implementation.
Splits off trailing punctuation, reads the remainder as one
ClauseType.INDEPENDENT clause (ClauseReader -- Phase 1 supports exactly
one clause per sentence, see clause_reader.py's own module docstring),
and checks the result against
GrammarConfigurator.sentence_templates[SentenceType.DECLARATIVE], the
only sentence template populated in this phase (sentence_type.py).
Accepts either raw text (tokenised via TokenResolver.resolve_sentence,
as exactly one sentence -- splitting a longer string into several
sentences is LinguisticController.read_text's job, not this method's)
or an already-resolved TokenReading sequence (spec 14.3's "text or
pre-resolved tokens")."""

from typing import List, Optional, Sequence, Union

from ..data.linguistic_unit_kind import LinguisticUnitKind
from ..data.reading_error import ReadingError, ReadingErrorKind
from ..data.sentence import Sentence
from ..data.sentence_type import SentenceType
from ..data.token_reading import TokenReading
from ..data.validation_outcome import ValidationOutcome
from .clause_reader import ClauseReader
from .grammar_configurator import GrammarConfigurator
from .reading_scorer import ScoringFactors
from .sequence_engine import SequenceEngine
from .token_resolver import TokenResolver


class SentenceReader:
    def __init__(
        self, clause_reader: ClauseReader, token_resolver: TokenResolver, engine: SequenceEngine, grammar: GrammarConfigurator,
    ):
        self.clause_reader = clause_reader
        self.token_resolver = token_resolver
        self.engine = engine
        self.grammar = grammar

    def read(
        self,
        text_or_tokens: Union[str, Sequence[TokenReading]],
        *,
        grammar: Optional[GrammarConfigurator] = None,
        sequence_number: int = 0,
        trace: Optional[List[dict]] = None,
    ) -> Sentence:
        """`trace`, when a list is passed, is threaded straight through
        to ClauseReader.read -- see PhraseReader.read's own docstring
        for what gets recorded. Purely additive/observational."""
        active_grammar = grammar or self.grammar
        tokens = (
            self.token_resolver.resolve_sentence(text_or_tokens)
            if isinstance(text_or_tokens, str)
            else tuple(text_or_tokens)
        )

        if not tokens:
            return self._empty_sentence(sequence_number)

        punctuation_token = tokens[-1]
        has_terminal_punctuation = punctuation_token.is_punctuation
        clause_end = len(tokens) - 1 if has_terminal_punctuation else len(tokens)

        clause = self.clause_reader.read(tokens, start_index=0, end_index=clause_end, grammar=active_grammar, trace=trace)

        punctuation_word = None
        if has_terminal_punctuation:
            selected = punctuation_token.candidates[0] if punctuation_token.candidates else None
            punctuation_word = self.clause_reader.phrase_reader.graph_processor.materialise_token(
                punctuation_token, punctuation_token.token_index, selected_candidate=selected,
            )

        sentence_template = active_grammar.sentence_templates.get(SentenceType.DECLARATIVE)
        errors: List[ReadingError] = list(clause.errors)
        outcome = clause.validation
        sentence_type = None

        if sentence_template is None:
            outcome = ValidationOutcome.INVALID
            errors.append(ReadingError(
                kind=ReadingErrorKind.NO_VALID_SENTENCE_INTERPRETATION, level=LinguisticUnitKind.Sentence,
                message="No sentence template configured for SentenceType.DECLARATIVE",
            ))
        else:
            sentence_type = SentenceType.DECLARATIVE
            if punctuation_word is not None and punctuation_word.text not in sentence_template.terminal_punctuation:
                outcome = min(outcome, ValidationOutcome.INVALID, key=lambda o: o.value)
                errors.append(ReadingError(
                    kind=ReadingErrorKind.INVALID_PUNCTUATION_SEQUENCE, level=LinguisticUnitKind.Sentence,
                    message=f'"{punctuation_word.text}" is not valid terminal punctuation for a declarative sentence',
                    token_index=punctuation_token.token_index, token_text=punctuation_token.text,
                ))

        sentence_words = list(clause.tokens) + ([punctuation_word] if punctuation_word is not None else [])
        factors = ScoringFactors(
            validation=outcome,
            unresolved_token_count=sum(1 for token in tokens if not token.is_known),
            undischarged_obligation_count=sum(len(phrase.open_obligations) for phrase in clause.phrases),
            finite_verb_phrase_count=1 if clause.predicate is not None else 0,
            phrase_count=len(clause.phrases),
            lexical_evidence_sum=clause.confidence,
        )
        confidence = self.engine.scorer.confidence(factors)

        sentence = Sentence(
            text=" ".join(word.text for word in sentence_words),
            clauses=[clause],
            requires_punctuation=bool(sentence_template.terminal_punctuation) if sentence_template else None,
            tokens=sentence_words,
            sentence_type=sentence_type,
            selected_parts_of_speech=tuple(word.part_of_speech for word in sentence_words),
            punctuation=punctuation_word,
            validation=outcome,
            confidence=confidence,
            errors=tuple(errors),
        )
        sentence.system_property = self.clause_reader.phrase_reader.graph_processor.create_property_wrapper(
            sentence, LinguisticUnitKind.Sentence, sequence_number, "SentenceReader_ReadLayer",
        )
        return sentence

    def _empty_sentence(self, sequence_number: int = 0) -> Sentence:
        error = ReadingError(
            kind=ReadingErrorKind.NO_VALID_SENTENCE_INTERPRETATION, level=LinguisticUnitKind.Sentence,
            message="Empty token sequence",
        )
        sentence = Sentence(text="", clauses=[], validation=ValidationOutcome.INVALID, confidence=0.0, errors=(error,))
        sentence.system_property = self.clause_reader.phrase_reader.graph_processor.create_property_wrapper(
            sentence, LinguisticUnitKind.Sentence, sequence_number, "SentenceReader_ReadLayer",
        )
        return sentence
