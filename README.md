# LIRA

LIRA is a tensor-native knowledge graph platform. Dense weight tensors
(confidence, provenance, temporal, activation) are the persistent,
canonical storage for a Domain's knowledge -- not a snapshot rebuilt from
an object graph -- so every read sees live state and every write is O(1).
Every root component (Host, Domain) follows the same
Object -> SystemProperties -> SystemTensor pattern: SystemProperties is
always a by-reference view onto SystemTensor, never a copy.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full component tree,
design principles, and architecture rules.

## Layout

```
src/lira/
├── tensor_view.py          NamedTensor / NamedTensorProperties (shared by-reference view base)
├── management_plane/       KubernetesManagementPlane -- external infra LIRA requests placement from
└── host/                   LIRAHost
    ├── host.py
    ├── system_properties.py
    ├── system_tensor.py
    ├── known_hosts.py       // by reference
    ├── hosted_domains.py
    └── domain/              Domain
        ├── domain.py
        ├── controller.py     DomainController (replicas, migration, semantic placement, health)
        ├── system_properties.py
        ├── system_tensor.py
        ├── known_domains.py  // by reference
        ├── agents/           Domain Agents -- specialist agents not tied to one layer
        ├── vocabulary/       Vocabulary Layer
        │   └── agents/        Seed, Lookup, Hydrate, Normalise
        ├── linguistics/      Linguistics Layer
        │   └── agents/        Tokenise, Parse, Classify, Structure
        ├── value_objects/    Value Objects Layer
        │   └── agents/        Parse, Validate, Convert, Normalise
        └── knowledge/        Knowledge Layer (TensorLiraGraph)
            └── agents/        Bind, Infer, Train, Evaluate, Promote, Compartmentalise
```

## Install

```
pip install -e .
```
