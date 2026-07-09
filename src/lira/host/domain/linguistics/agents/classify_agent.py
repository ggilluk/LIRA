"""Classifies raw text into sentence- and paragraph-level boundaries
(Layer Summary: Linguistics Layer)."""

from . import LinguisticsAgent


class ClassifyAgent(LinguisticsAgent):
    def classify_sentences(self, paragraph_text: str) -> list[str]:
        return [s for s in (part.strip() for part in paragraph_text.split(".")) if s]

    def classify_paragraphs(self, subject_text: str) -> list[str]:
        return [p for p in (part.strip() for part in subject_text.split("\n")) if p]

    def run(self, text: str) -> list[str]:
        return self.classify_paragraphs(text)
