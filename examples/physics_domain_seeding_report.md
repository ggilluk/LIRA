# Physics Domain Seeding -- Test Report

Domain: **Physics**  
Source: 12 sentences, 97 unique tokens

## Words already covered by the Common seed

32 tokens resolved immediately, no external lookup: a, after, an, and, around, at, before, between, both, can, done, from, in, is, may, object, of, on, particle, position, same, several, that, the, through, to, until, when, which, while, within, without

## New words hydrated

63 lexical forms newly added, with every externally-evidenced part of speech:

- **accelerate** -> VERB
- **acceleration** -> NOUN
- **body** -> NOUN
- **called** -> VERB
- **causes** -> VERB
- **charge** -> NOUN, VERB
- **circuit** -> NOUN
- **closed** -> ADJECTIVE
- **cold** -> ADJECTIVE
- **collision** -> NOUN
- **conductor** -> NOUN
- **conserved** -> VERB
- **crest** -> NOUN
- **current** -> ADJECTIVE, NOUN
- **depends** -> VERB
- **distance** -> NOUN
- **electric** -> ADJECTIVE
- **energy** -> NOUN
- **equals** -> VERB
- **exert** -> VERB
- **exists** -> VERB
- **field** -> NOUN, VERB
- **flow** -> NOUN, VERB
- **flows** -> VERB
- **force** -> NOUN, VERB
- **forms** -> NOUN
- **gravitational** -> ADJECTIVE
- **heat** -> NOUN, VERB
- **hot** -> ADJECTIVE
- **kinetic** -> ADJECTIVE
- **magnetic** -> ADJECTIVE
- **mass** -> NOUN, VERB
- **matter** -> NOUN, VERB
- **mechanics** -> NOUN
- **momentum** -> NOUN
- **moves** -> VERB
- **moving** -> ADJECTIVE
- **net** -> ADJECTIVE, NOUN
- **physics** -> NOUN
- **points** -> NOUN
- **possess** -> VERB
- **potential** -> ADJECTIVE, NOUN
- **power** -> NOUN, VERB
- **property** -> NOUN
- **proportional** -> ADJECTIVE
- **quantum** -> ADJECTIVE, NOUN
- **rate** -> NOUN, VERB
- **reach** -> VERB
- **resistance** -> NOUN
- **science** -> NOUN
- **spin** -> NOUN, VERB
- **successive** -> ADJECTIVE
- **system** -> NOUN
- **temperature** -> NOUN
- **thermodynamics** -> NOUN
- **total** -> ADJECTIVE, NOUN
- **transfer** -> NOUN, VERB
- **transfers** -> VERB
- **velocity** -> NOUN
- **voltage** -> NOUN
- **wave** -> NOUN, VERB
- **wavelength** -> NOUN
- **work** -> NOUN, VERB

## Existing words enriched

None in this run -- none of the Physics-specific content words in this source text happened to already exist in the Common seed (Common is closed-class function words plus a narrow set of metalinguistic grammar terms, not general content vocabulary), so every discovered word here was genuinely new rather than a missing-sense addition to an existing entry. The pipeline supports this case (a new external part of speech is added to an existing lexical form whenever it doesn't already have that exact (text, part_of_speech) pair) -- this run simply didn't exercise it.

## Unresolved words

2 tokens had no seeded sense and no fixture evidence, and were correctly left unresolved rather than guessed: branch, studies

## Duplicate prevention (repeat-processing test)

- Dictionary size after first run: 632
- Dictionary size after second run: 632
- Confirmed no duplicates created on reprocessing: **True**

## Hydrator telemetry

- First run: {'successful_fetches': 63, 'failed_fetches': 2, 'deduplicated_calls': 17, 'created_words': 81}
- Second run (cumulative): {'successful_fetches': 63, 'failed_fetches': 4, 'deduplicated_calls': 17, 'created_words': 81}
  (successful_fetches/created_words do not grow on the second run for anything already resolved; the deliberately-unresolved words are retried and fail again each pass, since nothing in this pipeline blacklists a word after one failed lookup.)

## Final state

- Total words in the Physics Dictionary: 632
- Total relationships: 138
