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
        └── knowledge/        Knowledge Layer
            ├── documentation/
            ├── data_classes/  KnowledgeLayer, TensorLiraGraph (+ ConceptRef,
            │                  SystemPropertyRef, RelationshipRef, enums)
            ├── agents_role/   KnowledgeAgent, Bind/Infer/Train/Evaluate/Promote/Compartmentalise
            └── apis/, uis/, assets/   (none yet)
```

## Install

```
pip install -e .
```
