# Knowledge Layer UI

- `lira_view.py` -- `LiraView`, combining `DictionaryView` (Vocabulary
  Layer) and `SentenceReaderView` (Linguistics Layer) into one tabbed,
  offline HTML page.
- `knowledge_view.py` -- `KnowledgeView`, drawing a seeded
  `TensorLiraGraph`'s own Knowledge Vector Space geometry (D1-D6,
  `knowledge/documentation/knowledge_vector_space_specification.md`)
  graphically -- SVG trees for D1/D2/D3/D5/D6, an arrow diagram for D4
  -- with an embedded `DictionaryView` tab a Concept node's own seeded
  Word pivots straight to when selected.

Both are static, self-contained, dependency-free HTML: all data is
embedded as JSON and rendered client-side in vanilla JS, no server, no
external requests. See `assets/example_ui/` for pre-generated output
and `examples/lira_view_example.py`/`examples/knowledge_view_example.py`
for the scripts that produce it.
