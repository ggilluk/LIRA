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
import { loadWordNetSynsets, type WordNetSynset } from "./wordnet_loader";

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
   * must be called on its own.
   *
   * A WordNet synset IS a LIRA Domain+Word (Word.synsetId's own
   * docstring): both name one sense, not one spelling. So each synset's
   * member lemmas become one Word apiece (isCommon=true, domainTag
   * `wordnet.<synsetId>` so true WordNet polysemy -- the same lemma in
   * more than one synset -- lands as distinct Words the same way
   * root_words.json's homographs do, word_seeder.ts's own
   * SUPPLEMENTARY_FILES docstring), and every pairwise combination of a
   * synset's members is wired together with a SYNONYM
   * LexicalRelationship -- the direct encoding of "wordnet uses
   * synsets, LIRA uses synonym relationships": querying synonyms() on
   * any one member (word.ts, direction="both") already recovers the
   * synset's full membership from either endpoint without this needing
   * to store the group itself anywhere.
   *
   * Idempotent like seedClosedClassWords: a lemma already present under
   * the same partOfSpeech and domainTag is reused rather than
   * duplicated, and an already-created SYNONYM edge is never recreated,
   * so calling this more than once against the same Domain is safe.
   *
   * Async, unlike seedClosedClassWords -- loadWordNetSynsets() fetches
   * its dict/ text via a lazy `import()` (wordnet_loader.ts's own
   * docstring on why it isn't bundled eagerly like the Common
   * Vocabulary Cache), so nothing here can resolve synchronously. */
  async seedWordNet(domain: {
    vocabulary: {
      dictionary: Dictionary;
      lexicalRelationships: LexicalRelationshipStore;
      lexicalRelationshipProcessor: LexicalRelationshipProcessor;
    };
  }): Promise<{ wordsSeeded: number; relationshipsSeeded: number }> {
    const dictionary = domain.vocabulary.dictionary;
    const store = domain.vocabulary.lexicalRelationships;
    const processor = domain.vocabulary.lexicalRelationshipProcessor;

    // LexicalRelationshipStore.outgoing() is a linear scan over every
    // relationship (fine for RelationshipSeeder's own few thousand
    // Common Vocabulary Relationship Cache edges, relationship_seeder.ts's
    // own relationshipExists) -- but WordNet seeds far more SYNONYM
    // edges than that, so calling it once per candidate pair here would
    // turn idempotency checking quadratic. Scanning the store once
    // up front into a Set instead keeps each pair's check O(1), the
    // same reasoning Dictionary's byText/byUuid maps already apply to
    // lookup()/lookupAll() (dictionary.ts's own module docstring).
    const existingSynonymPairs = new Set<string>();
    for (const relationship of store.all()) {
      if (relationship.relationshipType !== LexicalRelationshipType.SYNONYM) continue;
      existingSynonymPairs.add(`${relationship.sourceWordId.value}|${relationship.targetWordId.value}`);
    }

    let wordsSeeded = 0;
    let relationshipsSeeded = 0;

    for (const synset of await loadWordNetSynsets()) {
      const domainTag = `wordnet.${synset.synsetId}`;
      const members: Word[] = [];
      for (const lemma of synset.lemmas) {
        if (lemma.length === 0) continue;
        const existing = dictionary
          .lookupAll(lemma)
          .find((word) => word.partOfSpeech === synset.partOfSpeech && word.domainTag?.value === domainTag);
        if (existing !== undefined) {
          members.push(existing);
          continue;
        }
        const word = this.synsetMemberToWord(synset, lemma, domainTag);
        dictionary.append(word);
        members.push(word);
        wordsSeeded += 1;
      }

      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const pairKey = `${members[i].uuid.value}|${members[j].uuid.value}`;
          if (existingSynonymPairs.has(pairKey)) continue;
          processor.create({
            sourceWordId: members[i].uuid.value,
            targetWordId: members[j].uuid.value,
            relationshipType: LexicalRelationshipType.SYNONYM,
            sourceReferences: [WORDNET_SOURCE_REFERENCE],
            confidence: WORDNET_SEEDER_DEFAULT_WEIGHT,
            provenance: WORDNET_SEEDER_DEFAULT_WEIGHT,
            temporal: WORDNET_SEEDER_DEFAULT_WEIGHT,
            activation: WORDNET_SEEDER_DEFAULT_WEIGHT,
          });
          existingSynonymPairs.add(pairKey);
          relationshipsSeeded += 1;
        }
      }
    }

    return { wordsSeeded, relationshipsSeeded };
  }

  private synsetMemberToWord(synset: WordNetSynset, lemma: string, domainTag: string): Word {
    return createWord({
      text: lemma,
      partOfSpeech: synset.partOfSpeech,
      languageCode: { value: this.languageCode },
      definition: synset.definition ? { value: synset.definition } : undefined,
      usageNotes: synset.examples.map((example) => ({ value: example })),
      domainTag: { value: domainTag },
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
