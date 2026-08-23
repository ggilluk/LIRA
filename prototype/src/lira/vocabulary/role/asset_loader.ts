/** Loads the Common Vocabulary Cache and Common Vocabulary Relationship
 * Cache JSON assets (vocabulary/assets/common/<language>/) for
 * WordSeeder and RelationshipSeeder.
 *
 * Python's WordSeeder/RelationshipSeeder read these with
 * `pathlib.Path.read_text()` against the filesystem at run time. A
 * browser has no filesystem to read from, so this loader instead uses
 * Vite's `import.meta.glob(..., { eager: true })` to bundle every
 * asset JSON file into the build at compile time -- the browser-port
 * equivalent of "the assets directory ships with the program", which
 * is already true of the Python package (the assets live inside
 * `src/lira/vocabulary/assets/`, not fetched from anywhere external).
 * Nothing here performs a network request. */

export interface WordFileEntrySourceReference {
  source_name: string;
  source_version?: string | null;
  external_identifier?: string | null;
  reference_uri?: string | null;
  licence_identifier?: string | null;
}

export interface WordFileEntry {
  entry_id: string;
  domain_tag?: string | null;
  lexical_form: string;
  normalised_form: string;
  text?: string;
  version?: string;
  language_code: string;
  script_code?: string | null;
  part_of_speech: string;
  closed_class?: boolean;
  definition?: string | null;
  gloss?: string | null;
  usage_notes?: string[];
  register_codes?: string[];
  editorial_labels?: string[];
  dialect_codes?: string[];
  pronunciations?: unknown[];
  syllable_representation?: string | null;
  syllable_count?: number | null;
  stress_pattern?: string | null;
  frequency_value?: number | null;
  frequency_scale?: string | null;
  etymology_text?: string | null;
  first_recorded_use?: string | null;
  source_references?: WordFileEntrySourceReference[];
  seeded_pleasure_displeasure_weight?: number | null;
  seeded_arousal_non_arousal_weight?: number | null;
  seeded_dominance_submissive_weight?: number | null;
  /** Noun.isRootWord -- true only for an entry in root_words.json (every
   * one of which is a NOUN). Absent (not just false) for every other
   * file, same as this schema's other rarely-set optional fields. */
  is_root_word?: boolean;
  /** Noun.interrogativeRootWord/hypernymRootWord/holonymRootWord/
   * vectorPrimitiveRootWord -- the enum member name (e.g. "WHAT"), at
   * most one of these four ever set on a given entry. Only meaningful
   * when is_root_word is true. */
  interrogative_root_word?: string | null;
  hypernym_root_word?: string | null;
  holonym_root_word?: string | null;
  vector_primitive_root_word?: string | null;
  /** Noun.isDerivableNoun -- true for a NOUN entry considered derived
   * from (or sharing its form with) a corresponding VERB sense. Optional
   * (absent means false, same as WordSeeder.entryToWord()'s own
   * `?? false`) since most files that predate this field never set it
   * either way. */
  is_derivable_noun?: boolean;
  /** Inflected forms grouped with their shared base lemma -- a prototype-
   * only schema optimisation (Python's own assets/common/en/ keeps the
   * original flat-array-plus-separate-relationship-file shape; this
   * mirrored copy intentionally diverges) so a lemma and the forms
   * derived from it read as one unit on disk instead of scattering
   * across the array, only linkable via a separate
   * relationships/morphological_relationships.json edge. Each nested
   * entry is a full, independent WordFileEntry in its own right (own
   * entry_id/definition/etc, per Word's own Qualified Word Identity) --
   * WordSeeder flattens every nested form back into its own top-level
   * Word, so this changes nothing about which Words end up seeded, only
   * how they're organised on disk and indexed at runtime (see
   * Dictionary.formsOf/lemmaOf). Only ever one level deep: a nested
   * form is never itself given further nested forms. */
  forms?: WordFileFormEntry[];
}

/** One nested inflected-form entry -- everything a top-level
 * WordFileEntry has, plus how it relates to the base lemma it's nested
 * under. `derivation_kinds` is a list, not a single value, because one
 * surface form can legitimately satisfy more than one inflectional role
 * against the same base -- most regular English verbs' past tense and
 * past participle are identical ("measured" is both PAST_TENSE_FORM and
 * PAST_PARTICIPLE_FORM of "measure"). Values match
 * relationships/morphological_relationships.json's own
 * `relationship_kind` vocabulary (LEMMA_FORM itself never appears here
 * -- it's the reciprocal edge that relationship file used instead of a
 * structural link; nesting supersedes needing it for these entries, but
 * the relationship file is left untouched -- see
 * word_seeder.ts's own module docstring). */
export interface WordFileFormEntry extends WordFileEntry {
  derivation_kinds: string[];
}

export interface WordFileDocument {
  schema_version: string;
  language_code: string;
  part_of_speech: string | null;
  closed_class_kind: string;
  count: number;
  words: WordFileEntry[];
}

export interface WordManifestFileEntry {
  file: string;
  count: number;
}

export interface WordManifestDocument {
  schema_version: string;
  asset_version: string;
  language_code: string;
  total_lexical_forms: number;
  files: WordManifestFileEntry[];
}

export interface RelationshipFileEntry {
  source_lexical_form: string;
  source_part_of_speech?: string | null;
  source_domain_tag?: string | null;
  target_lexical_form: string;
  target_part_of_speech?: string | null;
  target_domain_tag?: string | null;
  relationship_kind: string;
}

export interface RelationshipFileDocument {
  schema_version: string;
  language_code: string;
  relationship_category: string;
  count: number;
  relationships: RelationshipFileEntry[];
}

export interface RelationshipManifestDocument {
  schema_version: string;
  asset_version: string;
  language_code: string;
  relationship_count: number;
  files: WordManifestFileEntry[];
  checksum: string;
}

const wordFileModules = import.meta.glob<{ default: unknown }>("../assets/common/*/*.json", { eager: true });
const relationshipFileModules = import.meta.glob<{ default: unknown }>(
  "../assets/common/*/relationships/*.json",
  { eager: true },
);
// Raw (unparsed) text of the same relationship files, for checksum
// verification -- hashing must run over the exact bytes on disk, the
// same thing Python's `read_bytes()` hashes, not a JSON.parse/stringify
// round trip that could reformat the content before hashing it.
const relationshipFileRawModules = import.meta.glob<string>("../assets/common/*/relationships/*.json", {
  eager: true,
  query: "?raw",
  import: "default",
});

function extractByPath<T>(modules: Record<string, { default: unknown }>, languageCode: string, filename: string): T | undefined {
  const suffix = `/assets/common/${languageCode}/${filename}`;
  const key = Object.keys(modules).find((path) => path.endsWith(suffix));
  return key === undefined ? undefined : (modules[key].default as T);
}

export function readWordFile(languageCode: string, filename: string): WordFileDocument | undefined {
  return extractByPath<WordFileDocument>(wordFileModules, languageCode, filename);
}

/** Generic read for a word-directory JSON asset whose shape isn't
 * WordFileDocument -- namely manifest.json (WordManifestDocument). */
export function readWordDirJson<T>(languageCode: string, filename: string): T | undefined {
  return extractByPath<T>(wordFileModules, languageCode, filename);
}

export function wordFileExists(languageCode: string, filename: string): boolean {
  return readWordFile(languageCode, filename) !== undefined;
}

export function languageHasCommonCache(languageCode: string): boolean {
  const suffix = `/assets/common/${languageCode}/`;
  return Object.keys(wordFileModules).some((path) => path.includes(suffix));
}

export function readRelationshipFile(languageCode: string, filename: string): RelationshipFileDocument | undefined {
  const suffix = `/assets/common/${languageCode}/relationships/${filename}`;
  const key = Object.keys(relationshipFileModules).find((path) => path.endsWith(suffix));
  return key === undefined ? undefined : (relationshipFileModules[key].default as RelationshipFileDocument);
}

export function relationshipDirectoryExists(languageCode: string): boolean {
  const suffix = `/assets/common/${languageCode}/relationships/`;
  return Object.keys(relationshipFileModules).some((path) => path.includes(suffix));
}

export function readRelationshipFileRaw(languageCode: string, filename: string): string | undefined {
  const suffix = `/assets/common/${languageCode}/relationships/${filename}`;
  const key = Object.keys(relationshipFileRawModules).find((path) => path.endsWith(suffix));
  return key === undefined ? undefined : relationshipFileRawModules[key];
}

/** SHA-256 over the given files' raw text, in the given order,
 * UTF-8-encoded and concatenated -- the browser-native equivalent of
 * Python's `hashlib.sha256()` incrementally fed each file's bytes via
 * `digest.update((path).read_bytes())`. RelationshipSeeder.validateAssets()
 * uses this to reproduce relationships/manifest.json's own `checksum`
 * field. Uses the Web Crypto API (`crypto.subtle`), so this is async
 * where Python's equivalent was synchronous file I/O. */
export async function sha256Hex(texts: readonly string[]): Promise<string> {
  const encoder = new TextEncoder();
  const chunks = texts.map((text) => encoder.encode(text));
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }
  const digest = await crypto.subtle.digest("SHA-256", combined);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
