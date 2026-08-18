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

import type { Text } from "../../value_objects";
import { PartOfSpeech } from "./enums/part_of_speech";
import { createWord, type Word } from "./word";

export interface Verb extends Word {
  partOfSpeech: PartOfSpeech.VERB;
  // Resolved text of every WordNet generic verb frame this specific
  // Verb (not just its synset) participates in -- undefined for a Verb
  // that didn't come from WordSeeder.seedWordNet (every Common
  // Vocabulary Cache entry, which has no frame data of its own).
  frames?: readonly string[];

  // The rest of this subtype's own row of fields from the Word Form to
  // Part of Speech Matrix (data/word_form_part_of_speech_matrix.md) --
  // undefined until a seeding/curation pass populates them, the same as
  // `frames` for a non-WordNet-sourced Verb.

  // The purpose is to identify the verb form used for an action,
  // event, or state that occurs or exists in the present. Fully
  // lexical, not spelling-derivable (the matrix's own Format/String
  // Pattern rows are both `N/A`) -- a populated value's own
  // `Text.formats` should stay unset.
  presentTenseForm?: Text;
  // The purpose is to identify the verb form used for an action,
  // event, or state that occurred or existed in the past. Regular-case
  // rules #1-4 are regex-derivable (`/ed$/i` twice over, `/ied$/i`, a
  // doubled-final-consonant pattern) -- a populated regular-case
  // value's own `Text.formats` should carry whichever matched; rules
  // #5-6 (irregular / unchanged, "run"->"ran", "cut"->"cut") have no
  // format at all and need curated data instead.
  pastTenseForm?: Text;
  // The purpose is to identify the present-tense verb form used when
  // the subject is one person or thing other than the speaker or
  // listener. Rules #1-3 are regex-derivable (`/s$/i`, `/es$/i`,
  // `/ies$/i`) -- a populated regular-case value's own `Text.formats`
  // should carry whichever matched; rule #4 (irregular, "have"->"has",
  // "be"->"is") has no format and needs curated data instead.
  thirdPersonSingularPresentForm?: Text;
  // The purpose is to identify the verb form ending in -ing that is
  // used to describe an action or state as ongoing. Every rule here is
  // regex-derivable (`/ing$/i` twice over, a doubled-final-consonant
  // pattern, `/ying$/i`) -- unlike its siblings, this row has no
  // irregular/curated-only branch at all, so a populated value's own
  // `Text.formats` should always carry the rule that matched.
  presentParticipleForm?: Text;
  // The purpose is to identify the verb form used to construct perfect
  // tenses and passive expressions. Rules #1-4 are regex-derivable
  // (`/ed$/i` twice over, `/ied$/i`, `/(en|n)$/i`) -- a populated
  // regular-case value's own `Text.formats` should carry whichever
  // matched; rules #5-6 (irregular / unchanged, "go"->"gone",
  // "cut"->"cut") have no format and need curated data instead.
  pastParticipleForm?: Text;
  // The purpose is to identify the basic verb form used without the
  // word "to", such as "run" in "can run". Fully lexical, not
  // spelling-derivable (the matrix's own Format/String Pattern rows are
  // both `N/A`) -- a populated value's own `Text.formats` should stay
  // unset.
  bareInfinitiveForm?: Text;
  // The purpose is to identify the word form used when the speaker
  // refers to themselves or to a group that includes them. Applies
  // only to a subset of verb paradigms (e.g. "am" for "be"), not every
  // verb -- most English verbs don't inflect for person at all. The
  // matrix's own rules #1-2 for this row are Pronoun's own word lists
  // ("I"/"we"), not applicable here -- for a Verb specifically only
  // rule #3 applies, and it's `N/A` (curated data only), so a populated
  // value's own `Text.formats` should stay unset.
  firstPersonForm?: Text;
  // The purpose is to identify the word form used when referring to
  // the person or people being addressed. Same subset-only caveat, and
  // same "only rule #3 applies to Verb, and it's N/A" note, as
  // firstPersonForm above.
  secondPersonForm?: Text;
  // The purpose is to identify the word form used when referring to a
  // person, thing, place, or idea other than the speaker or listener.
  // Same subset-only caveat, and same "only rule #3 applies to Verb,
  // and it's N/A" note, as firstPersonForm above.
  thirdPersonForm?: Text;
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
