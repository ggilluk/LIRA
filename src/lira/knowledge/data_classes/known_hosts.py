"""Registry of other known LIRA Hosts, held BY REFERENCE (not copied), for
cross-host coordination and semantic gravity placement."""


class KnownHosts:
    def __init__(self):
        self._hosts = {}  # host_id -> LIRAHost reference

    def register(self, host_id: str, host):
        self._hosts[host_id] = host

    def get(self, host_id: str):
        return self._hosts.get(host_id)

    def __iter__(self):
        return iter(self._hosts.values())
