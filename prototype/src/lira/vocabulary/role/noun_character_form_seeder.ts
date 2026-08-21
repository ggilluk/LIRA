import type { Dictionary } from "../data/dictionary";
import { createNoun, isNoun } from "./processor/noun_processor";

// A Map, not a plain object literal -- WordNet seeds real Noun lemmas
// that collide with Object.prototype's own property names ("constructor"
// is a real WordNet Noun, "someone who contracts for and supervises
// construction"), so a `{ ... }[key]` lookup would silently resolve
// those through the prototype chain instead of returning undefined.
//
// Single-word WordNet lemma -> every literal Unicode character that
// lemma names, restricted to lemmas WordSeeder actually seeds as a Noun
// (Word), never a Phrase -- WordNet's own multi-word lemmas for these
// exact same concepts ("full_stop"/"full_point", "square_bracket"/
// "angle_bracket", "quotation_mark"/"inverted_comma", "swung_dash") seed
// as Phrases instead (any lemma spanning more than one token,
// WordSeeder.seedWordNet's own "a multi-word synset lemma seeds as a
// Phrase, not a Word" rule), so this role -- which finds a Noun by
// lemma text -- has no Word to update for those and they're
// deliberately absent here, not merely de-prioritised.
//
// A paired-mark lemma (brace: { and }; bracket: [ ] and ⟨ ⟩;
// parenthesis: ( and ); quotation_mark/quote/inverted_comma: nine
// distinct quote glyphs across punctuation.json) gets every one of its
// glyphs on the one Noun that names it -- Noun.wordCharacterForms is an
// array precisely so this doesn't need to pick a side or split across
// separate Nouns the way a single-Text field would have forced. "quote"
// alone stands in for the whole quotation_mark synset -- "quotation_mark"
// and "inverted_comma" are themselves multi-word, so "quote" is the only
// single-word lemma of that synset reachable here.
//
// Two concepts have NO single-word lemma at all, in either of their two
// WordNet lemmas -- "exclamation_mark"/"exclamation_point" (!) and
// "question_mark"/"interrogation_point" (?) -- so "!" and "?" cannot be
// produced by this role however it's driven; a genuine, permanent gap
// given the source data, not an oversight.
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

/** Populates Noun.wordCharacterForms by updating the Noun that already
 * names each mark, never by creating a sibling copy of it -- a
 * standalone post-seeding role, deliberately not folded into WordSeeder
 * (the same "separate role for a separate concern" shape
 * PartOfSpeechIdentifier/RelationshipSeeder already use). For each
 * NOUN_CHARACTER_FORMS lemma: if a Noun with that exact text already
 * exists in this Dictionary (the common case -- every lemma here is a
 * real WordNet Noun), its own wordCharacterForms gets every one of that
 * lemma's own characters merged in (deduplicated, existing entries
 * preserved); only when no such Noun exists at all is a brand-new one
 * created (an essentially unreachable path against a WordNet-seeded
 * Dictionary, since every lemma above was confirmed to already resolve
 * to a real Noun -- this exists for a Dictionary that hasn't been
 * WordNet-seeded, e.g. a hand-curated-only cache or a test fixture). */
export class NounCharacterFormSeeder {
  constructor(private readonly dictionary: Dictionary) {}

  /** Upserts wordCharacterForms for every NOUN_CHARACTER_FORMS lemma --
   * updates the existing Noun's own array when found (merging in any
   * character not already present, never duplicating one already
   * there), or creates a brand-new Noun carrying the full character set
   * when no Noun with that lemma exists yet. Idempotent: a repeat call
   * merges nothing further. Returns how many Nouns were updated and how
   * many were newly created. */
  seed(): { updated: number; created: number } {
    let updated = 0;
    let created = 0;
    for (const [lemma, characters] of NOUN_CHARACTER_FORMS) {
      const existing = this.dictionary.lookupAll(lemma).find(isNoun);
      if (existing !== undefined) {
        // `?? []` guards a real gap, not defensive boilerplate: a NOUN
        // this Dictionary holds isn't guaranteed to have gone through
        // createNoun() -- AsyncDictionaryHydrator (dictionary_hydrator.ts)
        // builds a hydrated candidate via createWord() directly, so
        // wordCharacterForms can be undefined at runtime on an object
        // Noun's own type declares it non-optional on.
        const currentForms = existing.wordCharacterForms ?? [];
        const present = new Set(currentForms.map((text) => text.value));
        const missing = characters.filter((character) => !present.has(character));
        if (missing.length > 0) {
          existing.wordCharacterForms = [...currentForms, ...missing.map((character) => ({ value: character }))];
          updated++;
        }
        continue;
      }
      this.dictionary.append(createNoun({ text: lemma, wordCharacterForms: characters.map((character) => ({ value: character })) }));
      created++;
    }
    return { updated, created };
  }
}
