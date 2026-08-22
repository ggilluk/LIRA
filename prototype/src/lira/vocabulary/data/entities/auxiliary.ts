/** Auxiliary: Word's own AUXILIARY-specific subtype. One Word per base
 * lemma (be, have, do, can, may, shall, will, must, ought, need, dare),
 * not one per
 * surface spelling -- "was" and "were" are both values living on the
 * single "be" Word, not two separate Words, the same shape Verb already
 * uses for its own *_Form fields. Settled after direct back-and-forth on
 * the alternative (one Word per surface form, mirroring the now-retired
 * auxiliaries.json's flat 36-entry layout): a surface-form model would
 * have made `lookupFormMatches()`/Dictionary.indexWordForms() (data/
 * dictionary.ts) redundant with Dictionary.lookupAll() itself, and would
 * have needed a new Sense-cardinality concept no other POS subtype has.
 * The lemma model instead reuses exactly what Verb already established:
 * an inflected spelling lives in a *_Form field, and
 * Dictionary.indexWordForms() makes that spelling findable by
 * lookupFormMatches() even though it was never its own Dictionary entry.
 *
 * "each form has a sense": a Word already carries more than one Sense
 * (Word.senseIds's own docstring, Verb's identical "unique by
 * (partOfSpeech, lemma), can lexicalize several senses" note) -- so
 * every distinct meaning of every *_Form value on one Auxiliary Word
 * gets its own Sense, all registered against that one shared Word via
 * Senses.registerMember() (role/auxiliary_seeder.ts), the same
 * mechanism word_seeder.ts's own registerUniqueSense() already uses,
 * just called once per meaning instead of once per Word. No per-field
 * Sense-linkage type exists (or is needed) -- which spelling a Sense
 * belongs to is read from that Sense's own definition text, exactly as
 * a WordNet synset's Sense already does for its own member words.
 *
 * Every field below is optional because no single lemma populates all
 * of them -- "be" is the only lemma that needs the Instance/general
 * present- and past-tense split (presentTenseInstanceForm/
 * pastTenseInstanceForm), "have"/"do" need only the plain Verb-style
 * subset, and the six modals (can, may, shall, will, must, ought) need
 * only modalForm/secondaryModalForm, never any of the Verb-style
 * fields -- modals have no infinitive, no participle, no third-person
 * agreement. */

import type { Text } from "../../../value_objects";
import { PartOfSpeech } from "../enums/part_of_speech";
import type { Word } from "./word";

export interface Auxiliary extends Word {
  partOfSpeech: PartOfSpeech.AUXILIARY;

  // The bare/base spelling used without "to" -- "be", "have", "do".
  // Undefined for every modal (can/may/shall/will/must/ought): a modal
  // has no infinitive form of its own at all, unlike a true verb.
  bareInfinitiveForm?: Text;

  // The present-tense form tied to one specific Determiner/pronoun --
  // "am" (Determiner: I) is "be"'s only case; no other lemma in this
  // subtype needs this field, since "have"/"do" don't vary by person
  // beyond the ordinary thirdPersonSingularPresentForm split below.
  presentTenseInstanceForm?: Text;

  // The general present-tense form covering every Determiner/pronoun
  // this lemma doesn't single out via presentTenseInstanceForm above --
  // "are" (we/you/they) for "be". "have"/"do" don't need this field
  // either: their own bareInfinitiveForm already doubles as the general
  // present form ("I/we/you/they have", not a distinct spelling).
  presentTenseForm?: Text;

  // The present-tense form used when the subject is one person or
  // thing other than the speaker/listener -- "is" (be), "has" (have),
  // "does" (do). Verb's own identical field, same irregular-only rule.
  thirdPersonSingularPresentForm?: Text;

  // The past-tense form tied to one specific Determiner/pronoun --
  // "was" (Determiner: I/he/she/it), "be"'s own exact counterpart to
  // presentTenseInstanceForm above. No other lemma needs this field.
  pastTenseInstanceForm?: Text;

  // The general past-tense form covering every Determiner/pronoun this
  // lemma doesn't single out via pastTenseInstanceForm -- "were" (we/
  // you/they) for "be"; the plain, undifferentiated past tense for
  // "have"/"do" ("had", "did").
  pastTenseForm?: Text;

  // The -ing form -- "being" (be), "having" (have). "do" has none in
  // this subtype's own scope (see auxiliary_seeder.ts's own docstring
  // on why "doing"/"done" stayed out, and the GitHub issue tracking
  // them as a follow-up).
  presentParticipleForm?: Text;

  // The form used to construct perfect tenses and passive expressions
  // -- "been" (be), "had" (have, a second, distinct Sense from the same
  // spelling's own pastTenseForm meaning).
  pastParticipleForm?: Text;

  // The primary modal spelling -- "can", "may", "shall", "will",
  // "must", "ought", and the two semi-modals "need"/"dare" in their
  // own invariant auxiliary use (their ordinary, regularly-inflecting
  // lexical-verb use is a separate VERB Word, out of this subtype's
  // scope). The one field every modal/semi-modal lemma populates; none
  // of the Verb-style fields above apply to a modal at all.
  modalForm?: Text;

  // The secondary/preterite-present modal spelling paired with
  // modalForm -- "could", "might", "should", "would". Undefined for
  // "must"/"ought"/"need"/"dare": all four are defective, with no
  // secondary form of their own (this subtype's own sense data reflects
  // that gap directly, rather than inventing a placeholder).
  secondaryModalForm?: Text;
}
