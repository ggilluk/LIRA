from enum import Enum


class PartOfSpeech(Enum):
    """Values are numeric codes for use in a tensor, not string labels --
    same convention as LinguisticUnitKind. Lives in Vocabulary, not
    Linguistics: classifying a word's part of speech is a lexical
    attribute of that word (Rule 17), same as its meaning."""

    Noun = 0
    Verb = 1
    Adjective = 2
    Adverb = 3
    Pronoun = 4
    Preposition = 5
    Conjunction = 6
    Interjection = 7
    Determiner = 8
