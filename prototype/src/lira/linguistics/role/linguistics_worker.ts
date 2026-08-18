/** The Linguistic Service: runs WordSeeder + LinguisticController
 * (GrammarConfigurator, SequenceEngine, PhraseReader/ClauseReader/
 * SentenceReader) off the main thread, inside its own real browser Web
 * Worker -- the browser-tab stand-in for a server-side Linguistics
 * process, the same role vocabulary/role/vocabulary_worker.ts plays for
 * the Vocabulary Service.
 *
 * This worker seeds its own Dictionary from the same Common Vocabulary
 * Cache the Vocabulary Service seeds -- it cannot reach across the
 * Vocabulary worker's own thread boundary to share that one's in-memory
 * Dictionary, so it builds a second, independent copy inside this
 * worker's own global scope. That mirrors how two real backend services
 * would each hold their own working copy of shared reference data
 * rather than share a process; it does mean the Linguistics Service's
 * notion of "known words" is exactly the Common Vocabulary Cache's
 * closed-class + metalinguistic word list (~3,000 words -- see
 * vocabulary/role/word_seeder.ts's own MANDATORY_FILES/SUPPLEMENTARY_FILES),
 * not the full English language: a typed sentence using ordinary
 * open-class vocabulary outside that list reads as UNRESOLVED, honestly,
 * the same as the Python original would against the same cache.
 *
 * Bundled the same way vocabulary_worker.ts is: `new Worker(new URL(
 * "./linguistics_worker.ts", import.meta.url), { type: "module" })` in
 * linguistics_worker_client.ts gives this file (and everything it
 * imports -- the whole Linguistics role/data layer plus WordSeeder's
 * bundled cache JSON) its own Vite chunk, loaded and run in parallel
 * with the main thread and the Vocabulary worker. */

import { Dictionary } from "../../vocabulary/data/dictionary";
import { PartOfSpeech } from "../../vocabulary/data/enums/part_of_speech";
import { Phrases } from "../../vocabulary/data/phrases";
import { AsyncDictionaryHydrator } from "../../vocabulary/role/dictionary_hydrator";
import { DictionaryProcessor } from "../../vocabulary/role/dictionary_processor";
import { WordSeeder } from "../../vocabulary/role/word_seeder";
import type { Clause } from "../data/clause";
import { ClauseType } from "../data/clause_type";
import type { Document } from "../data/document";
import type { Heading } from "../data/heading";
import { LinguisticUnitKind } from "../data/linguistic_unit_kind";
import type { Paragraph } from "../data/paragraph";
import type { Phrase } from "../data/phrase";
import { PhraseType } from "../data/phrase_type";
import type { ReadingError } from "../data/reading_error";
import { ReadingErrorKind } from "../data/reading_error";
import type { Sentence } from "../data/sentence";
import { SentenceType } from "../data/sentence_type";
import { isKnown, type TokenReading } from "../data/token_reading";
import { ValidationOutcome } from "../data/validation_outcome";
import { LinguisticController } from "./linguistic_controller";
import type {
  JsonAlternative,
  JsonBlock,
  JsonClause,
  JsonDocument,
  JsonPhrase,
  JsonReadingError,
  JsonSentence,
  JsonSentenceSummary,
  LinguisticsWorkerMessage,
  LinguisticsWorkerRequest,
  PredictedWord,
  ReadDocumentRequest,
  ReadRequest,
  TracePosition,
} from "./linguistics_worker_protocol";

interface WorkerScope {
  postMessage(message: unknown): void;
  addEventListener(type: "message", listener: (event: MessageEvent<LinguisticsWorkerRequest>) => void): void;
}
const ctx = self as unknown as WorkerScope;

let controller: LinguisticController | undefined;

function post(message: LinguisticsWorkerMessage): void {
  ctx.postMessage(message);
}

function handleInit(): void {
  try {
    post({ type: "status", state: "running", detail: "Seeding the Common Vocabulary Cache…" });
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    const wordsSeeded = new WordSeeder("en").seedClosedClassWords(dictionary, phraseBook);

    post({ type: "status", state: "running", detail: `Seeded ${wordsSeeded} words — configuring grammar…` });
    const hydrator = new AsyncDictionaryHydrator(dictionary);
    const processor = new DictionaryProcessor(dictionary, phraseBook, hydrator, "Common");
    controller = new LinguisticController(processor);

    post({ type: "status", state: "done", detail: `${wordsSeeded} words ready` });
    post({ type: "ready", wordCount: wordsSeeded });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    post({ type: "status", state: "error", detail: message });
    post({ type: "error", message });
  }
}

function handleRead(request: ReadRequest): void {
  if (!controller) {
    post({ type: "error", requestId: request.requestId, message: "Linguistic Service: not initialised yet" });
    return;
  }
  try {
    const trace: unknown[] = [];
    const sentence = controller.readSentence(request.text, trace);
    const rawTokens = controller.readingContext.tokenResolver.resolveSentence(request.text);
    // recordObservedReading is itself a no-op (returns 0, touches
    // nothing) for a sentence that didn't validate -- spec 17's "only
    // validated observations reinforce" -- so this is safe to call
    // unconditionally whenever learning is on, without checking
    // sentence.validation here first.
    const recordedThisRead = request.learningEnabled && !request.skipLearning ? controller.recordObservedReading(sentence) : 0;
    post({
      type: "read-result",
      requestId: request.requestId,
      result: {
        predicted: sentenceToJson(sentence),
        words: buildPredictedWords(sentence, rawTokens),
        trace: trace as TracePosition[],
        learning: {
          enabled: request.learningEnabled,
          recordedThisRead,
          totalObservations: controller.evidenceStore.totalObservations,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    post({ type: "error", requestId: request.requestId, message });
  }
}

/** Reads `text` as a full Document -- the tree view's own entry point
 * (see linguistics_worker_protocol.ts's own ReadDocumentRequest
 * docstring for why this is a separate message from `read` rather than
 * `read` growing an optional "as a document" mode). Learning reinforces
 * every validated Sentence the Document contains, walked once here via
 * `recordObservedReading` the same way `handleRead` reinforces its own
 * single Sentence -- the tree view's later on-demand `read` calls for
 * one sentence's detail always set `skipLearning: true` so this is the
 * only place a fresh document read's transitions get recorded. */
function handleReadDocument(request: ReadDocumentRequest): void {
  if (!controller) {
    post({ type: "error", requestId: request.requestId, message: "Linguistic Service: not initialised yet" });
    return;
  }
  try {
    const document = controller.readDocument(request.text);
    let recordedThisRead = 0;
    if (request.learningEnabled) {
      for (const block of document.blocks) {
        if (block.blockKind !== "paragraph") continue;
        for (const sentence of block.sentences) recordedThisRead += controller.recordObservedReading(sentence);
      }
    }
    post({
      type: "read-document-result",
      requestId: request.requestId,
      result: {
        document: documentToJson(document),
        learning: {
          enabled: request.learningEnabled,
          recordedThisRead,
          totalObservations: controller.evidenceStore.totalObservations,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    post({ type: "error", requestId: request.requestId, message });
  }
}

/** The predicted sentence as a flat, in-order word array (linguistics/ui/
 * sentence_reader_view.ts's "Predicted sentence" rendering) -- covers
 * every raw token `rawTokens` produced, not just the ones that made it
 * into a successfully-typed phrase.
 *
 * `resolved` is the raw token's own `isKnown()` -- whether Vocabulary
 * had a seeded/hydrated sense for it at all -- not whether the grammar
 * accepted it. Those are different questions: SequenceEngine's
 * unknown-token absorption (grammar/config's own `unknownTokenAbsorbingScopes`)
 * still lets an unseeded token join a phrase as a placeholder Word
 * (`GraphProcessor.materialiseToken`'s own `partOfSpeech: OTHER,
 * isFullyHydrated: false` branch, "Pending external hydration; part of
 * speech not yet identified") so the phrase can be reported at all --
 * that placeholder is not a real prediction, so a token this function
 * finds unknown stays `partOfSpeech: null` even if some phrase
 * materialised it as OTHER, rather than fabricating a POS the grammar
 * never actually determined. A *known* token gets its real predicted
 * partOfSpeech/validation/confidence overlaid from whichever phrase
 * covers it -- Phase 1's ClauseReader always covers its whole span with
 * *some* phrase per position (role/clause_reader.ts's own read() loop),
 * so every known slot inside the clause gets exactly one overlay
 * attempt. The terminal punctuation token, which sits outside the
 * clause's own span (role/sentence_reader.ts), is handled separately
 * from `sentence.punctuation`. */
function buildPredictedWords(sentence: Sentence, rawTokens: readonly TokenReading[]): PredictedWord[] {
  const words: PredictedWord[] = rawTokens.map((token) => ({
    text: token.text,
    resolved: isKnown(token),
    partOfSpeech: null,
    phraseType: null,
    validation: null,
    confidence: null,
  }));

  const clause = sentence.clauses[0];
  if (clause) {
    for (const phrase of clause.phrases) {
      const span = phrase.endPosition - phrase.startPosition;
      if (phrase.words.length !== span) continue;
      phrase.words.forEach((word, offset) => {
        const index = phrase.startPosition + offset;
        if (index < 0 || index >= words.length || !words[index].resolved) return;
        words[index] = {
          ...words[index],
          partOfSpeech: PartOfSpeech[word.partOfSpeech],
          phraseType: phrase.phraseType !== undefined ? PhraseType[phrase.phraseType] : null,
          validation: ValidationOutcome[phrase.validation],
          confidence: Math.round(phrase.confidence * 10000) / 10000,
        };
      });
    }
  }

  if (sentence.punctuation) {
    const index = rawTokens.length - 1;
    if (index >= 0 && words[index].resolved) {
      words[index] = {
        ...words[index],
        text: sentence.punctuation.text,
        partOfSpeech: PartOfSpeech[sentence.punctuation.partOfSpeech],
        validation: ValidationOutcome[sentence.validation],
        confidence: Math.round(sentence.confidence * 10000) / 10000,
      };
    }
  }

  return words;
}

ctx.addEventListener("message", (event) => {
  const request = event.data;
  if (request.type === "init") handleInit();
  else if (request.type === "read") handleRead(request);
  else if (request.type === "read-document") handleReadDocument(request);
});

// --- Sentence/Clause/Phrase/ReadingError -> JSON, the same fields
// sentence_reader_server.py's own _sentence_to_json/_clause_to_json/
// _phrase_to_json/_error_to_json produce (camelCase, enum members
// rendered as their string name via `Enum[value]` -- the same
// convention role/phrase_reader.ts's own trace building already uses
// for the trace half of this same read-result message). -------------

function errorToJson(error: ReadingError): JsonReadingError {
  return {
    kind: ReadingErrorKind[error.kind],
    level: LinguisticUnitKind[error.level],
    message: error.message,
    tokenIndex: error.tokenIndex,
    tokenText: error.tokenText,
  };
}

function alternativeToJson(alternative: Phrase["alternatives"][number]): JsonAlternative {
  const firstSpan = alternative.phraseSpans[0];
  return {
    phraseType: firstSpan ? PhraseType[firstSpan[0]] : null,
    partsOfSpeech: alternative.selectedPartsOfSpeech.map((pos) => PartOfSpeech[pos]),
    validation: ValidationOutcome[alternative.validation],
    confidence: Math.round(alternative.confidence * 10000) / 10000,
  };
}

function phraseToJson(phrase: Phrase | undefined): JsonPhrase | null {
  if (!phrase) return null;
  return {
    phraseType: phrase.phraseType !== undefined ? PhraseType[phrase.phraseType] : null,
    text: phrase.text,
    words: phrase.words.map((word) => ({ text: word.text, pos: PartOfSpeech[word.partOfSpeech] })),
    head: phrase.headWord?.text ?? null,
    headPos: phrase.headPartOfSpeech !== undefined ? PartOfSpeech[phrase.headPartOfSpeech] : null,
    nestedPhrases: phrase.nestedPhrases.map((nested) => phraseToJson(nested)).filter((p): p is JsonPhrase => p !== null),
    validation: ValidationOutcome[phrase.validation],
    confidence: Math.round(phrase.confidence * 10000) / 10000,
    errors: phrase.errors.map(errorToJson),
    alternatives: phrase.alternatives.map(alternativeToJson),
  };
}

function clauseToJson(clause: Clause): JsonClause {
  return {
    clauseType: clause.clauseType !== undefined ? ClauseType[clause.clauseType] : null,
    text: clause.text,
    subject: phraseToJson(clause.subject),
    predicate: phraseToJson(clause.predicate),
    object: phraseToJson(clause.object),
    complement: phraseToJson(clause.complement),
    modifiers: clause.modifiers.map((phrase) => phraseToJson(phrase)).filter((p): p is JsonPhrase => p !== null),
    phrases: clause.phrases.map((phrase) => phraseToJson(phrase)).filter((p): p is JsonPhrase => p !== null),
    validation: ValidationOutcome[clause.validation],
    confidence: Math.round(clause.confidence * 10000) / 10000,
    errors: clause.errors.map(errorToJson),
  };
}

function sentenceToJson(sentence: Sentence): JsonSentence {
  return {
    text: sentence.text,
    sentenceType: sentence.sentenceType !== undefined ? SentenceType[sentence.sentenceType] : null,
    validation: ValidationOutcome[sentence.validation],
    confidence: Math.round(sentence.confidence * 10000) / 10000,
    punctuation: sentence.punctuation?.text ?? null,
    clauses: sentence.clauses.map(clauseToJson),
    errors: sentence.errors.map(errorToJson),
  };
}

// --- Document/Paragraph/Heading -> JSON, the Document tree view's own
// (lighter-weight, no clause/phrase detail -- see JsonSentenceSummary's
// own docstring) mirror of sentenceToJson/clauseToJson/phraseToJson
// above. -------------------------------------------------------------

function sentenceSummaryToJson(sentence: Sentence): JsonSentenceSummary {
  return {
    text: sentence.text,
    sentenceType: sentence.sentenceType !== undefined ? SentenceType[sentence.sentenceType] : null,
    validation: ValidationOutcome[sentence.validation],
    confidence: Math.round(sentence.confidence * 10000) / 10000,
    errors: sentence.errors.map(errorToJson),
  };
}

function blockToJson(block: Heading | Paragraph): JsonBlock {
  if (block.blockKind === "heading") {
    return { blockKind: "heading", text: block.text, level: block.level };
  }
  return {
    blockKind: "paragraph",
    text: block.text,
    sentences: block.sentences.map(sentenceSummaryToJson),
    validation: ValidationOutcome[block.validation],
    confidence: Math.round(block.confidence * 10000) / 10000,
    errors: block.errors.map(errorToJson),
  };
}

function documentToJson(document: Document): JsonDocument {
  return {
    text: document.text,
    blocks: document.blocks.map(blockToJson),
    validation: ValidationOutcome[document.validation],
    confidence: Math.round(document.confidence * 10000) / 10000,
    errors: document.errors.map(errorToJson),
  };
}
