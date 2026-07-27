"""LIRA Sentence Reader UI -- a local, interactive page for the
Linguistics Layer read path (`Phrase.read()`/`Clause.read()`/
`Sentence.read()`). Paste any sentence and see:

- **Predicted structure**: the one interpretation the state machine
  ranked highest and materialised (Sentence -> Clause -> subject/
  predicate/object/complement/modifiers -> Phrase -> words).
- **Full trace**: every phrase type `PhraseReader` attempted at every
  token position -- which ones matched the required start state, what
  they completed to, which completion won, and why the rest didn't.

Builds a live Common Domain (`LIRAHost`) the same way
`examples/linguistics_sentence_reading.py` does, then starts a local
HTTP server (stdlib only) serving the page. See
`src/lira/linguistics/ui/sentence_reader_server.py` for the server and
`linguistics/documentation/README.md` for the read path this exercises.

Run: python3 examples/linguistics_sentence_reader_ui.py [--host HOST] [--port PORT]
"""

import argparse

from lira.knowledge.data.host import LIRAHost
from lira.linguistics.ui.sentence_reader_server import SentenceReaderServer


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    host = LIRAHost("SentenceReaderUI")
    common = host.get_or_create_domain("Common")

    server = SentenceReaderServer(common.linguistics, host=args.host, port=args.port)
    server.serve_forever()


if __name__ == "__main__":
    main()
