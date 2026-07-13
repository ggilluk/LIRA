"""Knowledge's Role classes: DomainController and HostController --
plain controller classes that play an active role without being
KnowledgeAgent/DomainAgent subclasses. See agents/ for the base
KnowledgeAgent and DomainAgent classes and their concrete subclasses."""

from .domain_controller import DomainController
from .host_controller import HostController
