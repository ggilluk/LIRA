"""The service bundle Phrase.read()/Clause.read()/Sentence.read() are
given to reach the shared sequencing services (Linguistics Layer
developer specification, 8.6). Built once per LinguisticController
(LinguisticController.reading_context) and passed explicitly to each
`.read()` call -- e.g. `Sentence.read(text, context=domain.linguistics.reading_context)`
-- rather than having `.read()` reach for a controller directly. This
keeps PhraseReader/ClauseReader/SentenceReader exercisable in isolation
(a test can build a ReadingContext by hand around a bare
GrammarConfigurator, with no Domain/Dictionary involved) while every
real call still goes through the one controller-owned instance, which
is what satisfies the "Sentence.read() -> LinguisticController -> shared
sequencing services" delegation spec 9 requires -- the controller
constructs and owns this bundle, `.read()` never rebuilds its own copy
of any rule or engine."""

from dataclasses import dataclass

from .grammar_configurator import GrammarConfigurator
from .sequence_engine import SequenceEngine
from .token_resolver import TokenResolver

# GraphProcessor is used only as a type hint here -- deferred to avoid
# widening this module's import surface unnecessarily; ReadingContext
# itself never calls into it directly (PhraseReader/ClauseReader/
# SentenceReader do, for tensor-row materialisation).


@dataclass(frozen=True)
class ReadingContext:
    grammar: GrammarConfigurator
    sequence_engine: SequenceEngine
    token_resolver: TokenResolver
    phrase_reader: "PhraseReader"
    clause_reader: "ClauseReader"
    sentence_reader: "SentenceReader"
    graph_processor: "GraphProcessor"
