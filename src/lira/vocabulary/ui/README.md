# Vocabulary UI

## DictionaryView

`DictionaryView` (`dictionary_view.py`) renders a `Dictionary` and its
`LexicalRelationshipStore` as a single, self-contained HTML page: a
sortable, searchable Words table with a master-detail layout -- select
a word and its relationships (source → kind → target, both outgoing and
incoming) appear inline in a detail panel above the table, no
navigation away from the list. Each related word in that panel is
itself clickable, pivoting the detail panel to it, so the relationship
graph can be walked in place. A separate Relationships tab lists every
edge in the domain, sortable and searchable on its own, each
source/target word shown with its part of speech so grammatical
category is visible without switching back to the Words tab. A third
Hierarchy tab renders the whole Dictionary as a tree for one chosen
`LexicalRelationshipType` at a time -- see Hierarchy tab below.

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

The word detail panel's definition is itself rendered word-by-word: each
token is wrapped so hovering or keyboard-focusing it reveals a small
popup naming that word's own lexical form, part of speech, domain, and
a short gloss -- built from `Word.definition_words()`
(`vocabulary/documentation/README.md`, 4.4) on the Python side
(`DictionaryView._definition_segments`), not re-derived in JS. A token
`definition_words()` couldn't resolve gets a dashed underline and a
"Not in this Dictionary" popup instead of fabricated detail -- the same
reported-not-guessed discipline the rest of this view already follows
for an unresolved sentence occurrence. Plain punctuation and whitespace
between words pass through unwrapped, so the sentence still reads
exactly as `word.definition` itself does. Popups are pure CSS
(`opacity`/`pointer-events` on `:hover`/`:focus`), not JS-positioned, so
they respect `prefers-reduced-motion` for free like everything else on
this page.

The Words tab's detail panel sits above the table, not beside it --
selecting a word scrolls it into the same reading column the list is
in, rather than off to a narrow sidebar competing for width with a
wide Definition column. It stays `position: sticky` (capped at
`min(52vh, 520px)`, its own scrollbar past that) so it stays in view
while the list below it scrolls, and drops to normal (non-sticky) flow
under the existing 860px mobile breakpoint.

### Hierarchy tab

Renders the *entire* Dictionary as a nested tree for one
`LexicalRelationshipType` at a time, picked from a dropdown listing
every kind actually present (with its edge count) -- not a per-word
view like the detail panel's Relationships section, but the full
structure a given kind traces across the whole Domain: pick `HYPONYM`
to see the broad-to-narrow taxonomy `RelationshipSeeder`'s own
NOUN/HYPERNYM data forms, `HOLONYM` for whole-to-part, `PLURAL_FORM`
for every singular paired with its plural, and so on for any of the
other `LexicalRelationshipType` members with edges seeded. Tree edges
are the literal (source, kind, target) triple already shown in the
Relationships tab -- source is the parent node, target the child --
with no attempt to reorient a kind's direction to whatever "feels"
hierarchical; picking the kind itself (`HYPONYM` instead of
`HYPERNYM`, `HOLONYM` instead of `MERONYM`) is what controls which way
the tree reads, the same pair of inverse edges the relationship cache
already materialises for exactly this reason (`assets/common/en/
relationships/README.md`'s Symmetric and inverse edges section).
Roots are words with no incoming edge of the selected kind; a fully
symmetric kind (`SYNONYM`, `ANTONYM` -- every word has both directions)
has none, so every word becomes its own single-level root instead, and
the panel says so explicitly rather than silently rendering an empty
tree. Two independent guards keep the render finite even though the
underlying graph isn't guaranteed to be a tree: a node reappearing
within its own ancestor chain renders as a "(cycle)" leaf instead of
recursing forever, and a node reached a second time via a *different*
parent (a legitimate DAG shape -- one word with two hypernyms, say)
renders as a plain cross-reference instead of duplicating its whole
subtree again. Every node is clickable, pivoting to the Words tab with
that word selected and scrolled into view, the same
select-and-scroll-to interaction the detail panel's own related-word
links already use.

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
