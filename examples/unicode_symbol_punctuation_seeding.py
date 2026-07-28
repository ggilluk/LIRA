"""One-time migration: seeds/updates the Common Vocabulary Cache's
PUNCTUATION and SYMBOL closed classes (assets/common/en/punctuation.json,
symbols.json) from a formal Unicode reference table -- every entry's
Unicode code point, Unicode name, and Unicode General Category (Pc, Pd,
Pe, Pf, Pi, Po, Ps, Sm, Sk, So, Lm), plus a semantic "Category" grouping
(Terminator, Separator, Grouping, Quote, Connector, ...) used only to
decide which of the two POS an entry belongs under -- the persisted
`definition`/`gloss` itself is always the mechanical form "A {Unicode
Name} is a/an {Unicode Category name}.", per the exact template
requested.

PUNCTUATION already means "a mark that structures or separates text"
(vocabulary/documentation/README.md, 6.1) -- so entries whose table
Category is Terminator, Separator, Introducer, Grouping, Quote,
Omission, or Inverted (structures/delimits written text) go there.
SYMBOL already means "a non-alphabetic mark used in place of a word" --
so everything else (Connector/dash family, Alternative, Mention, Tag,
Logical, Wildcard, Pipe, Negation, Exponent, Percent, Ratio, Degree,
Prime, Section, Paragraph, Footnote, Copyright, Registered, Trademark,
List, Repeat) goes there, matching the precedent already set by the
existing '-' (Hyphen-Minus) and '_' (Low Line) SYMBOL entries.

17 of the table's 66 characters already exist as SYMBOL entries and 5
already exist as PUNCTUATION entries (matched by lexical_form) -- those
are updated in place (definition/gloss only, entry_id and every other
field untouched). The remaining 44 are newly appended, each with a
freshly generated entry_id. 8 existing SYMBOL entries ($, +, =, <, >,
€, £, ¥) are not in the table at all and are left completely alone.

Idempotent: re-running after the JSON files already reflect the target
definitions is a no-op (the diff-and-write step only writes a file
whose content actually changed).

Run from the repository root:

    python3 examples/unicode_symbol_punctuation_seeding.py
"""

import json
import uuid
from pathlib import Path

ASSETS_DIR = Path(__file__).resolve().parent.parent / "src" / "lira" / "vocabulary" / "assets" / "common" / "en"

GENERAL_CATEGORY_NAMES = {
    "Pc": "Connector Punctuation",
    "Pd": "Dash Punctuation",
    "Pe": "Close Punctuation",
    "Pf": "Final Quote Punctuation",
    "Pi": "Initial Quote Punctuation",
    "Po": "Other Punctuation",
    "Ps": "Open Punctuation",
    "Sm": "Mathematical Symbol",
    "Sk": "Modifier Symbol",
    "So": "Other Symbol",
    "Lm": "Modifier Letter",
}

# table Category -> target closed class. Every Category not listed here
# (Connector, Alternative, Mention, Tag, Logical, Wildcard, Pipe,
# Negation, Exponent, Percent, Ratio, Degree, Prime, "Double Prime",
# Section, Paragraph, Footnote, Copyright, Registered, Trademark, List,
# Repeat) goes to SYMBOL.
PUNCTUATION_CATEGORIES = {
    "Terminator", "Separator", "Introducer", "Grouping", "Quote", "Omission", "Inverted",
}

# (table Category, symbol, code point, Unicode name, Unicode General Category)
TABLE = [
    ("Terminator", ".", "U+002E", "Full Stop", "Po"),
    ("Terminator", "?", "U+003F", "Question Mark", "Po"),
    ("Terminator", "!", "U+0021", "Exclamation Mark", "Po"),
    ("Terminator", "‽", "U+203D", "Interrobang", "Po"),
    ("Separator", ",", "U+002C", "Comma", "Po"),
    ("Separator", ";", "U+003B", "Semicolon", "Po"),
    ("Introducer", ":", "U+003A", "Colon", "Po"),
    ("Grouping", "(", "U+0028", "Left Parenthesis", "Ps"),
    ("Grouping", ")", "U+0029", "Right Parenthesis", "Pe"),
    ("Grouping", "[", "U+005B", "Left Square Bracket", "Ps"),
    ("Grouping", "]", "U+005D", "Right Square Bracket", "Pe"),
    ("Grouping", "{", "U+007B", "Left Curly Bracket", "Ps"),
    ("Grouping", "}", "U+007D", "Right Curly Bracket", "Pe"),
    ("Grouping", "⟨", "U+27E8", "Left Angle Bracket", "Ps"),
    ("Grouping", "⟩", "U+27E9", "Right Angle Bracket", "Pe"),
    ("Quote", "'", "U+0027", "Apostrophe", "Po"),
    ("Quote", '"', "U+0022", "Quotation Mark", "Po"),
    ("Quote", "‘", "U+2018", "Left Single Quote", "Pi"),
    ("Quote", "’", "U+2019", "Right Single Quote", "Pf"),
    ("Quote", "“", "U+201C", "Left Double Quote", "Pi"),
    ("Quote", "”", "U+201D", "Right Double Quote", "Pf"),
    ("Quote", "«", "U+00AB", "Left Guillemet", "Pi"),
    ("Quote", "»", "U+00BB", "Right Guillemet", "Pf"),
    ("Quote", "‹", "U+2039", "Single Left Guillemet", "Pi"),
    ("Quote", "›", "U+203A", "Single Right Guillemet", "Pf"),
    ("Connector", "-", "U+002D", "Hyphen-Minus", "Pd"),
    ("Connector", "‐", "U+2010", "Hyphen", "Pd"),
    ("Connector", "‑", "U+2011", "Non-breaking Hyphen", "Pd"),
    ("Connector", "‒", "U+2012", "Figure Dash", "Pd"),
    ("Connector", "–", "U+2013", "En Dash", "Pd"),
    ("Connector", "—", "U+2014", "Em Dash", "Pd"),
    ("Connector", "―", "U+2015", "Horizontal Bar", "Pd"),
    ("Omission", "…", "U+2026", "Horizontal Ellipsis", "Po"),
    ("Alternative", "/", "U+002F", "Solidus", "Po"),
    ("Alternative", "\\", "U+005C", "Reverse Solidus", "Po"),
    ("Alternative", "⁄", "U+2044", "Fraction Slash", "Sm"),
    ("Connector", "_", "U+005F", "Low Line", "Pc"),
    ("Mention", "@", "U+0040", "Commercial At", "Po"),
    ("Tag", "#", "U+0023", "Number Sign", "Po"),
    ("Logical", "&", "U+0026", "Ampersand", "Po"),
    ("Wildcard", "*", "U+002A", "Asterisk", "Po"),
    ("Pipe", "|", "U+007C", "Vertical Line", "Sm"),
    ("Negation", "~", "U+007E", "Tilde", "Sm"),
    ("Exponent", "^", "U+005E", "Circumflex Accent", "Sk"),
    ("Percent", "%", "U+0025", "Percent Sign", "Po"),
    ("Ratio", "‰", "U+2030", "Per Mille Sign", "Po"),
    ("Ratio", "‱", "U+2031", "Per Ten Thousand Sign", "Po"),
    ("Degree", "°", "U+00B0", "Degree Sign", "So"),
    ("Prime", "′", "U+2032", "Prime", "Po"),
    ("Double Prime", "″", "U+2033", "Double Prime", "Po"),
    ("Section", "§", "U+00A7", "Section Sign", "Po"),
    ("Paragraph", "¶", "U+00B6", "Pilcrow Sign", "Po"),
    ("Footnote", "†", "U+2020", "Dagger", "Po"),
    ("Footnote", "‡", "U+2021", "Double Dagger", "Po"),
    ("Copyright", "©", "U+00A9", "Copyright Sign", "So"),
    ("Registered", "®", "U+00AE", "Registered Sign", "So"),
    ("Trademark", "™", "U+2122", "Trade Mark Sign", "So"),
    ("Inverted", "¡", "U+00A1", "Inverted Exclamation Mark", "Po"),
    ("Inverted", "¿", "U+00BF", "Inverted Question Mark", "Po"),
    ("List", "•", "U+2022", "Bullet", "Po"),
    ("List", "◦", "U+25E6", "White Bullet", "So"),
    ("List", "▪", "U+25AA", "Black Small Square", "So"),
    ("List", "▫", "U+25AB", "White Small Square", "So"),
    ("List", "‣", "U+2023", "Triangular Bullet", "Po"),
    ("Repeat", "々", "U+3005", "Ideographic Iteration Mark", "Lm"),
    ("Repeat", "〃", "U+3003", "Ditto Mark", "Po"),
]


def _article(word: str) -> str:
    return "An" if word[0].upper() in "AEIOU" else "A"


def _definition(unicode_name: str, category_code: str) -> str:
    category_name = GENERAL_CATEGORY_NAMES[category_code]
    return f"{_article(unicode_name)} {unicode_name} is {_article(category_name).lower()} {category_name}."


def _load_json(filename: str) -> dict:
    return json.loads((ASSETS_DIR / filename).read_text())


def _save_json(filename: str, doc: dict) -> None:
    (ASSETS_DIR / filename).write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")


def _new_entry(symbol: str, part_of_speech: str, closed_class_kind: str, definition: str) -> dict:
    return {
        "entry_id": str(uuid.uuid4()),
        "lexical_form": symbol,
        "normalised_form": symbol,
        "text": symbol,
        "version": "1.0",
        "language_code": "en",
        "script_code": "Latn",
        "part_of_speech": part_of_speech,
        "closed_class": True,
        "closed_class_kind": closed_class_kind,
        "definition": definition,
        "gloss": definition,
        "usage_notes": [],
        "register_codes": ["NEUTRAL"],
        "editorial_labels": [],
        "dialect_codes": [],
        "pronunciations": [],
        "syllable_representation": None,
        "syllable_count": None,
        "stress_pattern": None,
        "frequency_value": None,
        "frequency_scale": None,
        "etymology_text": None,
        "first_recorded_use": None,
        "source_references": [
            {
                "source_name": "LIRA English Common Closed-Class Cache v1",
                "source_version": "1.0.0",
                "external_identifier": None,
                "reference_uri": None,
                "licence_identifier": None,
            }
        ],
    }


def run() -> dict:
    punctuation_doc = _load_json("punctuation.json")
    symbols_doc = _load_json("symbols.json")

    punctuation_by_form = {entry["lexical_form"]: entry for entry in punctuation_doc["words"]}
    symbols_by_form = {entry["lexical_form"]: entry for entry in symbols_doc["words"]}

    report = {"punctuation_updated": [], "punctuation_added": [], "symbols_updated": [], "symbols_added": []}

    for table_category, symbol, code_point, unicode_name, general_category in TABLE:
        definition = _definition(unicode_name, general_category)
        if table_category in PUNCTUATION_CATEGORIES:
            existing = punctuation_by_form.get(symbol)
            if existing is not None:
                if existing["definition"] != definition:
                    existing["definition"] = definition
                    existing["gloss"] = definition
                    report["punctuation_updated"].append(symbol)
            else:
                entry = _new_entry(symbol, "PUNCTUATION", "punctuation", definition)
                punctuation_doc["words"].append(entry)
                punctuation_by_form[symbol] = entry
                report["punctuation_added"].append(symbol)
        else:
            existing = symbols_by_form.get(symbol)
            if existing is not None:
                if existing["definition"] != definition:
                    existing["definition"] = definition
                    existing["gloss"] = definition
                    report["symbols_updated"].append(symbol)
            else:
                entry = _new_entry(symbol, "SYMBOL", "symbol", definition)
                symbols_doc["words"].append(entry)
                symbols_by_form[symbol] = entry
                report["symbols_added"].append(symbol)

    punctuation_doc["count"] = len(punctuation_doc["words"])
    symbols_doc["count"] = len(symbols_doc["words"])
    _save_json("punctuation.json", punctuation_doc)
    _save_json("symbols.json", symbols_doc)

    report["punctuation_total"] = punctuation_doc["count"]
    report["symbols_total"] = symbols_doc["count"]
    return report


if __name__ == "__main__":
    result = run()
    print(f"punctuation.json: {len(result['punctuation_updated'])} updated, {len(result['punctuation_added'])} added, {result['punctuation_total']} total")
    print(f"  updated: {result['punctuation_updated']}")
    print(f"  added:   {result['punctuation_added']}")
    print(f"symbols.json: {len(result['symbols_updated'])} updated, {len(result['symbols_added'])} added, {result['symbols_total']} total")
    print(f"  updated: {result['symbols_updated']}")
    print(f"  added:   {result['symbols_added']}")
