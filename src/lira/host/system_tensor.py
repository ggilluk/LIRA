"""Host-level system tensor: aggregate weight/activation state across all
Domains hosted on this node."""

import numpy as np


class HostSystemTensor:
    def __init__(self):
        self.tensor = np.zeros((0, 0))
