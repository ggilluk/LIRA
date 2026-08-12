import type { LinguisticUnit } from "./linguistic_unit";

/** One heading block within a Document (Linguistic Hierarchy, README
 * section 3): Document -> Heading | Paragraph -> Sentence -> Clause ->
 * Phrase -> Word/Punctuation. Recognised via Markdown ATX syntax (1-6
 * leading '#' characters followed by a space, e.g. "## Title") -- the
 * one unambiguous plain-text heading convention this phase recognises;
 * DocumentReader.read() classifies each non-blank line against this
 * exact grammar and treats every other line as a Paragraph (see that
 * file's own docstring for why a softer heuristic like "a short line
 * with no terminal punctuation" was deliberately rejected).
 *
 * Deliberately not decomposed into Sentences: a heading is typically a
 * sentence fragment ("Chapter One", "Results"), not a grammatical
 * sentence for SentenceReader to validate against a SentenceTemplate.
 * "Identify a Heading" here means recognising the block itself and its
 * level, not parsing its internal grammar -- there is nothing yet to
 * mark a Heading INVALID/UNRESOLVED the way a Sentence can be, so it
 * carries no `validation` field of its own; DocumentReader's own
 * aggregation treats every Heading block as contributing VALID.
 *
 * No Python equivalent -- new to this hierarchy, prototype only (this
 * session's standing TypeScript-only scope; see document.ts's own
 * docstring). */
export interface Heading extends LinguisticUnit {
  blockKind: "heading";
  /** 1-6, the number of leading '#' characters. */
  level: number;
}

export function createHeading(init: Pick<Heading, "text" | "level"> & Partial<Heading>): Heading {
  return { blockKind: "heading", ...init };
}

/** Markdown ATX heading syntax: 1-6 '#' characters, then at least one
 * space, then the heading text. Shared by DocumentReader (read path)
 * and GraphProcessor.processDocument (write path) so both classify a
 * line as a Heading the exact same way. */
export const HEADING_PATTERN = /^(#{1,6})\s+(.+)$/;

/** Classifies one already-trimmed, non-blank line: a Heading (with its
 * level and de-hashed text) if it matches HEADING_PATTERN, `undefined`
 * otherwise -- the caller treats `undefined` as "this line is a
 * Paragraph line instead". */
export function matchHeadingLine(line: string): { level: number; text: string } | undefined {
  const match = HEADING_PATTERN.exec(line);
  if (!match) return undefined;
  return { level: match[1].length, text: match[2].trim() };
}
