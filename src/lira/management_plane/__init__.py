"""Kubernetes / WASI Management Plane: the substrate LIRA runs on.
Infrastructure Separation principle -- Kubernetes performs infrastructure
orchestration; LIRA (via each Domain's DomainController) decides semantic
intent. Kubernetes PERFORMS: schedule workload, select node, select
availability zone, attach persistence, start/stop container.
"""


class KubernetesManagementPlane:
    """Placeholder for the concrete scheduler/controller integration once
    LIRA targets a real Kubernetes or WASI runtime. A DomainController
    holds a reference to one of these and issues requests to it; it never
    reaches into Kubernetes directly."""

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
