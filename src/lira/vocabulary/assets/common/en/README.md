# English Common Vocabulary Cache (v1)

## Purpose

This cache provides the mandatory English closed-class lexical forms
every LIRA Domain's Vocabulary must contain: determiners, pronouns,
auxiliaries, prepositions, coordinating and subordinating
conjunctions, particles, punctuation, symbols, and numerals. It also
holds six `metalinguistic_*.json` files, one per part of speech, of
open-class terms for grammar itself (`noun`, `verb`, `subject`,
`tense`, `synonym`, `determine`, `grammatical`, `grammatically`,
`English`, `yes`, ...) that the mandatory files' own definitions constantly
presuppose (see Supplementary files below), and `promoted_words.json`,
a generated (initially empty) list of open-class words promoted from
Domain vocabularies once they're referenced widely enough to be worth
treating as common.

**The Common Vocabulary Cache is not the authoritative source of a
Word.** Every Word's authoritative record lives in the Domain that
owns it. This cache is a generated bootstrap asset: it exists to
reduce cross-domain lookups and to give a newly created Domain a
working vocabulary immediately, not to be a system of record.

## Files

| File | Contents | Required entries |
|------|----------|-------------------|
| `manifest.json` | Schema/asset version, language, per-file and total lexical form counts | -- |
| `determiners.json` | Determiners (the, a, this, my, some, ...) | 37 |
| `pronouns.json` | Personal, possessive, reflexive, interrogative, relative, reciprocal, and indefinite pronouns, plus `which`/`what`'s secondary `DETERMINER` entries (see the file-placement note above) | 99 |
| `auxiliaries.json` | Primary auxiliaries (be, have, do), modals (will, can, must), semi-modals (need, dare), and full contractions (don't, can't, I'm, it's, isn't, wasn't, hadn't -- see Contractions below) | 36 |
| `prepositions.json` | Simple and compound/complex prepositions, including multi-word units (because of, in spite of, according to, as well as, ...) | 94 |
| `coordinating_conjunctions.json` | FANBOYS -- for, and, nor, but, or, yet, so | 7 |
| `subordinating_conjunctions.json` | because, although, unless, while, ... | 36 |
| `particles.json` | not, there, please, also, too, only, ..., plus verb-particle senses of up/off/out/away (see Phrasal-verb particles below) | 16 |
| `punctuation.json` | `.`, `!`, `?`, `;`, `,` -- see Punctuation is a Word below | 5 |
| `symbols.json` | `$`, `%`, `&`, `@`, `+`, `=`, ... -- common typographic/mathematical symbols | 25 |
| `numerals.json` | `zero` through `trillion` -- the base numeral words all other numbers are compositionally built from | 33 |
| `metalinguistic_nouns.json` | Open-class `NOUN` terms for grammar itself, including relationship-kind terms (`synonym`, `lemma`, `contraction`, ...) and `true`/`false`/`null` -- see Supplementary files below | 61 |
| `metalinguistic_verbs.json` | Open-class `VERB` terms for grammar itself, including mathematics/logic operator verbs (`add`, `xor`, `nand`, ...) | 43 |
| `metalinguistic_adjectives.json` | Open-class `ADJECTIVE` terms for grammar itself | 28 |
| `metalinguistic_adverbs.json` | Open-class `ADVERB` terms for grammar itself, plus four closed-class discourse markers (however, therefore, moreover, nevertheless -- see Discourse markers below) | 17 |
| `metalinguistic_proper_nouns.json` | A single `PROPER_NOUN` entry, `English` -- see Supplementary files below | 1 |
| `metalinguistic_interjections.json` | Open-class `INTERJECTION` terms (`yes`, `no`, `please`, `alas`, `hurrah`, `huzzah`, `oh`, `ah`, `wow`, `hey`, `ouch`, `hmm`, `well`) -- see Supplementary files below | 13 |
| `promoted_words.json` | Open-class words promoted from Domain vocabularies (started empty; see Version below) | 254 |

Mandatory closed-class total: **388** (37 + 99 + 36 + 94 + 7 + 36 + 16 + 5 + 25 + 33).
The six `metalinguistic_*.json` files and `promoted_words.json` are
not counted toward the mandatory 388 -- see Supplementary files below
and the Promotion policy section respectively. Since `asset_version
1.3.0`, the mandatory total is manifest-driven rather than a hardcoded
figure `WordSeeder` asserts: it's whatever `determiners.json` through
`numerals.json`'s counts actually sum to, cross-checked against
`manifest.json`'s `total_lexical_forms` -- see
`vocabulary/role/word_seeder.py`'s `validate_assets()`. A freshly
seeded `Dictionary` currently ends up with 388 + 163 + 254 = **805**
`Word`s (mandatory + supplementary + promoted) -- unlike the mandatory
and supplementary totals, the promoted total isn't manifest-enforced
(`promote_word`/`demote_word` mutate `promoted_words.json` directly;
its `manifest.json` row is informational, not cross-checked by
`validate_assets()`).

## Punctuation is a Word

There is no separate `Punctuation` class. A punctuation mark is an
ordinary `Word` with `part_of_speech=PUNCTUATION`, seeded from the
mandatory `punctuation.json` exactly like determiners or prepositions --
`.`, `!`, `?`, `;`, `,`, the same five symbols
`DictionaryProcessor.get_or_create_word` used to special-case before
`asset_version 1.6.0`. `syllable_count` is `null` for every entry here,
the same "genuinely undefined, not guessed at" treatment multi-word
entries get elsewhere in this cache -- a punctuation mark isn't
pronounced or syllabified at all. `LinguisticUnitKind.Punctuation`
(Linguistics Layer) still exists as a tensor-row kind tag distinguishing
a punctuation token from a word token, but `GraphProcessor` now derives
it from `part_of_speech` at tree-build time instead of an `isinstance`
check against a separate class -- see
`linguistics/documentation/README.md`.

## Symbols and numerals: the other finite closed classes

`SYMBOL` and `NUMERAL` were, like `PUNCTUATION` before `asset_version
1.6.0`, `PartOfSpeech` members with zero seeded `Word`s -- unlike
`PROPER_NOUN` and `OTHER`, both name a genuinely
finite, enumerable inventory (25 common symbols; the base numeral words
`zero` through `trillion`, from which every other number is
compositionally built, e.g. "twenty-one" is `twenty` + `one`, not a new
base word), so `asset_version 1.7.0` seeded them the same way
`punctuation.json` was seeded: `symbols.json` and `numerals.json`
joined `MANDATORY_FILES`. Every entry in `symbols.json` has `syllable_count`
`null`, for the same reason punctuation does -- a symbol character
isn't itself pronounced (only its spoken *name*, "dollar sign", would
be, and that name isn't what's seeded as the `lexical_form`).
`numerals.json` entries get a real `syllable_count`, since numeral
words are ordinary pronounceable English words.

`numerals.json`'s `one` is a homograph of `pronouns.json`'s existing
`one` (the indefinite pronoun, "one should always..."): `numerals.json`
is deliberately the last file in `MANDATORY_FILES`, after
`pronouns.json`, so the `PRONOUN` sense stays `Dictionary.lookup()`'s
default -- see the ordering comment above `MANDATORY_FILES` in
`vocabulary/role/word_seeder.py`.

## Contractions

`asset_version 1.9.0` added seven full contractions to the mandatory
`auxiliaries.json`: `don't`, `can't`, `I'm`, `it's`, `isn't`, `wasn't`,
`hadn't` -- all `part_of_speech=AUXILIARY`, `closed_class_kind:
"contraction"`, distinguishing them from the file's existing `auxiliary`-
kind entries. `AUXILIARY` was chosen because a contraction occupies the
same clause-level auxiliary-verb slot its expanded form would ("isn't
here" parses the same way "is not here" does), not because a
contraction is a distinct grammatical category of its own -- the same
reasoning that put `punctuation.json` under an existing `PartOfSpeech`
member rather than inventing one. This is a finite, genuinely
closed-class set (English has a fixed inventory of standard
contractions, unlike open-class vocabulary), so it belongs in a
mandatory file rather than a `metalinguistic_*.json` one.

Each contraction is linked to its full-form component word(s) by new
`CONTRACTION` relationship edges (`assets/common/en/relationships/`,
`orthographic_relationships.json`), extending the existing `not` → `n't`
precedent: `do`/`not` → `don't`, `can`/`not` → `can't`, `I`/`am` →
`I'm`, `is`/`not` → `isn't`, `was`/`not` → `wasn't`, `had`/`not` →
`hadn't`. `it's` gets three edges -- `it`, `is`, *and* `has` -- because
it genuinely contracts either "it is" or "it has", and this cache
doesn't attempt to disambiguate which reading a given occurrence
intends; modelling that ambiguity as multiple relationship targets from
one Word avoids forcing a same-`part_of_speech` homograph split the way
`Word` 4.1's model would otherwise require. See the relationship
cache's own README, Symmetric and inverse edges, for why none of these
edges (including the original `not` → `n't`) are reversed.

## Phrasal-verb particles

`asset_version 1.9.0` also added `PARTICLE` entries for the verb-
particle sense of `up`, `off`, `out`, and `away` to the mandatory
`particles.json` -- the sense used in phrasal verbs like "give up",
"turn off", "find out", "give away", distinct from each word's
ordinary prepositional sense ("up the hill", "off the table", "out the
door"). `up`, `off`, and `out` are genuine homographs of their existing
`PREPOSITION` entries (`prepositions.json`); `away` had no existing
entry at all (it doesn't function as a preposition in standard
English), so it's seeded fresh, `PARTICLE` only. `prepositions.json`
loads before `particles.json` within `MANDATORY_FILES`, so `up`/`off`/
`out` correctly keep `PREPOSITION` as `Dictionary.lookup()`'s default;
`Dictionary.lookup_all()` returns the `PARTICLE` sense too. No
relationship links a homograph's two senses to each other anywhere in
this cache (the same is true of `be`/`have`/`do`'s `AUXILIARY`/`VERB`
pair and every other homograph here), so none was added for these
either.

## Supplementary files

The six `metalinguistic_*.json` files -- one per part of speech,
mirroring the mandatory files' own convention -- are validated and
seeded exactly like the mandatory closed-class files
(`WordSeeder.SUPPLEMENTARY_FILES`), but excluded from the mandatory 388
total, because most of their content is a different kind of thing: 163
open-class-or-supplementary entries naming grammatical and
lexical-relationship concepts themselves -- `word`, `noun`, `verb`,
`subject`, `tense`, `synonym`, `lemma`, `contraction`, `true`, `false`,
`null` (nouns); `identify`, `describe`, `compare`, `determine`, plus
mathematics/logic operator verbs `add`, `subtract`, `multiply`,
`divide`, `xor`, `nand`, `nor`, `xnor` (verbs); `grammatical`,
`semantic`, `possessive`, `derived` (adjectives); `grammatically`,
`directly`, `typically`, plus four discourse markers `however`,
`therefore`, `moreover`, `nevertheless` (adverbs, see Discourse markers
below); `English` (the one `PROPER_NOUN`); `yes`, `alas`, `hmm`, `well`
(interjections, see Interjections and the `OTHER` exception below).
These terms are referenced constantly, by name, throughout the
mandatory files' own definitions ("Introduces a **noun** referring
to...", "used with uncountable **nouns**", "third **person**"), the
`LexicalRelationshipType` enum's own member names and documentation
(6.2), and this codebase's own documentation generally, but before
`asset_version 1.4.0` were represented nowhere in the seeded vocabulary
at all -- every closed-class definition and every relationship kind
presupposed them without a single one actually existing as a `Word`.

These are mostly ordinary open-class content words, not closed-class
function words, so they don't belong in the mandatory 388 the way
determiners or prepositions do; they also aren't `promoted_words.json`
entries, since that file's `reference_count` field means real
cross-domain usage tracking (`WordSeeder.promote_word`), and these 163
weren't promoted from anywhere -- they're authored bootstrap content,
same standing as the mandatory files themselves. `WordSeeder.seed_closed_class_words`
seeds them into every Domain's Dictionary regardless (its name
predates these files; see that method's docstring). The four discourse
markers are the one exception to "open-class" here -- see Discourse
markers below.

### Discourse markers

`asset_version 1.9.0` added `however`, `therefore`, `moreover`, and
`nevertheless` to `metalinguistic_adverbs.json` as `part_of_speech=ADVERB`,
`closed_class_kind: "discourse_marker"` -- distinct from the file's
other entries (`closed_class_kind: "metalinguistic_term"`) and, unlike
them, individually marked `closed_class: true`: a conjunctive adverb
like `however` genuinely is a member of a small, closed, non-productive
class (conventional grammars call these "conjunctive adverbs" or
"linking adverbs"), unlike `grammatically` or `typically`, which are
ordinary open-class adverbs that merely happen to be about grammar.
They live in the existing `metalinguistic_adverbs.json` -- and count
toward the supplementary, not mandatory, total -- rather than a new
dedicated file or `PartOfSpeech` member, reusing the existing `ADVERB`
category and the existing supplementary-file structure rather than
growing either. `however` and `nevertheless` are linked by a `SYNONYM`
relationship pair (both directions -- see 9.5's Symmetric and inverse
edges) since both mark contrast/concession; `therefore` and `moreover`
have no existing semantic neighbour in this cache, so neither was
forced into an artificial relationship just to have one.

### Interjections and the `OTHER` exception

`asset_version 1.8.0` seeded `INTERJECTION`, the last `PartOfSpeech`
category with a real, principled path to seeding. Every other
supplementary category so far was scoped by a strict rule -- seed only
what an existing definition already references (`PROPER_NOUN`), or
what a finite closed inventory contains in full (`SYMBOL`,
`NUMERAL`, `PUNCTUATION`) -- and `INTERJECTION` came back empty under
that same strict scan: nothing in the existing cache literally quotes
an interjection. It was seeded anyway, on explicit sign-off, using a
looser "actually recognized use" standard instead:
`metalinguistic_interjections.json`'s 12 entries are `yes`/`no`/`please`
(homographs of already-seeded `DETERMINER`/`PARTICLE` words, doubling
as the canonical answers/requests), `alas`/`hurrah`/`huzzah` (matching
the `LITERARY`/`ARCHAIC` register precedent this cache already uses
elsewhere for archaic forms like `thou`/`ye`), and
`oh`/`ah`/`wow`/`hey`/`ouch`/`hmm` (the prototypical core of the
category). `asset_version 1.9.0` added a thirteenth, `well`, on the
same "recognized use" standard -- a second, `INTERJECTION` homograph of
the already-seeded `PARTICLE` sense (`particles.json`'s
discourse-marker "well" -- "Well, I never!" versus "Well, I said,
that's true"). `true`, `false`, and `null` were added to
`metalinguistic_nouns.json` in the same `asset_version` for a related
but distinct reason: they read as `OTHER`-shaped at first glance, but
each has an ordinary, definable meaning (a truth value; the absence of
a value) and functions grammatically as a `NOUN` in the sentences that
use them ("the result is **true**"), so they were seeded as `NOUN`
rather than forced into `OTHER`.

`OTHER` itself remains, and is expected to permanently remain,
unseeded. It is `PartOfSpeech`'s pure "doesn't fit any other category"
residual, with no defined membership of its own -- unlike every other
category in this cache, there is no principled stopping point for
"words that fit nowhere else" the way there is for a finite symbol set,
a closed grammatical class, or even a looser "recognized use" standard.
An articulable definition and grammatical function, as `true`/`false`/
`null` both have, is evidence a word belongs somewhere else, not in
`OTHER`.

### Homographs with existing entries

Several metalinguistic terms are genuine homographs of an already-seeded
closed-class or metalinguistic word, following the same "same
lexical_form, different part_of_speech" pattern as `that`
(`DETERMINER`/`PRONOUN`) and `which` (`PRONOUN`/`DETERMINER`) in the
mandatory files:

| Word | Existing sense | New sense |
|------|------------------|-------------|
| `be`, `have`, `do` | `AUXILIARY` (`auxiliaries.json`) | `VERB` (`metalinguistic_verbs.json`) |
| `cause`, `result` | `NOUN` (`metalinguistic_nouns.json`) | `VERB` (`metalinguistic_verbs.json`) |
| `past`, `opposite` | `PREPOSITION` (`prepositions.json`) | `ADJECTIVE` (`metalinguistic_adjectives.json`) |
| `plus`, `minus` | `PREPOSITION` (`prepositions.json`) | `VERB` (`metalinguistic_verbs.json`, math operator sense) |
| `and`, `or`, `nor` | `CONJUNCTION` (`coordinating_conjunctions.json`) | `VERB` (`metalinguistic_verbs.json`, logic operator sense) |
| `not` | `PARTICLE` (`particles.json`) | `VERB` (`metalinguistic_verbs.json`, logic operator sense) |
| `one` | `PRONOUN` (`pronouns.json`) | `NUMERAL` (`numerals.json`) |
| `no` | `DETERMINER` (`determiners.json`) | `INTERJECTION` (`metalinguistic_interjections.json`) |
| `please` | `PARTICLE` (`particles.json`) | `INTERJECTION` (`metalinguistic_interjections.json`) |
| `up`, `off`, `out` | `PREPOSITION` (`prepositions.json`) | `PARTICLE` (`particles.json`, verb-particle sense) |
| `well` | `PARTICLE` (`particles.json`) | `INTERJECTION` (`metalinguistic_interjections.json`) |

In every case the original, closed-class-or-first-seeded sense stays
the `Dictionary.lookup()` default: `be`/`have`/`do`/`past`/`opposite`/
`plus`/`minus`/`and`/`or`/`nor`/`not`/`no`/`please`/`well` are safe
because `MANDATORY_FILES` (containing their original sense) always
loads in full before `SUPPLEMENTARY_FILES` regardless of ordering;
`up`/`off`/`out` are a mandatory-to-mandatory homograph pair --
`prepositions.json` precedes `particles.json` in `MANDATORY_FILES`'s
own tuple order, so `PREPOSITION` stays default without requiring any
reordering; `cause`/`result` and
`one` specifically require their mandatory/original file
(`metalinguistic_nouns.json`, `pronouns.json`) to load before the file
carrying their new sense (`metalinguistic_verbs.json`, `numerals.json`)
within `MANDATORY_FILES`'/`SUPPLEMENTARY_FILES`' own tuple order,
which is why those orders are deliberate, not alphabetical or
incidental -- see the ordering comments above `MANDATORY_FILES` and
`SUPPLEMENTARY_FILES` in `vocabulary/role/word_seeder.py`.
`Dictionary.lookup_all(text)` returns every sense regardless of load
order.

`asset_version 1.2.0` added seven words (`done`, `doing`, `little`,
`fewest`, `least`, `owing to`, `n't`) that the original 300-word
`asset_version 1.1.0` cache omitted, needed as targets for seven
relationships specified for the Relationship Cache
(`relationships/README.md`) but previously left unseeded because they
had no source Word to resolve against -- see that file's version
history for the corresponding relationship-side change.

`asset_version 1.3.0` added six words as genuine homographs, each
sharing a lexical_form with an existing entry but under a different
part_of_speech: `this`/`that`/`these`/`those` also as `PRONOUN` (their
new entries live in `pronouns.json`, alongside their existing
`DETERMINER` entries in `determiners.json`), and `which`/`what` also as
`DETERMINER` (their new entries live in `pronouns.json` too --
positioned right after their existing `PRONOUN` entries there, *not*
in `determiners.json` -- see the file-placement note below). `who` was
deliberately not given a second entry -- it has no natural determiner
use ("who book" isn't valid English) the way "which book" or "what
time" are. This is the first real use of the homograph modelling `Word`
4.1 always permitted in principle: two `Word` entries sharing one
written form, distinguished by `part_of_speech`.

`Dictionary.lookup(text)` still only resolves to whichever entry was
seeded first, and `WordSeeder.load_cache()` processes `MANDATORY_FILES`
in a fixed order (`determiners.json`, `pronouns.json`, `auxiliaries.json`,
...) -- so for `this`/`that`/`these`/`those`, whose original,
higher-frequency sense is `DETERMINER`, adding the new `PRONOUN` entry
to `pronouns.json` (processed second) correctly keeps `DETERMINER` as
the default. But `which`/`what`'s original, higher-frequency sense is
`PRONOUN` (in `pronouns.json`) -- adding their new `DETERMINER` entry to
`determiners.json` would have made it load *first*, silently flipping
the default sense. So `which`/`what`'s new `DETERMINER` entries are
deliberately placed inside `pronouns.json` instead, positioned after
the original `PRONOUN` entry in that file's array, purely to preserve
correct load order; a word's `part_of_speech` field is authoritative
per entry regardless of which file it lives in -- `determiners.json`/
`pronouns.json` are organisational buckets, not enforced-by-validation
type boundaries. Every existing relationship that resolves these words
by lexical form (e.g. `that` → `those` `PLURAL_FORM`) continues to
resolve to the correct sense either way. `Dictionary.lookup_all(text)`
returns every sense regardless of file placement or load order.

## File format

Every closed-class file uses this structure. Each word entry carries
as much of `Word`'s field set (4.2) as this cache can populate
responsibly -- see the field table below for which fields are always
present versus intentionally left `null`:

```json
{
  "schema_version": "2.0.0",
  "language_code": "en",
  "part_of_speech": "...",
  "closed_class_kind": "...",
  "count": 0,
  "words": [
    {
      "lexical_form": "...",
      "normalised_form": "...",
      "text": "...",
      "version": "1.0",
      "language_code": "en",
      "script_code": "Latn",
      "part_of_speech": "...",
      "closed_class": true,
      "definition": "...",
      "gloss": "...",
      "usage_notes": [],
      "register_codes": ["..."],
      "editorial_labels": [],
      "dialect_codes": [],
      "pronunciations": [],
      "syllable_representation": null,
      "syllable_count": 0,
      "stress_pattern": null,
      "frequency_value": null,
      "frequency_scale": null,
      "etymology_text": null,
      "first_recorded_use": null,
      "source_references": [
        {
          "source_name": "LIRA English Common Closed-Class Cache v1",
          "source_version": "1.0.0",
          "external_identifier": null,
          "reference_uri": null,
          "licence_identifier": null
        }
      ]
    }
  ]
}
```

`part_of_speech` is a `lira.vocabulary.PartOfSpeech` member name.
`closed_class_kind` is finer-grained than `part_of_speech` where the
enum doesn't distinguish sub-kinds -- `PartOfSpeech.CONJUNCTION` covers
both coordinating and subordinating conjunctions, so
`closed_class_kind` is what tells them apart
(`coordinating_conjunction` / `subordinating_conjunction`).
`register_codes` and `editorial_labels` are `RegisterCode` /
`EditorialLabel` member names (e.g. archaic forms like `thou`/`ye` are
tagged `["LITERARY"]` / `["ARCHAIC"]`; regional forms like `y'all` are
tagged `["INFORMAL"]` / `["REGIONAL"]`; everything else defaults to
`["NEUTRAL"]` / `[]`).

### Which fields are populated, and which are intentionally `null`

| Field | Populated? |
|-------|-------------|
| `lexical_form`, `normalised_form`, `text`, `version`, `language_code`, `script_code`, `part_of_speech`, `closed_class`, `closed_class_kind` | Always |
| `definition`, `gloss` | Always -- a genuine short definition for every entry (currently identical text in both fields; they're not yet differentiated by length) |
| `register_codes`, `editorial_labels`, `dialect_codes` | Always present, often empty -- populated wherever a real classification applies (archaic, informal, regional, ...) |
| `source_references` | Always -- attributes every entry to this cache itself (`LIRA English Common Closed-Class Cache v1`), not to an external dictionary that was never actually consulted |
| `syllable_count` | Populated for single-token entries via a vowel-group-counting heuristic; `null` for multi-word entries (`each other`, `according to`, ...), where a single count isn't well-defined without picking a per-word breakdown |
| `pronunciations`, `syllable_representation`, `stress_pattern`, `frequency_value`, `frequency_scale`, `etymology_text`, `first_recorded_use` | Always `null` / empty. This cache has no verified phonetic transcription, corpus frequency data, or historical-linguistics source to draw on -- inventing IPA transcriptions, frequency numbers, or "first recorded use" dates would be presenting fabricated data as fact. Left for a future revision backed by a real source. |

## Cache rebuild policy

The cache is regenerable, not hand-maintained state: it may be
deleted and rebuilt from its word lists at any time without data loss,
since it holds no Word that isn't also derivable from a Domain (the
closed-class lists here, or a Domain's own promoted open-class words).
Rebuilding recomputes `manifest.json`'s counts from the per-file
`words` arrays.

## Promotion policy

An open-class Word (noun, lexical verb, adjective, adverb) is promoted
into `promoted_words.json`, with its full field set, once its
cross-domain reference count exceeds the configured promotion
threshold (default 3) -- see `WordSeeder.promote_word` in
`vocabulary/role/word_seeder.py`. If a promoted Word's reference count
later falls below the demotion threshold (default 1), it is removed
from `promoted_words.json` (`WordSeeder.demote_word`) -- the
authoritative Word in its owning Domain is never deleted or modified
by promotion or demotion. Closed-class words are never promoted:
they're already part of the mandatory cache.

## Version

`v1` / `schema_version 2.0.0` / `asset_version 1.11.0` -- `promoted_words.json`
grew from 221 to 254 entries: 34 new abstract nouns for the
NOMINALISATION relationship (`vocabulary/documentation/README.md`,
6.2.1 Derivation -- defined since `schema_version 2.0.0` but never
actually seeded until now), `achieve` -> `achievement`, `identify` ->
`identification`, and so on for every base-form `VERB` already seeded
that has one (`examples/verb_nominalisation_vocabulary.py` -- the full
classification, including which verbs were deliberately excluded and
why: zero-derivation verbs like `change`/`measure` where the noun sense
is the same word, not a distinct form; grammar/logic-operator verbs
with no natural nominalisation; and verbs with no single standard
form). `source_references` naming `LIRA English Definition-Gap
Vocabulary v1`, the same source label the previous batch used (this is
an extension of that same batch's own follow-up work, not a new
source). One planned pair, `cause` -> `causation`, was *not* wired as a
relationship (though `causation` is still promoted as a Word) --
`cause` is a Common homograph (NOUN and VERB) and
`RelationshipSeeder.seed_domain` resolves a static relationship cache
entry via `Dictionary.lookup()`, first-seeded-wins by text alone, not
part-of-speech-aware, so a cache entry naming `cause` as source can
only ever attach to the NOUN sense. This also surfaced (and fixed) an
identical pre-existing bug from `asset_version 1.10.0`: `cause` ->
`causing` (`PRESENT_PARTICIPLE_FORM`) had silently attached to the NOUN
sense too -- both wrong edges removed; see
`relationships/README.md`'s own Version section for the exact edges
and reasoning. `asset_version 1.10.0` -- `promoted_words.json`
grew from empty to 221 entries via `WordSeeder.promote_word`, all
`NOUN`/`VERB`/`ADJECTIVE`/`ADVERB`, `source_references` naming `LIRA
English Definition-Gap Vocabulary v1`. Not a cross-domain-reference-count
promotion in the literal sense `WordSeeder.promote_word`'s
`reference_count` parameter otherwise measures (that tracking doesn't
exist yet elsewhere in this codebase, per `dictionary_hydrator.py`'s own
docstring) -- an editorial judgement that these 221 words are genuinely
common, general-English vocabulary, found by breaking every Physics
Domain word's own `definition` down into its constituent words
(`Word.definition_words()`, 4.4) and classifying each unresolved one as
belonging to Common, to the Physics Domain instead, or to neither (see
`examples/README.md`'s Definition-gap vocabulary section for the full
worked example and the one excluded word). 25 of the 221 also gained a
morphological relationship (`relationships/README.md`'s Version
section). Every seeded Dictionary now carries 772 total: 388 mandatory
+ 163 supplementary + 221 promoted, still covering 15 of
`PartOfSpeech`'s 16 members.

`v1` / `schema_version 2.0.0` / `asset_version 1.9.0` (folded a
user-supplied gap review's six categories into existing files and
`PartOfSpeech` members, adding no new file or category: discourse
markers `however`/`therefore`/`moreover`/`nevertheless` to
`metalinguistic_adverbs.json` (13 -> 17, `ADVERB`,
`closed_class_kind: "discourse_marker"`; see Discourse markers above);
full contractions `don't`/`can't`/`I'm`/`it's`/`isn't`/`wasn't`/`hadn't`
to `auxiliaries.json` (29 -> 36, `AUXILIARY`, `closed_class_kind:
"contraction"`; see Contractions above); phrasal-verb particles
`up`/`off`/`out`/`away` to `particles.json` (12 -> 16, `PARTICLE`; see
Phrasal-verb particles above); the multi-word preposition `as well as`
to `prepositions.json` (93 -> 94); and `well` as a second,
`INTERJECTION` sense to `metalinguistic_interjections.json` (12 -> 13;
see Interjections and the `OTHER` exception above). Two of the review's
categories needed no changes: "clause markers" (`whether`, `whereas`,
`although`, `unless`) were already fully present in
`subordinating_conjunctions.json`, and of "multi-word grammatical
units" only `as well as` was actually new (`because of`, `in spite
of`, `according to` were already seeded). Mandatory total 376 -> 388;
supplementary total 158 -> 163; every seeded Dictionary now carries
551 total: 388 mandatory + 163 supplementary, still covering 15 of
`PartOfSpeech`'s 16 members. The relationship cache grew alongside
this -- see `relationships/README.md`'s Version section. `asset_version
1.8.0` added
`metalinguistic_interjections.json`, 12 `INTERJECTION` entries -- `yes`,
`no`, `please`, `alas`, `hurrah`, `huzzah`, `oh`, `ah`, `wow`, `hey`,
`ouch`, `hmm` -- to `SUPPLEMENTARY_FILES`; two are homographs of
existing mandatory senses (`no`/`please`), see Homographs with existing
entries above. Added `true`, `false`, `null` to
`metalinguistic_nouns.json` (58 -> 61), on the same reasoning that
keeps `OTHER` unseeded -- see Interjections and the `OTHER` exception
above. Supplementary total 143 -> 158; every seeded Dictionary now
carries 534 total: 376 mandatory + 158 supplementary, covering 15 of
`PartOfSpeech`'s 16 members (only `OTHER` remains unseeded, by design).
`asset_version 1.7.0` added
`symbols.json` (25 `SYMBOL`) and `numerals.json` (33 `NUMERAL`) to
`MANDATORY_FILES` -- mandatory total 318 -> 376; see Symbols and
numerals above. Added `metalinguistic_proper_nouns.json` (1
`PROPER_NOUN`, `English`) to `SUPPLEMENTARY_FILES`, strictly scoped to
a word already named in an existing definition, not a general
proper-noun vocabulary. Grew `metalinguistic_verbs.json` by 13
mathematics/logic operator verbs (`add`, `subtract`, `multiply`,
`divide`, `plus`, `minus`, `and`, `or`, `xor`, `not`, `nand`, `nor`,
`xnor`; 30 -> 43) -- six are homographs of existing mandatory senses,
see Homographs with existing entries above. Supplementary total 129 ->
143; every seeded Dictionary now carries 519 total: 376 mandatory +
143 supplementary, covering 14 of `PartOfSpeech`'s 16 members
(`INTERJECTION` and `OTHER` remain unseeded -- nothing in the cache
references an example of either). `asset_version 1.6.0` added
`punctuation.json`, 5 mandatory `PUNCTUATION` entries -- `.`, `!`, `?`,
`;`, `,` -- ending `Punctuation`'s existence as a separate Python
class; see Punctuation is a Word above (mandatory total 313 -> 318).
`asset_version 1.5.0` renamed
`metalinguistic_vocabulary.json` to `metalinguistic_nouns.json` and
added three sibling files -- `metalinguistic_verbs.json` (30),
`metalinguistic_adjectives.json` (28), `metalinguistic_adverbs.json`
(13) -- plus 21 more nouns to `metalinguistic_nouns.json` itself
(37 -> 58) naming `LexicalRelationshipType`'s own concepts (`synonym`,
`antonym`, `lemma`, `inflection`, `contraction`, ...); see Supplementary
files and Homographs with existing entries above. `asset_version 1.4.0`
added the original `metalinguistic_vocabulary.json`, 37 open-class
`NOUN` entries. `asset_version 1.3.0` took 307 -> 313 mandatory lexical
forms, adding `this`/`that`/`these`/`those` as `PRONOUN` and
`which`/`what` as `DETERMINER` homographs of their existing entries --
see Files above. `asset_version 1.2.0` took 300 -> 307, adding `done`,
`doing`, `little`, `fewest`, `least`, `owing to`, `n't`. `asset_version
1.1.0` revised the schema to carry `Word`'s full field set; the
original 300 lexical forms and their meanings were unchanged from
`asset_version 1.0.0`).

## Language extension

This directory is `assets/common/en/`. Additional languages (`fr`,
`de`, `es`, `it`, ...) are added as sibling `assets/common/<language_code>/`
directories with the same file structure and format; the seeding
algorithm (`WordSeeder`) is not language-specific -- it loads whichever
`assets/common/<language_code>/` directory matches the Domain's
language code.
