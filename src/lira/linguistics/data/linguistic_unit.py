"""Base type for every artefact in the Word/Clause/Sentence/Paragraph/
Subject/UserPrompt tree (Layer Summary: Linguistics Layer)."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class LinguisticUnit:
    text: str
    system_property: Optional["LinguisticSystemProperty"] = None
