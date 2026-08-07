"""Knowledge Vector Space Specification section 41.11's own mapping
table, as executable code -- "The vector-space model is a
reinterpretation layer over the existing lexical semantic relationships
rather than a requirement to replace the seeded semantic_relationships
data model." This module is that reinterpretation layer's lookup: given
a Vocabulary Layer `LexicalRelationshipType` (and, for `HYPERNYM`, the
part of speech it was seeded against), which Knowledge Vector Space
Dimension does it correspond to.

Deliberately does NOT seed Concepts/edges into a TensorLiraGraph from
Vocabulary's own `Word`/`LexicalRelationship` data -- that would be a
Vocabulary-to-Knowledge materialisation pipeline, a separate, larger
integration decision (which Words become Concepts, how confidence/
provenance are chosen, whether every Domain's cache gets mirrored or
just what's referenced) this module doesn't make on its own. This is
only the mapping itself, matching spec 41.11's own scope exactly."""

from enum import Enum

from ...vocabulary.data.lexical_relationship_type import LexicalRelationshipType
from ...vocabulary.data.part_of_speech import PartOfSpeech


class VectorSpaceDimension(Enum):
    D1 = "D1"                    # Noun generalisation/specialisation
    D2 = "D2"                    # Noun composition
    D3 = "D3"                    # Verb generalisation/specificity
    D4_THETA = "D4 theta"        # Relationship dependency topology (causal/entailment angle)
    SYNONYM_SIDE = "Synonym cluster / Side"
    ANTONYM_SIGN = "Sign"
    UNCLASSIFIED = "Unclassified"


# spec 41.11's table verbatim, except HYPERNYM -- listed there against
# both "HYPERNYM / HYPONYM -> D1" and "HYPERNYM / TROPONYM -> D3" rows,
# since it's genuinely the one kind shared between nouns and verbs
# (the same fact tensor_graph.py's own D1/D3 implementation branches
# on source.kind for) -- so HYPERNYM is resolved by
# vector_space_dimension_for() below, not this static table, using the
# same signal (part of speech) that implementation already uses.
_STATIC_MAPPING = {
    LexicalRelationshipType.HYPONYM: VectorSpaceDimension.D1,
    LexicalRelationshipType.MERONYM: VectorSpaceDimension.D2,
    LexicalRelationshipType.HOLONYM: VectorSpaceDimension.D2,
    LexicalRelationshipType.TROPONYM: VectorSpaceDimension.D3,
    LexicalRelationshipType.CAUSE: VectorSpaceDimension.D4_THETA,
    LexicalRelationshipType.ENTAILMENT: VectorSpaceDimension.D4_THETA,
    LexicalRelationshipType.SYNONYM: VectorSpaceDimension.SYNONYM_SIDE,
    LexicalRelationshipType.ANTONYM: VectorSpaceDimension.ANTONYM_SIGN,
    LexicalRelationshipType.RELATED: VectorSpaceDimension.UNCLASSIFIED,
}


def vector_space_dimension_for(relationship_type: LexicalRelationshipType,
                                source_part_of_speech: PartOfSpeech = None) -> VectorSpaceDimension:
    """spec 41.11's mapping. Raises KeyError for a kind the table
    doesn't cover at all (every group 0/Morphological and group
    2/Orthographic kind, e.g. PLURAL_FORM, LEMMA_FORM -- the spec's
    table only classifies group 1/Lexical Semantic kinds) rather than
    guessing a dimension for it -- this codebase's established
    report-not-guess discipline (vocabulary/documentation/README.md's
    own Design Principles)."""
    if relationship_type == LexicalRelationshipType.HYPERNYM:
        if source_part_of_speech == PartOfSpeech.VERB:
            return VectorSpaceDimension.D3
        return VectorSpaceDimension.D1
    if relationship_type not in _STATIC_MAPPING:
        raise KeyError(f"{relationship_type} has no Knowledge Vector Space mapping (spec 41.11)")
    return _STATIC_MAPPING[relationship_type]
