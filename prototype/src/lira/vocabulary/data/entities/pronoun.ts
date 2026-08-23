/** Pronoun: Word's own PRONOUN-specific subtype -- the closed class
 * with the richest row of its own in the Word Form to Part of Speech
 * Matrix (../matrices/word_form_part_of_speech_matrix.md), matching how much a
 * pronoun paradigm actually varies (I/me/my/mine/myself, he/him/his/
 * himself, ...) compared to every other closed class. Every one of
 * those fields (Singular/Plural Number Form, First/Second/Third Person
 * Form, Subjective/Objective/Possessive/Reflexive Case Form) is no
 * longer a scalar field here (Auxiliary's own precedent,
 * data/entities/auxiliary.ts): each would live as its own `WordForm`
 * record instead, reached via `Word.formIds` (data/word_form.ts,
 * data/word_forms.ts's own `WordForms` store) -- registered via
 * `WordForms.registerNamedForm()`, the same as every other migrated POS
 * subtype, whenever a future curation pass actually populates one. No
 * production write site does today -- the Common Vocabulary Cache's own
 * pronouns.json entries (role/word_seeder.ts's own entryToWord())
 * express inflection through a completely separate, pre-existing
 * mechanism instead (`Dictionary.linkForm()`/`LemmaFormLink` -- one
 * independent Word per surface form, e.g. "you" links to "yours"/
 * "yourself"/"yourselves" as three separate Words), left untouched by
 * this migration. */

import { PartOfSpeech } from "../enums/part_of_speech";
import type { Word } from "./word";

export interface Pronoun extends Word {
  partOfSpeech: PartOfSpeech.PRONOUN;
}
