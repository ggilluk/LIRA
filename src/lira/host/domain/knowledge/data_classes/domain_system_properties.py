"""DomainSystemProperties is a by-reference view into DomainSystemTensor
(Rule 14) -- it holds no state of its own."""

from lira.tensor_view import NamedTensorProperties


class DomainSystemProperties(NamedTensorProperties):
    pass
