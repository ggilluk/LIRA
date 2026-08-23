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
 * `lex_filenum` is read positionally and retained (resolved against the
 * bundled dict/lexnames file into WordNetSynset.senseCategory below,
 * e.g. "06" -> "noun.artifact") -- each word's own `lex_id` is still
 * read positionally (needed to walk past it to the next field) but not
 * retained; LIRA has no equivalent slot for it and nothing here needs
 * it. The (verb-only) frame block IS retained now (as
 * WordNetSynset.frames, below) -- critically never confused with the
 * pointer block's own `+` symbol (WordNet reuses `+` for two unrelated
 * things: the "derivationally related form" pointer `ptr_symbol` a
 * synset can have any number of, and the frame-record separator every
 * frame entry starts with -- ordinary token scanning for `+` can't tell
 * them apart, so `p_cnt`/`frame_cnt` themselves are what make each
 * block's own length known in advance, and are read positionally for
 * exactly that reason). */

import { AdjectivePosition } from "../data/enums/adjective_position";
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
// written rather than resolved to text here (that's
// VERB_FRAME_TEXT, data/enums/verb_framed_example_template.ts -- a Vocabulary-layer
// concern, not this module's). `wordIndex` is WordNet's own `word_number`, hex-encoded
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
  // How often this synset's own meaning was tagged in Princeton
  // WordNet's semantic concordance corpus (SemCor), summed across every
  // lemma that lexicalizes it -- parsed from the bundled dict/index.sense
  // file (loadSenseFrequencies() below), not this file's own
  // synset_offset/gloss lines (data.* itself carries no frequency data
  // at all). Sense.senseFrequency's own docstring (data/entities/sense.ts) on why
  // this is a sum across every lemma sharing the synset rather than one
  // lemma's own count alone. 0, not a special value, for a synset
  // index.sense never tags at all -- a real, common outcome, not a
  // parsing gap.
  senseFrequency: number;
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
  // own lemmas carry one at all). AdjectivePosition's own docstring
  // (data/enums/adjective_position.ts) on what each position means, and
  // Adjective's own docstring (data/entities/adjective.ts) on how this
  // was verified against the bundled dict/ files.
  lemmaPositions: readonly (AdjectivePosition | undefined)[];
  definition: string;
  examples: readonly string[];
  pointers: readonly WordNetPointer[];
  // The verb-only frame block, parsed but not yet resolved to text or
  // narrowed to one Word -- always [] for a non-VERB synset. Verb's own
  // docstring (data/entities/verb.ts) and framesForSense()'s own
  // (role/processor/verb_processor.ts) on what this data is and how it was
  // verified against the bundled dict/ files.
  frames: readonly WordNetFrame[];
  // The WordNet lexicographer-file category this synset's own
  // `lex_filenum` names, e.g. "noun.artifact" -- resolved against the
  // bundled dict/lexnames file (loadLexnames() below), never derived
  // from the gloss/first lemma/hypernym/sense number/synset offset (all
  // of those can and do disagree with the lexicographer's own explicit
  // classification). Always the full POS-qualified lexname ("noun.
  // artifact", never bare "artifact") -- that qualified form is
  // WordNet's own canonical category identifier. A property of the
  // synset's own meaning, not of any one lemma spelling it -- shared
  // identically by every member, the same way senseFrequency/definition/
  // examples already are.
  senseCategory: string;
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

// dictFileLoaders' own exact counterpart, scoped to the one
// frequency-data file separately -- index.sense isn't a data.* file
// (this module's own docstring on that format), so it needs its own
// lazy glob rather than widening dictFileLoaders' own pattern to match
// a file shaped completely differently.
const indexSenseLoader = import.meta.glob<string>("../assets/wordnet/dict/index.sense", {
  query: "?raw",
  import: "default",
});

async function readIndexSenseFile(): Promise<string> {
  const suffix = "/assets/wordnet/dict/index.sense";
  const key = Object.keys(indexSenseLoader).find((path) => path.endsWith(suffix));
  if (key === undefined) throw new Error("WordNet dict file missing: index.sense");
  return indexSenseLoader[key]();
}

// indexSenseLoader's own exact counterpart, scoped to the lexicographer
// file-category table -- also not a data.* file.
const lexnamesLoader = import.meta.glob<string>("../assets/wordnet/dict/lexnames*", {
  query: "?raw",
  import: "default",
});

async function readLexnamesFile(): Promise<string> {
  const suffix = "/assets/wordnet/dict/lexnames";
  const key = Object.keys(lexnamesLoader).find((path) => path.endsWith(suffix));
  if (key === undefined) throw new Error("WordNet dict file missing: lexnames");
  return lexnamesLoader[key]();
}

let lexnamesCache: ReadonlyMap<string, string> | null = null;

/** Every lex_filenum ("00".."44") -> its own lexname ("adj.all"..
 * "adj.ppl"), parsed once from the bundled dict/lexnames file (WordNet's
 * own distributed lexicographer-file table, `lex_filenum lexname
 * syntactic_category` per line -- `syntactic_category` itself is read
 * positionally, same as data.*'s own lex_id/lex_filenum before this
 * change, but not retained: WordNetSynset's own partOfSpeech, from
 * ss_type, already carries that information more precisely than
 * lexnames' coarser 4-way category number could). Cached the same way
 * loadSenseFrequencies()'s own cache is. */
async function loadLexnames(): Promise<ReadonlyMap<string, string>> {
  if (lexnamesCache !== null) return lexnamesCache;
  const text = await readLexnamesFile();
  const table = new Map<string, string>();
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    const [fileNumber, lexname] = trimmed.split(/\s+/);
    if (fileNumber === undefined || lexname === undefined) continue;
    table.set(fileNumber, lexname);
  }
  lexnamesCache = table;
  return table;
}

// WordNet's own sense_key encodes ss_type as a single leading digit
// (the character right after the lemma's own "%") rather than the
// letter data.* files use -- verified directly against the bundled
// dict/index.sense (e.g. "tall%3:00:00:: 02393670 1 73" is the
// ADJECTIVE "tall", whose own data.adj record at that exact offset is
// independently confirmed ss_type "a"; "tall%5:00:00:rhetorical:00" at
// a different offset is independently confirmed ss_type "s", WordNet's
// satellite-adjective variant). Mapped here so a parsed synsetId always
// matches parseSynsetLine's own `${offset}-${ssType}` format exactly.
const SENSE_KEY_SS_TYPE_DIGIT_TO_LETTER: Readonly<Record<string, string>> = { "1": "n", "2": "v", "3": "a", "4": "r", "5": "s" };

/** One dict/index.sense line, parsed -- WordNet's own
 * `sense_key synset_offset sense_number tag_cnt` format, where
 * `sense_key` is itself `lemma%ss_type:lex_filenum:lex_id:head_word:head_id`.
 * Only `ss_type` (to resolve the letter loadSenseFrequencies() needs to
 * match parseSynsetLine's own synsetId) and `tag_cnt` (the actual
 * frequency count) are read; `sense_number` is WordNet's own
 * already-computed per-lemma rank (descending tag_cnt) and `lex_filenum`/
 * `lex_id`/`head_word`/`head_id` are positional filler this module has
 * no use for, the same "walked past, not retained" treatment
 * parseSynsetLine's own docstring gives lex_filenum/lex_id there.
 * Returns undefined for a malformed line or an unrecognised ss_type
 * digit (defensive only -- every real line in the bundled file parses). */
function parseIndexSenseLine(line: string): { synsetId: string; tagCount: number } | undefined {
  const fields = line.trim().split(/\s+/);
  const [senseKey, synsetOffset, , tagCountRaw] = fields;
  if (senseKey === undefined || synsetOffset === undefined || tagCountRaw === undefined) return undefined;
  const ssTypeDigit = senseKey.split("%")[1]?.[0];
  const ssType = ssTypeDigit !== undefined ? SENSE_KEY_SS_TYPE_DIGIT_TO_LETTER[ssTypeDigit] : undefined;
  if (ssType === undefined) return undefined;
  return { synsetId: `${synsetOffset}-${ssType}`, tagCount: parseInt(tagCountRaw, 10) };
}

let senseFrequencyCache: ReadonlyMap<string, number> | null = null;

/** Every synsetId's own senseFrequency (WordNetSynset's own docstring on
 * what that means and why it's a sum) -- parsed once from dict/index.sense,
 * cached the same way loadWordNetSynsets()'s own `cache` is. Summing
 * every sense_key's own tag_cnt that shares a synsetId is what turns
 * WordNet's inherently per-lemma frequency data (index.sense's own
 * docstring on why: "bank" and "banking_concern" get separate tag_cnt
 * entries even where they lexicalize the identical synset) into one
 * meaningful synset-level number -- how often *this meaning*, regardless
 * of which synonym spelled it, was tagged in the corpus. */
async function loadSenseFrequencies(): Promise<ReadonlyMap<string, number>> {
  if (senseFrequencyCache !== null) return senseFrequencyCache;
  const text = await readIndexSenseFile();
  const totals = new Map<string, number>();
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    const parsed = parseIndexSenseLine(trimmed);
    if (parsed === undefined) continue;
    totals.set(parsed.synsetId, (totals.get(parsed.synsetId) ?? 0) + parsed.tagCount);
  }
  senseFrequencyCache = totals;
  return totals;
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

function parseSynsetLine(
  line: string,
  senseFrequencies: ReadonlyMap<string, number>,
  lexnames: ReadonlyMap<string, string>,
): WordNetSynset | undefined {
  const barIndex = line.indexOf(" | ");
  if (barIndex === -1) return undefined;
  const fields = line.slice(0, barIndex).trim().split(/\s+/);
  const [synsetOffset, lexFilenum, ssType, wordCountHex] = fields;
  const wordCount = parseInt(wordCountHex, 16);

  // Validation rule: every synset's own lex_filenum must resolve against
  // exactly one dict/lexnames entry -- an unresolved one means the
  // bundled lexnames table itself is stale/incomplete against these
  // dict/data.* files, a genuine WordNet import/data-integrity error,
  // not something to paper over by guessing a category from the gloss,
  // first lemma, hypernym, sense number, or synset offset instead.
  const senseCategory = lexnames.get(lexFilenum);
  if (senseCategory === undefined) {
    throw new Error(`WordNet synset ${synsetOffset} has lex_filenum '${lexFilenum}', which has no matching dict/lexnames entry`);
  }

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

  const synsetId = `${synsetOffset}-${ssType}`;
  const { definition, examples } = parseGloss(line.slice(barIndex + 3));
  return {
    synsetId,
    partOfSpeech: posForSsType(ssType),
    lemmas,
    lemmaPositions,
    definition,
    examples,
    pointers,
    frames,
    senseFrequency: senseFrequencies.get(synsetId) ?? 0,
    senseCategory,
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

  const [texts, senseFrequencies, lexnames] = await Promise.all([
    Promise.all(DICT_FILENAMES.map((filename) => readDictFile(filename))),
    loadSenseFrequencies(),
    loadLexnames(),
  ]);
  const synsets: WordNetSynset[] = [];
  for (const text of texts) {
    for (const line of text.split("\n")) {
      if (!SYNSET_LINE_PATTERN.test(line)) continue;
      const synset = parseSynsetLine(line, senseFrequencies, lexnames);
      if (synset !== undefined) synsets.push(synset);
    }
  }
  cache = synsets;
  return synsets;
}
