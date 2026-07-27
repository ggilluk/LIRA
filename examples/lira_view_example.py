"""Generates the combined LiraView example artifact -- one static,
fully offline HTML page with both the Vocabulary Dictionary and the
Linguistics Sentence Reader as tabs (knowledge/ui/lira_view.py). Uses
the Common Domain (the same seeded Dictionary used throughout this
project, via lira.knowledge.data.host.LIRAHost) and the fully-seeded
control corpus from linguistics_sentence_reading_corpus.py as the
Sentence Reader tab's offline example set -- every sentence in it was
already verified word-by-word seeded before inclusion there.

Run: python3 examples/lira_view_example.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from linguistics_sentence_reading_corpus import CORPUS_B_CONTROL_SENTENCES  # noqa: E402

from lira.knowledge.data.host import LIRAHost  # noqa: E402
from lira.knowledge.ui.lira_view import LiraView  # noqa: E402
from lira.linguistics.ui.sentence_reader_view import SentenceReaderView  # noqa: E402
from lira.vocabulary.ui.dictionary_view import DictionaryView  # noqa: E402


def main() -> None:
    host = LIRAHost("LiraViewExample")
    common = host.get_or_create_domain("Common")

    dictionary_view = DictionaryView(
        common.vocabulary.dictionary,
        common.vocabulary.lexical_relationships,
        title="LIRA Dictionary -- Common Vocabulary",
        domain_name="Common",
    )
    sentences = [text for text, _ in CORPUS_B_CONTROL_SENTENCES]
    sentence_reader_view = SentenceReaderView(common.linguistics, sentences)

    combined = LiraView(dictionary_view, sentence_reader_view)
    ui_path = Path(__file__).resolve().parents[1] / "src/lira/knowledge/assets/example_ui/lira_view_example.html"
    ui_path.parent.mkdir(parents=True, exist_ok=True)
    combined.save(str(ui_path))
    print(f"Combined LiraView example regenerated at {ui_path}")


if __name__ == "__main__":
    main()
