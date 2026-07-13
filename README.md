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

The four Architectural Layers are root folders directly under
`src/lira/` -- there is no `host/` or `domain/` package on disk.

```
src/lira/
├── __init__.py             re-exports LIRAHost, Domain, HostController
│
│   # Every layer below follows the Repository Layout rule:
│   # by Architectural Layer, then by artefact purpose --
│   # documentation/, data/, agents/, role/, api/, ui/, assets/.
│   # agents/ = base *Agent class + concrete subclasses.
│   # role/   = plain service/controller classes, not *Agent subclasses.
│   # See ARCHITECTURE.md's "Repository Layout" section.
│
├── vocabulary/             Vocabulary Layer -- also owns the lexicon (Rule 17)
│   ├── documentation/
│   ├── data/                 VocabularyLayer, dictionary.py (Dictionary, DictionaryEntry)
│   ├── agents/                VocabularyAgent, Seed/Lookup/Hydrate/Normalise
│   ├── role/                  DictionaryProcessor, AsyncDictionaryHydrator, ExternalDictionaryAdapter
│   └── api/, ui/, assets/   (none yet)
├── linguistics/            Linguistics Layer
│   ├── documentation/
│   ├── data/                 LinguisticsLayer, units.py (Word/Clause/Sentence/
│   │                          Paragraph/Subject/UserPrompt), tensor.py, system_property.py,
│   │                          grammar_configuration.py
│   ├── agents/                 LinguisticsAgent (no concrete subclasses yet)
│   ├── role/                   GraphProcessor, PromptTokenizer, LinguisticLexer,
│   │                           ClauseSegmentationUtility
│   └── api/, ui/, assets/   (none yet)
├── value_objects/          Value Objects Layer
│   ├── documentation/
│   ├── data/                 ValueObjectsLayer
│   ├── agents/                 ValueObjectAgent, Parse/Validate/Convert/Normalise
│   ├── role/                   (none yet)
│   └── api/, ui/, assets/   (none yet)
└── knowledge/              Knowledge Layer -- also the repo's home for every
    │                       Host/Domain artefact, by the same Layer>purpose rule
    ├── documentation/
    ├── data/                  KnowledgeLayer, TensorLiraGraph (+ ConceptRef,
    │                          SystemPropertyRef, RelationshipRef, enums);
    │                          Domain, DomainSystemProperties, DomainSystemTensor, KnownDomains;
    │                          LIRAHost, HostSystemProperties, HostSystemTensor, HostedDomains, KnownHosts;
    │                          tensor_view.py (shared NamedTensor/NamedTensorProperties base)
    ├── agents/                  KnowledgeAgent, Bind/Infer/Train/Evaluate/Promote/Compartmentalise;
    │                            DomainAgent
    ├── role/                    DomainController, HostController
    └── api/, ui/, assets/   (none yet)
```

`Domain`, `LIRAHost`, `DomainController`, and `HostController` (LIRA's
own class for talking to the Kubernetes/WASI substrate, renamed from
`KubernetesManagementPlane`) all live in `lira.knowledge` even though,
at runtime, a `LIRAHost` contains `Domain`s, a `Domain` contains a
`KnowledgeLayer`, and `DomainController` sits inside `Domain` -- physical
file placement follows artefact purpose, not the runtime object graph.
`from lira import LIRAHost, Domain, HostController` and
`from lira.knowledge import LIRAHost, Domain, DomainController,
DomainAgent, HostController` both work; there is no `lira.host`,
`lira.host.domain`, or `lira.management_plane` import path anymore.

`LinguisticsLayer` takes a Vocabulary `DictionaryProcessor` as a
constructor argument rather than owning its own lexicon --
`Domain.__init__` builds `vocabulary` first and passes
`vocabulary.dictionary_processor` into `LinguisticsLayer`. Linguistics
only ever references that type as a string-quoted, unimported type hint
(never a real import), because `vocabulary`'s own modules import
Linguistics's `units.py` (for `Word`/`Punctuation`/`PartOfSpeech`) --
a real top-level import in both directions would form an import cycle.

## Install

```
pip install -e .
```
