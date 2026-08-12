import { PartOfSpeech } from "../../vocabulary/data/part_of_speech";
import type { DictionaryProcessor } from "../../vocabulary/role/dictionary_processor";
import type { WordIdentification } from "../../vocabulary/data/word_identification";
import { createWord, type Word } from "../../vocabulary/data/word";
import { createClause, type Clause } from "../data/clause";
import type { LinguisticUnit } from "../data/linguistic_unit";
import { LinguisticUnitKind } from "../data/linguistic_unit_kind";
import { createParagraph, type Paragraph } from "../data/paragraph";
import { createSentence, type Sentence } from "../data/sentence";
import { createSubject, type Subject } from "../data/subject";
import { LinguisticSystemProperty, SystemPropertyRef } from "../data/system_property";
import type { LinguisticSystemPropertyTensor } from "../data/tensor";
import { createTokenReading, type TokenReading } from "../data/token_reading";
import { ClauseSegmentationUtility } from "./clause_segmentation";
import type { GrammarConfigurator } from "./grammar_configurator";
import { LinguisticLexer } from "./lexer";

/** Builds the Word -> Clause -> Sentence -> Paragraph -> Subject tree
 * from raw text, attaching a tensor-backed LinguisticSystemProperty to
 * every unit it creates.
 *
 * Ported from linguistics/role/graph_processor.py. Python defers
 * importing Word/PartOfSpeech inside method bodies purely to avoid a
 * module-scope import cycle within its own package; TypeScript's
 * module graph has no equivalent cycle here (see vocabulary/data/word.ts's
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
  materialiseToken(reading: TokenReading, absoluteSeqNum: number, selectedCandidate?: WordIdentification): Word {
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
        definition: { value: "Pending external hydration; part of speech not yet identified." },
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

  processSubject(rawSubjectText: string, seqNum: number): Subject {
    const rawParagraphStrings = rawSubjectText
      .trim()
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    const compiledParagraphs = rawParagraphStrings.map((p, idx) => this.processParagraph(p, idx));

    const node = createSubject({ text: rawSubjectText.trim(), paragraphs: compiledParagraphs });
    node.systemProperty = this.createPropertyWrapper(node, LinguisticUnitKind.Subject, seqNum, "GraphProcessor_SubjectLayer");
    return node;
  }
}
