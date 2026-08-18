import type { PartOfSpeech } from "../../vocabulary/data/enums/part_of_speech";
import type { Word } from "../../vocabulary/data/word";
import type { GrammarConfigurator } from "../role/grammar_configurator";
import type { ReadingContext } from "../role/reading_context";
import type { Clause } from "./clause";
import type { Interpretation } from "./interpretation";
import type { LinguisticUnit } from "./linguistic_unit";
import type { ReadingError } from "./reading_error";
import type { SentenceType } from "./sentence_type";
import type { TokenReading } from "./token_reading";
import { ValidationOutcome } from "./validation_outcome";

/** The top-level read/write unit: one or more Clauses plus terminal
 * punctuation (Linguistics Layer developer specification, 6; spec
 * 14.1). References Vocabulary Words -- never copies or replaces their
 * lexical data (Rule 17).
 *
 * Ported from linguistics/data/sentence.py. */
export interface Sentence extends LinguisticUnit {
  clauses: Clause[];
  requiresPunctuation?: boolean;

  tokens: Word[];
  sentenceType?: SentenceType;
  selectedPartsOfSpeech: readonly PartOfSpeech[];
  punctuation?: Word;
  validation: ValidationOutcome;
  confidence: number;
  alternatives: readonly Interpretation[];
  errors: readonly ReadingError[];
}

export function createSentence(init: Pick<Sentence, "text"> & Partial<Sentence>): Sentence {
  return {
    clauses: [],
    tokens: [],
    selectedPartsOfSpeech: [],
    validation: ValidationOutcome.UNRESOLVED,
    confidence: 0.0,
    alternatives: [],
    errors: [],
    ...init,
  };
}

export interface ReadSentenceOptions {
  grammar?: GrammarConfigurator;
}

/** Spec 14.3 entry point ("accepts text or pre-resolved tokens"). Raw
 * text is tokenised and resolved via context.tokenResolver; an already-
 * resolved TokenReading sequence is read as-is -- the latter is what
 * LinguisticController.readText uses internally when handing
 * SentenceReader one sentence's slice of a larger, already-tokenised
 * prompt. Contains no grammar or sequencing logic of its own (spec 9)
 * -- one delegation to the shared SentenceReader. */
export function readSentence(
  textOrTokens: string | readonly TokenReading[],
  context: ReadingContext,
  options: ReadSentenceOptions = {},
): Sentence {
  return context.sentenceReader.read(textOrTokens, { grammar: options.grammar ?? context.grammar });
}
