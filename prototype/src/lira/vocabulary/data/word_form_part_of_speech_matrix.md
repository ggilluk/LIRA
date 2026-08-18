# Word Form to Part of Speech Matrix

Which word forms apply to which parts of speech, and why each form
exists. `✓` means the form applies to every word of that part of
speech; `✓*` means it applies only to a subset (e.g. not every pronoun
has a distinct reflexive case); `—` means the form does not apply to
that part of speech at all.

| Word Form | Purpose | Noun | Verb | Adjective | Adverb | Pronoun | Determiner | Preposition | Conjunction | Interjection | Numeral | Particle |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Base Lemma Canonical Form | Identifies the standard dictionary form used to represent the word. | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Singular Number Form | Identifies the word form used when referring to one person, thing, place, or idea. | ✓ | — | — | — | ✓* | ✓* | — | — | — | — | — |
| Plural Number Form | Identifies the word form used when referring to more than one person, thing, place, or idea. | ✓ | — | — | — | ✓* | ✓* | — | — | — | — | — |
| Present Tense Form | Identifies the verb form used for an action, event, or state that occurs or exists in the present. | — | ✓ | — | — | — | — | — | — | — | — | — |
| Past Tense Form | Identifies the verb form used for an action, event, or state that occurred or existed in the past. | — | ✓ | — | — | — | — | — | — | — | — | — |
| Third Person Singular Present Form | Identifies the present-tense verb form used when the subject is one person or thing other than the speaker or listener. | — | ✓ | — | — | — | — | — | — | — | — | — |
| Present Participle Form | Identifies the verb form ending in -ing that is used to describe an action or state as ongoing. | — | ✓ | — | — | — | — | — | — | — | — | — |
| Past Participle Form | Identifies the verb form used to construct perfect tenses and passive expressions. | — | ✓ | — | — | — | — | — | — | — | — | — |
| Bare Infinitive Form | Identifies the basic verb form used without the word "to", such as "run" in "can run". | — | ✓ | — | — | — | — | — | — | — | — | — |
| Positive Degree Form | Identifies the basic adjective or adverb form that describes a quality without comparing it with another. | — | — | ✓ | ✓ | — | — | — | — | — | — | — |
| Comparative Degree Form | Identifies the adjective or adverb form used to compare the degree of a quality between two people, things, actions, or states. | — | — | ✓* | ✓* | — | — | — | — | — | — | — |
| Superlative Degree Form | Identifies the adjective or adverb form used to identify the highest or lowest degree of a quality within a group. | — | — | ✓* | ✓* | — | — | — | — | — | — | — |
| First Person Form | Identifies the word form used when the speaker refers to themselves or to a group that includes them. | — | ✓* | — | — | ✓* | — | — | — | — | — | — |
| Second Person Form | Identifies the word form used when referring to the person or people being addressed. | — | ✓* | — | — | ✓* | — | — | — | — | — | — |
| Third Person Form | Identifies the word form used when referring to a person, thing, place, or idea other than the speaker or listener. | — | ✓* | — | — | ✓* | — | — | — | — | — | — |
| Subjective Case Form | Identifies the pronoun form used for the person or thing performing or experiencing what the clause describes. | — | — | — | — | ✓ | — | — | — | — | — | — |
| Objective Case Form | Identifies the pronoun form used for the person or thing affected by an action or following a preposition. | — | — | — | — | ✓ | — | — | — | — | — | — |
| Possessive Case Form | Identifies the noun, pronoun, or determiner form used to show that something belongs or relates to a person or thing. | ✓ | — | — | — | ✓ | ✓* | — | — | — | — | — |
| Reflexive Case Form | Identifies the pronoun form used when a person or thing refers back to itself, such as "myself" or "themselves". | — | — | — | — | ✓ | — | — | — | — | — | — |

## Format and string pattern reference

How each word form is actually recognised or derived, spelling-rule by
spelling-rule -- each numbered Format rule pairs with the identically
numbered String Pattern rule below it (the regex that recognises it, or
`N/A` where the rule can't be determined from spelling alone and needs
a lexical/curated source instead, the same "declared before it's
populated" gap the POS subtype fields themselves currently have --
Noun.isCountable's own docstring, noun.ts).

### Base Lemma Canonical Form

| # | Format | String Pattern |
|---|---|---|
| 1 | Uses the canonical lexical spelling. Example: dog, run, small, quickly. | N/A — canonical status must be assigned lexically; it cannot be inferred reliably from spelling alone. |

### Singular Number Form

| # | Format | String Pattern |
|---|---|---|
| 1 | Uses the lexical singular spelling. Example: dog, child, person. | N/A — singular cannot be determined reliably from spelling alone. |
| 2 | Uses an explicitly assigned singular spelling where number changes the word. Example: this, that. | N/A — requires lexical classification. |

### Plural Number Form

| # | Format | String Pattern |
|---|---|---|
| 1 | Ends with -s. Example: dog → dogs. | `/s$/i` |
| 2 | Ends with -es. Example: box → boxes. | `/es$/i` |
| 3 | Changes -y to -ies. Example: city → cities. | `/ies$/i` |
| 4 | Changes -f/-fe to -ves where applicable. Example: knife → knives. | `/ves$/i` |
| 5 | Uses an irregular spelling. Example: child → children. | N/A — requires lexical exception data. |
| 6 | Uses an unchanged spelling. Example: sheep → sheep. | N/A — requires lexical exception data. |

### Present Tense Form

| # | Format | String Pattern |
|---|---|---|
| 1 | Uses the base verb spelling. Example: walk → walk. | N/A — base present form cannot be inferred reliably from spelling alone. |
| 2 | Uses an irregular present spelling. Example: be → am, be → are. | N/A — requires lexical exception data. |

### Past Tense Form

| # | Format | String Pattern |
|---|---|---|
| 1 | Adds -ed. Example: walk → walked. | `/ed$/i` |
| 2 | Adds -d when the base ends in e. Example: love → loved. | `/ed$/i` |
| 3 | Changes -y to -ied where applicable. Example: try → tried. | `/ied$/i` |
| 4 | Doubles the final consonant before -ed where applicable. Example: stop → stopped. | `/([bcdfghjklmnpqrstvwxyz])\1ed$/i` |
| 5 | Uses an irregular spelling. Example: run → ran. | N/A — requires lexical exception data. |
| 6 | Uses an unchanged spelling. Example: cut → cut. | N/A — requires lexical exception data. |

### Third Person Singular Present Form

| # | Format | String Pattern |
|---|---|---|
| 1 | Adds -s. Example: run → runs. | `/s$/i` |
| 2 | Adds -es. Example: watch → watches. | `/es$/i` |
| 3 | Changes -y to -ies where applicable. Example: try → tries. | `/ies$/i` |
| 4 | Uses an irregular spelling. Example: have → has, be → is. | N/A — requires lexical exception data. |

### Present Participle Form

| # | Format | String Pattern |
|---|---|---|
| 1 | Adds -ing. Example: walk → walking. | `/ing$/i` |
| 2 | Removes final -e and adds -ing where applicable. Example: write → writing. | `/ing$/i` |
| 3 | Doubles the final consonant and adds -ing where applicable. Example: run → running. | `/([bcdfghjklmnpqrstvwxyz])\1ing$/i` |
| 4 | Changes -ie to -ying. Example: lie → lying. | `/ying$/i` |

### Past Participle Form

| # | Format | String Pattern |
|---|---|---|
| 1 | Adds -ed. Example: walk → walked. | `/ed$/i` |
| 2 | Adds -d when the base ends in e. Example: love → loved. | `/ed$/i` |
| 3 | Changes -y to -ied where applicable. Example: try → tried. | `/ied$/i` |
| 4 | Uses an irregular -en/-n form. Example: write → written, break → broken. | `/(en|n)$/i` |
| 5 | Uses another irregular spelling. Example: go → gone. | N/A — requires lexical exception data. |
| 6 | Uses an unchanged spelling. Example: cut → cut. | N/A — requires lexical exception data. |

### Bare Infinitive Form

| # | Format | String Pattern |
|---|---|---|
| 1 | Uses the canonical uninflected verb spelling as one word. Example: run, walk, be. | N/A — bare infinitive status requires lexical and grammatical classification. |

### Positive Degree Form

| # | Format | String Pattern |
|---|---|---|
| 1 | Uses the lexical positive-degree spelling. Example: small, fast, good, quickly. | N/A — positive degree cannot be inferred reliably from spelling alone. |

### Comparative Degree Form

| # | Format | String Pattern |
|---|---|---|
| 1 | Adds -er. Example: small → smaller. | `/er$/i` |
| 2 | Adds -r when the word ends in e. Example: large → larger. | `/er$/i` |
| 3 | Changes -y to -ier. Example: happy → happier. | `/ier$/i` |
| 4 | Doubles the final consonant and adds -er where applicable. Example: big → bigger. | `/([bcdfghjklmnpqrstvwxyz])\1er$/i` |
| 5 | Uses an irregular spelling. Example: good → better. | N/A — requires lexical exception data. |

### Superlative Degree Form

| # | Format | String Pattern |
|---|---|---|
| 1 | Adds -est. Example: small → smallest. | `/est$/i` |
| 2 | Adds -st when the word ends in e. Example: large → largest. | `/est$/i` |
| 3 | Changes -y to -iest. Example: happy → happiest. | `/iest$/i` |
| 4 | Doubles the final consonant and adds -est where applicable. Example: big → biggest. | `/([bcdfghjklmnpqrstvwxyz])\1est$/i` |
| 5 | Uses an irregular spelling. Example: good → best. | N/A — requires lexical exception data. |

### First Person Form

| # | Format | String Pattern |
|---|---|---|
| 1 | Uses an explicitly classified singular first-person form. Example: I, me, my, mine, myself. | `/^(I|me|my|mine|myself)$/i` |
| 2 | Uses an explicitly classified plural first-person form. Example: we, us, our, ours, ourselves. | `/^(we|us|our|ours|ourselves)$/i` |
| 3 | Uses an explicitly classified first-person verb form where one exists. Example: be → am. | N/A — verb person forms require lexical classification. |

### Second Person Form

| # | Format | String Pattern |
|---|---|---|
| 1 | Uses an explicitly classified second-person form. Example: you, your, yours. | `/^(you|your|yours)$/i` |
| 2 | Ends with -self for singular reflexive forms. Example: yourself. | `/^yourself$/i` |
| 3 | Ends with -selves for plural reflexive forms. Example: yourselves. | `/^yourselves$/i` |

### Third Person Form

| # | Format | String Pattern |
|---|---|---|
| 1 | Uses an explicitly classified singular third-person form. Example: he, she, it, him, her. | `/^(he|she|it|him|her|his|hers|its|himself|herself|itself)$/i` |
| 2 | Uses an explicitly classified plural third-person form. Example: they, them. | `/^(they|them|their|theirs|themselves)$/i` |
| 3 | Uses an explicitly classified third-person verb form where one exists. Example: be → is. | N/A — verb person forms require lexical classification. |

### Subjective Case Form

| # | Format | String Pattern |
|---|---|---|
| 1 | Uses an explicitly classified subjective pronoun spelling. Examples: I, we, you, he, she, it, they. | `/^(I|we|you|he|she|it|they)$/i` |

### Objective Case Form

| # | Format | String Pattern |
|---|---|---|
| 1 | Uses an explicitly classified objective pronoun spelling. Examples: me, us, you, him, her, it, them. | `/^(me|us|you|him|her|it|them)$/i` |

### Possessive Case Form

| # | Format | String Pattern |
|---|---|---|
| 1 | Adds 's. Example: dog → dog's. | `/'s$/i` |
| 2 | Adds ' after an existing plural -s. Example: dogs → dogs'. | `/s'$/i` |
| 3 | Uses an explicitly classified possessive spelling. Examples: my, mine, his, hers, ours, theirs. | `/^(my|mine|your|yours|his|her|hers|its|our|ours|their|theirs)$/i` |

### Reflexive Case Form

| # | Format | String Pattern |
|---|---|---|
| 1 | Ends with -self for singular forms. Examples: myself, yourself, himself, herself, itself. | `/self$/i` |
| 2 | Ends with -selves for plural forms. Examples: ourselves, yourselves, themselves. | `/selves$/i` |
