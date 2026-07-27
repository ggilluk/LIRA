"""A grammatical unit built from one or more Phrases, centred on a single
finite predicate (Linguistics Layer developer specification, 5; spec
13.1). References Vocabulary Words -- never copies or replaces their
lexical data (Rule 17). Word and PartOfSpeech are used only as type
hints here, left unimported at module scope -- Vocabulary's own modules
import this package's linguistic_unit.py, so a top-level import here
would form an import-time cycle."""

from dataclasses import dataclass, field
from typing import List, Optional, Sequence, Tuple

from .clause_type import ClauseType
from .interpretation import Interpretation
from .linguistic_unit import LinguisticUnit
from .reading_error import ReadingError
from .validation_outcome import ValidationOutcome

# Word (lira.vocabulary) is used only as a type hint here -- left
# unimported because Vocabulary's own modules import this tree's
# LinguisticUnit base, and a top-level import here would form an
# import-time cycle between the two layers (same reasoning as
# GraphProcessor's DictionaryProcessor hint -- see graph_processor.py).
# Punctuation is a Word (part_of_speech=PUNCTUATION), not a separate
# type, so tokens is uniformly List["Word"].


@dataclass
class Clause(LinguisticUnit):
    tokens: List["Word"] = field(default_factory=list, kw_only=True)
    # Plain field, unchanged, for the write path's own construction sites
    # (LinguisticController.tokenize_prompt's clause segmentation always
    # builds one independent clause per sentence in this phase).
    # Clause.read() overwrites this with a genuinely computed value once
    # clause_type is known -- only INDEPENDENT clauses are recognised in
    # this phase (see clause_type.py), so a Clause.read() ever returns
    # is_independent=True or is UNRESOLVED, never a computed False.
    is_independent: Optional[bool] = field(default=True, kw_only=True)

    clause_type: Optional[ClauseType] = field(default=None, kw_only=True)
    phrases: List["Phrase"] = field(default_factory=list, kw_only=True)
    subject: Optional["Phrase"] = field(default=None, kw_only=True)
    predicate: Optional["Phrase"] = field(default=None, kw_only=True)
    object: Optional["Phrase"] = field(default=None, kw_only=True)
    complement: Optional["Phrase"] = field(default=None, kw_only=True)
    modifiers: List["Phrase"] = field(default_factory=list, kw_only=True)
    finite_verb: Optional["Word"] = field(default=None, kw_only=True)
    # Populated from Phase 2 onward (relative/subordinate/coordinated
    # clauses) -- always empty in this phase; see clause_type.py.
    nested_clauses: List["Clause"] = field(default_factory=list, kw_only=True)
    start_position: int = field(default=0, kw_only=True)
    end_position: int = field(default=0, kw_only=True)  # exclusive
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
        tokens: Sequence["TokenReading"],
        *,
        context: "ReadingContext",
        start_index: int = 0,
        end_index: Optional[int] = None,
        grammar: Optional["GrammarConfigurator"] = None,
    ) -> "Clause":
        """Spec 13.3 entry point. Contains no grammar or sequencing
        logic of its own (spec 9) -- one delegation to the shared
        ClauseReader, the only implementation of clause sequencing in
        this layer, reached through `context` rather than a
        controller-shaped dependency (see role/reading_context.py's own
        docstring for why)."""
        return context.clause_reader.read(
            tokens,
            start_index=start_index,
            end_index=end_index if end_index is not None else len(tokens),
            grammar=grammar or context.grammar,
        )
