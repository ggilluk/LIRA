/** Linguistics Layer: grammar/syntax-level processing (parsing,
 * morphology) that feeds concept and relationship extraction. Contains
 * language structure only (Rule 18).
 *
 * Ported from linguistics/__init__.py -- the Service (data/ + role/) is
 * ported; the UI (sentence_reader_view.py, sentence_reader_server.py)
 * is not (this session's task was "the Linguistics Service, not the
 * UI"). See prototype/README.md for the full scope note. */
export { ClauseReader } from "./role/clause_reader";
export { ClauseSegmentationUtility } from "./role/clause_segmentation";
export { DocumentReader } from "./role/document_reader";
export { GrammarConfigurator } from "./role/grammar_configurator";
export type { ClauseTemplate, PhraseGrammar, SentenceTemplate } from "./role/grammar_configurator";
export { GraphProcessor } from "./role/graph_processor";
export { LinguisticLexer } from "./role/lexer";
export { LinguisticController } from "./role/linguistic_controller";
export { ParagraphReader } from "./role/paragraph_reader";
export { PhraseReader } from "./role/phrase_reader";
export { PromptTokenizer } from "./role/prompt_tokenizer";
export type { ReadingContext } from "./role/reading_context";
export { ReadingScorer, createScoringFactors } from "./role/reading_scorer";
export type { ScoringFactors } from "./role/reading_scorer";
export { SentenceReader } from "./role/sentence_reader";
export { SequenceEngine, createSequencePath, createSequenceStep, hasUnknownToken } from "./role/sequence_engine";
export type { SequencePath, SequenceStep } from "./role/sequence_engine";
export { TokenResolver } from "./role/token_resolver";

export { LinguisticSystemProperty, SystemPropertyRef } from "./data/system_property";
export { LinguisticSystemPropertyTensor } from "./data/tensor";
export { createClause, readClause } from "./data/clause";
export type { Clause } from "./data/clause";
export { ClauseType } from "./data/clause_type";
export type { Interpretation } from "./data/interpretation";
export { LinguisticRelationType } from "./data/linguistic_relation_type";
export { LinguisticScope } from "./data/linguistic_scope";
export type { LinguisticUnit } from "./data/linguistic_unit";
export { LinguisticUnitKind } from "./data/linguistic_unit_kind";
export { createDocument } from "./data/document";
export type { Document } from "./data/document";
export { createHeading, matchHeadingLine } from "./data/heading";
export type { Heading } from "./data/heading";
export { createParagraph } from "./data/paragraph";
export type { Paragraph } from "./data/paragraph";
export { createPhrase, readPhrase } from "./data/phrase";
export type { Phrase } from "./data/phrase";
export { PhraseType } from "./data/phrase_type";
export { createReadingError, ReadingErrorKind } from "./data/reading_error";
export type { ReadingError } from "./data/reading_error";
export { createSentence, readSentence } from "./data/sentence";
export type { Sentence } from "./data/sentence";
export { SentenceType } from "./data/sentence_type";
export { ObligationKind } from "./data/sequencing_obligation";
export type { SequencingObligation } from "./data/sequencing_obligation";
export {
  candidatePartsOfSpeech,
  createTokenReading,
  identificationFor,
  isKnown,
  isPunctuation,
} from "./data/token_reading";
export type { TokenReading } from "./data/token_reading";
export { ValidationOutcome } from "./data/validation_outcome";
export { createUserPrompt } from "./ui/user_prompt";
export type { UserPrompt } from "./ui/user_prompt";
