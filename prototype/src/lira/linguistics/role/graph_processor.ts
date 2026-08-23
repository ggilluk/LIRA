import { PartOfSpeech } from "../../vocabulary/data/enums/part_of_speech";
import type { DictionaryProcessor } from "../../vocabulary/role/dictionary_processor";
import type { WordIdentifier } from "../../vocabulary/role/word_identifier";
import type { Word } from "../../vocabulary/data/entities/word";
import { createWord } from "../../vocabulary/role/word_processor";
import { createClause, type Clause } from "../data/clause";
import { createDocument, type Document } from "../data/document";
import { createHeading, matchHeadingLine, type Heading } from "../data/heading";
import type { LinguisticUnit } from "../data/linguistic_unit";
import { LinguisticUnitKind } from "../data/linguistic_unit_kind";
import { createParagraph, type Paragraph } from "../data/paragraph";
import { createSentence, type Sentence } from "../data/sentence";
import { LinguisticSystemProperty, SystemPropertyRef } from "../data/system_property";
import type { LinguisticSystemPropertyTensor } from "../data/tensor";
import { createTokenReading, type TokenReading } from "../data/token_reading";
import { ClauseSegmentationUtility } from "./clause_segmentation";
import type { GrammarConfigurator } from "./grammar_configurator";
import { LinguisticLexer } from "./lexer";

/** Builds the Word -> Clause -> Sentence -> (Paragraph | Heading) ->
 * Document tree from raw text, attaching a tensor-backed
 * LinguisticSystemProperty to every unit it creates.
 *
 * Ported from linguistics/role/graph_processor.py. Python defers
 * importing Word/PartOfSpeech inside method bodies purely to avoid a
 * module-scope import cycle within its own package; TypeScript's
 * module graph has no equivalent cycle here (see vocabulary/data/entities/word.ts's
 * own linguistic_unit.ts dependency, a leaf module), so they're
 * imported normally at the top. */
function shortId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 6);
}

export class GraphProcessor {
  constructor(
    private readonly dictProcessor: DictionaryProcessor,
    private readonly config: GrammarConfigurator,
    private readonly store: LinguisticSystemPropertyTensor,
    private readonly useClauseSegmentation = true,
  ) {}

  createPropertyWrapper(unit: LinguisticUnit, kind: LinguisticUnitKind, seq: number, origin: string): LinguisticSystemProperty {
    const row = this.store.allocateRow(
      kind, seq, `${LinguisticUnitKind[kind].toLowerCase()}-${shortId()}`,
      unit, new SystemPropertyRef(),
      { confidence: 0.95, activation: 1.0, origin },
    );
    return new LinguisticSystemProperty(this.store, row);
  }

  /** Resolves `textToken` against the Vocabulary Layer and keeps every
   * seeded candidate identifyWord returned -- the read path's own
   * entry point (role/token_resolver.ts), which must not collapse to
   * one sense the way materialiseToken's materialisation step does.
   * Allocates no tensor row: a TokenReading explored by SequenceEngine
   * and then discarded as a losing alternative must leave nothing
   * behind in the tensor (see data/token_reading.ts's own docstring). */
  processTokenCandidates(
    textToken: string,
    options: {
      sentenceIndex?: number;
      tokenIndex?: number;
      isSentenceStart?: boolean;
      precedingWords?: readonly string[];
      followingWords?: readonly string[];
    } = {},
  ): TokenReading {
    const sentenceIndex = options.sentenceIndex ?? 0;
    const tokenIndex = options.tokenIndex ?? 0;
    const isSentenceStart = options.isSentenceStart ?? false;

    const candidates = this.dictProcessor.identifyWord(textToken, {
      sentenceIndex, tokenIndex, isSentenceStart,
      precedingWords: options.precedingWords ?? [],
      followingWords: options.followingWords ?? [],
    });
    return createTokenReading({
      text: textToken, tokenIndex, sentenceIndex, isSentenceStart,
      candidates,
    });
  }

  /** The phrase-aware sibling of processTokenCandidates: resolves the
   * raw token at `startIndex` within the full `rawTokens` sequence,
   * trying the longest multi-word span the Dictionary actually has a
   * seeded entry for (DictionaryProcessor.identifyPhrase) before
   * falling back to a single-token reading. The returned TokenReading's
   * `tokenSpan` tells the caller (processSentence below, and
   * role/token_resolver.ts's own resolveSentence) how many raw tokens
   * to advance past -- 2+ once a closed-class multi-word entry like "in
   * spite of" (assets/common/en/prepositions.json) wins the search, so
   * it materialises as the one Word it's seeded as instead of
   * fragmenting back into single-word lookups on "in"/"spite"/"of". */
  processPhraseCandidates(
    rawTokens: readonly string[],
    startIndex: number,
    options: { sentenceIndex?: number; isSentenceStart?: boolean } = {},
  ): TokenReading {
    const sentenceIndex = options.sentenceIndex ?? 0;
    const isSentenceStart = options.isSentenceStart ?? false;
    const { candidates, tokenSpan } = this.dictProcessor.identifyPhrase(rawTokens, startIndex, {
      sentenceIndex, isSentenceStart,
    });
    const text = rawTokens.slice(startIndex, startIndex + tokenSpan).join(" ");
    return createTokenReading({ text, tokenIndex: startIndex, sentenceIndex, isSentenceStart, candidates, tokenSpan });
  }

  /** Turns one TokenReading occurrence into a tensor-backed Word node
   * -- the second half of what processToken used to do in one step.
   * `selectedCandidate` lets a reader (PhraseReader et al.) materialise
   * the specific sense sequencing chose; omitted, this defaults to
   * `reading.candidates[0]` (identifyWord's own top-ranked candidate),
   * which is what makes processToken byte-for-byte identical to its
   * pre-split behaviour. */
  materialiseToken(reading: TokenReading, absoluteSeqNum: number, selectedCandidate?: WordIdentifier): Word {
    const candidate = selectedCandidate ?? (reading.candidates.length > 0 ? reading.candidates[0] : undefined);

    let node: Word;
    if (candidate?.word !== undefined) {
      // word is always the Dictionary's canonical Word (its *type*,
      // punctuation included) -- shallow-copy it so this occurrence
      // (its *token*) gets its own identity and systemProperty row,
      // without mutating the canonical entry. Selecting among more
      // than one candidate for THIS sentence occurrence (semantic
      // disambiguation, as opposed to this ranking by occurrence-level
      // orthographic evidence) is Linguistics Layer work not yet built.
      node = { ...candidate.word };
    } else {
      // No seeded or previously-hydrated sense exists yet. identifyWord
      // has already queued external hydration, but that resolves
      // asynchronously and won't be ready before this call returns, so
      // this occurrence gets a transient, unclassified node of its own
      // -- never added to the Dictionary, since an unresolved
      // occurrence must not enter the authoritative vocabulary as a
      // guess.
      node = createWord({
        text: reading.text,
        partOfSpeech: PartOfSpeech.OTHER,
        gloss: { value: "Pending external hydration; part of speech not yet identified." },
        isCommon: false,
        isFullyHydrated: false,
      });
    }

    // This occurrence's own casing, not the canonical Word's -- Clause/
    // Sentence text is reconstructed from token text (processSentence
    // below), so it must reflect what was actually written, not the
    // Dictionary's seed-data casing.
    node.text = reading.text;

    const kind = node.partOfSpeech === PartOfSpeech.PUNCTUATION ? LinguisticUnitKind.Punctuation : LinguisticUnitKind.Word;

    node.systemProperty = this.createPropertyWrapper(node, kind, absoluteSeqNum, "Lexer_TokenLayer");
    return node;
  }

  /** The write path's own entry point, unchanged in behaviour --
   * resolve, then materialise the top-ranked candidate. Composed from
   * processTokenCandidates + materialiseToken rather than duplicating
   * either. */
  processToken(
    textToken: string, absoluteSeqNum: number,
    options: {
      sentenceIndex?: number; tokenIndex?: number; isSentenceStart?: boolean;
      precedingWords?: readonly string[]; followingWords?: readonly string[];
    } = {},
  ): Word {
    const reading = this.processTokenCandidates(textToken, options);
    return this.materialiseToken(reading, absoluteSeqNum);
  }

  processSentence(rawSentenceText: string, seqNum: number): Sentence {
    const rawTokens = LinguisticLexer.extractTokens(rawSentenceText);
    const allProcessedTokens: Word[] = [];
    let rawIndex = 0;
    let absoluteSeqNum = 0;
    while (rawIndex < rawTokens.length) {
      const reading = this.processPhraseCandidates(rawTokens, rawIndex, {
        sentenceIndex: seqNum, isSentenceStart: rawIndex === 0,
      });
      allProcessedTokens.push(this.materialiseToken(reading, absoluteSeqNum));
      rawIndex += reading.tokenSpan;
      absoluteSeqNum += 1;
    }
    const compiledClauses: Clause[] = [];

    if (this.useClauseSegmentation) {
      const tokenBuckets = ClauseSegmentationUtility.sliceTokensIntoClauses(allProcessedTokens, this.config);
      tokenBuckets.forEach((bucket, cIdx) => {
        const reconstructedText = bucket.map((t) => t.text).join(" ");
        const clauseNode = createClause({ text: reconstructedText, tokens: bucket, isIndependent: true });
        clauseNode.systemProperty = this.createPropertyWrapper(clauseNode, LinguisticUnitKind.Clause, cIdx, "GraphProcessor_MultiClauseLayer");
        compiledClauses.push(clauseNode);
      });
    } else {
      const clauseNode = createClause({ text: rawSentenceText.trim(), tokens: allProcessedTokens, isIndependent: true });
      clauseNode.systemProperty = this.createPropertyWrapper(clauseNode, LinguisticUnitKind.Clause, 0, "GraphProcessor_MonoClauseLayer");
      compiledClauses.push(clauseNode);
    }

    const hasPunc = allProcessedTokens.some((t) => t.partOfSpeech === PartOfSpeech.PUNCTUATION);
    const node = createSentence({ text: rawSentenceText.trim(), clauses: compiledClauses, requiresPunctuation: hasPunc });
    node.systemProperty = this.createPropertyWrapper(node, LinguisticUnitKind.Sentence, seqNum, "GraphProcessor_SentenceLayer");
    return node;
  }

  processParagraph(rawParagraphText: string, seqNum: number): Paragraph {
    const rawSentenceStrings = LinguisticLexer.splitSentences(rawParagraphText, this.config);
    const compiledSentences = rawSentenceStrings
      .map((s, idx) => (s ? this.processSentence(s, idx) : undefined))
      .filter((s): s is Sentence => s !== undefined);

    const node = createParagraph({ text: rawParagraphText.trim(), sentences: compiledSentences });
    node.systemProperty = this.createPropertyWrapper(node, LinguisticUnitKind.Paragraph, seqNum, "GraphProcessor_ParagraphLayer");
    return node;
  }

  /** One line's worth of Heading node -- no grammar to run (heading.ts's
   * own docstring on why a Heading is never decomposed into Sentences),
   * so this is just materialisation plus a tensor row. Public (not just
   * the write path's own processParagraph/processSentence counterpart)
   * because DocumentReader's read path (role/document_reader.ts) reuses
   * it verbatim -- a Heading needs the exact same tensor-row
   * construction either way, so there is nothing for a read-path
   * version to validate differently. `text` is the de-hashed heading
   * text ("Title" from "## Title"), matching every other unit's own
   * `text` being its reconstructed content rather than raw source
   * markup. */
  processHeadingBlock(headingText: string, level: number, seqNum: number): Heading {
    const node = createHeading({ text: headingText, level });
    node.systemProperty = this.createPropertyWrapper(node, LinguisticUnitKind.Heading, seqNum, "GraphProcessor_HeadingLayer");
    return node;
  }

  /** Splits `rawDocumentText` into lines (same one-line-one-block
   * granularity processSubject always used -- no blank-line paragraph
   * grouping in this phase), classifying each non-blank line as a
   * Heading (Markdown ATX syntax, heading.ts's own matchHeadingLine) or
   * a Paragraph, in document order -- the same classification
   * DocumentReader (role/document_reader.ts) uses on the read path, so
   * a line is never a Heading on one path and a Paragraph on the
   * other. */
  processDocument(rawDocumentText: string, seqNum: number): Document {
    const rawLines = rawDocumentText
      .trim()
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const blocks: (Heading | Paragraph)[] = rawLines.map((line, idx) => {
      const heading = matchHeadingLine(line);
      return heading ? this.processHeadingBlock(heading.text, heading.level, idx) : this.processParagraph(line, idx);
    });

    const node = createDocument({ text: rawDocumentText.trim(), blocks });
    node.systemProperty = this.createPropertyWrapper(node, LinguisticUnitKind.Document, seqNum, "GraphProcessor_DocumentLayer");
    return node;
  }
}
