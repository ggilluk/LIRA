# Example UI Output

`dictionary_view_example.html` is a static, pre-generated example of
`DictionaryView`'s output (`vocabulary/ui/dictionary_view.py`) -- open
it directly in a browser to see the UI without running any code.

It now shows a **Physics Domain**, seeded from the Common Domain (551
words: 388 mandatory closed-class + 163 supplementary metalinguistic
terms) plus 77 lexical forms (95 `Word` records -- several with more
than one part of speech, e.g. `charge` -> NOUN + VERB, `field` -> NOUN
+ VERB) hydrated from a representative Physics source text via the
Vocabulary Layer's domain-seeding pipeline
(`DictionaryProcessor.identify_word`, `AsyncDictionaryHydrator`,
`ExternalDictionaryAdapter`) -- 648 words, 213 relationships in total
(138 inherited from Common + 75 hand-curated among the hydrated
Physics words, covering every `LexicalRelationshipType` Lexical
Semantic kind with at least 5 real examples each: `hot`<->`cold`
ANTONYM, `matter` HYPERNYM `particle`, `nucleus` MERONYM `atom`,
`move` TROPONYM `flow`, `heat` CAUSE `melt`, and more --
`RelationshipSeeder` itself never relates a hydrated word; see
`examples/physics_domain_relationships.py`). Two hydrated words
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
  (`word.is_common`); filtering to "Physics" isolates exactly the 95
  hydrated (or conflict-resolved) words, filtering to "Common" the
  inherited 551.
- A one-sentence plain-English gloss under each relationship row in
  the detail panel, phrased per kind -- select `particle_2` to see
  "particle is a type of matter" (HYPERNYM), "nucleus is part of atom"
  (MERONYM, select `nucleus`), "exert causes accelerate" (CAUSE, select
  `move`); select `be` (Common) to see the same treatment applied to
  ordinary morphological kinds, e.g. "am is the first-person form of
  be".
- Each word's own definition, in the detail panel, rendered word-by-word
  with a hover/keyboard-focus popup on every token -- select `atom` to
  see its definition ("The basic unit of a chemical element, consisting
  of a nucleus surrounded by electrons.") with `nucleus` popping up
  `Noun · Physics` and its own definition, while `basic`, `unit`,
  `chemical`, `element`, `consisting`, `surrounded`, and `electrons`
  (the plural inflection doesn't exact-match the singular `electron`
  Word's `text`) each pop up "Not in this Dictionary" instead --
  `Word.definition_words()` (`vocabulary/documentation/README.md`, 4.4),
  not guessed. See `examples/README.md`'s Definition word breakdown
  section for the completeness numbers behind this.

Regenerate with:

```
python3 examples/physics_domain_seeding.py
```

run from the repository root, which regenerates this file directly
from a freshly seeded Physics Domain and also writes
`examples/physics_domain_seeding_report.md`.

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
