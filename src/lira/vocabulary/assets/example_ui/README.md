# Example UI Output

`dictionary_view_example.html` is a static, pre-generated example of
`DictionaryView`'s output (`vocabulary/ui/dictionary_view.py`) -- open
it directly in a browser to see the UI without running any code.

It now shows a **Physics Domain**, seeded from the Common Domain (551
words: 388 mandatory closed-class + 163 supplementary metalinguistic
terms) plus 63 lexical forms (81 `Word` records -- several with more
than one part of speech, e.g. `charge` -> NOUN + VERB, `field` -> NOUN
+ VERB) hydrated from a representative Physics source text via the
Vocabulary Layer's domain-seeding pipeline
(`DictionaryProcessor.identify_word`, `AsyncDictionaryHydrator`,
`ExternalDictionaryAdapter`) -- 632 words, 138 relationships in total.
See `examples/README.md` (repo root) for the full demonstration,
including the network caveat (this sandbox blocks live calls to
`api.dictionaryapi.dev`, so the hydrated words came from curated
fixture data in that API's real response shape, run through the
otherwise-unmodified pipeline -- the generated page's title says so
explicitly) and the full seeding report.

It also demonstrates two `DictionaryView` display additions made for
this exercise: a **Provenance** line in the word detail panel (reads
`Word.source_references`, previously computed but never shown), and
an **Unresolved** panel listing words the pipeline could not resolve
(`branch`, `studies`) -- reported rather than guessed. Both are
additive and optional (`DictionaryView(..., unresolved=(...))`,
default `()`); rendering a `Dictionary` with no unresolved list behaves
exactly as before.

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
