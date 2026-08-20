import type { Dictionary } from "../data/dictionary";
import { isNoun, type Noun } from "../data/noun";
import { newUuid } from "../data/uuid";

/** domainTag every Noun this role creates carries, distinguishing it
 * from the WordNet-seeded Noun it was shallow-copied from -- same
 * "own domainTag so a homograph reads as legitimate polysemy, not a
 * (lexicalForm, partOfSpeech, domainTag) collision" convention
 * root_words.json's own entries already use (word_seeder.ts's own
 * SUPPLEMENTARY_FILES comment). */
export const NOUN_CHARACTER_FORM_DOMAIN_TAG = "punctuation.orthography.linguistics.common";

/** Single-word WordNet lemma -> every literal Unicode character that
 * lemma names, restricted to lemmas WordSeeder actually seeds as a Noun
 * (Word), never a Phrase -- WordNet's own multi-word lemmas for these
 * exact same concepts ("full_stop"/"full_point", "square_bracket"/
 * "angle_bracket", "quotation_mark"/"inverted_comma", "swung_dash") seed
 * as Phrases instead (any lemma spanning more than one token,
 * WordSeeder.seedWordNet's own "a multi-word synset lemma seeds as a
 * Phrase, not a Word" rule), so NounCharacterFormSeeder -- which only
 * ever scans Dictionary's own Nouns -- has no Noun to shallow-copy from
 * for those and they're deliberately absent here, not merely
 * de-prioritised.
 *
 * Two concepts have NO single-word lemma at all, in either of their two
 * WordNet lemmas -- "exclamation_mark"/"exclamation_point" (!) and
 * "question_mark"/"interrogation_point" (?) -- so "!" and "?" cannot be
 * produced by this role however it's driven; a genuine, permanent gap
 * given the source data, not an oversight.
 *
 * A lemma naming more than one glyph (brace, bracket, parenthesis,
 * quote) gets every one of its glyphs -- unlike the single-field
 * mutate-in-place design this replaced, creating a new Noun per
 * character removes the earlier need to pick (or refuse to pick) just
 * one. "bracket" alone covers both the square_bracket and angle_bracket
 * synsets (both share it as their own secondary lemma; their other,
 * more specific lemma is one of the multi-word casualties above), hence
 * four glyphs under one key. */
// A Map, not a plain object literal -- WordNet seeds real Noun lemmas
// that collide with Object.prototype's own property names ("constructor"
// is a real WordNet Noun, "someone who contracts for and supervises
// construction"), so a `{ ... }[key]` lookup would silently resolve
// those through the prototype chain instead of returning undefined.
export const NOUN_CHARACTER_FORMS: ReadonlyMap<string, readonly string[]> = new Map([
  ["ampersand", ["&"]],
  ["apostrophe", ["'"]],
  ["brace", ["{", "}"]],
  ["bracket", ["[", "]", "⟨", "⟩"]],
  ["colon", [":"]],
  ["comma", [","]],
  ["dash", ["-"]],
  ["diagonal", ["/"]],
  ["hyphen", ["-"]],
  ["parenthesis", ["(", ")"]],
  ["period", ["."]],
  ["point", ["."]],
  ["quote", ["\"", "‘", "’", "“", "”", "«", "»", "‹", "›"]],
  ["semicolon", [";"]],
  ["separatrix", ["/"]],
  ["slash", ["/"]],
  ["solidus", ["/"]],
  ["stop", ["."]],
  ["stroke", ["/"]],
  ["virgule", ["/"]],
]);

/** Creates one new Noun per literal Unicode character a mark-naming
 * WordNet Noun denotes, rather than annotating that Noun itself -- a
 * standalone post-seeding role, deliberately not folded into WordSeeder
 * (the same "separate role for a separate concern" shape
 * PartOfSpeechIdentifier/RelationshipSeeder already use). Every created
 * Noun is a shallow copy of the source Noun it was found from (sharing
 * that source's own senseIds unchanged, so the new Noun genuinely
 * belongs to the same synset/sense the source does -- this role never
 * fabricates a Sense of its own), given a fresh uuid and entryId (it is
 * a new, distinct lexical entry, not a Domain-copy of the source's own
 * persistent identity the way Dictionary.seedFrom/copyWordWithFreshUuid
 * intend), NOUN_CHARACTER_FORM_DOMAIN_TAG as its own domainTag, and
 * wordCharacterForm set to that one character. The source Noun itself
 * is never mutated. */
export class NounCharacterFormSeeder {
  constructor(private readonly dictionary: Dictionary) {}

  /** Scans every Noun already in this Dictionary at call time (a
   * snapshot -- Nouns this call itself creates are never re-scanned)
   * and, wherever its own lemma is a key of NOUN_CHARACTER_FORMS,
   * creates one new Noun per character listed for it, unless a Noun
   * with that same (text, NOUN_CHARACTER_FORM_DOMAIN_TAG, character)
   * combination already exists -- idempotent, so running this again
   * after an earlier pass (or against a Dictionary a previous pass
   * already populated) creates nothing further. Returns how many new
   * Nouns this call appended. */
  seed(): number {
    let created = 0;
    const existingNouns = this.dictionary.all().filter(isNoun);

    for (const source of existingNouns) {
      const key = source.text.trim().toLowerCase().replace(/\s+/g, "_");
      const characters = NOUN_CHARACTER_FORMS.get(key);
      if (characters === undefined) continue;

      for (const character of characters) {
        if (this.alreadyCreated(source.text, character)) continue;
        this.dictionary.append(this.characterNounFrom(source, character));
        created++;
      }
    }
    return created;
  }

  private alreadyCreated(text: string, character: string): boolean {
    return this.dictionary
      .lookupAll(text)
      .filter(isNoun)
      .some((word) => word.domainTag?.value === NOUN_CHARACTER_FORM_DOMAIN_TAG && word.wordCharacterForm?.value === character);
  }

  private characterNounFrom(source: Noun, character: string): Noun {
    return {
      ...source,
      uuid: { value: newUuid() },
      entryId: { value: newUuid() },
      domainTag: { value: NOUN_CHARACTER_FORM_DOMAIN_TAG },
      wordCharacterForm: { value: character },
    };
  }
}
