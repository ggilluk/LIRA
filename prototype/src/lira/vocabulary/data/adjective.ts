/** Adjective: Word's own ADJECTIVE-specific subtype, carrying
 * `syntacticPosition` -- a real WordNet-sourced property this codebase
 * used to discard outright. Princeton WordNet 3.1's dict/data.adj marks
 * some lemmas with a trailing, space-free parenthetical -- "afraid(p)",
 * "galore(ip)" -- restricting where that specific sense of the
 * adjective can sit relative to the noun it modifies. wordnet_loader.ts's
 * own cleanLemma() already stripped this marker before this field
 * existed; it's parsed into WordNetSynset.lemmaPositions now instead,
 * and WordSeeder.seedWordNet's own synsetMemberToWord() reads it from
 * there when constructing an Adjective specifically.
 *
 * Verified directly against the bundled dict/ files, not guessed: a
 * scan of all four dict/data.* files found `(a)`/`(p)`/`(ip)` are the
 * *only* trailing parenthetical markers ever attached directly to a
 * lemma token (never in data.noun/data.verb/data.adv), so this is safe
 * to treat as an exhaustive, closed set. */

import { PartOfSpeech } from "./part_of_speech";
import { createWord, type Word } from "./word";

// WordNet's own three syntactic-position restrictions for an adjective
// sense -- undefined on Adjective.syntacticPosition means unrestricted
// (attributive AND predicative both fine), the common case; only ~4%
// of dict/data.adj's own lemmas carry one of these three markers at all.
export enum AdjectivePosition {
  // WordNet "(a)" -- only directly before the noun it modifies
  // ("former" in "the former president", never "the president is former").
  ATTRIBUTIVE_ONLY = 0,
  // WordNet "(p)" -- only after a linking verb, never directly before
  // the noun ("afraid" in "he is afraid", never "the afraid man").
  PREDICATE_ONLY = 1,
  // WordNet "(ip)" -- only directly after the noun it modifies
  // ("galore" in "whiskey galore", never "galore whiskey" or
  // "the whiskey is galore").
  IMMEDIATELY_POSTNOMINAL = 2,
}

export interface Adjective extends Word {
  partOfSpeech: PartOfSpeech.ADJECTIVE;
  syntacticPosition?: AdjectivePosition;
}

export type AdjectiveInit = Pick<Adjective, "text"> & Partial<Omit<Adjective, "text" | "partOfSpeech">>;

export function createAdjective(init: AdjectiveInit): Adjective {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.ADJECTIVE }) as Adjective;
}

export function isAdjective(word: Word): word is Adjective {
  return word.partOfSpeech === PartOfSpeech.ADJECTIVE;
}
