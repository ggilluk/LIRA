"""Host-level system tensor: runtime state for this node, tensor-backed
so it stays compact and vectorisable (State Locality principle)."""

from lira.tensor_view import NamedTensor


class HostSystemTensor(NamedTensor):
    FIELDS = ("cpu_load", "gpu_load", "memory_used", "network_throughput", "health")
