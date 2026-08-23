/** Resolves a relationship endpoint's uuid against a Dictionary/Phrases/
 * Senses in the same Dictionary-first, Phrases-fallback, Senses-last order
 * ui/dictionary_view.ts's own DictionaryView class always has. Split out of
 * that class (formerly the private method resolveEntry) into a plain
 * exported function taking its three data dependencies as explicit
 * parameters. */

import type { Dictionary } from "../../data/dictionary";
import { phraseAsWord } from "../../data/phrase";
import type { Phrases } from "../../data/phrases";
import type { Senses } from "../../data/senses";
import type { Word } from "../../data/entities/word";
import type { WordForms } from "../../data/word_forms";

/** Resolves a relationship endpoint's uuid against this Domain's
 * Dictionary first, falling back to its Phrases (projected onto a
 * Word-shaped view via phraseAsWord(), preserving the Phrase's own
 * uuid) only if the Dictionary lookup fails -- a WordNet-seeded
 * multi-word synset member (word_seeder.ts's own seedWordNet) can be
 * either end of a SemanticRelationship exactly like a single-word
 * member, so every place that used to assume "every relationship
 * endpoint is a Word in this Dictionary" needs this instead of a bare
 * `dictionary.findByUuid` call.
 *
 * Falls back to Senses last, only once both Dictionary and
 * Phrases have failed: a synset-wide Lexical Semantic fact is now
 * stored as a Sense-to-Sense edge, not a Word/Phrase-to-Word/Phrase one
 * (WordSeeder.seedPointerRelationship's own docstring), so `id` can
 * legitimately name a Sense rather than either. Resolved to that
 * Sense's own first-registered member (Senses.membersOf()) as a
 * representative -- a deliberate simplification for this single-row
 * display path, not a claim that member is somehow more "the" word
 * than any of its fellow synonyms; searchRelationships()'s own
 * `wordId` path expands a Sense edge out to every member instead of
 * picking just one, since that path already has the querying Word on
 * hand to reconstruct the full fan-out around. */
export function resolveEntry(dictionary: Dictionary, phrases: Phrases, senses: Senses, id: string, wordForms: WordForms): Word | undefined {
  const word = dictionary.findByUuid(id);
  if (word !== undefined) return word;
  const phrase = phrases.findByUuid(id);
  if (phrase !== undefined) return phraseAsWord(phrase, wordForms);
  const sense = senses.findByUuid(id);
  if (sense === undefined) return undefined;
  const representative = senses.membersOf(sense.uuid.value)[0];
  if (representative === undefined) return undefined;
  return "words" in representative ? phraseAsWord(representative, wordForms) : representative;
}
