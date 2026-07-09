# LIRA Full Component Architecture

```
LIRA
└── Kubernetes / WASI Management Plane
    └── LIRA Host
        ├── HostSystemProperties
        ├── HostSystemTensor
        ├── KnownHosts                         // by reference
        └── HostedDomains
            └── Domain
                ├── DomainController
                │   ├── Replica management
                │   ├── Fault tolerance
                │   ├── Domain migration
                │   ├── Semantic gravity placement
                │   ├── Kubernetes management-plane requests
                │   └── Health monitoring
                ├── DomainSystemProperties
                ├── DomainSystemTensor
                ├── KnownDomains               // by reference
                ├── Vocabulary Layer
                │   └── Vocabulary Agents (Folder)
                ├── Linguistics Layer
                │   └── Linguistics Agents (Folder)
                ├── Value Objects Layer
                │   └── Value Object Agents (Folder)
                └── Knowledge Layer
                    └── Knowledge Agents (Folder)
```

## Component notes

- **Kubernetes / WASI Management Plane** -- the substrate LIRA runs on.
  Schedules Hosts and, via each Domain's `DomainController`, mediates
  replica placement, fault recovery, and migration for Domains.

- **LIRA Host** (`lira.host.LIRAHost`) -- a node in the management plane.
  Owns host-level system state (`HostSystemProperties`,
  `HostSystemTensor`), a by-reference registry of other hosts
  (`KnownHosts`), and the Domains it currently hosts (`HostedDomains`).

- **Domain** (`lira.host.domain.Domain`) -- LIRA's semantic and
  computational boundary; Domains partition knowledge. Composes a
  `DomainController` for operations, domain-level system state
  (`DomainSystemProperties`, `DomainSystemTensor`), a by-reference
  registry of other domains (`KnownDomains`), and four processing
  layers.

- **DomainController** -- the operational control loop for a Domain:
  replica management (two Replica Domains in two other availability
  zones), fault tolerance, domain migration, semantic gravity placement,
  Kubernetes management-plane requests, and health monitoring.

- **Vocabulary Layer** -- term/lexeme-level concept identity (surface
  form to concept resolution), run by Vocabulary Agents.

- **Linguistics Layer** -- grammar/syntax-level processing (parsing,
  morphology) that feeds concept and relationship extraction, run by
  Linguistics Agents.

- **Value Objects Layer** -- parses and normalises primitive values
  (measures, quantities, codes, identifiers, dates) into typed
  `ValueTypeKind` instances before they enter the Knowledge Layer, run
  by Value Object Agents.

- **Knowledge Layer** -- owns the Domain's one authoritative tensor
  store (`TensorLiraGraph`): dense (confidence, provenance, temporal,
  activation) matrices updated in O(1) per relationship, plus the
  Band 1-5 agents (attribute completion, generalisation discovery,
  compartmentalisation, cross-domain generalisation, output attribute
  completion) that read and write it by reference.

Each layer's Agents are a folder (`vocabulary/agents/`,
`linguistics/agents/`, `value_objects/agents/`, `knowledge/agents/`),
not a separate top-level layer -- concrete agents live as sibling
modules of the base `*Agent` class defined in each `agents/__init__.py`
(Rule 15/16).

## Design Principles and Statements

| Principle | Component | Design statement | Rationale |
|---|---|---|---|
| Portability | Kubernetes / WASI Management Plane | LIRA runs only as container or WASI workloads. | Keeps deployment portable across edge, cloud and local runtimes. |
| Infrastructure Separation | Kubernetes / WASI Management Plane | Kubernetes performs infrastructure orchestration. | LIRA decides semantic intent; Kubernetes executes placement. |
| Execution Substrate | Host | Host provides CPU, GPU, tensor store, persistence and networking. | Keeps Hosts generic and reusable. |
| Speed | CPU | CPU executes relational reasoning, rules, graph traversal and agents. | Keeps explainable symbolic work close to the Domain. |
| Speed | GPU | GPU executes tensor operations, similarity, optimisation and learning. | Accelerates numerical reasoning without hiding semantic state. |
| State Locality | HostSystemTensor | Host runtime state is tensor-backed. | Enables compact, vectorisable host-level state. |
| State Access | HostSystemProperties | HostSystemProperties is a by-reference view into HostSystemTensor. | Avoids state duplication. |
| Semantic Boundary | Domain | Domain is the semantic and computational boundary. | Keeps each area of meaning isolated and governable. |
| Semantic Ownership | Domain | Domain owns meaning, concepts, relationships, value objects and tensor lineage. | Preserves authority and explainability. |
| Controller Encapsulation | DomainController | DomainController lives inside the Domain. | Makes survival, movement and placement part of the Domain's own responsibility. |
| Fault Tolerance | DomainController | DomainController maintains two Replica Domains in two other availability zones. | Preserves semantic continuity across zone failure. |
| Mobility | DomainController | DomainController requests migration through Kubernetes. | Domains move without Hosts owning semantics. |
| Semantic Locality | DomainController | DomainController evaluates semantic gravity for placement. | Places Domains closer to related knowledge. |
| Distribution | KnownHosts | KnownHosts exposes other Hosts by reference. | Enables host federation without copying host state. |
| Composability | KnownDomains | KnownDomains exposes other Domains by reference. | Enables cross-domain reasoning without duplicating semantic state. |
| Correctness | Vocabulary Layer | Vocabulary contains lexical inventory only. | Prevents words and symbols being confused with meaning. |
| Correctness | Linguistics Layer | Linguistics contains language structure only. | Separates grammar and sequence from semantic knowledge. |
| Correctness | Value Objects Layer | Value Objects contain typed data without semantic qualification. | Keeps raw value representation separate from meaning. |
| Explainability | Knowledge Layer | Knowledge qualifies value objects through concepts, attributes and relationships. | Makes meaning explicit and traceable. |
| Extensibility | Agents | Agents operate inside the layer whose artefacts they manage. | Keeps computation close to the artefacts it changes. |
| Consistency | Root Components | Root components follow Object + SystemProperties + SystemTensor. | Gives LIRA one uniform model for state, learning and inspection. |

## Architecture Rules

1. LIRA is deployed only as container or WASI workloads.
2. Kubernetes / WASI management plane manages infrastructure placement.
3. LIRA decides semantic intent; Kubernetes executes infrastructure action.
4. Host provides CPU, GPU, tensor store, persistence and networking.
5. Host does not own semantic knowledge.
6. Domain is the semantic and computational boundary.
7. Domain owns concepts, relationships, value objects, provenance and tensor lineage.
8. DomainController is inside the Domain.
9. DomainController manages fault tolerance, migration, replica policy and semantic placement.
10. Every Primary Domain maintains two Replica Domains in two other availability zones.
11. Replica Domains preserve semantic continuity and can be promoted.
12. KnownHosts are by-reference, not copied.
13. KnownDomains are by-reference, not copied.
14. SystemProperties are by-reference views into SystemTensor.
15. Agents are not a separate layer.
16. Agents live inside the layer whose artefacts they operate on.
17. Vocabulary contains lexical inventory only.
18. Linguistics contains language structure only.
19. Value Objects contain typed unqualified data.
20. Knowledge Layer is the only layer that assigns semantic meaning.
21. Domains gravitate toward Domains with stronger dependent knowledge relationships.
22. Concepts move to the Domain where they are most likely to be semantically owned.
23. Value Objects gravitate to the Domain where their value is first semantically initialised.
24. Semantic identity must survive movement, migration, replication and promotion.
25. Infrastructure placement may change; semantic ownership must remain explainable.

## Deployment and Resilience Rules

| Rule | Description |
|---|---|
| Container/WASI only | LIRA runs only as portable container or WASI workloads. |
| Host is substrate | Host does not own semantics; it provides execution resources. |
| Domain owns semantics | The Domain is the authoritative semantic owner. |
| Controller is inside Domain | DomainController is embedded inside the Domain, not outside it. |
| Fault tolerance is Domain-owned | The DomainController maintains resilience for its Domain. |
| Two replicas | Every Primary Domain maintains two Replica Domains in two other availability zones. |
| Kubernetes executes | Kubernetes performs infrastructure placement; LIRA decides why and when. |
| References cross boundaries | KnownHosts and KnownDomains are by reference, not copies. |

## Semantic Gravity Rules

| Object | Gravity Rule |
|---|---|
| Domains | Gravitate toward Domains with stronger dependent knowledge relationships. |
| Concepts | Move to the Domain where they are most likely to be semantically owned. |
| Value Objects | Gravitate to the Domain where their value is first semantically initialised in the data lifecycle. |

## Execution Model

**DomainController decides:**
- create replica (`DomainController.create_replica`)
- promote replica (`DomainController.promote_replica`)
- migrate domain (`DomainController.migrate_domain`)
- rebalance placement (`DomainController.rebalance_placement`)
- optimise semantic locality (`DomainController.optimise_semantic_locality`)

**Kubernetes performs** (`lira.management_plane.KubernetesManagementPlane`):
- schedule workload
- select node
- select availability zone
- attach persistence
- start/stop container

**Host provides:**
- CPU for rules and relational reasoning
- GPU for tensor operations
- tensor store
- persistence
- networking

**Domain preserves:**
- semantic identity
- concepts
- relationships
- value objects
- provenance
- tensor lineage

## Final architecture rule

Kubernetes manages infrastructure. Hosts provide execution. Domains own
meaning. DomainControllers inside Domains manage survival and movement.
Agents operate inside layers. SystemProperties expose SystemTensor by
reference.
