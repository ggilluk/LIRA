import type { VocabularyAgent } from "../agents";
import { AsyncDictionaryHydrator } from "../role/dictionary_hydrator";
import { DictionaryProcessor } from "../role/dictionary_processor";
import { LexicalRelationshipProcessor } from "../role/lexical_relationship_processor";
import { Dictionary } from "./dictionary";
import { LexicalRelationshipStore } from "./lexical_relationship_store";
import { LexicalRelationshipSystemPropertyTensor } from "./lexical_relationship_tensor";
import { PhraseBook } from "./phrase_book";
import { SenseStore } from "./sense_store";

/** Ported from vocabulary/data/layer.py. `phrases`/`senses` have no
 * Python original -- this prototype's own additions. `phrases` is
 * Dictionary's multi-word counterpart (phrase.ts's own docstring on why
 * a Phrase is a separate lexical category, not just a Word whose text
 * happens to contain a space); `senses` holds the shared meaning behind
 * a WordNet synset's own members (sense.ts's own docstring). */
export class VocabularyLayer {
  agents: VocabularyAgent[] = [];
  dictionary = new Dictionary(); // the lexicon -- lexical inventory only (Rule 17)
  phrases = new PhraseBook();
  senses = new SenseStore();
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
    this.dictionaryProcessor = new DictionaryProcessor(this.dictionary, this.phrases, this.hydrator, domainName);
    this.lexicalRelationshipProcessor = new LexicalRelationshipProcessor(
      this.lexicalRelationships,
      this.lexicalRelationshipTensor,
    );
  }

  register(agent: VocabularyAgent): void {
    this.agents.push(agent);
  }
}
