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
        "keep both, tell them apart by identity" resolution path for a
        word-sense conflict (see vocabulary/documentation/README.md,
        9.2). Neither `word.text` nor `word.lexical_form` is touched:
        both senses keep the identical, unmangled lexical_form (no
        "particle_2"-style suffix), and stay distinguishable by their
        own `entry_id` (Word 4.2) instead -- `Dictionary.lookup` still
        only resolves to one of them by default (whichever was appended
        first), but `Dictionary.lookup_all` returns every coexisting
        sense, and `word.entry_id` uniquely names this one. Deciding
        *whether* a conflict warrants this treatment (versus identifying
        or creating another Domain that already owns the other sense) is
        a judgement call for the caller, not something this method
        infers."""
        self.dictionary.append(word)
        return word

    def queue_definition_hydration(self, word: Word) -> Tuple[str, ...]:
        """Walks `word.definition_words(self.dictionary)` (4.4) and queues
        external hydration -- the same AsyncDictionaryHydrator.queue_hydration
        path identify_word itself uses (9.6) -- for every token that came
        back unresolved. A gap in one Word's own definition is treated as
        a discovery signal, not a blocker: the same recursive-vocabulary-
        discovery idea documented at 9.7. Returns the distinct surface
        forms actually queued, in first-seen order; a form already
        in-flight (AsyncDictionaryHydrator's own dedup) is silently
        skipped, same as any other queue_hydration call."""
        queued = []
        seen = set()
        for reference in word.definition_words(self.dictionary):
            if reference.word is not None:
                continue
            normalised_text = reference.text.casefold()
            if normalised_text in seen:
                continue
            seen.add(normalised_text)
            context = WordLookupContext(
                raw_text=reference.text,
                normalised_text=normalised_text,
                domain_name=self.domain_name,
            )
            self.hydrator.queue_hydration(context)
            queued.append(reference.text)
        return tuple(queued)
