/** Message protocol between the main thread (LinguisticsWorkerClient)
 * and the Linguistic Service worker (linguistics_worker.ts) -- the
 * same split-file shape as
 * vocabulary/role/web_worker/vocabulary_worker_protocol.ts, so both
 * Services are typed the same way even though nothing here
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
  /** Whether this read should reinforce the worker's own
   * LexicalEvidenceStore (role/lexical_evidence_store.ts, spec 15-24's
   * "Learned Lexical Transition Evidence") if the sentence validates --
   * the Sentence Reader UI's own "Learning" checkbox, sent fresh with
   * every request rather than toggled as separate worker state, since a
   * read call is otherwise already a complete, self-contained unit of
   * work. */
  learningEnabled: boolean;
  /** True when this call is a detail re-read of a sentence a prior
   * `read-document` call already walked and recorded (the Document tree
   * view's own on-demand fetch of one sentence's predicted structure and
   * trace, when a user expands/selects its node -- see
   * ui/sentence_reader_view.ts's own tree selection handling). Skips
   * `recordObservedReading` even when `learningEnabled` is true, since
   * that sentence's transitions were already reinforced once by the
   * document-level read; re-selecting the same node in the tree must not
   * reinforce them a second time. Defaults to false, the ordinary
   * single-sentence "Read" button path. */
  skipLearning?: boolean;
}

/** Reads `text` as a full Document -- Heading/Paragraph blocks, each
 * Paragraph's Sentences -- the same "Document, Heading, Paragraph,
 * Sentence, Phrase, Word" hierarchy LinguisticController.readDocument()
 * builds, requested as its own message because it returns a
 * (potentially large, multi-sentence) tree rather than one Sentence's
 * full trace. Deliberately does not carry a `trace` in its own result --
 * see JsonDocument's own docstring for why per-sentence trace is instead
 * fetched on demand via a `ReadRequest` for just that sentence's text. */
export interface ReadDocumentRequest {
  type: "read-document";
  requestId: string;
  text: string;
  learningEnabled: boolean;
}

export type LinguisticsWorkerRequest = InitRequest | ReadRequest | ReadDocumentRequest;

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

/** A Sentence's own summary within a Document tree -- everything the
 * tree view (ui/sentence_reader_view.ts) needs to render a Sentence node
 * (its validation dot, a truncated snippet, an error count) without
 * paying for its full JsonSentence.clauses tree, which a Document with
 * many sentences would make expensive to build and serialise for every
 * one of them up front. The full JsonSentence -- clauses, words, trace --
 * is fetched on demand for exactly one sentence at a time via a
 * `ReadRequest` for that sentence's own `text`, the moment its node is
 * selected in the tree, not before. */
export interface JsonSentenceSummary {
  text: string;
  sentenceType: string | null;
  validation: string;
  confidence: number;
  errors: JsonReadingError[];
}

export interface JsonHeadingBlock {
  blockKind: "heading";
  text: string;
  level: number;
}

export interface JsonParagraphBlock {
  blockKind: "paragraph";
  text: string;
  sentences: JsonSentenceSummary[];
  validation: string;
  confidence: number;
  errors: JsonReadingError[];
}

export type JsonBlock = JsonHeadingBlock | JsonParagraphBlock;

/** JSON-safe mirror of data/document.ts's own Document -- the tree
 * shape a `read-document` call returns: DocumentReader's classification
 * of `text` into Heading/Paragraph blocks, each Paragraph's Sentences
 * summarised (JsonSentenceSummary, not the full JsonSentence -- see that
 * interface's own docstring for why). */
export interface JsonDocument {
  text: string;
  blocks: JsonBlock[];
  validation: string;
  confidence: number;
  errors: JsonReadingError[];
}

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

/** One raw input token, in original sentence order -- covers every
 * token the tokenizer produced (role/token_resolver.ts's
 * `resolveSentence`), not just the ones that made it into a
 * successfully-typed phrase. `resolved: false` means either the token
 * has no seeded/hydrated Vocabulary sense at all (an unknown word) or
 * it simply wasn't incorporated into any successfully-read phrase --
 * both are "not found" from this array's point of view, so the UI
 * renders both the same way (yellow) rather than distinguishing a
 * grammar failure from a vocabulary gap the user can't see the
 * difference of anyway. `partOfSpeech`/`validation`/`confidence` are
 * all `null` for an unresolved token -- there is no committed reading
 * to report one for. */
export interface PredictedWord {
  text: string;
  resolved: boolean;
  partOfSpeech: string | null;
  /** The PhraseType of the phrase this word was read as part of (e.g.
   * NOUN_PHRASE, VERB_PHRASE) -- null for an unresolved word, same as
   * partOfSpeech/validation/confidence. */
  phraseType: string | null;
  validation: string | null;
  confidence: number | null;
}

/** Reports what this one `read` call actually did to the worker's
 * LexicalEvidenceStore, so the UI can show genuine accumulated state
 * (an honest "Learning: N observations" indicator) rather than just
 * echoing back the checkbox it was sent. */
export interface LearningStatus {
  /** Echoes the request's own `learningEnabled` -- false whenever the
   * checkbox was off, regardless of whether the sentence would have
   * validated. */
  enabled: boolean;
  /** Transitions this specific read reinforced -- always 0 when
   * `enabled` is false or the sentence didn't validate
   * (LinguisticController.recordObservedReading's own gate). */
  recordedThisRead: number;
  /** The worker's LexicalEvidenceStore.totalObservations after this
   * read -- accumulated across every learning-enabled read since the
   * Service started, not just this one. */
  totalObservations: number;
}

export interface ReadResult {
  predicted: JsonSentence;
  /** The predicted sentence as a flat, in-order word array -- see
   * linguistics/ui/sentence_reader_view.ts's own "Predicted sentence"
   * rendering, the thing this field exists for. */
  words: readonly PredictedWord[];
  trace: readonly TracePosition[];
  learning: LearningStatus;
}

export interface ReadResultMessage {
  type: "read-result";
  requestId: string;
  result: ReadResult;
}

export interface ReadDocumentResult {
  document: JsonDocument;
  learning: LearningStatus;
}

export interface ReadDocumentResultMessage {
  type: "read-document-result";
  requestId: string;
  result: ReadDocumentResult;
}

/** `requestId` set means this error belongs to one in-flight `read`/
 * `read-document` call (the client rejects just that promise); unset
 * means it's a whole-Service failure (init itself threw). */
export interface ErrorMessage {
  type: "error";
  requestId?: string;
  message: string;
}

export type LinguisticsWorkerMessage =
  | StatusMessage
  | ReadyMessage
  | ReadResultMessage
  | ReadDocumentResultMessage
  | ErrorMessage;
