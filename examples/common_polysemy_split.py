"""Data for the polysemy split: 13 Common Vocabulary Cache entries whose
single `definition` actually merges two or more distinct dictionary
senses into one (lexical_form, part_of_speech) entry -- found while
inspecting the DictionaryView Cyclic tab, where an unrelated SYNONYM
box and an unrelated HYPERNYM box would both point at the same word
(e.g. "period" showing up under both a time-duration cluster and a
punctuation-mark cluster) because its one merged definition secretly
described two senses.

Two distinct bugs, told apart by shape:

* A genuine same-part_of_speech polyseme (12 of the 13): the merged
  definition's clauses describe two (or three) real, separately
  definable senses of the same (lexical_form, part_of_speech) -- e.g.
  "character" (NOUN) merges "personality" and "a written symbol". Fixed
  by KEEPing the existing entry_id for one sense (trimmed to just that
  sense's definition) and adding a brand-new entry for each other
  sense, distinguished by Word.domain_tag (see word.py's own
  docstring): WordSeeder's (lexical_form, part_of_speech) uniqueness
  rule is now (lexical_form, part_of_speech, domain_tag), so two
  senses can coexist as long as their domain_tag differs.

* A stray leftover clause, not a merge (times, VERB): its definition's
  second clause ("also the plural of time...") just duplicates a sense
  that already has its own separate entry (times, NOUN) -- an editing
  slip, not a second sense that needs creating. Fixed by deleting the
  clause, no new entry.

domain_tag is only ever set when a split-off sense has a genuinely
fitting HYPERNYM already in (or added to) the Common Vocabulary Cache
-- e.g. "bar" (the symbol/mark sense) already had HYPERNYM -> "symbol",
so its domain_tag becomes "symbol.common" (a subdomain of "common").
Left unset (None) when no such hypernym exists, rather than
fabricating one just to fill the field -- see each KEEP/NEW entry's
`hypernym` value: None means "leave domain_tag unset", a string names
the HYPERNYM edge to add (or, for KEEPs that already carry one, the
existing target) and the domain_tag becomes "<hypernym>.common".

Every hypernym named below already exists in the Common Vocabulary
Cache in the sense used here (verified against the live dictionary
before use, the same discipline every other batch in this project
follows) -- "object" and "person" and "form", tempting as hypernyms,
were rejected because those exact lexical_forms are already claimed by
an unrelated Common sense (grammatical object/person/form), and reusing
them here would silently attach a HYPERNYM edge to the wrong sense.
"""

from dataclasses import dataclass, field
from typing import List, Optional, Tuple

REFERENCE_COUNT = 4  # every affected entry's existing reference_count; carried onto every new sense unchanged.


@dataclass
class SenseSplit:
    lexical_form: str
    part_of_speech: str
    definition: str
    domain_tag: Optional[str] = None  # None => leave Word.domain_tag unset.
    hypernym: Optional[str] = None  # lexical_form of the HYPERNYM to add/keep; None => no HYPERNYM edge for this sense.
    is_new: bool = False  # False => this is the KEEP edit (same entry_id); True => brand-new entry.
    plural: Optional[str] = None  # NOUNs only: the existing plural Word this sense also inflects to.


@dataclass
class WordSplit:
    lexical_form: str
    part_of_speech: str
    entry_id: str  # the ORIGINAL entry_id, kept by the KEEP sense.
    senses: List[SenseSplit]  # first is always the KEEP edit (is_new=False); rest are brand-new.
    # Relationship edges attached to the ORIGINAL merged entry that must move to
    # a NEW sense instead of staying with KEEP: (kind, other_lexical_form,
    # other_part_of_speech, direction, new_sense_index) where direction is
    # "outgoing" (this word -> other) or "incoming" (other -> this word), and
    # new_sense_index indexes into `senses` (1-based into the NEW entries,
    # i.e. 0 means senses[1], 1 means senses[2], ...).
    moves: List[Tuple[str, str, str, str, int]] = field(default_factory=list)


WORD_SPLITS: List[WordSplit] = [
    WordSplit(
        lexical_form="bar", part_of_speech="NOUN", entry_id="259856e4-d6bb-436d-a600-78453dff7d99",
        senses=[
            SenseSplit("bar", "NOUN", "A symbol, such as a line, used to mark, separate, or denote something.",
                       domain_tag="symbol.common", hypernym="symbol", plural="bars"),
            SenseSplit("bar", "NOUN", "A rigid piece of material, typically long and narrow, such as a length of metal or wood.",
                       domain_tag="item.common", hypernym="item", is_new=True, plural="bars"),
        ],
        moves=[],  # existing HYPERNYM->symbol/HYPONYM<-symbol already belong to the KEEP (symbol) sense.
    ),
    WordSplit(
        lexical_form="case", part_of_speech="NOUN", entry_id="1dfe44ae-ff6a-4040-ac35-618bbaee88b5",
        senses=[
            SenseSplit("case", "NOUN", "A particular instance or situation.", plural="cases"),
            SenseSplit("case", "NOUN", "A grammatical category marking a word's function in a sentence, such as subject or object.",
                       domain_tag="category.common", hypernym="category", is_new=True, plural="cases"),
        ],
        moves=[
            ("HYPERNYM", "category", "NOUN", "outgoing", 0),
            ("HYPONYM", "category", "NOUN", "incoming", 0),
            ("RELATED", "inflection", "NOUN", "outgoing", 0),
            ("RELATED", "inflection", "NOUN", "incoming", 0),
        ],
    ),
    WordSplit(
        lexical_form="character", part_of_speech="NOUN", entry_id="5778d68e-27ef-4de5-b8e8-f83705bfc76e",
        senses=[
            SenseSplit("character", "NOUN", "The mental and moral qualities distinctive of an individual.",
                       domain_tag="quality.common", hypernym="quality", plural="characters"),
            SenseSplit("character", "NOUN", "A symbol used in writing or printing, such as a letter or numeral.",
                       domain_tag="mark.common", hypernym="mark", is_new=True, plural="characters"),
        ],
        moves=[
            ("SYNONYM", "symbol", "NOUN", "outgoing", 0),
            ("SYNONYM", "symbol", "NOUN", "incoming", 0),
            ("HYPONYM", "letter", "NOUN", "outgoing", 0),
            ("HYPERNYM", "letter", "NOUN", "incoming", 0),
        ],
    ),
    WordSplit(
        lexical_form="charge", part_of_speech="NOUN", entry_id="bcd03ada-8d89-46d0-85ba-37683c7ee2de",
        senses=[
            SenseSplit("charge", "NOUN", "A property of matter that causes it to experience a force in an electric or magnetic field.",
                       domain_tag="property.common", hypernym="property", plural="charges"),
            SenseSplit("charge", "NOUN", "A formal accusation of wrongdoing, especially one made against someone in a legal proceeding.",
                       domain_tag="statement.common", hypernym="statement", is_new=True, plural="charges"),
            SenseSplit("charge", "NOUN", "The price asked for goods or a service.",
                       is_new=True, plural="charges"),
        ],
        moves=[],  # HYPERNYM->property/RELATED->force already belong to the KEEP (physics) sense.
    ),
    WordSplit(
        lexical_form="domain", part_of_speech="NOUN", entry_id="b315c433-60e6-49bc-b1af-2643bd741059",
        senses=[
            SenseSplit("domain", "NOUN", "A specified sphere of activity, knowledge, or ownership.", plural="domains"),
            SenseSplit("domain", "NOUN", "A distinct part of a network identified by a name, as in an internet address.",
                       domain_tag="network.common", hypernym="network", is_new=True, plural="domains"),
        ],
        moves=[],  # RELATED/SYNONYM->field already belong to the KEEP (sphere-of-activity) sense.
    ),
    WordSplit(
        lexical_form="figure", part_of_speech="NOUN", entry_id="c2b5c3f7-32cb-42b8-9aa0-aff23a98d49a",
        senses=[
            SenseSplit("figure", "NOUN", "A number or numeral.",
                       domain_tag="symbol.common", hypernym="symbol", plural="figures"),
            SenseSplit("figure", "NOUN", "The shape or outline of something, especially a person's body.",
                       is_new=True, plural="figures"),
            SenseSplit("figure", "NOUN", "A diagram or illustration, especially one accompanying and clarifying a piece of text.",
                       domain_tag="representation.common", hypernym="representation", is_new=True, plural="figures"),
        ],
        moves=[
            ("SYNONYM", "shape", "NOUN", "outgoing", 0),
            ("SYNONYM", "shape", "NOUN", "incoming", 0),
        ],
    ),
    WordSplit(
        lexical_form="negative", part_of_speech="NOUN", entry_id="cb296cd9-9530-4f77-bd11-64d453cf8270",
        senses=[
            SenseSplit("negative", "NOUN", "A negative word, statement, or response.",
                       domain_tag="response.common", hypernym="response", plural="negatives"),
            SenseSplit("negative", "NOUN", "A photographic image with light and dark, or colours, reversed, from which positive prints can be made.",
                       is_new=True, plural="negatives"),
        ],
        moves=[],  # RELATED->negation already belongs to the KEEP (word/response) sense.
    ),
    WordSplit(
        lexical_form="negative", part_of_speech="ADJECTIVE", entry_id="7a3087e4-d749-4b87-a751-b555e380db84",
        senses=[
            SenseSplit("negative", "ADJECTIVE", "Less than zero.",
                       domain_tag="numerical.common", hypernym="numerical"),
            SenseSplit("negative", "ADJECTIVE", "Relating to a type of electric charge opposite to positive.",
                       domain_tag="electric.common", hypernym="electric", is_new=True),
        ],
        moves=[],  # the explicit ADJECTIVE<->ADJECTIVE ANTONYM pair is rebuilt separately (ANTONYM_PAIRS below).
    ),
    WordSplit(
        lexical_form="operator", part_of_speech="NOUN", entry_id="ca22ad92-3cbf-4f58-b2e6-04a2e8a437b0",
        senses=[
            SenseSplit("operator", "NOUN", "A symbol representing a mathematical or logical operation.",
                       domain_tag="symbol.common", hypernym="symbol", plural="operators"),
            SenseSplit("operator", "NOUN", "A person who operates or controls a machine or system.",
                       domain_tag="human.common", hypernym="human", is_new=True, plural="operators"),
        ],
        moves=[],  # HYPERNYM->symbol/RELATED->operation already belong to the KEEP (symbol) sense.
    ),
    WordSplit(
        lexical_form="period", part_of_speech="NOUN", entry_id="f2f518ae-6edc-45cc-a8a5-1ba94b287e52",
        senses=[
            SenseSplit("period", "NOUN", "A length of time."),
            SenseSplit("period", "NOUN", "The punctuation mark that ends a declarative sentence; a full stop.",
                       domain_tag="mark.common", hypernym="mark", is_new=True, plural="periods"),
        ],
        moves=[
            ("HYPERNYM", "mark", "NOUN", "outgoing", 0),
            ("HYPONYM", "mark", "NOUN", "incoming", 0),
        ],
    ),
    WordSplit(
        lexical_form="positive", part_of_speech="ADJECTIVE", entry_id="a46c4ce6-bf22-4702-8b3e-38eb7932de22",
        senses=[
            SenseSplit("positive", "ADJECTIVE", "Constructive or optimistic."),
            SenseSplit("positive", "ADJECTIVE", "Greater than zero.",
                       domain_tag="numerical.common", hypernym="numerical", is_new=True),
            SenseSplit("positive", "ADJECTIVE", "Relating to a type of electric charge opposite to negative.",
                       domain_tag="electric.common", hypernym="electric", is_new=True),
        ],
        moves=[],  # SYNONYM->optimistic/constructive already belong to the KEEP (general) sense;
                   # the explicit ADJECTIVE<->ADJECTIVE ANTONYM pair is rebuilt separately (ANTONYM_PAIRS below).
    ),
    WordSplit(
        lexical_form="sense", part_of_speech="NOUN", entry_id="ed1ff831-f0da-479d-a35f-02fe5d58f134",
        senses=[
            SenseSplit("sense", "NOUN", "A particular meaning of a word or expression.", plural="senses"),
            SenseSplit("sense", "NOUN", "The faculty by which the body perceives external stimuli, such as sight, hearing, smell, taste, or touch.",
                       domain_tag="ability.common", hypernym="ability", is_new=True, plural="senses"),
        ],
        moves=[
            ("RELATED", "sight", "NOUN", "outgoing", 0),
            ("RELATED", "sight", "NOUN", "incoming", 0),
            ("HYPONYM", "sight", "NOUN", "outgoing", 0),
            ("HYPERNYM", "sight", "NOUN", "incoming", 0),
        ],
    ),
    WordSplit(
        lexical_form="status", part_of_speech="NOUN", entry_id="d818a83e-0e5e-4d9a-b893-7f8d4436d4dc",
        senses=[
            SenseSplit("status", "NOUN", "The relative social, professional, or legal standing of a person or thing.", plural="statuses"),
            SenseSplit("status", "NOUN", "A current state of affairs.",
                       domain_tag="situation.common", hypernym="situation", is_new=True, plural="statuses"),
        ],
        moves=[
            ("SYNONYM", "state", "NOUN", "outgoing", 0),
            ("SYNONYM", "state", "NOUN", "incoming", 0),
        ],
    ),
]

# The original single ANTONYM pair (positive ADJECTIVE <-> negative ADJECTIVE,
# both directions) no longer names one specific sense once both words split --
# replaced by one pair per sense-family that genuinely opposes (there is no
# "negative" counterpart to positive's general/optimistic sense in this
# vocabulary, so that sense is left without an ANTONYM edge, same as any other
# word with no recorded antonym).
ANTONYM_PAIRS = [
    ("numerical.common", "numerical.common"),
    ("electric.common", "electric.common"),
]

# times (VERB): not a split -- its definition's second clause duplicates the
# sense that already has its own separate entry (times, NOUN: "Plural of
# time."). Just delete the erroneous clause.
TIMES_VERB_ENTRY_ID = "92a859cf-6637-497d-a51f-fb90de7255b1"
TIMES_VERB_FIXED_DEFINITION = "Multiplies a number by another."
