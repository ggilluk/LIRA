"""Registry of other known Domains, held BY REFERENCE, for cross-domain
generalisation (Band 4) and dependency resolution."""


class KnownDomains:
    def __init__(self):
        self._domains = {}  # name -> Domain reference

    def register(self, name: str, domain):
        self._domains[name] = domain

    def get(self, name: str):
        return self._domains.get(name)

    def __iter__(self):
        return iter(self._domains.values())
