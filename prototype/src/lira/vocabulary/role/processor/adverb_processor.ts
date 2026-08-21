import type { Text } from "../../../value_objects";
import { determineGradability as isAdjectiveGradable, isAdjective } from "./adjective_processor";
import type { Dictionary } from "../../data/dictionary";
import { SemanticRelationshipKind } from "../../data/enums/semantic_relationship_kind";
import { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Senses } from "../../data/senses";
import type { SemanticRelationshipStore } from "../../data/semantic_relationship_store";
import {
  createWord,
  isPeriphrasticComparison,
  periphrasticDegreeForm,
  regularDegreeForm,
  validateFormText,
  validateWordFormAttributes,
  type Word,
  type WordFormIssue,
} from "../../data/word";
import type { Adverb } from "../../data/entities/adverb";
import { stringPatternsFor } from "../../data/matrices/pos_vs_wordform_matrice";

export type AdverbInit = Pick<Adverb, "text"> & Partial<Omit<Adverb, "text" | "partOfSpeech">>;

export function createAdverb(init: AdverbInit): Adverb {
  const adverb = createWord({ ...init, partOfSpeech: PartOfSpeech.ADVERB }) as Adverb;
  if (adverb.isDerivedFromAdjectiveIndicator === undefined) adverb.isDerivedFromAdjectiveIndicator = false;
  return adverb;
}

export function isAdverb(word: Word): word is Adverb {
  return word.partOfSpeech === PartOfSpeech.ADVERB;
}

/** Validates every *_Form field this Adverb carries -- its own row
 * above, plus baseLemmaCanonicalForm via Word's own
 * validateWordFormAttributes -- against WORD_FORM_MATRIX's own ADVERB
 * rules (data/matrices/pos_vs_wordform_matrice.ts). Returns
 * every issue found, not just the first; empty means every populated
 * field is internally consistent with the matrix, not that every field
 * is populated (undefined is never an issue, validateFormText's own
 * docstring). */
export function validateAdverb(adverb: Adverb): readonly WordFormIssue[] {
  const issues: WordFormIssue[] = [...validateWordFormAttributes(adverb)];
  const check = (field: string, text: Text | undefined): void => {
    if (text === undefined) return;
    const issue = validateFormText(field, text, stringPatternsFor(field, PartOfSpeech.ADVERB));
    if (issue !== undefined) issues.push(issue);
  };
  check("positiveDegreeForm", adverb.positiveDegreeForm);
  check("comparativeDegreeForm", adverb.comparativeDegreeForm);
  check("superlativeDegreeForm", adverb.superlativeDegreeForm);
  return issues;
}

/** Adverb's own counterpart to determineGradability() (adjective_processor.ts)
 * -- gradability isn't determined the same way here, so this lives in
 * Adverb's own processor rather than being shared: WordNet gives an
 * adverb no Attribute pointer of its own at all (verified directly
 * against the bundled dict/data.adv, not guessed -- zero `=` pointers
 * exist there). What it does give a manner adverb like "quickly" is a
 * Pertainym fact (WordNet's `\` symbol, seeded as a genuine
 * SemanticRelationship -- SemanticRelationshipKind.PERTAINYM's own
 * docstring on why this moved off LexicalRelationshipType entirely)
 * back to the adjective it's derived from ("quick") -- read here as
 * `relationships.outgoing(senseId.value)` for each of `adverb.senseIds`
 * in turn (a Pertainym target genuinely differs from one sense of a
 * polysemous adverb to another, so this checks every one of its own
 * senses rather than a single Adverb-wide fact), resolving each fact's
 * own target *Sense* to its member Words via `senses.membersOf()` -- a
 * SemanticRelationship connects two Senses, not two Words, so the
 * Adjective(s) that actually lexicalize the target meaning are read
 * back out from there. This Adverb's own gradability is inherited from
 * whichever Pertainym-linked Adjective(s), across every one of its own
 * senses, are themselves gradable (determineGradability(),
 * adjective_processor.ts) -- true as soon as one is, the same "any one
 * is enough, not just the first" shape that function's own "not the
 * primary sense alone" rule has. An Adverb with no Pertainym fact at
 * all (rare in the bundled data -- well under 1% of adverbs) has
 * nothing to inherit from and comes out non-gradable, matching
 * Gradability Evaluation step 6's own default (adjective_processor.ts's
 * docstring): no established scalar dimension means Gradable = false. */
export function determineGradability(relationships: SemanticRelationshipStore, dictionary: Dictionary, senses: Senses, adverb: Adverb): boolean {
  for (const senseId of adverb.senseIds) {
    for (const edge of relationships.outgoing(senseId.value)) {
      if (edge.relationshipType !== SemanticRelationshipKind.PERTAINYM) continue;
      for (const target of senses.membersOf(edge.targetSenseId.value)) {
        if ("words" in target || !isAdjective(target)) continue;
        if (isAdjectiveGradable(relationships, target)) return true;
      }
    }
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

/** Adjective's own generateAdjectiveForms() (adjective_processor.ts),
 * Adverb's counterpart -- both classes' degree paradigm is spelled from
 * the same primitives (regularDegreeForm/periphrasticDegreeForm,
 * ../data/word.ts) and both are gated on `gradable` the same way; see
 * generateAdjectiveForms() for the full reasoning behind that
 * parameter, not repeated here. The one real difference is the
 * comparison-strategy decision itself -- isAdverbPeriphrasticComparison()
 * above, not word.ts's own isPeriphrasticComparison() directly.
 * WordSeeder's own seeding entry points (role/word_seeder.ts) call this. */
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
