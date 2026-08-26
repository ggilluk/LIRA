/** Word's own client-facing record and query surface -- split out of
 * ui/dictionary_view.ts's own DictionaryView class (formerly the private
 * methods wordRecordFor/morphologicalDerivations/sensesFor/wordFormsFor
 * and the public method searchWords). */

import type { Identifier } from "../../../value_objects";
import { isAdjective } from "../../role/processor/adjective_processor";
import { isAdverb } from "../../role/processor/adverb_processor";
import type { Dictionary } from "../../data/dictionary";
import { EditorialLabel } from "../../data/enums/editorial_label";
import { PartOfSpeech } from "../../data/enums/part_of_speech";
import { RegisterCode } from "../../data/enums/register_code";
import { isNoun } from "../../role/processor/noun_processor";
import { phraseAsWord, type Phrase } from "../../data/phrase";
import type { Phrases } from "../../data/phrases";
import type { Senses } from "../../data/senses";
import type { SemanticRelationshipStore } from "../../data/semantic_relationship_store";
import { framesForSense, isVerb } from "../../role/processor/verb_processor";
import type { Word } from "../../data/entities/word";
import type { WordForms } from "../../data/word_forms";
import { graphUuid as wordGraphUuid } from "../../role/word_processor";
import { graphUuid as senseGraphUuid } from "../../role/sense_processor";
import { phraseHeadWordSegment, phraseModifierSegments, phraseTypeLabel, phraseWordSegments } from "./builder_phrase";
import { definitionSegments, formFieldLabel, type DefinitionSegment } from "./builder_segment";
import { domainLabel, isRootWordFor, senseFieldsFor } from "./resolver_domain";

/** `member`'s own per-Domain graph identity -- Phrase still keeps its
 * own separate top-level `uuid` field (out of scope for the
 * Word/Sense/WordForm fold), so only the Word side needs
 * `wordGraphUuid()`'s own `entryId.uuid` read. `data/senses.ts`'s own
 * identical `memberUuid()`. */
function memberUuid(member: Word | Phrase): string {
  return "words" in member ? member.uuid.value : wordGraphUuid(member);
}

export interface WordRecord {
  id: string;
  entry_id: string;
  lexical_form: string;
  text: string;
  pos: string;
  // The Princeton WordNet 3.1 synset this Word corresponds to
  // (word.synsetId's own docstring), or null for a Word that didn't
  // come from WordSeeder.seedWordNet -- every Common Vocabulary Cache
  // entry, in particular.
  sense_id: string | null;
  definition: string;
  gloss: string;
  register_codes: string[];
  dialect_codes: string[];
  editorial_labels: string[];
  is_common: boolean;
  is_root_word: boolean;
  is_derivable_noun: boolean;
  // Every morphological-derivation pointer field this Word's own
  // concrete POS subtype actually carries a *resolved* value for --
  // Noun.isDerivedFromVerb and its three siblings across data/entities/noun.ts,
  // data/entities/verb.ts, data/entities/adjective.ts, data/entities/adverb.ts (each field's own
  // docstring names which specific pair it implements;
  // morphologicalDerivations()'s own docstring on how this list is
  // built, and on why only four pairs exist rather than eight).
  // `attribute` is the field's own camelCase name; `label` is that name
  // run through the same field-name-to-label convention
  // wordFormsFor()'s own WordFormEntry.label already uses
  // (formFieldLabel(), this file), computed server-side so the client
  // never needs its own copy of that logic; `target` is the Word that
  // field's own Identifier pointer resolved to. No separate Indicator
  // boolean of its own here -- an entry's mere presence in this list
  // already means true (the field's own Indicator sibling on the
  // underlying Word is `!== undefined`, data/entities/noun.ts's own docstring),
  // and an unresolved pointer (shouldn't happen for anything
  // WordSeeder.seedWordNet itself produced) is simply omitted rather
  // than included with a null target. Empty for every part of speech
  // that carries none of these fields at all (Pronoun, Preposition, ...)
  // and for a Word with no qualifying edge found. Rendered client-side
  // as part of the Word Forms section (wordFormsSectionHTML(), ui/client/)
  // rather than its own section -- a derivation pointer is itself
  // a word form relationship, and showing it separately at the top of
  // the panel produced no benefit over folding it in below.
  derivations: { attribute: string; label: string; target: { id: string; text: string } }[];
  domain: string | null;
  // Extra topic domains the same WordNet sense also carries beyond its
  // primary `domain` (Word.relatedDomainTags's own docstring) -- e.g.
  // "winger" is a wing position in soccer, hockey, rugby, AND
  // field_hockey, so `domain` is one of those and this holds the rest.
  // Always empty for a non-WordNet word, or a WordNet sense with at
  // most one topic-domain pointer -- the common case.
  related_domains: string[];
  is_fully_hydrated: boolean;
  sources: string[];
  relationship_count: number;
  definition_segments: DefinitionSegment[];
  // Present only when this record was resolved from a Phrase, not a
  // genuine Word (searchWords()'s own `wordId` branch) --
  // `text`/`lexical_form`'s own token-by-token breakdown into each
  // constituent Word ("toy poodle" -> "toy", "poodle"), the headword
  // counterpart of definition_segments above, built from that Phrase's
  // own already-stored `words` references (phraseWordSegments()'s own
  // docstring) rather than re-resolved from scratch. undefined for an
  // ordinary Word, which has no sub-word composition of its own to show.
  phrase_word_segments?: DefinitionSegment[];
  // phrase_word_segments's own exact counterpart for Phrase.phraseType
  // (word_seeder.ts's own classifyPhraseType, WordSeeder.seedWordNet) --
  // the enum's own key string (e.g. "PREPOSITIONAL_PHRASE"), same
  // PhraseType[...] convention `pos` above already uses for
  // PartOfSpeech -- the client applies titleCase() at render time, not
  // this. Present only when this record was resolved from a Phrase that
  // HAS a phraseType; undefined for an ordinary Word (no such concept
  // applies) and for a Phrase whose own phraseType is itself undefined
  // (every Common Vocabulary Cache closed-class Phrase, and any
  // WordNet-seeded one classifyPhraseType() couldn't classify -- neither
  // exists in the bundled data today, but the field stays optional
  // either way).
  phrase_type?: string;
  // Phrase.headWord/Phrase.headWordForm's own combined client-facing
  // shape (data/phrase.ts's own docstring on each) -- reuses
  // DefinitionSegment, the same shape phrase_word_segments above already
  // uses per token, since a Head Word is exactly one of those segments
  // (`text` carries headWordForm's own phrase-local spelling; `word_id`/
  // `lexical_form`/... carry headWord's own resolved Word, when it
  // resolved at all). Present only when this record was resolved from a
  // Phrase whose own `wordRoles` actually identified a Head position
  // (phraseHeadWordSegment()'s own docstring); undefined for an ordinary
  // Word, and for a Phrase with no identified Head (every Common
  // Vocabulary Cache closed-class Phrase, in particular).
  head_word?: DefinitionSegment;
  // phrase.preModifiers/phrase.postModifiers's own client-facing shape
  // (data/phrase.ts's own docstring on each), one DefinitionSegment per
  // MODIFIER-role token before/after the Head, in phrase-text order --
  // phraseModifierSegments()'s own docstring (builder_phrase.ts) on why
  // this is recomputed from the same text/wordRoles/words fields
  // phrase_word_segments/head_word above already use, not read directly
  // off preModifiers/postModifiers. Each entry's own array position IS
  // its display position (1st pre-Modifier, 2nd, ...) -- no separate
  // index field. Present only when this record was resolved from a
  // Phrase; both empty for an ordinary Word and for a Phrase with no
  // MODIFIER-role token at all (every Common Vocabulary Cache
  // closed-class Phrase, in particular).
  pre_modifiers?: DefinitionSegment[];
  post_modifiers?: DefinitionSegment[];
  // phrase.wordRoles' own DETERMINER-role tokens (data/enums/phrase_role.ts's
  // own docstring on that role -- valid regardless of PhraseType or
  // position, so unlike pre_modifiers/post_modifiers above this is never
  // split), same phraseModifierSegments()-recomputed shape and same
  // presence rule as those two.
  determiners?: DefinitionSegment[];
  // Every real WordForm record `WordForms` holds for this Word
  // (`wordForms.formsOf(word)`, wordFormsFor()'s own docstring on how
  // this is built), in registration order -- always includes
  // baseLemmaCanonicalForm (every Word has one,
  // WordForms.registerBaseLemmaForm()'s own docstring), plus whichever
  // other inflected forms that POS subtype's own generateXForms()
  // registered (data/entities/word_form.ts's own docstring on this migration, every
  // POS subtype now). Each entry's own `senses` -- the Word -> WordForm
  // -> Senses nesting the Word Detail UI renders
  // (word_wordform_sense_relationships.md) -- is non-empty only for a
  // WordForm that genuinely has one or more Senses registered onto it
  // (WordForms.registerSense()'s own docstring); empty for an ordinary
  // inflected form, since nothing links a plain spelling variant to a
  // distinct Sense.
  word_forms: WordFormEntry[];
  // Every Sense (data/entities/sense.ts) this Word lexicalizes, in Word.senseIds's
  // own order (sensesFor()'s own docstring on how this is
  // built) -- one entry per real WordNet sense for a polysemous Word
  // ("big" ADJECTIVE: "above average in size", "pregnant", "generous",
  // ...), not just the one `definition`/`domain` above already shows
  // (that's always senses[0], Word.senseIds's own "primary sense" doc).
  // A Phrase's own detail panel gets this too -- it's resolved into a
  // WordRecord via phraseAsWord() (phrase.ts) before reaching here, not
  // a separate PhraseRecord field. Empty only for a Word/Phrase that
  // never lexicalized any Sense at all (predates WordSeeder.seedWordNet/
  // registerUniqueSense, or a hand-authored test fixture). Kept as this
  // flat, Word-level list for backward compatibility (every existing
  // reader, including the several vocabulary.test.ts assertions against
  // `record.senses`) -- the Word Detail UI itself renders the same data
  // nested under `word_forms[].senses` instead (client_senses_section_html.ts's
  // own docstring on why), not this field.
  senses: WordSenseSummary[];
}

export interface WordFormEntry {
  field: string;
  label: string;
  value: string;
  // WordRecord.word_forms's own docstring on when this is non-empty --
  // this WordForm's own subset of WordRecord.senses (same
  // WordSenseSummary shape, same object identity even, not a copy of
  // its own), in Word.senseIds's own frequency order (`is_primary`
  // still marks the Word's own single overall-primary sense, not
  // "first within this one WordForm").
  senses: WordSenseSummary[];
}

export interface WordSenseSummary {
  id: string;
  is_primary: boolean;
  definition: string;
  gloss: string;
  domain: string;
  // Sense.senseFrequency's own docstring (data/entities/sense.ts) -- how often
  // this exact meaning was tagged in WordNet's own semantic concordance
  // corpus, summed across every lemma that lexicalizes it. `null`, not
  // `0`, for a Sense that didn't come from WordSeeder.seedWordNet at all
  // (mirrors that field's own undefined-vs-0 distinction, since a plain
  // client-facing record has no `undefined` of its own -- JSON drops
  // it); a real `0` still means "WordNet tagged it, just never in the
  // concordance," a materially different fact from "no WordNet
  // frequency data exists for this Sense at all." `senseIds`'s own
  // order already reflects this (WordSeeder.seedWordNet's own
  // orderSensesByFrequency, role/word_seeder.ts) -- highest first, so
  // `is_primary` below and this field agree by construction rather than
  // by coincidence.
  frequency: number | null;
  // This Sense's own Seeded Attributes for the PAD (Pleasure-Arousal-
  // Dominance) affective framework (Sense.seededPleasureDispleasureWeight's
  // own docstring, data/entities/sense.ts) -- null when no PAD value has ever
  // been assigned to this specific meaning (every WordNet-seeded Sense,
  // and most hand-curated ones too), not "neutral" (0/0/0 is a genuine
  // seeded-neutral reading, distinct from null). PAD moved here from a
  // single word-level reading (padRecord()'s own former "just the
  // primary sense" simplification) precisely so a polysemous Word's own
  // several, genuinely different-affect meanings ("cool" the
  // temperature vs. "cool" the approval) each show their own value
  // instead of only ever showing entry #1's.
  pad: { pleasure: number; arousal: number; dominance: number } | null;
  // Fellow members of this one Sense, this Word/Phrase itself excluded --
  // the sense-scoped synonym fact (Senses.membersOf()'s own docstring,
  // data/senses.ts) other Senses this same Word also carries have no part
  // in. Carries `id` (that member's own uuid) alongside its display text
  // so the client can render it as the same clickable data-pivot-id
  // button every other related-word row already uses
  // (wireDetailPivotButtons(), ui/client/'s own embedded client script).
  synonyms: { id: string; text: string }[];
  // The real WordNet verb-frame sentences ("Somebody ----s something")
  // this specific (Verb, Sense) pairing was tagged with -- Verb.framesForSense()'s
  // own docstring (role/processor/verb_processor.ts) on why this lives as loose per-membership
  // Senses metadata rather than a typed field on Verb itself: a frame can
  // genuinely differ between two members of the same synset (WordNetFrame's
  // own docstring, role/wordnet_loader.ts), so it's a fact about this one
  // (word, sense) pairing, not about the Verb alone. Undefined for every
  // non-VERB Word/Phrase and for a Verb sense with no frames recorded
  // (every Common Vocabulary Cache closed-class Verb, and any WordNet
  // synset whose own frame records happened to name none) -- never an
  // empty array, same "presence alone means non-empty" convention
  // `derivations`/`phrase_type` already use above.
  frames?: string[];
}


/** WordRecord.derivations (that field's own docstring above) -- every
 * morphological-derivation pointer field `word`'s own concrete POS
 * subtype carries (Noun.isDerivedFromVerb and its three siblings
 * across data/entities/noun.ts, data/entities/verb.ts, data/entities/adjective.ts, data/entities/adverb.ts
 * -- WordSeeder.deriveMorphologicalPointers()'s own docstring,
 * role/word_seeder.ts, names exactly which four pairs these are and
 * why only four survive, not eight: WordNet records its `+`
 * Derived-Form pointer reciprocally, once from each word's own side,
 * and derivationKind() there classifies a pointer by the *target's*
 * own part of speech alone -- so reading both sides of the same real
 * fact independently used to produce two differently-named rows for
 * one relationship (e.g. "abandon" Verb->Noun read as NOMINALISATION,
 * "abandonment" Noun->Verb read as the generic DERIVED_FORM catch-all).
 * Every DERIVED_FORM-sourced field was removed; what's left is exactly
 * one canonical field pair per genuine linguistic relationship),
 * resolved against this Dictionary the same way every other
 * pivot-button target already is. `addIfSet` skips a field that's
 * undefined (no qualifying WordNet edge found for this Word) and, in
 * the one case it shouldn't happen for anything WordSeeder.seedWordNet
 * itself produced, an Identifier that fails to resolve here too --
 * silently omitted rather than included with a null target, since an
 * unresolved pointer would mean something else went wrong, not an
 * expected case worth surfacing as its own UI state. */
function morphologicalDerivations(word: Word, dictionary: Dictionary, wordForms: WordForms): WordRecord["derivations"] {
  const derivations: WordRecord["derivations"] = [];
  const addIfSet = (attribute: string, pointer: Identifier | undefined): void => {
    if (pointer === undefined) return;
    const target = dictionary.findByUuid(pointer.value);
    if (target === undefined) return;
    derivations.push({ attribute, label: formFieldLabel(attribute), target: { id: wordGraphUuid(target), text: target.text } });
  };
  if (isNoun(word)) {
    addIfSet("isDerivedFromVerb", word.isDerivedFromVerb);
    addIfSet("isDerivedFromAdjective", word.isDerivedFromAdjective);
  } else if (isVerb(word)) {
    addIfSet("isNominalised", word.isNominalised);
    addIfSet("isAdjectivised", word.isAdjectivised);
  } else if (isAdjective(word)) {
    addIfSet("isNominalised", word.isNominalised);
    addIfSet("isAdverbialised", word.isAdverbialised);
    addIfSet("isDerivedFromVerb", word.isDerivedFromVerb);
  } else if (isAdverb(word)) {
    addIfSet("isDerivedFromAdjective", word.isDerivedFromAdjective);
  }
  // Word.contractionOf's own docstring (data/entities/word.ts) -- Word-level,
  // not scoped to one POS subtype the way every field above is (a
  // contraction's own components span whatever closed-class parts of
  // speech happen to combine), and many-to-many rather than a single
  // pointer, so this pushes one row per component instead of the one
  // addIfSet() call every other field above gets.
  for (const pointer of wordForms.contractionOfOf(word)) addIfSet("contractionOf", pointer);
  return derivations;
}

/** Every Sense `entry` lexicalizes, in `entry.senseIds`'s own order
 * (Word.senseIds's own docstring: ordered by descending
 * Sense.senseFrequency once WordSeeder.seedWordNet's own
 * orderSensesByFrequency has run, so index 0 is always the same Sense
 * senseFieldsFor() already reads for `definition`/`domain` above --
 * `is_primary` marks that one explicitly, rather than leaving the
 * reader to guess whether entry #1 here is special).
 * A senseId that doesn't resolve in this Domain's own Senses (the
 * Physics-from-Common cross-Domain gap senseFieldsFor()'s own
 * docstring already accepts) is skipped, not shown half-empty --
 * every entry returned here has real definition/gloss/domain data to
 * show. `synonyms` is that Sense's own membership (Senses.membersOf()),
 * `entry` itself excluded -- deliberately scoped to just this one
 * Sense, not `entry`'s other, unrelated senses. */
function sensesFor(entry: Word | Phrase, senses: Senses, domainName: string, wordForms: WordForms): WordSenseSummary[] {
  const summaries: WordSenseSummary[] = [];
  const senseIds = "words" in entry ? entry.senseIds : wordForms.senseIdsOf(entry);
  senseIds.forEach((senseId, index) => {
    const sense = senses.findByUuid(senseId.value);
    if (sense === undefined) return;
    const domain = !sense.isCommon ? domainName : (sense.domainTag?.value ?? "Common");
    const { seededPleasureDispleasureWeight: p, seededArousalNonArousalWeight: a, seededDominanceSubmissiveWeight: d } = sense;
    // "words" in entry distinguishes a Phrase (framesForSense() only
    // ever applies to a genuine VERB Word -- no such concept exists for
    // a multi-word Phrase entry).
    const frames = !("words" in entry) && isVerb(entry) ? framesForSense(senses, entry, senseId.value) : undefined;
    summaries.push({
      id: senseId.value,
      is_primary: index === 0,
      definition: sense.definition?.value ?? "",
      gloss: sense.gloss?.value ?? "",
      domain,
      frequency: sense.senseFrequency ?? null,
      pad: p !== undefined && a !== undefined && d !== undefined ? { pleasure: p.value, arousal: a.value, dominance: d.value } : null,
      synonyms: senses
        .membersOf(senseId.value)
        .filter((member) => memberUuid(member) !== memberUuid(entry))
        .map((member) => ({ id: memberUuid(member), text: member.text })),
      ...(frames !== undefined && frames.length > 0 ? { frames: [...frames] } : {}),
    });
  });
  return summaries;
}

/** Every WordForm Word/WordForm/Senses UI row for `word` -- real
 * `WordForm` records (`wordForms.formsOf(word)`), required now, not
 * optional: `word.senseIds`/`synsetId`/`contractionOf` no longer exist
 * to fall back to (WordForm's own docstring on why), so a `Word` with
 * no matching `WordForms` entries shows no senses/sense_id/derivations
 * at all any more, not just an empty Word Forms section. Each entry
 * carries its own nested `senses` (this WordForm's own subset of
 * `wordSenses`, `WordFormEntry.senses`'s own docstring).
 * Every POS subtype now registers real `WordForm` records for all of
 * its own spelling variants (data/entities/word_form.ts's own docstring on this
 * migration, Auxiliary first, every other POS subtype following) --
 * there is no scalar `*_Form` field left anywhere to fall back to. */
function wordFormsFor(word: Word, wordForms: WordForms, wordSenses: readonly WordSenseSummary[]): WordFormEntry[] {
  const senseById = new Map(wordSenses.map((sense) => [sense.id, sense]));
  const forms: WordFormEntry[] = [];
  for (const form of wordForms.formsOf(word)) {
    const formSenses = form.senseIds.map((id) => senseById.get(id.value)).filter((sense): sense is WordSenseSummary => sense !== undefined);
    forms.push({ field: form.field, label: formFieldLabel(form.field), value: form.text.value, senses: formSenses });
  }
  // Noun.wordCharacterForms isn't a Word Form Matrix field (that
  // field's own docstring, data/entities/noun.ts) -- not spelling-derivable, so
  // it has no WORD_FORM_MATRIX row and no real WordForm record ever
  // covers it -- appended here instead, the same "rendered in this
  // section without being a Matrix field" treatment `derivations`
  // already gets (WordRecord.derivations's own docstring on why that
  // lives here too rather than its own section). Every character
  // joined into one row's own value ("( / )" for "parenthesis"), not
  // one row per character -- a paired mark's own glyphs read as one
  // fact about the Noun, not several independent Word Form rows
  // sharing an identical label. `?? []` guards a real gap: isNoun()
  // narrows on partOfSpeech alone, so a NOUN-tagged Word built via
  // phraseAsWord() (a Phrase's own createWord()-based projection,
  // data/phrase.ts) type-narrows to Noun here too despite never having
  // gone through createNoun() -- wordCharacterForms is undefined on
  // that object at runtime even though Noun declares it non-optional.
  const characterForms = isNoun(word) ? (word.wordCharacterForms ?? []) : [];
  if (characterForms.length > 0) {
    forms.push({
      field: "wordCharacterForms",
      label: formFieldLabel("wordCharacterForms"),
      value: characterForms.map((text) => text.value).join(" / "),
      senses: [],
    });
  }
  return forms;
}

/** One Word's full WordRecord -- everything wordRecords() (the whole-
 * Dictionary path, only ever run under MAX_INTERACTIVE_WORDS) and
 * searchWords() (the single-Word-at-a-time path, run regardless of
 * scale) both build from, so a WordRecord looks identical -- same
 * fields, same relationship_count/definition_segments logic --
 * whichever path produced it. */
export function wordRecordFor(
  word: Word,
  dictionary: Dictionary,
  relationships: SemanticRelationshipStore,
  senses: Senses,
  domainName: string,
  wordForms: WordForms,
): WordRecord {
  const wordId = wordGraphUuid(word);
  const wordSenseIds = wordForms.senseIdsOf(word);
  // SemanticRelationshipStore is Sense-keyed, not Word-keyed (every
  // fact this view reads through it now, DictionaryView's own class
  // docstring on why) -- so this word's own relationship count is the
  // sum across every one of its own senses, not a single direct
  // lookup by `wordId` the way it used to be.
  const relationshipCount = wordSenseIds.reduce(
    (total, senseId) => total + relationships.outgoing(senseId.value).length + relationships.incoming(senseId.value).length,
    0,
  );
  const senseFields = senseFieldsFor(senses, word, wordForms);
  const wordSenses = sensesFor(word, senses, domainName, wordForms);
  return {
    id: wordId,
    entry_id: word.entryId.value,
    lexical_form: word.text,
    text: word.text,
    pos: PartOfSpeech[word.partOfSpeech],
    sense_id: wordForms.synsetIdOf(word)?.value ?? null,
    definition: senseFields.definition?.value ?? "",
    gloss: senseFields.gloss?.value ?? "",
    register_codes: word.registerCodes.map((code) => RegisterCode[code]),
    dialect_codes: word.dialectCodes.map((code) => code.value),
    editorial_labels: word.editorialLabels.map((label) => EditorialLabel[label]),
    is_common: word.isCommon,
    is_root_word: isRootWordFor(senses, word, wordForms),
    is_derivable_noun: isNoun(word) && word.isDerivableNoun,
    domain: domainLabel(senses, domainName, word, wordForms),
    related_domains: senseFields.relatedDomainTags.map((tag) => tag.value),
    is_fully_hydrated: word.isFullyHydrated,
    sources: word.sourceReferences.map((ref) => ref.sourceName.value),
    relationship_count: relationshipCount,
    definition_segments: definitionSegments(word, dictionary, senses, domainName, wordForms),
    word_forms: wordFormsFor(word, wordForms, wordSenses),
    senses: wordSenses,
    derivations: morphologicalDerivations(word, dictionary, wordForms),
  };
}

export function wordRecords(
  dictionary: Dictionary,
  relationships: SemanticRelationshipStore,
  senses: Senses,
  domainName: string,
  wordForms: WordForms,
): WordRecord[] {
  const records = dictionary.all().map((word) => wordRecordFor(word, dictionary, relationships, senses, domainName, wordForms));
  records.sort((a, b) => a.lexical_form.toLowerCase().localeCompare(b.lexical_form.toLowerCase()));
  return records;
}

/** Resolves a Words-tab search against every Word in the Dictionary
 * directly, rather than against a pre-embedded client-side array --
 * the on-demand counterpart to wordRecords() for a Domain over
 * MAX_INTERACTIVE_WORDS, where embedding every Word up front isn't an
 * option (that constant's own docstring). Matching semantics
 * (case-insensitive substring on lexical_form/gloss/definition, exact
 * pos/domain, is_root_word) mirror the fragment's own client-side
 * matchesQuery()/filteredWords() exactly, so a search behaves the same
 * whether it ran client-side (a small Domain) or here (a large one).
 *
 * A linear scan over the whole Dictionary -- for the ~211,000-Word
 * scale this exists for, that's tens of milliseconds of plain string
 * comparisons, nowhere near the cost embedding every Word's full
 * WordRecord (and then JSON.stringify-ing the result) would be.
 * `words` is capped at `options.limit`; `totalMatches` is the true
 * count of everything that matched, uncapped, so a caller can show
 * "showing N of totalMatches" the same way MAX_WORD_ROWS_SHOWN's
 * client-side note already does.
 *
 * `wordId`, if given, bypasses every other filter for an O(1) exact
 * lookup (Dictionary.findByUuid) instead of the linear scan below --
 * the detail panel's own need to resolve a related word clicked from
 * inside itself (a pivot button carries only that word's id, never
 * enough to search by) that isn't already one of the currently-shown
 * Words (WORDS, empty over capacity, or the last search's own
 * results) -- ui/client/'s own client-side lookupWordForDetailPanel(). */
export function searchWords(
  dictionary: Dictionary,
  phrases: Phrases,
  senses: Senses,
  relationships: SemanticRelationshipStore,
  domainName: string,
  options: {
    wordId?: string;
    word?: string;
    gloss?: string;
    definition?: string;
    pos?: string;
    domain?: string;
    rootWordsOnly?: boolean;
    limit?: number;
  },
  wordForms: WordForms,
): { words: WordRecord[]; totalMatches: number } {
  if (options.wordId !== undefined) {
    // Checked directly against the Phrase itself, not via
    // resolveEntry()'s own Word-shaped projection -- phraseAsWord()
    // deliberately doesn't carry a Phrase's own `words` references
    // (a plain Word has no sub-word composition to project), so
    // building the phrase_word_segments a Phrase's own detail-panel
    // headword needs (phraseWordSegments()'s own docstring) requires
    // the original Phrase, not just its Word-shaped view.
    const phrase = phrases.findByUuid(options.wordId);
    if (phrase !== undefined) {
      const record = wordRecordFor(phraseAsWord(phrase, wordForms), dictionary, relationships, senses, domainName, wordForms);
      const modifiers = phraseModifierSegments(phrase, dictionary, senses, domainName, wordForms);
      return {
        words: [
          {
            ...record,
            phrase_word_segments: phraseWordSegments(phrase, dictionary, senses, domainName, wordForms),
            phrase_type: phraseTypeLabel(phrase),
            head_word: phraseHeadWordSegment(phrase, dictionary, senses, domainName, wordForms),
            pre_modifiers: modifiers.pre,
            post_modifiers: modifiers.post,
            determiners: modifiers.determiners,
          },
        ],
        totalMatches: 1,
      };
    }
    const word = dictionary.findByUuid(options.wordId);
    if (word !== undefined) return { words: [wordRecordFor(word, dictionary, relationships, senses, domainName, wordForms)], totalMatches: 1 };
    // `wordId` may also name a Sense directly -- the Senses tab's own
    // row-click (senseRecordFor()'s own `id`), resolved to its first-
    // registered member the same way resolveEntry() falls back
    // to a representative member for a Sense-typed relationship
    // endpoint (that function's own docstring). Reuses this same
    // branch's own Phrase-vs-Word handling for whichever kind the
    // representative turns out to be, so a Sense whose one member is a
    // Phrase still gets its own phrase_word_segments.
    const sense = senses.findByUuid(options.wordId);
    const representative = sense !== undefined ? senses.membersOf(senseGraphUuid(sense))[0] : undefined;
    if (representative !== undefined) {
      if ("words" in representative) {
        const record = wordRecordFor(phraseAsWord(representative, wordForms), dictionary, relationships, senses, domainName, wordForms);
        const modifiers = phraseModifierSegments(representative, dictionary, senses, domainName, wordForms);
        return {
          words: [
            {
              ...record,
              phrase_word_segments: phraseWordSegments(representative, dictionary, senses, domainName, wordForms),
              phrase_type: phraseTypeLabel(representative),
              head_word: phraseHeadWordSegment(representative, dictionary, senses, domainName, wordForms),
              pre_modifiers: modifiers.pre,
              post_modifiers: modifiers.post,
              determiners: modifiers.determiners,
            },
          ],
          totalMatches: 1,
        };
      }
      return { words: [wordRecordFor(representative, dictionary, relationships, senses, domainName, wordForms)], totalMatches: 1 };
    }
    return { words: [], totalMatches: 0 };
  }

  const limit = options.limit ?? 1000;
  const wordQuery = options.word?.trim().toLowerCase();
  const glossQuery = options.gloss?.trim().toLowerCase();
  const definitionQuery = options.definition?.trim().toLowerCase();

  const matches: WordRecord[] = [];
  let totalMatches = 0;
  for (const word of dictionary.all()) {
    if (options.pos && PartOfSpeech[word.partOfSpeech] !== options.pos) continue;
    if (options.rootWordsOnly && !isRootWordFor(senses, word, wordForms)) continue;
    if (options.domain && domainLabel(senses, domainName, word, wordForms) !== options.domain) continue;
    const lexicalForm = word.text.toLowerCase();
    if (wordQuery && !lexicalForm.includes(wordQuery)) continue;
    if (glossQuery && !(word.gloss?.value ?? "").toLowerCase().includes(glossQuery)) continue;
    if (definitionQuery && !(senseFieldsFor(senses, word, wordForms).definition?.value ?? "").toLowerCase().includes(definitionQuery)) continue;

    totalMatches += 1;
    if (matches.length < limit) matches.push(wordRecordFor(word, dictionary, relationships, senses, domainName, wordForms));
  }
  matches.sort((a, b) => a.lexical_form.toLowerCase().localeCompare(b.lexical_form.toLowerCase()));
  return { words: matches, totalMatches };
}
