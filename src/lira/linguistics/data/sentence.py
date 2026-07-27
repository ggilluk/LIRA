"""The top-level read/write unit: one or more Clauses plus terminal
punctuation (Linguistics Layer developer specification, 6; spec 14.1).
References Vocabulary Words -- never copies or replaces their lexical
data (Rule 17). Word and PartOfSpeech are used only as type hints here,
left unimported at module scope -- same import-cycle reasoning as
clause.py."""

from dataclasses import dataclass, field
from typing import List, Optional, Sequence, Tuple, Union

from .clause import Clause
from .interpretation import Interpretation
from .linguistic_unit import LinguisticUnit
from .reading_error import ReadingError
from .sentence_type import SentenceType
from .validation_outcome import ValidationOutcome


@dataclass
class Sentence(LinguisticUnit):
    clauses: List[Clause] = field(default_factory=list, kw_only=True)
    requires_punctuation: Optional[bool] = field(default=None, kw_only=True)

    tokens: List["Word"] = field(default_factory=list, kw_only=True)
    sentence_type: Optional[SentenceType] = field(default=None, kw_only=True)
    selected_parts_of_speech: Tuple["PartOfSpeech", ...] = field(default=(), kw_only=True)
    punctuation: Optional["Word"] = field(default=None, kw_only=True)
    validation: ValidationOutcome = field(default=ValidationOutcome.UNRESOLVED, kw_only=True)
    confidence: float = field(default=0.0, kw_only=True)
    alternatives: Tuple[Interpretation, ...] = field(default=(), kw_only=True)
    errors: Tuple[ReadingError, ...] = field(default=(), kw_only=True)
    # system_property inherited from LinguisticUnit -- allocated by
    # GraphProcessor at materialisation time, not here (see phrase.py's
    # own note on the same point).

    @classmethod
    def read(
        cls,
        text_or_tokens: Union[str, Sequence["TokenReading"]],
        *,
        context: "ReadingContext",
        grammar: Optional["GrammarConfigurator"] = None,
    ) -> "Sentence":
        """Spec 14.3 entry point ("accepts text or pre-resolved
        tokens"). Raw text is tokenised and resolved via
        context.token_resolver; an already-resolved TokenReading
        sequence is read as-is -- the latter is what
        LinguisticController.read_text uses internally when handing
        SentenceReader one sentence's slice of a larger, already-
        tokenised prompt. Contains no grammar or sequencing logic of its
        own (spec 9) -- one delegation to the shared SentenceReader,
        reached through `context` rather than a controller-shaped
        dependency (see role/reading_context.py's own docstring for
        why)."""
        return context.sentence_reader.read(
            text_or_tokens,
            grammar=grammar or context.grammar,
        )
