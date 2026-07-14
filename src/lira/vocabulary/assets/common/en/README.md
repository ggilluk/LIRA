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

Every closed-class file uses this structure:

```json
{
  "schema_version": "1.0.0",
  "language_code": "en",
  "part_of_speech": "...",
  "closed_class_kind": "...",
  "count": 0,
  "words": [
    {
      "lexical_form": "...",
      "normalised_form": "...",
      "language_code": "en",
      "part_of_speech": "...",
      "closed_class": true
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

## Cache rebuild policy

The cache is regenerable, not hand-maintained state: it may be
deleted and rebuilt from its word lists at any time without data loss,
since it holds no Word that isn't also derivable from a Domain (the
closed-class lists here, or a Domain's own promoted open-class words).
Rebuilding recomputes `manifest.json`'s counts from the per-file
`words` arrays.

## Promotion policy

An open-class Word (noun, lexical verb, adjective, adverb) is promoted
into `promoted_words.json` automatically once its cross-domain
reference count exceeds the configured promotion threshold (default
3) -- see `WordSeeder.PromoteWord` in `vocabulary/role/word_seeder.py`.
If a promoted Word's reference count later falls below the demotion
threshold (default 1), it is removed from `promoted_words.json`
(`WordSeeder.DemoteWord`) -- the authoritative Word in its owning
Domain is never deleted or modified by promotion or demotion.
Closed-class words are never promoted: they're already part of the
mandatory cache.

## Version

`v1` / `schema_version 1.0.0` / `asset_version 1.0.0`.

## Language extension

This directory is `assets/common/en/`. Additional languages (`fr`,
`de`, `es`, `it`, ...) are added as sibling `assets/common/<language_code>/`
directories with the same file structure and format; the seeding
algorithm (`WordSeeder`) is not language-specific -- it loads whichever
`assets/common/<language_code>/` directory matches the Domain's
language code.
