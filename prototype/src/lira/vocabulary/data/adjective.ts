/** Adjective: Word's own ADJECTIVE-specific subtype. Also home to
 * `syntacticPositionForSense()` below -- a real WordNet-sourced property
 * this codebase used to discard outright. Princeton WordNet 3.1's
 * dict/data.adj marks some lemmas with a trailing, space-free
 * parenthetical -- "afraid(p)", "galore(ip)" -- restricting where that
 * specific sense of the adjective can sit relative to the noun it
 * modifies. wordnet_loader.ts's own cleanLemma() already stripped this
 * marker before this existed; it's parsed into WordNetSynset.lemmaPositions
 * now instead, and WordSeeder.seedWordNet's own synsetMemberToWord()
 * reads it from there, storing the result on the Senses store as per-
 * membership metadata (Senses.setMemberMetadata()'s own docstring,
 * data/senses.ts) rather than on the Adjective itself -- an Adjective is
 * now unique by (partOfSpeech, lemma) and can lexicalize several senses
 * (Word.senseIds's own docstring), and a syntactic-position restriction
 * is a fact about one specific sense ("afraid" is predicate-only in its
 * "frightened" sense but has no such restriction in some other sense
 * sharing that spelling), not the spelling as a whole.
 *
 * Verified directly against the bundled dict/ files, not guessed: a
 * scan of all four dict/data.* files found `(a)`/`(p)`/`(ip)` are the
 * *only* trailing parenthetical markers ever attached directly to a
 * lemma token (never in data.noun/data.verb/data.adv), so this is safe
 * to treat as an exhaustive, closed set. */

import type { Text } from "../../value_objects";
import { LexicalRelationshipType } from "./enums/lexical_relationship_type";
import { PartOfSpeech } from "./enums/part_of_speech";
import type { LexicalRelationshipStore } from "./lexical_relationship_store";
import type { Senses } from "./senses";
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

// WordNet's own three syntactic-position restrictions for an adjective
// sense -- undefined (syntacticPositionForSense's own return) means
// unrestricted (attributive AND predicative both fine), the common
// case; only ~4% of dict/data.adj's own lemmas carry one of these three
// markers at all.
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

  // The rest of this subtype's own row of fields from the Word Form to
  // Part of Speech Matrix (data/word_form_part_of_speech_matrix.md) --
  // undefined until a seeding/curation pass populates them, the same as
  // `syntacticPosition` for a non-WordNet-sourced Adjective.

  // The purpose is to identify the basic adjective or adverb form that
  // describes a quality without comparing it with another. Fully
  // lexical, not spelling-derivable (the matrix's own Format/String
  // Pattern rows are both `N/A`) -- a populated value's own
  // `Text.formats` should stay unset.
  positiveDegreeForm?: Text;
  // The purpose is to identify the adjective or adverb form used to
  // compare the degree of a quality between two people, things,
  // actions, or states. Applies only to gradable adjectives ("bigger"),
  // not to every adjective ("more unique" is non-standard, not
  // "uniquer"). Rules #1-4 are regex-derivable (`/er$/i` twice over,
  // `/ier$/i`, a doubled-final-consonant pattern) -- a populated
  // regular-case value's own `Text.formats` should carry whichever
  // matched; rule #5 (irregular, "good"->"better") has no format and
  // needs curated data instead.
  comparativeDegreeForm?: Text;
  // The purpose is to identify the adjective or adverb form used to
  // identify the highest or lowest degree of a quality within a group.
  // Same gradable-only caveat as comparativeDegreeForm above. Rules
  // #1-4 are regex-derivable (`/est$/i` twice over, `/iest$/i`, a
  // doubled-final-consonant pattern) -- a populated regular-case
  // value's own `Text.formats` should carry whichever matched; rule #5
  // (irregular, "good"->"best") has no format and needs curated data
  // instead.
  superlativeDegreeForm?: Text;
}

export type AdjectiveInit = Pick<Adjective, "text"> & Partial<Omit<Adjective, "text" | "partOfSpeech">>;

export function createAdjective(init: AdjectiveInit): Adjective {
  return createWord({ ...init, partOfSpeech: PartOfSpeech.ADJECTIVE }) as Adjective;
}

export function isAdjective(word: Word): word is Adjective {
  return word.partOfSpeech === PartOfSpeech.ADJECTIVE;
}

/** `adjective`'s own syntactic-position restriction *for this one
 * sense*, or undefined for no restriction -- Senses.setMemberMetadata()'s
 * own read side (data/senses.ts), written once per (Adjective, Sense)
 * pair by WordSeeder.seedWordNet's own synsetMemberToWord(). `senseId`
 * is one of `adjective.senseIds`'s own entries (Word.senseIds's own
 * docstring on why an Adjective can carry more than one); passing a
 * senseId this Adjective doesn't actually lexicalize just returns
 * undefined, the same as no restriction ever having been recorded. */
export function syntacticPositionForSense(senses: Senses, adjective: Adjective, senseId: string): AdjectivePosition | undefined {
  return senses.metadataFor(senseId, adjective.uuid.value)?.syntacticPosition as AdjectivePosition | undefined;
}

// Adjective's own row of the matrix's String Pattern column (data/word_form_part_of_speech_matrix.md),
// scoped to exactly the rules that apply to Adjective specifically --
// see each field's own docstring above for which numbered rule(s) these
// are and why the rest of that row's rules (irregular, curated-only, or
// another class's own) are simply absent here.
export const ADJECTIVE_FORM_PATTERNS: Readonly<Record<string, readonly string[]>> = {
  positiveDegreeForm: [],
  comparativeDegreeForm: ["/er$/i", "/ier$/i", "/([bcdfghjklmnpqrstvwxyz])\\1er$/i", "/^more\\s+.+$/i"],
  superlativeDegreeForm: ["/est$/i", "/iest$/i", "/([bcdfghjklmnpqrstvwxyz])\\1est$/i", "/^most\\s+.+$/i"],
};

/** Validates every *_Form field this Adjective carries -- its own row
 * above, plus baseLemmaCanonicalForm via Word's own
 * validateWordFormAttributes -- against ADJECTIVE_FORM_PATTERNS.
 * Returns every issue found, not just the first; empty means every
 * populated field is internally consistent with the matrix, not that
 * every field is populated (undefined is never an issue,
 * validateFormText's own docstring). */
export function validateAdjective(adjective: Adjective): readonly WordFormIssue[] {
  const issues: WordFormIssue[] = [...validateWordFormAttributes(adjective)];
  const check = (field: keyof typeof ADJECTIVE_FORM_PATTERNS, text: Text | undefined): void => {
    if (text === undefined) return;
    const issue = validateFormText(field, text, ADJECTIVE_FORM_PATTERNS[field]);
    if (issue !== undefined) issues.push(issue);
  };
  check("positiveDegreeForm", adjective.positiveDegreeForm);
  check("comparativeDegreeForm", adjective.comparativeDegreeForm);
  check("superlativeDegreeForm", adjective.superlativeDegreeForm);
  return issues;
}

// WordNet noun synsets an Attribute-linked noun sense must trace back
// to (itself or a Hypernym ancestor) to count as an "ordered scalar
// dimension" -- verified directly against the bundled dict/data.noun,
// not guessed: offset 00033914 is "measure, quantity, amount" ("how
// much there is or how many there are of something that you can
// quantify"), offset 05097645 is "magnitude" ("the property of relative
// size or extent (whether large or small)"). Between them these anchor
// every attribute noun a genuinely gradable adjective was checked
// against while building this (temperature, speed, age, price, ... all
// climb to "measure, quantity, amount"; size/height/weight/depth/... all
// climb to "magnitude" -- "height" itself does by exactly two Hypernym
// hops, "height" -> "dimension" -> "magnitude", the same chain "tall"'s
// own Attribute pointer resolves through). A *direct* Attribute noun
// that's already one of these two, or a direct hyponym of one, counts
// without climbing any further -- reaching a noun explicitly named
// "measure" is never required, only sufficient.
const SCALAR_DIMENSION_NOUN_SYNSET_IDS: ReadonlySet<string> = new Set([
  "00033914-n", // measure, quantity, amount
  "05097645-n", // magnitude
]);

// A generous but finite bound on how many Hypernym hops isScalarDimensionNoun
// climbs from one Attribute-linked noun sense before giving up -- purely
// a cycle/runaway guard (WordNet's own noun hierarchy is a DAG in
// principle, though never observed to cycle in the bundled dict/
// files), not a real truncation: every anchor above sits within a
// handful of hops of any noun that could plausibly reach it.
const MAX_HYPERNYM_CLIMB = 16;

/** Whether `nounSenseId` (a Sense.uuid) itself, or one of its Hypernym
 * ancestors reached by breadth-first climbing `relationships`' own
 * outgoing HYPERNYM edges, is one of SCALAR_DIMENSION_NOUN_SYNSET_IDS
 * above -- the "Hypernym* -> Scalar/Ordered Dimension" half of
 * determineGradability()'s own structural test
 * ("Adjective Sense -> Attribute -> Noun Sense -> Hypernym* ->
 * Scalar/Ordered Dimension"). A HYPERNYM edge here is always Sense-to-
 * Sense (WordSeeder.seedPointerRelationship's own synset-level-pointer
 * branch, role/word_seeder.ts), the same as the ATTRIBUTE edge
 * determineGradability() itself already reads -- so `nounSenseId` and
 * every ancestor id this visits are Sense uuids throughout, never a
 * Word/Phrase uuid. */
function isScalarDimensionNoun(senses: Senses, relationships: LexicalRelationshipStore, nounSenseId: string): boolean {
  const visited = new Set<string>();
  let frontier = [nounSenseId];
  for (let depth = 0; depth < MAX_HYPERNYM_CLIMB && frontier.length > 0; depth += 1) {
    const next: string[] = [];
    for (const senseId of frontier) {
      if (visited.has(senseId)) continue;
      visited.add(senseId);
      const sense = senses.findByUuid(senseId);
      if (sense?.synsetId !== undefined && SCALAR_DIMENSION_NOUN_SYNSET_IDS.has(sense.synsetId.value)) return true;
      for (const edge of relationships.outgoing(senseId)) {
        if (edge.relationshipType === LexicalRelationshipType.HYPERNYM) next.push(edge.targetWordId.value);
      }
    }
    frontier = next;
  }
  return false;
}

/** Section 1 of the Gradability Update: whether `adjective` is
 * semantically gradable at all -- true only once at least one of its
 * own Senses (never the primary sense alone, `adjective.senseIds`'s own
 * full list) carries a WordNet Attribute pointer to a noun sense that
 * itself represents an ordered scalar dimension
 * (isScalarDimensionNoun() above). Must be settled before any *_Form
 * generation is attempted (Required Processing Order) -- generateAdjectiveForms()
 * below takes this as an explicit precomputed argument rather than
 * discovering it itself precisely so that ordering can't be skipped by
 * accident.
 *
 * Checks both `outgoing` and `incoming` for each own Sense, not
 * `outgoing` alone -- ATTRIBUTE is one of WordSeeder's own
 * SYMMETRIC_RELATIONSHIP_KINDS (role/word_seeder.ts's own docstring:
 * WordNet lists a `=` Attribute pointer on *both* the adjective's own
 * synset record and the noun's own reciprocal record, and WordSeeder
 * dedups the second occurrence as already covered rather than storing
 * it a second time), so which of the two real, matching WordNet
 * pointers happens to get processed first during seeding -- and
 * therefore which direction the one stored edge ends up facing --
 * depends on synset file order, not on anything this function should
 * have to know or care about. Every ATTRIBUTE edge this reads is
 * Sense-to-Sense (isScalarDimensionNoun's own docstring on why), so this
 * only ever looks at `senseId.value` on both ends, never a Word/Phrase
 * uuid. */
export function determineGradability(senses: Senses, relationships: LexicalRelationshipStore, adjective: Adjective): boolean {
  for (const senseId of adjective.senseIds) {
    const edges = [...relationships.outgoing(senseId.value), ...relationships.incoming(senseId.value)];
    for (const edge of edges) {
      if (edge.relationshipType !== LexicalRelationshipType.ATTRIBUTE) continue;
      const nounSenseId = edge.sourceWordId.value === senseId.value ? edge.targetWordId.value : edge.sourceWordId.value;
      if (isScalarDimensionNoun(senses, relationships, nounSenseId)) return true;
    }
  }
  return false;
}

/** Fills in this Adjective's own derivable *_Form fields wherever still
 * undefined, from its own base lemma (`adjective.text`) --
 * WordSeeder's own seeding entry points (role/word_seeder.ts) call this,
 * so every seeded Adjective (WordNet or Common Vocabulary Cache alike)
 * gets its degree forms populated automatically, without a hand-
 * authored Adjective built elsewhere (a test fixture, say) acquiring
 * fields it never asked for just by calling createAdjective(). Only
 * ever fills a field that's still undefined -- an explicitly-set value
 * (from `init`, or an earlier call) is never overwritten.
 *
 * `gradable` is `determineGradability()`'s own precomputed answer for
 * this Adjective (Required Processing Order: Gradability must already
 * be settled by the time this runs, not decided here). When `false`,
 * Positive Degree Form is the only field this ever populates --
 * Comparative/Superlative Degree Form stay absent rather than getting a
 * mechanically well-formed but semantically invalid value ("wooden" ->
 * "woodener"), the exact bug this parameter exists to close. When
 * `true`, isPeriphrasticComparison() (word.ts) picks the comparison
 * strategy (synthetic "-er"/"-est" vs. periphrastic "more"/"most") and
 * regularDegreeForm()/periphrasticDegreeForm() (word.ts) produce the
 * actual spelling for whichever one applies -- regularDegreeForm() can
 * still abstain on its own separate spelling grounds (its own
 * docstring), so a gradable Adjective can legitimately end up with
 * Positive Degree Form only too, same as a non-gradable one, just for a
 * different reason. Every value this produces is provably one of that
 * field's own recognised String Patterns (ADJECTIVE_FORM_PATTERNS
 * above), by construction -- generateAdjectiveForms() and
 * validateAdjective() both draw on the exact same matrix rows, so a
 * freshly-generated Adjective always passes its own validateAdjective()
 * unchanged. */
export function generateAdjectiveForms(adjective: Adjective, gradable: boolean): Adjective {
  const lemma = adjective.text;
  const generated: Partial<Adjective> = {};
  if (adjective.positiveDegreeForm === undefined) generated.positiveDegreeForm = { value: lemma };
  if (gradable) {
    const periphrastic = isPeriphrasticComparison(lemma);
    if (adjective.comparativeDegreeForm === undefined) {
      const comparative = periphrastic ? periphrasticDegreeForm(lemma, true) : regularDegreeForm(lemma, true);
      if (comparative !== undefined) generated.comparativeDegreeForm = comparative;
    }
    if (adjective.superlativeDegreeForm === undefined) {
      const superlative = periphrastic ? periphrasticDegreeForm(lemma, false) : regularDegreeForm(lemma, false);
      if (superlative !== undefined) generated.superlativeDegreeForm = superlative;
    }
  }
  return { ...adjective, ...generated };
}
