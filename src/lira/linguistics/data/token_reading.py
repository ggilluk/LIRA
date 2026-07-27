"""One raw token occurrence together with EVERY seeded candidate
DictionaryProcessor.identify_word returned for it -- the read path's
replacement for GraphProcessor.process_token's collapse to
candidates[0]. TokenReading holds no tensor row of its own: the
sequencing search explores TokenReadings freely (discarding most of
them), and only the one accepted interpretation is ever materialised
into tensor-backed Word occurrences (GraphProcessor.materialise_token /
build_sentence_from_reading) -- allocating a row per candidate here
would leave tensor rows behind for interpretations nothing kept.

WordIdentification and PartOfSpeech are used only as type hints /
inside method bodies here, never imported at module scope -- Vocabulary's
own modules import this package's linguistic_unit.py, so a top-level
import here would form an import-time cycle (the same reasoning
graph_processor.py and vocabulary/data/word.py already document)."""

from dataclasses import dataclass
from typing import TYPE_CHECKING, Optional, Tuple

if TYPE_CHECKING:
    from lira.vocabulary import PartOfSpeech
    from lira.vocabulary.data.word_identification import WordIdentification


@dataclass(frozen=True)
class TokenReading:
    text: str
    token_index: int
    sentence_index: int
    is_sentence_start: bool
    # Untouched, in identify_word's own rank order (PartOfSpeechIdentifier's
    # stable sort by occurrence-level orthographic confidence) -- sequencing
    # never re-derives this ranking, only chooses among what it already
    # contains.
    candidates: Tuple["WordIdentification", ...] = ()

    @property
    def is_known(self) -> bool:
        """False means identify_word found no seeded or previously-
        hydrated sense -- external hydration has already been queued by
        Vocabulary (a separate process, spec 7), and this occurrence
        must not be guessed into any part of speech."""
        return bool(self.candidates)

    @property
    def is_punctuation(self) -> bool:
        from lira.vocabulary import PartOfSpeech

        return any(candidate.part_of_speech == PartOfSpeech.PUNCTUATION for candidate in self.candidates)

    def candidate_parts_of_speech(self) -> Tuple["PartOfSpeech", ...]:
        """Distinct parts of speech among this token's candidates, first-
        seen order -- deduplicated, since a genuine polyseme (e.g.
        "sense", two seeded NOUN senses under different domain_tags) is
        one sequencing state, not two identical ones competing with
        themselves."""
        seen = []
        for candidate in self.candidates:
            if candidate.part_of_speech not in seen:
                seen.append(candidate.part_of_speech)
        return tuple(seen)

    def identification_for(self, part_of_speech: "PartOfSpeech") -> Optional["WordIdentification"]:
        """The highest-ranked candidate carrying this part of speech, or
        None if this token was never seeded under it."""
        for candidate in self.candidates:
            if candidate.part_of_speech == part_of_speech:
                return candidate
        return None
