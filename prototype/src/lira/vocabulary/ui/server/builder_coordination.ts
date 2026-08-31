/** Coordination's own client-facing record and query surface -- builder_phrase.ts's
 * own counterpart for the Coordinations tab (between Phrases and
 * Senses -- both, like Coordination, aren't Word-headed the way the
 * Words tab is). Deliberately the leanest of the three: Coordination
 * carries no relationships, sense, or definition of its own (it only
 * references Words some other seeding pass already created), so this
 * tab is a plain searchable list, no detail panel. */

import { PartOfSpeech } from "../../data/enums/part_of_speech";
import { ConjunctionType } from "../../data/enums/conjunction_type";
import { isConjunction } from "../../role/processor/conjunction_processor";
import { graphUuid } from "../../role/coordination_processor";
import type { Coordinations } from "../../data/coordinations";
import type { Coordination } from "../../data/entities/coordination";
import type { Dictionary } from "../../data/dictionary";
import type { WordForms } from "../../data/word_forms";
import type { Word } from "../../data/entities/word";
import type { LinguisticUnit } from "../../../linguistics/data/linguistic_unit";

export interface CoordinationRecord {
  id: string;
  // Each coordinate's own lexical text, in order -- coordinatesText()
  // (the embedded client script) joins these with `coordinator` into
  // one readable phrase ("salt and pepper"), Oxford-comma style for
  // three or more.
  coordinates: string[];
  // The shared part of speech every `coordinates` entry carries --
  // Coordination<T>'s own generic T, read off the first resolved Word
  // (every real seeded WordCoordinationSeeder entry is single-POS by
  // construction; a future producer that somehow mixed POS within one
  // Coordination would still just report the first one here, same as
  // Phrase.pos already does for a Phrase whose own tokens carry more
  // than one homograph POS).
  pos: string;
  // The coordinating conjunction's own lexical text -- undefined for
  // an asyndetic Coordination (Coordination.coordinator's own
  // docstring on why that's a real, honest case, not a gap).
  coordinator?: string;
}

function isWord(coordinate: LinguisticUnit | Coordination<LinguisticUnit>): coordinate is Word {
  return "partOfSpeech" in coordinate;
}

/** `coordination`'s own coordinating conjunction, resolved from
 * `coordinator`'s own WordForm reference back to the real Word that
 * owns it -- WordForm carries no back-reference of its own to resolve
 * this from cold (word_coordination_seeder.ts's own identical
 * resolution, reused here for display rather than re-derived by hand),
 * so this re-resolves by the WordForm's own spelling, filtered to a
 * COORDINATING Conjunction homograph -- `undefined` when `coordinator`
 * itself is undefined, or fails to resolve at all. */
function coordinatorTextFor(coordination: Coordination<LinguisticUnit>, dictionary: Dictionary, wordForms: WordForms): string | undefined {
  if (coordination.coordinator === undefined) return undefined;
  const form = wordForms.findByUuid(coordination.coordinator.value);
  if (form === undefined) return undefined;
  const word = dictionary
    .lookupAll(form.text.value)
    .filter(isConjunction)
    .find((candidate) => candidate.conjunctionType === ConjunctionType.COORDINATING);
  return word?.text ?? form.text.value;
}

/** `undefined` when `coordination.coordinates` holds anything other
 * than plain Words (a nested Coordination<T>, or an embedded Phrase/
 * Clause sub-constituent) -- no real seeder produces either shape yet
 * (word_coordination_seeder.ts's own docstring), so this skips rather
 * than guesses at a display for a shape nothing has ever actually
 * produced, the same "skip, don't guess" discipline linkPhraseWords()
 * already has for a sub-Phrase/Clause modifier it can't resolve a
 * WordForm for (role/processor/phrase_processor.ts). */
export function coordinationRecordFor(coordination: Coordination<LinguisticUnit>, dictionary: Dictionary, wordForms: WordForms): CoordinationRecord | undefined {
  const words: Word[] = [];
  for (const coordinate of coordination.coordinates) {
    if (!isWord(coordinate)) return undefined;
    words.push(coordinate);
  }
  if (words.length === 0) return undefined;
  return {
    id: graphUuid(coordination),
    coordinates: words.map((word) => word.text),
    pos: PartOfSpeech[words[0].partOfSpeech],
    coordinator: coordinatorTextFor(coordination, dictionary, wordForms),
  };
}

/** Every Coordination in this Domain's Coordinations, as a
 * CoordinationRecord -- no MAX_INTERACTIVE_WORDS-style capacity gate
 * the way phraseRecords()/senseRecords() need: Coordination is seeded
 * from a small, closed, hand-curated set today
 * (word_coordination_seeder.ts's own docstring), nowhere near WordNet
 * scale, so this always embeds directly. */
export function coordinationRecords(coordinations: Coordinations<LinguisticUnit>, dictionary: Dictionary, wordForms: WordForms): CoordinationRecord[] {
  const records: CoordinationRecord[] = [];
  for (const coordination of coordinations.all()) {
    const record = coordinationRecordFor(coordination, dictionary, wordForms);
    if (record !== undefined) records.push(record);
  }
  records.sort((a, b) => a.coordinates.join(" ").toLowerCase().localeCompare(b.coordinates.join(" ").toLowerCase()));
  return records;
}
