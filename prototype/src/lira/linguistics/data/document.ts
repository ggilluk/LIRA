import type { Heading } from "./heading";
import type { LinguisticUnit } from "./linguistic_unit";
import type { Paragraph } from "./paragraph";
import type { ReadingError } from "./reading_error";
import { ValidationOutcome } from "./validation_outcome";

/** The top-level read/write unit, containing an ordered sequence of
 * Heading and Paragraph blocks (Linguistic Hierarchy, README section
 * 3): Document -> Heading | Paragraph -> Sentence -> Clause -> Phrase
 * -> Word/Punctuation.
 *
 * Renamed from `Subject` (prototype only -- this session's standing
 * TypeScript-only scope; Python's own subject.py keeps its original
 * name and its original Paragraph-only shape). Same role -- the whole
 * of one UserPrompt's text -- and the same LinguisticUnitKind tensor
 * slot (5, still named Document there, see that file's own docstring
 * on why a rename never renumbers), just renamed to match conventional
 * document-structure terminology now that Heading and Paragraph are
 * read-path-validated levels of their own (ParagraphReader,
 * DocumentReader) rather than write-path-only containers.
 *
 * `validation`/`confidence`/`errors` mirror Paragraph's own addition,
 * same reasoning: DocumentReader is a genuine read-path level now.
 * GraphProcessor's write path (processDocument) leaves these at their
 * UNRESOLVED/empty defaults, same as Paragraph. */
export interface Document extends LinguisticUnit {
  blocks: readonly (Heading | Paragraph)[];
  validation: ValidationOutcome;
  confidence: number;
  errors: readonly ReadingError[];
}

export function createDocument(init: Pick<Document, "text"> & Partial<Document>): Document {
  return { blocks: [], validation: ValidationOutcome.UNRESOLVED, confidence: 0.0, errors: [], ...init };
}
