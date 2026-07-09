"""LIRA Host: the runtime unit scheduled by the Kubernetes / WASI
management plane. Owns host-level system state and the Domains it
currently hosts."""

from .system_properties import HostSystemProperties
from .system_tensor import HostSystemTensor
from .known_hosts import KnownHosts
from .hosted_domains import HostedDomains


class LIRAHost:
    def __init__(self, name: str):
        self.name = name
        self.system_tensor = HostSystemTensor()
        self.system_properties = HostSystemProperties(self.system_tensor)  # by-reference view (Rule 14)
        self.known_hosts = KnownHosts()  # by reference
        self.hosted_domains = HostedDomains()
