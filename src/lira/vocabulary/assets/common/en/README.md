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
| `determiners.json` | Determiners (the, a, this, my, some, ...) | 35 |
| `pronouns.json` | Personal, possessive, reflexive, interrogative, relative, reciprocal, and indefinite pronouns | 92 |
| `auxiliaries.json` | Primary auxiliaries (be, have, do), modals (will, can, must), semi-modals (need, dare) | 27 |
| `prepositions.json` | Simple and compound/complex prepositions | 92 |
| `coordinating_conjunctions.json` | FANBOYS -- for, and, nor, but, or, yet, so | 7 |
| `subordinating_conjunctions.json` | because, although, unless, while, ... | 36 |
| `particles.json` | not, there, please, also, too, only, ... | 11 |
| `promoted_words.json` | Open-class words promoted from Domain vocabularies (starts empty) | 0 |

Mandatory closed-class total: **300** (35 + 92 + 27 + 92 + 7 + 36 + 11).
`promoted_words.json` is not counted toward the mandatory 300 -- it's a
separate, uncapped, generated list.

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

`v1` / `schema_version 2.0.0` / `asset_version 1.1.0` (schema revised
to carry `Word`'s full field set; the mandatory 300 lexical forms and
their meanings are unchanged from `asset_version 1.0.0`).

## Language extension

This directory is `assets/common/en/`. Additional languages (`fr`,
`de`, `es`, `it`, ...) are added as sibling `assets/common/<language_code>/`
directories with the same file structure and format; the seeding
algorithm (`WordSeeder`) is not language-specific -- it loads whichever
`assets/common/<language_code>/` directory matches the Domain's
language code.
