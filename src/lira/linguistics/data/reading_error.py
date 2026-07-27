"""Structured reading errors (Linguistics Layer developer specification,
8.5; spec 21). PartOfSpeech is used only as a type hint here -- deferred
behind TYPE_CHECKING, the same pattern vocabulary/data/word.py uses for
its own cross-layer hints, since Vocabulary's own modules import this
package's linguistic_unit.py and a top-level import here would form an
import-time cycle."""

from dataclasses import dataclass, field
from enum import Enum
from typing import TYPE_CHECKING, Optional, Tuple

from .linguistic_scope import LinguisticScope
from .linguistic_unit_kind import LinguisticUnitKind
from .sequencing_obligation import ObligationKind

if TYPE_CHECKING:
    from lira.vocabulary import PartOfSpeech


class ReadingErrorKind(Enum):
    """All sixteen kinds spec 21 requires, defined from the outset so
    the values are stable across phases -- the four marked Phase 2 below
    are simply never emitted until their constructs exist (see
    linguistics/documentation/README.md, Not Yet Built)."""

    UNKNOWN_VOCABULARY_WORD = 0
    NO_SEEDED_PART_OF_SPEECH = 1
    NO_VALID_PHRASE_SEQUENCE = 2
    MISSING_PHRASE_HEAD = 3
    INCOMPLETE_DETERMINER_SEQUENCE = 4
    PREPOSITION_MISSING_OBJECT = 5
    INFINITIVE_MISSING_VERB = 6
    NO_VALID_CLAUSE_SEQUENCE = 7
    MISSING_PREDICATE = 8
    MISSING_FINITE_VERB = 9
    INCOMPLETE_COORDINATION = 10
    UNCLOSED_RELATIVE_CLAUSE = 11  # Phase 2 -- no relative clauses exist yet to leave unclosed.
    INVALID_PUNCTUATION_SEQUENCE = 12
    UNCLOSED_SCOPE = 13  # This phase: phrase scopes only. Quotation/parenthetical scopes are Phase 2.
    NO_VALID_SENTENCE_INTERPRETATION = 14
    MULTIPLE_EQUALLY_RANKED_INTERPRETATIONS = 15


@dataclass(frozen=True)
class ReadingError:
    """One structured error (spec 21: "each error must identify where
    applicable" the fields below). word_entry_id is a reference
    (Word.entry_id.value), never a copy of vocabulary data -- consistent
    with Phrase/Clause/Sentence referencing Vocabulary Words rather than
    duplicating their fields (spec 4, 12.2)."""

    kind: ReadingErrorKind
    level: LinguisticUnitKind
    message: str
    token_index: Optional[int] = field(default=None)
    token_text: Optional[str] = field(default=None)
    word_entry_id: Optional[str] = field(default=None)
    seeded_candidate_parts_of_speech: Tuple["PartOfSpeech", ...] = field(default=())
    current_state: Optional["PartOfSpeech"] = field(default=None)
    expected_states: Tuple["PartOfSpeech", ...] = field(default=())
    open_scope: Optional[LinguisticScope] = field(default=None)
    unfinished_obligation: Optional[ObligationKind] = field(default=None)
