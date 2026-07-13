"""The set of Domains currently hosted on this LIRA Host."""


class HostedDomains:
    def __init__(self):
        self._domains = {}  # name -> Domain

    def add(self, domain):
        self._domains[domain.name] = domain

    def get(self, name: str):
        return self._domains.get(name)

    def __iter__(self):
        return iter(self._domains.values())
