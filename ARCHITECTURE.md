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
                │   └── Vocabulary Agents
                ├── Linguistics Layer
                │   └── Linguistics Agents
                ├── Value Objects Layer
                │   └── Value Object Agents
                └── Knowledge Layer
                    └── Knowledge Agents
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
  replica management, fault tolerance, domain migration, semantic
  gravity placement, Kubernetes management-plane requests, and health
  monitoring.

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
