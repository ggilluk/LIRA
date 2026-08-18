/** Validates a POS subtype's own `*_Form` Text attributes against the
 * Word Form to Part of Speech Matrix (data/word_form_part_of_speech_matrix.md),
 * using Text.formats (value_objects/data/text.ts) -- the regex
 * pattern(s) a Text value claims to satisfy.
 *
 * WORD_FORM_PATTERNS below is the matrix's own String Pattern column,
 * transcribed as data, scoped per (class, field) pair rather than per
 * field name alone -- the same numbered row can mean a different
 * pattern subset depending which class carries it (Noun.possessiveCaseForm's
 * own docstring, noun.ts: rules #1-2 there; Pronoun.possessiveCaseForm's
 * own docstring, pronoun.ts: rule #3 there instead). An entry's own
 * array holds only the *derivable* rules for that (class, field) --
 * every `N/A` row/rule (irregulars, closed fixed-word lookups the
 * matrix marks as needing curated data, or a field the matrix marks
 * fully lexical) is simply absent, which is exactly why an empty array
 * still means something: no regex claim can ever be valid there, so a
 * populated value with `formats` set on one of those fields is always
 * flagged. Every field below matches exactly what its own POS class
 * file's docstring already documents -- kept here as the single
 * machine-checkable source of truth, not duplicated by hand a second
 * time in each of those files. */

import type { Text } from "../../value_objects";
import { isAdjective } from "./adjective";
import { isAdverb } from "./adverb";
import { isDeterminer } from "./determiner";
import { isNoun } from "./noun";
import { isPronoun } from "./pronoun";
import { isVerb } from "./verb";
import type { Word } from "./word";

export const WORD_FORM_PATTERNS: Readonly<Record<string, readonly string[]>> = {
  "Word.baseLemmaCanonicalForm": [],

  "Noun.singularNumberForm": [],
  "Noun.pluralNumberForm": ["/s$/i", "/es$/i", "/ies$/i", "/ves$/i"],
  "Noun.possessiveCaseForm": ["/'s$/i", "/s'$/i"],

  "Verb.presentTenseForm": [],
  "Verb.pastTenseForm": ["/ed$/i", "/ied$/i", "/([bcdfghjklmnpqrstvwxyz])\\1ed$/i"],
  "Verb.thirdPersonSingularPresentForm": ["/s$/i", "/es$/i", "/ies$/i"],
  "Verb.presentParticipleForm": ["/ing$/i", "/([bcdfghjklmnpqrstvwxyz])\\1ing$/i", "/ying$/i"],
  "Verb.pastParticipleForm": ["/ed$/i", "/ied$/i", "/(en|n)$/i"],
  "Verb.bareInfinitiveForm": [],
  "Verb.firstPersonForm": [],
  "Verb.secondPersonForm": [],
  "Verb.thirdPersonForm": [],

  "Adjective.positiveDegreeForm": [],
  "Adjective.comparativeDegreeForm": ["/er$/i", "/ier$/i", "/([bcdfghjklmnpqrstvwxyz])\\1er$/i"],
  "Adjective.superlativeDegreeForm": ["/est$/i", "/iest$/i", "/([bcdfghjklmnpqrstvwxyz])\\1est$/i"],

  "Adverb.positiveDegreeForm": [],
  "Adverb.comparativeDegreeForm": ["/er$/i", "/ier$/i", "/([bcdfghjklmnpqrstvwxyz])\\1er$/i"],
  "Adverb.superlativeDegreeForm": ["/est$/i", "/iest$/i", "/([bcdfghjklmnpqrstvwxyz])\\1est$/i"],

  "Pronoun.singularNumberForm": [],
  "Pronoun.pluralNumberForm": [],
  "Pronoun.firstPersonForm": ["/^(I|me|my|mine|myself)$/i", "/^(we|us|our|ours|ourselves)$/i"],
  "Pronoun.secondPersonForm": ["/^(you|your|yours)$/i", "/^yourself$/i", "/^yourselves$/i"],
  "Pronoun.thirdPersonForm": [
    "/^(he|she|it|him|her|his|hers|its|himself|herself|itself)$/i",
    "/^(they|them|their|theirs|themselves)$/i",
  ],
  "Pronoun.subjectiveCaseForm": ["/^(I|we|you|he|she|it|they)$/i"],
  "Pronoun.objectiveCaseForm": ["/^(me|us|you|him|her|it|them)$/i"],
  "Pronoun.possessiveCaseForm": ["/^(my|mine|your|yours|his|her|hers|its|our|ours|their|theirs)$/i"],
  "Pronoun.reflexiveCaseForm": ["/self$/i", "/selves$/i"],

  "Determiner.singularNumberForm": [],
  "Determiner.pluralNumberForm": [],
  "Determiner.possessiveCaseForm": ["/^(my|mine|your|yours|his|her|hers|its|our|ours|their|theirs)$/i"],
};

/** Parses one `Text.formats` entry ("/s$/i") into a real RegExp --
 * splits on the *last* "/" as the flags delimiter (none of
 * WORD_FORM_PATTERNS' own patterns ever contain a literal "/" in their
 * body, so this is unambiguous for every pattern this file actually
 * defines). Throws on a malformed pattern string (no leading "/") --
 * deliberately, since a caller passing one is a programming error, not
 * a validation outcome to report gracefully the way an unrecognised
 * *pattern* (validateWordFormText's own concern) is. */
export function parseFormatPattern(pattern: string): RegExp {
  if (!pattern.startsWith("/")) throw new Error(`not a "/pattern/flags"-shaped format string: '${pattern}'`);
  const lastSlash = pattern.lastIndexOf("/");
  return new RegExp(pattern.slice(1, lastSlash), pattern.slice(lastSlash + 1));
}

export interface WordFormIssue {
  field: string;
  reason: string;
}

/** Checks one Text value's own `formats` (if set at all -- unset is
 * always valid, the same "no claim made" reading `Text.formats`'s own
 * docstring gives it) against `key`'s known pattern set above. Two
 * distinct ways to fail: a claimed format isn't one of the patterns
 * WORD_FORM_PATTERNS actually recognises for this (class, field) pair
 * at all (a typo, a pattern copied from the wrong field, or a field
 * the matrix marks fully `N/A`/lexical, whose own array is always
 * empty); or the claimed format IS recognised, but `text.value` itself
 * doesn't actually match it (stale data -- the value changed after
 * `formats` was set, or the two were never consistent to begin with). */
export function validateWordFormText(key: string, text: Text): WordFormIssue | undefined {
  if (text.formats === undefined) return undefined;
  const known = WORD_FORM_PATTERNS[key];
  if (known === undefined) {
    return { field: key, reason: `no word-form patterns are registered for '${key}'` };
  }
  for (const claimed of text.formats) {
    if (!known.includes(claimed)) {
      return {
        field: key,
        reason: `'${claimed}' is not a recognised String Pattern for '${key}' (word_form_part_of_speech_matrix.md)`,
      };
    }
    if (!parseFormatPattern(claimed).test(text.value)) {
      return { field: key, reason: `'${text.value}' does not match its own claimed format '${claimed}'` };
    }
  }
  return undefined;
}

/** Every `*_Form` field WORD_FORM_PATTERNS above actually covers for
 * `word`'s own concrete POS subtype (Noun/Verb/Adjective/Adverb/
 * Pronoun/Determiner -- Preposition/Conjunction/Interjection/Numeral/
 * Particle carry no field beyond baseLemmaCanonicalForm, already
 * checked via `word` itself), validated one at a time via
 * validateWordFormText above. Returns every issue found, not just the
 * first -- empty means `word`'s own populated Text fields are all
 * internally consistent with the matrix, not that every field is
 * populated (most will be undefined, and undefined is never an issue,
 * validateWordFormText's own docstring). */
export function validateWordFormAttributes(word: Word): readonly WordFormIssue[] {
  const issues: WordFormIssue[] = [];
  const check = (className: string, field: string, text: Text | undefined): void => {
    if (text === undefined) return;
    const issue = validateWordFormText(`${className}.${field}`, text);
    if (issue !== undefined) issues.push(issue);
  };

  check("Word", "baseLemmaCanonicalForm", word.baseLemmaCanonicalForm);

  if (isNoun(word)) {
    check("Noun", "singularNumberForm", word.singularNumberForm);
    check("Noun", "pluralNumberForm", word.pluralNumberForm);
    check("Noun", "possessiveCaseForm", word.possessiveCaseForm);
  } else if (isVerb(word)) {
    check("Verb", "presentTenseForm", word.presentTenseForm);
    check("Verb", "pastTenseForm", word.pastTenseForm);
    check("Verb", "thirdPersonSingularPresentForm", word.thirdPersonSingularPresentForm);
    check("Verb", "presentParticipleForm", word.presentParticipleForm);
    check("Verb", "pastParticipleForm", word.pastParticipleForm);
    check("Verb", "bareInfinitiveForm", word.bareInfinitiveForm);
    check("Verb", "firstPersonForm", word.firstPersonForm);
    check("Verb", "secondPersonForm", word.secondPersonForm);
    check("Verb", "thirdPersonForm", word.thirdPersonForm);
  } else if (isAdjective(word)) {
    check("Adjective", "positiveDegreeForm", word.positiveDegreeForm);
    check("Adjective", "comparativeDegreeForm", word.comparativeDegreeForm);
    check("Adjective", "superlativeDegreeForm", word.superlativeDegreeForm);
  } else if (isAdverb(word)) {
    check("Adverb", "positiveDegreeForm", word.positiveDegreeForm);
    check("Adverb", "comparativeDegreeForm", word.comparativeDegreeForm);
    check("Adverb", "superlativeDegreeForm", word.superlativeDegreeForm);
  } else if (isPronoun(word)) {
    check("Pronoun", "singularNumberForm", word.singularNumberForm);
    check("Pronoun", "pluralNumberForm", word.pluralNumberForm);
    check("Pronoun", "firstPersonForm", word.firstPersonForm);
    check("Pronoun", "secondPersonForm", word.secondPersonForm);
    check("Pronoun", "thirdPersonForm", word.thirdPersonForm);
    check("Pronoun", "subjectiveCaseForm", word.subjectiveCaseForm);
    check("Pronoun", "objectiveCaseForm", word.objectiveCaseForm);
    check("Pronoun", "possessiveCaseForm", word.possessiveCaseForm);
    check("Pronoun", "reflexiveCaseForm", word.reflexiveCaseForm);
  } else if (isDeterminer(word)) {
    check("Determiner", "singularNumberForm", word.singularNumberForm);
    check("Determiner", "pluralNumberForm", word.pluralNumberForm);
    check("Determiner", "possessiveCaseForm", word.possessiveCaseForm);
  }

  return issues;
}
