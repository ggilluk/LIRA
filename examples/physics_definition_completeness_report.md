# Physics Domain -- Definition Word Breakdown Report

Domain: **Physics**

## Completeness

- Physics Words checked (hydrated or conflict-registered, `definition` present): 97
- Total definition tokens across all of them: 1185
- Resolved against this Domain's Dictionary: 812
- Unresolved: 373

### Fully self-contained definitions (1)

Every token in these Words' own definitions already resolves to a Word in this Domain:

stationary

### Definitions with gaps (96)

| Word | Definition tokens | Unresolved |
|------|--------------------|------------|
| science | 18 | 9 |
| energy | 24 | 8 |
| atom | 14 | 7 |
| expand | 17 | 7 |
| inverse | 19 | 7 |
| resistance | 18 | 7 |
| speed | 22 | 7 |
| charge | 11 | 6 |
| matter | 10 | 6 |
| mechanics | 15 | 6 |
| nucleus | 14 | 6 |
| particle_2 | 17 | 6 |
| reach | 11 | 6 |
| system | 15 | 6 |
| temperature | 18 | 6 |
| work | 12 | 6 |
| called | 9 | 5 |
| conserved | 9 | 5 |
| distance | 13 | 5 |
| field | 20 | 5 |
| field | 10 | 5 |
| flow | 12 | 5 |
| magnetic | 15 | 5 |
| melt | 15 | 5 |
| net | 12 | 5 |
| quantum | 16 | 5 |
| total | 10 | 5 |
| wave | 14 | 5 |
| body | 16 | 4 |
| charge | 22 | 4 |
| cold | 13 | 4 |
| conductor | 14 | 4 |
| current | 12 | 4 |
| electric | 8 | 4 |
| electron | 13 | 4 |
| equals | 11 | 4 |
| exert | 11 | 4 |
| exists | 12 | 4 |
| force | 18 | 4 |
| force | 12 | 4 |
| forms | 10 | 4 |
| net | 8 | 4 |
| physics | 14 | 4 |
| points | 5 | 4 |
| possess | 13 | 4 |
| potential | 12 | 4 |
| power | 14 | 4 |
| proportional | 8 | 4 |
| proton | 16 | 4 |
| quantum | 9 | 4 |
| total | 7 | 4 |
| voltage | 9 | 4 |
| wave | 17 | 4 |
| wavelength | 16 | 4 |
| apply | 13 | 3 |
| attract | 10 | 3 |
| causes | 7 | 3 |
| characteristic | 17 | 3 |
| collision | 12 | 3 |
| flow | 10 | 3 |
| flows | 9 | 3 |
| gravitational | 6 | 3 |
| heat | 16 | 3 |
| heat | 7 | 3 |
| hot | 10 | 3 |
| kinetic | 6 | 3 |
| momentum | 17 | 3 |
| neutron | 14 | 3 |
| object_2 | 9 | 3 |
| potential | 17 | 3 |
| power | 14 | 3 |
| property | 8 | 3 |
| rate | 11 | 3 |
| rate | 8 | 3 |
| spin | 8 | 3 |
| spin | 8 | 3 |
| thermodynamics | 15 | 3 |
| work | 20 | 3 |
| acceleration | 13 | 2 |
| circuit | 14 | 2 |
| closed | 11 | 2 |
| crest | 6 | 2 |
| current | 13 | 2 |
| depends | 5 | 2 |
| mass | 15 | 2 |
| mass | 7 | 2 |
| matter | 7 | 2 |
| moves | 7 | 2 |
| moving | 4 | 2 |
| open | 10 | 2 |
| transfer | 15 | 2 |
| accelerate | 11 | 1 |
| successive | 5 | 1 |
| transfer | 14 | 1 |
| transfers | 13 | 1 |
| velocity | 8 | 1 |

### Most frequently unresolved tokens (262 distinct)

| Token | Occurrences |
|-------|-------------|
| measured | 7 |
| physical | 7 |
| amount | 5 |
| motion | 5 |
| space | 5 |
| subatomic | 5 |
| change | 4 |
| degree | 4 |
| especially | 4 |
| make | 4 |
| medium | 4 |
| quality | 4 |
| specified | 4 |
| belonging | 3 |
| branch | 3 |

These are overwhelmingly ordinary general-English vocabulary ("basic", "consisting", "characteristic", plural inflections like "electrons" that don't exact-match the singular `electron` Word's `text`) -- expected, since this demonstration's fixture set (examples/physics_domain_seeding_fixtures.py) was curated for the Physics source text's own vocabulary, not for exhaustive coverage of every word any dictionary definition might use.

## Recursive discovery demonstration

Sample Word: **successive**  
Definition: "Following one after another; consecutive."

- Unresolved before: consecutive
- `queue_definition_hydration` queued: consecutive
- Unresolved after: consecutive
- Newly resolved by this round: (none -- expected, see below)

Most queued tokens stay unresolved even after hydration is queued and drained: this demonstration's fixture set only covers the Physics source text's own vocabulary (examples/physics_domain_seeding_fixtures.py), not the general-English words a dictionary definition happens to use. That's the honest result of a deliberately narrow fixture set standing in for a live API this sandbox can't reach (examples/README.md's Network caveat), not a flaw in queue_definition_hydration itself -- against the real Free Dictionary API in production, most of these would resolve.

