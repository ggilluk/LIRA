/** Auxiliary: Word's own AUXILIARY-specific subtype. One Word per base
 * lemma (be, have, do, can, may, shall, will, must, ought, need, dare),
 * not one per surface spelling -- "was" and "were" are both values
 * living on WordForm records reached via this Word's own `formIds`
 * (data/entities/word.ts, data/word_form.ts), not two separate Words.
 * Settled after direct back-and-forth on the alternative (one Word per
 * surface form, mirroring the now-retired auxiliaries.json's flat
 * 36-entry layout): a surface-form model would have made
 * `lookupFormMatches()`/Dictionary.indexWordForms() (data/dictionary.ts)
 * redundant with Dictionary.lookupAll() itself.
 *
 * Unlike every other POS subtype (Noun, Verb, Adjective, Adverb,
 * Pronoun, Determiner), Auxiliary declares no scalar `*_Form` fields of
 * its own at all -- every one of its distinguishing spellings
 * (bareInfinitiveForm/presentTenseInstanceForm/presentTenseForm/
 * thirdPersonSingularPresentForm/pastTenseInstanceForm/pastTenseForm/
 * presentParticipleForm/pastParticipleForm/modalForm/secondaryModalForm)
 * now lives in a WordForm record instead (`WordForms.formsOf(auxiliary)`,
 * data/word_forms.ts), addressable and carrying its own Senses rather
 * than being a bare Text value with senses bulk-registered onto this
 * Word's own `senseIds`. `role/auxiliary_seeder.ts` is the only writer;
 * `role/processor/auxiliary_processor.ts`'s `validateAuxiliary()` reads
 * `WordForms.formsOf()` instead of named scalar fields.
 *
 * This is the one POS subtype that's adopted WordForm so far -- a
 * deliberate scope limit, not a claim every subtype should follow;
 * WordForm's own docstring (data/word_form.ts) has the full reasoning. */

import { PartOfSpeech } from "../enums/part_of_speech";
import type { Word } from "./word";

export interface Auxiliary extends Word {
  partOfSpeech: PartOfSpeech.AUXILIARY;
}
