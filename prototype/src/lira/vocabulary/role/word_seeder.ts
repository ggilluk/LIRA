/** Loads the Common Vocabulary Cache (vocabulary/assets/common/<language>/)
 * and seeds Dictionaries with it. The cache is not the authoritative
 * source of a Word -- see vocabulary/assets/common/en/README.md.
 *
 * Ported from vocabulary/role/word_seeder.py. Python reads the cache
 * from the filesystem at run time and can write promoted_words.json /
 * manifest.json back to disk (promoteWord, demoteWord, and
 * validateAssets' own self-healing create-if-missing behaviour); a
 * browser has no writable filesystem, so this port's promoteWord/
 * demoteWord mutate an in-memory overlay of promoted_words.json only
 * -- the change is visible to this WordSeeder instance for the rest of
 * the session (loadCache() picks it up immediately) but is never
 * persisted, and validateAssets() here only checks consistency, it
 * never fabricates a missing file.
 *
 * Schema divergence from Python (this prototype's assets only --
 * asset_loader.ts's own WordFileEntry.forms docstring): a base lemma's
 * word file entry may nest its own inflected forms under a `forms`
 * array instead of every surface form living as an independent
 * top-level entry. `loadCache()` flattens every nested form back into
 * its own top-level Word exactly as if it had never been nested (the
 * seeded Dictionary ends up with the identical set of Words either
 * way), while also recording which base each flattened form came from
 * (`formLinks`) so `seedClosedClassWords` can wire that grouping into
 * the target Dictionary's own lemma index (Dictionary.linkForm/
 * formsOf/lemmaOf) once both ends of a link have actually been
 * inserted. */

import { PartOfSpeech } from "../data/part_of_speech";
import { RegisterCode } from "../data/register_code";
import { EditorialLabel } from "../data/editorial_label";
import { HolonymRootWord } from "../data/holonym_root_word";
import { HypernymRootWord } from "../data/hypernym_root_word";
import { InterrogativeRootWord } from "../data/interrogative_root_word";
import { VectorPrimitiveRootWord } from "../data/vector_primitive_root_word";
import type { Dictionary } from "../data/dictionary";
import { LexicalRelationshipStore } from "../data/lexical_relationship_store";
import { LexicalRelationshipType } from "../data/lexical_relationship_type";
import type { SourceReference } from "../data/source_reference";
import { copyWordWithFreshUuid, createWord, type Word } from "../data/word";
import {
  languageHasCommonCache,
  readWordDirJson,
  readWordFile,
  type WordFileDocument,
  type WordFileEntry,
  type WordManifestDocument,
} from "./asset_loader";
import type { LexicalRelationshipProcessor } from "./lexical_relationship_processor";
import { loadWordNetSynsets, type WordNetPointer, type WordNetSynset } from "./wordnet_loader";

/** One flattened nested form's link back to its base lemma, keyed by
 * entryId (the stable Qualified Word Identity, unaffected by
 * copyWithFreshUuid) rather than by Word/uuid directly, since loadCache()
 * builds this before any Dictionary-specific copy exists yet --
 * seedClosedClassWords resolves entryId -> the copy it just inserted. */
interface FormLink {
  baseEntryId: string;
  formEntryId: string;
  derivationKinds: readonly string[];
}

export const MANDATORY_FILES = [
  "determiners.json",
  "pronouns.json",
  "auxiliaries.json",
  "prepositions.json",
  "coordinating_conjunctions.json",
  "subordinating_conjunctions.json",
  "particles.json",
  "punctuation.json",
  // symbols.json and numerals.json are appended last, not
  // alphabetically or arbitrarily: numerals.json's "one" is a homograph
  // of pronouns.json's existing "one" (indefinite PRONOUN, "one should
  // always...") -- pronouns.json must load first so PRONOUN stays
  // Dictionary.lookup()'s default.
  "symbols.json",
  "numerals.json",
] as const;

// Supplementary files: authored, validated, and always loaded/seeded
// like MANDATORY_FILES, but NOT counted toward the mandatory
// closed-class total -- open-class metalinguistic terms, not
// closed-class function words. Order matters: metalinguistic_nouns.json
// must load before metalinguistic_verbs.json ("cause"/"result" homograph),
// and MANDATORY_FILES always loads before SUPPLEMENTARY_FILES in full.
//
// root_words.json loads first -- the first (NOUN) words this cache
// seeds under the new Interrogative/Hypernym/Holonym/Vector-Primitive
// root word table (data/interrogative_root_word.ts's own docstring).
// Several of its 25 entries are deliberate homographs of an existing
// NOUN sense seeded elsewhere (e.g. "operation" already exists in
// promoted_words.json) -- each root_words.json entry carries its own
// domainTag ("root_word.common") specifically so validateAssets()'s
// duplicate (lexicalForm, partOfSpeech, domainTag) check treats it as
// legitimate polysemy rather than a collision (Word.domainTag's own
// docstring). One real, accepted trade-off: Dictionary.lookup()'s
// "first entry wins" default (word_seeder.ts's own numerals.json
// comment above) means a homograph here becomes the *default* sense
// for that (text, partOfSpeech) pair -- promoted_words.json always
// loads last regardless of this list's own order (loadCache() below),
// so there is no position in SUPPLEMENTARY_FILES that avoids this for
// the handful of words root_words.json shares with promoted_words.json.
// The one caller sensitive to that default (RelationshipSeeder's
// POS-less lookup fallback, role/relationship_seeder.ts) still resolves
// to a valid same-text-same-partOfSpeech Word either way -- see the
// full test suite, exercised against this exact bundled cache, for
// confirmation nothing actually broke.
export const SUPPLEMENTARY_FILES = [
  "root_words.json",
  "metalinguistic_nouns.json",
  "metalinguistic_verbs.json",
  "metalinguistic_adjectives.json",
  "metalinguistic_adverbs.json",
  "metalinguistic_proper_nouns.json",
  "metalinguistic_interjections.json",
] as const;

export const PROMOTED_FILE = "promoted_words.json";
export const MANIFEST_FILE = "manifest.json";
const OPEN_CLASSES = [PartOfSpeech.NOUN, PartOfSpeech.VERB, PartOfSpeech.ADJECTIVE, PartOfSpeech.ADVERB];

// seedWordNet's own constants -- see that method's docstring.
const WORDNET_SOURCE_REFERENCE: SourceReference = {
  sourceName: { value: "Princeton WordNet 3.1" },
  sourceVersion: { value: "3.1" },
  referenceUri: { value: "https://wordnet.princeton.edu/" },
  licenceIdentifier: { value: "Princeton WordNet License" },
};
const WORDNET_SYNSET_ID_SCHEME = {
  schemeId: "wn31",
  schemeAgencyName: "Princeton University",
  schemeUri: "https://wordnet.princeton.edu/",
} as const;
// Every SYNONYM edge seedWordNet creates comes straight from WordNet
// synset membership, a curated linguistic fact, not an inference with
// genuine uncertainty attached -- same as-good-as-certain weight
// RelationshipSeeder uses for its own curated relationships
// (relationship_seeder.ts's own SEEDER_DEFAULT_WEIGHT). 0.9999 rather
// than a literal 1.0: certainty is never asserted as exactly 1.0.
const WORDNET_SEEDER_DEFAULT_WEIGHT = 0.9999;
// How often seedWordNet's own onProgress fires, in synsets processed --
// about 59 calls across the full ~117,800-synset dataset. Frequent
// enough for a progress bar to read as continuously moving, far below
// the per-postMessage-call overhead becoming visible against the
// per-synset work it's reporting on.
const PROGRESS_REPORT_INTERVAL = 2000;

/** `+`/`<`'s own shared rule: which Derivation-category kind
 * (lexical_relationship_type.ts) a cross-word derivation pointer becomes,
 * chosen by the *target* word's own part of speech -- WordNet's pointer
 * data names two related words without saying which specific
 * derivational relationship holds between them (no "agent noun" vs
 * "action noun" flag the way root_words.json's own curated entries can
 * carry), so this is a coarser, POS-driven rule rather than a lookup
 * against WordNet's own richer semantics: NOMINALISATION for a NOUN
 * target, ADJECTIVAL_DERIVATION for ADJECTIVE, ADVERBIAL_DERIVATION for
 * ADVERB, DERIVED_FORM (the generic catch-all) for anything else,
 * including a same-part-of-speech pair (WordNet's `+` occasionally
 * links two senses of the same word rather than crossing categories). */
function derivationKind(sourcePos: PartOfSpeech, targetPos: PartOfSpeech): LexicalRelationshipType {
  if (targetPos === sourcePos) return LexicalRelationshipType.DERIVED_FORM;
  switch (targetPos) {
    case PartOfSpeech.NOUN:
      return LexicalRelationshipType.NOMINALISATION;
    case PartOfSpeech.ADJECTIVE:
      return LexicalRelationshipType.ADJECTIVAL_DERIVATION;
    case PartOfSpeech.ADVERB:
      return LexicalRelationshipType.ADVERBIAL_DERIVATION;
    default:
      return LexicalRelationshipType.DERIVED_FORM;
  }
}

/** Maps one WordNet pointer symbol (WordNetPointer.symbol, wordnet_loader.ts)
 * onto the LexicalRelationshipType it becomes, given the pointer's own
 * source and target synsets' parts of speech -- `undefined` for a
 * symbol this class doesn't recognise (none as of WordNet 3.1's own
 * documented pointer set, but seedWordNetPointerRelationships skips
 * rather than throws, so a future WordNet release adding a new symbol
 * degrades to "not seeded" instead of failing the whole run).
 *
 * `swap: true` means the edge WordNet's own record implies runs target
 * -> source, not source -> target -- true only for `-c`/`-r`/`-u`
 * ("member of this domain"), the reciprocal listing of `;c`/`;r`/`;u`
 * ("domain of synset") recorded on the *other* synset's own entry;
 * both symbols become the same TOPIC_DOMAIN/REGION_DOMAIN/USAGE_DOMAIN
 * kind, always oriented word -> its domain, regardless of which of the
 * pair's two entries the pointer was actually read from. */
function relationshipKindForPointer(
  symbol: string,
  sourcePos: PartOfSpeech,
  targetPos: PartOfSpeech,
): { kind: LexicalRelationshipType; swap: boolean } | undefined {
  switch (symbol) {
    case "!":
      return { kind: LexicalRelationshipType.ANTONYM, swap: false };
    case "@":
      return { kind: LexicalRelationshipType.HYPERNYM, swap: false };
    case "@i":
      return { kind: LexicalRelationshipType.INSTANCE_HYPERNYM, swap: false };
    case "~":
      // Troponymy is WordNet's own name for verb-specific hyponymy --
      // this class's own module docstring (lexical_relationship_type.ts)
      // already draws that line for LIRA's curated data; WordNet marks
      // both with the identical `~` symbol; sourcePos is what tells
      // them apart here.
      return { kind: sourcePos === PartOfSpeech.VERB ? LexicalRelationshipType.TROPONYM : LexicalRelationshipType.HYPONYM, swap: false };
    case "~i":
      return { kind: LexicalRelationshipType.INSTANCE_HYPONYM, swap: false };
    case "%p":
      return { kind: LexicalRelationshipType.PART_MERONYM, swap: false };
    case "%m":
      return { kind: LexicalRelationshipType.MEMBER_MERONYM, swap: false };
    case "%s":
      return { kind: LexicalRelationshipType.SUBSTANCE_MERONYM, swap: false };
    case "#p":
      return { kind: LexicalRelationshipType.PART_HOLONYM, swap: false };
    case "#m":
      return { kind: LexicalRelationshipType.MEMBER_HOLONYM, swap: false };
    case "#s":
      return { kind: LexicalRelationshipType.SUBSTANCE_HOLONYM, swap: false };
    case "*":
      return { kind: LexicalRelationshipType.ENTAILMENT, swap: false };
    case ">":
      return { kind: LexicalRelationshipType.CAUSE, swap: false };
    case "^":
      return { kind: LexicalRelationshipType.ALSO_SEE, swap: false };
    case "$":
      return { kind: LexicalRelationshipType.VERB_GROUP, swap: false };
    case "&":
      return { kind: LexicalRelationshipType.SIMILAR_TO, swap: false };
    case "=":
      return { kind: LexicalRelationshipType.ATTRIBUTE, swap: false };
    case "\\":
      return { kind: LexicalRelationshipType.PERTAINYM, swap: false };
    case "+":
    case "<":
      return { kind: derivationKind(sourcePos, targetPos), swap: false };
    case ";c":
      return { kind: LexicalRelationshipType.TOPIC_DOMAIN, swap: false };
    case ";r":
      return { kind: LexicalRelationshipType.REGION_DOMAIN, swap: false };
    case ";u":
      return { kind: LexicalRelationshipType.USAGE_DOMAIN, swap: false };
    case "-c":
      return { kind: LexicalRelationshipType.TOPIC_DOMAIN, swap: true };
    case "-r":
      return { kind: LexicalRelationshipType.REGION_DOMAIN, swap: true };
    case "-u":
      return { kind: LexicalRelationshipType.USAGE_DOMAIN, swap: true };
    default:
      return undefined;
  }
}

/** Every unordered pair from `items`, each returned exactly once
 * (i < j, never (a, a) or both (a, b) and (b, a)) -- seedWordNet's own
 * SYNONYM-wiring pass (pass 1) uses this for a synset's own members;
 * synonyms() itself (word.ts) already reads SYNONYM as direction="both",
 * so one directed edge per pair is enough to make the relationship
 * discoverable from either endpoint. */
function allPairs<T>(items: readonly T[]): Array<readonly [T, T]> {
  const pairs: Array<readonly [T, T]> = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) pairs.push([items[i], items[j]]);
  }
  return pairs;
}

/** The single Word at WordNetPointer's own 1-based `sourceWordIndex`/
 * `targetWordIndex` within `members` (that synset's own words, in the
 * same order as WordNetSynset.lemmas) -- empty, not a thrown error, if
 * the index is out of range (defensive only; every real WordNet 3.1
 * lexical pointer names a word position that exists in the synset it
 * names). Wrapped in an array, not returned bare, so
 * seedPointerRelationship's own sourceWords/targetWords stay uniform
 * whether a pointer was synset-level (the whole `members` array) or
 * lexical (this one-or-zero-element result). */
function indexedWord(members: readonly Word[], oneBasedIndex: number): readonly Word[] {
  const word = members[oneBasedIndex - 1];
  return word === undefined ? [] : [word];
}

interface PromotedDocEntry extends WordFileEntry {
  reference_count?: number;
}

interface PromotedDoc {
  schema_version: string;
  language_code: string;
  part_of_speech: string | null;
  closed_class_kind: string;
  count: number;
  words: PromotedDocEntry[];
}

export class WordSeeder {
  private cache: Word[] | null = null;
  private cacheFormLinks: FormLink[] = [];
  private promotedOverlay: PromotedDoc | null = null;

  constructor(
    private readonly languageCode: string = "en",
    private readonly promotionThreshold: number = 3,
    private readonly demotionThreshold: number = 1,
  ) {}

  /** Validates JSON schema, duplicate (lexicalForm, partOfSpeech,
   * domainTag) triples, lexical counts, mandatory file existence,
   * manifest consistency, and that every registerCodes/editorialLabels/
   * partOfSpeech value names a real enum member. Unlike Python's
   * version, never creates promoted_words.json or manifest.json when
   * missing (no filesystem to write to) -- both are required to
   * already be present in the bundled assets. */
  validateAssets(): void {
    if (!languageHasCommonCache(this.languageCode)) {
      throw new Error(`no Common Vocabulary Cache for language '${this.languageCode}'`);
    }

    const seenLexicalFormPos = new Set<string>();
    const seenEntryIds = new Set<string>();
    const fileCounts = new Map<string, number>();
    let computedTotal = 0;

    for (const filename of MANDATORY_FILES) {
      const count = this.validateWordFile(filename, seenLexicalFormPos, seenEntryIds, true);
      fileCounts.set(filename, count);
      computedTotal += count;
    }

    for (const filename of SUPPLEMENTARY_FILES) {
      fileCounts.set(filename, this.validateWordFile(filename, seenLexicalFormPos, seenEntryIds, true));
    }

    const promotedDoc = this.loadPromotedDoc();
    for (const entry of promotedDoc.words) {
      const key = `${entry.lexical_form} ${entry.part_of_speech} ${entry.domain_tag ?? ""}`;
      if (seenLexicalFormPos.has(key)) {
        throw new Error(
          `promoted word '${entry.lexical_form}' (${entry.part_of_speech}) duplicates an existing (lexical_form, part_of_speech, domain_tag) triple`,
        );
      }
      if (!entry.entry_id) throw new Error(`${PROMOTED_FILE}: '${entry.lexical_form}' is missing entry_id`);
      if (seenEntryIds.has(entry.entry_id)) {
        throw new Error(`${PROMOTED_FILE}: '${entry.lexical_form}' has entry_id '${entry.entry_id}', which duplicates an earlier entry`);
      }
      this.validateEntryEnums(PROMOTED_FILE, entry);
      seenLexicalFormPos.add(key);
      seenEntryIds.add(entry.entry_id);
      for (const form of entry.forms ?? []) {
        this.validateOneEntry(PROMOTED_FILE, form, seenLexicalFormPos, seenEntryIds);
        if (!form.derivation_kinds || form.derivation_kinds.length === 0) {
          throw new Error(`${PROMOTED_FILE}: '${form.lexical_form}', nested under '${entry.lexical_form}', is missing derivation_kinds`);
        }
      }
    }
    fileCounts.set(PROMOTED_FILE, promotedDoc.count ?? 0);

    const manifest = readWordDirJson<WordManifestDocument>(this.languageCode, MANIFEST_FILE);
    if (manifest === undefined) {
      throw new Error(`mandatory Common Vocabulary Cache file missing: ${MANIFEST_FILE}`);
    }
    if (manifest.total_lexical_forms !== computedTotal) {
      throw new Error(
        `manifest.json total_lexical_forms (${manifest.total_lexical_forms}) does not match the computed total (${computedTotal})`,
      );
    }
  }

  /** `doc.count` means "total lexical forms this file seeds", including
   * ones nested under a base lemma's own `forms` array -- unchanged
   * meaning from before nesting existed, just no longer equal to
   * `doc.words.length` on its own now that some entries live one level
   * deeper. Every entry gets the same validation regardless of nesting
   * depth (duplicate/entry_id/enum checks share `seenLexicalFormPos`/
   * `seenEntryIds` across top-level and nested entries alike, so a
   * duplicate is caught even if one copy is nested and the other
   * isn't), and a nested form additionally requires a non-empty
   * `derivation_kinds`. Nesting is only ever one level deep by
   * construction (see asset_loader.ts's own WordFileEntry.forms
   * docstring), so a nested form's own `forms` field is never read. */
  private validateWordFile(
    filename: string,
    seenLexicalFormPos: Set<string>,
    seenEntryIds: Set<string>,
    required: boolean,
  ): number {
    const doc = readWordFile(this.languageCode, filename);
    if (doc === undefined) {
      if (required) throw new Error(`mandatory Common Vocabulary Cache file missing: ${filename}`);
      return 0;
    }
    const totalEntries = doc.words.reduce((sum, entry) => sum + 1 + (entry.forms?.length ?? 0), 0);
    if (doc.count !== totalEntries) {
      throw new Error(`${filename}: count ${doc.count} does not match ${totalEntries} word entries (including nested forms)`);
    }
    for (const entry of doc.words) {
      this.validateOneEntry(filename, entry, seenLexicalFormPos, seenEntryIds);
      for (const form of entry.forms ?? []) {
        this.validateOneEntry(filename, form, seenLexicalFormPos, seenEntryIds);
        if (!form.derivation_kinds || form.derivation_kinds.length === 0) {
          throw new Error(`${filename}: '${form.lexical_form}', nested under '${entry.lexical_form}', is missing derivation_kinds`);
        }
      }
    }
    return doc.count;
  }

  /** Shared per-entry validation, walked for both a top-level entry and
   * each of its nested `forms`. */
  private validateOneEntry(
    filename: string,
    entry: WordFileEntry,
    seenLexicalFormPos: Set<string>,
    seenEntryIds: Set<string>,
  ): void {
    if (entry.language_code !== this.languageCode) {
      throw new Error(`${filename}: '${entry.lexical_form}' has language_code '${entry.language_code}', expected '${this.languageCode}'`);
    }
    if ((entry.normalised_form ?? undefined) !== entry.lexical_form.toLowerCase()) {
      throw new Error(`${filename}: '${entry.lexical_form}' has an inconsistent normalised_form`);
    }
    const key = `${entry.lexical_form} ${entry.part_of_speech} ${entry.domain_tag ?? ""}`;
    if (seenLexicalFormPos.has(key)) {
      throw new Error(`${filename}: duplicate lexical_form '${entry.lexical_form}' with part_of_speech '${entry.part_of_speech}' in the mandatory cache`);
    }
    if (!entry.entry_id) throw new Error(`${filename}: '${entry.lexical_form}' is missing entry_id`);
    if (seenEntryIds.has(entry.entry_id)) {
      throw new Error(`${filename}: '${entry.lexical_form}' has entry_id '${entry.entry_id}', which duplicates an earlier entry`);
    }
    this.validateEntryEnums(filename, entry);
    seenLexicalFormPos.add(key);
    seenEntryIds.add(entry.entry_id);
  }

  private validateEntryEnums(filename: string, entry: WordFileEntry): void {
    if (entry.part_of_speech !== undefined && !(entry.part_of_speech in PartOfSpeech)) {
      throw new Error(`${filename}: '${entry.lexical_form}' has unknown part_of_speech '${entry.part_of_speech}'`);
    }
    for (const code of entry.register_codes ?? []) {
      if (!(code in RegisterCode)) throw new Error(`${filename}: '${entry.lexical_form}' has unknown register_code '${code}'`);
    }
    for (const label of entry.editorial_labels ?? []) {
      if (!(label in EditorialLabel)) throw new Error(`${filename}: '${entry.lexical_form}' has unknown editorial_label '${label}'`);
    }
    if (entry.interrogative_root_word && !(entry.interrogative_root_word in InterrogativeRootWord)) {
      throw new Error(`${filename}: '${entry.lexical_form}' has unknown interrogative_root_word '${entry.interrogative_root_word}'`);
    }
    if (entry.hypernym_root_word && !(entry.hypernym_root_word in HypernymRootWord)) {
      throw new Error(`${filename}: '${entry.lexical_form}' has unknown hypernym_root_word '${entry.hypernym_root_word}'`);
    }
    if (entry.holonym_root_word && !(entry.holonym_root_word in HolonymRootWord)) {
      throw new Error(`${filename}: '${entry.lexical_form}' has unknown holonym_root_word '${entry.holonym_root_word}'`);
    }
    if (entry.vector_primitive_root_word && !(entry.vector_primitive_root_word in VectorPrimitiveRootWord)) {
      throw new Error(`${filename}: '${entry.lexical_form}' has unknown vector_primitive_root_word '${entry.vector_primitive_root_word}'`);
    }
    const syllableCount = entry.syllable_count;
    if (syllableCount !== undefined && syllableCount !== null && (!Number.isInteger(syllableCount) || syllableCount < 1)) {
      throw new Error(`${filename}: '${entry.lexical_form}' has an invalid syllable_count ${JSON.stringify(syllableCount)}`);
    }
  }

  private loadPromotedDoc(): PromotedDoc {
    if (this.promotedOverlay !== null) return this.promotedOverlay;
    const bundled = readWordDirJson<PromotedDoc>(this.languageCode, PROMOTED_FILE);
    this.promotedOverlay = bundled ?? this.emptyPromotedDoc();
    return this.promotedOverlay;
  }

  private emptyPromotedDoc(): PromotedDoc {
    return {
      schema_version: "2.0.0",
      language_code: this.languageCode,
      part_of_speech: null,
      closed_class_kind: "promoted_open_class",
      count: 0,
      words: [],
    };
  }

  /** Validates the assets, then parses every mandatory closed-class
   * file, every supplementary file, and the promoted-words overlay
   * into Word instances (isCommon=true on all of them) -- flattening
   * every nested `forms` entry into its own top-level Word right
   * alongside its base lemma's, so the returned list is identical to
   * what it would be if nesting didn't exist, while also recording each
   * flattening as a FormLink (`cacheFormLinks`) for seedClosedClassWords
   * to wire into a target Dictionary's lemma index. Cached after the
   * first call -- cacheFormLinks is populated in lockstep with `cache`
   * and never diverges from it. */
  loadCache(): readonly Word[] {
    if (this.cache !== null) return this.cache.slice();

    this.validateAssets();
    const words: Word[] = [];
    const links: FormLink[] = [];
    const pushEntry = (entry: WordFileEntry): void => {
      words.push(this.entryToWord(entry));
      for (const form of entry.forms ?? []) {
        words.push(this.entryToWord(form));
        links.push({ baseEntryId: entry.entry_id, formEntryId: form.entry_id, derivationKinds: form.derivation_kinds });
      }
    };
    for (const filename of [...MANDATORY_FILES, ...SUPPLEMENTARY_FILES]) {
      const doc = readWordFile(this.languageCode, filename) as WordFileDocument;
      for (const entry of doc.words) pushEntry(entry);
    }
    for (const entry of this.loadPromotedDoc().words) pushEntry(entry);
    this.cache = words;
    this.cacheFormLinks = links;
    return words.slice();
  }

  /** Appends a fresh copy of every cached Word into `dictionary` that
   * isn't already present -- matched by text, partOfSpeech, AND
   * domainTag, not text and partOfSpeech alone (see
   * vocabulary/role/word_seeder.py's own docstring for the full
   * homograph/polyseme rationale). Returns the number actually
   * appended -- idempotent, safe to call more than once against the
   * same Dictionary.
   *
   * Also wires `dictionary`'s own lemma index (Dictionary.linkForm):
   * once every word has been copied in, replays `cacheFormLinks`
   * against the entryId -> copy map this call just built, linking base
   * and form only when *both* were freshly inserted this call -- a
   * link whose base or form was already present (skipped above,
   * belongs to an earlier seeding call) is left for that earlier call's
   * own linking to have covered, rather than guessed at here. */
  seedClosedClassWords(dictionary: Dictionary): number {
    let seeded = 0;
    const insertedByEntryId = new Map<string, Word>();
    for (const word of this.loadCache()) {
      const wordDomainTag = word.domainTag?.value;
      const alreadyPresent = dictionary
        .lookupAll(word.text)
        .some((existing) => existing.partOfSpeech === word.partOfSpeech && existing.domainTag?.value === wordDomainTag);
      if (alreadyPresent) continue;
      const copy = copyWordWithFreshUuid(word);
      dictionary.append(copy);
      insertedByEntryId.set(word.entryId.value, copy);
      seeded += 1;
    }
    for (const link of this.cacheFormLinks) {
      const base = insertedByEntryId.get(link.baseEntryId);
      const form = insertedByEntryId.get(link.formEntryId);
      if (base && form) dictionary.linkForm(base, form, link.derivationKinds);
    }
    return seeded;
  }

  seedDomain(domain: { vocabulary: { dictionary: Dictionary } }): number {
    return this.seedClosedClassWords(domain.vocabulary.dictionary);
  }

  /** Seeds `domain` from the bundled Princeton WordNet 3.1 dict/ files
   * (assets/wordnet/, loaded via wordnet_loader.ts) rather than the
   * Common Vocabulary Cache -- a separate, independent source, so
   * unlike seedClosedClassWords this is never implied by seedDomain and
   * must be called on its own. Two passes over the same synset list:
   *
   * Pass 1 (`onProgress("words", ...)`) -- A WordNet synset IS a LIRA
   * Domain+Word (Word.synsetId's own docstring): both name one sense,
   * not one spelling. So each synset's member lemmas become one Word
   * apiece (isCommon=true, synsetId set to this synset's own --
   * synsetMemberToWord's own docstring on why that, not domainTag, is
   * what disambiguates true WordNet polysemy: the same lemma in more
   * than one synset lands as distinct Words, but reads as plain
   * "Common" in the UI rather than each getting its own synthetic
   * one-off domain), and every pairwise combination of a synset's
   * members is wired together with a SYNONYM LexicalRelationship -- the
   * direct encoding of "wordnet uses synsets, LIRA uses synonym
   * relationships": querying synonyms() on any one member (word.ts,
   * direction="both") already recovers the synset's full membership
   * from either endpoint without this needing to store the group itself
   * anywhere.
   *
   * Pass 2 (`onProgress("relationships", ...)`) -- every *other*
   * relation WordNet expresses between two synsets (or two specific
   * words within them), via each synset's own `pointers`
   * (wordnet_loader.ts's own WordNetPointer) -- hypernym, meronym,
   * antonym, and the rest relationshipKindForPointer above maps a
   * pointer symbol onto. Requires every synset's Words to already exist
   * (a pointer can name a synset processed later in file order, or in a
   * different POS file entirely -- `+`/`\` regularly cross from one
   * part of speech to another), which is exactly why this is its own
   * pass after pass 1 finishes rather than interleaved with it.
   *
   * Idempotent like seedClosedClassWords, across both passes: a lemma
   * already present under the same partOfSpeech and synsetId is reused
   * rather than duplicated, and an already-created (source, target,
   * kind) edge is never recreated, so calling this more than once
   * against the same Domain is safe.
   *
   * Async, unlike seedClosedClassWords -- loadWordNetSynsets() fetches
   * its dict/ text via a lazy `import()` (wordnet_loader.ts's own
   * docstring on why it isn't bundled eagerly like the Common
   * Vocabulary Cache), so nothing here can resolve synchronously.
   *
   * `onProgress`, if given, is called every PROGRESS_REPORT_INTERVAL
   * synsets within each pass (and once more at the end of that pass)
   * with (phase, processed, total) -- vocabulary_worker.ts's own call
   * site relays each call across the Worker boundary as a status
   * message so a caller-side progress bar can track a run against the
   * full ~117,800-synset dataset (each pass a few seconds of CPU-bound
   * work, worker.ts's docstring), instead of only seeing "running" for
   * that whole span with no sense of how far along it is. The `await`
   * after each call isn't there for the callback's own sake (it may
   * well be synchronous) -- it yields this loop back to the event loop
   * for a tick, so a message posted from inside `onProgress` actually
   * gets a chance to leave the Worker before the next few thousand
   * synsets' worth of synchronous work runs. */
  async seedWordNet(
    domain: {
      vocabulary: {
        dictionary: Dictionary;
        lexicalRelationships: LexicalRelationshipStore;
        lexicalRelationshipProcessor: LexicalRelationshipProcessor;
      };
    },
    onProgress?: (phase: "words" | "relationships", processed: number, total: number) => void,
  ): Promise<{ wordsSeeded: number; relationshipsSeeded: number }> {
    const dictionary = domain.vocabulary.dictionary;
    const store = domain.vocabulary.lexicalRelationships;
    const processor = domain.vocabulary.lexicalRelationshipProcessor;

    // LexicalRelationshipStore.outgoing() is indexed (O(1) amortized,
    // lexical_relationship_store.ts's own docstring) rather than a raw
    // linear scan, but it still allocates a fresh array copy on every
    // call -- real overhead multiplied across the hundreds of thousands
    // of candidate pairs a full WordNet seed (both passes) checks.
    // Scanning the store once up front into a Set instead avoids that
    // repeated Map lookup and allocation entirely, the same reasoning
    // Dictionary's byText/byUuid maps already apply to
    // lookup()/lookupAll() (dictionary.ts's own module docstring).
    // Keyed by kind as well as the pair, unlike an earlier version of
    // this method that tracked SYNONYM pairs alone -- pass 2 can create
    // more than one kind of edge between the same two Words (e.g. both
    // a `+` NOMINALISATION and an unrelated `^` ALSO_SEE), and each is
    // a distinct fact that must independently survive a re-seed.
    const existingEdges = new Set<string>();
    for (const relationship of store.all()) {
      existingEdges.add(`${relationship.sourceWordId.value}|${relationship.targetWordId.value}|${relationship.relationshipType}`);
    }

    let wordsSeeded = 0;
    let relationshipsSeeded = 0;

    const synsets = await loadWordNetSynsets();
    const synsetMembersById = new Map<string, Word[]>();

    let processed = 0;
    for (const synset of synsets) {
      const members: Word[] = [];
      for (const lemma of synset.lemmas) {
        if (lemma.length === 0) continue;
        const existing = dictionary
          .lookupAll(lemma)
          .find((word) => word.partOfSpeech === synset.partOfSpeech && word.synsetId?.value === synset.synsetId);
        if (existing !== undefined) {
          members.push(existing);
          continue;
        }
        const word = this.synsetMemberToWord(synset, lemma);
        dictionary.append(word);
        members.push(word);
        wordsSeeded += 1;
      }
      synsetMembersById.set(synset.synsetId, members);

      relationshipsSeeded += this.createEdges(processor, existingEdges, LexicalRelationshipType.SYNONYM, allPairs(members));

      processed += 1;
      if (onProgress && (processed % PROGRESS_REPORT_INTERVAL === 0 || processed === synsets.length)) {
        onProgress("words", processed, synsets.length);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    processed = 0;
    for (const synset of synsets) {
      const sourceMembers = synsetMembersById.get(synset.synsetId);
      if (sourceMembers !== undefined) {
        for (const pointer of synset.pointers) {
          relationshipsSeeded += this.seedPointerRelationship(processor, existingEdges, synset, sourceMembers, pointer, synsetMembersById);
        }
      }

      processed += 1;
      if (onProgress && (processed % PROGRESS_REPORT_INTERVAL === 0 || processed === synsets.length)) {
        onProgress("relationships", processed, synsets.length);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    return { wordsSeeded, relationshipsSeeded };
  }

  /** One WordNetPointer, resolved and (if not already present) created
   * as a LexicalRelationship. Returns how many edges it actually added
   * (0 if the symbol is unrecognised, the target synset was never
   * seeded, an index pointed past the end of a synset's own member
   * list, every resulting pair was a self-edge, or every edge already
   * existed). A single pointer record can still produce more than one
   * edge: a synset-level pointer (sourceWordIndex/targetWordIndex both
   * 0, "the whole synset") pairs every member of the source synset with
   * every member of the target synset -- correct, not lossy, only
   * because every member of a synset is already a mutual synonym of
   * every other (pass 1's own SYNONYM edges), so connecting all-to-all
   * carries the identical meaning connecting one representative pair
   * would, just made explicit for each member instead of left implicit. */
  private seedPointerRelationship(
    processor: LexicalRelationshipProcessor,
    existingEdges: Set<string>,
    synset: WordNetSynset,
    sourceMembers: readonly Word[],
    pointer: WordNetPointer,
    synsetMembersById: ReadonlyMap<string, Word[]>,
  ): number {
    const targetMembers = synsetMembersById.get(pointer.targetSynsetId);
    if (targetMembers === undefined || targetMembers.length === 0) return 0;

    const resolved = relationshipKindForPointer(pointer.symbol, synset.partOfSpeech, targetMembers[0].partOfSpeech);
    if (resolved === undefined) return 0;

    const sourceWords = pointer.sourceWordIndex === 0 ? sourceMembers : indexedWord(sourceMembers, pointer.sourceWordIndex);
    const targetWords = pointer.targetWordIndex === 0 ? targetMembers : indexedWord(targetMembers, pointer.targetWordIndex);

    const pairs: Array<readonly [Word, Word]> = [];
    for (const sw of sourceWords) {
      for (const tw of targetWords) {
        if (sw.uuid.value === tw.uuid.value) continue;
        pairs.push(resolved.swap ? [tw, sw] : [sw, tw]);
      }
    }
    return this.createEdges(processor, existingEdges, resolved.kind, pairs);
  }

  /** Creates a LexicalRelationship for every (source, target) pair not
   * already in `existingEdges`, adding each newly-created one to that
   * same Set so a later call in the same seedWordNet run (or a later
   * seedWordNet run entirely) sees it as already present -- the shared
   * idempotency mechanism both seedWordNet passes funnel through.
   * Returns the number of edges actually created. */
  private createEdges(
    processor: LexicalRelationshipProcessor,
    existingEdges: Set<string>,
    kind: LexicalRelationshipType,
    pairs: Iterable<readonly [Word, Word]>,
  ): number {
    let created = 0;
    for (const [source, target] of pairs) {
      const key = `${source.uuid.value}|${target.uuid.value}|${kind}`;
      if (existingEdges.has(key)) continue;
      processor.create({
        sourceWordId: source.uuid.value,
        targetWordId: target.uuid.value,
        relationshipType: kind,
        sourceReferences: [WORDNET_SOURCE_REFERENCE],
        confidence: WORDNET_SEEDER_DEFAULT_WEIGHT,
        provenance: WORDNET_SEEDER_DEFAULT_WEIGHT,
        temporal: WORDNET_SEEDER_DEFAULT_WEIGHT,
        activation: WORDNET_SEEDER_DEFAULT_WEIGHT,
      });
      existingEdges.add(key);
      created += 1;
    }
    return created;
  }

  // domainTag deliberately left unset -- unlike root_words.json's true
  // dictionary polysemy (Word.domainTag's own docstring), a WordNet
  // synset isn't a curated, human-meaningful subdomain name; it's an
  // opaque per-sense identifier, and DictionaryView.domainLabel() shows
  // domainTag verbatim as this Word's "Domain" wherever it's set. Giving
  // each of WordNet's ~117,800 synsets its own domainTag would turn the
  // Domain column/filter into ~117,800 one-off values instead of the
  // plain "Common" every other Common Vocabulary Cache word gets --
  // synsetId (Word.synsetId's own docstring) already carries the
  // synset-level identity this class needs for its own dedup, without
  // repurposing domainTag to also carry it.
  private synsetMemberToWord(synset: WordNetSynset, lemma: string): Word {
    return createWord({
      text: lemma,
      partOfSpeech: synset.partOfSpeech,
      languageCode: { value: this.languageCode },
      definition: synset.definition ? { value: synset.definition } : undefined,
      usageNotes: synset.examples.map((example) => ({ value: example })),
      synsetId: { value: synset.synsetId, ...WORDNET_SYNSET_ID_SCHEME },
      isCommon: true,
      sourceReferences: [WORDNET_SOURCE_REFERENCE],
    });
  }

  /** Adds `word` to the in-memory promoted-words overlay if it belongs
   * to an open lexical class and its cross-domain reference count
   * exceeds promotionThreshold. Returns whether it was added.
   * `referenceCount` is supplied by the caller -- this class has no
   * visibility into how many Domains reference a Word. Unlike Python's
   * version, this never writes promoted_words.json to disk -- the
   * effect lasts only for this WordSeeder instance's remaining
   * lifetime (see this module's own docstring). */
  promoteWord(word: Word, referenceCount: number): boolean {
    if (!OPEN_CLASSES.includes(word.partOfSpeech)) return false;
    if (referenceCount <= this.promotionThreshold) return false;

    const doc = this.loadPromotedDoc();
    const domainTag = word.domainTag?.value ?? null;
    const alreadyPromoted = doc.words.some(
      (entry) => entry.lexical_form === word.lexicalForm?.value && entry.part_of_speech === PartOfSpeech[word.partOfSpeech]
        && (entry.domain_tag ?? null) === domainTag,
    );
    if (alreadyPromoted) return false;

    const entry: PromotedDocEntry = { ...this.wordToEntry(word), closed_class: false, reference_count: referenceCount };
    doc.words.push(entry);
    doc.count = doc.words.length;
    this.cache = null;
    return true;
  }

  /** Removes `word` from the in-memory promoted-words overlay if
   * referenceCount has fallen below demotionThreshold. Never deletes
   * the authoritative Word or touches its owning Domain -- only this
   * generated overlay entry, and (unlike Python) never persisted. */
  demoteWord(word: Word, referenceCount: number): boolean {
    if (referenceCount >= this.demotionThreshold) return false;
    const doc = this.loadPromotedDoc();
    const before = doc.words.length;
    doc.words = doc.words.filter((entry) => entry.lexical_form !== word.lexicalForm?.value);
    if (doc.words.length === before) return false;
    doc.count = doc.words.length;
    this.cache = null;
    return true;
  }

  private entryToWord(entry: WordFileEntry): Word {
    const optText = (value: string | null | undefined) => (value ? { value } : undefined);
    const optCode = (value: string | null | undefined) => (value ? { value } : undefined);
    const optNumber = (value: number | null | undefined) => (value === null || value === undefined ? undefined : { value });

    const sourceReferences = (entry.source_references ?? []).map((ref) => ({
      sourceName: { value: ref.source_name },
      sourceVersion: optText(ref.source_version),
      externalIdentifier: ref.external_identifier ? { value: ref.external_identifier } : undefined,
      referenceUri: ref.reference_uri ? { value: ref.reference_uri } : undefined,
      licenceIdentifier: ref.licence_identifier ? { value: ref.licence_identifier } : undefined,
    }));

    return createWord({
      text: entry.text ?? entry.lexical_form,
      entryId: { value: entry.entry_id },
      partOfSpeech: PartOfSpeech[entry.part_of_speech as keyof typeof PartOfSpeech],
      version: optText(entry.version) ?? { value: "1.0" },
      languageCode: { value: entry.language_code },
      lexicalForm: { value: entry.lexical_form },
      normalisedForm: { value: entry.normalised_form },
      scriptCode: optCode(entry.script_code),
      gloss: optText(entry.gloss),
      definition: optText(entry.definition),
      usageNotes: (entry.usage_notes ?? []).map((note) => ({ value: note })),
      registerCodes: (entry.register_codes ?? []).map((code) => RegisterCode[code as keyof typeof RegisterCode]),
      dialectCodes: (entry.dialect_codes ?? []).map((code) => ({ value: code })),
      editorialLabels: (entry.editorial_labels ?? []).map((label) => EditorialLabel[label as keyof typeof EditorialLabel]),
      syllableRepresentation: optText(entry.syllable_representation),
      syllableCount: optNumber(entry.syllable_count),
      stressPattern: optText(entry.stress_pattern),
      frequencyValue: optNumber(entry.frequency_value),
      frequencyScale: optCode(entry.frequency_scale),
      etymologyText: optText(entry.etymology_text),
      firstRecordedUse: optText(entry.first_recorded_use),
      sourceReferences,
      isCommon: true,
      domainTag: optText(entry.domain_tag),
      seededPleasureDispleasureWeight: optNumber(entry.seeded_pleasure_displeasure_weight),
      seededArousalNonArousalWeight: optNumber(entry.seeded_arousal_non_arousal_weight),
      seededDominanceSubmissiveWeight: optNumber(entry.seeded_dominance_submissive_weight),
      isRootWord: entry.is_root_word ?? false,
      interrogativeRootWord: entry.interrogative_root_word
        ? InterrogativeRootWord[entry.interrogative_root_word as keyof typeof InterrogativeRootWord]
        : undefined,
      hypernymRootWord: entry.hypernym_root_word
        ? HypernymRootWord[entry.hypernym_root_word as keyof typeof HypernymRootWord]
        : undefined,
      holonymRootWord: entry.holonym_root_word
        ? HolonymRootWord[entry.holonym_root_word as keyof typeof HolonymRootWord]
        : undefined,
      vectorPrimitiveRootWord: entry.vector_primitive_root_word
        ? VectorPrimitiveRootWord[entry.vector_primitive_root_word as keyof typeof VectorPrimitiveRootWord]
        : undefined,
      isDerivableNoun: entry.is_derivable_noun ?? false,
    });
  }

  private wordToEntry(word: Word): WordFileEntry {
    return {
      entry_id: word.entryId.value,
      domain_tag: word.domainTag?.value ?? null,
      lexical_form: word.lexicalForm?.value ?? word.text,
      normalised_form: word.normalisedForm?.value ?? word.text.toLowerCase(),
      text: word.text,
      version: word.version.value,
      language_code: word.languageCode.value,
      script_code: word.scriptCode?.value ?? null,
      part_of_speech: PartOfSpeech[word.partOfSpeech],
      closed_class: false,
      definition: word.definition?.value ?? null,
      gloss: word.gloss?.value ?? null,
      usage_notes: word.usageNotes.map((note) => note.value),
      register_codes: word.registerCodes.map((code) => RegisterCode[code]),
      editorial_labels: word.editorialLabels.map((label) => EditorialLabel[label]),
      dialect_codes: word.dialectCodes.map((code) => code.value),
      pronunciations: [],
      syllable_representation: word.syllableRepresentation?.value ?? null,
      syllable_count: word.syllableCount?.value ?? null,
      stress_pattern: word.stressPattern?.value ?? null,
      frequency_value: word.frequencyValue?.value ?? null,
      frequency_scale: word.frequencyScale?.value ?? null,
      etymology_text: word.etymologyText?.value ?? null,
      first_recorded_use: word.firstRecordedUse?.value ?? null,
      seeded_pleasure_displeasure_weight: word.seededPleasureDispleasureWeight?.value ?? null,
      seeded_arousal_non_arousal_weight: word.seededArousalNonArousalWeight?.value ?? null,
      seeded_dominance_submissive_weight: word.seededDominanceSubmissiveWeight?.value ?? null,
      is_root_word: word.isRootWord,
      interrogative_root_word: word.interrogativeRootWord !== undefined ? InterrogativeRootWord[word.interrogativeRootWord] : null,
      hypernym_root_word: word.hypernymRootWord !== undefined ? HypernymRootWord[word.hypernymRootWord] : null,
      holonym_root_word: word.holonymRootWord !== undefined ? HolonymRootWord[word.holonymRootWord] : null,
      vector_primitive_root_word: word.vectorPrimitiveRootWord !== undefined ? VectorPrimitiveRootWord[word.vectorPrimitiveRootWord] : null,
      is_derivable_noun: word.isDerivableNoun,
      source_references: word.sourceReferences.map((ref) => ({
        source_name: ref.sourceName.value,
        source_version: ref.sourceVersion?.value ?? null,
        external_identifier: ref.externalIdentifier?.value ?? null,
        reference_uri: ref.referenceUri?.value ?? null,
        licence_identifier: ref.licenceIdentifier?.value ?? null,
      })),
    };
  }
}
