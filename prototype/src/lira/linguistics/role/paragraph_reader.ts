import { createReadingError, ReadingErrorKind, type ReadingError } from "../data/reading_error";
import { LinguisticUnitKind } from "../data/linguistic_unit_kind";
import { createParagraph, type Paragraph } from "../data/paragraph";
import { ValidationOutcome } from "../data/validation_outcome";
import type { GrammarConfigurator } from "./grammar_configurator";
import { LinguisticLexer } from "./lexer";
import type { SentenceReader } from "./sentence_reader";

export interface ParagraphReadOptions {
  grammar?: GrammarConfigurator;
  sequenceNumber?: number;
}

/** ParagraphReader: the read-path state-machine level above Sentence
 * (Linguistic Hierarchy, README section 3) -- splits paragraph text
 * into sentences the exact same way GraphProcessor.processParagraph's
 * write path already does (LinguisticLexer.splitSentences), but reads
 * each one through the shared SentenceReader instead of the write
 * path's unvalidated processSentence, so a Paragraph now carries a real
 * `validation` -- worst-outcome aggregated across its own Sentences,
 * the same `[ownOutcome, ...childOutcomes].reduce(min)` pattern
 * ClauseReader.validate already uses one level down. `confidence` is
 * the mean of its Sentences' own confidences (0 for an empty
 * paragraph) -- ReadingScorer's own factor model is phrase/clause-
 * shaped and doesn't have an equivalent notion at this level, so this
 * deliberately doesn't try to force one.
 *
 * No Python equivalent -- new to this hierarchy, prototype only (this
 * session's standing TypeScript-only scope; see document.ts's own
 * docstring). */
export class ParagraphReader {
  constructor(
    public readonly sentenceReader: SentenceReader,
    private readonly grammar: GrammarConfigurator,
  ) {}

  read(rawParagraphText: string, options: ParagraphReadOptions = {}): Paragraph {
    const activeGrammar = options.grammar ?? this.grammar;
    const sequenceNumber = options.sequenceNumber ?? 0;
    const graphProcessor = this.sentenceReader.clauseReader.phraseReader.graphProcessor;

    const rawSentenceStrings = LinguisticLexer.splitSentences(rawParagraphText, activeGrammar);
    const sentences = rawSentenceStrings
      .filter((sentenceText) => sentenceText)
      .map((sentenceText, idx) => this.sentenceReader.read(sentenceText, { grammar: activeGrammar, sequenceNumber: idx }));

    let validation: ValidationOutcome;
    const errors: ReadingError[] = [];
    if (sentences.length === 0) {
      validation = ValidationOutcome.UNRESOLVED;
      errors.push(createReadingError({
        kind: ReadingErrorKind.NO_VALID_SENTENCE_INTERPRETATION, level: LinguisticUnitKind.Paragraph,
        message: "Empty paragraph -- no sentences found",
      }));
    } else {
      validation = sentences.map((sentence) => sentence.validation).reduce((worst, outcome) => (outcome < worst ? outcome : worst));
      for (const sentence of sentences) errors.push(...sentence.errors);
    }
    const confidence = sentences.length > 0 ? sentences.reduce((sum, s) => sum + s.confidence, 0) / sentences.length : 0.0;

    const node = createParagraph({
      text: rawParagraphText.trim(), sentences, validation, confidence, errors,
    });
    node.systemProperty = graphProcessor.createPropertyWrapper(node, LinguisticUnitKind.Paragraph, sequenceNumber, "ParagraphReader_ReadLayer");
    return node;
  }
}
