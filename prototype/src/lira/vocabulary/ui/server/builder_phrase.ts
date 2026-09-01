/** Phrase's own client-facing record and query surface -- split out of
 * ui/dictionary_view.ts's own DictionaryView class (formerly the private
 * methods phraseRecordFor/phraseWordSegments/phraseTypeLabel/
 * phraseHeadWordSegment and the public method searchPhrases). */

import type { Dictionary } from "../../data/dictionary";
import { EditorialLabel } from "../../data/enums/editorial_label";
import { PartOfSpeech } from "../../data/enums/part_of_speech";
import { PhraseType } from "../../data/enums/phrase_type";
import { graphUuid, type Phrase } from "../../data/entities/phrase";
import type { Phrases } from "../../data/phrases";
import type { Senses } from "../../data/senses";
import type { WordForms } from "../../data/word_forms";
import type { Identifier } from "../../../value_objects";
import type { Coordination } from "../../data/entities/coordination";
import type { Word } from "../../data/entities/word";
import type { Clause } from "../../../linguistics/data/clause";
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

export function phraseRecordFor(phrase: Phrase, phrases: Phrases, senses: Senses, wordForms: WordForms): PhraseRecord {
  const senseFields = senseFieldsFor(senses, phrase, wordForms);
  return {
    id: graphUuid(phrase),
    entry_id: phrase.entryId.value,
    lexical_form: phrase.lexicalForm?.value ?? phrase.text,
    text: phrase.text,
    pos: PartOfSpeech[phrases.partOfSpeechOf(phrase)!],
    phrase_type: phraseTypeLabel(phrase),
    definition: senseFields.definition?.value ?? "",
    gloss: senseFields.gloss?.value ?? "",
    register_codes: phrase.lexicalForm?.languageStyleCode !== undefined ? [phrase.lexicalForm.languageStyleCode.value] : [],
    dialect_codes: phrase.lexicalForm?.dialectCode !== undefined ? [phrase.lexicalForm.dialectCode.value] : [],
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
  const records = phrases.all().map((phrase) => phraseRecordFor(phrase, phrases, senses, wordForms));
  records.sort((a, b) => a.lexical_form.toLowerCase().localeCompare(b.lexical_form.toLowerCase()));
  return records;
}

// Phrase.complements's own client-facing shape (data/entities/phrase.ts's
// own docstring on it) -- deliberately not DefinitionSegment: a
// Complement is a real, independently-registered Phrase of its own now
// (registerComplementPhrase(), role/processor/phrase_processor.ts), not
// a single Word/WordForm reference, so this instead carries just enough
// to render a clickable pivot link to that Phrase's own detail panel --
// `id` (its own graph uuid, the same `data-pivot-id`/wordId shape every
// other cross-reference link in this UI already uses), `text` (its own
// literal spelling, "of a nuisance"), and `phrase_type` (that nested
// Phrase's own phraseType, `phraseTypeLabel()`'s own convention, so the
// client can badge it the identical way the parent Phrase's own
// `phrase_type` already is).
export interface PhraseComplementSegment {
  id: string;
  text: string;
  phrase_type?: string;
}

/** `phrase.complements`, as the client-facing shape above -- one entry
 * per embedded Phrase (`"entryId" in entry` narrows out the `Identifier`/
 * `Clause` branches `Phrase.complements`'s own type still carries, the
 * same narrowing `vocabulary.test.ts`'s own complement assertions
 * already use; neither branch is ever actually constructed today,
 * `classifyComplementPhraseType()`'s own docstring, role/processor/phrase_processor.ts).
 * Reads `phrase.complements` directly rather than recomputing (unlike
 * `phraseWordSegments()`/`phraseModifierSegments()` below, which
 * recompute from `text` because a WordForm reference alone drops a
 * token's own plain surface text) -- a Complement entry is never a bare
 * WordForm reference to drop in the first place, so there's nothing a
 * fresh recomputation would recover that the stored Phrase object
 * itself doesn't already carry. */
export function phraseComplementSegments(phrase: Phrase): PhraseComplementSegment[] {
  return (phrase.complements ?? [])
    .filter((entry): entry is Phrase => "entryId" in entry)
    .map((complement) => ({ id: graphUuid(complement), text: complement.text, phrase_type: phraseTypeLabel(complement) }));
}

/** `phrase`'s own headword (`text`) broken into one DefinitionSegment
 * per whitespace token, in the same order linkPhraseWords()
 * (role/processor/phrase_processor.ts) itself walks them -- reusing
 * definitionWordSegment() as-is, so a Phrase's own headword links to
 * its constituent Words exactly the way a Word's own definition text
 * already links to the Words *it* mentions (same hover-tooltip
 * rendering client-side, this file's own embedded client script).
 * Re-resolves each token against `dictionary` fresh (`dictionary.lookup()`,
 * the identical case-insensitive first-homograph pick linkPhraseWords()
 * itself makes) rather than reading a stored per-token reference --
 * Phrase carries no such array of its own any more
 * (data_entity_design_decisions_log.md on why `words`/`wordRoles` were
 * removed once `headWord`/`preModifiers`/`postModifiers`/`determiners`
 * existed as their own typed fields). */
export function phraseWordSegments(
  phrase: Phrase,
  dictionary: Dictionary,
  senses: Senses,
  domainName: string,
  wordForms: WordForms,
): DefinitionSegment[] {
  const tokens = phrase.text.trim().split(/\s+/).filter((token) => token.length > 0);
  return tokens.map((token) => definitionWordSegment(token, dictionary.lookup(token), senses, domainName, wordForms));
}

/** `phrase.headWordForm`/`phrase.headWord` (data/entities/phrase.ts's own
 * docstring on each -- both graph-reference pointers now, resolved here
 * against `wordForms`/`dictionary` respectively), combined into one
 * DefinitionSegment the same way an individual entry of
 * phraseWordSegments() above already is -- `undefined` when
 * `phrase.headWordForm` itself is undefined, or when it fails to
 * resolve against `wordForms` (no Head position was ever identified for
 * this Phrase, or its Head's own resolved Word carries no WordForm
 * spelled the way it appears here -- phrase.ts's own docstring on when
 * each happens). Deliberately reuses definitionWordSegment() rather
 * than re-deriving the same word_id/lexical_form/pos/domain/gloss shape
 * by hand -- a Head Word is exactly one more definition-style word
 * reference, just singled out instead of iterated in sequence. */
export function phraseHeadWordSegment(
  phrase: Phrase,
  dictionary: Dictionary,
  senses: Senses,
  domainName: string,
  wordForms: WordForms,
): DefinitionSegment | undefined {
  if (phrase.headWordForm === undefined) return undefined;
  const form = wordForms.findByUuid(phrase.headWordForm.value);
  if (form === undefined) return undefined;
  const resolved = phrase.headWord !== undefined ? dictionary.findByUuid(phrase.headWord.value) : undefined;
  return definitionWordSegment(form.text.value, resolved, senses, domainName, wordForms);
}

/** One resolved value from `phrase.preModifier`/`postModifier`/
 * `determiner` (data/entities/phrase.ts's own docstring on each), as the
 * client-facing shape `phraseModifierSegments()` below returns per field.
 * A plain `DefinitionSegment` for the single-token `Identifier` case (a
 * WordForm reference -- `phraseHeadWordSegment()`'s own identical
 * by-reference resolution just above), or a `PhraseComplementSegment`-
 * shaped clickable link for the multi-token `Phrase` case (a real,
 * independently-registered nested Phrase now -- `phraseComplementSegments()`'s
 * own identical shape and reasoning, since `preModifier`/`postModifier`/
 * `determiner` collapse a whole multi-token span into one nested Phrase
 * the exact same way `complements` already does, `buildNestedPhrase()`'s
 * own docstring, role/processor/phrase_processor.ts). */
export type ModifierSegment = DefinitionSegment | PhraseComplementSegment;

/** `coordination`'s own constituents, joined back into one plain string
 * for display ("big and red") -- a `Coordination` is never independently
 * registered into any store with its own detail-panel route
 * (data/coordinations.ts's own docstring: "no isXCoordination() guard
 * family exists yet, mirroring how Coordination itself still has no
 * seeder/UI consumer of its own"), so unlike a nested Phrase this can
 * never render as a clickable pivot link -- there is nowhere for it to
 * pivot to. Each coordinate is in practice always a Word or Phrase, both
 * of which carry `text` (`resolveCoordinateSide()`'s own docstring,
 * role/processor/phrase_processor.ts -- a coordinate is never itself a
 * nested Coordination in anything `buildModifierUnit()` constructs
 * today); the `"text" in coordinate` guard covers that theoretical case
 * gracefully anyway rather than throwing. */
function coordinationText(coordination: Coordination<Word | Phrase>, wordForms: WordForms): string {
  const parts = coordination.coordinates.map((coordinate) => ("text" in coordinate ? coordinate.text : "…"));
  const coordinatorText = coordination.coordinator !== undefined ? wordForms.findByUuid(coordination.coordinator.value)?.text.value : undefined;
  if (coordinatorText === undefined) return parts.join(", ");
  return parts.length === 2 ? `${parts[0]} ${coordinatorText} ${parts[1]}` : `${parts.slice(0, -1).join(", ")}, ${coordinatorText} ${parts[parts.length - 1]}`;
}

/** Resolves one `phrase.preModifier`/`postModifier`/`determiner` value
 * to its own `ModifierSegment` -- `undefined` when `value` itself is
 * (most Phrases have no Determiner, and two-thirds have no post-Head
 * Modifier either), or when the single-token `Identifier` case fails to
 * resolve against `wordForms` (no Head-adjacent token was ever
 * identified for this span, or its resolved Word carries no WordForm
 * spelled the way it appears here -- `phrase.ts`'s own docstring on when
 * each happens). A `Clause` value is never actually constructed by
 * `buildModifierUnit()` today (the same "documented ahead of
 * construction" status `phraseComplementSegments()`'s own docstring
 * already notes for its own identical `Clause` branch); `Clause` carries
 * no `entryId` of its own (linguistics/data/clause.ts), so should one
 * ever appear it falls into the `Identifier` branch below by the same
 * `"entryId" in value` test, fails `wordForms.findByUuid()`, and
 * resolves to `undefined` -- silently dropped, the same as any other
 * unresolvable single-token case. */
function modifierUnitSegment(
  value: Identifier | Phrase | Coordination<Word | Phrase> | Clause | undefined,
  dictionary: Dictionary,
  senses: Senses,
  domainName: string,
  wordForms: WordForms,
): ModifierSegment | undefined {
  if (value === undefined) return undefined;
  if (!("entryId" in value)) {
    if (!("value" in value)) return undefined; // Clause -- no entryId, no `value` either; never actually constructed here.
    const form = wordForms.findByUuid(value.value);
    return form === undefined ? undefined : definitionWordSegment(form.text.value, dictionary.lookup(form.text.value), senses, domainName, wordForms);
  }
  if ("text" in value) return { id: graphUuid(value), text: value.text, phrase_type: phraseTypeLabel(value) };
  return { text: coordinationText(value, wordForms) };
}

/** `phrase.preModifier`/`phrase.postModifier`/`phrase.determiner`
 * (data/entities/phrase.ts's own docstring on each), each as its own
 * `ModifierSegment` -- the client-facing counterpart of those three
 * fields, `modifierUnitSegment()`'s own docstring on the two shapes this
 * takes. Reads the three fields directly, unlike this function's own
 * pre-run-collapsing version (data_entity_design_decisions_log.md),
 * which recomputed from `phrase.text` fresh: that recomputation existed
 * only because the old array-of-`Identifier` fields dropped a token's
 * own surface text whenever it failed to resolve a WordForm, and
 * `phraseHeadWordSegment()`'s own by-reference resolution just above
 * already accepts that same limitation for `headWord`/`headWordForm` --
 * now that a multi-token span is a real, independently-built nested
 * Phrase or Coordination rather than an array of independent per-token
 * references, there is nothing left for a fresh recomputation to
 * recover that the stored field itself doesn't already carry, the same
 * reasoning `phraseComplementSegments()`'s own docstring already gives
 * for reading `complements` directly. `undefined` for a Phrase with no
 * Modifier/Determiner at all (every Common Vocabulary Cache closed-class
 * Phrase, in particular, whose own `phraseType` stays undefined). */
export function phraseModifierSegments(
  phrase: Phrase,
  dictionary: Dictionary,
  senses: Senses,
  domainName: string,
  wordForms: WordForms,
): { pre?: ModifierSegment; post?: ModifierSegment; determiner?: ModifierSegment } {
  return {
    pre: modifierUnitSegment(phrase.preModifier, dictionary, senses, domainName, wordForms),
    post: modifierUnitSegment(phrase.postModifier, dictionary, senses, domainName, wordForms),
    determiner: modifierUnitSegment(phrase.determiner, dictionary, senses, domainName, wordForms),
  };
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
    if (options.pos && PartOfSpeech[phrases.partOfSpeechOf(phrase)!] !== options.pos) continue;
    const lexicalForm = (phrase.lexicalForm?.value ?? phrase.text).toLowerCase();
    if (wordQuery && !lexicalForm.includes(wordQuery)) continue;
    if (glossQuery && !(senseFieldsFor(senses, phrase, wordForms).gloss?.value ?? "").toLowerCase().includes(glossQuery)) continue;
    if (definitionQuery && !(phrase.definition?.value ?? "").toLowerCase().includes(definitionQuery)) continue;

    totalMatches += 1;
    if (matches.length < limit) matches.push(phraseRecordFor(phrase, phrases, senses, wordForms));
  }
  matches.sort((a, b) => a.lexical_form.toLowerCase().localeCompare(b.lexical_form.toLowerCase()));
  return { phrases: matches, totalMatches };
}
