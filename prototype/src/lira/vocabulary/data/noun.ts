/** Noun: Word's own NOUN-specific subtype. `isCountable` has no
 * seeding source today -- neither Princeton WordNet's dict/ files nor
 * the Common Vocabulary Cache mark countability anywhere -- so it stays
 * undefined on every Noun WordSeeder produces; the field exists so a
 * future curation pass has somewhere to write "chair" (countable) vs.
 * "water" (uncountable) to, the same "declared before it's populated"
 * shape this codebase's other not-yet-seeded fields already have.
 * `wordCharacterForms` is the same shape again, for the literal Unicode
 * character(s) a mark-naming Noun ("comma", "ampersand", "brace")
 * itself denotes -- see that field's own docstring.
 *
 * `singularNumberForm`/`pluralNumberForm`/`possessiveCaseForm` are this
 * subtype's own row of fields from the Word Form to Part of Speech
 * Matrix (data/word_form_part_of_speech_matrix.md) -- undefined until a
 * seeding/curation pass populates them, same as `isCountable`. */

import type { Identifier, Text } from "../../value_objects";
import { PartOfSpeech } from "./enums/part_of_speech";
import { createWord, endsInConsonantY, validateFormText, validateWordFormAttributes, type Word, type WordFormIssue } from "./word";

export interface Noun extends Word {
  partOfSpeech: PartOfSpeech.NOUN;
  isCountable?: boolean;

  // Every literal Unicode character this Noun names, for the handful of
  // Nouns that are themselves the *name* of a mark rather than a word
  // that uses one -- "comma" -> [","], "ampersand" -> ["&"], "brace" ->
  // ["{", "}"] (a paired mark genuinely names more than one glyph at
  // once -- WordNet models "brace" as one generic sense for both, with
  // nothing in the lemma itself to pick a side, so both belong on the
  // same Noun rather than being split across siblings or arbitrarily
  // reduced to one). Not a Word Form Matrix field
  // (data/word_form_part_of_speech_matrix.md has no row for it) and not
  // spelling-derivable from the lemma the way pluralNumberForm etc. are,
  // so it carries no NOUN_FORM_PATTERNS entry and generateNounForms()
  // never touches it. Empty, not undefined, for every Noun with nothing
  // seeded -- NounCharacterFormSeeder (role/noun_character_form_seeder.ts)
  // is this field's only seeding source today, and
  // assets/common/en/punctuation_wordnet_hyponyms.json has the full
  // mark-name -> character(s) mapping it and any future curation pass
  // would read from.
  wordCharacterForms: readonly Text[];

  // Every field in this block is one half of a morphological-derivation
  // pointer pair -- the other half lives on the class named in the
  // field's own name (Verb/Adjective) -- all populated the identical way
  // by WordSeeder.seedWordNet's own deriveMorphologicalPointers()
  // (role/word_seeder.ts, that method's own docstring for the full
  // rationale and the shared findDerivationTarget() engine every one of
  // these fields, across every POS subtype, is built from): read back
  // from an already-seeded WordNet `+` Derived-Form pointer, never
  // itself creating a LexicalRelationship. Each pointer field's own
  // Indicator boolean is simply `field !== undefined`, kept as its own
  // property rather than left for every caller to check (never undefined
  // itself -- defaults false via createNoun below, the same convention
  // Word.isRootWord already uses). Undefined/false for every Common
  // Vocabulary Cache closed-class Noun, which has no relationship-graph
  // read-back pass of its own. A Noun with more than one qualifying edge
  // keeps only the first one found, the same arbitrary-but-deterministic
  // "pick one" convention Dictionary.lookup() already uses for a
  // homograph.
  //
  // Deliberately only two fields, not four -- Noun.isAdjectivised and
  // Noun.isVerbalised existed in an earlier iteration of this block and
  // were removed: WordNet records its own `+` Derived-Form pointer
  // reciprocally (once under the source word's own synset, once again
  // under the target's), and derivationKind() (role/word_seeder.ts)
  // picks a *different* LexicalRelationshipType for each direction --
  // so a Noun/Verb pair like "abandon"/"abandonment" produces both a
  // NOMINALISATION edge (verb->noun) and a separate DERIVED_FORM edge
  // (noun->verb) for the exact same underlying fact, not two distinct
  // ones. DERIVED_FORM itself is WordNet's own catch-all for "target
  // isn't Noun/Adjective/Adverb," not a genuine morphological category
  // the way Nominalisation/Adjectivisation/Adverbialisation are, so
  // building a "Verbalised"/"Adjectivised" field on top of it here
  // duplicated Verb.isNominalised/Adjective.isDerivedFromNoun's own
  // fact under a second, spurious name instead of describing anything
  // new. Correct linguistics, not WordNet's own storage convention, is
  // what these fields model -- there is exactly one derivational
  // relationship between two words, read from whichever single edge
  // NOMINALISATION/ADJECTIVAL_DERIVATION/ADVERBIAL_DERIVATION actually
  // produces, never from DERIVED_FORM.

  // This Noun's own uuid, per the Verb it nominalizes from ("decision"
  // <- "decide"). Distinct from Word.isDerivableNoun (that field's own
  // docstring): isDerivableNoun is a hand-curated boolean with no
  // pointer of its own; this is the real thing, read from a genuine
  // NOMINALISATION edge whose source resolves to a Verb specifically --
  // that same edge kind also covers Adjective->Noun ("happy"->"happiness"),
  // isDerivedFromAdjective's own case just below, so checking the
  // source's own actual part of speech is required, not defensive
  // boilerplate (deriveMorphologicalPointers()'s own docstring).
  isDerivedFromVerb?: Identifier;
  isDerivedFromVerbIndicator: boolean;

  // This Noun's own uuid, per the Adjective it nominalizes from ("happiness"
  // <- "happy") -- isDerivedFromVerb's own exact counterpart for the
  // other real source part of speech NOMINALISATION covers. The Noun-side
  // half of the one real Noun<->Adjective relationship -- Adjective is
  // treated as the canonical base form (Adjective.isNominalised, not a
  // separate Noun.isAdjectivised), matching how much more heavily
  // populated real WordNet data is in this direction.
  isDerivedFromAdjective?: Identifier;
  isDerivedFromAdjectiveIndicator: boolean;

  // The purpose is to identify the word form used when referring to
  // one person, thing, place, or idea. Fully lexical, not spelling-
  // derivable (the matrix's own Format/String Pattern rows are both
  // `N/A`) -- a populated value's own `Text.formats` should stay unset.
  singularNumberForm?: Text;
  // The purpose is to identify the word form used when referring to
  // more than one person, thing, place, or idea. Regular-case spelling
  // rules #1-4 are regex-derivable (`/s$/i`, `/es$/i`, `/ies$/i`,
  // `/ves$/i`) -- a populated regular-case value's own `Text.formats`
  // should carry whichever of those matched; rules #5-6 (irregular /
  // unchanged, "child"->"children", "sheep"->"sheep") have no format at
  // all and need curated data instead.
  pluralNumberForm?: Text;
  // The purpose is to identify the noun, pronoun, or determiner form
  // used to show that something belongs or relates to a person or
  // thing. Rules #1-2 are regex-derivable (`/'s$/i`, `/s'$/i` for an
  // existing plural) -- a populated value's own `Text.formats` should
  // carry whichever matched. Rule #3 (an explicitly classified
  // possessive spelling) is Pronoun/Determiner's own case, not Noun's.
  possessiveCaseForm?: Text;
}

export type NounInit = Pick<Noun, "text"> & Partial<Omit<Noun, "text" | "partOfSpeech">>;

export function createNoun(init: NounInit): Noun {
  const noun = createWord({ ...init, partOfSpeech: PartOfSpeech.NOUN }) as Noun;
  if (noun.isDerivedFromVerbIndicator === undefined) noun.isDerivedFromVerbIndicator = false;
  if (noun.isDerivedFromAdjectiveIndicator === undefined) noun.isDerivedFromAdjectiveIndicator = false;
  if (noun.wordCharacterForms === undefined) noun.wordCharacterForms = [];
  return noun;
}

export function isNoun(word: Word): word is Noun {
  return word.partOfSpeech === PartOfSpeech.NOUN;
}

// Noun's own row of the matrix's String Pattern column (data/word_form_part_of_speech_matrix.md),
// scoped to exactly the rules that apply to Noun specifically -- see each
// field's own docstring above for which numbered rule(s) these are and
// why the rest of that row's rules (irregular, curated-only, or another
// class's own) are simply absent here.
export const NOUN_FORM_PATTERNS: Readonly<Record<string, readonly string[]>> = {
  singularNumberForm: [],
  pluralNumberForm: ["/s$/i", "/es$/i", "/ies$/i", "/ves$/i"],
  possessiveCaseForm: ["/'s$/i", "/s'$/i"],
};

/** Validates every *_Form field this Noun carries -- its own row above,
 * plus baseLemmaCanonicalForm via Word's own validateWordFormAttributes
 * -- against NOUN_FORM_PATTERNS. Returns every issue found, not just the
 * first; empty means every populated field is internally consistent
 * with the matrix, not that every field is populated (undefined is
 * never an issue, validateFormText's own docstring). */
export function validateNoun(noun: Noun): readonly WordFormIssue[] {
  const issues: WordFormIssue[] = [...validateWordFormAttributes(noun)];
  const check = (field: keyof typeof NOUN_FORM_PATTERNS, text: Text | undefined): void => {
    if (text === undefined) return;
    const issue = validateFormText(field, text, NOUN_FORM_PATTERNS[field]);
    if (issue !== undefined) issues.push(issue);
  };
  check("singularNumberForm", noun.singularNumberForm);
  check("pluralNumberForm", noun.pluralNumberForm);
  check("possessiveCaseForm", noun.possessiveCaseForm);
  return issues;
}

/** pluralNumberForm's own Generation Transform (data/word_form_part_of_speech_matrix.md),
 * regular-case rules #1-3 only -- rule #4 (`f`/`fe` -> `ves`) needs
 * "lexical qualification" the matrix's own row admits isn't spelling
 * alone ("roof" takes plain -s, "knife" takes -ves, and both end the
 * same way), so a lemma matching that shape is left undefined rather
 * than guessed either way; rules #5-6 (irregular/unchanged) have no
 * spelling signal to detect at all. */
function generatedPluralNumberForm(lemma: string): Text | undefined {
  if (endsInConsonantY(lemma)) return { value: `${lemma.slice(0, -1)}ies`, formats: ["/ies$/i"] };
  if (/(s|x|z|ch|sh)$/i.test(lemma)) return { value: `${lemma}es`, formats: ["/es$/i"] };
  if (/(f|fe)$/i.test(lemma)) return undefined;
  return { value: `${lemma}s`, formats: ["/s$/i"] };
}

/** Fills in this Noun's own derivable *_Form fields wherever still
 * undefined, from its own base lemma (`noun.text`) -- WordSeeder's own
 * seeding entry points (role/word_seeder.ts) call this right after
 * createNoun(), so every seeded Noun (WordNet or Common Vocabulary
 * Cache alike) gets its regular-case forms populated automatically,
 * without a hand-authored Noun built elsewhere (a test fixture, say)
 * acquiring fields it never asked for just by calling createNoun().
 * Only ever fills a field that's still undefined -- an explicitly-set
 * value (from `init`, or an earlier call) is never overwritten. Every
 * value this produces is provably one of that field's own recognised
 * String Patterns (NOUN_FORM_PATTERNS above), by construction --
 * generateNounForms() and validateNoun() are built from the exact same
 * matrix rows, so a freshly-generated Noun always passes its own
 * validateNoun() unchanged. */
export function generateNounForms(noun: Noun): Noun {
  const lemma = noun.text;
  const generated: Partial<Noun> = {};
  if (noun.singularNumberForm === undefined) generated.singularNumberForm = { value: lemma };
  if (noun.pluralNumberForm === undefined) {
    const plural = generatedPluralNumberForm(lemma);
    if (plural !== undefined) generated.pluralNumberForm = plural;
  }
  if (noun.possessiveCaseForm === undefined) generated.possessiveCaseForm = { value: `${lemma}'s`, formats: ["/'s$/i"] };
  return { ...noun, ...generated };
}
