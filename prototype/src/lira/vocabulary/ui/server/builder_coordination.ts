/** Coordination's own client-facing record and query surface --
 * builder_phrase.ts's own counterpart for the Coordinations tab
 * (between Phrases and Senses -- both, like Coordination, aren't
 * Word-headed the way the Words tab is). Deliberately the leanest of
 * the three: Coordination carries no relationships, sense, or
 * definition of its own (it only references Words some other seeding
 * pass already created), so this tab is a plain searchable list, no
 * detail panel.
 *
 * Also the Domain's own single, merged home for every Conjunction --
 * not just real seeded WordCoordination pairs ("salt and pepper"), but
 * every standalone Conjunction Word ("and", "although") and every
 * multi-word Conjunction Phrase ("as long as", "in order that") too,
 * each carrying its own ConjunctionType (Coordinating/Subordinating) --
 * a fact a real coordinate-pair row's own `coordinator` shares, but a
 * standalone Conjunction Word/Phrase had nowhere to show at all before
 * this. `pos` is what tells the three shapes apart on one row: `NOUN`/
 * `ADVERB`/... names a real coordinate pair (`coordinator` is that
 * pair's own joining conjunction); `CONJUNCTION` names a row that IS a
 * Conjunction itself, single- or multi-word (`coordinator` stays
 * undefined -- there's no separate joining word, the row already is
 * one). */

import { PartOfSpeech } from "../../data/enums/part_of_speech";
import { ConjunctionType } from "../../data/enums/conjunction_type";
import { isConjunction } from "../../role/processor/conjunction_processor";
import { graphUuid } from "../../role/coordination_processor";
import { graphUuid as wordGraphUuid } from "../../role/word_processor";
import { graphUuid as phraseGraphUuid, type Phrase } from "../../data/entities/phrase";
import type { Coordinations } from "../../data/coordinations";
import type { Coordination } from "../../data/entities/coordination";
import type { Dictionary } from "../../data/dictionary";
import type { Phrases } from "../../data/phrases";
import type { WordForms } from "../../data/word_forms";
import type { Word } from "../../data/entities/word";
import type { Conjunction } from "../../data/entities/conjunction";
import type { LinguisticUnit } from "../../../linguistics/data/linguistic_unit";

export interface CoordinationRecord {
  id: string;
  // Each coordinate's own lexical text, in order -- coordinatesText()
  // (the embedded client script) joins these with `coordinator` into
  // one readable phrase ("salt and pepper"), Oxford-comma style for
  // three or more -- or, for a row that IS a Conjunction itself
  // (`pos === "CONJUNCTION"`), its own token(s) joined with plain
  // spaces instead ("as", "long", "as" -> "as long as"), since there's
  // no separate coordinator to join them with.
  coordinates: string[];
  // The shared part of speech every `coordinates` entry carries for a
  // real coordinate pair, or "CONJUNCTION" for a row that IS one --
  // this module's own docstring on why this is the one field that
  // tells the two shapes apart. Read off the first resolved Word for a
  // coordinate pair (every real seeded WordCoordinationSeeder entry is
  // single-POS by construction; a future producer that somehow mixed
  // POS within one Coordination would still just report the first one
  // here, same as Phrase.pos already does for a Phrase whose own
  // tokens carry more than one homograph POS).
  pos: string;
  // The coordinating conjunction's own lexical text -- undefined for
  // an asyndetic Coordination (Coordination.coordinator's own
  // docstring on why that's a real, honest case, not a gap) and for
  // every Conjunction-itself row (this module's own docstring above).
  coordinator?: string;
  // ConjunctionType[...]'s own enum key string ("COORDINATING"/
  // "SUBORDINATING") -- the coordinator's own type for a real
  // coordinate pair, or this row's own type when the row IS a
  // Conjunction. Undefined only when a coordinate pair's own
  // `coordinator` itself fails to resolve at all (coordinatorFor()'s
  // own docstring on when that happens).
  conjunction_type?: string;
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
function coordinatorFor(coordination: Coordination<LinguisticUnit>, dictionary: Dictionary, wordForms: WordForms) {
  if (coordination.coordinator === undefined) return undefined;
  const form = wordForms.findByUuid(coordination.coordinator.value);
  if (form === undefined) return undefined;
  return dictionary
    .lookupAll(form.text.value)
    .filter(isConjunction)
    .find((candidate) => candidate.conjunctionType === ConjunctionType.COORDINATING);
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
  const coordinatorWord = coordinatorFor(coordination, dictionary, wordForms);
  return {
    id: graphUuid(coordination),
    coordinates: words.map((word) => word.text),
    pos: PartOfSpeech[words[0].partOfSpeech],
    coordinator: coordinatorWord?.text,
    conjunction_type: coordinatorWord !== undefined ? ConjunctionType[coordinatorWord.conjunctionType] : undefined,
  };
}

/** A standalone Conjunction Word ("and", "although") as its own
 * CoordinationRecord -- this module's own docstring on why `pos ===
 * "CONJUNCTION"` (not the coordinated words' own part of speech) is
 * what marks a row like this one apart from a real coordinate pair. */
function conjunctionWordRecord(word: Conjunction): CoordinationRecord {
  return {
    id: wordGraphUuid(word),
    coordinates: [word.text],
    pos: PartOfSpeech[PartOfSpeech.CONJUNCTION],
    conjunction_type: ConjunctionType[word.conjunctionType],
  };
}

/** A multi-word Conjunction Phrase ("as long as", "in order that") as
 * its own CoordinationRecord -- `coordinates` is this Phrase's own
 * text split into its whitespace-separated tokens ("2 or more
 * WordForms" worth), not a single joined string, `phraseWordSegments()`'s
 * own tokenization (builder_phrase.ts). Always SUBORDINATING: verified
 * directly against the bundled Common Vocabulary Cache that every
 * multi-word CONJUNCTION entry comes from subordinating_conjunctions.json
 * -- coordinating_conjunctions.json has zero multi-word entries of its
 * own (assets/common/en/README.md's own Word coordinations section) --
 * so this is a real, checked structural fact, not a guess, though a
 * future closed-class file that added a multi-word *coordinating*
 * conjunction would need this taught a real ConjunctionType source the
 * way conjunctionWordRecord() above already has, rather than staying
 * hardcoded here. */
function conjunctionPhraseRecord(phrase: Phrase): CoordinationRecord {
  return {
    id: phraseGraphUuid(phrase),
    coordinates: phrase.text.trim().split(/\s+/).filter((token) => token.length > 0),
    pos: PartOfSpeech[PartOfSpeech.CONJUNCTION],
    conjunction_type: ConjunctionType[ConjunctionType.SUBORDINATING],
  };
}

/** Every Coordination in this Domain's Coordinations, plus every
 * Conjunction Word and Conjunction Phrase in `dictionary`/`phrases` --
 * this module's own docstring on why all three share one list. No
 * MAX_INTERACTIVE_WORDS-style capacity gate the way phraseRecords()/
 * senseRecords() need: even combined, this stays a small, closed,
 * hand-curated set today (8 real coordinate pairs, 43 Conjunction
 * Words/Phrases across both Common Vocabulary Cache files), nowhere
 * near WordNet scale, so this always embeds directly. */
export function coordinationRecords(coordinations: Coordinations<LinguisticUnit>, phrases: Phrases, dictionary: Dictionary, wordForms: WordForms): CoordinationRecord[] {
  const records: CoordinationRecord[] = [];
  for (const coordination of coordinations.all()) {
    const record = coordinationRecordFor(coordination, dictionary, wordForms);
    if (record !== undefined) records.push(record);
  }
  for (const word of dictionary.all()) {
    if (isConjunction(word)) records.push(conjunctionWordRecord(word));
  }
  for (const phrase of phrases.all()) {
    if (phrases.partOfSpeechOf(phrase) === PartOfSpeech.CONJUNCTION) records.push(conjunctionPhraseRecord(phrase));
  }
  records.sort((a, b) => a.coordinates.join(" ").toLowerCase().localeCompare(b.coordinates.join(" ").toLowerCase()));
  return records;
}
