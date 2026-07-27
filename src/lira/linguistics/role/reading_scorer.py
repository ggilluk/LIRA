"""ReadingScorer: the one shared confidence/ranking scheme every
sequencing search result is ordered and scored by (Linguistics Layer
developer specification, 8.7; spec 15's "combination" step, spec 24's
"retain alternatives with confidence"). Operates purely over
ScoringFactors -- it has no idea whether the candidate it's ranking is a
phrase, clause, or sentence reading, which is what keeps this the *one*
shared scheme rather than a per-level reimplementation (spec 11)."""

from dataclasses import dataclass
from typing import Sequence, Tuple, TypeVar

from ..data.validation_outcome import ValidationOutcome

T = TypeVar("T")


@dataclass(frozen=True)
class ScoringFactors:
    """Inputs to one candidate reading's rank_key/confidence. Computed
    once per candidate by whichever role/*_reader.py built it -- a
    phrase reading only ever populates unresolved_token_count/
    undischarged_obligation_count/phrase_count/lexical_evidence_sum/
    candidate_rank_index_sum; finite_verb_phrase_count only means
    anything at clause level. Every field defaults to a neutral value
    (0) so an unpopulated factor never accidentally tips a comparison."""

    validation: ValidationOutcome
    unresolved_token_count: int = 0
    undischarged_obligation_count: int = 0
    finite_verb_phrase_count: int = 0
    phrase_count: int = 0
    lexical_evidence_sum: float = 0.0
    candidate_rank_index_sum: int = 0
    # Token span covered (end_index - start_index). Only meaningful when
    # comparing candidates that start at the same position (exactly
    # PhraseReader.read()'s own situation: several phrase types, several
    # lengths, all starting at one token index) -- a longer *equally
    # valid* completion is preferred (maximal munch), so a coordinated
    # "the meaning and the word" reads as one NOUN_PHRASE rather than
    # stopping at "the meaning" and leaving a stray "and" to be read as
    # its own (also seeded) VERB sense.
    span_length: int = 0


class ReadingScorer:
    """``rank_key`` is a tuple ordered so ascending sort always places
    the best candidate first (callers sort with it, keep the winner,
    and keep the losers as Interpretation.alternatives). Sign
    convention, stated once here rather than re-derived at each call
    site: every component is written so a *smaller* value is better;
    components where a larger raw value is actually better
    (phrase_count, lexical_evidence_sum) are negated to fit."""

    def rank_key(self, factors: ScoringFactors) -> Tuple:
        return (
            -factors.validation.value,  # VALID(2) -> -2 sorts before UNRESOLVED(1) -> -1 before INVALID(0) -> 0
            -factors.span_length,  # maximal munch among equally-valid candidates -- see this field's own docstring
            factors.unresolved_token_count,
            factors.undischarged_obligation_count,
            abs(factors.finite_verb_phrase_count - 1),  # exactly one finite VERB_PHRASE is the well-formed shape
            -factors.phrase_count,
            -factors.lexical_evidence_sum,
            factors.candidate_rank_index_sum,  # tie-break: prefer identify_word's own top-ranked senses
        )

    def confidence(self, factors: ScoringFactors, *, tie_count: int = 1) -> float:
        """A [0,1] estimate of how trustworthy this reading is, distinct
        from rank_key's pure ordering -- the top-ranked reading can
        still be low-confidence (the only reading found, but riddled
        with open obligations), and two readings can be genuinely tied.
        ``tie_count`` is how many candidates share this exact rank_key;
        confidence is split among genuine ties rather than each one
        claiming full confidence."""
        base_validity = {
            ValidationOutcome.VALID: 1.0,
            ValidationOutcome.UNRESOLVED: 0.5,
            ValidationOutcome.INVALID: 0.05,
        }[factors.validation]
        obligation_factor = 1.0 / (1 + factors.undischarged_obligation_count)
        ambiguity_factor = 1.0 / (1 + 0.15 * factors.candidate_rank_index_sum)
        tie_factor = 1.0 / max(tie_count, 1)
        return round(base_validity * obligation_factor * ambiguity_factor * tie_factor, 4)

    def rank(self, scored: Sequence[Tuple[T, ScoringFactors]]) -> Tuple[T, ...]:
        """Stable sort (Python's sort is stable) so that candidates
        tying on rank_key keep whatever order the caller built them
        in -- callers construct candidates in a deterministic order
        (e.g. identify_word's own candidate ranking), so ties resolve
        deterministically rather than arbitrarily."""
        ordered = sorted(scored, key=lambda pair: self.rank_key(pair[1]))
        return tuple(item for item, _ in ordered)
