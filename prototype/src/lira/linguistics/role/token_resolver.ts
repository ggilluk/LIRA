import type { TokenReading } from "../data/token_reading";
import type { GrammarConfigurator } from "./grammar_configurator";
import type { GraphProcessor } from "./graph_processor";
import { LinguisticLexer } from "./lexer";

/** TokenResolver: the read path's own tokenizer + candidate-resolution
 * step (Linguistics Layer developer specification, 8.8). Wraps
 * LinguisticLexer (sentence/token splitting, unchanged) and
 * GraphProcessor.processTokenCandidates (candidate resolution,
 * unchanged identifyWord integration) into the TokenReading sequences
 * readPhrase()/readClause()/readSentence() consume -- this is the "text
 * or pre-resolved tokens" split spec 14.3 asks Sentence.read() to
 * accept: raw text always passes through here first, and always
 * through the same LinguisticLexer the write path uses, so a token or
 * sentence boundary never differs between LinguisticController.tokenizePrompt
 * (write) and LinguisticController.readText (read) for the same input.
 *
 * Ported from linguistics/role/token_resolver.py. */
export class TokenResolver {
  constructor(private readonly graphProcessor: GraphProcessor) {}

  /** One sentence's worth of TokenReadings, in order -- every seeded
   * candidate retained per token (spec 7's "candidate parts of
   * speech"), none collapsed to a single sense the way processToken's
   * materialisation step does. Uses GraphProcessor.processPhraseCandidates,
   * not processTokenCandidates directly: a closed-class multi-word entry
   * like "in spite of" resolves as one TokenReading spanning three raw
   * tokens (its own tokenSpan) rather than three independent
   * single-word readings, so the cursor below advances by tokenSpan,
   * not by 1. */
  resolveSentence(rawSentenceText: string, sentenceIndex = 0): readonly TokenReading[] {
    const rawTokens = LinguisticLexer.extractTokens(rawSentenceText);
    const readings: TokenReading[] = [];
    let rawIndex = 0;
    while (rawIndex < rawTokens.length) {
      const reading = this.graphProcessor.processPhraseCandidates(rawTokens, rawIndex, {
        sentenceIndex, isSentenceStart: rawIndex === 0,
      });
      readings.push(reading);
      rawIndex += reading.tokenSpan;
    }
    return readings;
  }

  /** One array of TokenReadings per sentence in `rawText`, split by the
   * same LinguisticLexer.splitSentences the write path uses.
   * readSentence(text=...) uses this when handed a raw string; given an
   * already-resolved TokenReading sequence instead, it skips this
   * method entirely (spec 14.3's "text or pre-resolved tokens"). */
  resolveText(rawText: string, grammar: GrammarConfigurator): readonly (readonly TokenReading[])[] {
    const rawSentences = LinguisticLexer.splitSentences(rawText, grammar);
    return rawSentences
      .filter((sentenceText) => sentenceText)
      .map((sentenceText, idx) => this.resolveSentence(sentenceText, idx));
  }
}
