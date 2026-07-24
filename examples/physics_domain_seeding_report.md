# Physics Domain Seeding -- Test Report

Domain: **Physics**  
Source: 23 sentences, 117 unique tokens

## Words already covered by the Common seed

77 tokens resolved immediately, no external lookup: a, after, also, an, and, another, apply, around, at, attract, be, before, between, body, both, branch, can, causes, characteristic, charge, conductor, current, depends, distance, done, electric, energy, equals, exert, exists, field, flow, flows, force, forms, from, has, in, is, magnetic, matter, may, moves, moving, object, of, on, or, particle, points, position, possess, power, property, rate, reach, same, science, several, speed, studies, system, temperature, that, the, through, to, total, until, wave, when, which, while, within, without, work, zero

## New words hydrated

40 lexical forms newly added, with every externally-evidenced part of speech:

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
- **electron** -> NOUN
- **expand** -> VERB
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

0 tokens had no seeded sense and no fixture evidence, and were correctly left unresolved rather than guessed: 

## Duplicate prevention (repeat-processing test)

- Dictionary size after first run: 3075
- Dictionary size after second run: 3075
- Confirmed no duplicates created on reprocessing: **True**

## Hydrator telemetry

- First run: {'successful_fetches': 40, 'failed_fetches': 0, 'deduplicated_calls': 5, 'created_words': 47}
- Second run (cumulative): {'successful_fetches': 40, 'failed_fetches': 0, 'deduplicated_calls': 5, 'created_words': 47}
  (successful_fetches/created_words do not grow on the second run for anything already resolved; the deliberately-unresolved words are retried and fail again each pass, since nothing in this pipeline blacklists a word after one failed lookup.)

## Word-sense conflicts found and resolved

Checking every fixture word against the Common seed directly found collisions (`object`, `depend`, `position`, `particle`, and -- once the 1163-word Common definition-gap batch added Common senses of its own for them -- `wave`, `moving`, `flow`) -- identify_word() only queues hydration when *no* existing sense at all matches, regardless of part_of_speech, so these never reached ExternalDictionaryAdapter. `depend`/`position` turned out to have compatible general-English definitions already in Common, fine as-is. The rest are genuine conflicts -- `object`/`particle` because Common's senses are the grammatical terms ("the noun that receives the action of a verb", "a function word that does not fit the main parts of speech"); `wave`/`moving`/`flow` because Common's new sense is a different part_of_speech entirely (Common's `wave` is VERB, Physics needs NOUN; Common's `moving` is VERB, Physics needs ADJECTIVE; Common's `flow` is NOUN, Physics needs VERB) -- neither is the physics one this domain's own relationships need. Resolved via `DictionaryProcessor.register_conflicting_sense` -- the same, pre-existing conflict-resolution path a Domain owner would use for any other word-sense conflict (`vocabulary/documentation/README.md`, 9.2), not a new mechanism. Both senses keep the identical, unmangled `lexical_form` -- no `_2`-style suffix -- and are told apart by their own `entry_id` (Word 4.2) plus the Domain pill the UI already shows:

- `object` (NOUN) registered as a second, Physics-domain sense, `entry_id="8fbc64a6-a60f-45e0-a903-3dd63f6f14fa"`
- `particle` (NOUN) registered as a second, Physics-domain sense, `entry_id="ca911644-24b6-42ab-b41d-18c5dd9b7640"`
- `wave` (NOUN) registered as a second, Physics-domain sense, `entry_id="6075ae36-7e00-4b78-a691-e05099765774"`
- `moving` (ADJECTIVE) registered as a second, Physics-domain sense, `entry_id="1461f24c-e22e-40de-bf41-45b6666d9b26"`
- `flow` (VERB) registered as a second, Physics-domain sense, `entry_id="fde0e293-a286-4d3d-bb32-5dfbd76b7c80"`

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

- Total words in the Physics Dictionary: 3075
- Total relationships: 3545 (3470 inherited from Common + 75 hand-curated for this domain)
