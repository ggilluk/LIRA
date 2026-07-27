"""A sequence of Vocabulary words functioning as one grammatical unit
within a clause (Linguistics Layer developer specification, 4; spec
12.1). References Vocabulary Words and WordIdentifications -- never
copies or replaces their lexical data (spec 12.2, Rule 17). Word,
WordIdentification, PartOfSpeech, and Clause are used only as type
hints here, left unimported at module scope -- the same import-cycle
reasoning clause.py already documents (Vocabulary's own modules import
this package's linguistic_unit.py)."""

from dataclasses import dataclass, field
from typing import List, Optional, Sequence, Tuple

from .interpretation import Interpretation
from .linguistic_unit import LinguisticUnit
from .phrase_type import PhraseType
from .reading_error import ReadingError
from .sequencing_obligation import SequencingObligation
from .validation_outcome import ValidationOutcome


@dataclass
class Phrase(LinguisticUnit):
    # None only for the degenerate "no phrase grammar accepts a token
    # here" result (e.g. PhraseReader called at a bare PUNCTUATION
    # token) -- see role/phrase_reader.py's _unreadable_phrase. Every
    # phrase actually read by a valid grammar rule always sets this.
    phrase_type: Optional[PhraseType] = field(default=None, kw_only=True)
    words: List["Word"] = field(default_factory=list, kw_only=True)
    selected_parts_of_speech: Tuple["PartOfSpeech", ...] = field(default=(), kw_only=True)
    selected_identifications: Tuple["WordIdentification", ...] = field(default=(), kw_only=True)
    head_word: Optional["Word"] = field(default=None, kw_only=True)
    head_part_of_speech: Optional["PartOfSpeech"] = field(default=None, kw_only=True)
    modifiers: List["Phrase"] = field(default_factory=list, kw_only=True)
    nested_phrases: List["Phrase"] = field(default_factory=list, kw_only=True)
    # Back-reference only -- Clause owns its phrases (Clause.phrases),
    # a Phrase does not own its parent.
    parent_clause: Optional["Clause"] = field(default=None, kw_only=True)
    start_position: int = field(default=0, kw_only=True)
    end_position: int = field(default=0, kw_only=True)  # exclusive
    open_obligations: Tuple[SequencingObligation, ...] = field(default=(), kw_only=True)
    validation: ValidationOutcome = field(default=ValidationOutcome.UNRESOLVED, kw_only=True)
    confidence: float = field(default=0.0, kw_only=True)
    alternatives: Tuple[Interpretation, ...] = field(default=(), kw_only=True)
    errors: Tuple[ReadingError, ...] = field(default=(), kw_only=True)
    # system_property inherited from LinguisticUnit -- allocated by
    # GraphProcessor.process_phrase at materialisation time, not here;
    # a Phrase produced by search that's later discarded as a losing
    # alternative never gets a tensor row (spec 19; interpretation.py's
    # own docstring).

    @classmethod
    def read(
        cls,
        tokens: Sequence["TokenReading"],
        *,
        context: "ReadingContext",
        start_index: int = 0,
        end_index: Optional[int] = None,
        parent_clause: Optional["Clause"] = None,
        grammar: Optional["GrammarConfigurator"] = None,
    ) -> "Phrase":
        """Spec 12.3 entry point. Contains no grammar or sequencing
        logic of its own (spec 9) -- one delegation to the shared
        PhraseReader, the only implementation of phrase sequencing in
        this layer, reached through `context` rather than a
        controller-shaped dependency (see role/reading_context.py's
        own docstring for why)."""
        return context.phrase_reader.read(
            tokens,
            start_index=start_index,
            end_index=end_index if end_index is not None else len(tokens),
            parent_clause=parent_clause,
            grammar=grammar or context.grammar,
        )
