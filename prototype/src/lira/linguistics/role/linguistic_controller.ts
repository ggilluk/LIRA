import type { DictionaryProcessor } from "../../vocabulary/role/dictionary_processor";
import type { LexicalRelationshipStore } from "../../vocabulary/data/lexical_relationship_store";
import type { PartOfSpeech } from "../../vocabulary/data/enums/part_of_speech";
import type { Document } from "../data/document";
import type { Paragraph } from "../data/paragraph";
import type { Sentence } from "../data/sentence";
import { LinguisticSystemPropertyTensor } from "../data/tensor";
import { ValidationOutcome } from "../data/validation_outcome";
import type { UserPrompt } from "../ui/user_prompt";
import { ClauseReader } from "./clause_reader";
import { DocumentReader } from "./document_reader";
import { GrammarConfigurator } from "./grammar_configurator";
import { GraphProcessor } from "./graph_processor";
import { LexicalEvidenceStore } from "./lexical_evidence_store";
import { LinguisticLexer } from "./lexer";
import { ParagraphReader } from "./paragraph_reader";
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
  /** spec 15-24's Proposed learned lexical transition evidence store --
   * always constructed (never undefined), so `recordObservedReading`/
   * `learningObservationCount` are always meaningful to call, but only
   * ever *read from* during scoring if a caller actually threads it
   * into SequenceEngine, which this constructor always does. Whether
   * evidence ever gets recorded into it is entirely up to callers of
   * `recordObservedReading` -- a controller nobody ever calls that on
   * behaves exactly as if learning didn't exist. */
  readonly evidenceStore: LexicalEvidenceStore;

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

    this.evidenceStore = new LexicalEvidenceStore();
    const sequenceEngine = new SequenceEngine(this.grammarConfigurator, undefined, this.evidenceStore);
    const tokenResolver = new TokenResolver(this.graphProcessor);
    const phraseReader = new PhraseReader(sequenceEngine, this.graphProcessor, this.grammarConfigurator);
    const clauseReader = new ClauseReader(phraseReader, sequenceEngine, this.grammarConfigurator);
    const sentenceReader = new SentenceReader(clauseReader, tokenResolver, sequenceEngine, this.grammarConfigurator);
    const paragraphReader = new ParagraphReader(sentenceReader, this.grammarConfigurator);
    const documentReader = new DocumentReader(paragraphReader, this.grammarConfigurator);

    // Built once, held for the controller's lifetime -- every
    // readPhrase()/readClause()/readSentence()/readParagraph()/
    // readDocument() call reaches these same shared services through
    // this bundle.
    this.readingContext = {
      grammar: this.grammarConfigurator, sequenceEngine, tokenResolver,
      phraseReader, clauseReader, sentenceReader, paragraphReader, documentReader,
      graphProcessor: this.graphProcessor,
    };
  }

  tokenizePrompt(prompt: UserPrompt): Document {
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

  /** Reads `text` as one Paragraph -- delegates to the shared
   * ParagraphReader via readingContext, never re-implements sentence
   * splitting or sequencing here (spec 9, extended one level up). */
  readParagraph(text: string): Paragraph {
    return this.readingContext.paragraphReader.read(text, { grammar: this.grammarConfigurator });
  }

  /** Reads `text` as one Document -- classifies each line as a Heading
   * or a Paragraph (heading.ts's own matchHeadingLine) and delegates to
   * the shared DocumentReader via readingContext. This is the top of
   * the "Document, Heading, Paragraph, Sentence, Phrase, Word" reading
   * hierarchy: DocumentReader -> ParagraphReader -> SentenceReader ->
   * ClauseReader/PhraseReader -> SequenceEngine, each level delegating
   * to exactly the one below it. */
  readDocument(text: string): Document {
    return this.readingContext.documentReader.read(text, { grammar: this.grammarConfigurator });
  }

  /** spec 17's "Validated observation => lexical evidence increases" --
   * the *only* place this controller ever writes to `evidenceStore`.
   * Gated on the whole sentence's own ValidationOutcome, not each
   * phrase's individually: clause_reader.ts's own validate() already
   * defines a clause's validation as the worst of its phrases', so a
   * VALID sentence's independent clause -- and therefore every phrase
   * in it -- is never worse than VALID; the per-phrase check below is
   * cheap belt-and-braces, not load-bearing. A degenerate/unresolved
   * phrase (`phrase.words.length === 0`, `unreadablePhrase`) has no
   * real transitions to record and is skipped. Returns how many
   * transitions this call actually recorded (0 if the sentence didn't
   * validate) -- purely informational, for a caller to report back to
   * its own UI. */
  recordObservedReading(sentence: Sentence): number {
    if (sentence.validation !== ValidationOutcome.VALID) return 0;
    let recorded = 0;
    for (const clause of sentence.clauses) {
      for (const phrase of clause.phrases) {
        if (phrase.phraseType === undefined || phrase.words.length === 0 || phrase.validation !== ValidationOutcome.VALID) continue;
        let fromState: PartOfSpeech | undefined;
        for (const word of phrase.words) {
          this.evidenceStore.record(phrase.phraseType, fromState, word.partOfSpeech);
          fromState = word.partOfSpeech;
          recorded += 1;
        }
      }
    }
    return recorded;
  }
}
