"""Loads the Common Vocabulary Cache (vocabulary/assets/common/<language>/)
and seeds Dictionaries with it. The cache is not the authoritative
source of a Word -- see vocabulary/assets/common/en/README.md. Method
names are snake_case, translating the PascalCase public API this class
was specified with (SeedClosedClassWords, SeedDomain, PromoteWord,
DemoteWord, ValidateAssets, LoadCache) to match this codebase's
convention everywhere else."""

import copy
import json
from pathlib import Path
from typing import Dict, List, Optional

from lira.value_objects import Code, Text

from ..data.dictionary import Dictionary
from ..data.part_of_speech import PartOfSpeech
from ..data.word import Word

MANDATORY_FILES = (
    "determiners.json",
    "pronouns.json",
    "auxiliaries.json",
    "prepositions.json",
    "coordinating_conjunctions.json",
    "subordinating_conjunctions.json",
    "particles.json",
)
MANDATORY_TOTAL = 300
PROMOTED_FILE = "promoted_words.json"
MANIFEST_FILE = "manifest.json"
OPEN_CLASSES = (PartOfSpeech.NOUN, PartOfSpeech.VERB, PartOfSpeech.ADJECTIVE, PartOfSpeech.ADVERB)

DEFAULT_ASSETS_ROOT = Path(__file__).resolve().parent.parent / "assets" / "common"


class WordSeeder:
    def __init__(self, language_code: str = "en", promotion_threshold: int = 3,
                 demotion_threshold: int = 1, assets_root: Optional[Path] = None):
        self.language_code = language_code
        self.promotion_threshold = promotion_threshold
        self.demotion_threshold = demotion_threshold
        self.assets_dir = (assets_root or DEFAULT_ASSETS_ROOT) / language_code
        self._cache: Optional[List[Word]] = None

    def validate_assets(self) -> None:
        """Validates JSON schema, duplicate lexical forms, lexical
        counts, mandatory file existence, manifest consistency,
        promoted word uniqueness, language codes, and normalised forms.
        Creates promoted_words.json (starts empty) or manifest.json
        (recomputed from the word files) if either is missing -- the
        only two files this can create, since the mandatory closed-class
        content itself has to be authored, not synthesised."""
        if not self.assets_dir.is_dir():
            raise FileNotFoundError(f"no Common Vocabulary Cache for language '{self.language_code}' at {self.assets_dir}")

        seen_lexical_forms = set()
        file_counts: Dict[str, int] = {}
        computed_total = 0

        for filename in MANDATORY_FILES:
            path = self.assets_dir / filename
            if not path.is_file():
                raise FileNotFoundError(f"mandatory Common Vocabulary Cache file missing: {filename}")
            doc = json.loads(path.read_text())
            for required_key in ("schema_version", "language_code", "part_of_speech", "closed_class_kind", "count", "words"):
                if required_key not in doc:
                    raise ValueError(f"{filename}: missing required key '{required_key}'")
            if doc["count"] != len(doc["words"]):
                raise ValueError(f"{filename}: count {doc['count']} does not match {len(doc['words'])} word entries")
            for entry in doc["words"]:
                lexical_form = entry["lexical_form"]
                if entry["language_code"] != self.language_code:
                    raise ValueError(f"{filename}: '{lexical_form}' has language_code '{entry['language_code']}', expected '{self.language_code}'")
                if entry.get("normalised_form") != lexical_form.lower():
                    raise ValueError(f"{filename}: '{lexical_form}' has an inconsistent normalised_form")
                if lexical_form in seen_lexical_forms:
                    raise ValueError(f"{filename}: duplicate lexical_form '{lexical_form}' in the mandatory cache")
                seen_lexical_forms.add(lexical_form)
            file_counts[filename] = doc["count"]
            computed_total += doc["count"]

        if computed_total != MANDATORY_TOTAL:
            raise ValueError(f"mandatory {self.language_code} cache does not contain exactly {MANDATORY_TOTAL} lexical forms (found {computed_total})")

        promoted_path = self.assets_dir / PROMOTED_FILE
        if not promoted_path.is_file():
            self._write_promoted_words([])
        promoted_doc = json.loads(promoted_path.read_text())
        promoted_lexical_forms = set()
        for entry in promoted_doc.get("words", []):
            lexical_form = entry["lexical_form"]
            if lexical_form in seen_lexical_forms:
                raise ValueError(f"promoted word '{lexical_form}' duplicates a mandatory closed-class word")
            if lexical_form in promoted_lexical_forms:
                raise ValueError(f"duplicate promoted word '{lexical_form}'")
            promoted_lexical_forms.add(lexical_form)
        file_counts[PROMOTED_FILE] = promoted_doc.get("count", 0)

        manifest_path = self.assets_dir / MANIFEST_FILE
        if not manifest_path.is_file():
            self._write_manifest(file_counts, computed_total)
        else:
            manifest = json.loads(manifest_path.read_text())
            if manifest.get("total_lexical_forms") != computed_total:
                raise ValueError(
                    f"manifest.json total_lexical_forms ({manifest.get('total_lexical_forms')}) "
                    f"does not match the computed total ({computed_total})"
                )

    def load_cache(self) -> List[Word]:
        """Validates the assets, then parses every mandatory closed-class
        file plus promoted_words.json into Word instances (is_common=True
        on all of them). Cached after the first call."""
        if self._cache is not None:
            return list(self._cache)

        self.validate_assets()
        words = []
        for filename in (*MANDATORY_FILES, PROMOTED_FILE):
            doc = json.loads((self.assets_dir / filename).read_text())
            for entry in doc["words"]:
                words.append(self._entry_to_word(entry))
        self._cache = words
        return list(words)

    def seed_closed_class_words(self, dictionary: Dictionary) -> int:
        """Appends a fresh copy of every cached Word into `dictionary`
        that isn't already present (matched by text). Returns the
        number actually appended -- idempotent, safe to call more than
        once against the same Dictionary."""
        seeded = 0
        for word in self.load_cache():
            if dictionary.lookup(word.text) is not None:
                continue
            dictionary.append(copy.copy(word))
            seeded += 1
        return seeded

    def seed_domain(self, domain) -> int:
        """Seeds `domain.vocabulary.dictionary` with the full cache
        (mandatory closed-class words plus any promoted open-class
        words) -- local references only; the owning Domain of a
        promoted word never changes (Qualified Word Identity)."""
        return self.seed_closed_class_words(domain.vocabulary.dictionary)

    def promote_word(self, word: Word, reference_count: int) -> bool:
        """Adds `word` to promoted_words.json if it belongs to an open
        lexical class and its cross-domain reference count exceeds
        promotion_threshold. Returns whether it was added.
        reference_count is supplied by the caller -- this class has no
        visibility into how many Domains reference a Word; that
        tracking doesn't exist yet elsewhere in this codebase."""
        if word.part_of_speech not in OPEN_CLASSES:
            return False
        if reference_count <= self.promotion_threshold:
            return False

        promoted_path = self.assets_dir / PROMOTED_FILE
        doc = json.loads(promoted_path.read_text()) if promoted_path.is_file() else self._empty_promoted_doc()
        if any(entry["lexical_form"] == word.lexical_form.value for entry in doc["words"]):
            return False

        doc["words"].append({
            "lexical_form": word.lexical_form.value,
            "normalised_form": word.normalised_form.value,
            "language_code": word.language_code.value,
            "part_of_speech": word.part_of_speech.name,
            "closed_class": False,
            "reference_count": reference_count,
        })
        doc["count"] = len(doc["words"])
        promoted_path.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
        self._cache = None
        return True

    def demote_word(self, word: Word, reference_count: int) -> bool:
        """Removes `word` from promoted_words.json if reference_count
        has fallen below demotion_threshold. Never deletes the
        authoritative Word or touches its owning Domain (Demotion
        Rules) -- only this generated cache entry."""
        if reference_count >= self.demotion_threshold:
            return False

        promoted_path = self.assets_dir / PROMOTED_FILE
        if not promoted_path.is_file():
            return False
        doc = json.loads(promoted_path.read_text())
        before = len(doc["words"])
        doc["words"] = [entry for entry in doc["words"] if entry["lexical_form"] != word.lexical_form.value]
        if len(doc["words"]) == before:
            return False

        doc["count"] = len(doc["words"])
        promoted_path.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
        self._cache = None
        return True

    @staticmethod
    def _entry_to_word(entry: dict) -> Word:
        return Word(
            text=entry["lexical_form"],
            part_of_speech=PartOfSpeech[entry["part_of_speech"]],
            language_code=Code(value=entry["language_code"]),
            lexical_form=Text(value=entry["lexical_form"]),
            normalised_form=Text(value=entry["normalised_form"]),
            is_common=True,
        )

    def _empty_promoted_doc(self) -> dict:
        return {
            "schema_version": "1.0.0",
            "language_code": self.language_code,
            "part_of_speech": None,
            "closed_class_kind": "promoted_open_class",
            "count": 0,
            "words": [],
        }

    def _write_promoted_words(self, entries: list) -> None:
        doc = self._empty_promoted_doc()
        doc["words"] = entries
        doc["count"] = len(entries)
        (self.assets_dir / PROMOTED_FILE).write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")

    def _write_manifest(self, file_counts: Dict[str, int], total: int) -> None:
        manifest = {
            "schema_version": "1.0.0",
            "asset_version": "1.0.0",
            "language_code": self.language_code,
            "total_lexical_forms": total,
            "files": [{"file": fname, "count": count} for fname, count in file_counts.items()],
        }
        (self.assets_dir / MANIFEST_FILE).write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
