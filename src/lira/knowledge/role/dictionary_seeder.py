"""Seeds a TensorLiraGraph's Knowledge Vector Space geometry from a
Vocabulary Layer Dictionary + LexicalRelationshipStore -- the
"reinterpretation layer" knowledge_vector_space_specification.md's own
section 41.11 describes, made concrete and runnable. Every eligible
Word becomes a Concept; every LexicalRelationship with a Knowledge
Vector Space mapping (data/lexical_relationship_type_mapping.py)
becomes the corresponding edge or Side/Sign registration. Read-only
against the Dictionary/LexicalRelationshipStore -- Vocabulary's own
data is never mutated, only read from, matching Rule 17 (Vocabulary
owns the lexicon).

Word -> Concept eligibility (spec 3: "A noun is represented as a
Concept... A Relationship is represented as a Verb Concept", 10.1/41.5:
D1-D4 and the synonym/antonym geometry are only ever defined for noun
or verb lexical Concepts): NOUN/PROPER_NOUN become ConceptKind.Noun,
VERB becomes ConceptKind.Relationship, every other part of speech
(ADJECTIVE, ADVERB, every closed class, ...) is not given a Concept at
all -- reported as skipped, not forced into an ambiguous kind the spec
never defines geometry for. A Word carrying seeded PAD
(vocabulary/assets/common/en/README.md's own asset_version 1.20.0)
has it copied onto its Concept via set_pad (spec 41.2) the moment the
Concept is created.

Deliberately conservative about which LexicalRelationship kinds get
seeded, to avoid double-processing a reciprocal pair backwards:
HYPERNYM alone drives D1 (nouns) and D3 (verbs, spec 41.5's
part-of-speech branch, same as tensor_graph.py's own add_relationship);
its reciprocal HYPONYM restates the identical fact in the wrong
direction for an is-a edge, so it's skipped. MERONYM alone drives D2;
its reciprocal HOLONYM is skipped the same way. TROPONYM is skipped
entirely -- the verb-verb HYPERNYM edge already seeded as TROPONYM's
own required companion (this codebase's established convention, see
assets/common/en/relationships/README.md's asset_version 1.15.0/1.16.0
entries) already produces the correct D3 tree on its own. CAUSE and
ENTAILMENT each seed their own edge (genuinely distinct facts that
happen to always co-occur in this cache, asset_version 1.19.0's own
reciprocal-pairing work) but this seeder never calls
assign_causal_chain -- nothing about one pairwise Vocabulary fact
identifies which cycle it belongs to, so theta stays unassigned (spec
40.4's valid incomplete state) rather than guessed at. SYNONYM/ANTONYM
register Side/Sign directly (both directions are safely idempotent,
see register_synonym/register_antonym's own docstrings). RELATED and
every Morphological/Orthographic-group kind have no Knowledge Vector
Space mapping at all (spec 41.11) and are skipped, reported, never
guessed."""

from dataclasses import dataclass, field
from typing import Dict, Optional

from ..data.lexical_relationship_type_mapping import VectorSpaceDimension, vector_space_dimension_for
from ..data.tensor_graph import ConceptKind, ConceptRef, TensorLiraGraph
from ...vocabulary.data.part_of_speech import PartOfSpeech

_SEEDABLE_POS_KIND = {
    PartOfSpeech.NOUN: ConceptKind.Noun,
    PartOfSpeech.PROPER_NOUN: ConceptKind.Noun,
    PartOfSpeech.VERB: ConceptKind.Relationship,
}

# Reciprocal-pair kinds skipped outright -- see module docstring.
_SKIPPED_RECIPROCAL_KINDS = frozenset({"HYPONYM", "HOLONYM", "TROPONYM"})


@dataclass
class DictionarySeedingReport:
    concepts_created: int = 0
    words_skipped_part_of_speech: Dict[str, int] = field(default_factory=dict)  # POS name -> count
    edges_by_dimension: Dict[str, int] = field(default_factory=dict)  # VectorSpaceDimension.value -> count
    relationships_skipped_reciprocal: int = 0
    relationships_skipped_no_mapping: int = 0
    relationships_skipped_endpoint_not_seedable: int = 0
    relationships_skipped_conflict: int = 0  # a genuine Side/Sign contradiction -- see _seed_relationship


class DictionarySeeder:
    """One instance per TensorLiraGraph -- owns the reified "is-a"/
    "part-of"/"causes"/"entails" verb Concepts every D1/D2/D3/D4-theta
    registration needs, and the Word-uuid -> Concept map that keeps
    re-seeding the same Word idempotent."""

    def __init__(self, graph: TensorLiraGraph):
        self.graph = graph
        self.is_a = graph.add_concept("is-a", ConceptKind.Relationship)
        self.part_of = graph.add_concept("part-of", ConceptKind.Relationship)
        self.causes = graph.add_concept("causes", ConceptKind.Relationship)
        self.entails = graph.add_concept("entails", ConceptKind.Relationship)
        self._concept_for_word_uuid: Dict[str, ConceptRef] = {}
        self._word_uuid_for_concept_idx: Dict[int, str] = {}

    def seed_word(self, word) -> Optional[ConceptRef]:
        """Creates (or returns the already-seeded) Concept for `word`,
        or None if its part of speech isn't Concept-eligible (module
        docstring). Keyed by word.uuid.value, not lexical_form/text --
        TensorLiraGraph.add_concept's own (name, kind) dedup would
        otherwise silently collapse two distinct Word senses that
        happen to share surface text (a genuine polyseme, Word.domain_tag's
        own docstring) into one Concept, which is wrong."""
        existing = self._concept_for_word_uuid.get(word.uuid.value)
        if existing is not None:
            return existing

        kind = _SEEDABLE_POS_KIND.get(word.part_of_speech)
        if kind is None:
            return None

        concept_name = f"{word.lexical_form.value}::{word.uuid.value[:8]}"
        concept = self.graph.add_concept(concept_name, kind)
        pleasure = float(word.seeded_pleasure_displeasure_weight.value) if word.seeded_pleasure_displeasure_weight else 0.0
        arousal = float(word.seeded_arousal_non_arousal_weight.value) if word.seeded_arousal_non_arousal_weight else 0.0
        dominance = float(word.seeded_dominance_submissive_weight.value) if word.seeded_dominance_submissive_weight else 0.0
        if pleasure or arousal or dominance:
            self.graph.set_pad(concept, pleasure=pleasure, arousal=arousal, dominance=dominance)

        self._concept_for_word_uuid[word.uuid.value] = concept
        self._word_uuid_for_concept_idx[concept.idx] = word.uuid.value
        return concept

    def word_uuid_for_concept(self, concept_idx: int) -> Optional[str]:
        """The Word.uuid.value backing the Concept at `concept_idx`, or
        None for a Concept this seeder created itself rather than seeded
        from a Word -- `is_a`/`part_of`/`causes`/`entails` (the reified
        verb Concepts every edge is written against, __init__ above).
        Reverse of `_concept_for_word_uuid` -- Concept-to-word lookups
        for graphical rendering (knowledge/ui/knowledge_view.py), which
        only ever has a Concept (a graph row index) in hand, never the
        Word it came from."""
        return self._word_uuid_for_concept_idx.get(concept_idx)

    def seed_dictionary(self, dictionary, relationships) -> DictionarySeedingReport:
        """Seeds every Word in `dictionary` as a Concept, then every
        LexicalRelationship in `relationships` with a Knowledge Vector
        Space mapping. Idempotent and safe to call more than once
        against the same graph (seed_word's own dedup, register_synonym/
        register_antonym's own idempotent-both-directions handling)."""
        report = DictionarySeedingReport()
        for word in dictionary.all():
            concept = self.seed_word(word)
            if concept is not None:
                report.concepts_created += 1
            else:
                pos_name = word.part_of_speech.name
                report.words_skipped_part_of_speech[pos_name] = report.words_skipped_part_of_speech.get(pos_name, 0) + 1

        for relationship in relationships.all():
            self._seed_relationship(relationship, dictionary, report)

        return report

    def _seed_relationship(self, relationship, dictionary, report: DictionarySeedingReport) -> None:
        kind_name = relationship.relationship_type.name
        if kind_name in _SKIPPED_RECIPROCAL_KINDS:
            report.relationships_skipped_reciprocal += 1
            return

        source_word = dictionary.find_by_uuid(relationship.source_word_id.value)
        target_word = dictionary.find_by_uuid(relationship.target_word_id.value)
        if source_word is None or target_word is None:
            report.relationships_skipped_endpoint_not_seedable += 1
            return

        try:
            dimension = vector_space_dimension_for(relationship.relationship_type, source_word.part_of_speech)
        except KeyError:
            report.relationships_skipped_no_mapping += 1
            return
        if dimension == VectorSpaceDimension.UNCLASSIFIED:
            report.relationships_skipped_no_mapping += 1
            return

        source_concept = self.seed_word(source_word)
        target_concept = self.seed_word(target_word)
        if source_concept is None or target_concept is None:
            report.relationships_skipped_endpoint_not_seedable += 1
            return

        if dimension in (VectorSpaceDimension.D1, VectorSpaceDimension.D3):
            self.graph.add_relationship(source_concept, self.is_a, target_concept,
                                         confidence=1.0, provenance=1.0, temporal=1.0, activation=1.0,
                                         isA_uuid=self.is_a.uuid)
        elif dimension == VectorSpaceDimension.D2:
            self.graph.add_relationship(source_concept, self.part_of, target_concept,
                                         confidence=1.0, provenance=1.0, temporal=1.0, activation=1.0,
                                         partOf_uuid=self.part_of.uuid)
        elif dimension == VectorSpaceDimension.D4_THETA:
            verb = self.causes if kind_name == "CAUSE" else self.entails
            self.graph.add_relationship(source_concept, verb, target_concept,
                                         confidence=1.0, provenance=1.0, temporal=1.0, activation=1.0)
        elif dimension == VectorSpaceDimension.SYNONYM_SIDE:
            try:
                self.graph.register_synonym(source_concept, target_concept)
            except ValueError:
                report.relationships_skipped_conflict += 1
                return
        elif dimension == VectorSpaceDimension.ANTONYM_SIGN:
            try:
                self.graph.register_antonym(source_concept, target_concept)
            except ValueError:
                report.relationships_skipped_conflict += 1
                return

        report.edges_by_dimension[dimension.value] = report.edges_by_dimension.get(dimension.value, 0) + 1
