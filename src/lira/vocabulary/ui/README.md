# Vocabulary UI

## DictionaryView

`DictionaryView` (`dictionary_view.py`) renders a `Dictionary` and its
`LexicalRelationshipStore` as a single, self-contained HTML page: a
sortable, searchable Words table with a master-detail layout -- select
a word and its relationships (source → kind → target, both outgoing and
incoming) appear inline in a side panel, no navigation away from the
list. Each related word in that panel is itself clickable, pivoting the
detail panel to it, so the relationship graph can be walked in place. A
separate Relationships tab lists every edge in the domain, sortable and
searchable on its own, each source/target word shown with its part of
speech so grammatical category is visible without switching back to
the Words tab.

```python
from lira.vocabulary import DictionaryView

view = DictionaryView(
    domain.vocabulary.dictionary,
    domain.vocabulary.lexical_relationships,
    title="LIRA Common Dictionary",
)
view.save("dictionary.html")
```

All Word and LexicalRelationship data is embedded as JSON in the page
and searched/filtered/sorted client-side in vanilla JS -- there is no
server and the page makes no external requests. Typefaces are system
font stacks only (no CDN or embedded webfont), so the generated file
stays a single dependency-free artefact that can be opened directly or
served as a static asset.

The page follows the project's light/dark token system: colors are
CSS custom properties on `:root`, redefined under
`@media (prefers-color-scheme: dark)` and under
`:root[data-theme="dark"]` / `:root[data-theme="light"]` so an embedding
page's theme toggle is honoured in both directions. Part-of-speech and
relationship-group colors are a separate, hand-picked semantic palette
from the page's accent color, so grammatical category is never confused
with UI state.
