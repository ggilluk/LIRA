/** Determiner: Word's own DETERMINER-specific subtype. Its own row of
 * fields from the Word Form to Part of Speech Matrix (Singular/Plural
 * Number Form, Possessive Case Form) is no longer a set of scalar
 * fields here (Auxiliary's own precedent, data/entities/auxiliary.ts):
 * each would live as its own `WordForm` record instead, reached via
 * `Word.formIds` (data/word_form.ts, data/word_forms.ts's own
 * `WordForms` store) -- registered via `WordForms.registerNamedForm()`,
 * the same as every other migrated POS subtype, whenever a future
 * curation pass actually populates one. No production write site does
 * today -- the Common Vocabulary Cache's own determiners.json entries
 * (role/word_seeder.ts's own entryToWord()) don't set any of them, and
 * Pronoun's own docstring (../pronoun.ts) has the full story on the
 * separate, untouched `Dictionary.linkForm()`/`LemmaFormLink`
 * mechanism a closed-class Word's own inflection actually goes through
 * today. */

import { PartOfSpeech } from "../enums/part_of_speech";
import type { Word } from "./word";

export interface Determiner extends Word {
  partOfSpeech: PartOfSpeech.DETERMINER;
}
