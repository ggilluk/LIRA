/** Adverb: Word's own ADVERB-specific subtype. Unlike Noun/Verb/
 * Adjective, neither Princeton WordNet's dict/data.adv nor the Common
 * Vocabulary Cache carries any adverb-specific marker this codebase
 * discards today (Verb's `frames`/Adjective's `syntacticPosition`
 * docstrings on where those two came from), so every field below is
 * undefined until a future seeding/curation pass populates it -- the
 * class still exists, and still carries its own row of fields from the
 * Word Form to Part of Speech Matrix
 * (data/word_form_part_of_speech_matrix.md), the same as its three
 * siblings, ready for a value once one is available. */

import type { Identifier, Text } from "../../value_objects";
import { determineGradability as isAdjectiveGradable, isAdjective } from "./adjective";
import type { Dictionary } from "./dictionary";
import { LexicalRelationshipType } from "./enums/lexical_relationship_type";
import { PartOfSpeech } from "./enums/part_of_speech";
import type { LexicalRelationshipStore } from "./lexical_relationship_store";
import {
  createWord,
  isPeriphrasticComparison,
  periphrasticDegreeForm,
  regularDegreeForm,
  validateFormText,
  validateWordFormAttributes,
  type Word,
  type WordFormIssue,
} from "./word";

export interface Adverb extends Word {
  partOfSpeech: PartOfSpeech.ADVERB;

  // One half of a morphological-derivation pointer pair --
  // Noun.isDerivedFromVerb's own docstring (data/noun.ts) has the full
  // shared rationale (deriveMorphologicalPointers()/findDerivationTarget(),
  // role/word_seeder.ts) every one of these fields, on every POS
  // subtype, is built from. Undefined/false for every Common Vocabulary
  // Cache closed-class Adverb.

  // The Adjective this Adverb adjectivises into -- a real WordNet
  // ADJECTIVAL_DERIVATION pointer, source=this Adverb.
  isAdjectivised?: Identifier;
  isAdjectivisedIndicator: boolean;

  // This Adverb's own uuid, per the Adjective it adverbialises from
  // ("quickly" <- "quick") -- Adjective.isAdverbialised's own exact
  // reverse.
  isDerivedFromAdjective?: Identifier;
  isDerivedFromAdjectiveIndicator: boolean;

  // The purpose is to identify the basic adjective or adverb form that
  // describes a quality without comparing it with another. Fully
  // lexical, not spelling-derivable (the matrix's own Format/String
  // Pattern rows are both `N/A`) -- a populated value's own
  // `Text.formats` should stay unset.
  positiveDegreeForm?: Text;
  // The purpose is to identify the adjective or adverb form used to
  // compare the degree of a quality between two people, things,
  // actions, or states. Applies only to gradable adverbs ("faster"),
  // not to every adverb. Rules #1-4 are regex-derivable (`/er$/i` twice
  // over, `/ier$/i`, a doubled-final-consonant pattern) -- a populated
  // regular-case value's own `Text.formats` should carry whichever
  // matched; rule #5 (irregular, "well"->"better") has no format and
  // needs curated data instead.
  comparativeDegreeForm?: Text;
  // The purpose is to identify the adjective or adverb form used to
  // identify the highest or lowest degree of a quality within a group.
  // Same gradable-only caveat as comparativeDegreeForm above. Rules
  // #1-4 are regex-derivable (`/est$/i` twice over, `/iest$/i`, a
  // doubled-final-consonant pattern) -- a populated regular-case
  // value's own `Text.formats` should carry whichever matched; rule #5
  // (irregular, "well"->"best") has no format and needs curated data
  // instead.
  superlativeDegreeForm?: Text;
}

export type AdverbInit = Pick<Adverb, "text"> & Partial<Omit<Adverb, "text" | "partOfSpeech">>;

export function createAdverb(init: AdverbInit): Adverb {
  const adverb = createWord({ ...init, partOfSpeech: PartOfSpeech.ADVERB }) as Adverb;
  if (adverb.isAdjectivisedIndicator === undefined) adverb.isAdjectivisedIndicator = false;
  if (adverb.isDerivedFromAdjectiveIndicator === undefined) adverb.isDerivedFromAdjectiveIndicator = false;
  return adverb;
}

export function isAdverb(word: Word): word is Adverb {
  return word.partOfSpeech === PartOfSpeech.ADVERB;
}

// Adverb's own row of the matrix's String Pattern column (data/word_form_part_of_speech_matrix.md),
// scoped to exactly the rules that apply to Adverb specifically -- see
// each field's own docstring above for which numbered rule(s) these are
// and why the rest of that row's rules (irregular, curated-only, or
// another class's own) are simply absent here.
export const ADVERB_FORM_PATTERNS: Readonly<Record<string, readonly string[]>> = {
  positiveDegreeForm: [],
  comparativeDegreeForm: ["/er$/i", "/ier$/i", "/([bcdfghjklmnpqrstvwxyz])\\1er$/i", "/^more\\s+.+$/i"],
  superlativeDegreeForm: ["/est$/i", "/iest$/i", "/([bcdfghjklmnpqrstvwxyz])\\1est$/i", "/^most\\s+.+$/i"],
};

/** Validates every *_Form field this Adverb carries -- its own row
 * above, plus baseLemmaCanonicalForm via Word's own
 * validateWordFormAttributes -- against ADVERB_FORM_PATTERNS. Returns
 * every issue found, not just the first; empty means every populated
 * field is internally consistent with the matrix, not that every field
 * is populated (undefined is never an issue, validateFormText's own
 * docstring). */
export function validateAdverb(adverb: Adverb): readonly WordFormIssue[] {
  const issues: WordFormIssue[] = [...validateWordFormAttributes(adverb)];
  const check = (field: keyof typeof ADVERB_FORM_PATTERNS, text: Text | undefined): void => {
    if (text === undefined) return;
    const issue = validateFormText(field, text, ADVERB_FORM_PATTERNS[field]);
    if (issue !== undefined) issues.push(issue);
  };
  check("positiveDegreeForm", adverb.positiveDegreeForm);
  check("comparativeDegreeForm", adverb.comparativeDegreeForm);
  check("superlativeDegreeForm", adverb.superlativeDegreeForm);
  return issues;
}

/** Adverb's own counterpart to determineGradability() (data/adjective.ts)
 * -- gradability isn't determined the same way here, so this lives in
 * Adverb's own file rather than being shared: WordNet gives an adverb
 * no Attribute pointer of its own at all (verified directly against the
 * bundled dict/data.adv, not guessed -- zero `=` pointers exist there).
 * What it does give a manner adverb like "quickly" is a Pertainym
 * pointer (WordNet's `\` symbol) back to the adjective it's derived
 * from ("quick") -- always a lexical, word-specific pointer (unlike
 * Attribute/Hypernym, which are synset-wide), so it resolves through
 * `dictionary` to a Word directly, never a Sense. This Adverb's own
 * gradability is inherited from whichever Pertainym-linked Adjective(s)
 * are themselves gradable (determineGradability(), adjective.ts) --
 * true as soon as one is, the same "any one is enough, not just the
 * first" shape that function's own "not the primary sense alone" rule
 * has. An Adverb with no Pertainym pointer at all (rare in the bundled
 * data -- well under 1% of adverbs) has nothing to inherit from and
 * comes out non-gradable, matching Gradability Evaluation step 6's own
 * default (data/adjective.ts's docstring): no established scalar
 * dimension means Gradable = false. */
export function determineGradability(relationships: LexicalRelationshipStore, dictionary: Dictionary, adverb: Adverb): boolean {
  for (const edge of relationships.outgoing(adverb.uuid.value)) {
    if (edge.relationshipType !== LexicalRelationshipType.PERTAINYM) continue;
    const target = dictionary.findByUuid(edge.targetWordId.value);
    if (target === undefined || !isAdjective(target)) continue;
    if (isAdjectiveGradable(relationships, target)) return true;
  }
  // Flat-adverb fallback: some adverbs ("fast", "hard", "late", "early")
  // share their base Adjective's exact spelling rather than deriving
  // via a "-ly" suffix WordNet would record a Pertainym pointer for --
  // verified directly against the bundled dict/data.adv, these get no
  // Pertainym pointer linking the two senses at all, so the loop above
  // alone would leave a genuinely gradable flat adverb stranded with
  // nothing to inherit from. `dictionary.lookupAll()` matches by
  // spelling; the `.text ===` check on top restores the exact-case
  // identity match lookupAll() alone doesn't guarantee (word_seeder.ts's
  // own "hegira"/"Hegira" case, its own docstring).
  for (const candidate of dictionary.lookupAll(adverb.text)) {
    if (!isAdjective(candidate) || candidate.text !== adverb.text) continue;
    if (isAdjectiveGradable(relationships, candidate)) return true;
  }
  return false;
}

// "-ly" is English's productive adverb-forming suffix (quickly,
// obviously, scarcely, ...) -- word.ts's own isPeriphrasticComparison()
// would otherwise route a lemma like "scarcely" through
// endsInConsonantY()'s "y" rule (word.ts), the one built for a short
// Adjective's own "y" ending (happy -> happier, ugly -> uglier), since
// "-ly" happens to match that same consonant+y spelling. But no real
// "-ly" adverb takes "-ier"/"-iest" the way "happy"/"ugly" do -- there
// is no "quicklier" -- so Adverb's own comparison-strategy decision
// treats any "-ly"-ending lemma as periphrastic outright, ahead of
// word.ts's own shared check, rather than inheriting Adjective's "y"
// rule unmodified. This is Adverb-specific (word.ts's own
// isPeriphrasticComparison() stays correct for Adjective, unchanged),
// so it lives here rather than in the shared spelling primitives.
function isAdverbPeriphrasticComparison(lemma: string): boolean {
  return /ly$/i.test(lemma) || isPeriphrasticComparison(lemma);
}

/** Adjective's own generateAdjectiveForms() (adjective.ts), Adverb's
 * counterpart -- both classes' degree paradigm is spelled from the same
 * primitives (regularDegreeForm/periphrasticDegreeForm, word.ts) and
 * both are gated on `gradable` the same way; see generateAdjectiveForms()
 * for the full reasoning behind that parameter, not repeated here. The
 * one real difference is the comparison-strategy decision itself --
 * isAdverbPeriphrasticComparison() above, not word.ts's own
 * isPeriphrasticComparison() directly. WordSeeder's own seeding entry
 * points (role/word_seeder.ts) call this. */
export function generateAdverbForms(adverb: Adverb, gradable: boolean): Adverb {
  const lemma = adverb.text;
  const generated: Partial<Adverb> = {};
  if (adverb.positiveDegreeForm === undefined) generated.positiveDegreeForm = { value: lemma };
  if (gradable) {
    const periphrastic = isAdverbPeriphrasticComparison(lemma);
    if (adverb.comparativeDegreeForm === undefined) {
      const comparative = periphrastic ? periphrasticDegreeForm(lemma, true) : regularDegreeForm(lemma, true);
      if (comparative !== undefined) generated.comparativeDegreeForm = comparative;
    }
    if (adverb.superlativeDegreeForm === undefined) {
      const superlative = periphrastic ? periphrasticDegreeForm(lemma, false) : regularDegreeForm(lemma, false);
      if (superlative !== undefined) generated.superlativeDegreeForm = superlative;
    }
  }
  return { ...adverb, ...generated };
}
