# Data Entity Design Decisions Log

This log holds the design rationale, implementation history, and cross-file mechanism notes that used to live inline in `data/entities/*.ts`'s own doc comments. It exists because those comments were rewritten to comply with `data_entity_class_documentation_and_code_comments_guideline.md` — entity documentation now describes what the data means, not why it came to mean that or which function populates it.

Nothing in this log is required reading to use an entity correctly; the entity's own doc comment (and, for behaviour, its companion `role/processor/<entity>_processor.ts` file) is the authoritative contract. This log is for anyone asking "why is it like this," or making a related change and wanting to know what was already tried and rejected.

Organised one section per entity, in the same order as `data/entities/`.

---

## Word (`data/entities/word.ts`)

### Type vs. token duality

`Word` is shaped like Linguistics's `LinguisticUnit` deliberately, not as an unresolved layering error — it has two legitimate uses: the *type* (a lexical entry, owned by Vocabulary) and the *token* (one occurrence of that type in a sentence, participating in Linguistics's own tree via `LinguisticUnit`'s `text` and `systemProperty`). See `vocabulary/documentation/README.md`, 4.1.

### No `systemProperties` field

`Word` deliberately has no `systemProperties` field of its own (Design Principle 8) — tensor-backed system properties belong to a claimed `LexicalRelationship` between two words, not to a word standing alone.

### Ported from Python

Ported from `vocabulary/data/word.py`. Python's `@dataclass` with `kw_only` fields and `__post_init__` becomes a plain `Word` data interface plus a `createWord()` factory applying the same defaults and post-init normalisation. Python's bound derived-property methods (`word.hypernyms(relationships, dictionary)`, ...) have no counterpart here any more — retired along with `LexicalRelationshipStore`'s own retirement from the permanent queryable model.

### `uuid` vs. `entryId`

Distinct identity concepts, easy to conflate. `uuid` is a per-Domain-graph-instance identity, deliberately **not** stable: freshly regenerated every time a Word is copied into a Domain's own Dictionary (`Dictionary.seedFrom`, `WordSeeder.seedClosedClassWords`), so that two Domains' independent copies of "be" are never confused as the same graph node. `entryId` is the opposite: assigned once, when a Word is first authored (an asset-file entry, a promotion, a hydration, or a conflict-resolution registration), stored in the Common Vocabulary Cache's asset JSON for every entry that lives there, and left untouched by every later copy — the same underlying vocabulary entry keeps the same `entryId` no matter how many Domains end up holding their own runtime copy of it.

### `synsetId`

Names the Princeton WordNet 3.1 synset for this Word's own *primary* sense ("00001740-n" — an 8-digit zero-padded byte offset, a hyphen, then the synset's `ss_type` letter: n/v/a/s/r). Registered at creation time (whichever synset first produced this Word — a Word is unique by `(partOfSpeech, lemma)`, not by synset, `WordSeeder.seedWordNet`'s own find-or-create, `role/word_seeder.ts`), then updated once more by `WordSeeder.seedWordNet`'s own `orderSensesByFrequency`, once that Word's full `senseIds` list is known, to instead name whichever Sense turned out to have the highest `Sense.senseFrequency` — the two coincide whenever the first-seeded sense also happens to be the most frequent one, the ordinary case, but not always. Stays as a "primary sense" snapshot for callers that only ever need one representative synset id (`DictionaryView`'s own `WordRecord.sense_id`, the Hierarchy tree's node-id fallback) — never a complete picture of every synset this Word now belongs to; `senseIds` is.

### `senseIds`

Each entry is the referenced Sense's own `uuid` — an internal graph reference, not a WordNet identifier string (`synsetId` above is that; see `sense.ts`'s own docstring on why the two are easy to conflate but distinct). More than one entry is the ordinary case for a polysemous lemma, not an edge case — `Senses.registerMember()` appends here (idempotently) once per synset this Word's own `(partOfSpeech, lemma)` turns out to lexicalize, in whatever order pass 1 happened to visit each synset in; `WordSeeder.seedWordNet`'s own `orderSensesByFrequency` then reorders the whole list by descending `Sense.senseFrequency` once it's known in full, so `senseIds[0]` ends up the highest-frequency Sense. Deliberately additive alongside every field on `Word` that still duplicates from a Sense (`definition`, `usageNotes`, `domainTag`, `relatedDomainTags`) — a Word with several senses duplicates only its *first* (highest-frequency) Sense's copy of those fields.

### `baseLemmaCanonicalForm`

Identifies the standard dictionary form used to represent the word — the one row of the Word Form to Part of Speech Matrix (`data/matrices/word_form_part_of_speech_matrix.md`) ticked for every part of speech without exception, so it lives on `Word` itself rather than being repeated on every POS-specific subtype. Distinct from `lexicalForm`/`text` in name only for a base entry (they agree); the difference matters for an inflected form's own Word (e.g. "ran"), where this names its lemma ("run") rather than its own spelling. Fully lexical, not spelling-derivable at all (the matrix's own Format/String Pattern columns are both `N/A` for this row) — a populated value's own `Text.formats` should stay unset here, unlike a regular-case `*_Form` value.

### `isCommon`

True only for a Word loaded from the English Common Vocabulary Cache (or another language's equivalent) by `WordSeeder` — never set true by hand. See `vocabulary/documentation/README.md`, 9.5.

### `domainTag`

Only ever set on a Common Vocabulary Cache entry, and only when its `(lexicalForm, partOfSpeech)` pair is shared with another entry — true dictionary polysemy, as opposed to a homograph (same spelling, different `partOfSpeech`, already told apart by `partOfSpeech` alone). Undefined means the plain "common" domain; a value like "symbol.common" names this sense's own hypernym as a subdomain of "common" — see `Word.domainTag`'s Python docstring for the full rationale (`vocabulary/data/word.py`).

### `relatedDomainTags`

A WordNet-only sibling of `domainTag`, populated by `WordSeeder.seedWordNet` from a synset's own topic-domain pointers (`;c`/`-c` in the raw dict files — `word_seeder.ts`'s `relationshipKindForPointer` used to turn these into `TOPIC_DOMAIN` `LexicalRelationship` edges; it no longer does). A word sense can belong to at most one topic domain via `domainTag` itself (the first topic pointer `WordSeeder` encounters for that sense — e.g. "winger" -> `domainTag` "soccer"), with every *additional* topic this same sense is also tagged with in WordNet (a sense can legitimately carry several — "winger" is also a wing position in hockey, rugby, and field_hockey) recorded here instead, so none are silently dropped.

### `isFullyHydrated`

Implementation plumbing, not part of the documented field set: tracks whether `AsyncDictionaryHydrator` has finished populating this Word's meaning/`partOfSpeech` from the external dictionary API yet.

### Root-word / `isDerivableNoun` fields moved to `Noun`

`isRootWord`/`interrogativeRootWord`/`hypernymRootWord`/`holonymRootWord`/`vectorPrimitiveRootWord`, and `isDerivableNoun`, used to live on `Word` itself — moved onto `Noun` once it became clear every one of them is NOUN-only in practice: `assets/common/en/root_words.json`'s own 25 entries are every one of them `"part_of_speech": "NOUN"`, and each of the four root-word enums is described purely in noun terms (Entity, Party/Role, Place, ... — the *answer* to an interrogative, never the interrogative word itself). Nothing outside `Noun` ever populated these; every other POS subtype had been inheriting six always-default fields that never applied to it. See the Noun section below for the fields' own current rationale.

### `contractionOf`

Read back from `WordSeeder`'s own seeding-time-only `LexicalRelationship` graph (`VocabularyContext`'s own docstring, `data/vocabulary_context.ts`, on why nothing outside a seeder reads that graph directly any more) rather than left as a queryable `CONTRACTION` edge. Word-level, not a POS-subtype field, since a contraction's own components span whatever closed-class parts of speech happen to combine (pronoun + auxiliary verb, negation particle, modal, ...), never one single POS the way a derivation pair's own fields are scoped. Many-to-many, not a single pointer — `CONTRACTION` is the only Orthographic-group kind with any real seeded data at all today (the Common Vocabulary Relationship Cache's own `orthographic_relationships.json`, 16 entries; every other Orthographic kind — `SPELLING_VARIANT`, `ABBREVIATION`, `ACRONYM`, ... — carries zero real data anywhere in this codebase, so no attribute field is built for those yet). Deliberately one-directional — a component word's own reverse index of every contraction it participates in isn't built here; nothing reads it, and it can be added later without touching this field.

### `wordFormIds`

Named `wordFormIds`, not `formIds` — unambiguous against `senseIds`'s own "`Xids: Identifier[]` into the `X` store" convention (`WordForms` is the store, `WordForm` the record, so `wordForms` alone would misleadingly suggest full records inlined here rather than a list of pointers). Populated for every POS subtype now (`role/auxiliary_seeder.ts` for AUXILIARY, each `role/processor/*_processor.ts`'s own `generateXForms()` for Noun/Verb/Adjective/Adverb, `role/word_seeder.ts`'s `registerBaseLemmaForm()` for every Word regardless of subtype) — `WordForm`'s own docstring (`data/word_form.ts`) has the full history of this migration.

---

## Noun (`data/entities/noun.ts`)

### `isCountable`

Has no seeding source today — neither Princeton WordNet's dict/ files nor the Common Vocabulary Cache mark countability anywhere — so it stays undefined on every Noun `WordSeeder` produces; the field exists so a future curation pass has somewhere to write "chair" (countable) vs. "water" (uncountable) to, the same "declared before it's populated" shape this codebase's other not-yet-seeded fields already have.

### `wordCharacterForms`

Not a Word Form Matrix field (`../matrices/pos_vs_wordform_matrice.ts` has no row for it) and not spelling-derivable from the lemma the way `pluralNumberForm` etc. are, so `generateNounForms()` never touches it. `NounCharacterFormSeeder` (`role/noun_character_form_seeder.ts`) is this field's only seeding source today, and `assets/common/en/punctuation_wordnet_hyponyms.json` has the full mark-name -> character(s) mapping it and any future curation pass would read from. A paired mark genuinely names more than one glyph at once — WordNet models "brace" as one generic sense for both `{`/`}`, with nothing in the lemma itself to pick a side, so both belong on the same Noun rather than being split across siblings or arbitrarily reduced to one.

### Singular/Plural Number Form, Possessive Case Form moved to `WordForm`

No longer scalar fields here (Auxiliary's own precedent, `data/entities/auxiliary.ts`): each one now lives as its own `WordForm` record, reached via `Word.wordFormIds` (`data/word_form.ts`, `data/word_forms.ts`'s own `WordForms` store), generated the same as ever by `generateNounForms()` (`role/processor/noun_processor.ts`) but registered there via `WordForms.registerNamedForm()` instead of assigned to a named field on this interface.

### `isRootWord`

True only for one of the 25 words seeded from `assets/common/en/root_words.json` — the Interrogative/Hypernym/Holonym/Vector-Primitive root word table (`../enums/interrogative_root_word.ts`'s own docstring). Never set true by hand elsewhere; every other Noun defaults to false via `createNoun()`. See `DictionaryView`'s own "Show root words" filter, the reason this flag exists at all rather than being inferred from whichever of the four root-word-column fields is set.

### `interrogativeRootWord`/`hypernymRootWord`/`holonymRootWord`/`vectorPrimitiveRootWord`

At most one of these four is ever set, and only when `isRootWord` is true — whichever single column of the root word table this Noun instantiates (e.g. the Noun "entity" carries `hypernymRootWord = HypernymRootWord.ENTITY`, and none of the other three). All four enums share the same numeric ordinal for the same table row, so a caller holding one root word's column value can look up its counterpart in another column by ordinal alone, without this Noun needing to store all four itself.

### `isDerivableNoun`

Defaults false via `createNoun()`; never set true by hand outside `WordSeeder`'s own `entryToWord()`. Not itself a `LexicalRelationship` — this only flags that this Noun is a derivable one, it doesn't wire the actual `NOMINALISATION` edge to the verb (see `relationships/morphological_relationships.json` for that, where one already exists). Covers both a suffix-derived nominalisation ("operate" -> "operation") and a genuine zero-derivation noun/verb pair ("work", "trigger").

### `isDerivedFromVerb`/`isDerivedFromVerbIndicator`, `isDerivedFromAdjective`/`isDerivedFromAdjectiveIndicator`

Each pointer field is one half of a morphological-derivation pointer pair — the other half lives on the class named in the field's own name (Verb/Adjective) — all populated the identical way by `WordSeeder.seedWordNet`'s own `deriveMorphologicalPointers()` (`role/word_seeder.ts`, that method's own docstring for the full rationale and the shared `findDerivationTarget()` engine every one of these fields, across every POS subtype, is built from): read back from an already-seeded WordNet `+` Derived-Form pointer, never itself creating a `LexicalRelationship`. Each pointer field's own Indicator boolean is simply `field !== undefined`, kept as its own property rather than left for every caller to check — never undefined itself, defaults false via `createNoun()`. A Noun with more than one qualifying edge keeps only the first one found, the same arbitrary-but-deterministic "pick one" convention `Dictionary.lookup()` already uses for a homograph.

Deliberately only two fields, not four — `Noun.isAdjectivised` and `Noun.isVerbalised` existed in an earlier iteration of this block and were removed: WordNet records its own `+` Derived-Form pointer reciprocally (once under the source word's own synset, once again under the target's), and `derivationKind()` (`role/word_seeder.ts`) picks a *different* `LexicalRelationshipType` for each direction — so a Noun/Verb pair like "abandon"/"abandonment" produces both a `NOMINALISATION` edge (verb->noun) and a separate `DERIVED_FORM` edge (noun->verb) for the exact same underlying fact, not two distinct ones. `DERIVED_FORM` itself is WordNet's own catch-all for "target isn't Noun/Adjective/Adverb," not a genuine morphological category the way Nominalisation/Adjectivisation/Adverbialisation are, so building a "Verbalised"/"Adjectivised" field on top of it here duplicated `Verb.isNominalised`/`Adjective.isDerivedFromNoun`'s own fact under a second, spurious name instead of describing anything new. Correct linguistics, not WordNet's own storage convention, is what these fields model.

`isDerivedFromVerb` is distinct from `isDerivableNoun` above: `isDerivableNoun` is a hand-curated boolean with no pointer of its own; `isDerivedFromVerb` is the real thing, read from a genuine `NOMINALISATION` edge whose source resolves to a Verb specifically — that same edge kind also covers Adjective->Noun ("happy"->"happiness"), `isDerivedFromAdjective`'s own case, so checking the source's own actual part of speech is required, not defensive boilerplate.

`isDerivedFromAdjective` treats Adjective as the canonical base form (`Adjective.isNominalised`, not a separate `Noun.isAdjectivised`), matching how much more heavily populated real WordNet data is in this direction.

---

## Verb (`data/entities/verb.ts`)

### `frames` (Senses-level metadata, not a Verb field)

See `framesForSense()` (`role/processor/verb_processor.ts`) — a real WordNet-sourced property this codebase used to discard outright. Princeton WordNet 3.1's `dict/data.verb` records, per synset, which of its own 35 standard "generic verb frame" sentence patterns ("Somebody ----s something") that synset's meaning fits — sometimes naming the whole synset, sometimes one specific member word only. `wordnet_loader.ts`'s own docstring used to say this block is "never retained"; it's parsed into `WordNetSynset.frames` now instead, and `WordSeeder.seedWordNet`'s own `synsetMemberToWord()` resolves each (Verb, sense) pair's own subset of applicable frame numbers against `VERB_FRAME_TEXT` (`data/enums/verb_framed_example_template.ts`), storing the result on the `Senses` store as per-membership metadata (`Senses.setMemberMetadata()`'s own docstring, `../senses.ts`) rather than on the Verb itself — a Verb is unique by `(partOfSpeech, lemma)` and can lexicalize several senses, and frame applicability is a fact about one specific sense, not the spelling as a whole.

Verified directly against the bundled dict/ files, not guessed: "breathe" (00001740-v) carries frames 2/8, resolving to "Somebody ----s" / "Somebody ----s something"; "tell" (00722885-v, the "discern" sense) carries 2/8/26, matching its own dict/ example sentence "He could tell that she was unhappy" (frame 26, "Somebody ----s that CLAUSE"). Frame targeting can be word-specific, not just synset-wide — 00027261-v ("stretch"/"extend") has frame 8 for the whole synset plus frame 2 for "stretch" alone, so "extend" (the synset's other member) never gets frame 2.

### `isNominalised`/`isNominalisedIndicator`, `isAdjectivised`/`isAdjectivisedIndicator`

Same shared rationale as Noun's own derivation-pointer fields above (`deriveMorphologicalPointers()`/`findDerivationTarget()`, `role/word_seeder.ts`) — deliberately two fields, not four (an earlier iteration had `Verb.isDerivedFromNoun`/`isDerivedFromAdjective` too, reading WordNet's own reciprocal `DERIVED_FORM` pointer as if it were a second, independent fact when it's actually the same relationship `Noun.isDerivedFromVerb`/`Adjective.isDerivedFromVerb` already capture, just recorded from the other word's own side).

`isNominalised` is `Noun.isDerivedFromVerb`'s own exact reverse. Named `isNominalised`, not `isNormalisedByNoun` as an earlier iteration of this field had it — "nominalised" is the real linguistic term for "turned into a noun" ("normalised" means "made standard/regular," an unrelated concept); dropping "ByNoun" too, since "nominalised" already fully names what it becomes without needing to restate it.

`isAdjectivised` is a real WordNet `ADJECTIVAL_DERIVATION` pointer, source = this Verb — `Adjective.isDerivedFromVerb`'s own exact reverse.

### Present/Past/Third-Person-Singular-Present/Present-Participle/Past-Participle/Bare-Infinitive Form moved to `WordForm`

No longer scalar fields here (Auxiliary's own precedent, `data/entities/auxiliary.ts`): each one now lives as its own `WordForm` record, reached via `Word.wordFormIds`, generated the same as ever by `generateVerbForms()` (`role/processor/verb_processor.ts`) but registered via `WordForms.registerNamedForm()`. First/Second/Third Person Form (the matrix's own remaining VERB row — applicable only to a small subset of verb paradigms, e.g. "am" for "be", and even then only via curated data the matrix marks fully `N/A` for Verb) are dropped outright rather than ported — confirmed by a repo-wide grep that nothing has ever written to them.

---

## Adjective (`data/entities/adjective.ts`)

### `syntacticPosition` (Senses-level metadata, not an Adjective field)

See `syntacticPositionForSense()` (`role/processor/adjective_processor.ts`) — a real WordNet-sourced property this codebase used to discard outright. Princeton WordNet 3.1's `dict/data.adj` marks some lemmas with a trailing, space-free parenthetical — "afraid(p)", "galore(ip)" — restricting where that specific sense of the adjective can sit relative to the noun it modifies. `wordnet_loader.ts`'s own `cleanLemma()` already stripped this marker before this existed; it's parsed into `WordNetSynset.lemmaPositions` now instead, and `WordSeeder.seedWordNet`'s own `synsetMemberToWord()` reads it from there, storing the result on the `Senses` store as per-membership metadata rather than on the Adjective itself — an Adjective is unique by `(partOfSpeech, lemma)` and can lexicalize several senses, and a syntactic-position restriction is a fact about one specific sense ("afraid" is predicate-only in its "frightened" sense but has no such restriction in some other sense sharing that spelling), not the spelling as a whole.

Verified directly against the bundled dict/ files, not guessed: a scan of all four `dict/data.*` files found `(a)`/`(p)`/`(ip)` are the *only* trailing parenthetical markers ever attached directly to a lemma token (never in `data.noun`/`data.verb`/`data.adv`), so this is safe to treat as an exhaustive, closed set.

### `isNominalised`/`isNominalisedIndicator`, `isAdverbialised`/`isAdverbialisedIndicator`, `isDerivedFromVerb`/`isDerivedFromVerbIndicator`

Same shared derivation-pointer rationale as Noun's/Verb's own fields above — deliberately three fields, not six (an earlier iteration also had `isVerbalised`/`isDerivedFromNoun`/`isDerivedFromAdverb`, each reading WordNet's own reciprocal `DERIVED_FORM` pointer for a relationship `Verb.isAdjectivised`/`Noun.isDerivedFromAdjective`/`Adverb.isDerivedFromAdjective` already capture from the other word's own side). An Adjective sits at the centre of more of these pairs than any other POS subtype — a real Adjective<->Verb, Adjective<->Noun, and Adjective<->Adverb relationship each, not just one.

`isNominalised` is `Noun.isDerivedFromAdjective`'s own exact reverse, the same `NOMINALISATION` kind `Verb.isNominalised` also reads.

`isAdverbialised` is a real WordNet `ADVERBIAL_DERIVATION` pointer, source = this Adjective — `Adverb.isDerivedFromAdjective`'s own exact reverse. Distinct from a Pertainym relationship (`role/processor/adverb_processor.ts`'s own `determineGradability()` docstring on that separate `\` pointer type, "relates to" rather than "is formed from") — this is WordNet's `+` Derived-Form pointer specifically.

`isDerivedFromVerb` is `Verb.isAdjectivised`'s own exact reverse.

### Positive/Comparative/Superlative Degree Form moved to `WordForm`

No longer scalar fields here (Auxiliary's own precedent): each one now lives as its own `WordForm` record, generated the same as ever by `generateAdjectiveForms()` (`role/processor/adjective_processor.ts`) but registered via `WordForms.registerNamedForm()`.

---

## Adverb (`data/entities/adverb.ts`)

### No WordNet-specific marker

Unlike Noun/Verb/Adjective, neither Princeton WordNet's `dict/data.adv` nor the Common Vocabulary Cache carries any adverb-specific marker this codebase discards today (Verb's `frames`/Adjective's `syntacticPosition` are the two precedents where one exists) — every field below stays undefined until a future seeding/curation pass populates it, but the class still exists and still carries its own row of fields from the Word Form to Part of Speech Matrix, the same as its three siblings, ready for a value once one is available.

### `isDerivedFromAdjective`/`isDerivedFromAdjectiveIndicator`

Same shared derivation-pointer rationale as Noun's/Verb's/Adjective's own fields — deliberately one field, not two (an earlier iteration also had `isAdjectivised`, reading WordNet's own reciprocal `DERIVED_FORM` pointer for the same relationship `Adjective.isAdverbialised` already captures from the other word's own side). Exact reverse of `Adjective.isAdverbialised`.

### Positive/Comparative/Superlative Degree Form moved to `WordForm`

No longer scalar fields here (Auxiliary's own precedent): each one now lives as its own `WordForm` record, generated the same as ever by `generateAdverbForms()` (`role/processor/adverb_processor.ts`) but registered via `WordForms.registerNamedForm()`.

---

## Pronoun (`data/entities/pronoun.ts`)

The closed class with the richest row of its own in the Word Form to Part of Speech Matrix, matching how much a pronoun paradigm actually varies (I/me/my/mine/myself, he/him/his/himself, ...) compared to every other closed class. Every one of those fields (Singular/Plural Number Form, First/Second/Third Person Form, Subjective/Objective/Possessive/Reflexive Case Form) would live as its own `WordForm` record, registered via `WordForms.registerNamedForm()` the same as every other migrated POS subtype, whenever a future curation pass actually populates one. No production write site does today — the Common Vocabulary Cache's own `pronouns.json` entries (`role/word_seeder.ts`'s own `entryToWord()`) express inflection through a completely separate, pre-existing mechanism instead (`Dictionary.linkForm()`/`LemmaFormLink` — one independent Word per surface form, e.g. "you" links to "yours"/"yourself"/"yourselves" as three separate Words), left untouched by this migration.

---

## Determiner (`data/entities/determiner.ts`)

Its own row of fields from the Word Form to Part of Speech Matrix (Singular/Plural Number Form, Possessive Case Form) would live as its own `WordForm` records, registered via `WordForms.registerNamedForm()` the same as every other migrated POS subtype, whenever a future curation pass actually populates one. No production write site does today — the Common Vocabulary Cache's own `determiners.json` entries don't set any of them; see Pronoun's own entry above for the separate, untouched `Dictionary.linkForm()`/`LemmaFormLink` mechanism a closed-class Word's own inflection actually goes through today.

---

## Auxiliary (`data/entities/auxiliary.ts`)

One Word per base lemma (be, have, do, can, may, shall, will, must, ought, need, dare), not one per surface spelling — "was" and "were" are both values living on `WordForm` records reached via this Word's own `wordFormIds`, not two separate Words. Settled after direct back-and-forth on the alternative (one Word per surface form, mirroring the now-retired `auxiliaries.json`'s flat 36-entry layout): a surface-form model would have made `WordForms.lookupByText()`/`Word.wordFormIds` redundant with `Dictionary.lookupAll()` itself.

Every one of its distinguishing spellings (`bareInfinitiveForm`/`presentTenseInstanceForm`/`presentTenseForm`/`thirdPersonSingularPresentForm`/`pastTenseInstanceForm`/`pastTenseForm`/`presentParticipleForm`/`pastParticipleForm`/`modalForm`/`secondaryModalForm`) lives in a `WordForm` record (`WordForms.formsOf(auxiliary)`), addressable and carrying its own Senses rather than being a bare Text value with senses bulk-registered onto this Word's own `senseIds`. `role/auxiliary_seeder.ts` is the only writer; `role/processor/auxiliary_processor.ts`'s `validateAuxiliary()` reads `WordForms.formsOf()` instead of named scalar fields.

Auxiliary was the first POS subtype to adopt `WordForm` this way, one real example before every other POS subtype (Noun, Verb, Adjective, Adverb, Pronoun, Determiner) generalized to the same shape — `WordForm`'s own docstring (`data/word_form.ts`) has the full reasoning, and none of those six subtypes declares a scalar `*_Form` field of its own any more either.

---

## Preposition, Conjunction, Interjection, Numeral, Particle

Each of these five classes carries no field of its own beyond `partOfSpeech` — the Word Form to Part of Speech Matrix (`data/matrices/word_form_part_of_speech_matrix.md`) ticks only Base Lemma Canonical Form for each of these parts of speech, already `Word.baseLemmaCanonicalForm`'s own field, shared by every subtype. Each class exists purely so a caller can narrow a `Word` to "definitely a preposition/conjunction/interjection/numeral/particle" at the type level, the same as its siblings.
