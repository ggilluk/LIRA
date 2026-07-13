"""Vocabulary Layer: term/lexeme-level concept identity within a Domain
(surface-form to concept resolution). Contains lexical inventory only
(Rule 17).

Repository layout follows Architectural Layer -> artefact purpose:
data_classes/ (VocabularyLayer), agents_role/ (VocabularyAgent and
concrete agents), documentation/, apis/, uis/, assets/."""

from .agents_role import VocabularyAgent
from .data_classes.layer import VocabularyLayer

__all__ = ["VocabularyLayer", "VocabularyAgent"]
