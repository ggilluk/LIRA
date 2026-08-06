# Relationship contradiction audit -- semantic_relationships.json

Scanned 2669 seeded relationships in the Common Vocabulary Relationship Cache (`assets/common/en/relationships/semantic_relationships.json`) for logically impossible combinations: the same pair of words carrying more than one relationship kind at once (e.g. SYNONYM *and* HYPERNYM/HYPONYM between the same two words -- a pair can't both mean the same thing and be broader/narrower than each other).

## Result

- **37 word pairs** (74 directed edges) carry more than one relationship kind simultaneously.
- No exact duplicate edges, no genuine HYPERNYM/HYPERNYM or MERONYM/MERONYM 2-cycles found.
- **1 of the 37** is a genuine *direction* error, not just a redundant edge: `method`/`procedure` has HYPERNYM/HYPONYM stored backwards.
- Root cause: the 14-parallel-subagent drafting pass behind `examples/common_semantic_completion.py` independently proposed relationships for these 37 pairs under two different kinds each (most often RELATED *and* a more specific kind like SYNONYM) -- the aggregation pass only deduplicated the reverse direction of *identical* proposals, not proposals under a *different* kind for the same pair.

None of these edges have been changed yet -- this is a proposed correction list for review before anything is written back to the asset files.

## Proposed corrections

| # | Pair | Kinds in conflict | Recommended fix | Confidence | Reasoning |
|---|------|--------------------|--------------------------------|:---:|-----------|
| 1 | `advice` (NOUN) / `suggestion` (NOUN) | RELATED + SYNONYM | Drop RELATED, keep SYNONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |
| 2 | `answer` (NOUN) / `question` (NOUN) | ANTONYM + RELATED | Drop RELATED, keep ANTONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |
| 3 | `antonym` (NOUN) / `synonym` (NOUN) | ANTONYM + RELATED | Drop RELATED, keep ANTONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |
| 4 | `area` (NOUN) / `region` (NOUN) | HYPERNYM_HYPONYM + SYNONYM | Drop HYPERNYM/HYPONYM, keep SYNONYM | medium | Both definitions mutually gloss each other as near-equivalents ("area: A region or particular part..."; "region: An area, especially part of a country...") rather than one clearly nesting inside the other -- genuine synonym pair, not a broader/narrower one. |
| 5 | `attempt` (NOUN) / `effort` (NOUN) | RELATED + SYNONYM | Drop RELATED, keep SYNONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |
| 6 | `change` (VERB) / `transform` (VERB) | HYPERNYM_HYPONYM + SYNONYM | Drop SYNONYM, keep HYPERNYM/HYPONYM | high | transform's own definition says "to make a marked CHANGE" -- transform is a specific (marked) kind of change, matching the stored transform->HYPERNYM->change direction. |
| 7 | `classify` (VERB) / `grade` (VERB) | HYPERNYM_HYPONYM + SYNONYM | Drop SYNONYM, keep HYPERNYM/HYPONYM | medium | grade ("arrange in order of quality/size/rank") is a specific manner of classify ("arrange into groups/categories") -- narrower, not identical in meaning; matches the stored grade->HYPERNYM->classify direction. |
| 8 | `clause` (NOUN) / `sentence` (NOUN) | MERONYM_HOLONYM + RELATED | Drop RELATED, keep MERONYM/HOLONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |
| 9 | `command` (NOUN) / `instruction` (NOUN) | HYPERNYM_HYPONYM + SYNONYM | Drop SYNONYM, keep HYPERNYM/HYPONYM | high | command's own definition is "An authoritative INSTRUCTION to do something" -- command is a specific (authoritative) kind of instruction, matching the stored command->HYPERNYM->instruction direction. |
| 10 | `communication` (NOUN) / `speech` (NOUN) | HYPERNYM_HYPONYM + RELATED | Drop RELATED, keep HYPERNYM/HYPONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. (speech->HYPERNYM->communication is well-supported: speech is a specific mode of communication.) |
| 11 | `demonstrate` (VERB) / `prove` (VERB) | RELATED + SYNONYM | Drop RELATED, keep SYNONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |
| 12 | `demonstrate` (VERB) / `show` (VERB) | HYPERNYM_HYPONYM + SYNONYM | Drop SYNONYM, keep HYPERNYM/HYPONYM | high | demonstrate's own definition is "To SHOW clearly, especially by giving proof" -- demonstrate is a specific (evidenced) kind of showing, matching the stored demonstrate->HYPERNYM->show direction. |
| 13 | `difficulty` (NOUN) / `problem` (NOUN) | RELATED + SYNONYM | Drop RELATED, keep SYNONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |
| 14 | `domain` (NOUN) / `field` (NOUN) | RELATED + SYNONYM | Drop RELATED, keep SYNONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |
| 15 | `duration` (NOUN) / `period` (NOUN) | RELATED + SYNONYM | Drop RELATED, keep SYNONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |
| 16 | `entity` (NOUN) / `thing` (NOUN) | HYPERNYM_HYPONYM + SYNONYM | Drop SYNONYM, keep HYPERNYM/HYPONYM | high | thing's own definition is "An ENTITY that is not a person" -- thing is entity minus the person case, narrower; matches the stored thing->HYPERNYM->entity direction. |
| 17 | `event` (NOUN) / `incident` (NOUN) | HYPERNYM_HYPONYM + SYNONYM | Drop SYNONYM, keep HYPERNYM/HYPONYM | high | incident's own definition is "An individual EVENT... especially one that is unusual/noteworthy/unpleasant" -- incident is a specific kind of event, matching the stored incident->HYPERNYM->event direction. |
| 18 | `experiment` (NOUN) / `test` (NOUN) | RELATED + SYNONYM | Drop RELATED, keep SYNONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |
| 19 | `explanation` (NOUN) / `reason` (NOUN) | RELATED + SYNONYM | Drop RELATED, keep SYNONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |
| 20 | `frequency` (NOUN) / `rate` (NOUN) | RELATED + SYNONYM | Drop RELATED, keep SYNONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |
| 21 | `go` (VERB) / `travel` (VERB) | HYPERNYM_HYPONYM + SYNONYM | Drop SYNONYM, keep HYPERNYM/HYPONYM | high | travel's own definition is "To GO from one place to another, typically over a distance" -- travel is a specific (distance) kind of going, matching the stored travel->HYPERNYM->go direction. |
| 22 | `identifier` (NOUN) / `name` (NOUN) | RELATED + SYNONYM | Drop RELATED, keep SYNONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |
| 23 | `justification` (NOUN) / `reason` (NOUN) | RELATED + SYNONYM | Drop RELATED, keep SYNONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |
| 24 | `limit` (NOUN) / `restriction` (NOUN) | RELATED + SYNONYM | Drop RELATED, keep SYNONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |
| 25 | `manner` (NOUN) / `style` (NOUN) | RELATED + SYNONYM | Drop RELATED, keep SYNONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |
| 26 | `mark` (NOUN) / `symbol` (NOUN) | RELATED + SYNONYM | Drop RELATED, keep SYNONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |
| 27 | `method` (NOUN) / `procedure` (NOUN) | HYPERNYM_HYPONYM + SYNONYM | Drop SYNONYM; HYPERNYM/HYPONYM direction was backwards -- reverse it | high | DIRECTION ERROR, not just a redundant edge: method's own definition is "A particular PROCEDURE or way of doing something" -- method is the narrower/specific term and procedure the broader one, but the cache currently stores it backwards (procedure->HYPERNYM->method, i.e. procedure isA method). Should be method->HYPERNYM->procedure / procedure->HYPONYM->method. |
| 28 | `mind` (NOUN) / `spirit` (NOUN) | RELATED + SYNONYM | Drop RELATED, keep SYNONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |
| 29 | `network` (NOUN) / `system` (NOUN) | HYPERNYM_HYPONYM + SYNONYM | Drop SYNONYM, keep HYPERNYM/HYPONYM | medium | network's own definition is "A group or SYSTEM of interconnected people, things, or parts" -- network is a specific kind of system, matching the stored network->HYPERNYM->system direction. |
| 30 | `part` (NOUN) / `segment` (NOUN) | HYPERNYM_HYPONYM + SYNONYM | Drop SYNONYM, keep HYPERNYM/HYPONYM | high | segment's own definition is "A PART into which something is... divided" -- segment is a specific kind of part, matching the stored segment->HYPERNYM->part direction, and consistent with this cache's existing part hypernym siblings (rest, share, subdivision, head). |
| 31 | `percent` (NOUN) / `proportion` (NOUN) | HYPERNYM_HYPONYM + RELATED | Drop RELATED, keep HYPERNYM/HYPONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |
| 32 | `person` (NOUN) / `speaker` (NOUN) | HYPERNYM_HYPONYM + RELATED | Drop RELATED, keep HYPERNYM/HYPONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |
| 33 | `possession` (NOUN) / `property` (NOUN) | RELATED + SYNONYM | Drop RELATED, keep SYNONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |
| 34 | `pound` (NOUN) / `sterling` (NOUN) | RELATED + SYNONYM | Drop RELATED, keep SYNONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |
| 35 | `research` (NOUN) / `study` (NOUN) | HYPERNYM_HYPONYM + SYNONYM | Drop SYNONYM, keep HYPERNYM/HYPONYM | medium | study's own definition is "...especially through reading or RESEARCH" -- study is the broader activity, research a specific method within it, matching the stored research->HYPERNYM->study direction. |
| 36 | `sense` (NOUN) / `sight` (NOUN) | HYPERNYM_HYPONYM + RELATED | Drop RELATED, keep HYPERNYM/HYPONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |
| 37 | `situation` (NOUN) / `state` (NOUN) | RELATED + SYNONYM | Drop RELATED, keep SYNONYM | high | RELATED is this cache's documented lowest-priority kind ("kept out of RELATED and reclassified where a better fit existed", examples/README.md's Common semantic completion section) -- a more specific kind is already seeded for this pair, so the RELATED edge is redundant and should be removed. |

## Edges this would remove (76)

- **advice / suggestion**:
    - REMOVE: suggestion (NOUN) -RELATED-> advice (NOUN)
    - REMOVE: advice (NOUN) -RELATED-> suggestion (NOUN)
- **answer / question**:
    - REMOVE: answer (NOUN) -RELATED-> question (NOUN)
    - REMOVE: question (NOUN) -RELATED-> answer (NOUN)
- **antonym / synonym**:
    - REMOVE: antonym (NOUN) -RELATED-> synonym (NOUN)
    - REMOVE: synonym (NOUN) -RELATED-> antonym (NOUN)
- **area / region**:
    - REMOVE: region (NOUN) -HYPERNYM-> area (NOUN)
    - REMOVE: area (NOUN) -HYPONYM-> region (NOUN)
- **attempt / effort**:
    - REMOVE: effort (NOUN) -RELATED-> attempt (NOUN)
    - REMOVE: attempt (NOUN) -RELATED-> effort (NOUN)
- **change / transform**:
    - REMOVE: change (VERB) -SYNONYM-> transform (VERB)
    - REMOVE: transform (VERB) -SYNONYM-> change (VERB)
- **classify / grade**:
    - REMOVE: classify (VERB) -SYNONYM-> grade (VERB)
    - REMOVE: grade (VERB) -SYNONYM-> classify (VERB)
- **clause / sentence**:
    - REMOVE: sentence (NOUN) -RELATED-> clause (NOUN)
    - REMOVE: clause (NOUN) -RELATED-> sentence (NOUN)
- **command / instruction**:
    - REMOVE: instruction (NOUN) -SYNONYM-> command (NOUN)
    - REMOVE: command (NOUN) -SYNONYM-> instruction (NOUN)
- **communication / speech**:
    - REMOVE: communication (NOUN) -RELATED-> speech (NOUN)
    - REMOVE: speech (NOUN) -RELATED-> communication (NOUN)
- **demonstrate / prove**:
    - REMOVE: demonstrate (VERB) -RELATED-> prove (VERB)
    - REMOVE: prove (VERB) -RELATED-> demonstrate (VERB)
- **demonstrate / show**:
    - REMOVE: show (VERB) -SYNONYM-> demonstrate (VERB)
    - REMOVE: demonstrate (VERB) -SYNONYM-> show (VERB)
- **difficulty / problem**:
    - REMOVE: problem (NOUN) -RELATED-> difficulty (NOUN)
    - REMOVE: difficulty (NOUN) -RELATED-> problem (NOUN)
- **domain / field**:
    - REMOVE: domain (NOUN) -RELATED-> field (NOUN)
    - REMOVE: field (NOUN) -RELATED-> domain (NOUN)
- **duration / period**:
    - REMOVE: duration (NOUN) -RELATED-> period (NOUN)
    - REMOVE: period (NOUN) -RELATED-> duration (NOUN)
- **entity / thing**:
    - REMOVE: entity (NOUN) -SYNONYM-> thing (NOUN)
    - REMOVE: thing (NOUN) -SYNONYM-> entity (NOUN)
- **event / incident**:
    - REMOVE: event (NOUN) -SYNONYM-> incident (NOUN)
    - REMOVE: incident (NOUN) -SYNONYM-> event (NOUN)
- **experiment / test**:
    - REMOVE: test (NOUN) -RELATED-> experiment (NOUN)
    - REMOVE: experiment (NOUN) -RELATED-> test (NOUN)
- **explanation / reason**:
    - REMOVE: explanation (NOUN) -RELATED-> reason (NOUN)
    - REMOVE: reason (NOUN) -RELATED-> explanation (NOUN)
- **frequency / rate**:
    - REMOVE: rate (NOUN) -RELATED-> frequency (NOUN)
    - REMOVE: frequency (NOUN) -RELATED-> rate (NOUN)
- **go / travel**:
    - REMOVE: go (VERB) -SYNONYM-> travel (VERB)
    - REMOVE: travel (VERB) -SYNONYM-> go (VERB)
- **identifier / name**:
    - REMOVE: identifier (NOUN) -RELATED-> name (NOUN)
    - REMOVE: name (NOUN) -RELATED-> identifier (NOUN)
- **justification / reason**:
    - REMOVE: justification (NOUN) -RELATED-> reason (NOUN)
    - REMOVE: reason (NOUN) -RELATED-> justification (NOUN)
- **limit / restriction**:
    - REMOVE: limit (NOUN) -RELATED-> restriction (NOUN)
    - REMOVE: restriction (NOUN) -RELATED-> limit (NOUN)
- **manner / style**:
    - REMOVE: manner (NOUN) -RELATED-> style (NOUN)
    - REMOVE: style (NOUN) -RELATED-> manner (NOUN)
- **mark / symbol**:
    - REMOVE: mark (NOUN) -RELATED-> symbol (NOUN)
    - REMOVE: symbol (NOUN) -RELATED-> mark (NOUN)
- **method / procedure**:
    - REMOVE: method (NOUN) -SYNONYM-> procedure (NOUN)
    - REMOVE: procedure (NOUN) -SYNONYM-> method (NOUN)
    - REMOVE: procedure (NOUN) -HYPERNYM-> method (NOUN)
    - REMOVE: method (NOUN) -HYPONYM-> procedure (NOUN)
    - ADD: method (NOUN) -HYPERNYM-> procedure (NOUN)
    - ADD: procedure (NOUN) -HYPONYM-> method (NOUN)
- **mind / spirit**:
    - REMOVE: spirit (NOUN) -RELATED-> mind (NOUN)
    - REMOVE: mind (NOUN) -RELATED-> spirit (NOUN)
- **network / system**:
    - REMOVE: system (NOUN) -SYNONYM-> network (NOUN)
    - REMOVE: network (NOUN) -SYNONYM-> system (NOUN)
- **part / segment**:
    - REMOVE: part (NOUN) -SYNONYM-> segment (NOUN)
    - REMOVE: segment (NOUN) -SYNONYM-> part (NOUN)
- **percent / proportion**:
    - REMOVE: proportion (NOUN) -RELATED-> percent (NOUN)
    - REMOVE: percent (NOUN) -RELATED-> proportion (NOUN)
- **person / speaker**:
    - REMOVE: person (NOUN) -RELATED-> speaker (NOUN)
    - REMOVE: speaker (NOUN) -RELATED-> person (NOUN)
- **possession / property**:
    - REMOVE: property (NOUN) -RELATED-> possession (NOUN)
    - REMOVE: possession (NOUN) -RELATED-> property (NOUN)
- **pound / sterling**:
    - REMOVE: sterling (NOUN) -RELATED-> pound (NOUN)
    - REMOVE: pound (NOUN) -RELATED-> sterling (NOUN)
- **research / study**:
    - REMOVE: study (NOUN) -SYNONYM-> research (NOUN)
    - REMOVE: research (NOUN) -SYNONYM-> study (NOUN)
- **sense / sight**:
    - REMOVE: sense (NOUN/ability.common) -RELATED-> sight (NOUN)
    - REMOVE: sight (NOUN) -RELATED-> sense (NOUN/ability.common)
- **situation / state**:
    - REMOVE: situation (NOUN) -RELATED-> state (NOUN)
    - REMOVE: state (NOUN) -RELATED-> situation (NOUN)
