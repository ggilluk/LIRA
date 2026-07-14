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
            │   └── GraphProcessor, PromptTokenizer, ...   // composed services, not an Agents folder
            ├── Value Objects Layer
            │   └── Value Object Agents (Folder)
            └── Knowledge Layer
                └── Knowledge Agents (Folder)
```

Kubernetes / WASI itself is not a node in this tree: it is external
infrastructure, not something that contains a Host. LIRA's own
`HostController` (`lira.knowledge.HostController`) is the LIRA-owned
class that talks to it -- `DomainController`s request placement through
their `HostController`, which is the only thing that ever reaches into
Kubernetes/WASI directly. LIRA runs only as container or WASI
workloads, but LIRA's own object model starts at Host, not at the
external scheduler that placed it (see Execution Model below).

## Component notes

- **LIRA Host** (`lira.LIRAHost` / `lira.knowledge.LIRAHost`) -- the
  top-level runtime unit. Owns host-level system state
  (`HostSystemProperties`, `HostSystemTensor`), a by-reference registry
  of other hosts (`KnownHosts`), and the Domains it currently hosts
  (`HostedDomains`). Physically defined in `knowledge/data/`
  (see Repository Layout below) -- the tree above is the runtime
  containment structure, not the file layout. There is no `host/` or
  `domain/` package on disk; `lira.knowledge` is where these types
  actually live. Every `LIRAHost` auto-creates a reserved `Domain`
  named `Common` on construction; `LIRAHost.get_or_create_domain(name)`
  returns an already-hosted Domain by that name or creates one, seeding
  its Vocabulary from Common's Dictionary first (Cross-Domain
  Vocabulary, `vocabulary/documentation/README.md` 9) -- the trigger
  point for giving a word-sense conflict its own Domain.

- **Domain** (`lira.Domain` / `lira.knowledge.Domain`) -- LIRA's
  semantic and computational boundary; Domains partition knowledge.
  Composes a `DomainController` for operations, domain-level system
  state (`DomainSystemProperties`, `DomainSystemTensor`), a by-reference
  registry of other domains (`KnownDomains`), and four processing
  layers. Physically defined in `knowledge/data/` alongside `LIRAHost`
  (see Repository Layout below).

- **DomainController** -- the operational control loop for a Domain:
  replica management (two Replica Domains in two other availability
  zones), fault tolerance, domain migration, semantic gravity placement,
  requests issued through its `HostController`, and health monitoring.
  Physically defined in `knowledge/role/` (Role, not Agent -- see
  Repository Layout below).

- **HostController** -- LIRA's own class for talking to the actual
  Kubernetes/WASI substrate: schedule workload, select node, select
  availability zone, attach persistence, start/stop container (see
  Execution Model). A `DomainController` holds a reference to one and
  issues requests to it rather than reaching into Kubernetes/WASI
  directly. Physically defined in `knowledge/role/` alongside
  `DomainController`.

- **Domain Agents** -- specialist agents that operate at the Domain
  level, across artefacts that don't belong to a single layer (e.g.
  cross-layer orchestration). A Domain may introduce these without
  modifying the LIRA core (Specialisation principle). The base
  `DomainAgent` class is physically defined in `knowledge/agents/`.

- **Vocabulary Layer** -- term/lexeme-level concept identity (surface
  form to concept resolution), run by Vocabulary Agents. Also owns the
  lexicon: `VocabularyLayer` wires together a `Dictionary` (lexical
  inventory only, Rule 17; one class per file, `dictionary.py` and
  `dictionary_entry.py`) fed by an `AsyncDictionaryHydrator`
  (background, deduplicated external lookups via
  `ExternalDictionaryAdapter`) through `DictionaryProcessor`
  (look up an entry, or seed a fallback one and queue hydration for it).
  `Domain.linguistics` resolves tokens through
  `Domain.vocabulary.dictionary_processor` rather than Linguistics
  keeping its own copy of the lexicon. `PartOfSpeech` (`data/`, numeric
  tensor-ready values), `Word`, and `Punctuation` also live here rather
  than in Linguistics -- a word's part of speech, meaning, and its
  status as a lexical unit at all are lexical attributes (Rule 17).
  `Word` and `Punctuation` each still subclass Linguistics's
  `LinguisticUnit` (a real, necessary import: inheritance needs the
  actual base class, not just a hint), so the cycle runs the other way
  here -- Linguistics's own `Clause.tokens` and
  `ClauseSegmentationUtility` reference `Word`/`Punctuation` only as
  string-quoted, unimported type hints, and `GraphProcessor` (which
  actually constructs and `isinstance`-checks them, not just holds a
  hint) imports them locally inside `process_token`/`process_sentence`,
  deferred until first call, by which point both layers have finished
  loading. `DictionaryEntry.meaning` is a `value_objects` `Text`, not a
  plain `str` -- `ExternalDictionaryAdapter` returns one directly from
  the parsed API payload, and `Word.definition` (a plain `str`) is
  populated from its `.value`.

- **Linguistics Layer** -- grammar/syntax-level processing (parsing,
  morphology) that feeds concept and relationship extraction. Does not
  follow the Agents-folder convention the other three layers use: its
  processing doesn't decompose cleanly into that shape, so it's a set of
  composed services instead. `LinguisticController` (`linguistics/role/`
  -- Role, not Data, same as `DomainController`) takes a Vocabulary
  `DictionaryProcessor` (constructor-injected, since the lexicon belongs
  to Vocabulary, not Linguistics) and wires together a `LinguisticLexer`
  (regex tokenisation and abbreviation-aware sentence splitting) and
  `ClauseSegmentationUtility` (splits a sentence's tokens into clauses
  using a `GrammarConfigurator` of conjunctions/delimiters -- also
  `linguistics/role/`, the role those two consult for their rules rather
  than a passive data record), and a `GraphProcessor` that composes all
  of the above (calling into Vocabulary's `DictionaryProcessor` to
  resolve each token) into the Word/Punctuation -> Clause -> Sentence ->
  Paragraph -> Subject tree (`linguistic_unit.py` for the shared base;
  `Word`/`Punctuation` live in Vocabulary, see above; `clause.py`,
  `sentence.py`, `paragraph.py`, `subject.py`, one file per concrete
  kind, all in `data/`), each node carrying a `LinguisticSystemProperty` -- a
  by-reference view into `LinguisticSystemPropertyTensor` (Rule 14),
  same discipline as `SystemPropertyRef` in the Knowledge Layer: one
  growable, amortized-doubling row per unit holding its numeric fields
  (sequence number, kind code, confidence/provenance/temporal/
  activation, inference depth, valence/arousal/dominance); the uuid,
  origin, and the live `linguistic_unit` backref stay in plain Python
  lists alongside it, mirroring TensorLiraGraph's `_edge_uuid` /
  `_concept_names` convention. `PromptTokenizer` is the entry point for
  a `UserPrompt` (`linguistics/ui/` -- the raw input at the layer's
  boundary, before any processing).

- **Value Objects Layer** -- parses and normalises primitive values
  (measures, quantities, codes, identifiers, dates) into typed value
  object instances before they enter the Knowledge Layer, run by Value
  Object Agents. The typed instances themselves (`value_objects/data/`)
  are the full UN/CEFACT Core Components Technical Specification
  (CCTS) Core Component Type catalogue -- each a content component
  (`value`) plus that type's supplementary components:
  - `Text` (`language_id`)
  - `Number` (Numeric. Type -- content only, no supplementary components)
  - `Percent` (content only, no supplementary components)
  - `Indicator` (content only, boolean, no supplementary components)
  - `Code` (`name`, `language_id`, and the code-list identification
    set -- `list_id`, `list_agency_id`, `list_agency_name`,
    `list_name`, `list_version_id`, `list_uri`, `list_scheme_uri`)
  - `Identifier` (the scheme identification set -- `scheme_id`,
    `scheme_name`, `scheme_agency_id`, `scheme_agency_name`,
    `scheme_version_id`, `scheme_data_uri`, `scheme_uri`)
  - `Quantity` and `Measure` (`unit_code` and its code-list
    identification set -- `unit_code_list_id`,
    `unit_code_list_agency_id`, `unit_code_list_agency_name`)
  - `Amount` (`currency_id`, `currency_code_list_version_id`)
  - `Rate` (`base_unit_measure_unit_code`, `per_unit_measure_unit_code`,
    plus the `Amount` currency pair, for ratios like exchange rates or
    speeds)
  - `DateTime` (`format`)
  - `BinaryObject`, `Graphic`, `Picture`, `Sound`, `Video` (the binary
    content set -- `format`, `mime_code`, `character_set_code`,
    `encoding_code`, `filename`, `uri`; distinct CCTs sharing the same
    supplementary component shape)

- **Knowledge Layer** -- owns the Domain's one authoritative tensor
  store (`TensorLiraGraph`): dense (confidence, provenance, temporal,
  activation) matrices updated in O(1) per relationship, plus the
  Band 1-5 agents (attribute completion, generalisation discovery,
  compartmentalisation, cross-domain generalisation, output attribute
  completion) that read and write it by reference.

Agents and Role are two separate folders per layer, not one merged
bucket: `agents/` holds the base `*Agent` class and its concrete
subclasses (Rule 15/16); `role/` holds plain service/controller classes
that play an active role without being shaped like an `*Agent`.
Vocabulary, Value Objects and Knowledge all have real `*Agent`
subclasses in `agents/` (`vocabulary/agents/`, `value_objects/agents/`,
`knowledge/agents/`). Vocabulary and Knowledge also have `role/`
classes: Vocabulary's lexicon services (`DictionaryProcessor`,
`AsyncDictionaryHydrator`, `ExternalDictionaryAdapter`) in
`vocabulary/role/`, and `DomainController`/`HostController` in
`knowledge/role/`. Domain Agents (the base `DomainAgent` class) follow
the Agent convention, physically at `knowledge/agents/domain_agent.py`,
even though they sit at the Domain level rather than inside the
Knowledge Layer specifically. Linguistics has no concrete `*Agent`
subclasses yet (`linguistics/agents/` holds only the base
`LinguisticsAgent`) -- all its processing classes (`GraphProcessor`,
`LinguisticLexer`, `ClauseSegmentationUtility`, `PromptTokenizer`) are
`role/` services instead, since this processing doesn't decompose
cleanly into `*Agent` subclasses. Value Objects has no `role/` classes
yet.

## Repository Layout (Configuration Management)

This is a physical-file-organisation rule, separate from namespace
naming: it governs where a file lives on disk, not what it's called or
imported as. It currently applies to the four Domain-internal layers
(Vocabulary, Linguistics, Value Objects, Knowledge) plus every Host and
Domain artefact, per below, including `HostController` (Agents/Role,
LIRA's own class for talking to the Kubernetes/WASI substrate). The
actual Kubernetes/WASI runtime is external infrastructure, not part of
LIRA's own object model (see above), and is the only thing unaffected
by this rule.

The four layers are root folders directly under `src/lira/` -- there is
no `host/`, `domain/`, or `management_plane/` package on disk. `src/lira/`
contains `vocabulary/`, `linguistics/`, `value_objects/`, `knowledge/`,
and the top-level `__init__.py`. Nothing else.

1. **By Architectural Layer** -- `vocabulary/`, `linguistics/`,
   `value_objects/`, `knowledge/`.
2. **Then by artefact purpose**, within each layer:
   - `documentation/` -- a short per-layer `README.md` (the canonical,
     full description stays in this file).
   - `data/` -- state-holding types: the layer's `*Layer` container
     class, and any other class whose primary job is holding data (e.g.
     `TensorLiraGraph`, `LinguisticSystemPropertyTensor`, `Dictionary`,
     the `Word`/`Clause`/... tree, `ConceptRef`). A Dictionary is a
     lexicon, i.e. lexical inventory (Rule 17), so it lives in
     Vocabulary's `data/`, not Linguistics's, even though Linguistics is
     what actually calls into it.
   - `agents/` -- the base `*Agent` class and its concrete subclasses
     (Rule 15/16).
   - `role/` -- processor/service/controller classes that play an
     active role without being `*Agent` subclasses (e.g.
     `GraphProcessor`, `DomainController`, `DictionaryProcessor`) --
     kept separate from `agents/` even though both are
     behaviour-playing, since an `*Agent` subclass and a plain service
     class are different shapes.
   - `api/` -- none yet, for any layer.
   - `ui/` -- none yet, for any layer.
   - `assets/` -- none yet, for any layer.

**Knowledge is the repository's home for core artefact types generally**,
not just Knowledge-layer-specific ones -- every Host and Domain artefact
is sorted into Knowledge's purpose buckets by the same rule as anything
else:
- `knowledge/data/` -- `Domain`, `DomainSystemProperties`,
  `DomainSystemTensor`, `KnownDomains`, `LIRAHost`,
  `HostSystemProperties`, `HostSystemTensor`, `HostedDomains`,
  `KnownHosts`, and the shared `NamedTensor`/`NamedTensorProperties`
  base (`tensor_view.py`), alongside `KnowledgeLayer` and
  `TensorLiraGraph`.
- `knowledge/agents/` -- `KnowledgeAgent` and the Band 1-5 concrete
  agents, alongside `DomainAgent`.
- `knowledge/role/` -- `DomainController` and `HostController` (LIRA's
  own class for talking to the Kubernetes/WASI substrate -- see below).
- `knowledge/documentation/`, `knowledge/api/`, `knowledge/ui/`,
  `knowledge/assets/` -- Host/Domain have no distinct artefacts here
  yet, so nothing to move.

This holds even though, at runtime, a `LIRAHost` *contains* `Domain`s
and a `Domain` *contains* a `KnowledgeLayer` -- the reverse of the
physical nesting. Physical file placement follows artefact purpose, not
the runtime object graph (see the note on the component tree above).

Each layer's `__init__.py` stays a stable public import surface (e.g.
`from lira.knowledge import KnowledgeLayer, Domain, LIRAHost,
DomainController, DomainAgent` all work, as does the shorter
`from lira import Domain, LIRAHost`) -- these are thin re-export facades
over `data/`, `agents/`, and `role/`, not where the classes are actually
defined anymore. `lira.host` and `lira.host.domain` no longer exist as
import paths.

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

**HostController performs** (`lira.knowledge.HostController`, LIRA's
class for talking to the Kubernetes/WASI substrate):
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
`knowledge/agents/compartmentalise_agent.py` ->
`CompartmentaliseAgent`), ready to be registered on the layer via
`.register(...)` once implemented -- except Vocabulary's "lookup" and
"hydrate", which are already real, working services rather than stubs:
`DictionaryProcessor.get_or_create_entry` (lookup, falling back to seed
a new entry) and `AsyncDictionaryHydrator` (hydrate, via a background,
deduplicated worker thread calling `ExternalDictionaryAdapter`).
Linguistics implements its typical agents directly as working services
(not stubs) too: `LinguisticLexer.extract_tokens` (tokenise),
`GraphProcessor.process_token`/`ClauseSegmentationUtility` (parse),
`LinguisticLexer.split_sentences` (classify sentence/paragraph
boundaries), and `GraphProcessor.process_sentence` /
`process_paragraph` / `process_subject` (structure) -- calling into
Vocabulary's `DictionaryProcessor` to resolve each token.
