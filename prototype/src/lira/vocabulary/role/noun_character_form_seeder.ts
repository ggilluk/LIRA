import type { Dictionary } from "../data/dictionary";
import { isNoun } from "../data/noun";

/** Lemma -> literal Unicode character, restricted to the WordNet
 * punctuation/punctuation_mark hyponyms (assets/common/en/
 * punctuation_wordnet_hyponyms.json's own `hyponyms` list, plus that
 * synset's own "ampersand"/"solidus" siblings) whose lemma resolves to
 * exactly one character. A paired-mark lemma that WordNet models as one
 * generic name for two distinct glyphs -- "brace" ({ or }), "bracket"/
 * "square_bracket" ([ or ]), "bracket"/"angle_bracket" (⟨ or ⟩),
 * "parenthesis" (( or )), and "quotation_mark"/"quote"/"inverted_comma"
 * (nine distinct quote glyphs across punctuation.json) -- has nothing in
 * the lemma itself to choose a side with, so none of those keys appear
 * here; NounCharacterFormSeeder leaves such a Noun's own
 * wordCharacterForm undefined rather than guessing, the same
 * "leave undefined over guessing" convention noun.ts's own
 * generatedPluralNumberForm already uses for its -f/-fe case.
 * "swung_dash" (U+2053 SWUNG DASH, ⁓) has no seeded closed-class Word of
 * its own in punctuation.json/symbols.json today, but the character
 * itself is unambiguous, so it's included here regardless -- kept for
 * any future single-word "swung dash"-naming Noun, even though real
 * WordNet data never matches it: "swung dash" is a two-word lemma, so
 * WordSeeder seeds it as a Phrase, and NounCharacterFormSeeder (below)
 * only ever scans Dictionary's own Words. */
export const NOUN_CHARACTER_FORMS: Readonly<Record<string, string>> = {
  ampersand: "&",
  apostrophe: "'",
  colon: ":",
  comma: ",",
  dash: "-",
  diagonal: "/",
  exclamation_mark: "!",
  exclamation_point: "!",
  full_point: ".",
  full_stop: ".",
  hyphen: "-",
  interrogation_point: "?",
  period: ".",
  point: ".",
  question_mark: "?",
  semicolon: ";",
  separatrix: "/",
  slash: "/",
  solidus: "/",
  stop: ".",
  stroke: "/",
  swung_dash: "⁓",
  virgule: "/",
};

/** Populates Noun.wordCharacterForm across an already-seeded Dictionary
 * -- a standalone post-seeding annotation pass, deliberately not folded
 * into WordSeeder itself, the same "separate role for a separate
 * concern" shape PartOfSpeechIdentifier/RelationshipSeeder already use
 * rather than growing WordSeeder further. Matches purely on lemma text
 * (NOUN_CHARACTER_FORMS' own keys, WordNet's underscore-joined
 * multi-word convention), not on synset membership -- deliberately
 * simple, since every lemma in that table names its mark generically
 * regardless of which WordNet sense of it a given Noun happens to be. */
export class NounCharacterFormSeeder {
  constructor(private readonly dictionary: Dictionary) {}

  /** Scans every Noun in this Dictionary and, wherever its own lemma is
   * a known unambiguous mark name, sets wordCharacterForm to that
   * Unicode character. Only ever fills a field that's still undefined --
   * an explicitly-curated value already present is never overwritten,
   * the same convention generateNounForms() already uses for its own
   * *_Form fields. Idempotent: running it again over an already-seeded
   * Dictionary changes nothing further. Returns how many Nouns were
   * updated by this call. */
  seed(): number {
    let updated = 0;
    for (const word of this.dictionary.all()) {
      if (!isNoun(word)) continue;
      if (word.wordCharacterForm !== undefined) continue;

      const key = word.text.trim().toLowerCase().replace(/\s+/g, "_");
      const character = NOUN_CHARACTER_FORMS[key];
      if (character === undefined) continue;

      word.wordCharacterForm = { value: character };
      updated++;
    }
    return updated;
  }
}
