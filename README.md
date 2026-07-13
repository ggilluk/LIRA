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
├── __init__.py             re-exports LIRAHost, Domain, KubernetesManagementPlane
├── tensor_view.py          NamedTensor / NamedTensorProperties (shared by-reference view base)
├── management_plane/       KubernetesManagementPlane -- external infra LIRA requests placement from
└── host/                   re-export facade for LIRAHost (see knowledge/data_classes/ below)
    └── domain/             re-export facade for Domain (see knowledge/data_classes/ below)
        ├── controller.py     DomainController (replicas, migration, semantic placement, health)
        ├── agents/           Domain Agents -- specialist agents not tied to one layer
        │
        │   # The four layers below follow the Repository Layout rule:
        │   # by Architectural Layer, then by artefact purpose --
        │   # documentation/, data_classes/, agents_role/, apis/, uis/, assets/.
        │   # See ARCHITECTURE.md's "Repository Layout" section.
        │
        ├── vocabulary/       Vocabulary Layer
        │   ├── documentation/
        │   ├── data_classes/  VocabularyLayer
        │   ├── agents_role/   VocabularyAgent, Seed/Lookup/Hydrate/Normalise
        │   └── apis/, uis/, assets/   (none yet)
        ├── linguistics/      Linguistics Layer
        │   ├── documentation/
        │   ├── data_classes/  LinguisticsLayer, units.py (Word/Clause/Sentence/
        │   │                  Paragraph/Subject/UserPrompt), tensor.py, system_property.py,
        │   │                  dictionary.py, grammar_configuration.py
        │   ├── agents_role/   GraphProcessor, PromptTokenizer, LinguisticLexer,
        │   │                  ClauseSegmentationUtility, DictionaryProcessor,
        │   │                  AsyncDictionaryHydrator, ExternalDictionaryAdapter
        │   └── apis/, uis/, assets/   (none yet)
        ├── value_objects/    Value Objects Layer
        │   ├── documentation/
        │   ├── data_classes/  ValueObjectsLayer
        │   ├── agents_role/   ValueObjectAgent, Parse/Validate/Convert/Normalise
        │   └── apis/, uis/, assets/   (none yet)
        └── knowledge/        Knowledge Layer -- also the repo's home for Host/Domain Data Classes
            ├── documentation/
            ├── data_classes/  KnowledgeLayer, TensorLiraGraph (+ ConceptRef,
            │                  SystemPropertyRef, RelationshipRef, enums);
            │                  Domain, DomainSystemProperties, DomainSystemTensor, KnownDomains;
            │                  LIRAHost, HostSystemProperties, HostSystemTensor, HostedDomains, KnownHosts
            ├── agents_role/   KnowledgeAgent, Bind/Infer/Train/Evaluate/Promote/Compartmentalise
            └── apis/, uis/, assets/   (none yet)
```

`Domain` and `LIRAHost` physically live in `knowledge/data_classes/`
even though, at runtime, a `LIRAHost` contains `Domain`s and a `Domain`
contains a `KnowledgeLayer` -- physical file placement follows artefact
purpose, not the runtime object graph. `lira.host`, `lira.host.domain`,
and `lira.host.domain.knowledge` all still export the classes you'd
expect (`from lira import LIRAHost, Domain` keeps working).

## Install

```
pip install -e .
```
