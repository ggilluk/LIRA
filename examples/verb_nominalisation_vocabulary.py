"""Classification and content for the NOMINALISATION relationship
(vocabulary/documentation/README.md, 6.2.1 Derivation category --
already defined, value 50, documented example "decide" -> "decision",
but never seeded anywhere before this) applied to every base-form VERB
already seeded, in both the Common Vocabulary Cache and the Physics
Domain: `achieve` -> `achievement`, `identify` -> `identification`,
`exist` -> `existence`, and so on.

Only true base/lemma verbs are candidates -- a verb Word that already
has an outgoing LEMMA_FORM edge (an inflected surface form: `causing`,
`determined`, `exists`, ...) is skipped, since nominalising a 3rd-person
or participle form rather than its lemma would be linguistically wrong;
its lemma gets the nominalisation instead, if it has one.

Not every base verb has a genuine, standard-English nominalisation.
Excluded, not forced:
- Zero-derivation verbs, where the noun sense is the *same* word, not a
  distinct derived form (`change`, `measure`, `pull`, `push`, `force`,
  `heat`, `wave`, `work`, and more) -- NOMINALISATION means a derived
  form, matching its own documented example ("decide" -> "decision",
  not "decide" -> "decide").
- Grammar/logic-operator verbs with no natural English nominalisation
  (`and`, `or`, `not`, `xor`, `xnor`, `nand`, `nor`, `plus`, `minus`).
- Verbs with no single, standard, non-forced nominalisation (`be`,
  `have`, `do`, `become`, `bring`, `follow`, `join`, `make`, `happen`,
  `reach`, and more) -- a marginal or colloquial form (`a happening`,
  `a make`) was not manufactured just to fill the list.

Each pair's noun may already exist in the Dictionary (`movement`,
`passage`, `reference`, `relation`, `acceleration` were all already
seeded, several from the definition-gap vocabulary batch) -- those
entries get `definition=None` here and only the relationship is added,
no new Word.

Direction convention matches every other Derivation-category kind
already seeded (`ADVERBIAL_DERIVATION` in the definition-gap batch,
`vocabulary/documentation/README.md`'s own NOMINALISATION example) and
the UI's own sentence template ("t is the noun form of s"): source is
the verb, target is the noun, plus the reciprocal (noun, LEMMA_FORM,
verb) edge -- the Common relationship cache's own established
convention for every morphological pair."""

from typing import List, Optional, Tuple

# (verb_lexical_form, noun_lexical_form, noun_definition_or_None_if_it_already_exists)
NominalisationPair = Tuple[str, str, Optional[str]]

# "cause" is deliberately absent from COMMON_NOMINALISATION_PAIRS below,
# even though "cause" -> "causation" is a genuine nominalisation:
# "cause" is already a Common homograph (NOUN and VERB, both open-class
# -- metalinguistic_nouns.json's NOUN sense loads before
# metalinguistic_verbs.json's VERB sense, word_seeder.py's own
# SUPPLEMENTARY_FILES ordering comment), and
# RelationshipSeeder.seed_domain resolves a static relationship cache
# entry's source_lexical_form via Dictionary.lookup() -- first-seeded-
# wins by TEXT alone, not part-of-speech-aware. A static-cache entry
# naming "cause" as source can therefore only ever attach to the NOUN
# sense, never the VERB one this relationship actually needs -- proven
# by seeding it, then checking the resulting edge directly (it landed
# on the NOUN). Rather than leave a wrong edge in the cache, "causation"
# is still promoted as a Word (COMMON_NOMINALISATION_WORD_ONLY below,
# its own definition covers the derivation in prose) but the formal
# NOMINALISATION/LEMMA_FORM edges are left unseeded -- surfaced, not
# fixed, the same discipline examples/README.md's "Known, pre-existing
# limitation" section already applies to a different RelationshipSeeder/
# Dictionary.lookup() edge case. Fixing this for real would mean making
# seed_domain's resolution part-of-speech-aware, a change to a shared
# pipeline class well beyond this batch's scope.
COMMON_NOMINALISATION_WORD_ONLY: List[Tuple[str, str]] = [
    ("causation", "The action of causing something; the relationship between cause and effect."),
]

COMMON_NOMINALISATION_PAIRS: List[NominalisationPair] = [
    ("achieve", "achievement", "A thing done successfully, especially by effort, skill, or courage; the act of achieving something."),
    ("add", "addition", "The action or process of adding something; the mathematical operation of combining numbers to find their total."),
    ("appear", "appearance", "The way that someone or something looks; an instance of coming into sight or presence."),
    ("assemble", "assembly", "A group of people gathered together for a purpose, or the action of putting the parts of something together."),
    ("assign", "assignment", "A task or piece of work assigned to someone; the action of assigning something."),
    ("choose", "choice", "An act of choosing between two or more possibilities; the option chosen."),
    ("combine", "combination", "A joining or mixing of different things; the resulting mixture."),
    ("compare", "comparison", "The act of comparing two or more things to establish their similarities or differences."),
    ("connect", "connection", "A relationship in which a person, thing, or idea is linked or associated with something else."),
    ("depend", "dependence", "The state of relying on or being controlled by someone or something else."),
    ("describe", "description", "A spoken or written account that details what something or someone is like."),
    ("determine", "determination", "The action of ascertaining or establishing something precisely; firmness of purpose."),
    ("develop", "development", "The process of developing or being developed; a growth or advancement over time."),
    ("divide", "division", "The action of separating something into parts; the mathematical operation of dividing one number by another."),
    ("exclude", "exclusion", "The action of excluding or the state of being excluded."),
    ("express", "expression", "The action of expressing something in words, actions, or symbols."),
    ("gather", "gathering", "An assembly of people, typically for a particular purpose."),
    ("identify", "identification", "The action of identifying someone or something, or the fact of being identified."),
    ("include", "inclusion", "The action or state of including or being included within a group or structure."),
    ("indicate", "indication", "A sign or piece of information that suggests something; the action of indicating."),
    ("locate", "location", "A particular place or position; the action of locating something."),
    ("manifest", "manifestation", "An event, action, or object that clearly shows or embodies something."),
    ("modify", "modification", "The action of making a change or alteration to something."),
    ("move", "movement", None),
    ("multiply", "multiplication", "The mathematical operation of repeated addition of a number a specified number of times."),
    ("pass", "passage", None),
    ("perform", "performance", "An act of performing something, such as a task, function, or work; how well something functions."),
    ("precede", "precedence", "The condition of being considered more important than someone or something else; priority in order."),
    ("qualify", "qualification", "A skill or quality that makes someone suitable for a particular role, or the action of qualifying."),
    ("refer", "reference", None),
    ("relate", "relation", None),
    ("replace", "replacement", "The action of replacing something, or a person or thing that replaces another."),
    ("represent", "representation", "The action of representing someone or something, or the state of being represented."),
    ("specify", "specification", "A detailed description of the requirements, design, or standards for something."),
    ("store", "storage", "The action or method of storing something for future use."),
    ("subtract", "subtraction", "The mathematical operation of removing one number or quantity from another."),
]

PHYSICS_NOMINALISATION_PAIRS: List[NominalisationPair] = [
    ("accelerate", "acceleration", None),
    ("apply", "application", "The action of putting something, such as a force, into operation or use."),
    ("attract", "attraction", "A force by which one object draws another toward itself."),
    ("exert", "exertion", "The action of exerting a force, effort, or influence."),
    ("exist", "existence", "The state or fact of existing; continued being."),
    ("expand", "expansion", "The action of becoming or making larger in size, volume, or extent."),
    ("possess", "possession", "The state of possessing or owning something; the thing possessed."),
]
