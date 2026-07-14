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
from ..data.source_reference import SourceReference

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

RelationshipSpec = Tuple[str, str, LexicalRelationshipType]


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
        (source_lexical_form, target_lexical_form, LexicalRelationshipType)
        tuples. Cached after the first call."""
        if self._cache is not None:
            return list(self._cache)

        self.validate_assets()
        specs = []
        for filename in CATEGORY_FILES:
            doc = json.loads((self.assets_dir / filename).read_text())
            for entry in doc["relationships"]:
                specs.append((
                    entry["source_lexical_form"],
                    entry["target_lexical_form"],
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
        calling this."""
        dictionary: Dictionary = domain.vocabulary.dictionary
        store: LexicalRelationshipStore = domain.vocabulary.lexical_relationships
        processor = domain.vocabulary.lexical_relationship_processor

        seeded = 0
        for source_form, target_form, relationship_type in self.load_relationship_specs():
            source_word = dictionary.lookup(source_form)
            if source_word is None:
                raise ValueError(f"cannot resolve source Word '{source_form}' in Domain '{domain.name}'")
            target_word = dictionary.lookup(target_form)
            if target_word is None:
                raise ValueError(f"cannot resolve target Word '{target_form}' in Domain '{domain.name}'")

            if self._relationship_exists(store, source_word.uuid.value, target_word.uuid.value, relationship_type):
                continue

            processor.create(
                source_word_id=source_word.uuid.value,
                target_word_id=target_word.uuid.value,
                relationship_type=relationship_type,
                source_references=(CACHE_SOURCE_REFERENCE,),
            )
            seeded += 1
        return seeded

    @staticmethod
    def _relationship_exists(store: LexicalRelationshipStore, source_word_id: str,
                              target_word_id: str, relationship_type: LexicalRelationshipType) -> bool:
        return any(
            relationship.target_word_id.value == target_word_id and relationship.relationship_type == relationship_type
            for relationship in store.outgoing(source_word_id)
        )
