"""Looks up or creates Word records, queuing background hydration for
unknown words. Punctuation is an ordinary Word (part_of_speech=PUNCTUATION,
seeded from assets/common/en/punctuation.json, WordSeeder.MANDATORY_FILES)
-- it resolves through the same Dictionary lookup as any other mandatory
closed-class word, no special case needed here."""

from lira.value_objects import Text

from ..data.dictionary import Dictionary
from ..data.part_of_speech import PartOfSpeech
from ..data.word import Word
from .dictionary_hydrator import AsyncDictionaryHydrator


class DictionaryProcessor:
    def __init__(self, dictionary: Dictionary, hydrator: AsyncDictionaryHydrator):
        self.dictionary = dictionary
        self.hydrator = hydrator

    def get_or_create_word(self, raw_token_text: str) -> Word:
        lookup_str = raw_token_text.lower().strip()

        existing = self.dictionary.lookup(lookup_str)
        if existing:
            return existing

        fallback_word = Word(
            text=lookup_str, part_of_speech=PartOfSpeech.NOUN,
            definition=Text(value="Pending async network execution resolution structural tracking..."),
            is_fully_hydrated=False,
        )
        self.dictionary.append(fallback_word)
        self.hydrator.queue_hydration(lookup_str)
        return fallback_word

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
