"""Manages thread-safe asynchronous dictionary lookups against an
external API while avoiding redundant in-flight network calls. Creates
one authoritative Word per externally-supported grammatical category
(ExternalDictionaryAdapter), not a single guessed-POS placeholder --
see dictionary_processor.py for why no Word exists for an unresolved
occurrence until hydration actually supplies one. Hydrated Words are
appended straight to this Domain's own Dictionary: they become that
Domain's authoritative record immediately, the same standing as any
other Word in it (vocabulary/assets/common/en/README.md: the Common
Cache is a generated bootstrap resource, never the authoritative
source of a Word). They are not written to promoted_words.json --
promotion is a separate, deliberate step (WordSeeder.promote_word)
gated on cross-domain reference count, not something hydration decides
on its own."""

import json
import queue
import threading
import urllib.parse
import urllib.request
from typing import Set, Tuple

from lira.value_objects import Text

from ..data.dictionary import Dictionary
from ..data.word import Word
from ..data.word_lookup_context import WordLookupContext
from .external_dictionary_adapter import ExternalDictionaryAdapter


class AsyncDictionaryHydrator:
    """Manages thread-safe asynchronous operations while avoiding redundant in-flight network metrics."""

    def __init__(self, dictionary: Dictionary):
        self.dictionary = dictionary
        self.work_queue: "queue.Queue[WordLookupContext]" = queue.Queue()
        self.in_flight_lookups: Set[Tuple[str, str]] = set()
        self._state_lock = threading.Lock()

        self.telemetry = {
            "successful_fetches": 0,
            "failed_fetches": 0,
            "deduplicated_calls": 0,
            "created_words": 0,
        }

        self.worker_thread = threading.Thread(target=self._worker_loop, daemon=True)
        self.worker_thread.start()

    @staticmethod
    def _lookup_key(context: WordLookupContext) -> Tuple[str, str]:
        return (context.normalised_text, context.domain_name.casefold())

    def queue_hydration(self, context: WordLookupContext) -> bool:
        """Enqueues an unresolved occurrence for external lookup,
        deduplicated by (normalised text, domain) -- a second occurrence
        of the same lexical form in the same Domain while the first
        lookup is still in flight is discarded, not re-queued."""
        lookup_key = self._lookup_key(context)
        with self._state_lock:
            if lookup_key in self.in_flight_lookups:
                self.telemetry["deduplicated_calls"] += 1
                return False
            self.in_flight_lookups.add(lookup_key)

        self.work_queue.put(context)
        return True

    def _worker_loop(self) -> None:
        while True:
            context = self.work_queue.get()
            lookup_key = self._lookup_key(context)
            try:
                self._hydrate(context)
                with self._state_lock:
                    self.telemetry["successful_fetches"] += 1
            except Exception:
                with self._state_lock:
                    self.telemetry["failed_fetches"] += 1
            finally:
                with self._state_lock:
                    self.in_flight_lookups.discard(lookup_key)
                self.work_queue.task_done()

    def _hydrate(self, context: WordLookupContext) -> None:
        encoded_word = urllib.parse.quote(context.normalised_text)
        source_uri = f"https://api.dictionaryapi.dev/api/v2/entries/en/{encoded_word}"

        request = urllib.request.Request(source_uri, headers={"User-Agent": "LIRA Vocabulary/1.0"})
        with urllib.request.urlopen(request, timeout=4) as response:
            payload = json.loads(response.read().decode())

        candidates = ExternalDictionaryAdapter.parse_api_payload(payload=payload, context=context, source_uri=source_uri)

        created_count = 0
        for candidate in candidates:
            already_exists = any(
                existing.part_of_speech == candidate.part_of_speech
                for existing in self.dictionary.lookup_all(candidate.normalised_form)
            )
            if already_exists:
                continue

            # No conflict-registration path needed here: that's only
            # for a same-lexical_form/same-part_of_speech meaning
            # conflict (DictionaryProcessor.register_conflicting_sense).
            # Two candidates in this batch never share a part_of_speech
            # (ExternalDictionaryAdapter._deduplicate keeps one per
            # category), and `already_exists` just ruled out a
            # same-(text, part_of_speech) collision against the
            # Dictionary -- so this Word never needs a second, coexisting
            # sense under the same (text, part_of_speech) pair.
            word = Word(
                text=candidate.text,
                lexical_form=Text(value=candidate.lexical_form),
                normalised_form=Text(value=candidate.normalised_form),
                language_code=candidate.language_code,
                part_of_speech=candidate.part_of_speech,
                definition=candidate.definition,
                gloss=candidate.gloss,
                usage_notes=candidate.usage_notes,
                source_references=candidate.source_references,
                is_common=False,
                is_fully_hydrated=True,
            )

            self.dictionary.append(word)
            created_count += 1

        with self._state_lock:
            self.telemetry["created_words"] += created_count
