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

import type { Identifier, Text } from "../../value_objects";
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

  // Every field in this block is one half of a morphological-derivation
  // pointer pair -- Noun.isDerivedFromVerb's own docstring (data/noun.ts)
  // has the full shared rationale (deriveMorphologicalPointers()/
  // findDerivationTarget(), role/word_seeder.ts) every one of these
  // fields, on every POS subtype, is built from. Undefined/false for
  // every Common Vocabulary Cache closed-class Adjective; an Adjective
  // with more than one qualifying edge keeps only the first one found.
  // An Adjective sits at the centre of more of these pairs than any
  // other POS subtype -- WordNet's own `+` pointer data has a real
  // Adjective<->Noun, Adjective<->Verb, and Adjective<->Adverb
  // population each, not just one (the table these six fields implement
  // was built directly from that real per-pair pointer count).

  // The Noun this Adjective nominalizes into ("happy" -> "happiness") --
  // Noun.isDerivedFromAdjective's own exact reverse, same NOMINALISATION
  // kind Verb.isNominalised also reads (that field's own docstring on
  // why the source's own actual part of speech has to be checked).
  isNominalised?: Identifier;
  isNominalisedIndicator: boolean;

  // The Adverb this Adjective adverbialises into ("quick" -> "quickly")
  // -- a real WordNet ADVERBIAL_DERIVATION pointer, source=this
  // Adjective. Distinct from a Pertainym relationship (adverb.ts's own
  // determineGradability() docstring on that separate `\` pointer type,
  // "relates to" rather than "is formed from") -- this is WordNet's `+`
  // Derived-Form pointer specifically.
  isAdverbialised?: Identifier;
  isAdverbialisedIndicator: boolean;

  // The Verb this Adjective verbalises into ("clear" the adjective ->
  // "clear" the verb) -- read from WordNet's generic DERIVED_FORM kind.
  isVerbalised?: Identifier;
  isVerbalisedIndicator: boolean;

  // This Adjective's own uuid, per the Verb it adjectivises from
  // ("interesting" <- "interest") -- Verb.isAdjectivised's own exact
  // reverse, same ADJECTIVAL_DERIVATION kind isDerivedFromNoun/
  // isDerivedFromAdverb just below also read (three different real
  // source parts of speech, one shared target-driven kind).
  isDerivedFromVerb?: Identifier;
  isDerivedFromVerbIndicator: boolean;

  // This Adjective's own uuid, per the Noun it adjectivises from
  // ("wooden" <- "wood").
  isDerivedFromNoun?: Identifier;
  isDerivedFromNounIndicator: boolean;

  // This Adjective's own uuid, per the Adverb it adjectivises from.
  isDerivedFromAdverb?: Identifier;
  isDerivedFromAdverbIndicator: boolean;

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
  const adjective = createWord({ ...init, partOfSpeech: PartOfSpeech.ADJECTIVE }) as Adjective;
  if (adjective.isNominalisedIndicator === undefined) adjective.isNominalisedIndicator = false;
  if (adjective.isAdverbialisedIndicator === undefined) adjective.isAdverbialisedIndicator = false;
  if (adjective.isVerbalisedIndicator === undefined) adjective.isVerbalisedIndicator = false;
  if (adjective.isDerivedFromVerbIndicator === undefined) adjective.isDerivedFromVerbIndicator = false;
  if (adjective.isDerivedFromNounIndicator === undefined) adjective.isDerivedFromNounIndicator = false;
  if (adjective.isDerivedFromAdverbIndicator === undefined) adjective.isDerivedFromAdverbIndicator = false;
  return adjective;
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

/** Section 1 of the Gradability Update: whether `adjective` is
 * semantically gradable at all -- true once at least one of its own
 * Senses (never the primary sense alone, `adjective.senseIds`'s own
 * full list) carries a WordNet Attribute pointer at all. Must be
 * settled before any *_Form generation is attempted (Required
 * Processing Order) -- generateAdjectiveForms() below takes this as an
 * explicit precomputed argument rather than discovering it itself
 * precisely so that ordering can't be skipped by accident.
 *
 * Having the pointer at all is the signal, not a starting point that
 * then needs confirming by climbing its target's own Hypernym chain.
 * WordNet's `=` pointer exists specifically to link an adjective to
 * "the noun naming the attribute/dimension it's a value of"
 * (LexicalRelationshipType.ATTRIBUTE's own docstring,
 * enums/lexical_relationship_type.ts) -- a broad sample of real
 * Attribute targets taken directly from the bundled dict/data.adj (not
 * guessed) is uniformly genuine scalar/degree nouns regardless of which
 * branch of the noun hierarchy they sit in ("carefulness",
 * "liveliness", "convenience", "stature, height", "cheerfulness", ...),
 * so no further structural check adds real precision.
 *
 * An earlier version of this function instead required climbing
 * Hypernym* from the Attribute noun to one of two narrow anchor synsets
 * ("magnitude"/"measure, quantity, amount") before counting it --
 * reachable from "big"'s own Attribute noun ("size") in one hop, but
 * NOT from "tall"'s own Attribute noun ("stature, height"), which
 * climbs to "bodily_property" -> "property" instead, a sibling branch
 * of the noun hierarchy that never crosses into the magnitude branch at
 * all. That version therefore called "tall" non-gradable -- contradicting
 * this very feature's own worked example ("Tall[Adjective, Sense 4] ->
 * Attribute -> Height[Noun] -> Scalar Dimension" => "Gradable(tall) =
 * true"). Widening the anchor set doesn't fix this either: the only
 * hypernym "stature, height" and "size" both eventually share is
 * "property" itself (04923519-n) / "attribute" (00024444-n) -- which
 * every Attribute-linked noun climbs to sooner or later, scalar or not,
 * so accepting it as an anchor would make the Hypernym* check
 * unconditionally true and accepting anything narrower re-introduces
 * the exact same gap.
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
 * have to know or care about. */
export function determineGradability(relationships: LexicalRelationshipStore, adjective: Adjective): boolean {
  for (const senseId of adjective.senseIds) {
    const edges = [...relationships.outgoing(senseId.value), ...relationships.incoming(senseId.value)];
    if (edges.some((edge) => edge.relationshipType === LexicalRelationshipType.ATTRIBUTE)) return true;
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
