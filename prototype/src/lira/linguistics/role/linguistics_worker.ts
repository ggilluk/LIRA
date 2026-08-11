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
import { PartOfSpeech } from "../../vocabulary/data/part_of_speech";
import { AsyncDictionaryHydrator } from "../../vocabulary/role/dictionary_hydrator";
import { DictionaryProcessor } from "../../vocabulary/role/dictionary_processor";
import { WordSeeder } from "../../vocabulary/role/word_seeder";
import type { Clause } from "../data/clause";
import { ClauseType } from "../data/clause_type";
import { LinguisticUnitKind } from "../data/linguistic_unit_kind";
import type { Phrase } from "../data/phrase";
import { PhraseType } from "../data/phrase_type";
import type { ReadingError } from "../data/reading_error";
import { ReadingErrorKind } from "../data/reading_error";
import type { Sentence } from "../data/sentence";
import { SentenceType } from "../data/sentence_type";
import { ValidationOutcome } from "../data/validation_outcome";
import { LinguisticController } from "./linguistic_controller";
import type {
  JsonAlternative,
  JsonClause,
  JsonPhrase,
  JsonReadingError,
  JsonSentence,
  LinguisticsWorkerMessage,
  LinguisticsWorkerRequest,
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
    const wordsSeeded = new WordSeeder("en").seedClosedClassWords(dictionary);

    post({ type: "status", state: "running", detail: `Seeded ${wordsSeeded} words — configuring grammar…` });
    const hydrator = new AsyncDictionaryHydrator(dictionary);
    const processor = new DictionaryProcessor(dictionary, hydrator, "Common");
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
    post({
      type: "read-result",
      requestId: request.requestId,
      result: { predicted: sentenceToJson(sentence), trace: trace as TracePosition[] },
    });
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    post({ type: "error", requestId: request.requestId, message });
  }
}

ctx.addEventListener("message", (event) => {
  const request = event.data;
  if (request.type === "init") handleInit();
  else if (request.type === "read") handleRead(request);
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
