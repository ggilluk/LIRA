"""SequenceEngine: the one shared sequencing engine behind
Phrase.read()/Clause.read()/Sentence.read() (Linguistics Layer developer
specification, 8; spec 9, 10, 11). Holds no grammar of its own -- every
allowed start/next/end state, every obligation raised/discharged, comes
from the injected GrammarConfigurator (role/grammar_configurator.py);
SequenceEngine only walks those tables. role/*_reader.py modules are the
only intended callers -- this module has no per-level special-casing of
its own, which is what keeps "no duplicated rules" (spec 11) true across
all three readers.

PartOfSpeech is used only as a type hint / inside method bodies here,
never imported at module scope -- the same import-cycle constraint every
other new Linguistics module in this change documents."""

from dataclasses import dataclass
from typing import TYPE_CHECKING, List, Optional, Sequence, Tuple

from ..data.linguistic_scope import LinguisticScope
from ..data.phrase_type import PhraseType
from ..data.sequencing_obligation import SequencingObligation
from ..data.token_reading import TokenReading
from ..data.validation_outcome import ValidationOutcome
from .grammar_configurator import GrammarConfigurator, PhraseGrammar
from .reading_scorer import ReadingScorer, ScoringFactors

if TYPE_CHECKING:
    from lira.vocabulary import PartOfSpeech


# PhraseType and LinguisticScope members share the same names by design
# (linguistic_scope.py's own docstring) so this mapping is a straight
# name lookup, not a hand-maintained parallel table.
_PHRASE_SCOPE = {member: LinguisticScope[member.name] for member in PhraseType}

# Sentinel for "the previous step was an absorbed unknown token" -- kept
# out of the public PartOfSpeech-typed surface (get_allowed_next_states
# only ever takes a real PartOfSpeech or None) since it's an internal
# search-bookkeeping detail, not a grammar concept.
_WILDCARD = object()

_BEAM_WIDTH = 8


@dataclass(frozen=True)
class SequenceStep:
    """One token's contribution to a SequencePath. Exactly one of
    (a real seeded PartOfSpeech), is_unknown, or is_marker is true --
    is_unknown stands in for an unseeded token absorbed per spec 7;
    is_marker stands in for a lexically-anchored phrase marker (e.g.
    INFINITIVE_PHRASE's "to", spec's own "infinitive marker forms")
    that has no POS state of its own in this grammar."""

    token_index: int
    part_of_speech: Optional["PartOfSpeech"] = None
    is_unknown: bool = False
    is_marker: bool = False


@dataclass(frozen=True)
class SequencePath:
    """One candidate reading of a token span against one PhraseGrammar
    (spec 10.1's "valid sequence"). Produced by
    SequenceEngine.find_valid_sequences for the five phrase types whose
    grammar is a flat POS transition table (or, for INFINITIVE_PHRASE,
    a lexical marker); PREPOSITIONAL_PHRASE is assembled directly by
    PhraseReader instead, since its continuation is a whole nested
    NOUN_PHRASE rather than a token-by-token transition -- `nested_paths`
    is where that nested SequencePath is attached once PhraseReader
    composes it."""

    phrase_type: PhraseType
    start_index: int
    end_index: int  # exclusive
    steps: Tuple[SequenceStep, ...]
    open_obligations: Tuple[SequencingObligation, ...]
    nested_paths: Tuple["SequencePath", ...] = ()

    @property
    def has_unknown_token(self) -> bool:
        return any(step.is_unknown for step in self.steps) or any(
            nested.has_unknown_token for nested in self.nested_paths
        )


@dataclass(frozen=True)
class _PartialPath:
    steps: Tuple[SequenceStep, ...]
    open_obligations: Tuple[SequencingObligation, ...]


class SequenceEngine:
    """Spec 10's shared engine. One instance per LinguisticController,
    held by ReadingContext.sequence_engine and consulted by every
    role/*_reader.py."""

    def __init__(self, grammar: GrammarConfigurator, scorer: Optional[ReadingScorer] = None):
        self.grammar = grammar
        self.scorer = scorer or ReadingScorer()

    # --- Spec 10.2: primitive state-table queries ----------------------

    def get_allowed_next_states(
        self,
        current_state: Optional["PartOfSpeech"],
        phrase_grammar: PhraseGrammar,
    ) -> frozenset:
        """The states a sequence may move to from `current_state` under
        `phrase_grammar` -- `current_state=None` means "not yet
        started", so this returns the phrase's start_states."""
        if current_state is None:
            return phrase_grammar.start_states
        return phrase_grammar.transitions.get(current_state, frozenset())

    def validate_transition(
        self,
        from_state: Optional["PartOfSpeech"],
        to_state: "PartOfSpeech",
        phrase_grammar: PhraseGrammar,
    ) -> bool:
        return to_state in self.get_allowed_next_states(from_state, phrase_grammar)

    def nested_phrase_for(self, phrase_grammar: PhraseGrammar, state: "PartOfSpeech") -> Optional[PhraseType]:
        """PREPOSITIONAL_PHRASE's own continuation: after PREPOSITION,
        the next constituent is a whole nested NOUN_PHRASE, not a POS
        transition -- callers (PhraseReader) recurse into
        find_valid_sequences for the returned PhraseType instead of
        calling get_allowed_next_states again."""
        return phrase_grammar.nested_phrase_after.get(state)

    def _all_reachable_states(self, phrase_grammar: PhraseGrammar) -> frozenset:
        states = set(phrase_grammar.start_states) | set(phrase_grammar.end_states) | set(phrase_grammar.transitions.keys())
        for targets in phrase_grammar.transitions.values():
            states |= set(targets)
        return frozenset(states)

    # --- Spec 10.3: sequence search -------------------------------------

    def find_valid_sequences(
        self,
        tokens: Sequence[TokenReading],
        start_index: int,
        phrase_type: PhraseType,
        *,
        end_index: Optional[int] = None,
    ) -> Tuple[SequencePath, ...]:
        """Bounded beam search over `tokens[start_index:end_index]`
        against `phrase_type`'s PhraseGrammar (plan finding: a naive
        exhaustive cover search explodes combinatorially, so this caps
        total nodes explored at grammar.max_sequence_search_nodes and
        keeps only the best `_BEAM_WIDTH` partial paths per token
        position). Handles the five ordinary (non-nested-phrase) phrase
        types directly; PREPOSITIONAL_PHRASE has no end_states and no
        transitions (a PP never completes on a POS transition, only by
        nesting a whole NOUN_PHRASE), so calling this with
        PhraseType.PREPOSITIONAL_PHRASE always returns an empty tuple --
        PhraseReader composes a PP itself using get_allowed_next_states
        (to confirm the PREPOSITION start) and nested_phrase_for (to
        find what to recurse into), then attaches the nested
        SequencePath via SequencePath.nested_paths."""
        phrase_grammar = self.grammar.phrase_grammars[phrase_type]
        end_index = len(tokens) if end_index is None else end_index
        if phrase_grammar.marker_forms:
            return self._find_marker_sequences(tokens, start_index, end_index, phrase_grammar)
        return self._find_transition_sequences(tokens, start_index, end_index, phrase_grammar)

    def _find_marker_sequences(
        self,
        tokens: Sequence[TokenReading],
        start_index: int,
        end_index: int,
        phrase_grammar: PhraseGrammar,
    ) -> Tuple[SequencePath, ...]:
        if start_index >= end_index:
            return ()
        marker = tokens[start_index]
        if marker.text.lower() not in phrase_grammar.marker_forms:
            return ()

        open_obligations: Tuple[SequencingObligation, ...] = ()
        if phrase_grammar.marker_obligation is not None:
            open_obligations = (SequencingObligation(
                kind=phrase_grammar.marker_obligation,
                scope=_PHRASE_SCOPE[phrase_grammar.phrase_type],
                raised_at_index=start_index,
                description=f'"{marker.text}" requires a base-form verb to follow',
            ),)
        marker_step = SequenceStep(token_index=start_index, is_marker=True)

        if start_index + 1 >= end_index:
            # Marker with nothing following -- the obligation it raised
            # is never discharged, a definite negative conclusion.
            return (SequencePath(
                phrase_type=phrase_grammar.phrase_type, start_index=start_index, end_index=start_index + 1,
                steps=(marker_step,), open_obligations=open_obligations,
            ),)

        next_token = tokens[start_index + 1]
        scope = _PHRASE_SCOPE[phrase_grammar.phrase_type]

        if not next_token.is_known:
            if scope in self.grammar.unknown_token_absorbing_scopes:
                steps = (marker_step, SequenceStep(token_index=start_index + 1, is_unknown=True))
                return (SequencePath(
                    phrase_type=phrase_grammar.phrase_type, start_index=start_index, end_index=start_index + 2,
                    steps=steps, open_obligations=(),
                ),)
            return (SequencePath(
                phrase_type=phrase_grammar.phrase_type, start_index=start_index, end_index=start_index + 1,
                steps=(marker_step,), open_obligations=open_obligations,
            ),)

        paths = [
            SequencePath(
                phrase_type=phrase_grammar.phrase_type, start_index=start_index, end_index=start_index + 2,
                steps=(marker_step, SequenceStep(token_index=start_index + 1, part_of_speech=pos)),
                open_obligations=(),
            )
            for pos in next_token.candidate_parts_of_speech()
            if pos in phrase_grammar.marker_next_states
        ]
        if not paths:
            paths = [SequencePath(
                phrase_type=phrase_grammar.phrase_type, start_index=start_index, end_index=start_index + 1,
                steps=(marker_step,), open_obligations=open_obligations,
            )]
        return tuple(paths)

    def _find_transition_sequences(
        self,
        tokens: Sequence[TokenReading],
        start_index: int,
        end_index: int,
        phrase_grammar: PhraseGrammar,
    ) -> Tuple[SequencePath, ...]:
        scope = _PHRASE_SCOPE[phrase_grammar.phrase_type]
        absorbing = scope in self.grammar.unknown_token_absorbing_scopes

        beam: List[_PartialPath] = [_PartialPath(steps=(), open_obligations=())]
        completed: List[SequencePath] = []
        nodes_explored = 0
        index = start_index
        truncated = False

        while beam and index < end_index and not truncated:
            token = tokens[index]
            next_beam: List[_PartialPath] = []
            for partial in beam:
                if not partial.steps:
                    prev_pos = None
                elif partial.steps[-1].is_unknown:
                    prev_pos = _WILDCARD
                else:
                    prev_pos = partial.steps[-1].part_of_speech
                for pos, is_unknown in self._candidate_states(token, phrase_grammar, prev_pos, absorbing):
                    nodes_explored += 1
                    if nodes_explored > self.grammar.max_sequence_search_nodes:
                        truncated = True
                        break
                    new_open = self._advance_obligations(partial.open_obligations, phrase_grammar, pos, index, scope, is_unknown)
                    new_steps = partial.steps + (SequenceStep(index, pos, is_unknown),)
                    next_beam.append(_PartialPath(new_steps, new_open))
                    if is_unknown or pos in phrase_grammar.end_states:
                        completed.append(SequencePath(
                            phrase_type=phrase_grammar.phrase_type, start_index=start_index, end_index=index + 1,
                            steps=new_steps, open_obligations=new_open,
                        ))
                if truncated:
                    break
            next_beam.sort(key=lambda p: (len(p.open_obligations), sum(1 for s in p.steps if s.is_unknown)))
            beam = next_beam[:_BEAM_WIDTH]
            index += 1

        return tuple(completed)

    def _candidate_states(
        self,
        token: TokenReading,
        phrase_grammar: PhraseGrammar,
        prev_pos,
        absorbing: bool,
    ) -> List[Tuple[Optional["PartOfSpeech"], bool]]:
        if not token.is_known:
            return [(None, True)] if absorbing else []
        if prev_pos is _WILDCARD:
            # A wildcard's real POS is unknowable, so the token after it
            # is checked against every state this grammar can ever be
            # in, not a specific transition row -- permissive by design
            # (spec 7: keep reading surrounding structure where
            # possible), and still bounded, since it's this grammar's
            # own (small, fixed) state set, not an unconstrained guess.
            allowed = self._all_reachable_states(phrase_grammar)
        else:
            allowed = self.get_allowed_next_states(prev_pos, phrase_grammar)
        return [(pos, False) for pos in token.candidate_parts_of_speech() if pos in allowed]

    def _advance_obligations(
        self,
        open_obligations: Tuple[SequencingObligation, ...],
        phrase_grammar: PhraseGrammar,
        pos: Optional["PartOfSpeech"],
        token_index: int,
        scope: LinguisticScope,
        is_unknown: bool,
    ) -> Tuple[SequencingObligation, ...]:
        remaining = open_obligations
        if not is_unknown and pos is not None:
            remaining = tuple(
                obligation for obligation in remaining
                if pos not in self.grammar.obligation_discharges.get(obligation.kind, frozenset())
            )
            if pos in phrase_grammar.obligations_raised:
                kind = phrase_grammar.obligations_raised[pos]
                remaining = remaining + (SequencingObligation(
                    kind=kind, scope=scope, raised_at_index=token_index,
                    description=f"{pos.name} at token {token_index} raises {kind.name}",
                ),)
        return remaining

    # --- Spec 10.4: sequence validation and ranking ---------------------

    def validate_sequence(self, path: SequencePath) -> ValidationOutcome:
        if path.has_unknown_token:
            return ValidationOutcome.UNRESOLVED
        if path.open_obligations or any(nested.open_obligations for nested in path.nested_paths):
            return ValidationOutcome.INVALID
        return ValidationOutcome.VALID

    def rank_sequences(self, paths: Sequence[SequencePath], tokens: Sequence[TokenReading]) -> Tuple[SequencePath, ...]:
        scored = [(path, self.scoring_factors(path, tokens)) for path in paths]
        return self.scorer.rank(scored)

    def scope_for_phrase_type(self, phrase_type: PhraseType) -> LinguisticScope:
        return _PHRASE_SCOPE[phrase_type]

    def scoring_factors(self, path: SequencePath, tokens: Sequence[TokenReading]) -> ScoringFactors:
        all_steps = path.steps + tuple(step for nested in path.nested_paths for step in nested.steps)
        unresolved = sum(1 for step in all_steps if step.is_unknown)
        undischarged = len(path.open_obligations) + sum(len(nested.open_obligations) for nested in path.nested_paths)
        # Lower is "more preferred": identify_word's own candidate order
        # is highest-confidence first (part_of_speech_identifier.py), so
        # index 0 within a token's candidate_parts_of_speech() is its
        # top-ranked seeded sense. Summed across every real (non-
        # wildcard, non-marker) step so that, when nothing else
        # distinguishes two candidate readings (same validation, same
        # span, no open obligations), the one built from more top-
        # ranked seeded senses wins -- a principled tie-break instead of
        # an accidental one (e.g. PhraseType declaration order).
        rank_index_sum = 0
        for step in all_steps:
            if step.is_unknown or step.is_marker or step.part_of_speech is None:
                continue
            candidates = tokens[step.token_index].candidate_parts_of_speech()
            if step.part_of_speech in candidates:
                rank_index_sum += candidates.index(step.part_of_speech)
        return ScoringFactors(
            validation=self.validate_sequence(path),
            unresolved_token_count=unresolved,
            undischarged_obligation_count=undischarged,
            phrase_count=1 + len(path.nested_paths),
            span_length=path.end_index - path.start_index,
            candidate_rank_index_sum=rank_index_sum,
        )
