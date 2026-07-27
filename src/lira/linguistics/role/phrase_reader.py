"""PhraseReader: spec 12.3's actual `Phrase.read()` implementation --
the only place phrase-level part-of-speech ambiguity gets resolved.
Tries every PhraseType at the given start position (a NOUN_PHRASE and a
VERB_PHRASE can both plausibly start at the same token -- e.g. "state"
is seeded as both NOUN and VERB), ranks every completed SequencePath
with the shared ReadingScorer, and materialises only the winner into
tensor-backed Words (GraphProcessor.materialise_token) -- every other
candidate stays a lightweight Interpretation record (spec 15, 24),
never a second tree of tensor rows for a reading nothing kept."""

from typing import TYPE_CHECKING, List, Optional, Sequence, Tuple

from ..data.clause import Clause
from ..data.interpretation import Interpretation
from ..data.linguistic_unit_kind import LinguisticUnitKind
from ..data.phrase import Phrase
from ..data.phrase_type import PhraseType
from ..data.reading_error import ReadingError, ReadingErrorKind
from ..data.sequencing_obligation import ObligationKind, SequencingObligation
from ..data.token_reading import TokenReading
from ..data.validation_outcome import ValidationOutcome
from .grammar_configurator import GrammarConfigurator, PhraseGrammar
from .graph_processor import GraphProcessor
from .sequence_engine import SequenceEngine, SequencePath, SequenceStep

if TYPE_CHECKING:
    from lira.vocabulary import Word


# Maps an unresolved obligation to the specific ReadingErrorKind spec 21
# names for it; AUXILIARY_REQUIRES_COMPATIBLE_VERB_FORM has no single
# dedicated kind of its own (an auxiliary chain with no following verb
# just fails to produce a valid VERB_PHRASE sequence at all), so it
# falls back to the generic NO_VALID_PHRASE_SEQUENCE.
_OBLIGATION_ERROR_KIND = {
    ObligationKind.DETERMINER_REQUIRES_NOMINAL_HEAD: ReadingErrorKind.INCOMPLETE_DETERMINER_SEQUENCE,
    ObligationKind.PREPOSITION_REQUIRES_OBJECT: ReadingErrorKind.PREPOSITION_MISSING_OBJECT,
    ObligationKind.AUXILIARY_REQUIRES_COMPATIBLE_VERB_FORM: ReadingErrorKind.NO_VALID_PHRASE_SEQUENCE,
    ObligationKind.INFINITIVE_MARKER_REQUIRES_BASE_VERB: ReadingErrorKind.INFINITIVE_MISSING_VERB,
    ObligationKind.CONJUNCTION_REQUIRES_COORDINATED_ELEMENT: ReadingErrorKind.INCOMPLETE_COORDINATION,
}


class PhraseReader:
    def __init__(self, engine: SequenceEngine, graph_processor: GraphProcessor, grammar: GrammarConfigurator):
        self.engine = engine
        self.graph_processor = graph_processor
        self.grammar = grammar

    def read(
        self,
        tokens: Sequence[TokenReading],
        *,
        start_index: int = 0,
        end_index: Optional[int] = None,
        parent_clause: Optional[Clause] = None,
        grammar: Optional[GrammarConfigurator] = None,
    ) -> Phrase:
        active_grammar = grammar or self.grammar
        end_index = len(tokens) if end_index is None else end_index

        if start_index >= end_index:
            return self._unreadable_phrase(tokens, start_index, parent_clause)

        candidates: List[SequencePath] = []
        for phrase_type in PhraseType:
            phrase_grammar = active_grammar.phrase_grammars[phrase_type]
            if phrase_grammar.nested_phrase_after:
                candidates.extend(self._find_prepositional_paths(tokens, start_index, end_index, phrase_grammar))
            else:
                candidates.extend(self.engine.find_valid_sequences(tokens, start_index, phrase_type, end_index=end_index))

        if not candidates:
            return self._unreadable_phrase(tokens, start_index, parent_clause)

        ranked = self.engine.rank_sequences(candidates, tokens)
        winner_key = self.engine.scorer.rank_key(self.engine.scoring_factors(ranked[0], tokens))
        tie_count = sum(
            1 for path in ranked if self.engine.scorer.rank_key(self.engine.scoring_factors(path, tokens)) == winner_key
        )
        alternatives = tuple(
            self._to_interpretation(path, tokens) for path in ranked[1 : 1 + active_grammar.max_alternative_interpretations]
        )
        return self._build_phrase(ranked[0], tokens, active_grammar, parent_clause, alternatives, tie_count)

    # --- PREPOSITIONAL_PHRASE composition (nested_phrase_after) --------
    # find_valid_sequences can't walk this one alone -- see its own
    # docstring -- so PhraseReader composes it directly: confirm the
    # PREPOSITION start, then recurse into the nested NOUN_PHRASE.

    def _find_prepositional_paths(
        self, tokens: Sequence[TokenReading], start_index: int, end_index: int, phrase_grammar: PhraseGrammar,
    ) -> List[SequencePath]:
        token = tokens[start_index]
        if not token.is_known:
            return []
        scope = self.engine.scope_for_phrase_type(phrase_grammar.phrase_type)
        results: List[SequencePath] = []
        for pos in token.candidate_parts_of_speech():
            if pos not in phrase_grammar.start_states:
                continue
            nested_type = self.engine.nested_phrase_for(phrase_grammar, pos)
            if nested_type is None:
                continue
            trigger_step = SequenceStep(token_index=start_index, part_of_speech=pos)
            nested_candidates = self.engine.find_valid_sequences(tokens, start_index + 1, nested_type, end_index=end_index)

            if not nested_candidates:
                # No object at all follows -- the obligation this
                # PREPOSITION raised is never discharged, a definite
                # negative conclusion (spec 20's own worked example is
                # this exact shape: "over" with nothing valid after it).
                open_obligations: Tuple[SequencingObligation, ...] = ()
                if pos in phrase_grammar.obligations_raised:
                    open_obligations = (SequencingObligation(
                        kind=phrase_grammar.obligations_raised[pos], scope=scope, raised_at_index=start_index,
                        description=f"{pos} at token {start_index} requires an object",
                    ),)
                results.append(SequencePath(
                    phrase_type=phrase_grammar.phrase_type, start_index=start_index, end_index=start_index + 1,
                    steps=(trigger_step,), open_obligations=open_obligations,
                ))
                continue

            # An object exists structurally, so PREPOSITION_REQUIRES_OBJECT
            # is discharged regardless of the object's own validity --
            # the object's own UNRESOLVED/INVALID state (unknown tokens,
            # its own open obligations) is what SequencePath.has_unknown_token
            # and validate_sequence's nested_paths check already surface.
            for nested_path in self.engine.rank_sequences(nested_candidates, tokens)[: self.grammar.max_alternative_interpretations]:
                results.append(SequencePath(
                    phrase_type=phrase_grammar.phrase_type, start_index=start_index, end_index=nested_path.end_index,
                    steps=(trigger_step,), open_obligations=(), nested_paths=(nested_path,),
                ))
        return results

    # --- Materialisation --------------------------------------------------

    def _materialise_step(self, token: TokenReading, step: SequenceStep) -> "Word":
        selected = None
        if not step.is_unknown:
            if step.is_marker:
                # A lexical marker (e.g. infinitive "to") is matched by
                # text, not by the POS it was seeded under -- its own
                # top-ranked seeded sense is still the right one to
                # materialise (spec: never invent a POS -- "to" keeps
                # its real seeded PREPOSITION sense as a Word, the
                # phrase's own phrase_type is what records its role
                # here as an infinitive marker, not a relabelled POS).
                selected = token.candidates[0] if token.candidates else None
            else:
                selected = token.identification_for(step.part_of_speech)
        return self.graph_processor.materialise_token(token, token.token_index, selected_candidate=selected)

    def _select_head(self, path: SequencePath, phrase_grammar: PhraseGrammar) -> Optional[SequenceStep]:
        for preferred in phrase_grammar.head_preference:
            for step in reversed(path.steps):
                if not step.is_unknown and not step.is_marker and step.part_of_speech == preferred:
                    return step
        # Nothing in head_preference matched (e.g. "the cat" with "cat"
        # unseeded) -- the wildcard stands in as head so the phrase
        # still has *something* to point to, correctly staying
        # UNRESOLVED rather than headless.
        for step in reversed(path.steps):
            if step.is_unknown:
                return step
        return None

    def _build_phrase(
        self,
        path: SequencePath,
        tokens: Sequence[TokenReading],
        grammar: GrammarConfigurator,
        parent_clause: Optional[Clause],
        alternatives: Tuple[Interpretation, ...],
        tie_count: int,
    ) -> Phrase:
        phrase_grammar = grammar.phrase_grammars[path.phrase_type]
        words = [self._materialise_step(tokens[step.token_index], step) for step in path.steps]
        nested_phrases = [
            self._build_phrase(nested, tokens, grammar, parent_clause, (), 1) for nested in path.nested_paths
        ]
        all_words = words + [w for nested in nested_phrases for w in nested.words]

        head_step = self._select_head(path, phrase_grammar)
        head_word: Optional["Word"] = None
        head_pos = None
        if head_step is not None:
            head_word = words[path.steps.index(head_step)]
            head_pos = head_step.part_of_speech

        selected_pos = tuple(step.part_of_speech for step in path.steps if step.part_of_speech is not None)
        selected_ids = tuple(
            identification
            for step in path.steps
            if step.part_of_speech is not None
            for identification in (tokens[step.token_index].identification_for(step.part_of_speech),)
            if identification is not None
        )

        validation = self.engine.validate_sequence(path)
        factors = self.engine.scoring_factors(path, tokens)
        confidence = self.engine.scorer.confidence(factors, tie_count=tie_count)
        errors = self._build_errors(path, tokens)

        phrase = Phrase(
            text=" ".join(w.text for w in all_words),
            phrase_type=path.phrase_type,
            words=all_words,
            selected_parts_of_speech=selected_pos,
            selected_identifications=selected_ids,
            head_word=head_word,
            head_part_of_speech=head_pos,
            nested_phrases=nested_phrases,
            parent_clause=parent_clause,
            start_position=path.start_index,
            end_position=path.end_index,
            open_obligations=path.open_obligations,
            validation=validation,
            confidence=confidence,
            alternatives=alternatives,
            errors=errors,
        )
        # Only the winning SequencePath ever reaches _build_phrase (the
        # losing candidates stay lightweight Interpretation records via
        # _to_interpretation) -- so, same as materialise_token, this is
        # the one place a Phrase-level tensor row gets allocated (spec
        # 19's containment: every unit gets a system_property).
        phrase.system_property = self.graph_processor.create_property_wrapper(
            phrase, LinguisticUnitKind.Phrase, path.start_index, "PhraseReader_ReadLayer",
        )
        return phrase

    def _build_errors(self, path: SequencePath, tokens: Sequence[TokenReading]) -> Tuple[ReadingError, ...]:
        errors: List[ReadingError] = []
        for step in path.steps:
            if step.is_unknown:
                token = tokens[step.token_index]
                errors.append(ReadingError(
                    kind=ReadingErrorKind.UNKNOWN_VOCABULARY_WORD, level=LinguisticUnitKind.Phrase,
                    message=f'"{token.text}" has no seeded or hydrated part of speech yet',
                    token_index=step.token_index, token_text=token.text,
                ))
        for obligation in path.open_obligations:
            errors.append(ReadingError(
                kind=_OBLIGATION_ERROR_KIND.get(obligation.kind, ReadingErrorKind.NO_VALID_PHRASE_SEQUENCE),
                level=LinguisticUnitKind.Phrase, message=obligation.description,
                token_index=obligation.raised_at_index, open_scope=obligation.scope,
                unfinished_obligation=obligation.kind,
            ))
        # Errors from a nested phrase (e.g. the NOUN_PHRASE nested under
        # a PREPOSITIONAL_PHRASE) live on that nested Phrase object
        # itself (built separately in _build_phrase's own recursive
        # call) -- not duplicated here.
        return tuple(errors)

    def _to_interpretation(self, path: SequencePath, tokens: Sequence[TokenReading]) -> Interpretation:
        factors = self.engine.scoring_factors(path, tokens)
        return Interpretation(
            selected_parts_of_speech=tuple(step.part_of_speech for step in path.steps if step.part_of_speech is not None),
            selected_entry_ids=tuple(None for _ in path.steps),
            phrase_spans=((path.phrase_type, path.start_index, path.end_index),),
            clause_spans=(),
            open_obligations=path.open_obligations,
            validation=self.engine.validate_sequence(path),
            confidence=self.engine.scorer.confidence(factors),
            rank_key=self.engine.scorer.rank_key(factors),
        )

    def _unreadable_phrase(
        self, tokens: Sequence[TokenReading], start_index: int, parent_clause: Optional[Clause],
    ) -> Phrase:
        token = tokens[start_index] if start_index < len(tokens) else None
        error = ReadingError(
            kind=ReadingErrorKind.NO_VALID_PHRASE_SEQUENCE, level=LinguisticUnitKind.Phrase,
            message="No phrase grammar accepts a token here",
            token_index=start_index if token is not None else None,
            token_text=token.text if token is not None else None,
            seeded_candidate_parts_of_speech=token.candidate_parts_of_speech() if token is not None else (),
        )
        phrase = Phrase(
            text=token.text if token is not None else "",
            phrase_type=None, words=[], parent_clause=parent_clause,
            start_position=start_index, end_position=start_index + (1 if token is not None else 0),
            validation=ValidationOutcome.INVALID, confidence=0.0, errors=(error,),
        )
        phrase.system_property = self.graph_processor.create_property_wrapper(
            phrase, LinguisticUnitKind.Phrase, start_index, "PhraseReader_ReadLayer",
        )
        return phrase
