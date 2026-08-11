import type { VocabularyAgent } from "../agents";
import { AsyncDictionaryHydrator } from "../role/dictionary_hydrator";
import { DictionaryProcessor } from "../role/dictionary_processor";
import { LexicalRelationshipProcessor } from "../role/lexical_relationship_processor";
import { Dictionary } from "./dictionary";
import { LexicalRelationshipStore } from "./lexical_relationship_store";
import { LexicalRelationshipSystemPropertyTensor } from "./lexical_relationship_tensor";

/** Ported from vocabulary/data/layer.py. */
export class VocabularyLayer {
  agents: VocabularyAgent[] = [];
  dictionary = new Dictionary(); // the lexicon -- lexical inventory only (Rule 17)
  hydrator: AsyncDictionaryHydrator;
  dictionaryProcessor: DictionaryProcessor;

  lexicalRelationships = new LexicalRelationshipStore();
  lexicalRelationshipTensor = new LexicalRelationshipSystemPropertyTensor(); // Design Principle 8
  lexicalRelationshipProcessor: LexicalRelationshipProcessor;

  constructor(domainName: string) {
    this.hydrator = new AsyncDictionaryHydrator(this.dictionary);
    // domainName is a lookup hint for external hydration (ranks, never
    // proves, which externally-supported sense applies), not a new
    // piece of Domain state duplicated here.
    this.dictionaryProcessor = new DictionaryProcessor(this.dictionary, this.hydrator, domainName);
    this.lexicalRelationshipProcessor = new LexicalRelationshipProcessor(
      this.lexicalRelationships,
      this.lexicalRelationshipTensor,
    );
  }

  register(agent: VocabularyAgent): void {
    this.agents.push(agent);
  }
}
