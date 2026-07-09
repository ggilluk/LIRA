"""Structures tokenised, parsed and classified pieces into the
Sentence -> Paragraph -> Subject hierarchy (Layer Summary: Linguistics
Layer). Composes TokeniseAgent, ParseAgent and ClassifyAgent rather than
duplicating their work -- Agents operate inside the layer whose
artefacts they manage (Rule 16)."""

from . import LinguisticsAgent
from .classify_agent import ClassifyAgent
from .parse_agent import ParseAgent
from .tokenise_agent import TokeniseAgent
from ..system_property import LinguisticSystemProperty
from ..tensor import LinguisticSystemPropertyTensor
from ..units import LinguisticUnitKind, Paragraph, Sentence, Subject


class StructureAgent(LinguisticsAgent):
    def __init__(self, name: str, store: LinguisticSystemPropertyTensor,
                 tokeniser: TokeniseAgent, parser: ParseAgent, classifier: ClassifyAgent):
        super().__init__(name)
        self.store = store
        self.tokeniser = tokeniser
        self.parser = parser
        self.classifier = classifier

    def build_sentence(self, text: str, sequence_number: int) -> Sentence:
        tokens = self.tokeniser.run(text)
        clause = self.parser.run(text, tokens)
        row = self.store.allocate_row(LinguisticUnitKind.Sentence, sequence_number)
        return Sentence(text=text, clauses=[clause], system_property=LinguisticSystemProperty(self.store, row))

    def build_paragraph(self, text: str, sequence_number: int) -> Paragraph:
        sentences = [self.build_sentence(s, i) for i, s in enumerate(self.classifier.classify_sentences(text))]
        row = self.store.allocate_row(LinguisticUnitKind.Paragraph, sequence_number)
        return Paragraph(text=text, sentences=sentences, system_property=LinguisticSystemProperty(self.store, row))

    def build_subject(self, text: str) -> Subject:
        paragraphs = [self.build_paragraph(p, i) for i, p in enumerate(self.classifier.classify_paragraphs(text))]
        row = self.store.allocate_row(LinguisticUnitKind.Subject, 0)
        return Subject(text=text, paragraphs=paragraphs, system_property=LinguisticSystemProperty(self.store, row))

    def run(self, text: str) -> Subject:
        return self.build_subject(text)
