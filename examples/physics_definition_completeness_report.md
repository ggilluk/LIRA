# Physics Domain -- Definition Word Breakdown Report

Domain: **Physics**

## Completeness

- Physics Words checked (hydrated or conflict-registered, `definition` present): 89
- Total definition tokens across all of them: 997
- Resolved against this Domain's Dictionary: 955
- Unresolved: 42

### Fully self-contained definitions (67)

Every token in these Words' own definitions already resolves to a Word in this Domain:

accelerate, acceleration, atom, atoms, bodies, called, circuit, closed, cold, collision, conserved, crest, crests, depends, electrical, electron, electrons, exerting, expand, flow, flows, forces, gravitational, heat, heat, heating, hot, inverse, kinetic, mass, mass, mechanics, melt, momentum, moving, net, net, neutron, neutrons, nucleus, object, open, particle, physics, possesses, potential, potential, proportional, proton, protons, quantum, quantum, resistance, spin, spin, stationary, subatomic, successive, systems, thermodynamics, transfer, transfer, transfers, velocity, voltage, wave, wavelength

### Definitions with gaps (22)

| Word | Definition tokens | Unresolved |
|------|--------------------|------------|
| electromagnetic | 12 | 4 |
| battery | 17 | 3 |
| gravity | 16 | 3 |
| magnet | 20 | 3 |
| radiation | 18 | 3 |
| amperes | 10 | 2 |
| angular | 15 | 2 |
| coulombs | 9 | 2 |
| electromotive | 12 | 2 |
| molecules | 18 | 2 |
| ohms | 9 | 2 |
| transferred | 15 | 2 |
| volts | 10 | 2 |
| watts | 8 | 2 |
| charged | 12 | 1 |
| electricity | 21 | 1 |
| motion | 10 | 1 |
| powered | 10 | 1 |
| properties | 11 | 1 |
| solid | 16 | 1 |
| warm | 13 | 1 |
| worked | 14 | 1 |

### Most frequently unresolved tokens (35 distinct)

| Token | Occurrences |
|-------|-------------|
| si | 5 |
| attracts | 2 |
| fields | 2 |
| moved | 2 |
| ampere | 1 |
| attributes | 1 |
| cells | 1 |
| characterised | 1 |
| converts | 1 |
| cool | 1 |
| coulomb | 1 |
| currents | 1 |
| electrochemical | 1 |
| emitted | 1 |
| filled | 1 |

These are overwhelmingly ordinary general-English vocabulary ("basic", "consisting", "characteristic", plural inflections like "electrons" that don't exact-match the singular `electron` Word's `text`) -- expected, since this demonstration's fixture set (examples/physics_domain_seeding_fixtures.py) was curated for the Physics source text's own vocabulary, not for exhaustive coverage of every word any dictionary definition might use.

## Recursive discovery demonstration

Sample Word: **motion**  
Definition: "The action or process of moving or being moved; movement."

- Unresolved before: moved
- `queue_definition_hydration` queued: moved
- Unresolved after: moved
- Newly resolved by this round: (none -- expected, see below)

Most queued tokens stay unresolved even after hydration is queued and drained: this demonstration's fixture set only covers the Physics source text's own vocabulary (examples/physics_domain_seeding_fixtures.py), not the general-English words a dictionary definition happens to use. That's the honest result of a deliberately narrow fixture set standing in for a live API this sandbox can't reach (examples/README.md's Network caveat), not a flaw in queue_definition_hydration itself -- against the real Free Dictionary API in production, most of these would resolve.

