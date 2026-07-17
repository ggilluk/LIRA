"""Identifies candidate parts of speech for one token occurrence from
this Domain's Dictionary -- whether the matching Word was loaded by
WordSeeder or added by a previous AsyncDictionaryHydrator run
(Dictionary.lookup_all makes no distinction). Does not perform
external lookup and does not create Words; it only ranks whatever
candidates already exist using observable occurrence evidence (casing
so far). Uses lookup_all(), not lookup() -- LIRA models homographs
(a pronoun and numeral "one", a preposition and particle "up") as
separate Word records sharing one surface form, and every legitimate
sense must be returned as a candidate, not just whichever was seeded
first."""

from typing import Tuple

from ..data.dictionary import Dictionary
from ..data.part_of_speech import PartOfSpeech
from ..data.word_identification import IdentificationSource, WordIdentification
from ..data.word_lookup_context import WordLookupContext


class PartOfSpeechIdentifier:
    def __init__(self, dictionary: Dictionary):
        self.dictionary = dictionary

    def identify_seeded(self, context: WordLookupContext) -> Tuple[WordIdentification, ...]:
        seeded_words = self.dictionary.lookup_all(context.normalised_text)

        candidates = [
            WordIdentification(
                word=word,
                part_of_speech=word.part_of_speech,
                source=IdentificationSource.SEEDED_VOCABULARY,
                confidence=self._seeded_confidence(word.part_of_speech, context),
                reason=self._seeded_reason(word.part_of_speech, context),
            )
            for word in seeded_words
        ]

        # Stable sort: candidates tied on confidence (the common case --
        # casing evidence only ever applies to PROPER_NOUN/SYMBOL) keep
        # Dictionary.lookup_all's own order, i.e. seeding/insertion
        # order -- the same "first-seeded wins" default Dictionary.lookup()
        # already uses elsewhere. Casing evidence re-ranks only when it
        # actually applies; it never invents a preference among
        # candidates it has no opinion about.
        candidates.sort(key=lambda candidate: candidate.confidence, reverse=True)

        return tuple(candidates)

    @staticmethod
    def _seeded_confidence(part_of_speech: PartOfSpeech, context: WordLookupContext) -> float:
        confidence = 1.0

        # Title casing does not override an exact seeded entry. It only
        # ranks legitimate seeded alternatives.
        if part_of_speech == PartOfSpeech.PROPER_NOUN and context.is_title_case and not context.is_sentence_start:
            confidence += 0.15

        if part_of_speech == PartOfSpeech.SYMBOL and context.is_upper_case:
            confidence += 0.10

        return confidence

    @staticmethod
    def _seeded_reason(part_of_speech: PartOfSpeech, context: WordLookupContext) -> str:
        reasons = ["Exact lexical-form and grammatical-category match in the seeded LIRA Vocabulary."]

        if part_of_speech == PartOfSpeech.PROPER_NOUN and context.is_title_case and not context.is_sentence_start:
            reasons.append("Non-sentence-initial title casing supports the proper-noun candidate.")

        if part_of_speech == PartOfSpeech.SYMBOL and context.is_upper_case:
            reasons.append("Upper casing supports the symbol candidate.")

        return " ".join(reasons)
