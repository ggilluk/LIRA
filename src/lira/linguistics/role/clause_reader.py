"""ClauseReader: spec 13.3's actual `Clause.read()` implementation.
Reads a token span as a sequence of Phrases (via PhraseReader), then
assigns each phrase a clause role (subject/predicate/object/complement/
modifier) against GrammarConfigurator.clause_element_templates. Only
ClauseType.INDEPENDENT has a populated template in this phase -- see
clause_type.py -- so this always attempts exactly one flat, non-
recursive independent-clause reading over its whole span; relative/
dependent/coordinated clauses (clause-level recursion) are Phase 2.

Clause validity is not simply the worst of its phrases' validity: spec
20's own worked example ("The fox over the dog.") has two individually
VALID phrases (a NOUN_PHRASE, a PREPOSITIONAL_PHRASE) but an INVALID
clause, because no VERB_PHRASE predicate exists at all. So this combines
its own template-level check (subject/predicate/finite-verb presence)
with the worst outcome among its phrases -- see _validate."""

from typing import List, Optional, Sequence, Tuple

from ..data.clause import Clause
from ..data.clause_type import ClauseType
from ..data.linguistic_unit_kind import LinguisticUnitKind
from ..data.phrase import Phrase
from ..data.reading_error import ReadingError, ReadingErrorKind
from ..data.token_reading import TokenReading
from ..data.validation_outcome import ValidationOutcome
from .grammar_configurator import ClauseTemplate, GrammarConfigurator
from .phrase_reader import PhraseReader
from .reading_scorer import ScoringFactors
from .sequence_engine import SequenceEngine

# Copular/linking-verb forms -- when the predicate's own head word is
# one of these, a following NOUN_PHRASE/ADJECTIVE_PHRASE is a complement
# ("A meaning IS a representation."), not an object; anything else with
# a following NOUN_PHRASE reads that phrase as an object instead. A
# closed, hand-picked set rather than a morphological test, since real
# transitivity/linking-verb classification isn't seeded data this phase
# has access to (see this file's module docstring on Phase 1 scope).
_LINKING_VERB_FORMS = {"is", "are", "was", "were", "be", "been", "being", "am"}


class ClauseReader:
    def __init__(self, phrase_reader: PhraseReader, engine: SequenceEngine, grammar: GrammarConfigurator):
        self.phrase_reader = phrase_reader
        self.engine = engine
        self.grammar = grammar

    def read(
        self,
        tokens: Sequence[TokenReading],
        *,
        start_index: int = 0,
        end_index: Optional[int] = None,
        grammar: Optional[GrammarConfigurator] = None,
    ) -> Clause:
        active_grammar = grammar or self.grammar
        end_index = len(tokens) if end_index is None else end_index
        template = active_grammar.clause_element_templates.get(ClauseType.INDEPENDENT)

        if template is None or start_index >= end_index:
            return self._empty_clause(tokens, start_index, end_index)

        phrases: List[Phrase] = []
        index = start_index
        while index < end_index:
            token = tokens[index]
            if token.is_punctuation:
                index += 1
                continue
            phrase = self.phrase_reader.read(tokens, start_index=index, end_index=end_index, grammar=active_grammar)
            phrases.append(phrase)
            index = phrase.end_position if phrase.end_position > index else index + 1

        subject, predicate, obj, complement, modifiers = self._assign_roles(phrases, template)
        finite_verb = predicate.head_word if predicate is not None else None

        validation, own_errors = self._validate(phrases, subject, predicate, template)
        phrase_errors = tuple(error for phrase in phrases for error in self._all_phrase_errors(phrase))
        errors = tuple(own_errors) + phrase_errors

        factors = ScoringFactors(
            validation=validation,
            unresolved_token_count=sum(1 for phrase in phrases if phrase.validation == ValidationOutcome.UNRESOLVED),
            undischarged_obligation_count=sum(len(phrase.open_obligations) for phrase in phrases),
            finite_verb_phrase_count=1 if predicate is not None else 0,
            phrase_count=len(phrases),
            lexical_evidence_sum=sum(phrase.confidence for phrase in phrases),
        )
        confidence = self.engine.scorer.confidence(factors)

        all_words = [word for phrase in phrases for word in phrase.words]
        clause = Clause(
            text=" ".join(word.text for word in all_words),
            tokens=all_words,
            is_independent=True,
            clause_type=ClauseType.INDEPENDENT,
            phrases=phrases,
            subject=subject, predicate=predicate, object=obj, complement=complement, modifiers=modifiers,
            finite_verb=finite_verb,
            start_position=start_index, end_position=index,
            validation=validation, confidence=confidence, errors=errors,
        )
        # Phase 1 reads at most one clause per sentence (clause_type.py),
        # so 0 is always this clause's own sequence number within its
        # sentence -- see phrase_reader.py's own note on the same point.
        clause.system_property = self.phrase_reader.graph_processor.create_property_wrapper(
            clause, LinguisticUnitKind.Clause, 0, "ClauseReader_ReadLayer",
        )
        return clause

    def _assign_roles(
        self, phrases: Sequence[Phrase], template: ClauseTemplate,
    ) -> Tuple[Optional[Phrase], Optional[Phrase], Optional[Phrase], Optional[Phrase], List[Phrase]]:
        subject: Optional[Phrase] = None
        predicate: Optional[Phrase] = None
        obj: Optional[Phrase] = None
        complement: Optional[Phrase] = None
        modifiers: List[Phrase] = []

        for phrase in phrases:
            if phrase.phrase_type is None:
                continue
            if predicate is None:
                if subject is None and phrase.phrase_type in template.subject_phrase_types:
                    subject = phrase
                    continue
                if phrase.phrase_type in template.predicate_phrase_types:
                    predicate = phrase
                    continue
                modifiers.append(phrase)
                continue

            # Past the predicate: first NOUN_PHRASE/ADJECTIVE_PHRASE
            # becomes the object or complement (never both), everything
            # else is a modifier.
            if obj is None and complement is None and phrase.phrase_type in template.complement_phrase_types:
                is_linking = predicate.head_word is not None and predicate.head_word.text.lower() in _LINKING_VERB_FORMS
                if not is_linking and phrase.phrase_type in template.object_phrase_types:
                    obj = phrase
                else:
                    complement = phrase
                continue
            modifiers.append(phrase)

        return subject, predicate, obj, complement, modifiers

    def _validate(
        self, phrases: Sequence[Phrase], subject: Optional[Phrase], predicate: Optional[Phrase], template: ClauseTemplate,
    ) -> Tuple[ValidationOutcome, List[ReadingError]]:
        errors: List[ReadingError] = []
        own_outcome = ValidationOutcome.VALID

        if template.subject_required and subject is None:
            own_outcome = ValidationOutcome.INVALID
            errors.append(ReadingError(
                kind=ReadingErrorKind.NO_VALID_CLAUSE_SEQUENCE, level=LinguisticUnitKind.Clause,
                message="No subject-shaped phrase found before the predicate",
            ))
        if template.predicate_required and predicate is None:
            own_outcome = ValidationOutcome.INVALID
            errors.append(ReadingError(
                kind=ReadingErrorKind.MISSING_PREDICATE, level=LinguisticUnitKind.Clause,
                message="No VERB_PHRASE found for this clause's predicate",
            ))
        elif predicate is not None and predicate.head_part_of_speech not in template.predicate_head_requires:
            own_outcome = ValidationOutcome.INVALID
            errors.append(ReadingError(
                kind=ReadingErrorKind.MISSING_FINITE_VERB, level=LinguisticUnitKind.Clause,
                message="The clause's predicate has no finite verb form",
            ))

        phrase_outcomes = [phrase.validation for phrase in phrases if phrase.phrase_type is not None]
        worst = min([own_outcome] + phrase_outcomes, key=lambda outcome: outcome.value) if phrase_outcomes else own_outcome
        return worst, errors

    def _all_phrase_errors(self, phrase: Phrase) -> List[ReadingError]:
        """A phrase's own `.errors` deliberately excludes its nested
        phrases' errors (phrase_reader.py's own _build_errors docstring:
        each nested Phrase, e.g. a PREPOSITIONAL_PHRASE's object, carries
        its own). Clause/Sentence-level error reporting (spec 21) still
        needs every error reachable from one place, so this walks
        nested_phrases to collect them -- an unknown word inside a PP's
        object (e.g. "over the dog" with "dog" unseeded) must surface at
        the sentence level, not only on that inner NOUN_PHRASE object."""
        errors = list(phrase.errors)
        for nested in phrase.nested_phrases:
            errors.extend(self._all_phrase_errors(nested))
        return errors

    def _empty_clause(self, tokens: Sequence[TokenReading], start_index: int, end_index: int) -> Clause:
        error = ReadingError(
            kind=ReadingErrorKind.NO_VALID_CLAUSE_SEQUENCE, level=LinguisticUnitKind.Clause,
            message="Empty token span or no clause template configured for ClauseType.INDEPENDENT",
            token_index=start_index if start_index < len(tokens) else None,
        )
        clause = Clause(
            text="", tokens=[], is_independent=None, clause_type=None,
            start_position=start_index, end_position=end_index,
            validation=ValidationOutcome.INVALID, confidence=0.0, errors=(error,),
        )
        clause.system_property = self.phrase_reader.graph_processor.create_property_wrapper(
            clause, LinguisticUnitKind.Clause, 0, "ClauseReader_ReadLayer",
        )
        return clause
