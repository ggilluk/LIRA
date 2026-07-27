"""Test sentences for the Linguistics Layer read path
(`Phrase.read()`/`Clause.read()`/`Sentence.read()`) -- see
linguistics_sentence_reading.py, the runner that exercises them.

Corpus A -- unseeded-word behaviour (Linguistics Layer developer
specification 7, 23). These sentences are reconstructed from words this
project's own implementation record (the design/prototyping phase's
findings, captured in this session's implementation plan) verified as
absent from the seeded Common Dictionary while this feature was being
designed: cat, sleeps, dog, barks, fox, runs, aware, John, Mary,
laughed, communicates, faculty, processes, stimuli, garden. A later
context compaction removed the verbatim pasted specification from this
session, so these are NOT claimed as a byte-for-byte reproduction of
the original spec's 12 test sentences -- they're built to exercise the
same property those sentences asserted (an unseeded word inside
otherwise-ordinary sentence structure, spec 7's "continue reading
surrounding structure where possible"). Per spec 23's own rule ("a test
must not silently supply unseeded lexical data"), the runner does not
hard-code which tokens are unseeded -- it checks each one against the
live Dictionary itself (Precondition pass) and asserts Sentence.read()'s
behaviour against that observed, current ground truth, not a guess.

Corpus B -- fully-seeded control corpus. Every word verified seeded
(PartOfSpeech confirmed via DictionaryProcessor.identify_word) before
inclusion, exercising the constructs Corpus A's unseeded words prevent
from being cleanly demonstrated: a valid simple declarative with a
copula complement, an invalid no-predicate sentence (spec 20's own
worked example shape -- individually valid phrases, no VERB_PHRASE),
two seeded words disambiguated to NOUN by determiner context, a
VERB_PHRASE plus an infinitive-phrase modifier plus an object,
phrase-internal coordination forming one subject NOUN_PHRASE, and a
PREPOSITIONAL_PHRASE modifier."""

CORPUS_A_UNSEEDED_WORD_SENTENCES = [
    "The cat sleeps.",
    "The dog barks.",
    "The fox runs.",
    "A cat is aware.",
    "John laughed.",
    "Mary communicates.",
    "The cat perceives the word.",
    "The fox over the dog.",
    "A faculty processes stimuli.",
    "The cat is in the garden.",
    "John and Mary laughed.",
    "The cat that sleeps is aware.",
]

CORPUS_B_CONTROL_SENTENCES = [
    ("A meaning is a representation.", "simple declarative, copula + complement"),
    ("The word over the meaning.", "invalid: no predicate (spec 20's own worked example shape)"),
    ("The use is a state.", "ambiguous seeded words (NOUN/VERB) resolved to NOUN by determiner context"),
    ("The word wants to use the meaning.", "VERB_PHRASE predicate + infinitive-phrase modifier + object"),
    ("The meaning and the word perceive the state.", "phrase-internal coordination forming one subject NOUN_PHRASE"),
    ("A meaning is in the word.", "PREPOSITIONAL_PHRASE modifier"),
]
