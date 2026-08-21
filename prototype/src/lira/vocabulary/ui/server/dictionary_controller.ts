/** DictionaryView: renders a Dictionary and its SemanticRelationshipStore
 * as a single self-contained HTML page (vocabulary/documentation/README.md
 * covers the data this reads; see vocabulary/ui/README.md for the
 * Python original this was ported from). All Word and SemanticRelationship
 * data is embedded as JSON and searched/filtered/sorted client-side in
 * vanilla JS -- no server, no external requests -- so render() returns
 * a fully self-contained document. Uses only system font stacks (no
 * CDN or embedded webfont) so the output stays a single dependency-free
 * string.
 *
 * Ported from vocabulary/ui/dictionary_view.py. The Python original's
 * CSS/HTML/client-side JS is already implementation-agnostic web tech
 * (not Python) -- this port carries it over character-for-character in
 * PAGE_TEMPLATE (ui/client/page_template.ts, reassembled from ui/client/'s
 * own verbatim-sliced pieces -- mechanical extraction, not a rewrite), and
 * ports only the *Python* surface: the DictionaryView class that assembles
 * the @@TOKEN@@ substitution values from a real Dictionary/
 * SemanticRelationshipStore instead of from dataclasses. The record-
 * building/query logic itself lives in this file's ui/server/ siblings
 * (builder_word.ts, builder_phrase.ts, builder_sense.ts,
 * builder_relationship.ts, builder_hierarchy.ts, resolver_entity.ts,
 * resolver_domain.ts) -- this class is the thin controller that owns this
 * view's own state (the Dictionary/Phrases/Senses/SemanticRelationshipStore
 * to render, and the title/domainName/unresolved options) and delegates to
 * them.
 *
 * LexicalRelationshipStore (Word-to-Word morphological/orthographic
 * facts) is deliberately absent from this class entirely --
 * VocabularyContext's own docstring (data/vocabulary_context.ts) on why: it's
 * seeding-internal working state now, never read again once
 * WordSeeder/RelationshipSeeder return. Every fact this view used to
 * read from it is now either a genuine SemanticRelationship (every true
 * sense-to-sense semantic kind, SemanticRelationshipKind's own
 * docstring) or a direct POS-class attribute this view already reads
 * off the Word/Phrase itself (isNominalised and its siblings, Word.contractionOf,
 * ..., each field's own docstring in data/entities/noun.ts, data/entities/verb.ts,
 * data/entities/adjective.ts, data/entities/adverb.ts, data/word.ts). */

import { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Dictionary } from "../../data/dictionary";
import type { SemanticRelationshipStore } from "../../data/semantic_relationship_store";
import { Phrases } from "../../data/phrases";
import { Senses } from "../../data/senses";
import { PAGE_TEMPLATE } from "../client/page_template";
import { phraseRecords, searchPhrases, type PhraseRecord } from "./builder_phrase";
import { senseRecords, searchSenses, type SenseRecord } from "./builder_sense";
import { relationshipKindCounts, relationshipRecords, searchRelationships, type RelationshipKindCount, type RelationshipRecord } from "./builder_relationship";
import { resolveHierarchy, type HierarchyResolution } from "./builder_hierarchy";
import { searchWords, wordRecords, type WordRecord } from "./builder_word";
import { domainLabel } from "./resolver_domain";

export interface DictionaryViewOptions {
  title?: string;
  domainName?: string;
  unresolved?: readonly string[];
  // Undefined/omitted means an empty Phrases tab -- every existing
  // caller that predates Phrase (phrase.ts's own docstring) keeps
  // working with zero changes, same reasoning DictionaryView's own
  // constructor default gives this field.
  phrases?: Phrases;
  // Sense's own exact counterpart -- undefined/omitted means every
  // existing caller that predates Sense keeps working unchanged
  // (resolveEntry()'s own docstring on why an omitted Senses simply
  // means "no Sense-typed relationship endpoint will ever be seen",
  // true for every pre-Sense Domain).
  senses?: Senses;
}

// A hard ceiling on how many Words this view will build full,
// per-Word interactive records for (wordRecords()/relationshipRecords())
// and embed into the page's own client-side WORDS/RELS arrays. Below
// it, the Words/Relationships/Hierarchy/Cyclic tabs behave exactly as
// they always have -- a full, searchable, client-side data set (the
// original Python page's own design, ~3,100 words for the real Common
// Vocabulary Cache). Above it, this class renders a clear "too many
// Words for this view" notice instead: embedding a Domain the size
// WordSeeder.seedWordNet (role/word_seeder.ts) can produce -- ~211,000
// Words, ~780,000 relationships -- as one client-side JSON literal
// doesn't just get slow, `JSON.stringify` on that many WordRecords
// throws `RangeError: Invalid string length` outright, well past the
// JS engine's own maximum string length. The stat tiles above the tabs
// stay accurate regardless (render()'s own totalWordCount/
// totalRelationshipCount, computed directly off the Dictionary/
// SemanticRelationshipStore, never off the capped arrays) -- only the
// interactive browse-every-word experience is unavailable past this
// ceiling, not the counts.
const MAX_INTERACTIVE_WORDS = 20_000;

const GROUP_NAMES: Record<number, string> = { 0: "Morphological", 1: "Lexical Semantic", 2: "Orthographic and Naming" };

const GROUP_COLORS: Record<number, string> = { 0: "#3B6EA5", 1: "#B2542D", 2: "#7A5CA6" };

const POS_COLORS: Record<string, string> = {
  [PartOfSpeech[PartOfSpeech.NOUN]]: "#3B6EA5",
  [PartOfSpeech[PartOfSpeech.PROPER_NOUN]]: "#274472",
  [PartOfSpeech[PartOfSpeech.VERB]]: "#B2542D",
  [PartOfSpeech[PartOfSpeech.ADJECTIVE]]: "#7A5CA6",
  [PartOfSpeech[PartOfSpeech.ADVERB]]: "#B08900",
  [PartOfSpeech[PartOfSpeech.PRONOUN]]: "#5B7B6F",
  [PartOfSpeech[PartOfSpeech.DETERMINER]]: "#6E7B8B",
  [PartOfSpeech[PartOfSpeech.PREPOSITION]]: "#7B6E5B",
  [PartOfSpeech[PartOfSpeech.CONJUNCTION]]: "#6B7280",
  [PartOfSpeech[PartOfSpeech.PARTICLE]]: "#8A7B6E",
  [PartOfSpeech[PartOfSpeech.AUXILIARY]]: "#5B6E8B",
  [PartOfSpeech[PartOfSpeech.INTERJECTION]]: "#C2544B",
  [PartOfSpeech[PartOfSpeech.NUMERAL]]: "#4B8A7B",
  [PartOfSpeech[PartOfSpeech.SYMBOL]]: "#8A8A8A",
  [PartOfSpeech[PartOfSpeech.PUNCTUATION]]: "#9A9A9A",
  [PartOfSpeech[PartOfSpeech.OTHER]]: "#7A7A7A",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** The text strictly between two `@@MARKER@@` comment tokens already
 * present in rendered HTML/CSS/JS -- used by renderFragment() below. */
function extractBetween(html: string, startMarker: string, endMarker: string): string {
  const start = html.indexOf(startMarker) + startMarker.length;
  const end = html.indexOf(endMarker, start);
  return html.slice(start, end).replace(/^\n+|\n+$/g, "");
}

/** Builds the HTML page. Construct with the Dictionary and
 * SemanticRelationshipStore to display -- typically a Domain's
 * `domain.vocabulary.dictionary` and `domain.vocabulary.semanticRelationships`
 * -- call `render()` for the HTML string. */
export class DictionaryView {
  private readonly title: string;
  // A Word carries no domain field of its own (a Domain owns its
  // Dictionary; the Word doesn't know which Domain it's in) -- this
  // view renders exactly one Domain's Dictionary at a time, so every
  // Word in it is either that Domain's own (word.isCommon is false) or
  // inherited from Common (word.isCommon is true). domainName supplies
  // the label for the former; "Common" is never overridden.
  private readonly domainName: string;
  // Words a caller looked up and could not resolve (no seeded sense,
  // no successful hydration) -- optional. Never derived from the
  // Dictionary itself: an unresolved word by definition has no Word
  // record to find here.
  private readonly unresolved: readonly string[];

  private readonly phrases: Phrases;
  private readonly senses: Senses;

  constructor(
    private readonly dictionary: Dictionary,
    private readonly relationships: SemanticRelationshipStore,
    options: DictionaryViewOptions = {},
  ) {
    this.title = options.title ?? "LIRA Dictionary";
    this.domainName = options.domainName ?? "Domain";
    this.unresolved = options.unresolved ?? [];
    this.phrases = options.phrases ?? new Phrases();
    this.senses = options.senses ?? new Senses();
  }

  /** The moment render() is actually called, not construction time --
   * so re-running a seeding script's render() always stamps the instant
   * the page was built, even if the DictionaryView object itself was
   * constructed earlier. */
  private compiledAt(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())} UTC`;
  }

  render(): string {
    // Computed directly off the Dictionary/SemanticRelationshipStore,
    // never off wordRecords()/relationshipRecords() -- MAX_INTERACTIVE_WORDS's
    // own docstring on why those two stay accurate even when the full
    // interactive record set below is deliberately skipped.
    const allWords = this.dictionary.all();
    const totalWordCount = allWords.length;
    const totalPhraseCount = this.phrases.totalEntries();
    const totalRelationshipCount = this.relationships.all().length;
    const overCapacity = totalWordCount > MAX_INTERACTIVE_WORDS;
    // A WordNet-seeded Domain's own Phrases is tens of thousands of
    // entries now (WordSeeder.seedWordNet routes every multi-word synset
    // lemma there), not the "a few dozen at most" scale an earlier
    // version of phraseRecords() assumed -- phraseRecords()'s own
    // docstring on why this needs the identical capacity gate `words`
    // above already has, checked against the same MAX_INTERACTIVE_WORDS
    // threshold (there is nothing Phrase-specific about the actual cost
    // this gate exists to avoid -- laying out tens of thousands of <tr>
    // elements in one innerHTML assignment, MAX_WORD_ROWS_SHOWN's own
    // client-side docstring).
    const overCapacityPhrases = totalPhraseCount > MAX_INTERACTIVE_WORDS;
    // Same reasoning as overCapacityPhrases just above, checked against
    // the Senses store's own count -- WordSeeder.seedWordNet seeds one
    // Sense per synset, ~117,800 of them at WordNet scale, well past
    // MAX_INTERACTIVE_WORDS.
    const totalSenseCount = this.senses.totalEntries();
    const overCapacitySenses = totalSenseCount > MAX_INTERACTIVE_WORDS;

    const words = overCapacity ? [] : wordRecords(this.dictionary, this.relationships, this.senses, this.domainName);
    const rels = overCapacity ? [] : relationshipRecords(this.relationships, this.dictionary, this.phrases, this.senses, this.domainName);
    const phrases = overCapacityPhrases ? [] : phraseRecords(this.phrases, this.senses);
    const senses = overCapacitySenses ? [] : senseRecords(this.senses, this.domainName);
    const commonCount = allWords.filter((w) => w.isCommon).length;
    const posCounts = new Set(allWords.map((w) => w.partOfSpeech));
    // The Words tab's own pos-filter/domain-filter <select> options --
    // computed off allWords, same as the stat tiles above, not off the
    // (possibly capped-empty) `words` WordRecord array: populatePosFilter/
    // populateDomainFilter used to derive their own options by scanning
    // the client-side WORDS array directly, which silently left both
    // filters empty whenever overCapacity emptied that array (a real bug
    // this fixed -- filed against seedWordNet's own WordNet-scale runs,
    // where every dropdown showed nothing at all despite 200,000+ Words
    // actually being there).
    const posValues = [...new Set(allWords.map((w) => PartOfSpeech[w.partOfSpeech]))].sort();
    const domainValues = [...new Set(allWords.map((w) => domainLabel(this.senses, this.domainName, w)).filter((d): d is string => d !== null))].sort();
    // Just two labels are ever possible for one DictionaryView render
    // ("Common" and this.domainName), so a fixed two-color assignment,
    // not a per-domain palette, is enough.
    const domainColors: Record<string, string> = { Common: "#6E7B8B", [this.domainName]: "#2B6E63" };

    let html = PAGE_TEMPLATE;
    const substitutions: Record<string, string> = {
      TITLE: escapeHtml(this.title),
      COMPILED_AT: escapeHtml(this.compiledAt()),
      WORD_COUNT: String(totalWordCount),
      PHRASE_COUNT: String(totalPhraseCount),
      SENSE_COUNT: String(totalSenseCount),
      RELATIONSHIP_COUNT: String(totalRelationshipCount),
      COMMON_COUNT: String(commonCount),
      DOMAIN_SPECIFIC_COUNT: String(totalWordCount - commonCount),
      POS_COUNT: String(posCounts.size),
      UNRESOLVED_COUNT: String(this.unresolved.length),
      WORDS_JSON: JSON.stringify(words),
      PHRASES_JSON: JSON.stringify(phrases),
      SENSES_JSON: JSON.stringify(senses),
      RELS_JSON: JSON.stringify(rels),
      POS_VALUES_JSON: JSON.stringify(posValues),
      DOMAIN_VALUES_JSON: JSON.stringify(domainValues),
      OVER_CAPACITY_JSON: JSON.stringify(overCapacity),
      OVER_CAPACITY_PHRASES_JSON: JSON.stringify(overCapacityPhrases),
      OVER_CAPACITY_SENSES_JSON: JSON.stringify(overCapacitySenses),
      // Over capacity, the Words tab searches the full Dictionary
      // server-side per keystroke (searchWords(), renderWordsOverCapacity()
      // in the fragment's own script below) rather than embedding every
      // Word up front -- so this message now only ever shows on a
      // genuine zero-match search, same as the normal (under-capacity)
      // wording, just naming the real total so a search that finds
      // nothing against 211,000 Words reads differently than one
      // against 40.
      WORDS_EMPTY_MESSAGE: overCapacity
        ? escapeHtml(`No words match this search across all ${totalWordCount.toLocaleString()} words in this Domain.`)
        : "No words match this search.",
      // Same reasoning as WORDS_EMPTY_MESSAGE just above -- the
      // Relationships tab now searches server-side over capacity too
      // (searchRelationships(), renderRelsOverCapacity() below), so
      // this only ever shows on a genuine zero-match search.
      RELS_EMPTY_MESSAGE: overCapacity
        ? escapeHtml(`No relationships match this search across all ${totalRelationshipCount.toLocaleString()} relationships in this Domain.`)
        : "No relationships match this search.",
      // Same reasoning as WORDS_EMPTY_MESSAGE just above -- the Phrases
      // tab now searches server-side over capacity too (searchPhrases(),
      // renderPhrasesOverCapacity() below).
      PHRASES_EMPTY_MESSAGE: overCapacityPhrases
        ? escapeHtml(`No phrases match this search across all ${totalPhraseCount.toLocaleString()} phrases in this Domain.`)
        : "No phrases match this search.",
      // Same reasoning as PHRASES_EMPTY_MESSAGE just above -- the Senses
      // tab now searches server-side over capacity too (searchSenses(),
      // renderSensesOverCapacity() below).
      SENSES_EMPTY_MESSAGE: overCapacitySenses
        ? escapeHtml(`No senses match this search across all ${totalSenseCount.toLocaleString()} senses in this Domain.`)
        : "No senses match this search.",
      UNRESOLVED_JSON: JSON.stringify([...this.unresolved].sort()),
      // The Hierarchy/Cyclic tabs' own "Relationship kind" dropdowns --
      // computed off the full SemanticRelationshipStore regardless of
      // overCapacity, same reasoning as POS_VALUES/DOMAIN_VALUES just
      // above (relationshipKindCounts()'s own docstring: past
      // MAX_INTERACTIVE_WORDS there's no client-embedded RELS array
      // left to scan for kinds at all).
      RELATIONSHIP_KIND_COUNTS_JSON: JSON.stringify(relationshipKindCounts(this.relationships)),
      POS_COLORS_JSON: JSON.stringify(POS_COLORS),
      GROUP_COLORS_JSON: JSON.stringify(GROUP_COLORS),
      GROUP_NAMES_JSON: JSON.stringify(GROUP_NAMES),
      DOMAIN_COLORS_JSON: JSON.stringify(domainColors),
    };
    for (const [token, value] of Object.entries(substitutions)) {
      html = html.split(`@@${token}@@`).join(value);
    }
    return html;
  }

  /** [styleCss, bodyHtml, scriptJs] for embedding this view as one tab
   * of a combined page (knowledge/ui/knowledge_view.ts) -- everything
   * this view needs *besides* the shared chrome a combined page only
   * wants once, and besides this view's own masthead. `scriptJs` is
   * returned separately, not concatenated into `bodyHtml`, because the
   * combiner must wrap it in its own scope (an IIFE) before embedding --
   * this view's script declares top-level `const`/`function` names
   * (e.g. `POS_COLORS`) that would collide with another view's script
   * of the same shape if both landed in one global `<script>` block
   * unscoped. */
  renderFragment(): [style: string, body: string, script: string] {
    const html = this.render();
    const style = extractBetween(html, "/*@@STYLE_FRAGMENT_START@@*/", "/*@@STYLE_FRAGMENT_END@@*/");
    const body = extractBetween(html, "<!--@@BODY_FRAGMENT_START@@-->", "<!--@@BODY_FRAGMENT_END@@-->");
    const script = extractBetween(html, "/*@@SCRIPT_FRAGMENT_START@@*/", "/*@@SCRIPT_FRAGMENT_END@@*/");
    return [style, body, script];
  }

  /** Browser-port equivalent of Python's `save(path)` -- there is no
   * filesystem to write a path to, so this triggers a client-side
   * download of the same self-contained HTML render() produces. */
  downloadAsFile(filename = "dictionary.html"): void {
    const blob = new Blob([this.render()], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  /** word.uuid.value -> domain label (word.isCommon's own "Common"/
   * domainTag, or this view's own domainName), for every Word in this
   * Dictionary -- Concept-to-Domain lookups for a page composing this
   * view with another (knowledge/ui/knowledge_view.ts), without
   * duplicating domainLabel's own isCommon/domainTag logic. */
  wordDomainLabels(): Map<string, string | null> {
    const labels = new Map<string, string | null>();
    for (const word of this.dictionary.all()) labels.set(word.uuid.value, domainLabel(this.senses, this.domainName, word));
    return labels;
  }

  searchWords(options: {
    wordId?: string;
    word?: string;
    gloss?: string;
    definition?: string;
    pos?: string;
    domain?: string;
    rootWordsOnly?: boolean;
    limit?: number;
  }): { words: WordRecord[]; totalMatches: number } {
    return searchWords(this.dictionary, this.phrases, this.senses, this.relationships, this.domainName, options);
  }

  searchPhrases(options: { word?: string; gloss?: string; definition?: string; pos?: string; limit?: number }): {
    phrases: PhraseRecord[];
    totalMatches: number;
  } {
    return searchPhrases(this.phrases, this.senses, options);
  }

  searchSenses(options: { word?: string; gloss?: string; definition?: string; pos?: string; limit?: number }): {
    senses: SenseRecord[];
    totalMatches: number;
  } {
    return searchSenses(this.senses, this.domainName, options);
  }

  searchRelationships(options: { wordId?: string; query?: string; limit?: number }): { relationships: RelationshipRecord[]; totalMatches: number } {
    return searchRelationships(this.relationships, this.dictionary, this.phrases, this.senses, this.domainName, options);
  }

  relationshipKindCounts(): RelationshipKindCount[] {
    return relationshipKindCounts(this.relationships);
  }

  resolveHierarchy(options: { kind: string; wordId?: string; limit?: number }): HierarchyResolution {
    return resolveHierarchy(this.relationships, this.dictionary, this.phrases, this.senses, this.domainName, options);
  }
}
