/** Parses the raw Princeton WordNet 3.1 dict/ files
 * (assets/wordnet/dict/, see assets/wordnet/README.md for provenance)
 * into WordNetSynsets -- one entry per synset line, carrying its
 * member lemmas and gloss. A WordNet synset -- "a set of one or more
 * synonyms" -- is what WordSeeder.seedWordNet (word_seeder.ts) turns
 * into a group of LIRA Words joined by SYNONYM LexicalRelationships
 * (Word.synsetId's own docstring), the same shape entryToWord already
 * turns Common Vocabulary Cache JSON into, one file format earlier in
 * the pipeline.
 *
 * Only a synset line's own words and gloss are read. The WordNet data
 * file format is:
 *
 *     synset_offset  lex_filenum  ss_type  w_cnt  {word  lex_id}...
 *     p_cnt  {ptr_symbol  offset  pos  source/target}...
 *     [frame_cnt  {+  frame_number  word_number}...]  |  gloss
 *
 * The pointer and (verb-only) frame blocks between w_cnt's word list
 * and the gloss are present in the source data but intentionally
 * unparsed here -- nothing in this loader needs WordNet's other
 * relation types (hypernym `@`, meronym `%`, verb frames, ...) yet.
 * Splitting each line on its own literal " | " separator and reading
 * the data part positionally (offset, ..., ss_type, w_cnt, then w_cnt
 * (word, lex_id) pairs starting right after it) reaches the word list
 * without needing a full pointer-block parser. */

import { PartOfSpeech } from "../data/part_of_speech";

export interface WordNetSynset {
  // WordNet's own offset-pos key, e.g. "00001740-n" -- see Word.synsetId's
  // own docstring for the full format.
  synsetId: string;
  partOfSpeech: PartOfSpeech;
  // Underscores already replaced with spaces ("physical_entity" ->
  // "physical entity") and any trailing adjective syntactic-position
  // marker ("occupied(p)") stripped -- ready to use as a Word.text/
  // lexicalForm as-is.
  lemmas: readonly string[];
  definition: string;
  examples: readonly string[];
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

const POSITION_MARKER_PATTERN = /\([^()]*\)$/;

function cleanLemma(rawWord: string): string {
  return rawWord.replace(POSITION_MARKER_PATTERN, "").replace(/_/g, " ");
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
  for (let i = 0; i < wordCount; i++) {
    const rawWord = fields[4 + i * 2];
    if (rawWord === undefined) break;
    lemmas.push(cleanLemma(rawWord));
  }

  const { definition, examples } = parseGloss(line.slice(barIndex + 3));
  return { synsetId: `${synsetOffset}-${ssType}`, partOfSpeech: posForSsType(ssType), lemmas, definition, examples };
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
