# Example UI Output

`dictionary_view_example.html` is a static, pre-generated example of
`DictionaryView`'s output (`vocabulary/ui/dictionary_view.py`) -- open
it directly in a browser to see the UI without running any code.

It now shows a **Physics Domain**, seeded from the Common Domain (now
**3023** words: 391 mandatory closed-class + 167 supplementary
metalinguistic terms + 2465 promoted open-class words -- see below,
and `assets/common/en/README.md`'s own `asset_version 1.16.0` Version
entry for the morphology-completion batch that grew the promoted total
from 1441) plus 84 lexical forms hydrated directly into
the Physics Domain via the Vocabulary Layer's domain-seeding pipeline
(`DictionaryProcessor.identify_word`, `AsyncDictionaryHydrator`,
`ExternalDictionaryAdapter`) -- 3107 words, 6155 relationships in total
(6111 inherited from Common + 44 hand-curated or morphologically-linked
among the hydrated Physics words, covering every
`LexicalRelationshipType` Lexical Semantic kind with at least 5 real
examples each: `hot`<->`cold` ANTONYM, `matter` HYPERNYM `particle`,
`nucleus` MERONYM `atom`, `move` TROPONYM `flow`, `heat` CAUSE `melt`,
and more -- `RelationshipSeeder` itself never relates a hydrated word;
see `examples/physics_domain_relationships.py`). The Physics-specific
count (84, down from 92 before the morphology-completion batch) is
lower not because anything was removed, but because the same "already
inherited from Common instead" effect that dropped it from 143 to 92
during the 1163-word Common definition-gap batch happened again here on
a smaller scale -- see `examples/README.md`'s own Common morphology
completion section. Five hydrated words (`object`, `particle`, `wave`,
`moving`, `flow`) turned out to collide with unrelated Common senses of
the same text -- `object`/`particle` share the exact same
part_of_speech as their Common sense, `wave`/`moving`/`flow` need a
*different* part_of_speech than whatever Common happens to have (the
1163-word batch added Common senses for all three, retroactively
reintroducing the same collision `object`/`particle` first found) --
resolved via `DictionaryProcessor.register_conflicting_sense`, visible
in the Words table as pairs of identical-looking rows (one Common, one
Physics), distinguished by the Domain pill and by each row's own
`entry_id`, shown in the detail panel (`assets/common/en/README.md`'s
own Version section, `asset_version 1.14.0`, has the full story of why
this no longer renders as `object_2`/`particle_2`). See
`examples/README.md` (repo root) for the full demonstration, including
the network caveat (this
sandbox blocks live calls to `api.dictionaryapi.dev`, so the hydrated
words came from curated fixture data in that API's real response
shape, run through the otherwise-unmodified pipeline -- the generated
page's title says so explicitly), the word-sense-conflict story, and
the full seeding report.

Several layout changes since the last regeneration, none data-related --
see `vocabulary/ui/README.md` for the full description of all of them:
the Words tab's detail panel now sits above the table instead of beside
it (still `position: sticky` while the list below it scrolls, dropping
to normal flow under the existing mobile breakpoint); a Hierarchy tab
renders the whole Dictionary as a nested tree for one
`LexicalRelationshipType` at a time -- pick `HYPONYM` to see it, and
select e.g. `matter` to see everything the relationship data hangs off
it (`particle`, and whatever else has been seeded as its `HYPONYM`); and
a Cyclic tab renders the genuinely cyclic structure a tree can't show
(a "(cycle)" leaf in the Hierarchy tree, drawn out as an actual SVG
graph here instead) -- pick `SYNONYM` to see it, since near-synonym
clusters are exactly the kind of tangled, non-hierarchical structure
this tab exists for. The Hierarchy and Cyclic tabs each have their own
detail panel above their own content now too -- selecting a node in
either stays right there, it doesn't pivot back to the Words tab.

### Definition-gap vocabulary

Breaking every hydrated Physics word's own `definition` down into its
constituent words (`Word.definition_words()`, 4.4) originally found 262
distinct words with no entry anywhere in this Domain's Dictionary.
Each was classified and added: 221 as genuinely common, general-English
vocabulary (promoted into the Common Vocabulary Cache itself,
`assets/common/en/promoted_words.json` -- every other Domain inherits
them too, not just Physics), 40 as Physics-specific (SI units,
subatomic-particle plurals, the electromagnetism/thermodynamics
cluster -- hydrated directly into this Physics Domain), and exactly one
excluded (`s`, the trailing letter of a possessive like `wave's`
against the tokenizer's word pattern -- not a lexical item). 41 of
these also gained a real morphological relationship back to an
existing word (`electrons` -> `PLURAL_FORM` of `electron`, `measured`
-> `PAST_PARTICIPLE_FORM` of `measure`, and so on), plus four `ANTONYM`
pairs found directly in the batch (discrete/continuous, high/low,
push/pull, negative/positive). Definition completeness across the
Physics Domain rose from 69% (812 of 1185 tokens, only 1 word's
definition fully self-contained) to 94.7% (1544 of 1631 tokens, 105 of
137 words' definitions fully self-contained) -- the residual gap is
now these very words' *own* definitions needing words of their own
(`exist` -> "To have real, actual, or continued being" leaves
`continued` unresolved), the same unbounded regress `examples/README.md`
already discusses, not something this pass tries to chase to zero. See
`examples/definition_gap_vocabulary.py` (the full classification) and
`examples/README.md`'s Definition-gap vocabulary section for the
worked example.

### Verb nominalisation

`NOMINALISATION` (`vocabulary/documentation/README.md`, 6.2.1
Derivation -- defined since the relationship type enum's first version
but never actually seeded until now) links a base verb to its abstract
noun form: `achieve` -> `achievement`, `identify` -> `identification`,
`exist` -> `existence`, and so on. `examples/verb_nominalisation_vocabulary.py`
works through every base-form `VERB` already seeded (Common and
Physics) and either finds a genuine, standard-English nominalisation
(36 in Common, 7 in Physics -- 4 of the 43 nouns, `movement`, `passage`,
`reference`/`relation`, `acceleration`, already existed) or leaves it
out: zero-derivation verbs where the noun sense is the *same* word, not
a distinct form (`change`, `measure`, `force`, `wave`, and more),
grammar/logic-operator verbs with no natural nominalisation (`and`,
`or`, `xor`, `plus`, `minus`, ...), and verbs with no single standard
form (`be`, `have`, `do`, `become`, `happen`, ...) were all left alone
rather than forced. One planned pair, `cause` -> `causation`, surfaced
a real pre-existing bug instead of a clean relationship: `cause` is a
Common homograph (`NOUN` and `VERB`), and `RelationshipSeeder`'s
homograph resolution wasn't part-of-speech-aware at the time, so both
this new pair and an identical *existing* one (`cause` -> `causing`)
had silently attached to the wrong (`NOUN`) sense -- both removed
rather than left wrong. `RelationshipSeeder` was later made
part-of-speech-aware (see Common core vocabulary below and
`examples/README.md`'s Fixing the relationship cache's own POS blind
spot section), and both pairs were re-seeded correctly against the
`VERB` sense of `cause`. See `assets/common/en/relationships/README.md`'s
own Version section for the full story.

### Common core vocabulary

A user-supplied audit of words the Common Vocabulary Cache's own
definitions repeatedly depend on (`word`, `sentence`, `clause`,
`phrase`, `noun`, `verb`, ...) but never seeded added 30 more Common
words: `mood`/`voice`/`predicate` (genuine grammar terminology, added
directly to `metalinguistic_nouns.json` alongside `tense`/`aspect`/
`person`/`subject`, not promoted), `form` (`VERB`, a homograph of the
existing metalinguistic `NOUN` sense), and 26 promoted general nouns
and verbs (`idea`, `group`, `stand`, `occur`, ...) plus 5 more nouns
found while giving the new verbs the same `NOMINALISATION` treatment
as the batch above (`occur` -> `occurrence`, `produce` -> `production`,
...). Select `occur` to see both a `NOMINALISATION` sentence
("occurrence is the noun form of occur") and a `THIRD_PERSON_FORM` one
("occurs is the third-person form of occur") -- the latter
retroactively links `occurs`, seeded unlinked in the definition-gap
batch since its lemma didn't exist yet. The audit also surfaced a real
bug in `WordSeeder`: promoting a second, `VERB` sense of an
already-promoted lexical_form (`name`, `point`, `state`, which already
had a promoted `NOUN` sense) was silently rejected regardless of
part_of_speech. Fixed directly in `vocabulary/role/word_seeder.py`
(both the promoted-word uniqueness check now compare
`(lexical_form, part_of_speech)`, not `lexical_form` alone) -- select
`state` (`VERB`) to see it now coexists cleanly with `state` (`NOUN`).
See `examples/README.md`'s Common core vocabulary and Fixing the
promoted-word POS blind spot sections for the full story, including
one relationship (`state` -> `NOMINALISATION` -> `statement`) that was
initially left unseeded for the same reason as `cause` above -- and
then fixed for real, along with `cause`'s two, once `RelationshipSeeder`
itself was made part-of-speech-aware; see `examples/README.md`'s
Fixing the relationship cache's own POS blind spot section and
`assets/common/en/relationships/README.md`'s own Version section.

It also demonstrates several `DictionaryView` display additions made
for this exercise, all additive and optional (existing call sites
unaffected):

- A **Provenance** line in the word detail panel, reading
  `Word.source_references` (previously computed but never shown).
- An **Unresolved** panel listing words the pipeline could not resolve
  (`studies` -- `branch` used to be unresolved too, until the 1163-word
  Common definition-gap batch seeded it) -- reported rather than
  guessed (`DictionaryView(..., unresolved=(...))`, default `()`).
- A **Domain** column in the Words table, a **Domain** filter dropdown
  alongside the part-of-speech one, and a domain pill next to every
  related word in the detail panel's relationship list --
  `DictionaryView(..., domain_name="Physics")`, default `"Domain"`.
  Every word and relationship is labelled "Common" or "Physics"
  (`word.is_common`); filtering to "Physics" isolates exactly the 84
  hydrated (or conflict-resolved) words, filtering to "Common" the
  inherited 3023.
- A one-sentence plain-English gloss under each relationship row in
  the detail panel, phrased per kind -- select the Physics-domain
  `particle` row (there are two `particle` rows now that `entry_id`
  replaced the old `particle_2` naming; pick the one with a Physics
  Domain pill, or filter to Physics first) to see
  "particle is a type of matter" (HYPERNYM), "nucleus is part of atom"
  (MERONYM, select `nucleus`), "exert causes accelerate" (CAUSE, select
  `move`); select `be` (Common) to see the same treatment applied to
  ordinary morphological kinds, e.g. "am is the first-person form of
  be".
- Each word's own definition, in the detail panel, rendered word-by-word
  with a hover/keyboard-focus popup on every token -- select `electron`
  to see its definition ("A stable subatomic particle with a negative
  electric charge, found in every atom.") with every single token
  resolving now (`stable`, `negative`, `charge`, `found` -- all promoted
  into Common by the Definition-gap vocabulary pass above; `subatomic`,
  `atom` -- Physics), popping up its own lexical form, part of speech,
  domain, and gloss; select `exist` ("To have real, actual, or
  continued being") to see the one word left with a residual gap --
  `continued` pops up "Not in this Dictionary", since it's a word *this
  pass's own new definitions* introduced, not one of the original 262
  (`Word.definition_words()`, `vocabulary/documentation/README.md`,
  4.4). See `examples/README.md`'s Definition-gap vocabulary section
  for the completeness numbers behind this.

### Common definition-gap vocabulary

The same `Word.definition_words()` technique Definition-gap vocabulary
above applied to the Physics Domain's own hydrated words, run instead
against the Common Vocabulary Cache's own 838 words, found 1011 more
words Common's own definitions depended on but never seeded -- select
`verb` to see its definition ("A word that expresses an action,
occurrence, or state of being") with `expresses` now resolving, one of
1163 words this batch promoted (1011 originally found, plus 129 base
lemmas and 23 homograph senses discovered while wiring their
relationships -- see `assets/common/en/README.md`'s own
`asset_version 1.15.0` Version entry for the full count and reasoning,
and `examples/common_definition_gap_vocabulary.py` for the complete
classification). Common grew from 838 to **1999** words and from 288
to **1070** relationships; because the Physics Domain inherits every
Common word and relationship, this is by far the largest single jump
in this file's own numbers of any batch here -- 981 -> 2091 words, 411
-> 1191 relationships overall. Wiring those relationships surfaced a
genuine Physics Domain regression: three of the new Common senses
(`wave` VERB, `moving` VERB, `flow` NOUN) blocked `identify_word()`
from ever hydrating Physics's own, different-part-of-speech senses of
the same words, the identical gap `object`/`particle` first surfaced
in the very first Physics seeding batch -- fixed the same way,
`physics_domain_seeding.py`'s `CONFLICTING_SENSE_WORDS` growing from 2
entries to 5; select `wave`, `moving`, or `flow` to see both the
Common and Physics sense present and correctly related. See
`examples/README.md`'s Common definition-gap vocabulary section for
the full story.

### Common morphology completion

Completed Group 0 (Morphological) relationship coverage: verb
conjugation, noun pluralisation, adjective/adverb degree forms, the
remaining pronoun paradigm gaps, plus a 39-pair self-documenting back-
edge fix -- select `denote` (Common, Verb) to see its relationship
panel now carrying `THIRD_PERSON_FORM` -> `denotes`, `PAST_TENSE_FORM`
-> `denoted`, `PAST_PARTICIPLE_FORM` -> `denoted`, and
`PRESENT_PARTICIPLE_FORM` -> `denoting`, all four newly wired; select
`person` (Common, Noun) to see `PLURAL_FORM` -> `people`, reusing the
already-seeded `people` entry rather than a redundant `persons`; switch
to the Hierarchy tab and pick "Lemma Form (Relationship)" to see the
single largest tree this batch produced (1588 edges). See
`examples/README.md`'s Common morphology completion section for the
full methodology, the rule engine and exclusion sets, and the counts.

Regenerate with:

```
python3 examples/common_morphology_completion_seeding.py
```

run from the repository root. This batch's own additions -- the self-
documenting back-edge fix, VERB conjugation, NOUN pluralisation,
ADJECTIVE/ADVERB degree forms, the remaining PRONOUN paradigm gaps --
are written directly to the already-persisted Common Vocabulary Cache
asset files (every earlier batch's data, including the 1163-word Common
definition-gap batch, is already on disk from having been run and
committed previously; this script doesn't need to re-run those earlier
scripts to get their data). It then seeds the Physics Domain the same
way `common_definition_gap_vocabulary_seeding.py` did
(`common_core_vocabulary_seeding.run()`, which itself chains through
`physics_domain_seeding.run()`, `definition_gap_vocabulary_seeding.run()`,
and `verb_nominalisation_seeding.run()`) and regenerates this file
directly from the result -- no longer regenerates this file any more,
see Common semantic completion below. `python3 examples/physics_domain_seeding.py`,
`python3 examples/definition_gap_vocabulary_seeding.py`,
`python3 examples/verb_nominalisation_seeding.py`,
`python3 examples/common_core_vocabulary_seeding.py`, and
`python3 examples/common_definition_gap_vocabulary_seeding.py` still
work and still write their own report files, but none of them
regenerates this file any more -- each would only reflect an earlier,
less complete state of the same Physics Domain.

### Common semantic completion

Completed Lexical Semantic (group 1) coverage for every base-form
open-class word: 1307 relationships (`SYNONYM`/`ANTONYM`/`HYPERNYM`/
`MERONYM`/`TROPONYM`/`ENTAILMENT`/`CAUSE`/`RELATED`) drafted by 14
parallel subagents, each grounded only in a word's own definition --
select `absence` (Common, Noun) to see `ANTONYM` -> `presence` (and
`presence` shows the reciprocal edge back); select `acronym` to see
`HYPERNYM` -> `abbreviation` ("acronym is a type of abbreviation");
switch to the Hierarchy tab and pick "Hypernym" to see the largest
semantic tree this batch produced (223 edges, 305 words). See
`examples/README.md`'s Common semantic completion section for the full
methodology (the drafting process, the validation pass, and the
counts).

Regenerate with:

```
python3 examples/common_semantic_completion_seeding.py
```

run from the repository root -- adds this batch's 2599 relationship
edges (materialising every `HYPERNYM`->`HYPONYM`, `MERONYM`->`HOLONYM`,
and symmetric-kind reciprocal) to the already-persisted Common
relationship cache, seeds the Physics Domain the same way every batch
above does, and regenerates this file directly from the result. None
of the earlier scripts, including `common_morphology_completion_seeding.py`,
regenerates this file any more.

To instead regenerate a plain Common-only snapshot (the previous
content of this file):

```python
from lira.knowledge.data.host import LIRAHost
from lira.vocabulary import DictionaryView

host = LIRAHost(name="example-host")
common = host.hosted_domains.get("Common")
DictionaryView(
    common.vocabulary.dictionary,
    common.vocabulary.lexical_relationships,
    title="LIRA Common Dictionary",
).save("dictionary_view_example.html")
```

This file is a snapshot, not a live asset -- it is not read by any
seeder or loaded at runtime, and will drift from actual `DictionaryView`
output as that class evolves. Regenerate it whenever the UI changes
materially.
