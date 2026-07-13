"""HostController: the Host-level counterpart to DomainController --
handles infrastructure operations for a Host (scheduling, node/AZ
selection, persistence, container lifecycle) that back a Kubernetes or
WASI runtime. Infrastructure Separation principle -- HostController
performs infrastructure orchestration; LIRA (via each Domain's
DomainController) decides semantic intent.
"""


class HostController:
    """Placeholder for the concrete scheduler/controller integration once
    LIRA targets a real Kubernetes or WASI runtime. A DomainController
    holds a reference to one of these and issues requests to it; it never
    reaches into Kubernetes/WASI directly."""

    def schedule_workload(self, workload):
        raise NotImplementedError

    def select_node(self, criteria):
        raise NotImplementedError

    def select_availability_zone(self, criteria):
        raise NotImplementedError

    def attach_persistence(self, workload):
        raise NotImplementedError

    def start_container(self, workload):
        raise NotImplementedError

    def stop_container(self, workload):
        raise NotImplementedError
