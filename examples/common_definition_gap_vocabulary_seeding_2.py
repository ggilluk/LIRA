"""Seeds the second Common definition-gap batch (common_definition_gap_vocabulary_2.py
holds the data: 941 words, one plain declarative-sentence definition
and one part of speech each, authored fresh) into the Common Vocabulary
Cache via WordSeeder.promote_word -- the same, pre-existing "add an
open-class word to Common" path every previous promotion batch in this
directory used (definition_gap_vocabulary_seeding.py,
common_definition_gap_vocabulary_seeding.py).

Distinct from that first batch: this one was found by scanning the
*current* seeded Dictionary (mandatory + supplementary + everything
already promoted, including the first definition-gap batch) against
every word's own Word.definition_words() -- see
src/lira/vocabulary/assets/common/en/missing_words.json for the full
scan report. Common-only, no Physics component, no relationship wiring
-- out of this batch's scope.

`_build_word` is a local copy of definition_gap_vocabulary_seeding.py's
own helper, not an import of it: that module's version sets
`is_common=(source is COMMON_SOURCE)`, an identity check against *its
own* module-level SourceReference singleton, which would silently give
every word in this batch `is_common=False` if reused unmodified. Every
word promoted here is Common by construction (this script's own scope),
so `is_common=True` is simply hardcoded instead.

Run: python3 examples/common_definition_gap_vocabulary_seeding_2.py
"""

import re
import sys
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common_definition_gap_vocabulary_2 import WORD_ENTRIES  # noqa: E402
from definition_gap_vocabulary_seeding import _load_json, _save_json  # noqa: E402

from lira.value_objects import Code, Number, Text  # noqa: E402
from lira.vocabulary import PartOfSpeech, RegisterCode, Word  # noqa: E402
from lira.vocabulary.data.source_reference import SourceReference  # noqa: E402
from lira.vocabulary.role.word_seeder import WordSeeder  # noqa: E402

ASSETS_DIR = Path(__file__).resolve().parents[1] / "src/lira/vocabulary/assets/common/en"
SOURCE = SourceReference(
    source_name=Text(value="LIRA English Common Definition-Gap Vocabulary v2"),
    source_version=Text(value="1.0.0"),
)

_VOWEL_GROUPS = re.compile(r"[aeiouy]+")


def _syllable_count(lexical_form: str) -> int:
    return max(1, len(_VOWEL_GROUPS.findall(lexical_form.lower())))


def _build_word(lexical_form: str, pos_name: str, definition: str) -> Word:
    return Word(
        text=lexical_form,
        lexical_form=Text(value=lexical_form),
        normalised_form=Text(value=lexical_form.lower()),
        part_of_speech=PartOfSpeech[pos_name],
        script_code=Code(value="Latn"),
        definition=Text(value=definition),
        gloss=Text(value=definition),
        register_codes=(RegisterCode.NEUTRAL,),
        syllable_count=Number(value=Decimal(_syllable_count(lexical_form))),
        source_references=(SOURCE,),
        is_common=True,
        is_fully_hydrated=True,
    )


def run() -> dict:
    seeder = WordSeeder()
    promoted, already_present = [], []
    for lexical_form, (pos, definition, reference_count) in sorted(WORD_ENTRIES.items()):
        word = _build_word(lexical_form, pos, definition)
        # Real observed reference_count from the scan, floored at
        # promotion_threshold + 1 -- 641 of these 941 words were only
        # ever referenced once, below promote_word's own threshold, so
        # a bare pass-through would silently drop most of the batch.
        added = seeder.promote_word(word, reference_count=max(reference_count, seeder.promotion_threshold + 1))
        (promoted if added else already_present).append((lexical_form, pos))

    word_manifest_path = ASSETS_DIR / "manifest.json"
    word_manifest = _load_json(word_manifest_path)
    promoted_path = ASSETS_DIR / "promoted_words.json"
    promoted_count = _load_json(promoted_path)["count"]
    for file_entry in word_manifest["files"]:
        if file_entry["file"] == "promoted_words.json":
            file_entry["count"] = promoted_count
    _save_json(word_manifest_path, word_manifest)

    seeder.validate_assets()
    return {"promoted": promoted, "already_present": already_present}


if __name__ == "__main__":
    result = run()
    print("Words promoted:", len(result["promoted"]))
    print("Words already present (duplicate / rejected):", len(result["already_present"]), result["already_present"])
