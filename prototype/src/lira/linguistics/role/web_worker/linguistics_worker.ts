/** The Linguistic Service: runs WordSeeder + LinguisticController
 * (GrammarConfigurator, SequenceEngine, PhraseReader/ClauseReader/
 * SentenceReader) off the main thread, inside its own real browser Web
 * Worker -- the browser-tab stand-in for a server-side Linguistics
 * process, the same role vocabulary/role/web_worker/vocabulary_worker.ts
 * plays for the Vocabulary Service.
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

import { Dictionary } from "../../../vocabulary/data/dictionary";
import { PartOfSpeech } from "../../../vocabulary/data/enums/part_of_speech";
import { Phrases } from "../../../vocabulary/data/phrases";
import { WordForms } from "../../../vocabulary/data/word_forms";
import { AsyncDictionaryHydrator } from "../../../vocabulary/role/dictionary_hydrator";
import { DictionaryProcessor } from "../../../vocabulary/role/dictionary_processor";
import type { LookupWordsRequest, LookupWordsResult } from "../../../vocabulary/role/web_worker/dictionary_query_protocol";
import { graphUuid as wordGraphUuid } from "../../../vocabulary/role/word_processor";
import { graphUuid as formGraphUuid } from "../../../vocabulary/role/word_form_processor";
import { graphUuid as phraseGraphUuid } from "../../../vocabulary/data/entities/phrase";
import type { Clause } from "../../data/clause";
import { ClauseType } from "../../data/clause_type";
import type { Document } from "../../data/document";
import type { Heading } from "../../data/heading";
import { LinguisticUnitKind } from "../../data/linguistic_unit_kind";
import type { Paragraph } from "../../data/paragraph";
import type { Phrase } from "../../data/phrase";
import { PhraseType } from "../../data/phrase_type";
import type { ReadingError } from "../../data/reading_error";
import { ReadingErrorKind } from "../../data/reading_error";
import type { Sentence } from "../../data/sentence";
import { SentenceType } from "../../data/sentence_type";
import { isKnown, type TokenReading } from "../../data/token_reading";
import { ValidationOutcome } from "../../data/validation_outcome";
import { LinguisticController } from "../linguistic_controller";
import { LinguisticLexer } from "../lexer";
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
  LinkVocabularyPortRequest,
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
let dictionary: Dictionary | undefined;
let phraseBook: Phrases | undefined;
let wordForms: WordForms | undefined;

// The direct MessagePort to the Vocabulary Service worker
// (vocabulary/role/web_worker/dictionary_query_protocol.ts's own
// docstring) -- undefined until main.ts's own one-time
// "link-vocabulary-port" message arrives, well before any real read
// request could reach this worker.
let vocabularyPort: MessagePort | undefined;
const pendingLookups = new Map<string, (result: LookupWordsResult) => void>();
let nextLookupId = 0;

// Every candidate text already asked for (whether or not the Vocabulary
// Service actually had a match), and every real Word/WordForm/Phrase
// entryId already inserted locally -- both grow for the life of this
// worker (never reset), so re-reading the same or overlapping text
// across multiple calls costs nothing beyond the first time, and a
// Word/Phrase/WordForm received more than once (found via more than one
// queried text) is only ever inserted once.
const queriedTexts = new Set<string>();
const insertedWordIds = new Set<string>();
const insertedFormIds = new Set<string>();
const insertedPhraseIds = new Set<string>();

// A generous, hardcoded upper bound on the multi-word span
// DictionaryProcessor.identifyPhrase's own real search
// (dictionary.phraseSpanLimit/phraseBook.spanLimit, both driven by
// whatever's actually been seeded) might need -- this worker has no
// independently-seeded Dictionary of its own any more to read that
// bound off of ahead of asking, so prefetchTextsFor() below just tries
// every span up to this constant; a handful of extra, harmless
// empty-result queries costs far less than ever under-fetching a real
// multi-word match.
const MAX_PREFETCH_SPAN = 5;

function post(message: LinguisticsWorkerMessage): void {
  ctx.postMessage(message);
}

function handleLinkVocabularyPort(request: LinkVocabularyPortRequest): void {
  vocabularyPort = request.port;
  vocabularyPort.onmessage = (event: MessageEvent<LookupWordsResult | { type: "lookup-words-error"; requestId: string; message: string }>) => {
    const message = event.data;
    const resolve = pendingLookups.get(message.requestId);
    if (!resolve) return;
    pendingLookups.delete(message.requestId);
    resolve(message.type === "lookup-words-result" ? message : { type: "lookup-words-result", requestId: message.requestId, words: [], wordForms: [], phrases: [] });
  };
}

function queryVocabulary(texts: readonly string[]): Promise<LookupWordsResult> {
  return new Promise((resolve) => {
    if (!vocabularyPort || texts.length === 0) {
      resolve({ type: "lookup-words-result", requestId: "", words: [], wordForms: [], phrases: [] });
      return;
    }
    const requestId = `lookup-${nextLookupId++}`;
    pendingLookups.set(requestId, resolve);
    vocabularyPort!.postMessage({ type: "lookup-words", requestId, domain: "Common", texts } satisfies LookupWordsRequest);
  });
}

/** Every candidate (already-lowercased) whitespace-joined span
 * DictionaryProcessor.identifyPhrase's own longest-match search could
 * try against `rawText` -- every raw token by itself, plus every
 * consecutive multi-word run up to MAX_PREFETCH_SPAN tokens. */
function prefetchTextsFor(rawText: string): string[] {
  const rawTokens = LinguisticLexer.extractTokens(rawText);
  const texts = new Set<string>();
  for (let start = 0; start < rawTokens.length; start++) {
    for (let span = 1; span <= MAX_PREFETCH_SPAN && start + span <= rawTokens.length; span++) {
      texts.add(rawTokens.slice(start, start + span).join(" ").toLowerCase());
    }
  }
  return [...texts];
}

/** Resolves `rawText` against the Vocabulary Service's own real seeded
 * Dictionary before a read runs, inserting anything not already cached
 * locally into this worker's own dictionary/phraseBook/wordForms --
 * this module's own docstring on why this worker no longer runs an
 * independent WordSeeder pass at all. Idempotent per candidate text
 * (queriedTexts) and per real entity (insertedWordIds/insertedFormIds/
 * insertedPhraseIds), so this only ever costs a real round trip for
 * genuinely new text. */
async function prefetchWords(rawText: string): Promise<void> {
  if (!dictionary || !phraseBook || !wordForms) return;
  const candidates = prefetchTextsFor(rawText).filter((text) => !queriedTexts.has(text));
  if (candidates.length === 0) return;
  for (const text of candidates) queriedTexts.add(text);

  const result = await queryVocabulary(candidates);
  for (const word of result.words) {
    const id = wordGraphUuid(word);
    if (insertedWordIds.has(id)) continue;
    insertedWordIds.add(id);
    dictionary.append(word);
  }
  for (const { word, form } of result.wordForms) {
    const wordId = wordGraphUuid(word);
    if (!insertedWordIds.has(wordId)) {
      insertedWordIds.add(wordId);
      dictionary.append(word);
    }
    const formId = formGraphUuid(form);
    if (insertedFormIds.has(formId)) continue;
    insertedFormIds.add(formId);
    wordForms.append(form);
    wordForms.registerMember(form, word);
  }
  for (const { phrase, partOfSpeech } of result.phrases) {
    const id = phraseGraphUuid(phrase);
    if (insertedPhraseIds.has(id)) continue;
    insertedPhraseIds.add(id);
    phraseBook.append(phrase, partOfSpeech);
  }
}

/** Configures the grammar and builds an empty, session-persistent
 * dictionary/phraseBook/wordForms -- this worker no longer runs its own
 * WordSeeder pass at all (see this module's own docstring): every real
 * Word/WordForm/Phrase it ever holds arrives via prefetchWords(),
 * sourced live from the Vocabulary Service's own real seeded Dictionary
 * for whichever text a caller actually reads, not independently
 * re-derived from the raw cache files. A session that opens the
 * Sentence Reader before the Vocabulary tab's own "Seed Vocabulary"/
 * "Load WordNet" have ever been clicked sees every prefetch come back
 * empty and every occurrence read UNRESOLVED, honestly -- the same "no
 * guessing" behaviour as before, just now genuinely reflecting what the
 * Vocabulary Service actually has, WordNet included, rather than a
 * second, independently-seeded, WordNet-blind copy. */
function handleInit(): void {
  try {
    post({ type: "status", state: "running", detail: "Configuring grammar…" });
    dictionary = new Dictionary();
    phraseBook = new Phrases();
    wordForms = new WordForms();
    const hydrator = new AsyncDictionaryHydrator(dictionary, wordForms);
    const processor = new DictionaryProcessor(dictionary, phraseBook, hydrator, "Common", wordForms);
    controller = new LinguisticController(processor);

    post({ type: "status", state: "done", detail: "Grammar configured — words resolve live against the Vocabulary Service" });
    post({ type: "ready", wordCount: 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    post({ type: "status", state: "error", detail: message });
    post({ type: "error", message });
  }
}

async function handleRead(request: ReadRequest): Promise<void> {
  if (!controller) {
    post({ type: "error", requestId: request.requestId, message: "Linguistic Service: not initialised yet" });
    return;
  }
  try {
    await prefetchWords(request.text);
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
async function handleReadDocument(request: ReadDocumentRequest): Promise<void> {
  if (!controller) {
    post({ type: "error", requestId: request.requestId, message: "Linguistic Service: not initialised yet" });
    return;
  }
  try {
    await prefetchWords(request.text);
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
  else if (request.type === "link-vocabulary-port") handleLinkVocabularyPort(request);
  else if (request.type === "read") void handleRead(request);
  else if (request.type === "read-document") void handleReadDocument(request);
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
    // clause.subject can be a Phrase or a real embedded Clause now
    // (clause_embedding.ts's own docstring -- ClauseReader.read() itself
    // recognises a nominal subordinate clause like "the door was
    // unlocked"/"what happened yesterday" filling this role). "words"
    // in ... distinguishes a real Phrase (which always has it) from a
    // Clause (which never does, using `tokens` instead) -- recurses
    // into clauseToJson() itself for the embedded-Clause case, the same
    // way phraseToJson() already recurses into its own nestedPhrases.
    subject: clause.subject === undefined ? null : "words" in clause.subject ? phraseToJson(clause.subject) : clauseToJson(clause.subject),
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
