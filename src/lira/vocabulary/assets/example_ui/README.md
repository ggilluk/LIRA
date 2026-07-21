# Example UI Output

`dictionary_view_example.html` is a static, pre-generated example of
`DictionaryView`'s output (`vocabulary/ui/dictionary_view.py`) -- open
it directly in a browser to see the UI without running any code.

It now shows a **Physics Domain**, seeded from the Common Domain (now
772 words: 388 mandatory closed-class + 163 supplementary
metalinguistic terms + 221 promoted open-class words -- see below)
plus 117 lexical forms hydrated directly into the Physics Domain
(95 `Word` records from a representative Physics source text, several
with more than one part of speech, e.g. `charge` -> NOUN + VERB, plus
40 more found by breaking every hydrated word's own definition down
into its constituent words -- see Definition-gap vocabulary below) via
the Vocabulary Layer's domain-seeding pipeline
(`DictionaryProcessor.identify_word`, `AsyncDictionaryHydrator`,
`ExternalDictionaryAdapter`) -- 909 words, 305 relationships in total
(196 inherited from Common + 109 hand-curated or morphologically-linked
among the hydrated Physics words, covering every
`LexicalRelationshipType` Lexical Semantic kind with at least 5 real
examples each: `hot`<->`cold` ANTONYM, `matter` HYPERNYM `particle`,
`nucleus` MERONYM `atom`, `move` TROPONYM `flow`, `heat` CAUSE `melt`,
and more -- `RelationshipSeeder` itself never relates a hydrated word;
see `examples/physics_domain_relationships.py`). Two hydrated words
(`object`, `particle`) turned out to collide with unrelated Common
metalinguistic senses of the same (text, part_of_speech) -- resolved
via `DictionaryProcessor.register_conflicting_sense`, visible in the
Words table as `object_2`/`particle_2`. See `examples/README.md` (repo
root) for the full demonstration, including the network caveat (this
sandbox blocks live calls to `api.dictionaryapi.dev`, so the hydrated
words came from curated fixture data in that API's real response
shape, run through the otherwise-unmodified pipeline -- the generated
page's title says so explicitly), the word-sense-conflict story, and
the full seeding report.

### Definition-gap vocabulary

Breaking every hydrated Physics word's own `definition` down into its
constituent words (`Word.definition_words()`, 4.4) originally found 262
distinct words with no entry anywhere in this Domain's Dictionary.
Each was classified and added: 221 as genuinely common, general-English
vocabulary (promoted into the Common Vocabulary Cache itself,
`assets/common/en/promoted_words.json` -- every other Domain inherits
them too, not just Physics), 40 as Physics-specific (SI units,
subatomic-particle plurals, the electromagnetism/thermodynamics
cluster -- hydrated directly into this Physics Domain), and exactly one
excluded (`s`, the trailing letter of a possessive like `wave's`
against the tokenizer's word pattern -- not a lexical item). 66 of
these also gained a real morphological relationship back to an
existing word (`electrons` -> `PLURAL_FORM` of `electron`, `measured`
-> `PAST_PARTICIPLE_FORM` of `measure`, and so on), plus four `ANTONYM`
pairs found directly in the batch (discrete/continuous, high/low,
push/pull, negative/positive). Definition completeness across the
Physics Domain rose from 69% (812 of 1185 tokens, only 1 word's
definition fully self-contained) to 94.7% (1544 of 1631 tokens, 105 of
137 words' definitions fully self-contained) -- the residual gap is
now these very words' *own* definitions needing words of their own
(`exist` -> "To have real, actual, or continued being" leaves
`continued` unresolved), the same unbounded regress `examples/README.md`
already discusses, not something this pass tries to chase to zero. See
`examples/definition_gap_vocabulary.py` (the full classification) and
`examples/README.md`'s Definition-gap vocabulary section for the
worked example.

It also demonstrates several `DictionaryView` display additions made
for this exercise, all additive and optional (existing call sites
unaffected):

- A **Provenance** line in the word detail panel, reading
  `Word.source_references` (previously computed but never shown).
- An **Unresolved** panel listing words the pipeline could not resolve
  (`branch`, `studies`) -- reported rather than guessed
  (`DictionaryView(..., unresolved=(...))`, default `()`).
- A **Domain** column in the Words table, a **Domain** filter dropdown
  alongside the part-of-speech one, and a domain pill next to every
  related word in the detail panel's relationship list --
  `DictionaryView(..., domain_name="Physics")`, default `"Domain"`.
  Every word and relationship is labelled "Common" or "Physics"
  (`word.is_common`); filtering to "Physics" isolates exactly the 137
  hydrated (or conflict-resolved) words, filtering to "Common" the
  inherited 772.
- A one-sentence plain-English gloss under each relationship row in
  the detail panel, phrased per kind -- select `particle_2` to see
  "particle is a type of matter" (HYPERNYM), "nucleus is part of atom"
  (MERONYM, select `nucleus`), "exert causes accelerate" (CAUSE, select
  `move`); select `be` (Common) to see the same treatment applied to
  ordinary morphological kinds, e.g. "am is the first-person form of
  be".
- Each word's own definition, in the detail panel, rendered word-by-word
  with a hover/keyboard-focus popup on every token -- select `electron`
  to see its definition ("A stable subatomic particle with a negative
  electric charge, found in every atom.") with every single token
  resolving now (`stable`, `negative`, `charge`, `found` -- all promoted
  into Common by the Definition-gap vocabulary pass above; `subatomic`,
  `atom` -- Physics), popping up its own lexical form, part of speech,
  domain, and gloss; select `exist` ("To have real, actual, or
  continued being") to see the one word left with a residual gap --
  `continued` pops up "Not in this Dictionary", since it's a word *this
  pass's own new definitions* introduced, not one of the original 262
  (`Word.definition_words()`, `vocabulary/documentation/README.md`,
  4.4). See `examples/README.md`'s Definition-gap vocabulary section
  for the completeness numbers behind this.

Regenerate with:

```
python3 examples/definition_gap_vocabulary_seeding.py
```

run from the repository root, which seeds the Physics Domain
(`physics_domain_seeding.run()`), promotes/hydrates the definition-gap
vocabulary on top of it, and regenerates this file directly from the
result. `python3 examples/physics_domain_seeding.py` on its own still
works and still writes `examples/physics_domain_seeding_report.md`,
but no longer regenerates this file -- it would only reflect the
Physics Domain *before* the definition-gap pass.

To instead regenerate a plain Common-only snapshot (the previous
content of this file):

```python
from lira.knowledge.data.host import LIRAHost
from lira.vocabulary import DictionaryView

host = LIRAHost(name="example-host")
common = host.hosted_domains.get("Common")
DictionaryView(
    common.vocabulary.dictionary,
    common.vocabulary.lexical_relationships,
    title="LIRA Common Dictionary",
).save("dictionary_view_example.html")
```

This file is a snapshot, not a live asset -- it is not read by any
seeder or loaded at runtime, and will drift from actual `DictionaryView`
output as that class evolves. Regenerate it whenever the UI changes
materially.
