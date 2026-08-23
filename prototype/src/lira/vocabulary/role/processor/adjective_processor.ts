import { SemanticRelationshipKind } from "../../data/enums/semantic_relationship_kind";
import { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Senses } from "../../data/senses";
import type { SemanticRelationshipStore } from "../../data/semantic_relationship_store";
import type { Word } from "../../data/entities/word";
import type { WordForms } from "../../data/word_forms";
import {
  createWord,
  isPeriphrasticComparison,
  periphrasticDegreeForm,
  regularDegreeForm,
  validateFormText,
  type WordFormIssue,
} from "../word_processor";
import type { Adjective } from "../../data/entities/adjective";
import { AdjectivePosition } from "../../data/enums/adjective_position";
import { stringPatternsFor } from "../../data/matrices/pos_vs_wordform_matrice";

export type AdjectiveInit = Pick<Adjective, "text"> & Partial<Omit<Adjective, "text" | "partOfSpeech">>;

export function createAdjective(init: AdjectiveInit): Adjective {
  const adjective = createWord({ ...init, partOfSpeech: PartOfSpeech.ADJECTIVE }) as Adjective;
  if (adjective.isNominalisedIndicator === undefined) adjective.isNominalisedIndicator = false;
  if (adjective.isAdverbialisedIndicator === undefined) adjective.isAdverbialisedIndicator = false;
  if (adjective.isDerivedFromVerbIndicator === undefined) adjective.isDerivedFromVerbIndicator = false;
  return adjective;
}

export function isAdjective(word: Word): word is Adjective {
  return word.partOfSpeech === PartOfSpeech.ADJECTIVE;
}

/** `adjective`'s own syntactic-position restriction *for this one
 * sense*, or undefined for no restriction -- Senses.setMemberMetadata()'s
 * own read side (../data/senses.ts), written once per (Adjective, Sense)
 * pair by WordSeeder.seedWordNet's own synsetMemberToWord(). `senseId`
 * is one of `adjective.senseIds`'s own entries (Word.senseIds's own
 * docstring on why an Adjective can carry more than one); passing a
 * senseId this Adjective doesn't actually lexicalize just returns
 * undefined, the same as no restriction ever having been recorded. */
export function syntacticPositionForSense(senses: Senses, adjective: Adjective, senseId: string): AdjectivePosition | undefined {
  return senses.metadataFor(senseId, adjective.uuid.value)?.syntacticPosition as AdjectivePosition | undefined;
}

/** Validates every WordForm this Adjective carries -- its own row
 * above, plus baseLemmaCanonicalForm (both registered onto
 * `wordForms`, so both are covered by the same loop) -- against
 * WORD_FORM_MATRIX's own ADJECTIVE rules
 * (data/matrices/pos_vs_wordform_matrice.ts). Returns every issue
 * found, not just the first; empty means every populated field is
 * internally consistent with the matrix, not that every field is
 * populated. validateAuxiliary()'s own exact shape
 * (role/processor/auxiliary_processor.ts). */
export function validateAdjective(adjective: Adjective, wordForms: WordForms): readonly WordFormIssue[] {
  const issues: WordFormIssue[] = [];
  for (const form of wordForms.formsOf(adjective)) {
    const issue = validateFormText(form.field, form.text, stringPatternsFor(form.field, PartOfSpeech.ADJECTIVE));
    if (issue !== undefined) issues.push(issue);
  }
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
 * (SemanticRelationshipKind.ATTRIBUTE's own docstring,
 * ../data/enums/semantic_relationship_kind.ts) -- a broad sample of real
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
export function determineGradability(relationships: SemanticRelationshipStore, adjective: Adjective, wordForms: WordForms | undefined): boolean {
  for (const senseId of wordForms?.senseIdsOf(adjective) ?? []) {
    const edges = [...relationships.outgoing(senseId.value), ...relationships.incoming(senseId.value)];
    if (edges.some((edge) => edge.relationshipType === SemanticRelationshipKind.ATTRIBUTE)) return true;
  }
  return false;
}

/** Registers this Adjective's own derivable WordForms wherever not
 * already present, from its own base lemma (`adjective.text`) --
 * WordSeeder's own seeding entry points (role/word_seeder.ts) call this,
 * so every seeded Adjective (WordNet or Common Vocabulary Cache alike)
 * gets its degree forms populated automatically, without a hand-
 * authored Adjective built elsewhere (a test fixture, say) acquiring
 * forms it never asked for just by calling createAdjective(). No-op when
 * `wordForms` is undefined (mirrors `senseStore?:`'s own optional
 * convention throughout role/word_seeder.ts). Only ever registers a
 * field not already present via `WordForms.registerNamedForm()`'s own
 * idempotent find-or-create -- an explicitly-registered value (from an
 * earlier call) is never overwritten.
 *
 * `gradable` is `determineGradability()`'s own precomputed answer for
 * this Adjective (Required Processing Order: Gradability must already
 * be settled by the time this runs, not decided here). When `false`,
 * Positive Degree Form is the only field this ever registers --
 * Comparative/Superlative Degree Form stay unregistered rather than
 * getting a mechanically well-formed but semantically invalid value
 * ("wooden" -> "woodener"), the exact bug this parameter exists to
 * close. When `true`, isPeriphrasticComparison() (../word_processor.ts)
 * picks the comparison strategy (synthetic "-er"/"-est" vs. periphrastic
 * "more"/"most") and regularDegreeForm()/periphrasticDegreeForm()
 * (../word_processor.ts) produce the actual spelling for whichever one
 * applies -- regularDegreeForm() can still abstain on its own separate
 * spelling grounds (its own docstring), so a gradable Adjective can
 * legitimately end up with Positive Degree Form only too, same as a
 * non-gradable one, just for a different reason. Every value this
 * produces is provably one of that field's own recognised String
 * Patterns (WORD_FORM_MATRIX's own ADJECTIVE rules), by construction --
 * generateAdjectiveForms() and validateAdjective() both draw on the
 * exact same matrix rows, so a freshly-generated Adjective always
 * passes its own validateAdjective() unchanged. Fields are registered in
 * the Word Form Matrix's own row order (positive, comparative,
 * superlative) so Word Forms UI display order stays unaffected by this
 * migration. Returns `adjective` unchanged -- registration is a side
 * effect on `wordForms`, not a copy of `adjective` itself. */
export function generateAdjectiveForms(adjective: Adjective, gradable: boolean, wordForms: WordForms | undefined): Adjective {
  if (wordForms === undefined) return adjective;
  const lemma = adjective.text;
  const has = (field: string): boolean => wordForms.formsOf(adjective).some((form) => form.field === field);

  if (!has("positiveDegreeForm")) wordForms.registerNamedForm(adjective, "positiveDegreeForm", { value: lemma });

  if (gradable) {
    const periphrastic = isPeriphrasticComparison(lemma);
    if (!has("comparativeDegreeForm")) {
      const comparative = periphrastic ? periphrasticDegreeForm(lemma, true) : regularDegreeForm(lemma, true);
      if (comparative !== undefined) wordForms.registerNamedForm(adjective, "comparativeDegreeForm", comparative);
    }
    if (!has("superlativeDegreeForm")) {
      const superlative = periphrastic ? periphrasticDegreeForm(lemma, false) : regularDegreeForm(lemma, false);
      if (superlative !== undefined) wordForms.registerNamedForm(adjective, "superlativeDegreeForm", superlative);
    }
  }

  return adjective;
}
