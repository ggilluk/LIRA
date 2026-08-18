/** Verb: Word's own VERB-specific subtype, carrying `frames` -- a real
 * WordNet-sourced property this codebase used to discard outright.
 * Princeton WordNet 3.1's dict/data.verb records, per synset, which of
 * its own 35 standard "generic verb frame" sentence patterns
 * ("Somebody ----s something") that synset's meaning fits -- sometimes
 * naming the whole synset, sometimes one specific member word only.
 * wordnet_loader.ts's own docstring used to say this block is "never
 * retained"; it's parsed into WordNetSynset.frames now instead, and
 * WordSeeder.seedWordNet's own synsetMemberToWord() resolves each
 * Verb's own subset of applicable frame numbers against VERB_FRAME_TEXT
 * below when constructing it.
 *
 * Verified directly against the bundled dict/ files, not guessed:
 * "breathe" (00001740-v) carries frames 2/8, resolving to "Somebody
 * ----s" / "Somebody ----s something"; "tell" (00722885-v, the
 * "discern" sense) carries 2/8/26, matching its own dict/ example
 * sentence "He could tell that she was unhappy" (frame 26, "Somebody
 * ----s that CLAUSE"). Frame targeting can be word-specific, not just
 * synset-wide -- 00027261-v ("stretch"/"extend") has frame 8 for the
 * whole synset plus frame 2 for "stretch" alone, so "extend" (the
 * synset's other member) never gets frame 2. */

import { PartOfSpeech } from "./part_of_speech";
import { createWord, type Word } from "./word";

export interface Verb extends Word {
  partOfSpeech: PartOfSpeech.VERB;
  // Resolved text of every WordNet generic verb frame this specific
  // Verb (not just its synset) participates in -- undefined for a Verb
  // that didn't come from WordSeeder.seedWordNet (every Common
  // Vocabulary Cache entry, which has no frame data of its own).
  frames?: readonly string[];
}

export type VerbInit = Pick<Verb, "text"> & Partial<Omit<Verb, "text" | "partOfSpeech">>;

export function createVerb(init: VerbInit): Verb {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.VERB }) as Verb;
}

export function isVerb(word: Word): word is Verb {
  return word.partOfSpeech === PartOfSpeech.VERB;
}

// WordNet 3.1's own fixed, documented table of 35 generic verb sentence
// frames (wninput(5WN)) -- a stable constant of the WordNet project
// itself, not bundled data of our own; dict/data.verb's own frame
// records (WordNetSynset.frames, wordnet_loader.ts) name one of these
// by number only, "----" standing in for the verb itself.
export const VERB_FRAME_TEXT: Readonly<Record<number, string>> = {
  1: "Something ----s",
  2: "Somebody ----s",
  3: "It is ----ing",
  4: "Something is ----ing PP",
  5: "Something ----s something Adjective/Noun",
  6: "Something ----s Adjective/Noun",
  7: "Somebody ----s Adjective",
  8: "Somebody ----s something",
  9: "Somebody ----s somebody",
  10: "Something ----s somebody",
  11: "Something ----s something",
  12: "Something ----s to somebody",
  13: "Somebody ----s on something",
  14: "Somebody ----s somebody something",
  15: "Somebody ----s something to somebody",
  16: "Somebody ----s something from somebody",
  17: "Somebody ----s somebody with something",
  18: "Somebody ----s somebody of something",
  19: "Somebody ----s something on somebody",
  20: "Somebody ----s somebody PP",
  21: "Somebody ----s something PP",
  22: "Somebody ----s PP",
  23: "Somebody's (body part) ----s",
  24: "Somebody ----s somebody to INFINITIVE",
  25: "Somebody ----s somebody INFINITIVE",
  26: "Somebody ----s that CLAUSE",
  27: "Somebody ----s to somebody",
  28: "Somebody ----s to INFINITIVE",
  29: "Somebody ----s whether INFINITIVE",
  30: "Somebody ----s somebody into V-ing something",
  31: "Somebody ----s something with something",
  32: "Somebody ----s INFINITIVE",
  33: "Somebody ----s VERB-ing",
  34: "It ----s that CLAUSE",
  35: "Something ----s INFINITIVE",
};
