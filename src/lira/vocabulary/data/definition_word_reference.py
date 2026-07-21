"""One token from a Word's own `definition` text, resolved against a
Dictionary -- the result of breaking a definition down into its own
sequenced array of words (`Word.definition_words`). Deliberately not a
`Word` field (Design Principle 4: "A Word must not contain collections
of related words") -- computed on demand, the same discipline every
other derived property in `word.py` already follows, just resolved
against the Dictionary directly rather than through a
LexicalRelationshipStore, since a definition is prose, not a claimed
relationship between two lexical forms."""

from dataclasses import dataclass
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from .word import Word


@dataclass(frozen=True)
class DefinitionWordReference:
    # The raw token as it appeared in the definition text, casing
    # preserved -- not necessarily equal to `word.text` (a definition
    # sentence lowercases mid-sentence occurrences the way any English
    # prose does).
    text: str

    # None means the Dictionary this reference was resolved against has
    # no Word at all for this token -- reported, not guessed, the same
    # discipline DictionaryProcessor.identify_word applies to an
    # unresolved occurrence.
    word: Optional["Word"] = None

    @property
    def is_resolved(self) -> bool:
        return self.word is not None
