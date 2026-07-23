# Physics Domain Seeding -- Test Report

Domain: **Physics**  
Source: 23 sentences, 117 unique tokens

## Words already covered by the Common seed

39 tokens resolved immediately, no external lookup: a, after, also, an, and, another, around, at, be, before, between, both, branch, can, done, from, has, in, is, may, object, of, on, or, particle, position, same, several, that, the, through, to, until, when, which, while, within, without, zero

## New words hydrated

77 lexical forms newly added, with every externally-evidenced part of speech:

- **accelerate** -> VERB
- **acceleration** -> NOUN
- **apply** -> VERB
- **atom** -> NOUN
- **attract** -> VERB
- **body** -> NOUN
- **called** -> VERB
- **causes** -> VERB
- **characteristic** -> NOUN
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
- **electron** -> NOUN
- **energy** -> NOUN
- **equals** -> VERB
- **exert** -> VERB
- **exists** -> VERB
- **expand** -> VERB
- **field** -> NOUN, VERB
- **flow** -> NOUN, VERB
- **flows** -> VERB
- **force** -> NOUN, VERB
- **forms** -> NOUN
- **gravitational** -> ADJECTIVE
- **heat** -> NOUN, VERB
- **hot** -> ADJECTIVE
- **inverse** -> ADJECTIVE
- **kinetic** -> ADJECTIVE
- **magnetic** -> ADJECTIVE
- **mass** -> NOUN, VERB
- **matter** -> NOUN, VERB
- **mechanics** -> NOUN
- **melt** -> VERB
- **momentum** -> NOUN
- **moves** -> VERB
- **moving** -> ADJECTIVE
- **net** -> ADJECTIVE, NOUN
- **neutron** -> NOUN
- **nucleus** -> NOUN
- **open** -> ADJECTIVE
- **physics** -> NOUN
- **points** -> NOUN
- **possess** -> VERB
- **potential** -> ADJECTIVE, NOUN
- **power** -> NOUN, VERB
- **property** -> NOUN
- **proportional** -> ADJECTIVE
- **proton** -> NOUN
- **quantum** -> ADJECTIVE, NOUN
- **rate** -> NOUN, VERB
- **reach** -> VERB
- **resistance** -> NOUN
- **science** -> NOUN
- **speed** -> NOUN
- **spin** -> NOUN, VERB
- **stationary** -> ADJECTIVE
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

1 tokens had no seeded sense and no fixture evidence, and were correctly left unresolved rather than guessed: studies

## Duplicate prevention (repeat-processing test)

- Dictionary size after first run: 935
- Dictionary size after second run: 935
- Confirmed no duplicates created on reprocessing: **True**

## Hydrator telemetry

- First run: {'successful_fetches': 77, 'failed_fetches': 1, 'deduplicated_calls': 10, 'created_words': 95}
- Second run (cumulative): {'successful_fetches': 77, 'failed_fetches': 2, 'deduplicated_calls': 10, 'created_words': 95}
  (successful_fetches/created_words do not grow on the second run for anything already resolved; the deliberately-unresolved words are retried and fail again each pass, since nothing in this pipeline blacklists a word after one failed lookup.)

## Word-sense conflicts found and resolved

Checking every fixture word against the Common seed directly found 4 collisions (`object`, `depend`, `position`, `particle`) -- identify_word() only queues hydration when *no* existing sense at all matches, so these never reached ExternalDictionaryAdapter. `depend`/`position` turned out to have compatible general-English definitions already in Common, fine as-is. `object`/`particle` are genuine conflicts -- Common's senses are the grammatical terms ("the noun that receives the action of a verb", "a function word that does not fit the main parts of speech"), not the physics ones this domain's own relationships need. Resolved via `DictionaryProcessor.register_conflicting_sense` -- the same, pre-existing conflict-resolution path a Domain owner would use for any other word-sense conflict (`vocabulary/documentation/README.md`, 9.2), not a new mechanism. Both senses keep the identical, unmangled `lexical_form` -- no `_2`-style suffix -- and are told apart by their own `entry_id` (Word 4.2) plus the Domain pill the UI already shows:

- `object` (NOUN) registered as a second, Physics-domain sense, `entry_id="6904f387-a8c9-45a9-901e-b512d01cef16"`
- `particle` (NOUN) registered as a second, Physics-domain sense, `entry_id="1c93b9af-a353-469e-8035-666f52c513b8"`

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

- Total words in the Physics Dictionary: 935
- Total relationships: 363 (288 inherited from Common + 75 hand-curated for this domain)
