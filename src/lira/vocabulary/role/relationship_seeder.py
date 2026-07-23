"""Loads the Common Vocabulary Relationship Cache
(vocabulary/assets/common/<language>/relationships/) and seeds a
Domain's LexicalRelationship graph with it, resolving every source and
target Word against that Domain's own Dictionary -- see
vocabulary/assets/common/en/relationships/README.md for the full
seeding-order and Qualified Word resolution rationale. Relationship
assets are generated bootstrap assets; they are not the authoritative
source of lexical knowledge."""

import hashlib
import json
from pathlib import Path
from typing import List, Optional, Tuple

from lira.value_objects import Text

from ..data.dictionary import Dictionary
from ..data.lexical_relationship_store import LexicalRelationshipStore
from ..data.lexical_relationship_type import LexicalRelationshipType
from ..data.part_of_speech import PartOfSpeech
from ..data.source_reference import SourceReference
from ..data.word import Word

CATEGORY_FILES = (
    "morphological_relationships.json",
    "semantic_relationships.json",
    "orthographic_relationships.json",
)
MANIFEST_FILE = "manifest.json"

DEFAULT_ASSETS_ROOT = Path(__file__).resolve().parent.parent / "assets" / "common"

CACHE_SOURCE_REFERENCE = SourceReference(
    source_name=Text(value="LIRA English Common Vocabulary Relationship Cache v1"),
    source_version=Text(value="1.0.0"),
)

# Every seeded relationship is a curated, hand-authored linguistic fact
# ("be" -> "am" is FIRST_PERSON_FORM), not an observation or inference
# with genuine uncertainty attached -- so it gets the same
# as-good-as-certain weight the Knowledge Layer uses for directly
# authored facts elsewhere (knowledge/data/tensor_graph.py), on all
# four system properties. 0.9999 rather than a literal 1.0 by the same
# convention: certainty is never asserted as exactly 1.0.
SEEDER_DEFAULT_WEIGHT = 0.9999

# (source_lexical_form, source_part_of_speech, target_lexical_form,
# target_part_of_speech, relationship_type). The two part_of_speech
# entries are usually None -- Dictionary.lookup()'s first-seeded-wins
# default is exact and unambiguous for every closed-class/mandatory
# word, which is all a spec ever needed to disambiguate until promoted
# words started creating open-class homographs (e.g. "state" NOUN and
# VERB both promoted -- vocabulary/assets/common/en/README.md's
# Homographs table). A spec whose endpoint IS genuinely ambiguous names
# an explicit part_of_speech instead of leaving it to load order --
# see _resolve below and assets/common/en/relationships/README.md's own
# schema section.
RelationshipSpec = Tuple[str, Optional[PartOfSpeech], str, Optional[PartOfSpeech], LexicalRelationshipType]


class RelationshipSeeder:
    def __init__(self, language_code: str = "en", assets_root: Optional[Path] = None):
        self.language_code = language_code
        self.assets_dir = (assets_root or DEFAULT_ASSETS_ROOT) / language_code / "relationships"
        self._cache: Optional[List[RelationshipSpec]] = None

    def validate_assets(self) -> None:
        """Validates JSON schema, per-file and total relationship
        counts, relationship kind validity, mandatory file existence,
        manifest consistency, and the manifest checksum."""
        if not self.assets_dir.is_dir():
            raise FileNotFoundError(f"no Common Vocabulary Relationship Cache for language '{self.language_code}' at {self.assets_dir}")

        manifest_path = self.assets_dir / MANIFEST_FILE
        if not manifest_path.is_file():
            raise FileNotFoundError(f"mandatory Relationship Cache file missing: {MANIFEST_FILE}")
        manifest = json.loads(manifest_path.read_text())
        for required_key in ("schema_version", "language_code", "relationship_count", "files", "checksum"):
            if required_key not in manifest:
                raise ValueError(f"{MANIFEST_FILE}: missing required key '{required_key}'")

        computed_total = 0
        for filename in CATEGORY_FILES:
            path = self.assets_dir / filename
            if not path.is_file():
                raise FileNotFoundError(f"mandatory Relationship Cache file missing: {filename}")
            doc = json.loads(path.read_text())
            for required_key in ("schema_version", "language_code", "relationship_category", "count", "relationships"):
                if required_key not in doc:
                    raise ValueError(f"{filename}: missing required key '{required_key}'")
            if doc["count"] != len(doc["relationships"]):
                raise ValueError(f"{filename}: count {doc['count']} does not match {len(doc['relationships'])} relationship entries")
            for entry in doc["relationships"]:
                kind = entry.get("relationship_kind")
                if kind not in LexicalRelationshipType.__members__:
                    raise ValueError(f"{filename}: unknown relationship_kind '{kind}'")
                if not entry.get("source_lexical_form") or not entry.get("target_lexical_form"):
                    raise ValueError(f"{filename}: relationship entry missing source_lexical_form or target_lexical_form")
                for pos_field in ("source_part_of_speech", "target_part_of_speech"):
                    pos_value = entry.get(pos_field)
                    if pos_value is not None and pos_value not in PartOfSpeech.__members__:
                        raise ValueError(f"{filename}: unknown {pos_field} '{pos_value}'")
            computed_total += doc["count"]

        if manifest["relationship_count"] != computed_total:
            raise ValueError(
                f"manifest.json relationship_count ({manifest['relationship_count']}) "
                f"does not match the computed total ({computed_total})"
            )

        computed_checksum = self._compute_checksum()
        if manifest["checksum"] != computed_checksum:
            raise ValueError("manifest.json checksum does not match the relationship files' contents")

    def _compute_checksum(self) -> str:
        digest = hashlib.sha256()
        for filename in sorted(CATEGORY_FILES):
            digest.update((self.assets_dir / filename).read_bytes())
        return digest.hexdigest()

    def load_relationship_specs(self) -> List[RelationshipSpec]:
        """Validates the assets, then parses every category file into
        RelationshipSpec tuples. Cached after the first call."""
        if self._cache is not None:
            return list(self._cache)

        self.validate_assets()
        specs = []
        for filename in CATEGORY_FILES:
            doc = json.loads((self.assets_dir / filename).read_text())
            for entry in doc["relationships"]:
                source_pos = entry.get("source_part_of_speech")
                target_pos = entry.get("target_part_of_speech")
                specs.append((
                    entry["source_lexical_form"],
                    PartOfSpeech[source_pos] if source_pos else None,
                    entry["target_lexical_form"],
                    PartOfSpeech[target_pos] if target_pos else None,
                    LexicalRelationshipType[entry["relationship_kind"]],
                ))
        self._cache = specs
        return list(specs)

    def seed_domain(self, domain) -> int:
        """Resolves and creates every relationship in the cache against
        `domain`'s own Dictionary (Qualified Word = this Domain + a
        lexical form, never lexical form alone), skipping any that
        already exist (same source Word, kind, and target Word) and
        raising if a source or target Word cannot be resolved -- a
        cache/asset inconsistency, not something to seed around
        silently. Words must already be seeded (WordSeeder) before
        calling this. Every relationship created this way gets all four
        system properties set to SEEDER_DEFAULT_WEIGHT, not the
        LexicalRelationshipProcessor.create default of 0.0 -- a seeded
        relationship is a curated fact, not an unweighted placeholder.

        Resolution happens as a complete first pass, before any
        relationship is created: if the Nth spec in the cache can't be
        resolved, the first N-1 are never created either, rather than
        this Domain ending up with a partially-seeded relationship
        graph and no indication where it stopped."""
        dictionary: Dictionary = domain.vocabulary.dictionary
        store: LexicalRelationshipStore = domain.vocabulary.lexical_relationships
        processor = domain.vocabulary.lexical_relationship_processor

        resolved = []
        for source_form, source_pos, target_form, target_pos, relationship_type in self.load_relationship_specs():
            source_word = self._resolve(dictionary, source_form, source_pos)
            if source_word is None:
                raise ValueError(f"cannot resolve source Word '{source_form}'"
                                  f"{f' ({source_pos.name})' if source_pos else ''} in Domain '{domain.name}'")
            target_word = self._resolve(dictionary, target_form, target_pos)
            if target_word is None:
                raise ValueError(f"cannot resolve target Word '{target_form}'"
                                  f"{f' ({target_pos.name})' if target_pos else ''} in Domain '{domain.name}'")
            resolved.append((source_word, target_word, relationship_type))

        seeded = 0
        for source_word, target_word, relationship_type in resolved:
            if self._relationship_exists(store, source_word.uuid.value, target_word.uuid.value, relationship_type):
                continue

            processor.create(
                source_word_id=source_word.uuid.value,
                target_word_id=target_word.uuid.value,
                relationship_type=relationship_type,
                source_references=(CACHE_SOURCE_REFERENCE,),
                confidence=SEEDER_DEFAULT_WEIGHT,
                provenance=SEEDER_DEFAULT_WEIGHT,
                temporal=SEEDER_DEFAULT_WEIGHT,
                activation=SEEDER_DEFAULT_WEIGHT,
            )
            seeded += 1
        return seeded

    @staticmethod
    def _resolve(dictionary: Dictionary, lexical_form: str, part_of_speech: Optional[PartOfSpeech]) -> Optional[Word]:
        """Resolves one spec endpoint against `dictionary`. Without a
        part_of_speech hint, defers to Dictionary.lookup()'s own
        first-seeded-wins default, unchanged from before this method
        existed -- every spec that doesn't need disambiguating keeps
        behaving exactly as it always did. With one, resolves via
        lookup_all() and picks the matching sense, ignoring load order
        entirely -- the only way to correctly target the VERB sense of
        a lexical_form whose NOUN sense loaded first (or vice versa)."""
        if part_of_speech is None:
            return dictionary.lookup(lexical_form)
        return next((word for word in dictionary.lookup_all(lexical_form) if word.part_of_speech == part_of_speech), None)

    @staticmethod
    def _relationship_exists(store: LexicalRelationshipStore, source_word_id: str,
                              target_word_id: str, relationship_type: LexicalRelationshipType) -> bool:
        return any(
            relationship.target_word_id.value == target_word_id and relationship.relationship_type == relationship_type
            for relationship in store.outgoing(source_word_id)
        )
