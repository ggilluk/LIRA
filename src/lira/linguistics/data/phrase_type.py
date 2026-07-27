from enum import Enum


class PhraseType(Enum):
    """The phrase types Phrase.read() can produce (Linguistics Layer
    developer specification, 4.1). Integer-valued, sequentially assigned,
    for the same tensor-code convention LinguisticUnitKind/PartOfSpeech
    already use (Design Principle 12) -- .value is not currently stored
    directly in LinguisticSystemPropertyTensor (Phrase's own kind is
    LinguisticUnitKind.Phrase; PhraseType lives on Phrase.phrase_type,
    a plain field), but keeping the same convention here avoids a second,
    inconsistent enumeration style in the same layer.

    Relative-clause and coordinated-clause detection route through
    ClauseType instead -- a coordinated PHRASE (e.g. "John and Mary") is
    still one of the six types below with a coordination scope layered
    on top, not a seventh type."""

    NOUN_PHRASE = 0
    VERB_PHRASE = 1
    ADJECTIVE_PHRASE = 2
    ADVERB_PHRASE = 3
    PREPOSITIONAL_PHRASE = 4
    INFINITIVE_PHRASE = 5
