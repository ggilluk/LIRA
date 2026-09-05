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
import { wordFormTypeLabel, type WordFormType } from "../../data/enums/word_forms_enum";
import type { Senses } from "../../data/senses";
import type { Word } from "../../data/entities/word";
import type { WordForms } from "../../data/word_forms";
import { definitionWords, graphUuid } from "../../role/word_processor";
import { domainLabel, senseFieldsFor } from "./resolver_domain";

export const DEFINITION_TOKEN_PATTERN = /[^\W_]+/g;

export type DefinitionSegment =
  | { text: string }
  | { text: string; word: true; resolved: false }
  | {
      text: string;
      word: true;
      resolved: true;
      word_id: string;
      lexical_form: string;
      pos: string;
      domain: string | null;
      gloss: string;
      // The one WordForm (data/entities/word_form.ts) on `resolved` whose
      // own spelling case-insensitively matches `surfaceText` -- e.g. a
      // Phrase modifier token that happens to appear in its own plural or
      // comparative spelling, not just the resolved Word's base lemma.
      // `undefined` when no registered WordForm matches `surfaceText`
      // exactly (WordForms.formsOf() came back empty, or every one of its
      // entries spells the word differently than this particular
      // occurrence does).
      word_form?: { field: WordFormType; label: string; value: string };
    };

/** "wordCharacterForms" -> "Word Character Forms" -- for an arbitrary
 * camelCase field NAME (Word's own `isNominalised`/`isAdjectivised`/...
 * derivation-pointer field names, builder_word.ts's own
 * `morphologicalDerivations()`; the synthetic `"wordCharacterForms"`
 * `WordFormEntry` row, `wordFormsFor()`'s own docstring), never a real
 * `WordFormType` -- `wordFormTypeLabel()` (data/enums/word_forms_enum.ts)
 * is that one's own dedicated label function now that `WordFormType`
 * itself is a numeric, tensor-coded enum with no camelCase text of its
 * own left to split. Splits on an uppercase letter and capitalizes the
 * first character -- every one of these non-enum field names (every
 * "isXyz" derivation flag, "wordCharacterForms") this codebase
 * defines is camelCase built from Title Case words (each one already
 * capitalized after the first, camelCase's own convention), so this
 * recovers the Title Case reading without needing a second,
 * hand-maintained label table for these non-enum names. */
export function formFieldLabel(field: string): string {
  const spaced = field.replace(/([A-Z])/g, " $1");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function definitionWordSegment(
  surfaceText: string,
  resolved: Word | undefined,
  senses: Senses,
  domainName: string,
  wordForms: WordForms,
): DefinitionSegment {
  if (resolved === undefined) return { text: surfaceText, word: true, resolved: false };
  const fields = senseFieldsFor(senses, resolved, wordForms);
  const matchingForm = wordForms.formsOf(resolved).find((form) => form.text.value.toLowerCase() === surfaceText.toLowerCase());
  return {
    text: surfaceText,
    word: true,
    resolved: true,
    word_id: graphUuid(resolved),
    lexical_form: resolved.text,
    pos: PartOfSpeech[resolved.partOfSpeech],
    domain: domainLabel(senses, domainName, resolved, wordForms),
    gloss: fields.gloss?.value ?? fields.definition?.value ?? "",
    word_form: matchingForm && { field: matchingForm.field, label: wordFormTypeLabel(matchingForm.field), value: matchingForm.text.value },
  };
}

/** Reconstructs `word`'s own effective definition text (resolved
 * through its primary Sense, senseFieldsFor()'s own docstring on why --
 * preferring the Sense's own copy, falling back to `word`'s own
 * `definition` when its Sense doesn't resolve in this Domain) as an
 * ordered list of segments -- plain text
 * (punctuation, whitespace) interleaved with word-token segments
 * carrying each token's own resolution from definitionWords() -- so the
 * detail panel can render the definition with each word individually
 * identifiable (a tooltip popup), without re-deriving the resolution
 * itself in client JS. Empty when there's no definition. */
export function definitionSegments(word: Word, dictionary: Dictionary, senses: Senses, domainName: string, wordForms: WordForms): DefinitionSegment[] {
  const definition = senseFieldsFor(senses, word, wordForms).definition;
  if (definition === undefined) return [];
  const text = definition.value;
  const references = definitionWords(definition, dictionary);
  const segments: DefinitionSegment[] = [];
  let lastEnd = 0;
  let referenceIndex = 0;
  for (const match of text.matchAll(DEFINITION_TOKEN_PATTERN)) {
    const reference = references[referenceIndex];
    if (reference === undefined) break;
    referenceIndex += 1;
    const start = match.index ?? 0;
    if (start > lastEnd) segments.push({ text: text.slice(lastEnd, start) });
    segments.push(definitionWordSegment(match[0], reference.word, senses, domainName, wordForms));
    lastEnd = start + match[0].length;
  }
  if (lastEnd < text.length) segments.push({ text: text.slice(lastEnd) });
  return segments;
}
