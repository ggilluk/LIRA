import type { VocabularyAgent } from "../agents";
import { AsyncDictionaryHydrator } from "../role/dictionary_hydrator";
import { DictionaryProcessor } from "../role/dictionary_processor";
import { LexicalRelationshipProcessor } from "../role/lexical_relationship_processor";
import { SemanticRelationshipProcessor } from "../role/semantic_relationship_processor";
import { Dictionary } from "./dictionary";
import { LexicalRelationshipStore } from "./lexical_relationship_store";
import { LexicalRelationshipSystemPropertyTensor } from "./lexical_relationship_tensor";
import { Phrases } from "./phrases";
import { SemanticRelationshipStore } from "./semantic_relationship_store";
import { SemanticRelationshipSystemPropertyTensor } from "./semantic_relationship_tensor";
import { Senses } from "./senses";

/** Ported from vocabulary/data/layer.py. `phrases`/`senses` have no
 * Python original -- this prototype's own additions. `phrases` is
 * Dictionary's multi-word counterpart (phrase.ts's own docstring on why
 * a Phrase is a separate lexical category, not just a Word whose text
 * happens to contain a space); `senses` holds the shared meaning behind
 * a WordNet synset's own members (sense.ts's own docstring).
 *
 * `lexicalRelationships`/`lexicalRelationshipProcessor`/
 * `lexicalRelationshipTensor` are seeding-internal working state now,
 * not a permanent part of this Domain's queryable model
 * (SemanticRelationship's own docstring, data/semantic_relationship.ts,
 * on the split this reflects): WordSeeder/RelationshipSeeder still
 * build a full LexicalRelationship graph exactly as before (untouched,
 * lowest-risk choice), but only to read it back once, at the end of
 * their own seeding pass, into `semanticRelationships` (the true
 * sense-to-sense semantic facts) and onto the seeded Words'/Phrases'
 * own POS-class attribute fields (the true word-level morphological/
 * orthographic facts, isNominalised and its siblings' own docstrings,
 * data/entities/verb.ts and others) -- nothing outside role/word_seeder.ts and
 * role/relationship_seeder.ts is meant to read `lexicalRelationships`
 * again once a seeding pass returns. */
export class VocabularyContext {
  agents: VocabularyAgent[] = [];
  dictionary = new Dictionary(); // the lexicon -- lexical inventory only (Rule 17)
  phrases = new Phrases();
  senses = new Senses();
  hydrator: AsyncDictionaryHydrator;
  dictionaryProcessor: DictionaryProcessor;

  lexicalRelationships = new LexicalRelationshipStore();
  lexicalRelationshipTensor = new LexicalRelationshipSystemPropertyTensor(); // Design Principle 8
  lexicalRelationshipProcessor: LexicalRelationshipProcessor;

  semanticRelationships = new SemanticRelationshipStore();
  semanticRelationshipTensor = new SemanticRelationshipSystemPropertyTensor(); // Design Principle 8
  semanticRelationshipProcessor: SemanticRelationshipProcessor;

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
    this.semanticRelationshipProcessor = new SemanticRelationshipProcessor(
      this.semanticRelationships,
      this.semanticRelationshipTensor,
    );
  }

  register(agent: VocabularyAgent): void {
    this.agents.push(agent);
  }
}
