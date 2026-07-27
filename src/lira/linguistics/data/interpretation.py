"""One candidate reading of a token span: a part-of-speech assignment
plus the phrase/clause spans it implies -- deliberately NOT a
materialised Phrase/Clause tree. Alternatives are retained (spec 15,
24) as these lightweight records so that keeping several credible
interpretations around doesn't allocate several trees' worth of
LinguisticSystemPropertyTensor rows; only the one accepted
Interpretation is ever materialised
(GraphProcessor.build_sentence_from_reading)."""

from dataclasses import dataclass
from typing import TYPE_CHECKING, Optional, Tuple

from .clause_type import ClauseType
from .phrase_type import PhraseType
from .reading_error import ReadingError
from .sequencing_obligation import SequencingObligation
from .validation_outcome import ValidationOutcome

if TYPE_CHECKING:
    from lira.vocabulary import PartOfSpeech


@dataclass(frozen=True)
class Interpretation:
    # One entry per token in the span, index-aligned with the
    # TokenReading sequence this interpretation was read from.
    selected_parts_of_speech: Tuple["PartOfSpeech", ...]
    # Word.entry_id.value per token, same index alignment -- None for an
    # unresolved token, so a materialiser can re-find the exact seeded
    # sense without re-running identify_word.
    selected_entry_ids: Tuple[Optional[str], ...]
    # (type, start index, end index exclusive) per phrase this
    # interpretation implies.
    phrase_spans: Tuple[Tuple[PhraseType, int, int], ...]
    clause_spans: Tuple[Tuple[ClauseType, int, int], ...]
    open_obligations: Tuple[SequencingObligation, ...]
    validation: ValidationOutcome
    confidence: float
    # ReadingScorer's own lexicographic ranking key -- kept on the
    # record (not just used transiently to sort) so a ReadingError or a
    # report can explain *why* one interpretation outranked another.
    rank_key: Tuple
    errors: Tuple[ReadingError, ...] = ()
