"""SentenceReaderView: renders the Linguistics Layer read path
(`Phrase.read()`/`Clause.read()`/`Sentence.read()`) as a single,
self-contained, fully offline HTML page -- the same page
`sentence_reader_server.py`'s live server serves, but with a
precomputed example corpus embedded instead of a live backend to fetch
against. Every sentence is read once, at generation time, via a real
`LinguisticController` (Rule 17/18/2's "no client-side reimplementation
of the grammar" still holds here -- this just runs the real pipeline
ahead of time instead of on each request); the page's own JS (shared
with the live server, see `render_page`'s docstring) falls back to
matching a typed sentence against this embedded set whenever no live
`/api/read` answers -- which, opened as a bare file, is always."""

from typing import List, Tuple

from ..role.linguistic_controller import LinguisticController
from .sentence_reader_server import DEFAULT_SUBTITLE, DEFAULT_TITLE, build_examples, render_page


def _extract_between(html: str, start_marker: str, end_marker: str) -> str:
    """Same small helper as vocabulary/ui/dictionary_view.py's own copy
    -- duplicated, not cross-imported, rather than adding a shared
    module just for a four-line string slice."""
    start = html.index(start_marker) + len(start_marker)
    end = html.index(end_marker, start)
    return html[start:end].strip("\n")


class SentenceReaderView:
    """Construct with a live `LinguisticController` (typically
    `domain.linguistics` off an already-seeded `Domain`/`LIRAHost`) and
    the list of sentences to precompute -- call `render()`/`save()` for
    a standalone page, or `render_fragment()` to embed this view as one
    tab of a combined page (`knowledge/ui/lira_view.py`)."""

    def __init__(
        self,
        controller: LinguisticController,
        sentences: List[str],
        *,
        title: str = DEFAULT_TITLE,
        subtitle: str = DEFAULT_SUBTITLE,
    ):
        self.controller = controller
        self.sentences = sentences
        self.title = title
        self.subtitle = subtitle

    def render(self) -> str:
        examples = build_examples(self.controller, self.sentences)
        return render_page(examples, title=self.title, subtitle=self.subtitle)

    def save(self, path: str) -> None:
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(self.render())

    def render_fragment(self) -> Tuple[str, str, str]:
        """(style_css, body_html, script_js) for embedding this view as
        one tab of a combined page -- see dictionary_view.py's own
        `render_fragment()` for the identical extraction approach and
        the reason `script_js` is kept separate (each view's script
        declares top-level names like `POS_COLORS` that would collide
        if two views' scripts landed unscoped in one global `<script>`
        block). The markers are inert HTML/CSS/JS comments, so
        standalone `render()`/`save()` are completely unaffected."""
        html = self.render()
        style = _extract_between(html, "/*@@STYLE_FRAGMENT_START@@*/", "/*@@STYLE_FRAGMENT_END@@*/")
        body = _extract_between(html, "<!--@@BODY_FRAGMENT_START@@-->", "<!--@@BODY_FRAGMENT_END@@-->")
        script = _extract_between(html, "/*@@SCRIPT_FRAGMENT_START@@*/", "/*@@SCRIPT_FRAGMENT_END@@*/")
        return style, body, script
