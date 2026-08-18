/** Parses the raw Princeton WordNet 3.1 dict/ files
 * (assets/wordnet/dict/, see assets/wordnet/README.md for provenance)
 * into WordNetSynsets -- one entry per synset line, carrying its
 * member lemmas, gloss, and pointer records. A WordNet synset -- "a set
 * of one or more synonyms" -- is what WordSeeder.seedWordNet
 * (word_seeder.ts) turns into a group of LIRA Words joined by SYNONYM
 * LexicalRelationships (Word.synsetId's own docstring), the same shape
 * entryToWord already turns Common Vocabulary Cache JSON into, one file
 * format earlier in the pipeline; each pointer record is that same
 * seeder's own source for every *other* LexicalRelationship kind
 * WordNet expresses (hypernym, meronym, antonym, ...) --
 * relationshipKindForPointer there maps a pointer's own symbol onto a
 * LexicalRelationshipType.
 *
 * The WordNet data file format is:
 *
 *     synset_offset  lex_filenum  ss_type  w_cnt  {word  lex_id}...
 *     p_cnt  {ptr_symbol  offset  pos  source/target}...
 *     [frame_cnt  {+  frame_number  word_number}...]  |  gloss
 *
 * `lex_filenum` (WordNet's own internal lexicographer-file category,
 * e.g. "noun.animal") and each word's own `lex_id` are read
 * positionally (needed to walk past them to the next field) but not
 * retained -- LIRA has no equivalent slot for either, and nothing here
 * needs them. The (verb-only) frame block IS retained now (as
 * WordNetSynset.frames, below) -- critically never confused with the
 * pointer block's own `+` symbol (WordNet reuses `+` for two unrelated
 * things: the "derivationally related form" pointer `ptr_symbol` a
 * synset can have any number of, and the frame-record separator every
 * frame entry starts with -- ordinary token scanning for `+` can't tell
 * them apart, so `p_cnt`/`frame_cnt` themselves are what make each
 * block's own length known in advance, and are read positionally for
 * exactly that reason). */

import { AdjectivePosition } from "../data/adjective";
import { PartOfSpeech } from "../data/enums/part_of_speech";

/** One relation a synset carries to another synset (or, for a lexical
 * -- word-specific, not whole-synset -- pointer, to one particular word
 * within it), exactly as WordNet's own dict/data.* pointer record
 * states it: `ptr_symbol synset_offset pos source/target`.
 * `sourceWordIndex`/`targetWordIndex` are WordNet's own `source/target`
 * hex field split into its two halves -- 0 means "the whole synset" (a
 * semantic pointer), a nonzero value is the 1-based position of one
 * specific word in that synset's own `lemmas` array (a lexical
 * pointer, e.g. ANTONYM is always word-specific: "good" the ADJECTIVE
 * synset's word #1 is the antonym of "bad" the ADJECTIVE synset's word
 * #1 specifically, not every word in one synset against every word in
 * the other). */
export interface WordNetPointer {
  symbol: string;
  targetSynsetId: string;
  sourceWordIndex: number;
  targetWordIndex: number;
}

// One raw entry from the verb-only frame block -- WordNet's own
// `frame_cnt {+ frame_number word_number}...` records, kept exactly as
// written rather than resolved to text here (that's Verb's own
// VERB_FRAME_TEXT, data/verb.ts -- a Vocabulary-layer concern, not this
// module's). `wordIndex` is WordNet's own `word_number`, hex-encoded
// exactly like WordNetPointer's own sourceWordIndex/targetWordIndex
// above (confirmed against real data -- word_number values like "0f"
// only make sense as hex): 0 means "every member of this synset", a
// nonzero value is the 1-based position of one specific member in
// `lemmas` this frame applies to instead (WordSeeder.seedWordNet's own
// synsetMemberToWord() is what narrows this down to one Word's own
// applicable frames). `frameNumber` itself is a plain decimal 1-35.
export interface WordNetFrame {
  frameNumber: number;
  wordIndex: number;
}

export interface WordNetSynset {
  // WordNet's own offset-pos key, e.g. "00001740-n" -- see Word.synsetId's
  // own docstring for the full format.
  synsetId: string;
  partOfSpeech: PartOfSpeech;
  // Underscores already replaced with spaces ("physical_entity" ->
  // "physical entity") and any trailing adjective syntactic-position
  // marker ("occupied(p)") stripped -- ready to use as a Word.text/
  // lexicalForm as-is. The marker itself, when present, survives
  // separately in `lemmaPositions` below rather than being discarded.
  lemmas: readonly string[];
  // Parallel to `lemmas` (same length, same index order) -- the
  // AdjectivePosition a lemma's own trailing "(a)"/"(p)"/"(ip)" marker
  // named, or undefined for a lemma with no marker (every non-adjective
  // lemma, and most adjective ones too -- only ~4% of dict/data.adj's
  // own lemmas carry one at all). Adjective's own docstring
  // (data/adjective.ts) on what each position means and how this was
  // verified against the bundled dict/ files.
  lemmaPositions: readonly (AdjectivePosition | undefined)[];
  definition: string;
  examples: readonly string[];
  pointers: readonly WordNetPointer[];
  // The verb-only frame block, parsed but not yet resolved to text or
  // narrowed to one Word -- always [] for a non-VERB synset. Verb's own
  // docstring (data/verb.ts) on what this data is and how it was
  // verified against the bundled dict/ files.
  frames: readonly WordNetFrame[];
}

const DICT_FILENAMES = ["data.noun", "data.verb", "data.adj", "data.adv"] as const;

// Deliberately lazy (no `eager: true`), unlike asset_loader.ts's own
// Common Vocabulary Cache glob: every WordSeeder caller needs that JSON
// (seedClosedClassWords is always run), but the ~21MB of WordNet dict/
// text is only ever read by seedWordNet, a separate, opt-in seeding
// path. An eager glob bundles matched files into whichever chunk
// imports this module at *module* scope, regardless of whether the
// data ever actually gets read -- e.g. linguistics_worker.ts imports
// WordSeeder for seedClosedClassWords alone and would otherwise carry
// the entire WordNet dataset for nothing. Each loader function below
// only resolves (and only then does its chunk get fetched) once
// loadWordNetSynsets() actually runs.
const dictFileLoaders = import.meta.glob<string>("../assets/wordnet/dict/data.*", {
  query: "?raw",
  import: "default",
});

async function readDictFile(filename: string): Promise<string> {
  const suffix = `/assets/wordnet/dict/${filename}`;
  const key = Object.keys(dictFileLoaders).find((path) => path.endsWith(suffix));
  if (key === undefined) throw new Error(`WordNet dict file missing: ${filename}`);
  return dictFileLoaders[key]();
}

function posForSsType(ssType: string): PartOfSpeech {
  switch (ssType) {
    case "n":
      return PartOfSpeech.NOUN;
    case "v":
      return PartOfSpeech.VERB;
    // "s" (satellite adjective) is still an ADJECTIVE to LIRA -- WordNet
    // splits adjectives into head ("a") and satellite ("s") synsets only
    // to distinguish a synonym cluster from the one it's a satellite
    // of; that distinction has no LIRA PartOfSpeech counterpart, so it
    // collapses here. The literal ss_type letter survives in synsetId
    // regardless, so it's never lost, just not separately classified.
    case "a":
    case "s":
      return PartOfSpeech.ADJECTIVE;
    case "r":
      return PartOfSpeech.ADVERB;
    default:
      throw new Error(`unknown WordNet ss_type '${ssType}'`);
  }
}

// Confirmed exhaustive by direct scan of all four bundled dict/data.*
// files (adjective.ts's own docstring): "a"/"p"/"ip" are the only
// trailing parenthetical markers WordNet ever attaches directly to a
// lemma token (no separating space, unlike a gloss's own parenthetical
// asides), and only ever in dict/data.adj.
const POSITION_MARKER_PATTERN = /\((a|p|ip)\)$/;

function parseLemma(rawWord: string): { text: string; position?: AdjectivePosition } {
  const match = rawWord.match(POSITION_MARKER_PATTERN);
  const text = rawWord.replace(POSITION_MARKER_PATTERN, "").replace(/_/g, " ");
  if (match === null) return { text };
  const position =
    match[1] === "a" ? AdjectivePosition.ATTRIBUTIVE_ONLY
    : match[1] === "p" ? AdjectivePosition.PREDICATE_ONLY
    : AdjectivePosition.IMMEDIATELY_POSTNOMINAL;
  return { text, position };
}

/** Splits a synset's raw gloss ("a tangible and visible entity; an
 * entity that can cast a shadow; \"it was full of rackets...\"") into
 * its own definition prose and its own quoted usage examples --
 * WordNet's convention is one or more ';'-separated definition
 * segments (rare -- true for a handful of glosses with more than one
 * short sense-defining clause) followed by zero or more '"'-quoted
 * example segments, all joined with the same '; ' separator. */
function parseGloss(rawGloss: string): { definition: string; examples: readonly string[] } {
  const definitionParts: string[] = [];
  const examples: string[] = [];
  for (const segment of rawGloss.trim().split(/;\s+/)) {
    const trimmed = segment.trim();
    if (trimmed.length === 0) continue;
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) examples.push(trimmed.slice(1, -1));
    else definitionParts.push(trimmed);
  }
  return { definition: definitionParts.join("; "), examples };
}

// A synset line always starts with the 8-digit decimal synset_offset
// followed by whitespace -- the WordNet copyright header at the top of
// every dict/data.* file has no line shaped like that, so this alone
// tells a synset line apart from header/blank lines without needing to
// know how many header lines precede the data in a given file.
const SYNSET_LINE_PATTERN = /^\d{8}\s/;

function parseSynsetLine(line: string): WordNetSynset | undefined {
  const barIndex = line.indexOf(" | ");
  if (barIndex === -1) return undefined;
  const fields = line.slice(0, barIndex).trim().split(/\s+/);
  const [synsetOffset, , ssType, wordCountHex] = fields;
  const wordCount = parseInt(wordCountHex, 16);

  const lemmas: string[] = [];
  const lemmaPositions: (AdjectivePosition | undefined)[] = [];
  for (let i = 0; i < wordCount; i++) {
    const rawWord = fields[4 + i * 2];
    if (rawWord === undefined) break;
    const { text, position } = parseLemma(rawWord);
    lemmas.push(text);
    lemmaPositions.push(position);
  }

  // Positional from here on, not pattern-matched -- this module's own
  // docstring on why (the frame block's own `+` separator is
  // indistinguishable from the pointer block's own "derivationally
  // related form" `+` symbol by token alone).
  let cursor = 4 + wordCount * 2;
  const pointerCount = parseInt(fields[cursor], 10);
  cursor += 1;
  const pointers: WordNetPointer[] = [];
  for (let i = 0; i < pointerCount; i++) {
    const symbol = fields[cursor];
    const targetOffset = fields[cursor + 1];
    const targetPos = fields[cursor + 2];
    const sourceTarget = fields[cursor + 3];
    cursor += 4;
    if (symbol === undefined || targetOffset === undefined || targetPos === undefined || sourceTarget === undefined) break;
    pointers.push({
      symbol,
      targetSynsetId: `${targetOffset}-${targetPos}`,
      sourceWordIndex: parseInt(sourceTarget.slice(0, 2), 16),
      targetWordIndex: parseInt(sourceTarget.slice(2, 4), 16),
    });
  }
  // Verb-only: frame_cnt frame records, each 3 tokens (`+`, frame_number,
  // word_number) -- parsed now (WordNetFrame's own docstring), not just
  // walked past to keep `cursor` correctly positioned for every other
  // part of speech (which never has this block at all).
  const frames: WordNetFrame[] = [];
  if (ssType === "v") {
    const frameCount = parseInt(fields[cursor], 10);
    cursor += 1;
    for (let i = 0; i < frameCount; i++) {
      const frameNumber = fields[cursor + 1];
      const wordIndex = fields[cursor + 2];
      cursor += 3;
      if (frameNumber === undefined || wordIndex === undefined) break;
      frames.push({ frameNumber: parseInt(frameNumber, 10), wordIndex: parseInt(wordIndex, 16) });
    }
  }

  const { definition, examples } = parseGloss(line.slice(barIndex + 3));
  return {
    synsetId: `${synsetOffset}-${ssType}`,
    partOfSpeech: posForSsType(ssType),
    lemmas,
    lemmaPositions,
    definition,
    examples,
    pointers,
    frames,
  };
}

let cache: WordNetSynset[] | null = null;

/** Fetches (dictFileLoaders' own lazy chunks) and parses every synset
 * line out of data.noun/verb/adj/adv. Cached after the first call, same
 * as WordSeeder.loadCache's own cache -- a repeat call neither re-fetches
 * nor re-parses. Async purely because dictFileLoaders' own chunks are
 * lazy `import()`s underneath (this module's own docstring) -- the
 * parse itself is synchronous, same as WordSeeder.loadCache's. */
export async function loadWordNetSynsets(): Promise<readonly WordNetSynset[]> {
  if (cache !== null) return cache;

  const texts = await Promise.all(DICT_FILENAMES.map((filename) => readDictFile(filename)));
  const synsets: WordNetSynset[] = [];
  for (const text of texts) {
    for (const line of text.split("\n")) {
      if (!SYNSET_LINE_PATTERN.test(line)) continue;
      const synset = parseSynsetLine(line);
      if (synset !== undefined) synsets.push(synset);
    }
  }
  cache = synsets;
  return synsets;
}
