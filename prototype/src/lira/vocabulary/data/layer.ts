import type { VocabularyAgent } from "../agents";
import { AsyncDictionaryHydrator } from "../role/dictionary_hydrator";
import { DictionaryProcessor } from "../role/dictionary_processor";
import { LexicalRelationshipProcessor } from "../role/lexical_relationship_processor";
import { Dictionary } from "./dictionary";
import { LexicalRelationshipStore } from "./lexical_relationship_store";
import { LexicalRelationshipSystemPropertyTensor } from "./lexical_relationship_tensor";
import { PhraseBook } from "./phrase_book";

/** Ported from vocabulary/data/layer.py. `phrases` has no Python
 * original -- it's this prototype's own addition, Dictionary's
 * multi-word counterpart (phrase.ts's own docstring on why a Phrase is
 * a separate lexical category, not just a Word whose text happens to
 * contain a space). */
export class VocabularyLayer {
  agents: VocabularyAgent[] = [];
  dictionary = new Dictionary(); // the lexicon -- lexical inventory only (Rule 17)
  phrases = new PhraseBook();
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
