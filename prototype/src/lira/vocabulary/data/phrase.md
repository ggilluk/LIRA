# Phrase

The structural model of a Phrase: the properties every Phrase carries,
independent of `PhraseType` (Noun Phrase, Verb Phrase, Adjective
Phrase, ...) -- each subtype fills the same shape, just with a
different kind of Head and different constraints on what its
Premodifiers/Complements/Postmodifiers may be.

| Property | Cardinality | Value Type | Definition |
|---|---|---|---|
| PhraseType | 1 | PhraseType | Classification of the phrase determined by its head, e.g. Noun Phrase, Verb Phrase, Adjective Phrase. |
| Head | 1 | Word | Central lexical element that determines the phrase's grammatical type and core meaning. |
| Premodifiers | 0..* | Word \| Phrase | Optional constituents occurring before the head that modify or qualify it. |
| Complements | 0..* | Phrase | Phrases selected or licensed by the head that complete its syntactic or semantic relationship. |
| Postmodifiers | 0..* | Word \| Phrase | Optional constituents occurring after the head that modify or further qualify it. |

Today's real `Phrase` interface (`data/phrase.ts`) stores this
differently -- one flat `words` array plus an index-aligned
`wordRoles` array (`ModifierRole`, `enums/modifier_role.ts`: Head,
Modifier, Particle, Determiner, ...) and a resolved `headWord`/
`headWordForm` pointer, rather than distinct Premodifier/Complement/
Postmodifier collections -- so this table documents the conceptual
model, not a field-for-field description of that interface.
