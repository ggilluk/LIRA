"""LiraView: combines DictionaryView (Vocabulary Layer) and
SentenceReaderView (Linguistics Layer) into one static, fully offline
page with a tab switcher -- lives in the Knowledge Layer's own ui/
rather than either Vocabulary's or Linguistics's, since a page that
needs both would otherwise force one layer's ui/ module to import the
other's; Domain (knowledge/data/domain.py) is already the one place
that composes Vocabulary + Linguistics + Knowledge, so a combined UI is
Domain-level, not layer-level.

Both source views' render_fragment() methods already do the hard work
-- extracting page-specific CSS/HTML/JS from a standalone render() via
inert comment markers, see each view's own docstring for why. This
class only merges the two: shared chrome (root tokens, reset, masthead/
page/subtitle -- taken once, copied verbatim from
vocabulary/ui/dictionary_view.py's own copy, since both views' copies
are pixel-identical) plus a tab switcher, plus each view's own body
under its own tab-content div, plus each view's own script wrapped in
its own IIFE -- both views independently declare top-level names like
`const POS_COLORS` that would be a JS SyntaxError (redeclaration) if
concatenated unscoped into one global `<script>` block."""

from ...linguistics.ui.sentence_reader_view import SentenceReaderView
from ...vocabulary.ui.dictionary_view import DictionaryView

DEFAULT_TITLE = "LIRA"
DEFAULT_SUBTITLE = "Vocabulary Dictionary and Linguistics Sentence Reader"


class LiraView:
    """Construct with an already-built `DictionaryView` and
    `SentenceReaderView` (both cheap to construct; the expensive work --
    rendering, precomputing sentence readings -- only happens inside
    `render()`/`save()`) and call `render()`/`save()`."""

    def __init__(
        self,
        dictionary_view: DictionaryView,
        sentence_reader_view: SentenceReaderView,
        *,
        title: str = DEFAULT_TITLE,
        subtitle: str = DEFAULT_SUBTITLE,
    ):
        self.dictionary_view = dictionary_view
        self.sentence_reader_view = sentence_reader_view
        self.title = title
        self.subtitle = subtitle

    def render(self) -> str:
        dict_style, dict_body, dict_script = self.dictionary_view.render_fragment()
        sr_style, sr_body, sr_script = self.sentence_reader_view.render_fragment()
        html = _PAGE_TEMPLATE
        for token, value in {
            "TITLE": self.title,
            "SUBTITLE": self.subtitle,
            "DICTIONARY_STYLE": dict_style,
            "SENTENCE_READER_STYLE": sr_style,
            "DICTIONARY_BODY": dict_body,
            "SENTENCE_READER_BODY": sr_body,
            "DICTIONARY_SCRIPT": dict_script,
            "SENTENCE_READER_SCRIPT": sr_script,
        }.items():
            html = html.replace("@@%s@@" % token, value)
        return html

    def save(self, path: str) -> None:
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(self.render())


_PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>@@TITLE@@</title>
<style>
:root {
  --ground: #F4F5F1;
  --surface: #FFFFFF;
  --ink: #1C2321;
  --ink-muted: #5B6660;
  --accent: #2B6E63;
  --accent-ink: #FFFFFF;
  --line: #DDE0DA;
  --line-strong: #C4C9BF;
  --shadow: 0 1px 2px rgba(28, 35, 33, 0.06), 0 4px 12px rgba(28, 35, 33, 0.04);
  --radius: 6px;
  --font-display: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif;
  --font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-mono: 'SF Mono', 'Cascadia Code', Consolas, 'Liberation Mono', Menlo, monospace;
}
@media (prefers-color-scheme: dark) {
  :root {
    --ground: #12211D;
    --surface: #182A24;
    --ink: #E7EEEA;
    --ink-muted: #90A69D;
    --accent: #4FBBA6;
    --accent-ink: #0B1613;
    --line: #2A3B34;
    --line-strong: #3B4F47;
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.25);
  }
}
:root[data-theme="dark"] {
  --ground: #12211D;
  --surface: #182A24;
  --ink: #E7EEEA;
  --ink-muted: #90A69D;
  --accent: #4FBBA6;
  --accent-ink: #0B1613;
  --line: #2A3B34;
  --line-strong: #3B4F47;
  --shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.25);
}
:root[data-theme="light"] {
  --ground: #F4F5F1;
  --surface: #FFFFFF;
  --ink: #1C2321;
  --ink-muted: #5B6660;
  --accent: #2B6E63;
  --accent-ink: #FFFFFF;
  --line: #DDE0DA;
  --line-strong: #C4C9BF;
  --shadow: 0 1px 2px rgba(28, 35, 33, 0.06), 0 4px 12px rgba(28, 35, 33, 0.04);
}
* { box-sizing: border-box; }
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
html, body {
  margin: 0;
  background: var(--ground);
  color: var(--ink);
  font-family: var(--font-body);
}
body {
  padding: 32px clamp(16px, 4vw, 48px) 64px;
}
.page { max-width: 1180px; margin: 0 auto; }
header.masthead {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line-strong);
  margin-bottom: 24px;
}
h1 {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 2rem;
  margin: 0;
  text-wrap: balance;
  letter-spacing: -0.01em;
}
.masthead .subtitle {
  font-size: 0.9rem;
  color: var(--ink-muted);
}
.tab-switcher {
  display: flex;
  gap: 4px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 4px;
}
.tab-switcher button {
  background: none;
  border: none;
  border-radius: 4px;
  padding: 7px 16px;
  font-size: 0.88rem;
  font-weight: 600;
  font-family: var(--font-body);
  color: var(--ink-muted);
  cursor: pointer;
}
.tab-switcher button.active {
  background: var(--accent);
  color: var(--accent-ink);
}
.tab-switcher button:not(.active):hover { color: var(--ink); }
.lira-tab-content { display: none; }
.lira-tab-content.active { display: block; }
footer.lira-footer {
  margin-top: 28px;
  font-size: 0.76rem;
  color: var(--ink-muted);
  text-align: center;
}
</style>
<style>
@@DICTIONARY_STYLE@@
</style>
<style>
@@SENTENCE_READER_STYLE@@
</style>
</head>
<body>
<div class="page">
  <header class="masthead">
    <div>
      <h1>@@TITLE@@</h1>
      <div class="subtitle">@@SUBTITLE@@</div>
    </div>
    <nav class="tab-switcher" role="tablist">
      <button class="lira-tab-btn active" type="button" data-tab="dictionary" role="tab" aria-selected="true">Dictionary</button>
      <button class="lira-tab-btn" type="button" data-tab="sentence-reader" role="tab" aria-selected="false">Sentence Reader</button>
    </nav>
  </header>

  <div class="lira-tab-content active" id="lira-tab-dictionary">
@@DICTIONARY_BODY@@
  </div>
  <div class="lira-tab-content" id="lira-tab-sentence-reader">
@@SENTENCE_READER_BODY@@
  </div>

  <footer class="lira-footer">LIRA -- Vocabulary Dictionary &amp; Linguistics Sentence Reader</footer>
</div>

<script>
(function () {
@@DICTIONARY_SCRIPT@@
})();
</script>
<script>
(function () {
@@SENTENCE_READER_SCRIPT@@
})();
</script>
<script>
(function () {
  const buttons = document.querySelectorAll(".lira-tab-btn");
  const panels = {
    dictionary: document.getElementById("lira-tab-dictionary"),
    "sentence-reader": document.getElementById("lira-tab-sentence-reader"),
  };
  for (const button of buttons) {
    button.addEventListener("click", () => {
      for (const other of buttons) {
        other.classList.remove("active");
        other.setAttribute("aria-selected", "false");
      }
      button.classList.add("active");
      button.setAttribute("aria-selected", "true");
      for (const key in panels) panels[key].classList.remove("active");
      panels[button.dataset.tab].classList.add("active");
    });
  }
})();
</script>
</body>
</html>
"""
