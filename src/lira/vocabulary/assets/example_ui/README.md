# Example UI Output

`dictionary_view_example.html` is a static, pre-generated example of
`DictionaryView`'s output (`vocabulary/ui/dictionary_view.py`) -- open
it directly in a browser to see the UI without running any code.

It was generated from the Common Domain's Dictionary and
LexicalRelationshipStore (551 words -- 388 from the English Common
Closed-Class Cache (including punctuation, symbols, numerals, and
closed-class contractions/phrasal particles) plus 163 supplementary
metalinguistic terms -- and 138 seeded relationships -- see
`assets/common/en/README.md` and `assets/common/en/relationships/README.md`),
using:

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
output as that class evolves. Regenerate it with the snippet above
whenever the UI changes materially.
