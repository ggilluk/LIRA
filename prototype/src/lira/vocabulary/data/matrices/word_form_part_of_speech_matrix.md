# Word Form to Part of Speech Matrix

Which word forms apply to which parts of speech, how each one is
actually recognised, generated, and reduced back to its lemma, and why
each form exists. `✓` means the form applies to every word of that
part of speech; `✓*` means it applies only to a subset (e.g. not every
pronoun has a distinct reflexive case); `—` means the form does not
apply to that part of speech at all.

Every rule number stays aligned across every column for a given row --
Format rule 2, Base Lemma Preconditions rule 2, Base Lemma Pattern rule
2, Generation Transform rule 2, Reduction Transform rule 2, String
Pattern rule 2, Required Linguistic Data rule 2, and Exception Lookup
rule 2 all describe the *same* numbered case.

- **Format**: the spelling rule in plain English, with an example pair.
- **Base Lemma Preconditions**: what has to be true of the *base lemma*
  (not the finished form) for this numbered rule to be the one that
  applies -- the rule-selection step a generator needs before it can
  pick which transform to run at all.
- **Base Lemma Pattern**: a regex (or `N/A`) recognising that
  precondition against the lemma's own spelling, where the precondition
  is expressible as one.
- **Generation Transform**: how to build the form from the base lemma
  (the lemma -> form direction).
- **Reduction Transform**: how to recover the base lemma from the form
  (the form -> lemma direction) -- not always the literal mirror of
  Generation Transform (e.g. undoing a doubled final consonant needs an
  explicit un-double step, not just "strip the suffix").
- **String Pattern**: the regex that recognises an *already-produced*
  form (e.g. `/s$/i` matches "dogs") -- this was the matrix's original,
  narrower column: a recognizer only, not a generator or reducer.
- **Required Linguistic Data**: what has to be known beyond the raw
  spelling for this rule to apply at all -- syllable count, stress
  pattern, person/number/case classification, or `None.` when spelling
  alone suffices.
- **Exception Lookup**: the name of the curated/irregular table this
  rule depends on when it can't be derived from spelling or structural
  data alone (every row with an `N/A` Base Lemma Pattern or String
  Pattern needs one of these to actually exist somewhere).

`N/A` in Base Lemma Pattern or String Pattern means the rule can't be
recognised from spelling alone and needs the named Exception Lookup
instead -- the same "declared before it's populated" gap the POS
subtype fields themselves currently have (Noun.isCountable's own
docstring, noun.ts). None of the Exception Lookup tables named here
exist in this codebase yet.

Comparative/Superlative Periphrastic Form are new rows, not in the
matrix's original version -- English's *other* comparison strategy
("more beautiful"/"most beautiful" for longer adjectives, alongside
"-er"/"-est" for shorter ones) was previously missing entirely, not
just under-specified. Neither Adjective nor Adverb realises that
strategy as a separate field the way these two rows describe, though --
data/entities/adjective.ts's and data/entities/adverb.ts's own Comparative/Superlative
Degree Form (rows below) each carry the periphrastic value directly
("more accepting", "more scarcely") when that's the strategy chosen,
rather than a second, parallel field. These two rows stay documented as
the *general* English pattern (including "less"/"least" comparison,
which neither class implements), not as fields either POS subtype
actually carries.

Both Adjective's and Adverb's own Gradability Classification and Degree
Strategy Classification are no longer purely aspirational, unlike every
other Required Linguistic Data entry this matrix names (this file's own
module docstring on why none of those exception/classification tables
exist in this codebase yet) -- but each POS class determines them its
own way, using whichever real WordNet signal actually exists for that
class, rather than one shared mechanism:

- **Adjective** (role/adjective_processor.ts): `determineGradability()` looks for
  a WordNet Attribute pointer at all, checked across every one of an
  Adjective's own Senses (not the primary sense alone) -- "tall"
  -Attribute-> "stature, height". Having the pointer is the signal on
  its own; it does not also climb the target noun's own Hypernym chain
  looking for a specific scalar-dimension ancestor -- an earlier version
  of this function did, and wrongly called "tall" itself non-gradable as
  a result ("stature, height" climbs to "bodily_property" -> "property"
  instead of any narrower anchor a real scalar noun like "size" reaches).
  `determineGradability()`'s own docstring has the full history.
- **Adverb** (role/adverb_processor.ts): WordNet gives an adverb no Attribute
  pointer of its own at all (verified directly against the bundled
  dict/data.adv -- zero `=` pointers exist there), so `determineGradability()`
  instead follows a manner adverb's own Pertainym pointer ("quickly"
  \-> "quick") to the Adjective it derives from, inheriting that
  Adjective's own gradability; a flat adverb sharing its base
  Adjective's exact spelling instead of a "-ly" derivation ("wide" the
  adverb, "wide roads") gets no Pertainym pointer either, so this falls
  back to the identically-spelled Adjective directly.
- Both classes' own `isPeriphrasticComparison()`-derived Degree Strategy
  Classification (word.ts) uses the same syllable-count heuristic (1
  syllable, or 2 syllables ending "-er"/"-le"/"-ow", stays synthetic;
  everything longer goes periphrastic) -- except Adverb overrides it for
  any "-ly"-ending lemma, which always goes periphrastic regardless of
  syllable count (role/adverb_processor.ts's own `isAdverbPeriphrasticComparison()`):
  the syllable rule was built for a short Adjective's own "y" ending
  ("happy" -> "happier"), and "-ly" happens to match that same
  consonant+y spelling without being the same phenomenon -- no real
  "-ly" adverb takes "-ier"/"-iest" ("quicklier" is not a word).

A non-gradable Adjective or Adverb ("ablative", "anisotropically") now
gets Positive Degree Form only -- Comparative/Superlative Degree Form
are absent, not populated with a mechanically well-formed but invalid
value ("ablativer", "anisotropicallier"). Both classes' own Attribute-
pointer coverage is genuinely incomplete (WordNet's `=` pointer is
sparse -- "quick"/"loud"/"fast" carry none at all despite being
unambiguously gradable in real English), so a false "not gradable" is
still possible for a lemma WordNet itself never linked to an explicit
Attribute noun; this stays a known, accepted limitation of using
Attribute/Pertainym as the sole signal, not a bug either
`determineGradability()` introduces.


## The table

The full row-by-row table this document used to carry inline (21
Word Forms × Purpose/Format/Base Lemma Preconditions/Base Lemma
Pattern/Generation Transform/Reduction Transform/String
Pattern/Required Linguistic Data/Exception Lookup, crossed against
all 11 Part of Speech columns) now lives as real, structured data in
`word_form_part_of_speech_matrix.ts`, alongside this file -- the
single source both the code (`stringPatternsFor()`, `fieldsFor()`)
and this document draw from, rather than two independently
hand-maintained copies that could silently drift apart. Read that
file directly for the full table; every row/rule there carries the
exact same columns this document used to render as markdown, just as
real TypeScript data instead.
