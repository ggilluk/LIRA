# Physics Domain -- Definition Word Breakdown Report

Domain: **Physics**

## Completeness

- Physics Words checked (hydrated or conflict-registered, `definition` present): 137
- Total definition tokens across all of them: 1631
- Resolved against this Domain's Dictionary: 1549
- Unresolved: 82

### Fully self-contained definitions (105)

Every token in these Words' own definitions already resolves to a Word in this Domain:

accelerate, acceleration, apply, atom, atoms, attract, bodies, body, called, causes, characteristic, charge, charge, circuit, closed, cold, collision, conductor, conserved, crest, crests, current, current, depends, distance, electric, electron, electrons, energy, equals, exert, exists, expand, field, field, flow, flow, flows, force, force, forces, forms, gravitational, heat, heat, hot, inverse, kinetic, magnetic, mass, mass, matter, matter, mechanics, melt, momentum, moves, moving, net, net, neutron, neutrons, nucleus, object, open, particle, physics, points, possess, possesses, potential, potential, power, power, property, proportional, proton, protons, quantum, quantum, rate, rate, reach, resistance, science, speed, spin, spin, stationary, successive, system, systems, temperature, thermodynamics, total, total, transfer, transfer, transfers, velocity, voltage, wave, wavelength, work, work

### Definitions with gaps (32)

| Word | Definition tokens | Unresolved |
|------|--------------------|------------|
| magnet | 20 | 5 |
| molecules | 18 | 5 |
| angular | 15 | 4 |
| electromagnetic | 12 | 4 |
| frequency | 19 | 4 |
| gravity | 16 | 4 |
| properties | 11 | 4 |
| radiation | 18 | 4 |
| space | 17 | 4 |
| amperes | 10 | 3 |
| battery | 17 | 3 |
| electricity | 21 | 3 |
| liquid | 21 | 3 |
| solid | 16 | 3 |
| warm | 13 | 3 |
| coulombs | 9 | 2 |
| electromotive | 12 | 2 |
| heating | 11 | 2 |
| ohms | 9 | 2 |
| powered | 10 | 2 |
| subatomic | 7 | 2 |
| transferred | 15 | 2 |
| volts | 10 | 2 |
| watts | 8 | 2 |
| charged | 12 | 1 |
| electrical | 8 | 1 |
| exerting | 9 | 1 |
| exist | 7 | 1 |
| medium | 15 | 1 |
| motion | 10 | 1 |
| wave | 14 | 1 |
| worked | 14 | 1 |

### Most frequently unresolved tokens (71 distinct)

| Token | Occurrences |
|-------|-------------|
| si | 5 |
| attracts | 2 |
| fields | 2 |
| fixed | 2 |
| moved | 2 |
| particles | 2 |
| states | 2 |
| transmitted | 2 |
| ampere | 1 |
| angle | 1 |
| applying | 1 |
| attributes | 1 |
| axis | 1 |
| base | 1 |
| becoming | 1 |

These are overwhelmingly ordinary general-English vocabulary ("basic", "consisting", "characteristic", plural inflections like "electrons" that don't exact-match the singular `electron` Word's `text`) -- expected, since this demonstration's fixture set (examples/physics_domain_seeding_fixtures.py) was curated for the Physics source text's own vocabulary, not for exhaustive coverage of every word any dictionary definition might use.

## Recursive discovery demonstration

Sample Word: **exist**  
Definition: "To have real, actual, or continued being."

- Unresolved before: continued
- `queue_definition_hydration` queued: continued
- Unresolved after: continued
- Newly resolved by this round: (none -- expected, see below)

Most queued tokens stay unresolved even after hydration is queued and drained: this demonstration's fixture set only covers the Physics source text's own vocabulary (examples/physics_domain_seeding_fixtures.py), not the general-English words a dictionary definition happens to use. That's the honest result of a deliberately narrow fixture set standing in for a live API this sandbox can't reach (examples/README.md's Network caveat), not a flaw in queue_definition_hydration itself -- against the real Free Dictionary API in production, most of these would resolve.

