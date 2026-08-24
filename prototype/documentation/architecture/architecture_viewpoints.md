# LIRA Architecture Viewpoints

**Standard Alignment:** ISO/IEC/IEEE 42010 — Architecture Description  
**Architecture:** Linguistically Integrated Reasoning Architecture (LIRA) TypeScript Prototype  
**Documentation Root:** `prototype/documentation/`  
**Status:** Architecture viewpoint baseline

---

# 1. Purpose

This document defines the architecture viewpoints used to describe the LIRA prototype. It is the governing viewpoint catalogue for architecture descriptions held under `prototype/documentation/`.

The document is aligned to the concepts of ISO/IEC/IEEE 42010: an architecture description identifies stakeholders and their concerns, selects architecture viewpoints that frame those concerns, and contains architecture views that conform to those viewpoints. A **viewpoint** therefore defines how a view is constructed; a **view** is the resulting representation of a particular LIRA architecture scope.

This document does not replace detailed architecture documents. It establishes the common architecture-description framework into which those documents fit.

Current detailed views include:

- `linguistics/html_crawler_and_document_processor_architecture.md` — HTML acquisition, crawl coordination, document processing, information, deployment and security views.
- `vocabulary/dictionary_web_worker_architecture.md` — Vocabulary/Dictionary service, information, deployment and security views.
- `architecture/data_entity_class_documentation_and_code_comments_guideline.md` — rules governing representation and documentation of Data Entity interfaces and their companion processing behaviour.
- `architecture/data_entity_design_decisions_log.md` — design rationale and architectural decisions associated with the data model.

---

# 2. Architecture Description Context

## 2.1 System of Interest

The system of interest is the **LIRA TypeScript Prototype**: a modular reasoning architecture in which external information is ingested, interpreted linguistically, represented through explicit Vocabulary and semantic structures, and processed by independently hosted services and computational components.

The current documented implementation boundary includes particularly mature views of:

```text
External Information
        |
        v
+-----------------------+
| Ingestion             |
| HTML Crawler          |
+-----------+-----------+
            |
            v
+-----------------------+
| Linguistics           |
| Document / Text       |
| LinguisticUnit        |
+-----------+-----------+
            |
            v
+-----------------------+
| Vocabulary            |
| Word / WordForm       |
| Sense / Phrase        |
| Relationships         |
+-----------+-----------+
            |
            v
+-----------------------+
| LIRA semantic /       |
| reasoning structures  |
+-----------------------+
```

The architecture is deliberately described independently from a single deployment mechanism. Browser Web Workers are the current prototype service hosts; they are not the definition of the domain model.

## 2.2 Architecture Description Objectives

The LIRA architecture description shall:

1. make architectural intent visible separately from implementation detail;
2. identify the concerns addressed by each view;
3. maintain traceability from requirements to architecture responsibilities;
4. distinguish data meaning from processing behaviour;
5. distinguish conceptual services from their current deployment hosts;
6. expose information and service boundaries explicitly;
7. make security and trust boundaries visible;
8. retain significant architectural decisions and rationale;
9. permit detailed architecture documents to use a consistent view structure; and
10. support evolution of the prototype without requiring one monolithic architecture diagram.

---

# 3. Stakeholders and Concerns

## 3.1 Stakeholders

| Stakeholder ID | Stakeholder | Primary Interest |
|---|---|---|
| STK-01 | LIRA Architect | Coherence of the overall architecture, principles, boundaries and evolution. |
| STK-02 | LIRA Developer | Implementable structures, interfaces, responsibilities and source-code ownership. |
| STK-03 | Data Model Designer | Meaning, identity, classification, references and constraints of LIRA data entities. |
| STK-04 | Linguistics Designer | Correct transformation of source text and documents into LIRA linguistic structures. |
| STK-05 | Vocabulary Designer | Correct representation of Words, WordForms, Senses, Phrases and lexical/semantic relationships. |
| STK-06 | Service / Runtime Designer | Worker/service boundaries, protocols, concurrency, lifecycle and isolation. |
| STK-07 | Security Reviewer | Assets, trust boundaries, untrusted input, attack paths and required controls. |
| STK-08 | Test / Verification Engineer | Measurable requirements, invariants, interfaces and traceability to testable behaviour. |
| STK-09 | Deployment / Platform Engineer | Runtime topology, resource placement, scaling and portability. |
| STK-10 | Maintainer / Contributor | Understandability, conventions, decision history and safe modification boundaries. |
| STK-11 | LIRA Consumer / Integrator | Stable service contracts, information formats and external integration boundaries. |

## 3.2 Architecture Concerns

| Concern ID | Concern | Description |
|---|---|---|
| CON-01 | Capability | What the architecture must do. |
| CON-02 | Quality | Performance, reliability, scalability, maintainability, interoperability, portability and observability expectations. |
| CON-03 | Structure | Major architectural concepts and how responsibilities are partitioned. |
| CON-04 | Behaviour | How components collaborate to perform functions. |
| CON-05 | Information | What information exists, what it means, how it is identified and how it relates. |
| CON-06 | Interfaces | Contracts and information exchanged between architectural elements. |
| CON-07 | Concurrency | Isolation, worker ownership, parallelism and scheduling. |
| CON-08 | Deployment | Mapping of software elements to runtime execution environments. |
| CON-09 | Security | Assets, trust boundaries, threats, controls and least-privilege behaviour. |
| CON-10 | Traceability | Relationship between requirements, architecture elements, information and implementation. |
| CON-11 | Standards Alignment | Appropriate use of external standards without leaking source-format peculiarities into the canonical LIRA model. |
| CON-12 | Evolution | Ability to extend models, processors, services and deployment mechanisms without destabilising unrelated concerns. |
| CON-13 | Rationale | Why significant architecture choices were made and which alternatives or constraints shaped them. |

---

# 4. Viewpoint Catalogue

The following viewpoints form the standard LIRA architecture-description set.

| Viewpoint ID | Viewpoint | Principal Concerns | Principal Stakeholders |
|---|---|---|---|
| VP-01 | Requirements Viewpoint | CON-01, CON-02, CON-09, CON-10 | STK-01, STK-07, STK-08, STK-11 |
| VP-02 | Conceptual Architecture Viewpoint | CON-03, CON-11, CON-12 | STK-01, STK-03, STK-04, STK-05, STK-10 |
| VP-03 | Service / Component Viewpoint | CON-03, CON-04, CON-06, CON-07, CON-10 | STK-01, STK-02, STK-06, STK-08 |
| VP-04 | Information Viewpoint | CON-05, CON-06, CON-10, CON-11 | STK-03, STK-04, STK-05, STK-11 |
| VP-05 | Deployment Viewpoint | CON-02, CON-07, CON-08, CON-12 | STK-02, STK-06, STK-09 |
| VP-06 | Security Viewpoint | CON-02, CON-06, CON-08, CON-09 | STK-01, STK-06, STK-07, STK-08 |
| VP-07 | Decision & Rationale Viewpoint | CON-10, CON-12, CON-13 | STK-01, STK-02, STK-03, STK-10 |

These viewpoints are complementary. No single view is intended to describe the entire architecture.

---

# 5. VP-01 — Requirements Viewpoint

## 5.1 Purpose

The Requirements Viewpoint describes the capabilities and measurable quality properties that constrain an architecture scope and establishes traceability from those requirements into architecture elements.

## 5.2 Stakeholders

LIRA Architect, Security Reviewer, Test/Verification Engineer, LIRA Consumer/Integrator, Developer.

## 5.3 Concerns Framed

- required functions;
- performance and scalability;
- reliability and recoverability;
- maintainability and modifiability;
- interoperability and standards alignment;
- portability;
- observability and operability;
- security;
- measurable acceptance boundaries; and
- requirements-to-architecture traceability.

## 5.4 Model Kinds

### Functional Requirement Model

Required tabular representation:

| Requirement ID | Requirement Statement | Requirement Rationale | Quantifiable | Value Min | Value Max |
|---|---|---|---|---|---|

Requirements use a scope-specific prefix, for example `HTML-FR-001` or `DWW-FR-001`.

### Non-Functional Requirement Model

Non-functional requirements use the same tabular form and are grouped by quality concern. Existing LIRA architecture documents use a SQUARE-aligned requirements discipline, with explicit security and quality requirements rather than implicit prose expectations.

Recommended identifier form:

```text
<SCOPE>-NFR-<CATEGORY>-<NUMBER>
```

Examples:

```text
HTML-NFR-SEC-001
DWW-NFR-PERF-001
```

### Requirements Traceability Model

A traceability table maps requirements to the architectural roles, classes, interfaces, stores, processors or deployment controls that realise them.

## 5.5 Correspondence Rules

1. Every functional requirement shall trace to at least one architecture responsibility or explicitly be marked future/not implemented.
2. Every quantified requirement shall identify the architecture mechanism by which its bound is enforced or measured.
3. Security requirements shall correspond to controls or documented hardening gaps in the Security View.
4. Requirements shall not claim future behaviour as current implementation behaviour.
5. Architecture elements shall not be introduced solely to satisfy diagrams without an identified requirement, concern, domain invariant or architectural rationale.

---

# 6. VP-02 — Conceptual Architecture Viewpoint

## 6.1 Purpose

The Conceptual Architecture Viewpoint communicates the essential architecture in domain language before implementation and deployment detail. It answers: **what are the major concepts, what is each responsible for, and how does information progress through them?**

## 6.2 Stakeholders

LIRA Architect, Data Model Designer, Linguistics Designer, Vocabulary Designer, Maintainer.

## 6.3 Concerns Framed

- separation of architectural responsibilities;
- layer/domain ownership;
- source-to-LIRA transformation;
- canonical model boundaries;
- standards alignment;
- conceptual dependencies; and
- architectural evolution.

## 6.4 Model Kinds

### Picture in Words

Every substantial architecture view should begin with a concise narrative describing the architecture using plain domain language. This is intentionally independent of source-code names where possible.

The narrative shall explain:

- the role of each major concept;
- what it owns;
- what it deliberately does not own;
- the direction of information flow; and
- the boundary between external/source concepts and canonical LIRA concepts.

### Conceptual Context Diagram

A box-and-arrow or equivalent diagram showing major concepts and directional dependencies/information flow.

Example pattern:

```text
Source
  |
  v
Acquisition / Input
  |
  v
Interpretation / Processing
  |
  v
Canonical LIRA Data
  |
  v
Downstream LIRA Capability
```

### Concept Responsibility Table

| Concept | Responsibility | Owns | Does Not Own |
|---|---|---|---|

## 6.5 Correspondence Rules

1. A conceptual element shall represent a meaningful architectural responsibility, not merely a file.
2. Source-format concepts shall be transformed at explicit boundaries into canonical LIRA concepts.
3. Presentation-only source constructs shall not become LIRA semantics without an identified semantic purpose.
4. Data and behaviour shall remain conceptually distinguishable.
5. A deployment host such as a Web Worker shall not be presented as the definition of the domain concept it hosts.
6. Conceptual dependencies shall respect LIRA layer ownership and avoid reverse dependencies introduced only for UI convenience.

---

# 7. VP-03 — Service / Component Viewpoint

## 7.1 Purpose

The Service / Component Viewpoint describes executable responsibilities, interfaces and collaborations. In the current prototype this commonly includes Web Worker services, worker clients, protocols, processors, stores and supporting classes.

## 7.2 Stakeholders

LIRA Architect, Developer, Service/Runtime Designer, Test/Verification Engineer.

## 7.3 Concerns Framed

- service decomposition;
- class/component responsibility;
- behavioural collaboration;
- concurrency and ownership;
- typed interfaces;
- lifecycle;
- fault boundaries; and
- requirement traceability.

## 7.4 Model Kinds

### UML Class / Component Diagram

The preferred notation is Mermaid `classDiagram` or another UML-compatible class/component representation.

It shall show, as appropriate:

- service/worker;
- client/facade;
- protocol;
- processors;
- data/store dependencies;
- ownership/composition; and
- significant multiplicities.

### Role/Class Responsibility Table

| Role / Class | Purpose | Key Responsibilities | Requirement Traceability |
|---|---|---|---|

### Behaviour / Collaboration Model

Use sequence or activity diagrams where behaviour cannot be understood from static structure alone.

## 7.5 Correspondence Rules

1. Every service boundary shall have an explicit interface/protocol.
2. Worker/service orchestration shall not duplicate domain-model semantics.
3. A class shown as owning mutable state shall correspond to the actual runtime owner of that state.
4. Concurrency multiplicities shall match the implementation or be explicitly marked target architecture.
5. Data Entity interfaces shall contain data only; construction and behavioural processing belong in companion processor/role functions in accordance with the Data Entity documentation guideline.
6. Temporary processing structures shall be distinguished from permanent queryable domain stores.
7. Requirement IDs shall trace to the roles/classes that realise them.

---

# 8. VP-04 — Information Viewpoint

## 8.1 Purpose

The Information Viewpoint defines the information that LIRA receives, creates, stores, references and exchanges. It describes meaning and structure independently from UI presentation and, where possible, independently from a specific runtime host.

## 8.2 Stakeholders

Data Model Designer, Linguistics Designer, Vocabulary Designer, Developer, LIRA Consumer/Integrator.

## 8.3 Concerns Framed

- information semantics;
- identity;
- classification;
- references;
- protocol payloads;
- data ownership;
- source-to-canonical transformation;
- stable versus runtime identity;
- permanent versus intermediate information; and
- information flow.

## 8.4 Model Kinds

### Information Flow Diagram

Shows information crossing architectural boundaries and the transformations applied.

### Protocol Model

For service boundaries, documents request and response/message types, correlation identifiers, status information and error semantics.

### Data Model Diagram

Preferred notation is UML/Mermaid class model showing entities, value objects, stores and cardinalities.

### Data Class Catalogue

| Data Class | Purpose | Identity / Key Information | Relationships / References |
|---|---|---|---|

## 8.5 LIRA Data Entity Convention

A LIRA Data Entity is represented as a plain TypeScript `interface`. It declares data and no behaviour. Its documented property order is:

1. Interface Documentation;
2. Identity;
3. Classification;
4. Data Attributes;
5. References; and
6. System Metadata.

Construction and derived behaviour reside in companion role/processor functions, not in the interface.

This distinction is an architecture rule because it preserves a clean separation between **what information means** and **how software acts on it**.

## 8.6 Correspondence Rules

1. Every protocol field shall have an identified meaning and owning service/domain.
2. References between Data Entities shall identify the referenced entity type and identity semantics.
3. Stable external/cross-domain identity and runtime graph identity shall not be conflated.
4. Strings representing URLs, identifiers, codes or machine metadata shall remain typed information and shall not become LinguisticUnit input solely because their physical representation is text.
5. Natural-language text at an ingestion boundary shall enter the Linguistics model through the defined text-bearing/LinguisticUnit path.
6. External source schemas such as HTML or WordNet shall be translated into LIRA-owned models rather than becoming the permanent internal API.
7. Intermediate seeding/processing information shall be labelled as such and shall not be presented as a permanent queryable model.

---

# 9. VP-05 — Deployment Viewpoint

## 9.1 Purpose

The Deployment Viewpoint describes where architectural services execute and how conceptual/service elements map to runtime resources.

## 9.2 Stakeholders

Service/Runtime Designer, Deployment/Platform Engineer, Developer, LIRA Architect.

## 9.3 Concerns Framed

- execution topology;
- process/thread/worker boundaries;
- concurrency;
- resource ownership;
- scaling;
- packaging;
- lazy loading;
- portability; and
- migration to future hosts.

## 9.4 Model Kinds

### Deployment Diagram

Shows runtime nodes and deployed services/components.

Current browser pattern:

```text
Browser / Prototype Runtime
|
+-- Main UI Thread
|
+-- Web Worker Service A
|
+-- Web Worker Service B
|   +-- owned state
|   +-- processors
|
+-- Worker Pool where required
```

### Deployment Responsibility Table

| Runtime Node | Hosted Elements | State Ownership | Scaling Unit |
|---|---|---|---|

### Resource / Capacity Constraints

Documents configured limits, worker counts, memory-sensitive structures, lazy-loaded resources and other deployment-dependent constraints.

## 9.5 Correspondence Rules

1. Every deployable service shown shall correspond to a service/component from VP-03.
2. State ownership in the Deployment View shall agree with state ownership in the Service and Information Views.
3. Current prototype deployment and target/future deployment shall be labelled separately.
4. Concurrency shall be scaled by explicit runtime units such as workers/pools rather than silently changing domain semantics.
5. Browser-only mechanisms shall not be assumed to be permanent LIRA architectural constraints where the underlying domain logic is portable.

---

# 10. VP-06 — Security Viewpoint

## 10.1 Purpose

The Security Viewpoint describes protection of LIRA assets across trust boundaries, especially where external information enters the system or services exchange messages.

## 10.2 Stakeholders

Security Reviewer, LIRA Architect, Service/Runtime Designer, Test/Verification Engineer, Deployment/Platform Engineer.

## 10.3 Concerns Framed

- external/untrusted input;
- trust boundaries;
- attack surface;
- service-message integrity;
- resource exhaustion;
- data integrity;
- code/data separation;
- output safety;
- network reachability; and
- production hardening gaps.

## 10.4 Model Kinds

### Asset Model

Identifies information and capabilities requiring protection.

### Trust Boundary Diagram

Shows transitions between external sources, UI/main thread, worker/service boundaries, stored domain state and output/rendering boundaries.

### Threat / Control Matrix

| Threat / Risk | Asset / Boundary | Architectural Control | Requirement Traceability | Status |
|---|---|---|---|---|

### Security Requirement Traceability

Security controls shall trace to `*-NFR-SEC-*` requirements in VP-01.

## 10.5 Correspondence Rules

1. Every external information source shall cross an identified trust boundary.
2. External data shall be treated as data, not executable code.
3. Worker/service commands shall be constrained to recognised protocol operations.
4. Caller-supplied domain/resource identifiers shall be validated against worker/service-owned state or policy before mutation.
5. Resource limits used as security controls shall correspond to measurable Requirements View bounds.
6. Output that can become executable markup or code shall apply the appropriate encoding/sanitisation boundary.
7. Controls required only for future privileged/server deployments shall be labelled as future hardening rather than current prototype behaviour.

---

# 11. VP-07 — Decision & Rationale Viewpoint

## 11.1 Purpose

The Decision & Rationale Viewpoint records significant architectural choices, their context, consequences and evolution. It prevents the reason for an unusual model or boundary from being lost when implementation comments are simplified.

## 11.2 Stakeholders

LIRA Architect, Developer, Data Model Designer, Maintainer/Contributor.

## 11.3 Concerns Framed

- why an architecture is shaped as it is;
- rejected or superseded alternatives;
- migration history;
- architectural invariants;
- consequences of a decision; and
- safe future modification.

## 11.4 Model Kinds

### Architecture Decision Record / Decision Log Entry

Minimum information:

| Field | Meaning |
|---|---|
| Decision / Subject | Architectural issue being decided. |
| Context | Conditions and problem that caused the decision. |
| Decision | Chosen architectural direction. |
| Rationale | Why the choice was made. |
| Consequences | Benefits, constraints and resulting obligations. |
| Related Elements | Affected data classes, processors, services or requirements. |
| Status | Current, superseded, experimental or proposed. |

The existing `data_entity_design_decisions_log.md` is a specialised decision log for the Vocabulary Data Entity model.

## 11.5 Correspondence Rules

1. A decision that changes an architecture invariant shall update the affected views.
2. Superseded rationale shall remain identifiable as historical rather than silently rewritten as current architecture.
3. Entity code comments shall describe current data meaning; historical rationale belongs in the decision/rationale documentation.
4. Decisions affecting requirements shall update requirement traceability.
5. Decisions affecting service ownership, information identity or deployment boundaries shall be reflected in the corresponding viewpoint-derived view.

---

# 12. Viewpoint Relationships

The viewpoints are intentionally connected.

```text
                    +----------------------+
                    | VP-01 Requirements   |
                    +----------+-----------+
                               |
                         constrains / traces
                               |
          +--------------------+--------------------+
          |                    |                    |
          v                    v                    v
+------------------+  +------------------+  +------------------+
| VP-02 Conceptual |  | VP-03 Service    |  | VP-04 Information|
+--------+---------+  +--------+---------+  +---------+--------+
         |                     |                      |
         |                     +----------+-----------+
         |                                |
         +----------------+---------------+
                          |
                          v
                +------------------+
                | VP-05 Deployment |
                +--------+---------+
                         |
                         v
                +------------------+
                | VP-06 Security   |
                +------------------+

VP-07 Decision & Rationale applies across every viewpoint.
```

A detailed architecture description need not repeat every fact in every view. Instead, each fact should appear in the view where it is most meaningful and be referenced/traced where another concern depends on it.

---

# 13. Cross-View Correspondence Rules

These rules govern consistency across all LIRA architecture views.

| Rule ID | Correspondence Rule |
|---|---|
| CR-001 | Every service/component in a Deployment View shall correspond to a service/component identified in the Service View. |
| CR-002 | Every information object crossing a service boundary shall be represented in the Information View or protocol model. |
| CR-003 | Every security control shall trace to a security requirement, architecture decision, or explicitly documented risk treatment. |
| CR-004 | Every mutable store shall have one identifiable runtime owner in a given deployment instance. |
| CR-005 | Requirements marked as current shall not trace exclusively to future architecture elements. |
| CR-006 | Conceptual architecture shall not depend on UI-only classes to define domain semantics. |
| CR-007 | Data Entity definitions shall describe information; behaviour shall be represented by role/processor elements. |
| CR-008 | External standard/source structures shall terminate at an explicit transformation boundary before canonical LIRA information is exposed downstream. |
| CR-009 | A permanent queryable information structure shall not be represented as temporary processing state, or vice versa. |
| CR-010 | Stable identity and runtime-instance/graph identity shall be distinguishable wherever both exist. |
| CR-011 | Worker/service protocol messages shall be structured-clone-safe in browser deployments. |
| CR-012 | Significant architectural changes shall update the Decision & Rationale View and all affected derived views. |

---

# 14. Architecture Documentation Structure

The prototype architecture documentation shall use the following organisation:

```text
prototype/documentation/
|
+-- architecture/
|   +-- architecture_viewpoints.md              <- this document
|   +-- data_entity_class_documentation_and_code_comments_guideline.md
|   +-- data_entity_design_decisions_log.md
|
+-- linguistics/
|   +-- <linguistics architecture views>
|
+-- vocabulary/
    +-- <vocabulary architecture views>
```

Additional LIRA layers should receive their own documentation folder when a layer-specific architecture view is first created. Cross-cutting viewpoint definitions, architectural principles, decision conventions and architecture-description governance remain under `documentation/architecture/`.

---

# 15. Standard Detailed Architecture Document Structure

Where applicable, new service/subsystem architecture documents should conform to the following structure derived from this viewpoint catalogue:

```text
1. Requirements View
   1.1 Functional Requirements
   1.2 Non-Functional Requirements
       - Performance / Scalability
       - Reliability
       - Maintainability
       - Interoperability / Standards
       - Portability
       - Observability
       - Security

2. Conceptual Architecture View
   2.1 Picture in Words
   2.2 Conceptual Diagram
   2.3 Responsibilities

3. Service / Component View
   3.1 UML Class / Component Diagram
   3.2 Role / Class Purpose
   3.3 Requirement Traceability
   3.4 Behaviour / Sequence Models where required

4. Information View
   4.1 Protocol / Information Flow
   4.2 Data Model
   4.3 Data Classes and Purpose

5. Deployment View
   5.1 Deployment Diagram
   5.2 Runtime Responsibilities
   5.3 Scaling / Capacity

6. Security View
   6.1 Assets
   6.2 Trust Boundaries
   6.3 Threats and Controls
   6.4 Security Requirement Traceability

7. Architecture Decisions / Current Implementation Boundary
```

A section may be marked **Not Applicable** where the viewpoint does not frame a material concern for that scope; it should not simply disappear if its absence would make the architecture description ambiguous.

---

# 16. Current Architecture View Conformance

## 16.1 HTML Crawler & Document Processor

The existing HTML architecture document already follows the core viewpoint pattern:

| Viewpoint | Existing View |
|---|---|
| VP-01 Requirements | Functional and SQUARE-aligned NFR requirements with quantitative bounds. |
| VP-02 Conceptual | Picture-in-words and conceptual crawler/processor/data flow. |
| VP-03 Service / Component | Crawler worker, processor worker pool, processor hierarchy, UML and responsibility traceability. |
| VP-04 Information | Worker protocols, information flow and HTML-aligned LIRA data model. |
| VP-05 Deployment | Browser/Vite worker topology and worker-pool scaling. |
| VP-06 Security | Assets, trust boundaries, threat/control treatment and future privileged-host hardening. |
| VP-07 Decisions | Standards-aligned HTML5 canonical model and HTML4-as-input-dialect decisions are captured in architecture rationale/current-boundary material. |

## 16.2 Dictionary Web Worker

The existing Dictionary Web Worker architecture also follows the viewpoint pattern:

| Viewpoint | Existing View |
|---|---|
| VP-01 Requirements | Functional and SQUARE-aligned NFR requirements with measurable worker/domain constraints. |
| VP-02 Conceptual | Vocabulary Service, Domain/VocabularyContext ownership and Dictionary-oriented service flow. |
| VP-03 Service / Component | Worker, client, typed protocol, seeders/processors, DictionaryView and stores. |
| VP-04 Information | Worker messages plus Word, WordForm, Sense, Phrase and relationship information structures. |
| VP-05 Deployment | Browser worker hosting, lazy WordNet loading and future service portability. |
| VP-06 Security | Typed commands, Domain validation, source-data handling, rendering boundary and hardening. |
| VP-07 Decisions | Permanent Semantic/Lexical stores versus seeding-only morphological-pointer state, identity and Domain-copy decisions are captured in the design decision material. |

---

# 17. Architecture Description Governance

1. **Viewpoints are stable; views evolve.** This catalogue should change only when LIRA needs a new class of architectural concern or representation. Detailed subsystem views may evolve frequently.
2. **Implementation is evidence, not the viewpoint.** Architecture views should be checked against current code, but should express architectural responsibility rather than merely reproduce the source tree.
3. **Current and target architecture must be distinguishable.** A future requirement or hardening control shall never be documented as already implemented.
4. **Decisions remain traceable.** Significant changes to identity, ownership, boundaries, standards mapping, permanent information or service topology shall have recorded rationale.
5. **One concern, one authoritative home.** Avoid duplicating detailed facts across views; cross-reference or trace instead.
6. **Diagrams and tables are models.** They are normative architecture-description elements when marked as current architecture, not decorative illustrations.
7. **Architecture and code conventions correspond.** The Data Entity guideline is an implementation convention supporting the Information and Service viewpoints: interfaces describe data; processors describe behaviour.
8. **Standards are adopted selectively and explicitly.** Alignment to HTML5, ISO/IEC/IEEE 42010, SQUARE or lexical sources does not mean LIRA blindly reproduces every construct of those standards or sources.

---

# 18. Summary

The LIRA prototype architecture is described through seven complementary ISO/IEC/IEEE 42010-aligned viewpoints:

```text
Requirements
     |
Conceptual Architecture
     |
Service / Component ---- Information
     |                       |
     +-----------+-----------+
                 |
             Deployment
                 |
              Security

Decision & Rationale spans all views.
```

Together these viewpoints provide a consistent mechanism for describing **what LIRA must do, what it is conceptually, how responsibilities are implemented, what information exists and flows, where services execute, how the system is protected, and why significant architectural choices were made**.

This viewpoint catalogue is the governing architecture-description framework for future documents under `prototype/documentation/`.