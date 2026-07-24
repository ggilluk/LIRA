# Physics Domain Seeding -- Test Report

Domain: **Physics**  
Source: 23 sentences, 117 unique tokens

## Words already covered by the Common seed

74 tokens resolved immediately, no external lookup: a, after, also, an, and, another, apply, around, at, attract, be, before, between, body, both, branch, can, causes, characteristic, charge, conductor, current, distance, done, electric, energy, equals, exert, exists, field, flow, force, forms, from, has, in, is, magnetic, matter, may, moves, moving, object, of, on, or, particle, points, position, possess, power, property, rate, reach, same, science, several, speed, system, temperature, that, the, through, to, total, until, wave, when, which, while, within, without, work, zero

## New words hydrated

42 lexical forms newly added, with every externally-evidenced part of speech:

- **accelerate** -> VERB
- **acceleration** -> NOUN
- **atom** -> NOUN
- **called** -> VERB
- **circuit** -> NOUN
- **closed** -> ADJECTIVE
- **cold** -> ADJECTIVE
- **collision** -> NOUN
- **conserved** -> VERB
- **crest** -> NOUN
- **depends** -> VERB
- **electron** -> NOUN
- **expand** -> VERB
- **flows** -> VERB
- **gravitational** -> ADJECTIVE
- **heat** -> NOUN, VERB
- **hot** -> ADJECTIVE
- **inverse** -> ADJECTIVE
- **kinetic** -> ADJECTIVE
- **mass** -> NOUN, VERB
- **mechanics** -> NOUN
- **melt** -> VERB
- **momentum** -> NOUN
- **net** -> ADJECTIVE, NOUN
- **neutron** -> NOUN
- **nucleus** -> NOUN
- **open** -> ADJECTIVE
- **physics** -> NOUN
- **potential** -> ADJECTIVE, NOUN
- **proportional** -> ADJECTIVE
- **proton** -> NOUN
- **quantum** -> ADJECTIVE, NOUN
- **resistance** -> NOUN
- **spin** -> NOUN, VERB
- **stationary** -> ADJECTIVE
- **successive** -> ADJECTIVE
- **thermodynamics** -> NOUN
- **transfer** -> NOUN, VERB
- **transfers** -> VERB
- **velocity** -> NOUN
- **voltage** -> NOUN
- **wavelength** -> NOUN

## Existing words enriched

- **flow**: had NOUN; added VERB
- **moving**: had VERB; added ADJECTIVE
- **wave**: had VERB; added NOUN

## Unresolved words

1 tokens had no seeded sense and no fixture evidence, and were correctly left unresolved rather than guessed: studies

## Duplicate prevention (repeat-processing test)

- Dictionary size after first run: 2053
- Dictionary size after second run: 2053
- Confirmed no duplicates created on reprocessing: **True**

## Hydrator telemetry

- First run: {'successful_fetches': 42, 'failed_fetches': 1, 'deduplicated_calls': 5, 'created_words': 49}
- Second run (cumulative): {'successful_fetches': 42, 'failed_fetches': 2, 'deduplicated_calls': 5, 'created_words': 49}
  (successful_fetches/created_words do not grow on the second run for anything already resolved; the deliberately-unresolved words are retried and fail again each pass, since nothing in this pipeline blacklists a word after one failed lookup.)

## Word-sense conflicts found and resolved

Checking every fixture word against the Common seed directly found collisions (`object`, `depend`, `position`, `particle`, and -- once the 1163-word Common definition-gap batch added Common senses of its own for them -- `wave`, `moving`, `flow`) -- identify_word() only queues hydration when *no* existing sense at all matches, regardless of part_of_speech, so these never reached ExternalDictionaryAdapter. `depend`/`position` turned out to have compatible general-English definitions already in Common, fine as-is. The rest are genuine conflicts -- `object`/`particle` because Common's senses are the grammatical terms ("the noun that receives the action of a verb", "a function word that does not fit the main parts of speech"); `wave`/`moving`/`flow` because Common's new sense is a different part_of_speech entirely (Common's `wave` is VERB, Physics needs NOUN; Common's `moving` is VERB, Physics needs ADJECTIVE; Common's `flow` is NOUN, Physics needs VERB) -- neither is the physics one this domain's own relationships need. Resolved via `DictionaryProcessor.register_conflicting_sense` -- the same, pre-existing conflict-resolution path a Domain owner would use for any other word-sense conflict (`vocabulary/documentation/README.md`, 9.2), not a new mechanism. Both senses keep the identical, unmangled `lexical_form` -- no `_2`-style suffix -- and are told apart by their own `entry_id` (Word 4.2) plus the Domain pill the UI already shows:

- `object` (NOUN) registered as a second, Physics-domain sense, `entry_id="85825cf9-fcfc-4961-86f1-a69e2c2d2424"`
- `particle` (NOUN) registered as a second, Physics-domain sense, `entry_id="701833f9-06ac-4bcf-a640-fb72b138963f"`
- `wave` (NOUN) registered as a second, Physics-domain sense, `entry_id="5eafed41-6f2c-4bb1-8804-05067fd1a5bb"`
- `moving` (ADJECTIVE) registered as a second, Physics-domain sense, `entry_id="bc65ecea-3d18-4bdc-a781-4962f997ede1"`
- `flow` (VERB) registered as a second, Physics-domain sense, `entry_id="b5b93190-5411-40b1-8753-5a41e66db6e6"`

## Relationships among hydrated words

RelationshipSeeder only runs once, at Domain creation, against the static Common relationship cache -- it never relates a word added later by hydration. 45 pairs hand-curated for this domain (examples/physics_domain_relationships.py), covering every Lexical Semantic kind with at least 5 real examples, RELATED kept deliberately smallest as the lowest-priority catch-all: **75 edges created**.

| Kind | Edges created |
|------|---------------|
| SYNONYM | 10 |
| ANTONYM | 10 |
| HYPERNYM | 10 |
| HYPONYM | 10 |
| MERONYM | 6 |
| HOLONYM | 6 |
| TROPONYM | 5 |
| ENTAILMENT | 5 |
| CAUSE | 5 |
| RELATED | 8 |

## Final state

- Total words in the Physics Dictionary: 2053
- Total relationships: 1145 (1070 inherited from Common + 75 hand-curated for this domain)
