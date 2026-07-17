"""Resolves a raw token occurrence to zero or more candidate Words,
queuing background hydration when nothing in this Domain's Dictionary
matches yet. Never guesses a grammatical category: an unresolved
occurrence gets no Word at all until either the seeded/previously-
hydrated Dictionary or external hydration actually supplies one (see
WordIdentification's docstring). Punctuation is an ordinary Word
(part_of_speech=PUNCTUATION, seeded from assets/common/en/punctuation.json,
WordSeeder.MANDATORY_FILES) -- it resolves through the same
identify_word path as any other mandatory closed-class word, no
special case needed here."""

from typing import Tuple

from lira.value_objects import Text

from ..data.dictionary import Dictionary
from ..data.word import Word
from ..data.word_identification import WordIdentification
from ..data.word_lookup_context import WordLookupContext
from .dictionary_hydrator import AsyncDictionaryHydrator
from .part_of_speech_identifier import PartOfSpeechIdentifier


class DictionaryProcessor:
    def __init__(self, dictionary: Dictionary, hydrator: AsyncDictionaryHydrator, *, domain_name: str):
        self.dictionary = dictionary
        self.hydrator = hydrator
        # Bound once at construction, not passed on every identify_word
        # call: a DictionaryProcessor already belongs to exactly one
        # Domain (VocabularyLayer creates both together), the same
        # pattern WordSeeder/RelationshipSeeder use for language_code.
        self.domain_name = domain_name
        self.part_of_speech_identifier = PartOfSpeechIdentifier(dictionary)

    def identify_word(
        self,
        raw_token_text: str,
        *,
        sentence_index: int = 0,
        token_index: int = 0,
        is_sentence_start: bool = False,
        preceding_words: Tuple[str, ...] = (),
        following_words: Tuple[str, ...] = (),
    ) -> Tuple[WordIdentification, ...]:
        """Returns every legitimate candidate sense for this occurrence,
        ranked highest-confidence first -- an empty tuple means no
        seeded or previously-hydrated Word matches yet, in which case
        external hydration is queued and this call returns immediately
        without creating anything. Choosing among more than one
        candidate for a specific sentence occurrence (semantic
        disambiguation) is the Linguistics Layer's job, not this
        method's -- see linguistics/documentation/README.md."""
        context = WordLookupContext(
            raw_text=raw_token_text.strip(),
            normalised_text=raw_token_text.casefold().strip(),
            domain_name=self.domain_name,
            sentence_index=sentence_index,
            token_index=token_index,
            is_sentence_start=is_sentence_start,
            preceding_words=preceding_words,
            following_words=following_words,
        )

        seeded_candidates = self.part_of_speech_identifier.identify_seeded(context)
        if seeded_candidates:
            return seeded_candidates

        # No Word is created here. Hydration runs asynchronously and
        # only ever appends a Word once an external source actually
        # supplies a legitimate grammatical category for it
        # (AsyncDictionaryHydrator._hydrate).
        self.hydrator.queue_hydration(context)
        return ()

    def register_conflicting_sense(self, word: Word) -> Word:
        """Registers `word` as a distinct sense of a lexical form already
        present in this Dictionary under a different meaning -- the
        "modify the word's name" resolution path for a word-sense
        conflict (see vocabulary/documentation/README.md, Cross-Domain
        Vocabulary). `word.text` (the raw surface form a tokenizer would
        produce) is left untouched; only `word.lexical_form` gets the
        sense-numbered suffix, so the two senses are distinguishable by
        identity even though `Dictionary.lookup` still only resolves to
        one of them by default -- `Dictionary.lookup_all` returns every
        coexisting sense. Deciding *whether* a conflict warrants
        this treatment (versus identifying or creating another Domain
        that already owns the other sense) is a judgement call for the
        caller, not something this method infers."""
        word.lexical_form = Text(value=self.dictionary.next_available_lexical_form(word.lexical_form.value))
        self.dictionary.append(word)
        return word
