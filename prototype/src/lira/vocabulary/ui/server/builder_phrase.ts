/** Phrase's own client-facing record and query surface -- split out of
 * ui/dictionary_view.ts's own DictionaryView class (formerly the private
 * methods phraseRecordFor/phraseWordSegments/phraseTypeLabel/
 * phraseHeadWordSegment and the public method searchPhrases). */

import type { Dictionary } from "../../data/dictionary";
import { EditorialLabel } from "../../data/enums/editorial_label";
import { PartOfSpeech } from "../../data/enums/part_of_speech";
import { ModifierRole } from "../../data/enums/modifier_role";
import { PhraseType } from "../../data/enums/phrase_type";
import { RegisterCode } from "../../data/enums/register_code";
import type { Phrase } from "../../data/phrase";
import type { Phrases } from "../../data/phrases";
import type { Senses } from "../../data/senses";
import type { WordForms } from "../../data/word_forms";
import { definitionWordSegment, type DefinitionSegment } from "./builder_segment";
import { senseFieldsFor } from "./resolver_domain";

// Phrase's own client-facing record -- deliberately leaner than
// WordRecord (no relationship_count/definition_segments/domain):
// the Phrases tab itself stays a plain searchable list, not a
// word-with-a-detail-panel view the way Words is. A WordNet-seeded
// Phrase's own relationships (it does participate in
// SemanticRelationshipStore now -- word_seeder.ts's own seedWordNet)
// are still fully visible, just via the Relationships/Hierarchy tabs'
// own resolveEntry() fallback to Phrases, not through this record.
export interface PhraseRecord {
  id: string;
  entry_id: string;
  lexical_form: string;
  text: string;
  pos: string;
  // The enum's own key string (e.g. "PREPOSITIONAL_PHRASE"), same
  // PhraseType[...] convention WordRecord.phrase_type already uses --
  // undefined for a Phrase whose own phraseType is itself undefined
  // (every Common Vocabulary Cache closed-class Phrase, and any
  // WordNet-seeded one classifyPhraseType() couldn't classify,
  // word_seeder.ts).
  phrase_type?: string;
  definition: string;
  gloss: string;
  register_codes: string[];
  dialect_codes: string[];
  editorial_labels: string[];
  is_common: boolean;
  sources: string[];
}

/** `phrase`'s own phraseType, as the enum's own key string (`pos`'s
 * own PhraseType[...] convention, WordRecord.phrase_type's own
 * docstring) -- `undefined` for a Phrase whose phraseType is itself
 * undefined (every Common Vocabulary Cache closed-class Phrase, and
 * any WordNet-seeded one classifyPhraseType() couldn't classify),
 * kept as its own small function purely so both wordId-resolution call
 * sites in builder_word.ts read the identical one-liner
 * phraseWordSegments() already gets its own for. */
export function phraseTypeLabel(phrase: Phrase): string | undefined {
  return phrase.phraseType !== undefined ? PhraseType[phrase.phraseType] : undefined;
}

export function phraseRecordFor(phrase: Phrase, senses: Senses, wordForms: WordForms): PhraseRecord {
  const senseFields = senseFieldsFor(senses, phrase, wordForms);
  return {
    id: phrase.uuid.value,
    entry_id: phrase.entryId.value,
    lexical_form: phrase.lexicalForm?.value ?? phrase.text,
    text: phrase.text,
    pos: PartOfSpeech[phrase.partOfSpeech],
    phrase_type: phraseTypeLabel(phrase),
    definition: senseFields.definition?.value ?? "",
    gloss: senseFields.gloss?.value ?? "",
    register_codes: phrase.registerCodes.map((code) => RegisterCode[code]),
    dialect_codes: phrase.dialectCodes.map((code) => code.value),
    editorial_labels: phrase.editorialLabels.map((label) => EditorialLabel[label]),
    is_common: phrase.isCommon,
    sources: phrase.sourceReferences.map((ref) => ref.sourceName.value),
  };
}

/** Every Phrase in this Domain's Phrases, as a PhraseRecord -- only
 * ever run under MAX_INTERACTIVE_WORDS_PHRASES, the same capacity gate
 * wordRecords() has (render()'s own overCapacityPhrases). A closed-
 * class multi-word entry alone is a few dozen at most
 * (SUPPLEMENTARY_FILES' own scale, word_seeder.ts), but WordSeeder.seedWordNet
 * routes every multi-word synset lemma here too now -- tens of
 * thousands of them at WordNet scale -- so this needs the identical
 * over-capacity treatment wordRecords() already has, not the "a
 * Phrase count never approaches that range" assumption an earlier
 * version of this function made before WordNet-seeded Phrases existed. */
export function phraseRecords(phrases: Phrases, senses: Senses, wordForms: WordForms): PhraseRecord[] {
  const records = phrases.all().map((phrase) => phraseRecordFor(phrase, senses, wordForms));
  records.sort((a, b) => a.lexical_form.toLowerCase().localeCompare(b.lexical_form.toLowerCase()));
  return records;
}

/** `phrase`'s own headword (`text`) broken into one DefinitionSegment
 * per whitespace token, in the same order phrase.words itself was
 * populated (WordSeeder.seedWordNet's own linkPhraseWords()) --
 * reusing definitionWordSegment() as-is, so a Phrase's own headword
 * links to its constituent Words exactly the way a Word's own
 * definition text already links to the Words *it* mentions (same
 * hover-tooltip rendering client-side, this file's own embedded client
 * script). Reads the already-stored uuid references directly
 * (Dictionary.findByUuid) rather than re-splitting `text` and
 * re-resolving each token against `dictionary` from scratch -- the
 * whole reason those references were stored ahead of time. */
export function phraseWordSegments(
  phrase: Phrase,
  dictionary: Dictionary,
  senses: Senses,
  domainName: string,
  wordForms: WordForms,
): DefinitionSegment[] {
  const tokens = phrase.text.trim().split(/\s+/).filter((token) => token.length > 0);
  return tokens.map((token, index) => {
    const ref = phrase.words[index];
    const resolved = ref !== undefined ? dictionary.findByUuid(ref.value) : undefined;
    return definitionWordSegment(token, resolved, senses, domainName, wordForms);
  });
}

/** `phrase.headWordForm`/`phrase.headWord` (data/phrase.ts's own
 * docstring on each), combined into one DefinitionSegment the same
 * way an individual entry of phraseWordSegments() above already is --
 * `undefined` when `phrase.headWordForm` itself is undefined (no Head
 * position was ever identified for this Phrase, phrase.ts's own
 * docstring on when that happens). Deliberately reuses
 * definitionWordSegment() rather than re-deriving the same word_id/
 * lexical_form/pos/domain/gloss shape by hand -- a Head Word is
 * exactly one more definition-style word reference, just singled out
 * instead of iterated in sequence. */
export function phraseHeadWordSegment(
  phrase: Phrase,
  dictionary: Dictionary,
  senses: Senses,
  domainName: string,
  wordForms: WordForms,
): DefinitionSegment | undefined {
  if (phrase.headWordForm === undefined) return undefined;
  const resolved = phrase.unresolvedHeadWord !== undefined ? dictionary.findByUuid(phrase.unresolvedHeadWord.value) : undefined;
  return definitionWordSegment(phrase.headWordForm.value, resolved, senses, domainName, wordForms);
}

/** `phrase`'s own pre-Head and post-Head MODIFIER-role tokens
 * (data/phrase_type_patterns_and_word_roles.md's own "Phrase Role
 * Allowed Types" table, MODIFIER row) and its DETERMINER-role tokens
 * (that document's own Common Rules table -- valid regardless of
 * PhraseType or position, phrase_processor.ts's own classifyModifierRoles()
 * docstring), each as an ordered DefinitionSegment list -- the
 * client-facing counterpart of `phrase.preModifiers`/`phrase.postModifiers`
 * (data/phrase.ts's own docstring on each) for the first two, and of
 * `phrase.wordRoles`' own DETERMINER entries (no dedicated resolved-Word
 * field of its own exists for those, unlike headWord/preModifiers/
 * postModifiers) for the third. Built the same way
 * phraseWordSegments()/phraseHeadWordSegment() above already are:
 * re-derived from `phrase.text`/`phrase.wordRoles`/`phrase.words`
 * directly, not read off `preModifiers`/`postModifiers` themselves.
 * Those two fields store only the resolved Word objects
 * (linkPhraseWords()'s own docstring, role/processor/phrase_processor.ts)
 * -- once a MODIFIER token is resolved to a Word, its own original
 * phrase-local position and exact surface spelling are gone, and both
 * matter here: position is what tells a pre-Head Modifier from a
 * post-Head one and gives each entry its own display order, and the
 * surface spelling is what `definitionWordSegment()`'s own WordForm
 * matching (builder_segment.ts) needs to find which registered
 * inflected form (if any) this particular occurrence actually spells.
 * Recomputing from the same three source fields those two sibling
 * functions already use keeps all three in exact agreement, and works
 * even for a Phrase seeded before headWord/preModifiers/postModifiers
 * existed (every field read here -- text/wordRoles/words -- predates
 * them). Determiners aren't split pre/post (unlike Modifiers) -- the
 * Word Patterns table has no PhraseType whose own Determiner ever
 * follows the Head, so one flat, position-ordered list covers every
 * real case. Every list is empty for a Phrase with no identified Head or
 * no token carrying that role at all (every Common Vocabulary Cache
 * closed-class Phrase, in particular, whose own `wordRoles` stays `[]`). */
export function phraseModifierSegments(
  phrase: Phrase,
  dictionary: Dictionary,
  senses: Senses,
  domainName: string,
  wordForms: WordForms,
): { pre: DefinitionSegment[]; post: DefinitionSegment[]; determiners: DefinitionSegment[] } {
  const tokens = phrase.text.trim().split(/\s+/).filter((token) => token.length > 0);
  const headIndex = phrase.wordRoles.indexOf(ModifierRole.HEAD);
  const pre: DefinitionSegment[] = [];
  const post: DefinitionSegment[] = [];
  const determiners: DefinitionSegment[] = [];
  tokens.forEach((token, index) => {
    const role = phrase.wordRoles[index];
    if (role !== ModifierRole.MODIFIER && role !== ModifierRole.DETERMINER) return;
    const ref = phrase.words[index];
    const resolved = ref !== undefined ? dictionary.findByUuid(ref.value) : undefined;
    const segment = definitionWordSegment(token, resolved, senses, domainName, wordForms);
    if (role === ModifierRole.DETERMINER) determiners.push(segment);
    else (headIndex !== -1 && index < headIndex ? pre : post).push(segment);
  });
  return { pre, post, determiners };
}

/** searchWords()'s own counterpart for the Phrases tab, over
 * MAX_INTERACTIVE_WORDS_PHRASES -- resolves a search against every
 * Phrase in the Phrases directly instead of a pre-embedded
 * client-side array, the same reasoning searchWords() itself
 * documents. Matching semantics (case-insensitive substring on
 * lexical_form/gloss/definition, exact pos) mirror the fragment's own
 * client-side matchesPhraseQuery()/filteredPhrases() exactly, so a
 * search behaves the same whether it ran client-side (a small
 * Phrases) or here (WordNet scale, tens of thousands of Phrases).
 * `phrases` is capped at `options.limit`; `totalMatches` is the true,
 * uncapped count. */
export function searchPhrases(
  phrases: Phrases,
  senses: Senses,
  options: { word?: string; gloss?: string; definition?: string; pos?: string; limit?: number },
  wordForms: WordForms,
): {
  phrases: PhraseRecord[];
  totalMatches: number;
} {
  const limit = options.limit ?? 1000;
  const wordQuery = options.word?.trim().toLowerCase();
  const glossQuery = options.gloss?.trim().toLowerCase();
  const definitionQuery = options.definition?.trim().toLowerCase();

  const matches: PhraseRecord[] = [];
  let totalMatches = 0;
  for (const phrase of phrases.all()) {
    if (options.pos && PartOfSpeech[phrase.partOfSpeech] !== options.pos) continue;
    const lexicalForm = (phrase.lexicalForm?.value ?? phrase.text).toLowerCase();
    if (wordQuery && !lexicalForm.includes(wordQuery)) continue;
    if (glossQuery && !(phrase.gloss?.value ?? "").toLowerCase().includes(glossQuery)) continue;
    if (definitionQuery && !(phrase.definition?.value ?? "").toLowerCase().includes(definitionQuery)) continue;

    totalMatches += 1;
    if (matches.length < limit) matches.push(phraseRecordFor(phrase, senses, wordForms));
  }
  matches.sort((a, b) => a.lexical_form.toLowerCase().localeCompare(b.lexical_form.toLowerCase()));
  return { phrases: matches, totalMatches };
}
