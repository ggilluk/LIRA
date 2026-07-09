# LIRA Full Component Architecture

```
LIRA
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
            ├── Domain Agents (Folder)
            ├── Vocabulary Layer
            │   └── Vocabulary Agents (Folder)
            ├── Linguistics Layer
            │   └── Dictionary, GraphProcessor, PromptTokenizer, ...   // composed services, not an Agents folder
            ├── Value Objects Layer
            │   └── Value Object Agents (Folder)
            └── Knowledge Layer
                └── Knowledge Agents (Folder)
```

Kubernetes / WASI is not a node in this tree: it is external
infrastructure that LIRA's `DomainController`s request placement from
(`lira.management_plane.KubernetesManagementPlane`), not something that
contains a Host. LIRA runs only as container or WASI workloads, but
LIRA's own object model starts at Host, not at the scheduler that placed
it (see Execution Model below).

## Component notes

- **LIRA Host** (`lira.host.LIRAHost`) -- the top-level runtime unit.
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

- **Domain Agents** -- specialist agents that operate at the Domain
  level, across artefacts that don't belong to a single layer (e.g.
  cross-layer orchestration). A Domain may introduce these without
  modifying the LIRA core (Specialisation principle).

- **Vocabulary Layer** -- term/lexeme-level concept identity (surface
  form to concept resolution), run by Vocabulary Agents.

- **Linguistics Layer** -- grammar/syntax-level processing (parsing,
  morphology) that feeds concept and relationship extraction. Does not
  follow the Agents-folder convention the other three layers use: its
  processing doesn't decompose cleanly into that shape, so it's a set of
  composed services instead. `LinguisticsLayer` wires together a
  `Dictionary` (lexicon) fed by an `AsyncDictionaryHydrator` (background,
  deduplicated external lookups via `ExternalDictionaryAdapter`) through
  `DictionaryProcessor`, a `LinguisticLexer` (regex tokenisation and
  abbreviation-aware sentence splitting) and `ClauseSegmentationUtility`
  (splits a sentence's tokens into clauses using a
  `LinguisticGrammarConfiguration` of conjunctions/delimiters), and a
  `GraphProcessor` that composes all of the above into the
  Word/Punctuation -> Clause -> Sentence -> Paragraph -> Subject tree
  (`units.py`), each node carrying a `LinguisticSystemProperty`.
  `PromptTokenizer` is the entry point for a `UserPrompt`.

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

Vocabulary, Value Objects and Knowledge's Agents are each a folder
(`vocabulary/agents/`, `value_objects/agents/`, `knowledge/agents/`),
not a separate top-level layer -- concrete agents live as sibling
modules of the base `*Agent` class defined in each `agents/__init__.py`
(Rule 15/16). Domain Agents follow the same convention
(`domain/agents/`), but sit at the Domain level rather than inside one
specific layer. Linguistics is the exception: its artefact-processing
classes (`GraphProcessor`, `DictionaryProcessor`, etc.) don't fit that
shape, so they're plain composed services in the `linguistics/` package
instead of an `agents/` folder -- still inside the layer whose
artefacts they manage (Rule 16), just not wrapped in an `*Agent` base
class.

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

## Design Statements by Principle

| Design Principle | Architecture Component | Design Statement | Rationale |
|---|---|---|---|
| Performance | SystemTensor | Every root component owns a dedicated tensor-backed state store. | Enables compact, vectorised computation with minimal memory overhead. |
| Performance | SystemProperties | SystemProperties is a by-reference view onto the SystemTensor. | Eliminates duplicated state while exposing strongly typed accessors. |
| Scalability | Host | Host is the runtime execution boundary. | Supports single-process, clustered, and distributed deployments using the same architecture. |
| Scalability | HostedDomains | Domains execute independently within a Host. | Domains can be loaded, unloaded, migrated, replicated, or scaled independently. |
| Distribution | KnownHosts | KnownHosts exposes other Hosts by reference. | Enables distributed reasoning without copying runtime state. |
| Modularity | Domain | Domain is the semantic and computational boundary. | Keeps knowledge isolated, versioned and independently deployable. |
| Composability | KnownDomains | KnownDomains exposes external Domains by reference. | Allows semantic reuse while preserving ownership boundaries. |
| Correctness | Vocabulary Layer | Contains lexical inventory only. | Separates words, symbols and identifiers from meaning. |
| Correctness | Linguistics Layer | Contains language structure only. | Separates grammar from semantics. |
| Correctness | Value Objects Layer | Contains typed value objects without semantic qualification. | Ensures data remains independent of knowledge. |
| Explainability | Knowledge Layer | Qualifies Value Objects through Concepts, Attributes and Relationships. | Makes reasoning explicit, inspectable and traceable. |
| Extensibility | Agents | Agents exist within the layer whose artefacts they manipulate. | Keeps behaviour close to data while avoiding an unnecessary agent framework. |
| Specialisation | Domain Agents | Domains may introduce specialist agents. | Enables domain expertise without modifying the LIRA core. |
| Consistency | Root Components | Every root component follows Object -> SystemProperties -> SystemTensor. | Provides one uniform execution model across the entire platform. |
| Governance | Host | Host governs runtime execution, scheduling and resource management. | Separates infrastructure concerns from semantic concerns. |
| Governance | Domain | Domain governs concepts, vocabulary and knowledge evolution. | Preserves semantic ownership independently of runtime deployment. |
| Loose Coupling | KnownHosts / KnownDomains | Cross-boundary references are always by reference. | Prevents duplication and maintains a single authoritative source of truth. |

## Layer Summary

| Layer | Primary Artefacts | Responsibility | Typical Agents |
|---|---|---|---|
| Vocabulary Layer | Words, identifiers, symbols, language codes, currency codes | Lexical inventory | Seed, lookup, hydrate, normalise vocabulary |
| Linguistics Layer | Tokens, phrases, syntax, sentence structures | Language analysis | Tokenise, parse, classify, structure language (implemented as `LinguisticLexer`, `ClauseSegmentationUtility` and `GraphProcessor`, not `*Agent` classes -- see Component notes) |
| Value Objects Layer | Numbers, strings, dates, measurements, units, currencies, coordinates and other unqualified value types | Typed data representation | Parse, validate, convert, normalise values |
| Knowledge Layer | Concepts, Attributes, Relationships, Generalisations | Semantic representation and reasoning | Bind, infer, train, evaluate, promote, compartmentalise |

Each "Typical Agent" for Vocabulary, Value Objects and Knowledge is
stubbed as a concrete `*Agent` subclass in its layer's `agents/` folder
(e.g. `vocabulary/agents/seed_agent.py` -> `SeedAgent`,
`knowledge/agents/compartmentalise_agent.py` -> `CompartmentaliseAgent`),
ready to be registered on the layer via `.register(...)` once
implemented. Linguistics implements its typical agents directly as
working services (not stubs) instead: `LinguisticLexer.extract_tokens`
(tokenise), `GraphProcessor.process_token`/`ClauseSegmentationUtility`
(parse), `LinguisticLexer.split_sentences` (classify sentence/paragraph
boundaries), and `GraphProcessor.process_sentence` /
`process_paragraph` / `process_subject` (structure).
