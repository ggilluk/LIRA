/** Loads the Common Vocabulary Relationship Cache
 * (vocabulary/assets/common/<language>/relationships/) and seeds a
 * Domain's LexicalRelationship graph with it, resolving every source
 * and target Word against that Domain's own Dictionary. Relationship
 * assets are generated bootstrap assets; they are not the authoritative
 * source of lexical knowledge.
 *
 * Ported from vocabulary/role/relationship_seeder.py. validateAssets()
 * and everything that calls it are async here (unlike the synchronous
 * Python original) because checksum verification uses the Web Crypto
 * API's `crypto.subtle.digest`, which is promise-based. */

import type { Dictionary } from "../data/dictionary";
import { LexicalRelationshipStore } from "../data/lexical_relationship_store";
import { LexicalRelationshipType } from "../data/lexical_relationship_type";
import { PartOfSpeech } from "../data/part_of_speech";
import type { SourceReference } from "../data/source_reference";
import type { Word } from "../data/word";
import {
  readRelationshipFile,
  readRelationshipFileRaw,
  relationshipDirectoryExists,
  sha256Hex,
  type RelationshipFileEntry,
  type RelationshipManifestDocument,
} from "./asset_loader";
import type { LexicalRelationshipProcessor } from "./lexical_relationship_processor";

export const CATEGORY_FILES = [
  "morphological_relationships.json",
  "semantic_relationships.json",
  "orthographic_relationships.json",
] as const;
const MANIFEST_FILE = "manifest.json";

const CACHE_SOURCE_REFERENCE: SourceReference = {
  sourceName: { value: "LIRA English Common Vocabulary Relationship Cache v1" },
  sourceVersion: { value: "1.0.0" },
};

// Every seeded relationship is a curated, hand-authored linguistic fact
// ("be" -> "am" is FIRST_PERSON_FORM), not an observation or inference
// with genuine uncertainty attached -- so it gets the same
// as-good-as-certain weight the Knowledge Layer uses for directly
// authored facts elsewhere. 0.9999 rather than a literal 1.0: certainty
// is never asserted as exactly 1.0.
const SEEDER_DEFAULT_WEIGHT = 0.9999;

interface RelationshipSpec {
  sourceForm: string;
  sourcePos?: PartOfSpeech;
  sourceDomainTag?: string;
  targetForm: string;
  targetPos?: PartOfSpeech;
  targetDomainTag?: string;
  relationshipType: LexicalRelationshipType;
}

export class RelationshipSeeder {
  private cache: RelationshipSpec[] | null = null;

  constructor(private readonly languageCode: string = "en") {}

  /** Validates JSON schema, per-file and total relationship counts,
   * relationship kind validity, mandatory file existence, manifest
   * consistency, and the manifest checksum. */
  async validateAssets(): Promise<void> {
    if (!relationshipDirectoryExists(this.languageCode)) {
      throw new Error(`no Common Vocabulary Relationship Cache for language '${this.languageCode}'`);
    }

    const manifest = readRelationshipFile(this.languageCode, MANIFEST_FILE) as unknown as
      | RelationshipManifestDocument
      | undefined;
    if (manifest === undefined) throw new Error(`mandatory Relationship Cache file missing: ${MANIFEST_FILE}`);

    let computedTotal = 0;
    for (const filename of CATEGORY_FILES) {
      const doc = readRelationshipFile(this.languageCode, filename);
      if (doc === undefined) throw new Error(`mandatory Relationship Cache file missing: ${filename}`);
      if (doc.count !== doc.relationships.length) {
        throw new Error(`${filename}: count ${doc.count} does not match ${doc.relationships.length} relationship entries`);
      }
      for (const entry of doc.relationships) {
        if (!(entry.relationship_kind in LexicalRelationshipType)) {
          throw new Error(`${filename}: unknown relationship_kind '${entry.relationship_kind}'`);
        }
        if (!entry.source_lexical_form || !entry.target_lexical_form) {
          throw new Error(`${filename}: relationship entry missing source_lexical_form or target_lexical_form`);
        }
        for (const posValue of [entry.source_part_of_speech, entry.target_part_of_speech]) {
          if (posValue !== undefined && posValue !== null && !(posValue in PartOfSpeech)) {
            throw new Error(`${filename}: unknown part_of_speech '${posValue}'`);
          }
        }
      }
      computedTotal += doc.count;
    }

    if (manifest.relationship_count !== computedTotal) {
      throw new Error(
        `manifest.json relationship_count (${manifest.relationship_count}) does not match the computed total (${computedTotal})`,
      );
    }

    const computedChecksum = await this.computeChecksum();
    if (manifest.checksum !== computedChecksum) {
      throw new Error("manifest.json checksum does not match the relationship files' contents");
    }
  }

  private async computeChecksum(): Promise<string> {
    const sortedFiles = [...CATEGORY_FILES].sort();
    const texts = sortedFiles.map((filename) => {
      const raw = readRelationshipFileRaw(this.languageCode, filename);
      if (raw === undefined) throw new Error(`mandatory Relationship Cache file missing: ${filename}`);
      return raw;
    });
    return sha256Hex(texts);
  }

  /** Validates the assets, then parses every category file into
   * RelationshipSpecs. Cached after the first call. */
  async loadRelationshipSpecs(): Promise<readonly RelationshipSpec[]> {
    if (this.cache !== null) return this.cache.slice();

    await this.validateAssets();
    const specs: RelationshipSpec[] = [];
    for (const filename of CATEGORY_FILES) {
      const doc = readRelationshipFile(this.languageCode, filename);
      for (const entry of doc?.relationships ?? []) specs.push(this.entryToSpec(entry));
    }
    this.cache = specs;
    return specs.slice();
  }

  private entryToSpec(entry: RelationshipFileEntry): RelationshipSpec {
    return {
      sourceForm: entry.source_lexical_form,
      sourcePos: entry.source_part_of_speech ? PartOfSpeech[entry.source_part_of_speech as keyof typeof PartOfSpeech] : undefined,
      sourceDomainTag: entry.source_domain_tag ?? undefined,
      targetForm: entry.target_lexical_form,
      targetPos: entry.target_part_of_speech ? PartOfSpeech[entry.target_part_of_speech as keyof typeof PartOfSpeech] : undefined,
      targetDomainTag: entry.target_domain_tag ?? undefined,
      relationshipType: LexicalRelationshipType[entry.relationship_kind as keyof typeof LexicalRelationshipType],
    };
  }

  /** Resolves and creates every relationship in the cache against
   * `domain`'s own Dictionary (Qualified Word = this Domain + a
   * lexical form, never lexical form alone), skipping any that already
   * exist and raising if a source or target Word cannot be resolved.
   * Words must already be seeded (WordSeeder) before calling this.
   *
   * Resolution happens as a complete first pass, before any
   * relationship is created: if the Nth spec can't be resolved, the
   * first N-1 are never created either -- unless `options.skipUnresolvable`
   * is set, in which case an unresolvable spec is simply skipped instead
   * of aborting the whole run. Default false, preserving this method's
   * original all-or-nothing behaviour (a real cache-consistency bug
   * should still fail loudly) for every existing caller. The one caller
   * that opts in is the Vocabulary view's own "Seed Vocabulary" toolbar
   * action (vocabulary_worker.ts's handleSeedCommonVocabulary), paired
   * with WordSeeder.seedDomain's own `excludeOpenClasses` -- once that
   * option leaves NOUN/VERB/ADJECTIVE/ADVERB Words unseeded by design,
   * a large share of this Common Relationship Cache's own specs (most
   * of which relate open-class words) can no longer resolve, and that's
   * expected, not a cache bug. */
  async seedDomain(
    domain: {
      name: string;
      vocabulary: {
        dictionary: Dictionary;
        lexicalRelationships: LexicalRelationshipStore;
        lexicalRelationshipProcessor: LexicalRelationshipProcessor;
      };
    },
    options?: { skipUnresolvable?: boolean },
  ): Promise<number> {
    const skipUnresolvable = options?.skipUnresolvable ?? false;
    const dictionary = domain.vocabulary.dictionary;
    const store = domain.vocabulary.lexicalRelationships;
    const processor = domain.vocabulary.lexicalRelationshipProcessor;

    const resolved: Array<[Word, Word, LexicalRelationshipType]> = [];
    for (const spec of await this.loadRelationshipSpecs()) {
      const sourceWord = this.resolve(dictionary, spec.sourceForm, spec.sourcePos, spec.sourceDomainTag);
      if (sourceWord === undefined) {
        if (skipUnresolvable) continue;
        throw new Error(
          `cannot resolve source Word '${spec.sourceForm}'` +
            (spec.sourcePos !== undefined ? ` (${PartOfSpeech[spec.sourcePos]})` : "") +
            (spec.sourceDomainTag ? ` [${spec.sourceDomainTag}]` : "") +
            ` in Domain '${domain.name}'`,
        );
      }
      const targetWord = this.resolve(dictionary, spec.targetForm, spec.targetPos, spec.targetDomainTag);
      if (targetWord === undefined) {
        if (skipUnresolvable) continue;
        throw new Error(
          `cannot resolve target Word '${spec.targetForm}'` +
            (spec.targetPos !== undefined ? ` (${PartOfSpeech[spec.targetPos]})` : "") +
            (spec.targetDomainTag ? ` [${spec.targetDomainTag}]` : "") +
            ` in Domain '${domain.name}'`,
        );
      }
      resolved.push([sourceWord, targetWord, spec.relationshipType]);
    }

    let seeded = 0;
    for (const [sourceWord, targetWord, relationshipType] of resolved) {
      if (this.relationshipExists(store, sourceWord.uuid.value, targetWord.uuid.value, relationshipType)) continue;

      processor.create({
        sourceWordId: sourceWord.uuid.value,
        targetWordId: targetWord.uuid.value,
        relationshipType,
        sourceReferences: [CACHE_SOURCE_REFERENCE],
        confidence: SEEDER_DEFAULT_WEIGHT,
        provenance: SEEDER_DEFAULT_WEIGHT,
        temporal: SEEDER_DEFAULT_WEIGHT,
        activation: SEEDER_DEFAULT_WEIGHT,
      });
      seeded += 1;
    }
    return seeded;
  }

  /** Resolves one spec endpoint against `dictionary`. Without a
   * partOfSpeech hint, defers to Dictionary.lookup()'s own
   * first-seeded-wins default. With one, resolves via lookupAll() and
   * picks the matching sense, ignoring load order entirely. With a
   * domainTag too, also requires the candidate's own domainTag to
   * match. */
  private resolve(dictionary: Dictionary, lexicalForm: string, partOfSpeech?: PartOfSpeech, domainTag?: string): Word | undefined {
    if (partOfSpeech === undefined) return dictionary.lookup(lexicalForm);
    const candidates = dictionary.lookupAll(lexicalForm).filter((word) => word.partOfSpeech === partOfSpeech);
    return candidates.find((word) => (word.domainTag?.value ?? undefined) === domainTag);
  }

  private relationshipExists(
    store: LexicalRelationshipStore,
    sourceWordId: string,
    targetWordId: string,
    relationshipType: LexicalRelationshipType,
  ): boolean {
    return store
      .outgoing(sourceWordId)
      .some((relationship) => relationship.targetWordId.value === targetWordId && relationship.relationshipType === relationshipType);
  }
}
