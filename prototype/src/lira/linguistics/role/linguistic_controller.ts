import type { DictionaryProcessor } from "../../vocabulary/role/dictionary_processor";
import type { LexicalRelationshipStore } from "../../vocabulary/data/lexical_relationship_store";
import type { Sentence } from "../data/sentence";
import type { Subject } from "../data/subject";
import { LinguisticSystemPropertyTensor } from "../data/tensor";
import type { UserPrompt } from "../ui/user_prompt";
import { ClauseReader } from "./clause_reader";
import { GrammarConfigurator } from "./grammar_configurator";
import { GraphProcessor } from "./graph_processor";
import { LinguisticLexer } from "./lexer";
import { PhraseReader } from "./phrase_reader";
import { PromptTokenizer } from "./prompt_tokenizer";
import type { ReadingContext } from "./reading_context";
import { SentenceReader } from "./sentence_reader";
import { SequenceEngine } from "./sequence_engine";
import { TokenResolver } from "./token_resolver";

/** LinguisticController: wires the rest of the Linguistics Service
 * together, the same role DomainController plays for Domain --
 * GraphProcessor, PromptTokenizer, LinguisticLexer,
 * ClauseSegmentationUtility, GrammarConfigurator, and the read-path
 * services (SequenceEngine, TokenResolver, PhraseReader, ClauseReader,
 * SentenceReader), bundled once into a ReadingContext every read call
 * shares.
 *
 * Ported from linguistics/role/linguistic_controller.py. */
export class LinguisticController {
  readonly grammarConfigurator: GrammarConfigurator;
  readonly tensor: LinguisticSystemPropertyTensor;
  readonly graphProcessor: GraphProcessor;
  readonly tokenizer: PromptTokenizer;
  readonly lexicalRelationships?: LexicalRelationshipStore;
  readonly readingContext: ReadingContext;

  /** dictionaryProcessor: Vocabulary owns the lexicon (Rule 17);
   * Linguistics resolves tokens through it rather than keeping its own
   * copy (typically domain.vocabulary.dictionaryProcessor).
   * lexicalRelationships: plumbed through for Phase 2 (real
   * morphological agreement scoring); no Phase 1 reader consults it. */
  constructor(
    dictionaryProcessor: DictionaryProcessor,
    useClauseSegmentation = true,
    lexicalRelationships?: LexicalRelationshipStore,
  ) {
    this.grammarConfigurator = new GrammarConfigurator();
    // A typo in a rule table fails here, at construction time, not
    // mid-parse.
    this.grammarConfigurator.validateAgainstVocabulary();

    this.tensor = new LinguisticSystemPropertyTensor(); // persistent, canonical store for every unit's numeric fields (Rule 14)
    this.graphProcessor = new GraphProcessor(dictionaryProcessor, this.grammarConfigurator, this.tensor, useClauseSegmentation);
    this.tokenizer = new PromptTokenizer(this.graphProcessor);
    this.lexicalRelationships = lexicalRelationships;

    const sequenceEngine = new SequenceEngine(this.grammarConfigurator);
    const tokenResolver = new TokenResolver(this.graphProcessor);
    const phraseReader = new PhraseReader(sequenceEngine, this.graphProcessor, this.grammarConfigurator);
    const clauseReader = new ClauseReader(phraseReader, sequenceEngine, this.grammarConfigurator);
    const sentenceReader = new SentenceReader(clauseReader, tokenResolver, sequenceEngine, this.grammarConfigurator);

    // Built once, held for the controller's lifetime -- every
    // readPhrase()/readClause()/readSentence() call reaches these same
    // shared services through this bundle.
    this.readingContext = {
      grammar: this.grammarConfigurator, sequenceEngine, tokenResolver,
      phraseReader, clauseReader, sentenceReader,
      graphProcessor: this.graphProcessor,
    };
  }

  tokenizePrompt(prompt: UserPrompt): Subject {
    return this.tokenizer.tokenizePrompt(prompt);
  }

  /** Reads `text` as exactly one sentence (spec 14.3) -- delegates to
   * the shared SentenceReader via readingContext, never re-implements
   * sequencing here (spec 9). */
  readSentence(text: string, trace?: unknown[]): Sentence {
    return this.readingContext.sentenceReader.read(text, { grammar: this.grammarConfigurator, trace });
  }

  /** Splits `text` into sentences the same way tokenizePrompt's write
   * path does (LinguisticLexer.splitSentences), then reads each one
   * independently via the shared SentenceReader -- this phase has no
   * cross-sentence discourse structure to preserve, so each read call
   * stands alone. */
  readText(text: string): Sentence[] {
    const rawSentences = LinguisticLexer.splitSentences(text, this.grammarConfigurator);
    return rawSentences
      .filter((sentenceText) => sentenceText)
      .map((sentenceText, idx) => this.readingContext.sentenceReader.read(sentenceText, { grammar: this.grammarConfigurator, sequenceNumber: idx }));
  }
}
