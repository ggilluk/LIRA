/** Tokenization helpers genuinely shared by word and phrase definition
 * rendering -- splits a definition/headword's own text into an ordered
 * list of DefinitionSegments (plain text interleaved with word-token
 * segments carrying each token's own resolution), so the detail panel can
 * render it with each word individually identifiable without re-deriving
 * the resolution client-side. Split out of ui/dictionary_view.ts's own
 * DictionaryView class (formerly the private methods definitionSegments/
 * definitionWordSegment). */

import type { Dictionary } from "../../data/dictionary";
import { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Senses } from "../../data/senses";
import type { Word } from "../../data/entities/word";
import { definitionWords } from "../../role/word_processor";
import { domainLabel } from "./resolver_domain";

export const DEFINITION_TOKEN_PATTERN = /[^\W_]+/g;

export type DefinitionSegment =
  | { text: string }
  | { text: string; word: true; resolved: false }
  | { text: string; word: true; resolved: true; word_id: string; lexical_form: string; pos: string; domain: string | null; gloss: string };

export function definitionWordSegment(surfaceText: string, resolved: Word | undefined, senses: Senses, domainName: string): DefinitionSegment {
  if (resolved === undefined) return { text: surfaceText, word: true, resolved: false };
  return {
    text: surfaceText,
    word: true,
    resolved: true,
    word_id: resolved.uuid.value,
    lexical_form: resolved.text,
    pos: PartOfSpeech[resolved.partOfSpeech],
    domain: domainLabel(senses, domainName, resolved),
    gloss: resolved.gloss?.value ?? resolved.definition?.value ?? "",
  };
}

/** Reconstructs word.definition's text as an ordered list of
 * segments -- plain text (punctuation, whitespace) interleaved with
 * word-token segments carrying each token's own resolution from
 * definitionWords() -- so the detail panel can render the definition
 * with each word individually identifiable (a tooltip popup), without
 * re-deriving the resolution itself in client JS. Empty when there's
 * no definition. */
export function definitionSegments(word: Word, dictionary: Dictionary, senses: Senses, domainName: string): DefinitionSegment[] {
  if (word.definition === undefined) return [];
  const text = word.definition.value;
  const references = definitionWords(word, dictionary);
  const segments: DefinitionSegment[] = [];
  let lastEnd = 0;
  let referenceIndex = 0;
  for (const match of text.matchAll(DEFINITION_TOKEN_PATTERN)) {
    const reference = references[referenceIndex];
    if (reference === undefined) break;
    referenceIndex += 1;
    const start = match.index ?? 0;
    if (start > lastEnd) segments.push({ text: text.slice(lastEnd, start) });
    segments.push(definitionWordSegment(match[0], reference.word, senses, domainName));
    lastEnd = start + match[0].length;
  }
  if (lastEnd < text.length) segments.push({ text: text.slice(lastEnd) });
  return segments;
}
