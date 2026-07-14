"""Loads the Common Vocabulary Cache (vocabulary/assets/common/<language>/)
and seeds Dictionaries with it. The cache is not the authoritative
source of a Word -- see vocabulary/assets/common/en/README.md. Method
names are snake_case, translating the PascalCase public API this class
was specified with (SeedClosedClassWords, SeedDomain, PromoteWord,
DemoteWord, ValidateAssets, LoadCache) to match this codebase's
convention everywhere else.

Each cache entry populates as much of Word's field set as the cache
can respect responsibly (4.2): lexical_form, normalised_form, text,
version, language_code, script_code, part_of_speech, definition,
gloss, usage_notes, register_codes, editorial_labels, dialect_codes,
and source_references are always present. pronunciations,
syllable_representation, stress_pattern, frequency_value,
frequency_scale, etymology_text, and first_recorded_use are left null
in every mandatory entry -- this cache has no verified phonetic,
frequency, or historical source for them, and fabricating IPA
transcriptions or corpus frequencies would be presenting invented data
as fact. syllable_count is the one exception: a cheap, low-risk
heuristic (vowel-group counting) computed for single-token entries
only; multi-word entries ('each other', 'according to', ...) are left
null rather than guessed at."""

import copy
import json
import uuid as uuid_module
from decimal import Decimal
from pathlib import Path
from typing import Dict, List, Optional

from lira.value_objects import Code, Identifier, Number, Text

from ..data.dictionary import Dictionary
from ..data.editorial_label import EditorialLabel
from ..data.part_of_speech import PartOfSpeech
from ..data.register_code import RegisterCode
from ..data.source_reference import SourceReference
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
SCHEMA_VERSION = "2.0.0"
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
        promoted word uniqueness, language codes, normalised forms, and
        that every register_codes/editorial_labels/part_of_speech value
        names a real enum member. Creates promoted_words.json (starts
        empty) or manifest.json (recomputed from the word files) if
        either is missing -- the only two files this can create, since
        the mandatory closed-class content itself has to be authored,
        not synthesised."""
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
                self._validate_entry_enums(filename, entry)
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
            self._validate_entry_enums(PROMOTED_FILE, entry)
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

    @staticmethod
    def _validate_entry_enums(filename: str, entry: dict) -> None:
        lexical_form = entry.get("lexical_form")
        pos = entry.get("part_of_speech")
        if pos is not None and pos not in PartOfSpeech.__members__:
            raise ValueError(f"{filename}: '{lexical_form}' has unknown part_of_speech '{pos}'")
        for code in entry.get("register_codes", []) or []:
            if code not in RegisterCode.__members__:
                raise ValueError(f"{filename}: '{lexical_form}' has unknown register_code '{code}'")
        for label in entry.get("editorial_labels", []) or []:
            if label not in EditorialLabel.__members__:
                raise ValueError(f"{filename}: '{lexical_form}' has unknown editorial_label '{label}'")
        syllable_count = entry.get("syllable_count")
        if syllable_count is not None and (not isinstance(syllable_count, int) or syllable_count < 1):
            raise ValueError(f"{filename}: '{lexical_form}' has an invalid syllable_count {syllable_count!r}")

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
        once against the same Dictionary. Each copy gets a freshly
        generated uuid: load_cache() is memoized, so calling this
        against more than one Dictionary from the same WordSeeder
        instance must not let two Dictionaries' Words share an
        Identifier object (Qualified Word Identity -- see
        Dictionary.seed_from, which has the same discipline)."""
        seeded = 0
        for word in self.load_cache():
            if dictionary.lookup(word.text) is not None:
                continue
            new_word = copy.copy(word)
            new_word.uuid = Identifier(value=str(uuid_module.uuid4()))
            dictionary.append(new_word)
            seeded += 1
        return seeded

    def seed_domain(self, domain) -> int:
        """Seeds `domain.vocabulary.dictionary` with the full cache
        (mandatory closed-class words plus any promoted open-class
        words) -- local references only; the owning Domain of a
        promoted word never changes (Qualified Word Identity)."""
        return self.seed_closed_class_words(domain.vocabulary.dictionary)

    def promote_word(self, word: Word, reference_count: int) -> bool:
        """Adds `word` to promoted_words.json, with its full field set
        (see module docstring), if it belongs to an open lexical class
        and its cross-domain reference count exceeds
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

        entry = self._word_to_entry(word)
        entry["closed_class"] = False
        entry["reference_count"] = reference_count
        doc["words"].append(entry)
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
        def opt_text(value) -> Optional[Text]:
            return Text(value=value) if value else None

        def opt_code(value) -> Optional[Code]:
            return Code(value=value) if value else None

        def opt_number(value) -> Optional[Number]:
            return Number(value=Decimal(str(value))) if value is not None else None

        source_references = tuple(
            SourceReference(
                source_name=Text(value=ref["source_name"]),
                source_version=opt_text(ref.get("source_version")),
                external_identifier=Identifier(value=ref["external_identifier"]) if ref.get("external_identifier") else None,
                reference_uri=Identifier(value=ref["reference_uri"]) if ref.get("reference_uri") else None,
                licence_identifier=Identifier(value=ref["licence_identifier"]) if ref.get("licence_identifier") else None,
            )
            for ref in entry.get("source_references", []) or []
        )

        return Word(
            text=entry.get("text", entry["lexical_form"]),
            part_of_speech=PartOfSpeech[entry["part_of_speech"]],
            version=opt_text(entry.get("version")) or Text(value="1.0"),
            language_code=Code(value=entry["language_code"]),
            lexical_form=Text(value=entry["lexical_form"]),
            normalised_form=Text(value=entry["normalised_form"]),
            script_code=opt_code(entry.get("script_code")),
            gloss=opt_text(entry.get("gloss")),
            definition=opt_text(entry.get("definition")),
            usage_notes=tuple(Text(value=note) for note in entry.get("usage_notes", []) or []),
            register_codes=tuple(RegisterCode[code] for code in entry.get("register_codes", []) or []),
            dialect_codes=tuple(Code(value=code) for code in entry.get("dialect_codes", []) or []),
            editorial_labels=tuple(EditorialLabel[label] for label in entry.get("editorial_labels", []) or []),
            syllable_representation=opt_text(entry.get("syllable_representation")),
            syllable_count=opt_number(entry.get("syllable_count")),
            stress_pattern=opt_text(entry.get("stress_pattern")),
            frequency_value=opt_number(entry.get("frequency_value")),
            frequency_scale=opt_code(entry.get("frequency_scale")),
            etymology_text=opt_text(entry.get("etymology_text")),
            first_recorded_use=opt_text(entry.get("first_recorded_use")),
            source_references=source_references,
            is_common=True,
        )

    @staticmethod
    def _word_to_entry(word: Word) -> dict:
        return {
            "lexical_form": word.lexical_form.value,
            "normalised_form": word.normalised_form.value,
            "text": word.text,
            "version": word.version.value,
            "language_code": word.language_code.value,
            "script_code": word.script_code.value if word.script_code else None,
            "part_of_speech": word.part_of_speech.name,
            "closed_class": False,
            "definition": word.definition.value if word.definition else None,
            "gloss": word.gloss.value if word.gloss else None,
            "usage_notes": [note.value for note in word.usage_notes],
            "register_codes": [code.name for code in word.register_codes],
            "editorial_labels": [label.name for label in word.editorial_labels],
            "dialect_codes": [code.value for code in word.dialect_codes],
            "pronunciations": [],
            "syllable_representation": word.syllable_representation.value if word.syllable_representation else None,
            "syllable_count": int(word.syllable_count.value) if word.syllable_count else None,
            "stress_pattern": word.stress_pattern.value if word.stress_pattern else None,
            "frequency_value": float(word.frequency_value.value) if word.frequency_value else None,
            "frequency_scale": word.frequency_scale.value if word.frequency_scale else None,
            "etymology_text": word.etymology_text.value if word.etymology_text else None,
            "first_recorded_use": word.first_recorded_use.value if word.first_recorded_use else None,
            "source_references": [
                {
                    "source_name": ref.source_name.value,
                    "source_version": ref.source_version.value if ref.source_version else None,
                    "external_identifier": ref.external_identifier.value if ref.external_identifier else None,
                    "reference_uri": ref.reference_uri.value if ref.reference_uri else None,
                    "licence_identifier": ref.licence_identifier.value if ref.licence_identifier else None,
                }
                for ref in word.source_references
            ],
        }

    def _empty_promoted_doc(self) -> dict:
        return {
            "schema_version": SCHEMA_VERSION,
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
            "schema_version": SCHEMA_VERSION,
            "asset_version": "1.1.0",
            "language_code": self.language_code,
            "total_lexical_forms": total,
            "files": [{"file": fname, "count": count} for fname, count in file_counts.items()],
        }
        (self.assets_dir / MANIFEST_FILE).write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
