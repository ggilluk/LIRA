/** Message protocol between the main thread (LinguisticsWorkerClient)
 * and the Linguistic Service worker (linguistics_worker.ts) -- the
 * same split-file shape as vocabulary/role/vocabulary_worker_protocol.ts,
 * so both Services are typed the same way even though nothing here
 * imports from that module (Linguistics must not depend on Vocabulary's
 * worker plumbing any more than its data/role layers depend on
 * Vocabulary's UI). */

/** The Linguistic Service's own status vocabulary -- deliberately not
 * knowledge/data/service_status.ts's `ServiceState` (which also has
 * `"not-ported"`, a state only the UI ever assigns to a layer with no
 * worker at all), for the same layering reason
 * vocabulary_worker_protocol.ts's own `VocabularyServiceState` gives:
 * the Portal shell maps this onto its own `ServiceState` when it
 * forwards a status message to its ServiceStatusBoard. */
export type LinguisticServiceState = "idle" | "running" | "done" | "error";

export interface InitRequest {
  type: "init";
}

export interface ReadRequest {
  type: "read";
  requestId: string;
  text: string;
}

export type LinguisticsWorkerRequest = InitRequest | ReadRequest;

export interface StatusMessage {
  type: "status";
  state: LinguisticServiceState;
  detail?: string;
}

export interface ReadyMessage {
  type: "ready";
  wordCount: number;
}

/** JSON-safe mirrors of ReadingError/Phrase/Clause/Sentence -- the same
 * fields sentence_reader_server.py's own `_error_to_json`/`_phrase_to_json`/
 * `_clause_to_json`/`_sentence_to_json` produce (camelCase instead of
 * snake_case), enum members rendered as their string name (`PhraseType[value]`,
 * the same convention role/phrase_reader.ts's own trace building already
 * uses) rather than the bare numeric tensor code, since this shape is
 * for a UI to render, not for re-hydrating a real Phrase/Clause/Sentence. */
export interface JsonReadingError {
  kind: string;
  level: string;
  message: string;
  tokenIndex?: number;
  tokenText?: string;
}

export interface JsonAlternative {
  phraseType: string | null;
  partsOfSpeech: string[];
  validation: string;
  confidence: number;
}

export interface JsonPhrase {
  phraseType: string | null;
  text: string;
  words: { text: string; pos: string }[];
  head: string | null;
  headPos: string | null;
  nestedPhrases: JsonPhrase[];
  validation: string;
  confidence: number;
  errors: JsonReadingError[];
  alternatives: JsonAlternative[];
}

export interface JsonClause {
  clauseType: string | null;
  text: string;
  subject: JsonPhrase | null;
  predicate: JsonPhrase | null;
  object: JsonPhrase | null;
  complement: JsonPhrase | null;
  modifiers: JsonPhrase[];
  phrases: JsonPhrase[];
  validation: string;
  confidence: number;
  errors: JsonReadingError[];
}

export interface JsonSentence {
  text: string;
  sentenceType: string | null;
  validation: string;
  confidence: number;
  punctuation: string | null;
  clauses: JsonClause[];
  errors: JsonReadingError[];
}

/** One token position's full search record -- exactly the shape
 * role/phrase_reader.ts's own `positionTrace()` already builds (that
 * method's return type is `unknown` there, since PhraseReader has no
 * reason to import this worker-only protocol; this interface is the
 * typed view of the same object on this side of the postMessage
 * boundary). "Word prediction" in the old Python Sentence Reader UI
 * (sentence_reader_server.py's "Full trace" panel) *is* this record:
 * every phrase type the state machine tried at this token, whether its
 * required start state matched, every completion considered, and which
 * one (if any) won. */
/** One token's contribution to a completion's part-of-speech breakdown
 * -- structurally identical to role/phrase_reader.ts's own (independently
 * declared, not imported -- see that file's own note) `TraceToken`. A
 * marker step (e.g. INFINITIVE_PHRASE's "to") or an unseeded token the
 * grammar's absorption rule let through both report `partOfSpeech:
 * null`, distinguished by `isMarker`/`isUnknown` so the UI can label
 * them instead of showing a blank. */
export interface TraceToken {
  text: string;
  partOfSpeech: string | null;
  isUnknown: boolean;
  isMarker: boolean;
}

export interface TraceCompletion {
  text: string;
  endIndex: number;
  validation: string;
  confidence: number;
  isWinner: boolean;
  tokens: TraceToken[];
}

export interface TraceAttempt {
  phraseType: string;
  requiredStart: string[];
  startMatch: boolean;
  completions: TraceCompletion[];
  rejectionReason: string | null;
}

export interface TracePosition {
  startIndex: number;
  tokenText: string | null;
  candidatePartsOfSpeech: string[];
  isKnown: boolean | null;
  attempts: TraceAttempt[];
  winnerPhraseType: string | null;
  winnerText: string;
  winnerValidation: string;
  winnerEndIndex: number;
  /** The winning phrase's own per-token part of speech, read off its
   * real materialised Words -- see role/phrase_reader.ts's own
   * positionTrace() docstring for why this is authoritative rather than
   * re-derived from a candidate SequencePath. */
  winnerPartsOfSpeech: { text: string; partOfSpeech: string }[];
}

export interface ReadResult {
  predicted: JsonSentence;
  trace: readonly TracePosition[];
}

export interface ReadResultMessage {
  type: "read-result";
  requestId: string;
  result: ReadResult;
}

/** `requestId` set means this error belongs to one in-flight `read`
 * call (the client rejects just that promise); unset means it's a
 * whole-Service failure (init itself threw). */
export interface ErrorMessage {
  type: "error";
  requestId?: string;
  message: string;
}

export type LinguisticsWorkerMessage = StatusMessage | ReadyMessage | ReadResultMessage | ErrorMessage;
