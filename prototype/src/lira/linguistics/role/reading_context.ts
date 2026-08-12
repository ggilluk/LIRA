import type { GrammarConfigurator } from "./grammar_configurator";
import type { GraphProcessor } from "./graph_processor";
import type { SequenceEngine } from "./sequence_engine";
import type { TokenResolver } from "./token_resolver";
// Type-only imports -- ClauseReader/PhraseReader/SentenceReader each
// import data/clause.ts, data/phrase.ts, or data/sentence.ts, which in
// turn type-only-import ReadingContext (for their own readX() entry
// point signatures) -- see phrase.ts's own note on why this never
// becomes a real runtime cycle.
import type { ClauseReader } from "./clause_reader";
import type { DocumentReader } from "./document_reader";
import type { ParagraphReader } from "./paragraph_reader";
import type { PhraseReader } from "./phrase_reader";
import type { SentenceReader } from "./sentence_reader";

/** The service bundle readPhrase()/readClause()/readSentence()/
 * readParagraph()/readDocument() are given to reach the shared
 * sequencing services (Linguistics Layer developer specification, 8.6;
 * paragraphReader/documentReader are a prototype-only extension one and
 * two levels above Sentence -- see document.ts's own docstring). Built
 * once per LinguisticController (LinguisticController.readingContext)
 * and passed explicitly to each read call -- e.g. `readSentence(text,
 * domain.linguistics.readingContext)` -- rather than having the read
 * functions reach for a controller directly. This keeps PhraseReader/
 * ClauseReader/SentenceReader/ParagraphReader/DocumentReader
 * exercisable in isolation (a test can build a ReadingContext by hand
 * around a bare GrammarConfigurator, with no Domain/Dictionary
 * involved) while every real call still goes through the one
 * controller-owned instance, which is what satisfies the
 * "Sentence.read() -> LinguisticController -> shared sequencing
 * services" delegation spec 9 requires -- the controller constructs
 * and owns this bundle, a read call never rebuilds its own copy of any
 * rule or engine.
 *
 * Ported from linguistics/role/reading_context.py. */
export interface ReadingContext {
  grammar: GrammarConfigurator;
  sequenceEngine: SequenceEngine;
  tokenResolver: TokenResolver;
  phraseReader: PhraseReader;
  clauseReader: ClauseReader;
  sentenceReader: SentenceReader;
  paragraphReader: ParagraphReader;
  documentReader: DocumentReader;
  graphProcessor: GraphProcessor;
}
