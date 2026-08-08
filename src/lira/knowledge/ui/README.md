# Knowledge Layer UI

- `lira_view.py` -- `LiraView`, combining `DictionaryView` (Vocabulary
  Layer) and `SentenceReaderView` (Linguistics Layer) into one tabbed,
  offline HTML page.
- `knowledge_view.py` -- `KnowledgeView`, drawing a `TensorLiraGraph`'s
  own Knowledge Vector Space geometry (D1-D6,
  `knowledge/documentation/knowledge_vector_space_specification.md`)
  graphically -- SVG trees for D1/D2/D3/D5/D6, an arrow diagram for D4
  -- meant to be generated only after seeding *and* a follow-up pass of
  Knowledge Vector Space logic (`../role/vector_space_passes.py`).
  D1/D2/D3 Concepts are grouped into one box per Domain (selectable via
  a Domain filter), with synonym clusters boxed within a Domain's own
  box (a checkbox next to the Domain filter switches that off);
  D4 additionally shows every structural closing edge the vector space
  passes inserted for a chain that didn't close on its own (spec
  40.4/40.5), drawn dashed and distinct from a genuine seeded
  CAUSE/ENTAILMENT edge. An embedded `DictionaryView` tab is where a
  Concept node's own seeded Word pivots straight to when selected.

Both are static, self-contained, dependency-free HTML: all data is
embedded as JSON and rendered client-side in vanilla JS, no server, no
external requests. See `assets/example_ui/` for pre-generated output
and `examples/lira_view_example.py`/`examples/knowledge_view_example.py`
for the scripts that produce it.
