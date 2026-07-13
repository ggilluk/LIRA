"""Manages thread-safe asynchronous dictionary lookups against an
external API while avoiding redundant in-flight network calls."""

import json
import queue
import threading
import urllib.error
import urllib.request
from typing import Set

from ..data_classes.dictionary import Dictionary
from .external_dictionary_adapter import ExternalDictionaryAdapter
from ..data_classes.units import Word


class AsyncDictionaryHydrator:
    """Manages thread-safe asynchronous operations while avoiding redundant in-flight network metrics."""

    def __init__(self, dictionary: Dictionary):
        self.dictionary = dictionary
        self.work_queue = queue.Queue()
        self.in_flight_lookups: Set[str] = set()
        self._state_lock = threading.Lock()

        self.telemetry = {"successful_fetches": 0, "failed_fetches": 0, "deduplicated_calls": 0}

        self.worker_thread = threading.Thread(target=self._worker_loop, daemon=True)
        self.worker_thread.start()

    def queue_hydration(self, word_text: str) -> bool:
        """Enqueues unhydrated words safely while immediately discarding redundant tasks."""
        lookup_key = word_text.lower().strip()
        with self._state_lock:
            if lookup_key in self.in_flight_lookups:
                self.telemetry["deduplicated_calls"] += 1
                return False  # Deduplicated successfully
            self.in_flight_lookups.add(lookup_key)

        self.work_queue.put(lookup_key)
        return True

    def _worker_loop(self):
        while True:
            word_text = self.work_queue.get()
            url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word_text}"
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=4) as response:
                    raw_data = json.loads(response.read().decode())
                    meaning, pos_type = ExternalDictionaryAdapter.parse_api_payload(raw_data)

                    entry = self.dictionary.lookup(word_text)
                    if entry:
                        entry.meaning = meaning
                        entry.parts_of_speech = [pos_type]
                        if isinstance(entry.unit, Word):
                            entry.unit.part_of_speech = pos_type
                            entry.unit.definition = meaning
                        entry.is_fully_hydrated = True

                with self._state_lock:
                    self.telemetry["successful_fetches"] += 1
            except Exception:
                with self._state_lock:
                    self.telemetry["failed_fetches"] += 1
            finally:
                with self._state_lock:
                    if word_text in self.in_flight_lookups:
                        self.in_flight_lookups.remove(word_text)
                self.work_queue.task_done()
