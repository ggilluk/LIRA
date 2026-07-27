"""Decouples linguistic configuration parameters from core processing
logic. GrammarConfigurator is the role LinguisticLexer,
ClauseSegmentationUtility, and (new in this change) SequenceEngine
consult for the grammar rules that drive their decisions -- not a
passive data record, the thing those roles are configured by.

The read-path rule tables below (phrase/clause/sentence grammars,
obligation discharges, scope classification, search bounds) are the
Linguistics Layer developer specification's ``GrammarConfigurator
extensions`` (spec 11): SequenceEngine (role/sequence_engine.py) holds no
grammar of its own -- every allowed start/next/end state, every raised
and discharged obligation, comes from here, which is what satisfies
spec 11's "rules must not be duplicated independently" for all three of
Phrase.read()/Clause.read()/Sentence.read().

Values keyed by PartOfSpeech are built by deferred-import factory
functions (module-scope ``_build_*`` functions passed to
``field(default_factory=...)``), not module-scope literals -- Vocabulary's
own modules import this package's linguistic_unit.py, so importing
PartOfSpeech at *this* module's top level would form an import-time
cycle (the same constraint every other new Linguistics module in this
change documents)."""

from dataclasses import dataclass, field
from typing import Dict, FrozenSet, Optional, Set, Tuple

from ..data.clause_type import ClauseType
from ..data.linguistic_scope import LinguisticScope
from ..data.phrase_type import PhraseType
from ..data.sentence_type import SentenceType
from ..data.sequencing_obligation import ObligationKind


@dataclass(frozen=True)
class PhraseGrammar:
    """One phrase type's allowed start/next/end states (spec 10.1) plus
    the extras two of the six types need: a prepositional phrase doesn't
    continue via a POS-to-POS transition at all, it continues by nesting
    a whole NOUN_PHRASE (``nested_phrase_after``); an infinitive phrase
    doesn't start from any seeded POS, it starts from a specific token
    *text* (``marker_forms``) because "to" is seeded only as PREPOSITION
    -- see this file's module docstring and the plan's "infinitive marker
    is lexically anchored" finding. Both extras default to empty/None so
    the other four phrase types ignore them entirely."""

    phrase_type: PhraseType
    start_states: FrozenSet["PartOfSpeech"]
    transitions: Dict["PartOfSpeech", FrozenSet["PartOfSpeech"]]
    end_states: FrozenSet["PartOfSpeech"]
    # Priority order for selecting head_part_of_speech among the states
    # actually present in a read phrase -- first entry found wins.
    head_preference: Tuple["PartOfSpeech", ...]
    # POS values that raise an obligation the moment they're read in this
    # phrase's scope (obligation_discharges below says what closes it).
    obligations_raised: Dict["PartOfSpeech", ObligationKind] = field(default_factory=dict)
    # PREPOSITIONAL_PHRASE only: {PREPOSITION: PhraseType.NOUN_PHRASE} --
    # after reading this POS, the engine attempts a nested phrase of the
    # given type as the continuation instead of a POS transition.
    nested_phrase_after: Dict["PartOfSpeech", PhraseType] = field(default_factory=dict)
    # INFINITIVE_PHRASE only: token text (not POS) that starts this
    # phrase, and the POS states allowed immediately after the marker.
    marker_forms: FrozenSet[str] = field(default_factory=frozenset)
    marker_next_states: FrozenSet["PartOfSpeech"] = field(default_factory=frozenset)
    marker_obligation: Optional[ObligationKind] = None


@dataclass(frozen=True)
class ClauseTemplate:
    """One clause type's required/optional elements (spec 13.1). Only
    ClauseType.INDEPENDENT has a populated entry in
    GrammarConfigurator.clause_element_templates in this phase -- see
    clause_type.py. ``predicate_head_requires`` is this phase's
    approximation of "finite verb" (spec 13.1, 17): a VERB_PHRASE headed
    by PartOfSpeech.VERB counts as finite. Real tense/finiteness
    morphology is Phase 2 work; this approximation still correctly
    raises MISSING_FINITE_VERB for a clause with no VERB_PHRASE at all,
    which is what spec 20's own "The fox over the dog." example needs to
    pass in this phase."""

    clause_type: ClauseType
    subject_phrase_types: FrozenSet[PhraseType]
    predicate_phrase_types: FrozenSet[PhraseType]
    object_phrase_types: FrozenSet[PhraseType]
    complement_phrase_types: FrozenSet[PhraseType]
    modifier_phrase_types: FrozenSet[PhraseType]
    subject_required: bool
    predicate_required: bool
    predicate_head_requires: FrozenSet["PartOfSpeech"]
    obligations_raised: Tuple[ObligationKind, ...] = ()


@dataclass(frozen=True)
class SentenceTemplate:
    """One sentence type's clause shape (spec 14.1, 22). Only
    SentenceType.DECLARATIVE has a populated entry in
    GrammarConfigurator.sentence_templates in this phase -- see
    sentence_type.py. ``max_clauses=1`` for DECLARATIVE encodes this
    phase's own scope boundary (plan: "one independent clause per
    sentence, non-recursive"): coordinated/multi-clause sentences are
    Phase 2."""

    sentence_type: SentenceType
    clause_types: FrozenSet[ClauseType]
    min_clauses: int
    max_clauses: Optional[int]
    terminal_punctuation: FrozenSet[str]


def _build_phrase_grammars() -> Dict[PhraseType, PhraseGrammar]:
    from lira.vocabulary import PartOfSpeech as POS

    coordination = ObligationKind.CONJUNCTION_REQUIRES_COORDINATED_ELEMENT

    return {
        PhraseType.NOUN_PHRASE: PhraseGrammar(
            phrase_type=PhraseType.NOUN_PHRASE,
            start_states=frozenset({POS.DETERMINER, POS.ADJECTIVE, POS.NOUN, POS.PROPER_NOUN, POS.PRONOUN, POS.NUMERAL}),
            transitions={
                POS.DETERMINER: frozenset({POS.ADJECTIVE, POS.NUMERAL, POS.NOUN, POS.PROPER_NOUN}),
                POS.NUMERAL: frozenset({POS.ADJECTIVE, POS.NUMERAL, POS.NOUN, POS.PROPER_NOUN}),
                POS.ADJECTIVE: frozenset({POS.ADJECTIVE, POS.NOUN, POS.PROPER_NOUN, POS.CONJUNCTION}),
                # NOUN/PROPER_NOUN only continue via CONJUNCTION (real
                # coordination, "cats and dogs"), never via a bare
                # NOUN->NOUN self-loop -- an unrestricted compound-noun
                # chain ("word use") is too eager against an ambiguous
                # NOUN/VERB word: PhraseReader's own maximal-munch tie-
                # break (reading_scorer.py's span_length) would then
                # always prefer swallowing that word into the subject NP
                # over leaving it available as the clause's VERB, which
                # is wrong far more often than genuine unmarked compound
                # nouns are common enough to justify the ambiguity in
                # this phase.
                POS.NOUN: frozenset({POS.CONJUNCTION}),
                POS.PROPER_NOUN: frozenset({POS.CONJUNCTION}),
                POS.CONJUNCTION: frozenset({POS.DETERMINER, POS.ADJECTIVE, POS.NUMERAL, POS.NOUN, POS.PROPER_NOUN, POS.PRONOUN}),
            },
            end_states=frozenset({POS.NOUN, POS.PROPER_NOUN, POS.PRONOUN, POS.NUMERAL}),
            head_preference=(POS.NOUN, POS.PROPER_NOUN, POS.PRONOUN, POS.NUMERAL),
            obligations_raised={
                POS.DETERMINER: ObligationKind.DETERMINER_REQUIRES_NOMINAL_HEAD,
                POS.CONJUNCTION: coordination,
            },
        ),
        PhraseType.VERB_PHRASE: PhraseGrammar(
            phrase_type=PhraseType.VERB_PHRASE,
            start_states=frozenset({POS.AUXILIARY, POS.VERB, POS.ADVERB}),
            transitions={
                POS.AUXILIARY: frozenset({POS.AUXILIARY, POS.ADVERB, POS.VERB}),
                POS.ADVERB: frozenset({POS.AUXILIARY, POS.ADVERB, POS.VERB, POS.PARTICLE}),
                POS.VERB: frozenset({POS.ADVERB, POS.PARTICLE, POS.CONJUNCTION}),
                POS.PARTICLE: frozenset({POS.CONJUNCTION}),
                POS.CONJUNCTION: frozenset({POS.AUXILIARY, POS.VERB, POS.ADVERB}),
            },
            # Deliberately excludes AUXILIARY -- a bare "is"/"have"/"been"
            # never completes a VERB_PHRASE on its own. This is what makes
            # "is" resolve to VERB (not AUXILIARY) in "A meaning is a
            # representation.": AUXILIARY is a valid *start* but only VERB
            # (or PARTICLE) is a valid *end*, so the single-token reading
            # "is"=AUXILIARY leaves the phrase unterminated and loses to
            # the "is"=VERB reading during ranking (see plan's own finding).
            end_states=frozenset({POS.VERB, POS.PARTICLE}),
            head_preference=(POS.VERB, POS.PARTICLE),
            obligations_raised={
                POS.AUXILIARY: ObligationKind.AUXILIARY_REQUIRES_COMPATIBLE_VERB_FORM,
                POS.CONJUNCTION: coordination,
            },
        ),
        PhraseType.ADJECTIVE_PHRASE: PhraseGrammar(
            phrase_type=PhraseType.ADJECTIVE_PHRASE,
            start_states=frozenset({POS.ADVERB, POS.ADJECTIVE}),
            transitions={
                POS.ADVERB: frozenset({POS.ADVERB, POS.ADJECTIVE}),
                POS.ADJECTIVE: frozenset({POS.CONJUNCTION}),
                POS.CONJUNCTION: frozenset({POS.ADVERB, POS.ADJECTIVE}),
            },
            end_states=frozenset({POS.ADJECTIVE}),
            head_preference=(POS.ADJECTIVE,),
            obligations_raised={POS.CONJUNCTION: coordination},
        ),
        PhraseType.ADVERB_PHRASE: PhraseGrammar(
            phrase_type=PhraseType.ADVERB_PHRASE,
            start_states=frozenset({POS.ADVERB}),
            transitions={
                POS.ADVERB: frozenset({POS.ADVERB, POS.CONJUNCTION}),
                POS.CONJUNCTION: frozenset({POS.ADVERB}),
            },
            end_states=frozenset({POS.ADVERB}),
            head_preference=(POS.ADVERB,),
            obligations_raised={POS.CONJUNCTION: coordination},
        ),
        PhraseType.PREPOSITIONAL_PHRASE: PhraseGrammar(
            phrase_type=PhraseType.PREPOSITIONAL_PHRASE,
            start_states=frozenset({POS.PREPOSITION}),
            transitions={},
            # No POS ends a PP directly -- it ends when the nested
            # NOUN_PHRASE its PREPOSITION obligation-triggers ends
            # (nested_phrase_after below), never as a bare preposition.
            end_states=frozenset(),
            head_preference=(POS.PREPOSITION,),
            obligations_raised={POS.PREPOSITION: ObligationKind.PREPOSITION_REQUIRES_OBJECT},
            nested_phrase_after={POS.PREPOSITION: PhraseType.NOUN_PHRASE},
        ),
        PhraseType.INFINITIVE_PHRASE: PhraseGrammar(
            phrase_type=PhraseType.INFINITIVE_PHRASE,
            # No seeded POS starts this phrase -- "to" is seeded only as
            # PREPOSITION (plan finding), so the marker is matched by
            # token text, never by relabelling its seeded POS.
            start_states=frozenset(),
            transitions={},
            end_states=frozenset({POS.VERB}),
            head_preference=(POS.VERB,),
            marker_forms=frozenset({"to"}),
            marker_next_states=frozenset({POS.VERB}),
            marker_obligation=ObligationKind.INFINITIVE_MARKER_REQUIRES_BASE_VERB,
        ),
    }


def _build_clause_element_templates() -> Dict[ClauseType, ClauseTemplate]:
    from lira.vocabulary import PartOfSpeech as POS

    return {
        ClauseType.INDEPENDENT: ClauseTemplate(
            clause_type=ClauseType.INDEPENDENT,
            subject_phrase_types=frozenset({PhraseType.NOUN_PHRASE}),
            predicate_phrase_types=frozenset({PhraseType.VERB_PHRASE}),
            object_phrase_types=frozenset({PhraseType.NOUN_PHRASE}),
            complement_phrase_types=frozenset({PhraseType.NOUN_PHRASE, PhraseType.ADJECTIVE_PHRASE}),
            modifier_phrase_types=frozenset({PhraseType.ADVERB_PHRASE, PhraseType.PREPOSITIONAL_PHRASE}),
            subject_required=True,
            predicate_required=True,
            predicate_head_requires=frozenset({POS.VERB}),
            obligations_raised=(ObligationKind.DECLARATIVE_CLAUSE_REQUIRES_FINITE_VERB,),
        ),
        # DEPENDENT/RELATIVE/COORDINATED: Phase 2 (clause_type.py) -- no
        # entry here, so ClauseReader must report those UNRESOLVED rather
        # than guess a template for them.
    }


def _build_sentence_templates() -> Dict[SentenceType, SentenceTemplate]:
    return {
        SentenceType.DECLARATIVE: SentenceTemplate(
            sentence_type=SentenceType.DECLARATIVE,
            clause_types=frozenset({ClauseType.INDEPENDENT}),
            min_clauses=1,
            max_clauses=1,
            terminal_punctuation=frozenset({"."}),
        ),
        # INTERROGATIVE/IMPERATIVE/EXCLAMATORY: Phase 2 (sentence_type.py).
    }


def _build_obligation_discharges() -> Dict[ObligationKind, FrozenSet["PartOfSpeech"]]:
    from lira.vocabulary import PartOfSpeech as POS

    coordinable = frozenset({
        POS.NOUN, POS.PROPER_NOUN, POS.PRONOUN, POS.NUMERAL, POS.DETERMINER,
        POS.VERB, POS.AUXILIARY, POS.ADJECTIVE, POS.ADVERB, POS.PARTICLE,
    })
    return {
        ObligationKind.DETERMINER_REQUIRES_NOMINAL_HEAD: frozenset({POS.NOUN, POS.PROPER_NOUN, POS.NUMERAL}),
        ObligationKind.PREPOSITION_REQUIRES_OBJECT: frozenset({POS.NOUN, POS.PROPER_NOUN, POS.PRONOUN, POS.NUMERAL}),
        ObligationKind.AUXILIARY_REQUIRES_COMPATIBLE_VERB_FORM: frozenset({POS.VERB}),
        ObligationKind.INFINITIVE_MARKER_REQUIRES_BASE_VERB: frozenset({POS.VERB}),
        ObligationKind.CONJUNCTION_REQUIRES_COORDINATED_ELEMENT: coordinable,
        # Phase 2 obligations -- never raised in this phase, so an empty
        # discharge set is never actually consulted; present so
        # validate_against_vocabulary() has one row per ObligationKind
        # member to check, not just the ones this phase raises.
        ObligationKind.RELATIVE_PRONOUN_OPENS_RELATIVE_CLAUSE: frozenset(),
        ObligationKind.DECLARATIVE_CLAUSE_REQUIRES_FINITE_VERB: frozenset({POS.VERB}),
        ObligationKind.QUOTATION_MUST_CLOSE: frozenset(),
        ObligationKind.PARENTHETICAL_MUST_CLOSE: frozenset(),
    }


@dataclass
class GrammarConfigurator:
    coordinating_conjunctions: Set[str] = field(
        default_factory=lambda: {"and", "but", "or", "so", "yet", "for"}
    )
    clause_delimiters: Set[str] = field(
        default_factory=lambda: {","}
    )
    sentence_abbreviation_exceptions: str = r'(?<!\bDr)(?<!\bEd)(?<!\bJan)(?<!\bU\.S)'

    # --- Read-path rule tables (spec 11) -----------------------------
    phrase_grammars: Dict[PhraseType, PhraseGrammar] = field(default_factory=_build_phrase_grammars)
    clause_element_templates: Dict[ClauseType, ClauseTemplate] = field(default_factory=_build_clause_element_templates)
    sentence_templates: Dict[SentenceType, SentenceTemplate] = field(default_factory=_build_sentence_templates)
    obligation_discharges: Dict[ObligationKind, FrozenSet["PartOfSpeech"]] = field(default_factory=_build_obligation_discharges)

    # Scopes in which an unresolved (unseeded) token is absorbed as a
    # wildcard rather than aborting the whole read (spec 7; plan's
    # "unknown token currently kills the entire parse" fix).
    unknown_token_absorbing_scopes: FrozenSet[LinguisticScope] = field(
        default_factory=lambda: frozenset({LinguisticScope.NOUN_PHRASE, LinguisticScope.VERB_PHRASE})
    )
    # Scopes in which a CONJUNCTION token is read as phrase-internal
    # coordination rather than a clause/sentence-level boundary.
    coordinable_scopes: FrozenSet[LinguisticScope] = field(
        default_factory=lambda: frozenset({
            LinguisticScope.NOUN_PHRASE, LinguisticScope.VERB_PHRASE,
            LinguisticScope.ADJECTIVE_PHRASE, LinguisticScope.ADVERB_PHRASE,
        })
    )

    # Bounds for SequenceEngine.find_valid_sequences's DP/beam search
    # (plan finding: naive exhaustive search hit a 200k-node cap on one
    # 14-token sentence) -- exceeding max_sequence_search_nodes truncates
    # the search rather than exhausting it, and only the top
    # max_alternative_interpretations survivors are retained as
    # Interpretation alternatives (spec 15, 24).
    max_sequence_search_nodes: int = 4000
    max_alternative_interpretations: int = 3

    def validate_against_vocabulary(self) -> None:
        """Asserts every rule table is internally consistent -- a typo
        in a table (spec 11's own rule tables) fails here, at
        LinguisticController construction time, not mid-parse. Checked,
        not merely type-hinted, because PartOfSpeech/PhraseType/
        ClauseType keys and values are plain dict/set contents that a
        future edit could still get wrong (e.g. an obligation raised
        with no matching discharge entry, or a head_preference POS that
        no state set of its own phrase can ever produce)."""
        errors = []

        for phrase_type, grammar in self.phrase_grammars.items():
            if grammar.phrase_type is not phrase_type:
                errors.append(f"phrase_grammars[{phrase_type}].phrase_type mismatch: {grammar.phrase_type}")

            reachable_states: Set["PartOfSpeech"] = set(grammar.start_states) | set(grammar.end_states) | set(grammar.marker_next_states)
            for targets in grammar.transitions.values():
                reachable_states |= set(targets)
            for pos in grammar.head_preference:
                if pos not in reachable_states:
                    errors.append(f"{phrase_type}: head_preference {pos} is not a reachable state")

            has_ordinary_end = bool(grammar.end_states)
            has_marker_end = bool(grammar.marker_forms) and bool(grammar.marker_next_states)
            # A PP-shaped phrase never ends on its own POS at all -- it
            # ends when the nested phrase its trigger POS opens ends
            # (e.g. PREPOSITIONAL_PHRASE via nested_phrase_after[PREPOSITION]).
            has_nested_end = bool(grammar.nested_phrase_after)
            if not has_ordinary_end and not has_marker_end and not has_nested_end:
                errors.append(f"{phrase_type}: no end_states, marker-based end, or nested-phrase end -- this phrase type can never validly close")

            for pos, kind in grammar.obligations_raised.items():
                if kind not in self.obligation_discharges:
                    errors.append(f"{phrase_type}: obligation {kind} raised by {pos} has no obligation_discharges entry")
            if grammar.marker_obligation is not None and grammar.marker_obligation not in self.obligation_discharges:
                errors.append(f"{phrase_type}: marker_obligation {grammar.marker_obligation} has no obligation_discharges entry")

            for pos, nested_type in grammar.nested_phrase_after.items():
                if nested_type not in self.phrase_grammars:
                    errors.append(f"{phrase_type}: nested_phrase_after[{pos}]={nested_type} is not a configured phrase type")

        for clause_type, template in self.clause_element_templates.items():
            if template.clause_type is not clause_type:
                errors.append(f"clause_element_templates[{clause_type}].clause_type mismatch: {template.clause_type}")
            for role_name, phrase_types in (
                ("subject", template.subject_phrase_types),
                ("predicate", template.predicate_phrase_types),
                ("object", template.object_phrase_types),
                ("complement", template.complement_phrase_types),
                ("modifier", template.modifier_phrase_types),
            ):
                for phrase_type in phrase_types:
                    if phrase_type not in self.phrase_grammars:
                        errors.append(f"clause_element_templates[{clause_type}].{role_name} references unconfigured phrase type {phrase_type}")
            for kind in template.obligations_raised:
                if kind not in self.obligation_discharges:
                    errors.append(f"clause_element_templates[{clause_type}]: obligation {kind} has no obligation_discharges entry")

        for sentence_type, template in self.sentence_templates.items():
            if template.sentence_type is not sentence_type:
                errors.append(f"sentence_templates[{sentence_type}].sentence_type mismatch: {template.sentence_type}")
            for clause_type in template.clause_types:
                if clause_type not in self.clause_element_templates:
                    errors.append(f"sentence_templates[{sentence_type}] references unconfigured clause type {clause_type}")
            if template.min_clauses < 1:
                errors.append(f"sentence_templates[{sentence_type}]: min_clauses must be >= 1")
            if template.max_clauses is not None and template.max_clauses < template.min_clauses:
                errors.append(f"sentence_templates[{sentence_type}]: max_clauses < min_clauses")

        if errors:
            raise ValueError("GrammarConfigurator rule tables are inconsistent:\n" + "\n".join(f"  - {e}" for e in errors))
