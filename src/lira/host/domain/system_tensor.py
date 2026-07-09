"""Domain-level system tensor: runtime state for this Domain, tensor-backed
so it stays compact and vectorisable (State Locality principle)."""

from ...tensor_view import NamedTensor


class DomainSystemTensor(NamedTensor):
    FIELDS = ("concept_count", "relationship_count", "activity", "replica_lag", "health")
