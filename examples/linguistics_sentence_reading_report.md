# Linguistics Layer Read Path Verification Report

## Precondition pass -- live seeded status of every corpus token

| Token | Seeded parts of speech |
|---|---|
| A | DETERMINER |
| a | DETERMINER |
| and | CONJUNCTION, VERB |
| aware | _(unseeded)_ |
| barks | _(unseeded)_ |
| cat | _(unseeded)_ |
| communicates | _(unseeded)_ |
| dog | _(unseeded)_ |
| faculty | _(unseeded)_ |
| fox | _(unseeded)_ |
| garden | _(unseeded)_ |
| in | PREPOSITION |
| is | AUXILIARY, VERB |
| John | _(unseeded)_ |
| laughed | _(unseeded)_ |
| Mary | _(unseeded)_ |
| meaning | NOUN, VERB |
| over | PREPOSITION |
| perceive | VERB |
| perceives | VERB |
| processes | NOUN |
| representation | NOUN |
| runs | _(unseeded)_ |
| sleeps | _(unseeded)_ |
| state | NOUN, VERB |
| stimuli | _(unseeded)_ |
| that | DETERMINER, PRONOUN |
| The | DETERMINER |
| the | DETERMINER |
| to | PREPOSITION |
| use | NOUN, VERB |
| wants | VERB |
| word | NOUN, VERB |

## Corpus A -- unseeded-word behaviour (spec 7)

| Sentence | Unseeded tokens (live) | Validation | Unknown-word errors match? |
|---|---|---|---|
| The cat sleeps. | cat, sleeps | INVALID | yes |
| The dog barks. | barks, dog | INVALID | yes |
| The fox runs. | fox, runs | INVALID | yes |
| A cat is aware. | aware, cat | UNRESOLVED | yes |
| John laughed. | John, laughed | INVALID | yes |
| Mary communicates. | Mary, communicates | INVALID | yes |
| The cat perceives the word. | cat | UNRESOLVED | yes |
| The fox over the dog. | dog, fox | INVALID | yes |
| A faculty processes stimuli. | faculty, stimuli | INVALID | yes |
| The cat is in the garden. | cat, garden | UNRESOLVED | yes |
| John and Mary laughed. | John, Mary, laughed | INVALID | yes |
| The cat that sleeps is aware. | aware, cat, sleeps | UNRESOLVED | yes |

## Corpus B -- fully-seeded control corpus

| Sentence | Construct | Validation | Subject | Predicate |
|---|---|---|---|---|
| A meaning is a representation. | simple declarative, copula + complement | VALID | A meaning | is |
| The word over the meaning. | invalid: no predicate (spec 20's own worked example shape) | INVALID | The word |  |
| The use is a state. | ambiguous seeded words (NOUN/VERB) resolved to NOUN by determiner context | VALID | The use | is |
| The word wants to use the meaning. | VERB_PHRASE predicate + infinitive-phrase modifier + object | VALID | The word | wants |
| The meaning and the word perceive the state. | phrase-internal coordination forming one subject NOUN_PHRASE | VALID | The meaning and the word | perceive |
| A meaning is in the word. | PREPOSITIONAL_PHRASE modifier | VALID | A meaning | is |

## Dictionary untouched by reading (spec 24)

`Dictionary.lookup_all("is")` candidates before: 2, after: 2 -- unchanged

## Result

All assertions passed.
