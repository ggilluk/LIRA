"""SentenceReaderServer: a local HTTP server exposing the Linguistics
Layer read path (`Phrase.read()`/`Clause.read()`/`Sentence.read()`) as
an interactive page -- paste a sentence, see the predicted final
structure the state machine selected, and a full trace of every phrase
type it tried at every token position (linguistics/documentation/
README.md, sections 4-8, covers what this renders).

Stdlib only (`http.server`) -- no new dependency, in the same spirit as
`vocabulary/ui/dictionary_view.py`'s "no server, single dependency-free
file" for the static Dictionary view; this one *is* a server, because
reading an arbitrary user-typed sentence needs the live
SequenceEngine/GrammarConfigurator/DictionaryProcessor pipeline running
in Python for that specific input -- there is no client-side
reimplementation of the grammar here, which would duplicate the "one
shared sequencing engine" this layer's own spec requires
(linguistics/documentation/README.md, section 2). Single-threaded
(`http.server.HTTPServer`, not `ThreadingHTTPServer`) deliberately --
this is a local, one-user-at-a-time debugging tool, and the underlying
`LinguisticSystemPropertyTensor`/`Dictionary` a request reads and
writes through are not designed for concurrent access."""

import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import List, Optional

from ..data.clause import Clause
from ..data.phrase import Phrase
from ..data.reading_error import ReadingError
from ..data.sentence import Sentence
from ..role.linguistic_controller import LinguisticController

# Same hex values as vocabulary/ui/dictionary_view.py's own POS_COLORS
# -- duplicated, not cross-imported, to keep this file self-contained
# (same reasoning as that file's own duplicated definition-tokenizer
# pattern) while still giving a part of speech the same color wherever
# it appears across LIRA's UI surfaces.
POS_COLORS = {
    "NOUN": "#3B6EA5", "PROPER_NOUN": "#274472", "VERB": "#B2542D",
    "ADJECTIVE": "#7A5CA6", "ADVERB": "#B08900", "PRONOUN": "#5B7B6F",
    "DETERMINER": "#6E7B8B", "PREPOSITION": "#7B6E5B", "CONJUNCTION": "#6B7280",
    "PARTICLE": "#8A7B6E", "AUXILIARY": "#5B6E8B", "INTERJECTION": "#C2544B",
    "NUMERAL": "#4B8A7B", "SYMBOL": "#8A8A8A", "PUNCTUATION": "#9A9A9A", "OTHER": "#7A7A7A",
}

VALIDATION_COLORS = {"VALID": "#2B6E63", "UNRESOLVED": "#B08900", "INVALID": "#B2542D"}


def _error_to_json(error: ReadingError) -> dict:
    return {
        "kind": error.kind.name,
        "level": error.level.name,
        "message": error.message,
        "token_index": error.token_index,
        "token_text": error.token_text,
        "unfinished_obligation": error.unfinished_obligation.name if error.unfinished_obligation else None,
    }


def _phrase_to_json(phrase: Optional[Phrase]) -> Optional[dict]:
    if phrase is None:
        return None
    return {
        "phrase_type": phrase.phrase_type.name if phrase.phrase_type else None,
        "text": phrase.text,
        "words": [{"text": w.text, "pos": w.part_of_speech.name} for w in phrase.words],
        "head": phrase.head_word.text if phrase.head_word else None,
        "head_pos": phrase.head_part_of_speech.name if phrase.head_part_of_speech else None,
        "nested_phrases": [_phrase_to_json(p) for p in phrase.nested_phrases],
        "validation": phrase.validation.name,
        "confidence": round(phrase.confidence, 4),
        "errors": [_error_to_json(e) for e in phrase.errors],
        "alternatives": [
            {
                "phrase_type": (alt.phrase_spans[0][0].name if alt.phrase_spans else None),
                "parts_of_speech": [p.name for p in alt.selected_parts_of_speech],
                "validation": alt.validation.name,
                "confidence": round(alt.confidence, 4),
            }
            for alt in phrase.alternatives
        ],
    }


def _clause_to_json(clause: Clause) -> dict:
    return {
        "clause_type": clause.clause_type.name if clause.clause_type else None,
        "text": clause.text,
        "subject": _phrase_to_json(clause.subject),
        "predicate": _phrase_to_json(clause.predicate),
        "object": _phrase_to_json(clause.object),
        "complement": _phrase_to_json(clause.complement),
        "modifiers": [_phrase_to_json(p) for p in clause.modifiers],
        "phrases": [_phrase_to_json(p) for p in clause.phrases],
        "validation": clause.validation.name,
        "confidence": round(clause.confidence, 4),
        "errors": [_error_to_json(e) for e in clause.errors],
    }


def _sentence_to_json(sentence: Sentence) -> dict:
    return {
        "text": sentence.text,
        "sentence_type": sentence.sentence_type.name if sentence.sentence_type else None,
        "validation": sentence.validation.name,
        "confidence": round(sentence.confidence, 4),
        "punctuation": sentence.punctuation.text if sentence.punctuation else None,
        "clauses": [_clause_to_json(c) for c in sentence.clauses],
        "errors": [_error_to_json(e) for e in sentence.errors],
    }


class SentenceReaderServer:
    """Construct with a live `LinguisticController` (typically
    `domain.linguistics` off an already-seeded `Domain`/`LIRAHost` --
    see `examples/linguistics_sentence_reader_ui.py`) and call
    `serve_forever()`."""

    def __init__(self, controller: LinguisticController, *, host: str = "127.0.0.1", port: int = 8765):
        self.controller = controller
        self.host = host
        self.port = port

    def serve_forever(self) -> None:
        controller = self.controller
        page_bytes = _PAGE_HTML.encode("utf-8")

        class Handler(BaseHTTPRequestHandler):
            server_version = "LIRASentenceReader/1.0"

            def log_message(self, format, *args):  # noqa: A002 -- BaseHTTPRequestHandler's own signature
                pass  # keep stdout to this module's own startup line

            def do_GET(self) -> None:
                if self.path == "/favicon.ico":
                    # Every browser requests this unprompted -- answered
                    # quietly so it doesn't show up as a spurious 404 in
                    # the console next to real errors.
                    self.send_response(204)
                    self.end_headers()
                    return
                if self.path != "/":
                    self.send_error(404)
                    return
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(page_bytes)))
                self.end_headers()
                self.wfile.write(page_bytes)

            def do_POST(self) -> None:
                if self.path != "/api/read":
                    self.send_error(404)
                    return
                length = int(self.headers.get("Content-Length", 0))
                raw_body = self.rfile.read(length) if length else b""
                try:
                    payload = json.loads(raw_body or b"{}")
                    text = str(payload.get("sentence", "")).strip()
                except json.JSONDecodeError:
                    self._send_json({"error": "Request body is not valid JSON."}, status=400)
                    return
                if not text:
                    self._send_json({"error": "Sentence is empty."}, status=400)
                    return
                try:
                    trace: List[dict] = []
                    sentence = controller.read_sentence(text, trace=trace)
                    self._send_json({"predicted": _sentence_to_json(sentence), "trace": trace})
                except Exception as exc:  # noqa: BLE001 -- reported to the caller, not swallowed
                    self._send_json({"error": f"{type(exc).__name__}: {exc}"}, status=500)

            def _send_json(self, payload: dict, status: int = 200) -> None:
                data = json.dumps(payload).encode("utf-8")
                self.send_response(status)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)

        server = HTTPServer((self.host, self.port), Handler)
        print(f"LIRA Sentence Reader running at http://{self.host}:{self.port}/  (Ctrl+C to stop)")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            server.server_close()


_PAGE_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LIRA Sentence Reader</title>
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
    --ground: #12211D; --surface: #182A24; --ink: #E7EEEA; --ink-muted: #90A69D;
    --accent: #4FBBA6; --accent-ink: #0B1613; --line: #2A3B34; --line-strong: #3B4F47;
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.25);
  }
}
* { box-sizing: border-box; }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
html, body { margin: 0; background: var(--ground); color: var(--ink); font-family: var(--font-body); }
body { padding: 32px clamp(16px, 4vw, 48px) 64px; }
.page { max-width: 1100px; margin: 0 auto; }
header.masthead {
  display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between;
  gap: 8px 24px; padding-bottom: 20px; border-bottom: 1px solid var(--line-strong); margin-bottom: 24px;
}
h1 { font-family: var(--font-display); font-weight: 600; font-size: 1.7rem; margin: 0; text-wrap: balance; }
.subtitle { color: var(--ink-muted); font-size: 0.9rem; max-width: 60ch; }
.input-card {
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius);
  box-shadow: var(--shadow); padding: 18px 20px; margin-bottom: 28px;
}
textarea {
  width: 100%; min-height: 64px; resize: vertical; font-family: var(--font-body); font-size: 1.05rem;
  color: var(--ink); background: var(--ground); border: 1px solid var(--line); border-radius: var(--radius);
  padding: 12px 14px; line-height: 1.4;
}
textarea:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
.input-row { display: flex; align-items: center; gap: 12px; margin-top: 12px; }
button.read-btn {
  background: var(--accent); color: var(--accent-ink); border: none; border-radius: var(--radius);
  padding: 10px 20px; font-size: 0.95rem; font-weight: 600; cursor: pointer; font-family: var(--font-body);
}
button.read-btn:disabled { opacity: 0.55; cursor: default; }
button.read-btn:not(:disabled):hover { filter: brightness(1.08); }
.hint { color: var(--ink-muted); font-size: 0.82rem; }
.example-links { display: flex; flex-wrap: wrap; gap: 6px 10px; margin-top: 10px; }
.example-links button {
  background: none; border: 1px solid var(--line); border-radius: 999px; padding: 3px 11px;
  font-size: 0.78rem; color: var(--ink-muted); cursor: pointer; font-family: var(--font-body);
}
.example-links button:hover { border-color: var(--accent); color: var(--accent); }
.error-banner {
  background: color-mix(in srgb, var(--validation-invalid, #B2542D) 12%, var(--surface));
  border: 1px solid #B2542D; color: #B2542D; border-radius: var(--radius); padding: 10px 14px;
  margin-bottom: 20px; font-size: 0.9rem; display: none;
}
.panels { display: grid; grid-template-columns: 1fr; gap: 24px; }
@media (min-width: 900px) { .panels { grid-template-columns: 1fr 1fr; } }
.panel {
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius);
  box-shadow: var(--shadow); padding: 18px 20px; min-height: 120px;
}
.panel h2 {
  font-family: var(--font-display); font-size: 1.05rem; margin: 0 0 4px; font-weight: 600;
}
.panel .panel-sub { color: var(--ink-muted); font-size: 0.8rem; margin-bottom: 14px; }
.placeholder { color: var(--ink-muted); font-size: 0.88rem; font-style: italic; }
.badge {
  display: inline-flex; align-items: center; gap: 4px; padding: 1px 9px; border-radius: 999px;
  font-size: 0.72rem; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase;
  color: #fff;
}
.pos-chip {
  display: inline-flex; flex-direction: column; align-items: center; padding: 4px 9px 5px;
  border-radius: 5px; color: #fff; font-family: var(--font-mono); margin: 2px 3px 2px 0;
}
.pos-chip .w { font-size: 0.92rem; font-weight: 600; }
.pos-chip .p { font-size: 0.6rem; opacity: 0.88; letter-spacing: 0.03em; }
.role-row { margin-bottom: 12px; }
.role-label {
  font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-muted);
  font-weight: 700; margin-bottom: 4px;
}
.role-empty { color: var(--ink-muted); font-size: 0.82rem; font-style: italic; }
.clause-block { border: 1px solid var(--line); border-radius: var(--radius); padding: 14px 16px; margin-bottom: 14px; }
.clause-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
.errors-list { margin-top: 10px; font-size: 0.82rem; }
.errors-list .err { padding: 6px 10px; border-left: 3px solid #B2542D; background: color-mix(in srgb, #B2542D 8%, transparent); margin-bottom: 6px; border-radius: 3px; }
.errors-list .err .kind { font-weight: 700; }
.position-block { border: 1px solid var(--line); border-radius: var(--radius); margin-bottom: 12px; overflow: hidden; }
.position-head { padding: 8px 12px; background: color-mix(in srgb, var(--accent) 7%, var(--surface)); display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.position-head .idx { font-family: var(--font-mono); font-size: 0.72rem; color: var(--ink-muted); }
.attempt-row { padding: 8px 12px; border-top: 1px solid var(--line); font-size: 0.82rem; }
.attempt-row.matched { }
.attempt-row.rejected { opacity: 0.62; }
.attempt-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.attempt-type { font-weight: 700; font-family: var(--font-mono); font-size: 0.78rem; }
.match-mark { font-size: 0.72rem; padding: 1px 7px; border-radius: 999px; font-weight: 700; }
.match-yes { background: color-mix(in srgb, var(--accent) 18%, transparent); color: var(--accent); }
.match-no { background: color-mix(in srgb, var(--ink-muted) 15%, transparent); color: var(--ink-muted); }
.required-start { font-family: var(--font-mono); font-size: 0.7rem; color: var(--ink-muted); }
.completion { margin-top: 6px; padding: 6px 10px; border-radius: 4px; background: var(--ground); border: 1px solid var(--line); font-size: 0.8rem; }
.completion.winner { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, var(--ground)); }
.completion .win-mark { color: var(--accent); font-weight: 700; margin-right: 6px; }
.rejection-reason { color: var(--ink-muted); font-size: 0.78rem; margin-top: 4px; }
footer { margin-top: 40px; color: var(--ink-muted); font-size: 0.78rem; text-align: center; }
</style>
</head>
<body>
<div class="page">
  <header class="masthead">
    <div>
      <h1>LIRA Sentence Reader</h1>
      <div class="subtitle">Paste a sentence and read it through the Linguistics Layer's state machine (Phrase.read()/Clause.read()/Sentence.read()) against the live seeded Dictionary.</div>
    </div>
  </header>

  <div class="input-card">
    <textarea id="sentence-input" placeholder="e.g. A meaning is a representation.">A meaning is a representation.</textarea>
    <div class="input-row">
      <button class="read-btn" id="read-btn">Read sentence</button>
      <span class="hint">or press &#8984;/Ctrl + Enter</span>
    </div>
    <div class="example-links" id="examples"></div>
  </div>

  <div class="error-banner" id="error-banner"></div>

  <div class="panels">
    <section class="panel" id="predicted-panel">
      <h2>Predicted structure</h2>
      <div class="panel-sub">The one interpretation the state machine ranked highest and materialised.</div>
      <div id="predicted-content"><div class="placeholder">Read a sentence to see its predicted structure.</div></div>
    </section>
    <section class="panel" id="trace-panel">
      <h2>Full trace</h2>
      <div class="panel-sub">Every phrase type attempted at every token position -- matched, completed, rejected, and why.</div>
      <div id="trace-content"><div class="placeholder">Read a sentence to see the full search trace.</div></div>
    </section>
  </div>

  <footer>LIRA Linguistics Layer read path -- linguistics/documentation/README.md</footer>
</div>

<script>
const POS_COLORS = @@POS_COLORS_JSON@@;
const VALIDATION_COLORS = @@VALIDATION_COLORS_JSON@@;
const EXAMPLES = [
  "A meaning is a representation.",
  "The word over the meaning.",
  "The use is a state.",
  "The word wants to use the meaning.",
  "The meaning and the word perceive the state.",
];

function el(tag, attrs, children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else node.setAttribute(key, value);
  }
  for (const child of (children || [])) {
    if (child) node.appendChild(child);
  }
  return node;
}

function badge(label, color) {
  return el("span", { class: "badge", style: `background:${color}` }, [document.createTextNode(label)]);
}

function posChip(text, pos) {
  const color = POS_COLORS[pos] || "#7A7A7A";
  return el("span", { class: "pos-chip", style: `background:${color}` }, [
    el("span", { class: "w", text }),
    el("span", { class: "p", text: pos }),
  ]);
}

function phraseNode(phrase) {
  if (!phrase) return el("div", { class: "role-empty", text: "(none)" });
  const wrap = el("div", {});
  const head = el("div", { class: "clause-head" }, [
    el("span", { text: phrase.phrase_type || "UNRESOLVED" , style: "font-weight:700;font-size:0.82rem" }),
    badge(phrase.validation, VALIDATION_COLORS[phrase.validation] || "#7A7A7A"),
    el("span", { text: `conf ${phrase.confidence.toFixed(2)}`, style: "font-size:0.72rem;color:var(--ink-muted)" }),
  ]);
  wrap.appendChild(head);
  const words = el("div", {});
  for (const w of phrase.words) words.appendChild(posChip(w.text, w.pos));
  wrap.appendChild(words);
  if (phrase.nested_phrases && phrase.nested_phrases.length) {
    const nestedWrap = el("div", { style: "margin-top:6px;padding-left:14px;border-left:2px solid var(--line);" });
    for (const nested of phrase.nested_phrases) nestedWrap.appendChild(phraseNode(nested));
    wrap.appendChild(nestedWrap);
  }
  if (phrase.errors && phrase.errors.length) wrap.appendChild(errorsList(phrase.errors));
  return wrap;
}

function roleRow(label, phrase) {
  return el("div", { class: "role-row" }, [
    el("div", { class: "role-label", text: label }),
    phraseNode(phrase),
  ]);
}

function errorsList(errors) {
  const wrap = el("div", { class: "errors-list" });
  for (const e of errors) {
    wrap.appendChild(el("div", { class: "err" }, [
      el("span", { class: "kind", text: e.kind + ": " }),
      document.createTextNode(e.message + (e.token_text ? ` ("${e.token_text}")` : "")),
    ]));
  }
  return wrap;
}

function renderPredicted(sentence) {
  const container = el("div", {});
  const top = el("div", { class: "clause-head" }, [
    badge(sentence.validation, VALIDATION_COLORS[sentence.validation] || "#7A7A7A"),
    el("span", { text: sentence.sentence_type || "UNRESOLVED", style: "font-weight:700" }),
    el("span", { text: `confidence ${sentence.confidence.toFixed(2)}`, style: "font-size:0.78rem;color:var(--ink-muted)" }),
    el("span", { text: sentence.punctuation ? `terminal "${sentence.punctuation}"` : "no terminal punctuation", style: "font-size:0.78rem;color:var(--ink-muted)" }),
  ]);
  container.appendChild(top);

  if (!sentence.clauses.length) {
    container.appendChild(el("div", { class: "role-empty", text: "No clause was read." }));
  }
  for (const clause of sentence.clauses) {
    const block = el("div", { class: "clause-block" });
    block.appendChild(el("div", { class: "clause-head" }, [
      el("span", { text: clause.clause_type || "UNRESOLVED", style: "font-weight:700;font-size:0.85rem" }),
      badge(clause.validation, VALIDATION_COLORS[clause.validation] || "#7A7A7A"),
    ]));
    block.appendChild(roleRow("Subject", clause.subject));
    block.appendChild(roleRow("Predicate", clause.predicate));
    block.appendChild(roleRow("Object", clause.object));
    block.appendChild(roleRow("Complement", clause.complement));
    if (clause.modifiers.length) {
      const modWrap = el("div", { class: "role-row" }, [el("div", { class: "role-label", text: "Modifiers" })]);
      for (const m of clause.modifiers) modWrap.appendChild(phraseNode(m));
      block.appendChild(modWrap);
    }
    if (clause.errors.length) block.appendChild(errorsList(clause.errors));
    container.appendChild(block);
  }
  if (sentence.errors.length) container.appendChild(errorsList(sentence.errors));
  return container;
}

function renderTrace(trace) {
  const container = el("div", {});
  for (const position of trace) {
    const block = el("div", { class: "position-block" });
    const posTags = (position.candidate_parts_of_speech || []).join(", ") || (position.is_known === false ? "unseeded" : "");
    block.appendChild(el("div", { class: "position-head" }, [
      el("span", { class: "idx", text: `#${position.start_index}` }),
      el("span", { text: position.token_text || "", style: "font-weight:700;font-family:var(--font-mono)" }),
      el("span", { text: posTags, style: "font-size:0.72rem;color:var(--ink-muted)" }),
      el("span", { text: `→ won by ${position.winner_phrase_type || "none"}`, style: "font-size:0.72rem;color:var(--accent);margin-left:auto" }),
    ]));
    for (const attempt of position.attempts) {
      const matched = attempt.start_match;
      const row = el("div", { class: `attempt-row ${matched ? "matched" : "rejected"}` });
      row.appendChild(el("div", { class: "attempt-head" }, [
        el("span", { class: "attempt-type", text: attempt.phrase_type }),
        el("span", { class: `match-mark ${matched ? "match-yes" : "match-no"}`, text: matched ? "start matched" : "no start match" }),
        el("span", { class: "required-start", text: "requires: " + attempt.required_start.join(", ") }),
      ]));
      if (attempt.completions.length) {
        for (const completion of attempt.completions) {
          const c = el("div", { class: `completion ${completion.is_winner ? "winner" : ""}` }, [
            completion.is_winner ? el("span", { class: "win-mark", text: "✓ winner" }) : null,
            document.createTextNode(`"${completion.text}" — ${completion.validation}, confidence ${completion.confidence.toFixed(2)}`),
          ]);
          row.appendChild(c);
        }
      } else if (attempt.rejection_reason) {
        row.appendChild(el("div", { class: "rejection-reason", text: attempt.rejection_reason }));
      }
      block.appendChild(row);
    }
    container.appendChild(block);
  }
  return container;
}

async function readSentence() {
  const input = document.getElementById("sentence-input");
  const btn = document.getElementById("read-btn");
  const banner = document.getElementById("error-banner");
  const text = input.value.trim();
  banner.style.display = "none";
  if (!text) return;
  btn.disabled = true;
  btn.textContent = "Reading…";
  try {
    const response = await fetch("/api/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sentence: text }),
    });
    const data = await response.json();
    if (!response.ok) {
      banner.textContent = data.error || `Request failed (${response.status})`;
      banner.style.display = "block";
      return;
    }
    document.getElementById("predicted-content").replaceChildren(renderPredicted(data.predicted));
    document.getElementById("trace-content").replaceChildren(renderTrace(data.trace));
  } catch (err) {
    banner.textContent = "Could not reach the server: " + err;
    banner.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "Read sentence";
  }
}

document.getElementById("read-btn").addEventListener("click", readSentence);
document.getElementById("sentence-input").addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") readSentence();
});

const examplesRow = document.getElementById("examples");
for (const example of EXAMPLES) {
  const btn = el("button", { text: example, type: "button" });
  btn.addEventListener("click", () => { document.getElementById("sentence-input").value = example; readSentence(); });
  examplesRow.appendChild(btn);
}

readSentence();
</script>
</body>
</html>
"""

_PAGE_HTML = _PAGE_HTML.replace("@@POS_COLORS_JSON@@", json.dumps(POS_COLORS))
_PAGE_HTML = _PAGE_HTML.replace("@@VALIDATION_COLORS_JSON@@", json.dumps(VALIDATION_COLORS))
