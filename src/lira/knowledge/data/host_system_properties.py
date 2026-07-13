"""HostSystemProperties is a by-reference view into HostSystemTensor
(Rule 14) -- it holds no state of its own."""

from .tensor_view import NamedTensorProperties


class HostSystemProperties(NamedTensorProperties):
    pass
