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
    domain_name="Physics",  # optional, default "Domain" -- see below
    unresolved=(),  # optional: surface caller-tracked words that never resolved (see below)
)
view.save("dictionary.html")
```

The word detail panel includes a **Provenance** line, reading each
`Word.source_references` (previously a populated field this view never
displayed). The optional `unresolved` constructor argument -- a tuple
of surface forms, default `()` -- renders a small **Unresolved** panel
above the tables when non-empty; a `Dictionary` has no concept of "a
word that was never resolved" on its own (there's no `Word` record to
find), so a caller that tracks failed lookups (e.g. a domain-seeding
run) hands the list in explicitly. See `assets/example_ui/README.md`
for a worked example (a Physics Domain seeded via
`examples/physics_domain_seeding.py`, repo root).

`Word` itself carries no domain field (a Domain owns its Dictionary;
the Word doesn't know which one it's in), so this view labels each
word "Common" (`word.is_common`) or `domain_name` (everything else --
default `"Domain"` when the caller doesn't supply one) and shows that
label as its own **Domain** column in the Words table, a **Domain**
filter dropdown alongside the part-of-speech one, and a pill next to
each related word in the detail panel's relationship list -- so a
Domain-specific word's inherited-vs-own relationships are visible at a
glance without leaving the panel.

Each relationship row in that panel also carries a one-sentence plain-
English gloss of what the edge actually means -- "particle is a type
of matter" (HYPERNYM), "nucleus is part of atom" (MERONYM), "exert
causes accelerate" (CAUSE), "am is the first-person form of be"
(FIRST_PERSON_FORM), and so on for every `LexicalRelationshipType`
member, generic-Semantic and morphological/orthographic alike
(`RELATIONSHIP_SENTENCES` in the page's own script, one template
function per kind, keyed by kind name; an unlisted kind falls back to
"X is Y-related to Z"). Always phrased from the edge's own stored
(source, target) -- worth knowing since several kinds are asymmetric
(a HYPERNYM edge is stored narrower→broader, so the sentence reads
"source is a type of target"; a HYPONYM edge over the *same* pair is
stored broader→narrower, so its sentence is "target is a type of
source") -- getting this right for every kind was verified directly
against `Word.py`'s own derived properties before shipping it (see
`examples/physics_domain_relationships.py`'s module docstring for the
full reasoning), not assumed from the kind's name alone.

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
