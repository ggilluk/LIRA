/** Verb: Word's own VERB-specific subtype. Also see `framesForSense()`
 * (role/processor/verb_processor.ts) -- a real WordNet-sourced property this
 * codebase used to discard outright. Princeton WordNet 3.1's
 * dict/data.verb records, per synset, which of its own 35 standard
 * "generic verb frame" sentence patterns ("Somebody ----s something")
 * that synset's meaning fits -- sometimes naming the whole synset,
 * sometimes one specific member word only. wordnet_loader.ts's own
 * docstring used to say this block is "never retained"; it's parsed
 * into WordNetSynset.frames now instead, and WordSeeder.seedWordNet's
 * own synsetMemberToWord() resolves each (Verb, sense) pair's own
 * subset of applicable frame numbers against VERB_FRAME_TEXT
 * (data/enums/verb_framed_example_template.ts), storing the result on
 * the Senses store as per-membership metadata
 * (Senses.setMemberMetadata()'s own docstring, ../senses.ts) rather
 * than on the Verb itself -- a Verb is now unique by (partOfSpeech,
 * lemma) and can lexicalize several senses (Word.senseIds's own
 * docstring), and frame applicability is a fact about one specific
 * sense, not the spelling as a whole.
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

import type { Identifier } from "../../../value_objects";
import { PartOfSpeech } from "../enums/part_of_speech";
import type { Word } from "./word";

export interface Verb extends Word {
  partOfSpeech: PartOfSpeech.VERB;

  // Every field in this block is one half of a morphological-derivation
  // pointer pair -- Noun.isDerivedFromVerb's own docstring (../noun.ts)
  // has the full shared rationale (deriveMorphologicalPointers()/
  // findDerivationTarget(), role/word_seeder.ts) every one of these
  // fields, on every POS subtype, is built from, and the full reasoning
  // for why this is deliberately two fields, not four (an earlier
  // iteration had Verb.isDerivedFromNoun/isDerivedFromAdjective too,
  // reading WordNet's own reciprocal DERIVED_FORM pointer as if it were
  // a second, independent fact when it's actually the same relationship
  // Noun.isDerivedFromVerb/Adjective.isDerivedFromVerb already capture,
  // just recorded from the other word's own side). Undefined/false for
  // every Common Vocabulary Cache closed-class Verb; a Verb with more
  // than one qualifying edge keeps only the first one found.

  // This Verb's own uuid, per the Noun it nominalizes into ("decide" ->
  // "decision", "arrive" -> "arrival") -- Noun.isDerivedFromVerb's own
  // exact reverse. Named `isNominalised`, not `isNormalisedByNoun` as an
  // earlier iteration of this field had it -- "nominalised" is the real
  // linguistic term for "turned into a noun" ("normalised" means "made
  // standard/regular," an unrelated concept); dropping "ByNoun" too,
  // since "nominalised" already fully names what it becomes without
  // needing to restate it.
  isNominalised?: Identifier;
  isNominalisedIndicator: boolean;

  // The Adjective this Verb adjectivises into ("interest" -> "interesting")
  // -- a real WordNet ADJECTIVAL_DERIVATION pointer, source=this Verb --
  // Adjective.isDerivedFromVerb's own exact reverse.
  isAdjectivised?: Identifier;
  isAdjectivisedIndicator: boolean;

  // The rest of this subtype's own row of fields from the Word Form to
  // Part of Speech Matrix (../matrices/word_form_part_of_speech_matrix.md) --
  // Present Tense/Past Tense/Third Person Singular Present/Present
  // Participle/Past Participle/Bare Infinitive Form -- are no longer
  // scalar fields here (Auxiliary's own precedent,
  // data/entities/auxiliary.ts): each one now lives as its own
  // `WordForm` record, reached via `Word.wordFormIds` (data/word_form.ts,
  // data/word_forms.ts's own `WordForms` store), generated the same as
  // ever by generateVerbForms() (role/processor/verb_processor.ts) but
  // registered there via `WordForms.registerNamedForm()` instead of
  // assigned to a named field on this interface. First/Second/Third
  // Person Form (the matrix's own remaining VERB row -- applicable only
  // to a small subset of verb paradigms, e.g. "am" for "be", and even
  // then only via curated data the matrix marks fully `N/A` for Verb)
  // are dropped outright rather than ported -- confirmed by a repo-wide
  // grep that nothing has ever written to them.
}
