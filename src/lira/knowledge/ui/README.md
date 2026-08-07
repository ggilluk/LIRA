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
  box and a Concept this dimension has no recorded position for still
  shown, dimmed, at a z=-5 sentinel rather than left out. An embedded
  `DictionaryView` tab is where a Concept node's own seeded Word pivots
  straight to when selected.

Both are static, self-contained, dependency-free HTML: all data is
embedded as JSON and rendered client-side in vanilla JS, no server, no
external requests. See `assets/example_ui/` for pre-generated output
and `examples/lira_view_example.py`/`examples/knowledge_view_example.py`
for the scripts that produce it.
