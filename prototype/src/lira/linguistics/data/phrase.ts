import type { PartOfSpeech } from "../../vocabulary/data/enums/part_of_speech";
import type { Word } from "../../vocabulary/data/word";
import type { WordIdentification } from "../../vocabulary/data/word_identification";
import type { Clause } from "./clause";
import type { Interpretation } from "./interpretation";
import type { LinguisticUnit } from "./linguistic_unit";
import type { PhraseType } from "./phrase_type";
import type { ReadingError } from "./reading_error";
import type { SequencingObligation } from "./sequencing_obligation";
import type { TokenReading } from "./token_reading";
import { ValidationOutcome } from "./validation_outcome";
// Type-only imports -- ReadingContext/GrammarConfigurator live in role/,
// which itself imports this file (PhraseReader constructs Phrase
// values); `import type` is erased at compile time, so this never
// becomes a real runtime circular import, only a circular *type*
// reference (which TypeScript resolves fine for interface/function
// declarations). Matches Python's own string-quoted forward-reference
// discipline for the same two names, just checked instead of merely
// hinted.
import type { GrammarConfigurator } from "../role/grammar_configurator";
import type { ReadingContext } from "../role/reading_context";

/** A sequence of Vocabulary words functioning as one grammatical unit
 * within a clause (Linguistics Layer developer specification, 4; spec
 * 12.1). References Vocabulary Words and WordIdentifications -- never
 * copies or replaces their lexical data (spec 12.2, Rule 17).
 *
 * Ported from linguistics/data/phrase.py. */
export interface Phrase extends LinguisticUnit {
  // undefined only for the degenerate "no phrase grammar accepts a
  // token here" result (e.g. PhraseReader called at a bare PUNCTUATION
  // token) -- see role/phrase_reader.ts's unreadablePhrase. Every
  // phrase actually read by a valid grammar rule always sets this.
  phraseType?: PhraseType;
  words: Word[];
  selectedPartsOfSpeech: readonly PartOfSpeech[];
  selectedIdentifications: readonly WordIdentification[];
  headWord?: Word;
  headPartOfSpeech?: PartOfSpeech;
  modifiers: Phrase[];
  nestedPhrases: Phrase[];
  // Back-reference only -- Clause owns its phrases (Clause.phrases), a
  // Phrase does not own its parent.
  parentClause?: Clause;
  startPosition: number;
  endPosition: number; // exclusive
  openObligations: readonly SequencingObligation[];
  validation: ValidationOutcome;
  confidence: number;
  alternatives: readonly Interpretation[];
  errors: readonly ReadingError[];
  // systemProperty inherited from LinguisticUnit -- allocated by
  // GraphProcessor.processPhrase at materialisation time, not here; a
  // Phrase produced by search that's later discarded as a losing
  // alternative never gets a tensor row (spec 19; interpretation.ts's
  // own docstring).
}

export function createPhrase(init: Pick<Phrase, "text"> & Partial<Phrase>): Phrase {
  return {
    words: [],
    selectedPartsOfSpeech: [],
    selectedIdentifications: [],
    modifiers: [],
    nestedPhrases: [],
    startPosition: 0,
    endPosition: 0,
    openObligations: [],
    validation: ValidationOutcome.UNRESOLVED,
    confidence: 0.0,
    alternatives: [],
    errors: [],
    ...init,
  };
}

export interface ReadPhraseOptions {
  startIndex?: number;
  endIndex?: number;
  parentClause?: Clause;
  grammar?: GrammarConfigurator;
}

/** Spec 12.3 entry point. Contains no grammar or sequencing logic of
 * its own (spec 9) -- one delegation to the shared PhraseReader, the
 * only implementation of phrase sequencing in this layer, reached
 * through `context` rather than a controller-shaped dependency (see
 * role/reading_context.ts's own docstring for why). */
export function readPhrase(tokens: readonly TokenReading[], context: ReadingContext, options: ReadPhraseOptions = {}): Phrase {
  return context.phraseReader.read(tokens, {
    startIndex: options.startIndex ?? 0,
    endIndex: options.endIndex ?? tokens.length,
    parentClause: options.parentClause,
    grammar: options.grammar ?? context.grammar,
  });
}
