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
`LexicalRelationshipType` at a time (see Hierarchy tab below), and a
fourth Cyclic tab renders the genuinely cyclic structure a tree can't
represent, as an actual graph (see Cyclic relations tab below).

The Words, Hierarchy, and Cyclic tabs each own a **separate** detail
panel -- selecting a word in any one of them updates only that tab's
own panel and stays right there; it never pivots you across tabs.
Every related-word link, wherever it appears (a detail panel's own
relationship list, a Hierarchy tree node, a Cyclic graph node), re-
selects within its own tab, so walking the relationship graph from,
say, the Hierarchy tab never drops you back into the Words list.

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
glance without leaving the panel. A genuinely polysemous Common word
(`Word.domain_tag` set -- two senses sharing one lexical_form *and*
part_of_speech, `vocabulary/assets/common/en/README.md`'s own
Polysemous senses section) shows its own subdomain instead of plain
"Common" -- `bar`'s symbol/mark sense reads `symbol.common`, its
physical-rod sense reads `item.common` -- so the Words table, its
Domain filter, and every relationship pill tell the two senses apart
at a glance, the same way two homographs are already told apart by
their Part of speech column.

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
symmetric kind (`SYNONYM`, `ANTONYM`, `RELATED` -- every edge's reverse
is also stored, so every word has both an incoming and an outgoing
edge) has none. Rather than fall back to one root per word -- which
would render a whole forest of largely-redundant trees, since a mutual
group's members would each show up as their own root with mostly the
same other members as children -- this case clusters instead: every
genuine clique in the kind's edge graph (`cliqueGroups` -- every word
in a group directly connected to every other word in that same group,
2+ words; not merely a connected component, which would silently chain
together words that are only reachable through a run of separate edges
and were never actually all related to each other -- see `cliqueGroups`'s
own comment for a real example this dictionary produced) becomes one
flat group of chips, no nesting. Pick `SYNONYM` to see near-synonym groups clustered together this way
rather than scattered across redundant roots. Two independent guards
keep the *tree* render finite for every other (non-symmetric) kind,
where the underlying graph still isn't guaranteed to be acyclic: a node
reappearing within its own ancestor chain renders as a "(cycle)" leaf
instead of recursing forever, and a node reached a second time via a
*different* parent (a legitimate DAG shape -- one word with two
hypernyms, say) renders as a plain cross-reference instead of
duplicating its whole subtree again. Every node or chip is clickable,
selecting it in the Hierarchy tab's own detail panel above (see the
note on per-tab detail panels above) -- it never leaves the Hierarchy
tab.

### Cyclic relations tab

A tree, however deep, cannot represent a genuine cycle -- the Hierarchy
tab above deliberately collapses one into a "(cycle)" leaf rather than
recursing forever, which keeps that view finite but discards the
cyclic structure itself. Hierarchy's own clustering for symmetric kinds
(the section above) already replaces a redundant tree with flat groups,
but that's a *list*, not a graph -- it doesn't show which specific
words within a cluster are directly connected to which, or what else
that cluster connects to. This tab is that complementary graphical
view: `SYNONYM` always defines the boxes (`synonymBoxes`, built on the
same `cliqueGroups` clique-finding Hierarchy's clustering uses above --
every word *directly* synonymous with every other word in the same box
is grouped together, drawn close since they mean the same thing, but a
chain of separate synonym pairs never gets merged into one box just
because it's transitively reachable; a word with no `SYNONYM` edge at
all still gets a box of its own, so every word is a valid line
endpoint), and the dropdown picks *some other* kind whose
edges get drawn as lines *between* boxes. Two kinds are deliberately
excluded from that dropdown, both for the same underlying reason (this
whole tab's premise -- box the synonyms, draw lines for what a word
means in relation to others -- is itself a Lexical Semantic, group 1
idea, so pairing it with a kind from a different group doesn't read as
a meaningful combination): `SYNONYM` itself (every pair is, by
definition, already inside one box together, so there's never a
cross-box `SYNONYM` line to draw), and every Morphological or
Orthographic kind (`LEMMA_FORM`, `PLURAL_FORM`, `CONTRACTION`, ...).
The dropdown lists only group 1 -- `ANTONYM`, `HYPERNYM`/`HYPONYM`,
`MERONYM`/`HOLONYM`, `TROPONYM`, `ENTAILMENT`, `CAUSE`, `RELATED`.
Picking `ANTONYM`, say, draws `present` and `current` together in one
box (they're synonyms) with lines fanning out from each of them to
whichever other boxes hold their own antonyms (`missing`, `past`,
`archaic`) -- the synonym relationship itself is shown as physical
proximity inside a box rather than as a drawn line, and the more
informative relationships (the reason you picked a kind at all) are
what the lines actually carry.

Groups of boxes (independent connected sets, found via
`connectedComponents` applied one level up -- boxes as the nodes, the
selected kind's edges as the edges -- so two unrelated pairs don't end
up sharing one drawing) default to the first kind, by edge count, that
actually connects two or more boxes, rather than whichever kind sorts
first alphabetically (most kinds are far more likely to land entirely
within one box, or on a word with no synonyms, than to bridge two
different boxes) -- except `RELATED`, deliberately pushed to the back
of that ordering regardless of its edge count: it's this relationship
group's own "unspecified" catch-all (`examples/
physics_domain_relationships.py`'s module docstring: "never as a
default when a more specific kind would apply"), and it usually *does*
have the most edges of any kind here, so without that exception it
would win the default almost every time -- exactly the outcome that
convention exists to avoid. Each group is its own small SVG, laid out
left to right rather than around a circle: `boxLevels` runs a BFS out
from the group's highest-degree box (ties broken alphabetically),
giving every box a hop-distance "level" from that hub; `clusterGraphSVG`
then places level 0 in the leftmost column, level 1 in the next column
over, and so on. Within a column, boxes aren't just stacked in
whatever order `boxLevels` happened to produce -- `reduceCrossings`
reorders them with the barycenter/median heuristic layered-graph tools
use (Sugiyama-style): repeated left-to-right and right-to-left sweeps,
each re-sorting a column by the average position, in the *adjacent*
column, of the boxes it connects to, so two boxes that share a
neighbour end up near each other instead of at arbitrary alphabetical
positions. Doesn't guarantee zero crossings (that's NP-hard in
general) but eliminates nearly all of them in practice -- measured
against the plain alphabetical order it replaced, `ANTONYM` and
`HYPERNYM` both go from dozens of crossings to zero, `RELATED` (this
dictionary's densest, longest-chained kind) from 928 to 40. Each
column's boxes are then stacked vertically and the whole column
centred against the tallest one; because most edges connect a box to
a neighbouring level, most lines end up running from one column to
the next -- left to right -- rather than in whatever direction a
circular layout happened to put two connected boxes. `ANTONYM`
(`DEPTH_CAPPED_KINDS`)
caps this at two columns -- a box two hops from the hub isn't the
hub's antonym at all, just something the hub's antonym happens to also
oppose (two unrelated word pairs coincidentally sharing a box), so
drawing it a full column further out would imply a hierarchy `ANTONYM`
doesn't have. `boxLevels` takes an optional `flatten` flag that folds
every box's level down to its BFS-distance *parity* (`level % 2`)
instead of the raw hop count -- not a plain clamp to column 1: a
clamp would put a two-hops-out box in the same column as the one-hop
box it's actually connected to, drawing that edge vertically within
one column instead of left to right. Parity avoids this -- the
two-hops-out box lands back in column 0 (even), the one-hop box stays
in column 1 (odd), so their edge still crosses columns like every
other one, as long as the box graph is bipartite (true in practice for
`ANTONYM`'s antonym-sharing chains, which alternate like a path rather
than closing a cycle back on themselves). A real hierarchy kind like
`HYPERNYM` passes `flatten: false` and keeps its full, unflattened
depth, since depth *is* the meaning there. Each word inside a box is
positioned along its own small vertical stack so a line lands on the
specific word it's from or to, not just the box's centre --
`present`'s antonym line and `current`'s antonym line are visually
distinguishable even though both start inside the same box. Lines are
drawn first, boxes and labels on top, so a line's visible end sits
right at the box edge. Arrowheads
(`marker-end`, plus `marker-start` too when both directions are
present, drawn as one line rather than two overlapping ones) show
which kinds are one-directional (`ENTAILMENT`, `CAUSE`, `TROPONYM`)
versus symmetric (`ANTONYM`, `RELATED`) or paired inverses
(`HYPERNYM`/`HYPONYM`, `MERONYM`/`HOLONYM`). Every word is clickable,
the same select-within-this-tab interaction Hierarchy uses. A generous
400-group cap guards only against a pathological kind with an
unrealistic number of groups, not a curation choice -- every genuine
group is meant to be visible, down to the smallest (two boxes, one
line).

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
