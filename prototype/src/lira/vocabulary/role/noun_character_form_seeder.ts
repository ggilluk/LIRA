import type { Dictionary } from "../data/dictionary";
import { createNoun, isNoun } from "../data/noun";

// A Map, not a plain object literal -- WordNet seeds real Noun lemmas
// that collide with Object.prototype's own property names ("constructor"
// is a real WordNet Noun, "someone who contracts for and supervises
// construction"), so a `{ ... }[key]` lookup would silently resolve
// those through the prototype chain instead of returning undefined.
//
// Single-word WordNet lemma -> the one literal Unicode character that
// lemma unambiguously names, restricted to lemmas WordSeeder actually
// seeds as a Noun (Word), never a Phrase -- WordNet's own multi-word
// lemmas for these exact same concepts ("full_stop"/"full_point",
// "square_bracket"/"angle_bracket", "quotation_mark"/"inverted_comma",
// "swung_dash") seed as Phrases instead (any lemma spanning more than
// one token, WordSeeder.seedWordNet's own "a multi-word synset lemma
// seeds as a Phrase, not a Word" rule), so this role -- which finds a
// Noun by lemma text -- has no Word to update for those and they're
// deliberately absent here, not merely de-prioritised.
//
// A lemma that names more than one glyph (brace: { or }; bracket:
// [ ] or ⟨ ⟩; parenthesis: ( or ); quotation_mark/quote/inverted_comma:
// nine distinct quote glyphs across punctuation.json) is deliberately
// excluded too -- Noun.wordCharacterForm is a single Text field, so a
// single Noun can't represent more than one glyph at once, and picking
// just one would be a guess with nothing in the lemma itself to justify
// it (the same "leave undefined over guessing" convention noun.ts's own
// generatedPluralNumberForm already uses for its -f/-fe case).
//
// Two concepts have NO single-word lemma at all, in either of their two
// WordNet lemmas -- "exclamation_mark"/"exclamation_point" (!) and
// "question_mark"/"interrogation_point" (?) -- so "!" and "?" cannot be
// produced by this role however it's driven; a genuine, permanent gap
// given the source data, not an oversight.
export const NOUN_CHARACTER_FORMS: ReadonlyMap<string, string> = new Map([
  ["ampersand", "&"],
  ["apostrophe", "'"],
  ["colon", ":"],
  ["comma", ","],
  ["dash", "-"],
  ["diagonal", "/"],
  ["hyphen", "-"],
  ["period", "."],
  ["point", "."],
  ["semicolon", ";"],
  ["separatrix", "/"],
  ["slash", "/"],
  ["solidus", "/"],
  ["stop", "."],
  ["stroke", "/"],
  ["virgule", "/"],
]);

/** Populates Noun.wordCharacterForm by updating the Noun that already
 * names each mark, never by creating a sibling copy of it -- a
 * standalone post-seeding role, deliberately not folded into WordSeeder
 * (the same "separate role for a separate concern" shape
 * PartOfSpeechIdentifier/RelationshipSeeder already use). For each
 * NOUN_CHARACTER_FORMS lemma: if a Noun with that exact text already
 * exists in this Dictionary (the common case -- every lemma here is a
 * real WordNet Noun), its own wordCharacterForm is set in place; only
 * when no such Noun exists at all is a brand-new one created (an
 * essentially unreachable path against a WordNet-seeded Dictionary,
 * since every lemma above was confirmed to already resolve to a real
 * Noun -- this exists for a Dictionary that hasn't been WordNet-seeded,
 * e.g. a hand-curated-only cache or a test fixture). An earlier version
 * of this role took the opposite approach -- shallow-copying the source
 * Noun into a brand-new sibling per glyph, to sidestep the ambiguous-
 * lemma problem above -- but that produced two visually-identical
 * "comma" rows with nothing in the UI distinguishing them, so it was
 * reverted in favour of this simpler, if less complete, update-in-place
 * shape. */
export class NounCharacterFormSeeder {
  constructor(private readonly dictionary: Dictionary) {}

  /** Upserts wordCharacterForm for every NOUN_CHARACTER_FORMS lemma:
   * updates the existing Noun's own field when found (unconditionally,
   * not just when still undefined -- the mapping is deterministic, so
   * re-running this converges to the same value every time rather than
   * merely filling a gap once), or creates a brand-new Noun carrying it
   * when no Noun with that lemma exists yet. Returns how many Nouns were
   * updated and how many were newly created. */
  seed(): { updated: number; created: number } {
    let updated = 0;
    let created = 0;
    for (const [lemma, character] of NOUN_CHARACTER_FORMS) {
      const existing = this.dictionary.lookupAll(lemma).find(isNoun);
      if (existing !== undefined) {
        existing.wordCharacterForm = { value: character };
        updated++;
        continue;
      }
      this.dictionary.append(createNoun({ text: lemma, wordCharacterForm: { value: character } }));
      created++;
    }
    return { updated, created };
  }
}
