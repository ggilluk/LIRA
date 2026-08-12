import { createDocument, type Document } from "../data/document";
import { matchHeadingLine, type Heading } from "../data/heading";
import { LinguisticUnitKind } from "../data/linguistic_unit_kind";
import { createReadingError, ReadingErrorKind, type ReadingError } from "../data/reading_error";
import type { Paragraph } from "../data/paragraph";
import { ValidationOutcome } from "../data/validation_outcome";
import type { GrammarConfigurator } from "./grammar_configurator";
import type { ParagraphReader } from "./paragraph_reader";

export interface DocumentReadOptions {
  grammar?: GrammarConfigurator;
  sequenceNumber?: number;
}

/** DocumentReader: the top read-path state-machine level (Linguistic
 * Hierarchy, README section 3) -- classifies `rawDocumentText`'s lines
 * into Heading and Paragraph blocks, in document order, the exact same
 * way GraphProcessor.processDocument's write path already does
 * (heading.ts's own matchHeadingLine against each non-blank line), but
 * reads each Paragraph block through the shared ParagraphReader instead
 * of the write path's unvalidated processParagraph, so a Document now
 * carries a real `validation` -- worst-outcome aggregated across its
 * own blocks (a Heading always contributes VALID, since it has no
 * grammar to fail; see heading.ts's own docstring), the same
 * `[ownOutcome, ...childOutcomes].reduce(min)` pattern ClauseReader.validate
 * and ParagraphReader both already use one level down. `confidence` is
 * the mean of its blocks' own confidences (a Heading contributes 1.0 --
 * deterministic pattern match, no ambiguity to score), 0 for an empty
 * document.
 *
 * This completes the "the state machine should identify Document,
 * Heading, Paragraph, Sentence, Phrase, Word, in order" hierarchy: this
 * class -> ParagraphReader -> SentenceReader -> ClauseReader/PhraseReader
 * -> SequenceEngine each own exactly one level, none of them
 * reimplementing a level another already owns (spec 9's "one shared
 * sequencing engine" applied one level further up).
 *
 * No Python equivalent -- new to this hierarchy, prototype only (this
 * session's standing TypeScript-only scope; see document.ts's own
 * docstring). */
export class DocumentReader {
  constructor(
    public readonly paragraphReader: ParagraphReader,
    private readonly grammar: GrammarConfigurator,
  ) {}

  read(rawDocumentText: string, options: DocumentReadOptions = {}): Document {
    const activeGrammar = options.grammar ?? this.grammar;
    const sequenceNumber = options.sequenceNumber ?? 0;
    const graphProcessor = this.paragraphReader.sentenceReader.clauseReader.phraseReader.graphProcessor;

    const rawLines = rawDocumentText
      .trim()
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const blocks: (Heading | Paragraph)[] = rawLines.map((line, idx) => {
      const heading = matchHeadingLine(line);
      return heading
        ? graphProcessor.processHeadingBlock(heading.text, heading.level, idx)
        : this.paragraphReader.read(line, { grammar: activeGrammar, sequenceNumber: idx });
    });

    let validation: ValidationOutcome;
    const errors: ReadingError[] = [];
    if (blocks.length === 0) {
      validation = ValidationOutcome.UNRESOLVED;
      errors.push(createReadingError({
        kind: ReadingErrorKind.NO_VALID_SENTENCE_INTERPRETATION, level: LinguisticUnitKind.Document,
        message: "Empty document -- no heading or paragraph lines found",
      }));
    } else {
      const outcomes = blocks.map((block) => (block.blockKind === "paragraph" ? block.validation : ValidationOutcome.VALID));
      validation = outcomes.reduce((worst, outcome) => (outcome < worst ? outcome : worst));
      for (const block of blocks) if (block.blockKind === "paragraph") errors.push(...block.errors);
    }
    const confidence = blocks.length > 0
      ? blocks.reduce((sum, block) => sum + (block.blockKind === "paragraph" ? block.confidence : 1.0), 0) / blocks.length
      : 0.0;

    const node = createDocument({ text: rawDocumentText.trim(), blocks, validation, confidence, errors });
    node.systemProperty = graphProcessor.createPropertyWrapper(node, LinguisticUnitKind.Document, sequenceNumber, "DocumentReader_ReadLayer");
    return node;
  }
}
