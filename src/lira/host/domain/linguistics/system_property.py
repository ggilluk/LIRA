"""Bridge metadata attached to every linguistic unit. SystemPropertyRef
is a placeholder for a reference to a native graph or tensor engine node
(e.g. a concept in the Knowledge Layer's graph) -- not wired up yet."""

from dataclasses import dataclass
from typing import Optional

from .units import LinguisticUnit, LinguisticUnitKind


class SystemPropertyRef:
    """Placeholder representing a reference to a native graph or tensor engine node."""
    pass


@dataclass
class LinguisticSystemProperty:
    concept_system_property: SystemPropertyRef
    linguistic_unit: LinguisticUnit
    kind: LinguisticUnitKind
    sequence_number: int
    linguistic_unit_uuid: str
    sequence_confidence: float = 0.0
    sequence_provenance: float = 0.0
    sequence_temporal: float = 0.0
    sequence_activation: float = 0.0
    inference_depth: int = 0
    origin: Optional[str] = None
    valence_weight: float = 0.0
    arousal_weight: float = 0.0
    dominance_weight: float = 0.0
