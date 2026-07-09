"""Domain-level system tensor: aggregate weight/activation state across
this Domain's layers."""

import numpy as np


class DomainSystemTensor:
    def __init__(self):
        self.tensor = np.zeros((0, 0))
