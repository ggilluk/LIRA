import { LinguisticUnitKind } from "../data/linguistic_unit_kind";
import { createReadingError, ReadingErrorKind, type ReadingError } from "../data/reading_error";
import { createSentence, type Sentence } from "../data/sentence";
import { SentenceType } from "../data/sentence_type";
import { isKnown, isPunctuation, type TokenReading } from "../data/token_reading";
import { ValidationOutcome } from "../data/validation_outcome";
import type { ClauseReader } from "./clause_reader";
import type { GrammarConfigurator } from "./grammar_configurator";
import { createScoringFactors } from "./reading_scorer";
import type { SequenceEngine } from "./sequence_engine";
import type { TokenResolver } from "./token_resolver";

/** SentenceReader: spec 14.3's actual readSentence() implementation.
 * Splits off trailing punctuation, reads the remainder as one
 * ClauseType.INDEPENDENT clause (ClauseReader -- Phase 1 supports
 * exactly one clause per sentence), and checks the result against
 * GrammarConfigurator.sentenceTemplates[SentenceType.DECLARATIVE], the
 * only sentence template populated in this phase. Accepts either raw
 * text (tokenised via TokenResolver.resolveSentence, as exactly one
 * sentence) or an already-resolved TokenReading sequence.
 *
 * Ported from linguistics/role/sentence_reader.py. */

export interface SentenceReadOptions {
  grammar?: GrammarConfigurator;
  sequenceNumber?: number;
  trace?: unknown[];
}

export class SentenceReader {
  constructor(
    public readonly clauseReader: ClauseReader,
    private readonly tokenResolver: TokenResolver,
    private readonly engine: SequenceEngine,
    private readonly grammar: GrammarConfigurator,
  ) {}

  /** `trace`, when an array is passed, is threaded straight through to
   * ClauseReader.read. Purely additive/observational. */
  read(textOrTokens: string | readonly TokenReading[], options: SentenceReadOptions = {}): Sentence {
    const activeGrammar = options.grammar ?? this.grammar;
    const sequenceNumber = options.sequenceNumber ?? 0;
    const tokens = typeof textOrTokens === "string"
      ? this.tokenResolver.resolveSentence(textOrTokens)
      : textOrTokens;

    if (tokens.length === 0) return this.emptySentence(sequenceNumber);

    const punctuationToken = tokens[tokens.length - 1];
    const hasTerminalPunctuation = isPunctuation(punctuationToken);
    const clauseEnd = hasTerminalPunctuation ? tokens.length - 1 : tokens.length;

    const clause = this.clauseReader.read(tokens, { startIndex: 0, endIndex: clauseEnd, grammar: activeGrammar, trace: options.trace });

    let punctuationWord;
    if (hasTerminalPunctuation) {
      const selected = punctuationToken.candidates.length > 0 ? punctuationToken.candidates[0] : undefined;
      punctuationWord = this.clauseReader.phraseReader.graphProcessor.materialiseToken(
        punctuationToken, punctuationToken.tokenIndex, selected,
      );
    }

    const sentenceTemplate = activeGrammar.sentenceTemplates.get(SentenceType.DECLARATIVE);
    const errors: ReadingError[] = [...clause.errors];
    let outcome = clause.validation;
    let sentenceType: SentenceType | undefined;

    if (sentenceTemplate === undefined) {
      outcome = ValidationOutcome.INVALID;
      errors.push(createReadingError({
        kind: ReadingErrorKind.NO_VALID_SENTENCE_INTERPRETATION, level: LinguisticUnitKind.Sentence,
        message: "No sentence template configured for SentenceType.DECLARATIVE",
      }));
    } else {
      sentenceType = SentenceType.DECLARATIVE;
      if (punctuationWord !== undefined && !sentenceTemplate.terminalPunctuation.has(punctuationWord.text)) {
        outcome = outcome < ValidationOutcome.INVALID ? outcome : ValidationOutcome.INVALID;
        errors.push(createReadingError({
          kind: ReadingErrorKind.INVALID_PUNCTUATION_SEQUENCE, level: LinguisticUnitKind.Sentence,
          message: `"${punctuationWord.text}" is not valid terminal punctuation for a declarative sentence`,
          tokenIndex: punctuationToken.tokenIndex, tokenText: punctuationToken.text,
        }));
      }
    }

    const sentenceWords = punctuationWord !== undefined ? [...clause.tokens, punctuationWord] : [...clause.tokens];
    const factors = createScoringFactors({
      validation: outcome,
      unresolvedTokenCount: tokens.filter((token) => !isKnown(token)).length,
      undischargedObligationCount: clause.phrases.reduce((sum, phrase) => sum + phrase.openObligations.length, 0),
      finiteVerbPhraseCount: clause.predicate !== undefined ? 1 : 0,
      phraseCount: clause.phrases.length,
      lexicalEvidenceSum: clause.confidence,
    });
    const confidence = this.engine.scorer.confidence(factors);

    const sentence = createSentence({
      text: sentenceWords.map((word) => word.text).join(" "),
      clauses: [clause],
      requiresPunctuation: sentenceTemplate !== undefined ? sentenceTemplate.terminalPunctuation.size > 0 : undefined,
      tokens: sentenceWords,
      sentenceType,
      selectedPartsOfSpeech: sentenceWords.map((word) => word.partOfSpeech),
      punctuation: punctuationWord,
      validation: outcome,
      confidence,
      errors,
    });
    sentence.systemProperty = this.clauseReader.phraseReader.graphProcessor.createPropertyWrapper(
      sentence, LinguisticUnitKind.Sentence, sequenceNumber, "SentenceReader_ReadLayer",
    );
    return sentence;
  }

  private emptySentence(sequenceNumber = 0): Sentence {
    const error = createReadingError({
      kind: ReadingErrorKind.NO_VALID_SENTENCE_INTERPRETATION, level: LinguisticUnitKind.Sentence,
      message: "Empty token sequence",
    });
    const sentence = createSentence({ text: "", clauses: [], validation: ValidationOutcome.INVALID, confidence: 0.0, errors: [error] });
    sentence.systemProperty = this.clauseReader.phraseReader.graphProcessor.createPropertyWrapper(
      sentence, LinguisticUnitKind.Sentence, sequenceNumber, "SentenceReader_ReadLayer",
    );
    return sentence;
  }
}
