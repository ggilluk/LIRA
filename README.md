# LIRA

LIRA is a tensor-native knowledge graph platform. Dense weight tensors
(confidence, provenance, temporal, activation) are the persistent,
canonical storage for a Domain's knowledge -- not a snapshot rebuilt from
an object graph -- so every read sees live state and every write is O(1).

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full component tree.

## Layout

```
src/lira/
├── management_plane/      Kubernetes / WASI Management Plane
└── host/                  LIRA Host
    ├── host.py             LIRAHost
    ├── system_properties.py
    ├── system_tensor.py
    ├── known_hosts.py
    ├── hosted_domains.py
    └── domain/             Domain
        ├── domain.py
        ├── controller.py
        ├── system_properties.py
        ├── system_tensor.py
        ├── known_domains.py
        ├── vocabulary/     Vocabulary Layer + Agents
        ├── linguistics/    Linguistics Layer + Agents
        ├── value_objects/  Value Objects Layer + Agents
        └── knowledge/      Knowledge Layer + Agents (TensorLiraGraph)
```

## Install

```
pip install -e .
```
