# English Common Vocabulary Cache (v1)

## Purpose

This cache provides the mandatory English closed-class lexical forms
every LIRA Domain's Vocabulary must contain: determiners, pronouns,
auxiliaries, prepositions, coordinating and subordinating
conjunctions, and particles. It also holds `promoted_words.json`, a
generated (initially empty) list of open-class words promoted from
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
| `auxiliaries.json` | Primary auxiliaries (be, have, do), modals (will, can, must), semi-modals (need, dare) | 29 |
| `prepositions.json` | Simple and compound/complex prepositions | 93 |
| `coordinating_conjunctions.json` | FANBOYS -- for, and, nor, but, or, yet, so | 7 |
| `subordinating_conjunctions.json` | because, although, unless, while, ... | 36 |
| `particles.json` | not, there, please, also, too, only, ... | 12 |
| `promoted_words.json` | Open-class words promoted from Domain vocabularies (starts empty) | 0 |

Mandatory closed-class total: **313** (37 + 99 + 29 + 93 + 7 + 36 + 12).
`promoted_words.json` is not counted toward the mandatory 313 -- it's a
separate, uncapped, generated list. Since `asset_version 1.3.0`, this
total is manifest-driven rather than a hardcoded figure `WordSeeder`
asserts: it's whatever the per-file counts actually sum to, cross-checked
against `manifest.json`'s `total_lexical_forms` -- see
`vocabulary/role/word_seeder.py`'s `validate_assets()`.

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

`v1` / `schema_version 2.0.0` / `asset_version 1.3.0` (307 -> 313
mandatory lexical forms, adding `this`/`that`/`these`/`those` as
`PRONOUN` and `which`/`what` as `DETERMINER` homographs of their
existing entries -- see Files above. `asset_version 1.2.0` took 300 ->
307, adding `done`, `doing`, `little`, `fewest`, `least`, `owing to`,
`n't`. `asset_version 1.1.0` revised the schema to carry `Word`'s full
field set; the original 300 lexical forms and their meanings were
unchanged from `asset_version 1.0.0`).

## Language extension

This directory is `assets/common/en/`. Additional languages (`fr`,
`de`, `es`, `it`, ...) are added as sibling `assets/common/<language_code>/`
directories with the same file structure and format; the seeding
algorithm (`WordSeeder`) is not language-specific -- it loads whichever
`assets/common/<language_code>/` directory matches the Domain's
language code.
