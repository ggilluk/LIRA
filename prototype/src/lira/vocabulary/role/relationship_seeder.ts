/** Loads the Common Vocabulary Relationship Cache
 * (vocabulary/assets/common/<language>/relationships/) and seeds a
 * Domain's MorphologicalPointerRelationship graph with it, resolving every source
 * and target Word against that Domain's own Dictionary. Relationship
 * assets are generated bootstrap assets; they are not the authoritative
 * source of lexical knowledge.
 *
 * Ported from vocabulary/role/relationship_seeder.py. validateAssets()
 * and everything that calls it are async here (unlike the synchronous
 * Python original) because checksum verification uses the Web Crypto
 * API's `crypto.subtle.digest`, which is promise-based. */

import type { Dictionary } from "../data/dictionary";
import { MorphologicalPointerRelationshipStore } from "../data/morphological_pointer_relationship_store";
import { LexicalRelationshipType } from "../data/enums/lexical_relationship_type";
import { PartOfSpeech } from "../data/enums/part_of_speech";
import type { Phrases } from "../data/phrases";
import type { SemanticRelationshipStore } from "../data/semantic_relationship_store";
import type { LexicalRelationshipStore } from "../data/lexical_relationship_store";
import type { SourceReference } from "../data/source_reference";
import type { Word } from "../data/entities/word";
import type { WordForms } from "../data/word_forms";
import { graphUuid } from "./word_form_processor";
import { graphUuid as wordGraphUuid } from "./word_processor";
import {
  readRelationshipFile,
  readRelationshipFileRaw,
  relationshipDirectoryExists,
  sha256Hex,
  type RelationshipFileEntry,
  type RelationshipManifestDocument,
} from "./asset_loader";
import type { MorphologicalPointerRelationshipProcessor } from "./morphological_pointer_relationship_processor";
import type { SemanticRelationshipProcessor } from "./semantic_relationship_processor";
import type { LexicalRelationshipProcessor } from "./lexical_relationship_processor";
import { LEXICAL_TO_SEMANTIC_KIND } from "./word_seeder";

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
   * expected, not a cache bug.
   *
   * A spec naming a multi-word closed-class form ("in spite of", now a
   * Phrase -- phrase.ts's own docstring) is a second, unconditional
   * exception, regardless of `skipUnresolvable`: MorphologicalPointerRelationshipStore
   * only ever connects two Word uuids, so a curated fact like "despite
   * SYNONYM in spite of" (semantic_relationships.json) has no graph
   * node to attach its Phrase-side edge to in this first pass -- silently
   * skipped, the same as any other spec this store's own shape simply
   * can't represent, not surfaced as a cache-consistency bug the way an
   * unresolvable Word genuinely would be. */
  async seedDomain(
    domain: {
      name: string;
      vocabulary: {
        dictionary: Dictionary;
        phrases: Phrases;
        morphologicalPointerRelationships: MorphologicalPointerRelationshipStore;
        morphologicalPointerRelationshipProcessor: MorphologicalPointerRelationshipProcessor;
        semanticRelationships: SemanticRelationshipStore;
        semanticRelationshipProcessor: SemanticRelationshipProcessor;
        wordForms?: WordForms;
        lexicalRelationships?: LexicalRelationshipStore;
        lexicalRelationshipProcessor?: LexicalRelationshipProcessor;
      };
    },
    options?: { skipUnresolvable?: boolean },
  ): Promise<number> {
    const skipUnresolvable = options?.skipUnresolvable ?? false;
    const dictionary = domain.vocabulary.dictionary;
    const phraseBook = domain.vocabulary.phrases;
    const store = domain.vocabulary.morphologicalPointerRelationships;
    const processor = domain.vocabulary.morphologicalPointerRelationshipProcessor;
    const semanticProcessor = domain.vocabulary.semanticRelationshipProcessor;
    const wordForms = domain.vocabulary.wordForms;
    const lexicalProcessor = domain.vocabulary.lexicalRelationshipProcessor;
    const lexicalExistingEdges = new Set<string>();
    if (domain.vocabulary.lexicalRelationships !== undefined) {
      for (const relationship of domain.vocabulary.lexicalRelationships.all()) {
        lexicalExistingEdges.add(
          `${relationship.sourceWordFormId.value}|${relationship.sourceSenseId.value}|${relationship.targetWordFormId.value}|${relationship.targetSenseId.value}|${relationship.relationshipType}`,
        );
      }
    }

    const resolved: Array<[Word, Word, LexicalRelationshipType]> = [];
    for (const spec of await this.loadRelationshipSpecs()) {
      const sourceWord = this.resolve(dictionary, spec.sourceForm, spec.sourcePos, spec.sourceDomainTag);
      if (sourceWord === undefined) {
        if (skipUnresolvable || this.isPhraseOnly(phraseBook, spec.sourceForm, spec.sourcePos)) continue;
        throw new Error(
          `cannot resolve source Word '${spec.sourceForm}'` +
            (spec.sourcePos !== undefined ? ` (${PartOfSpeech[spec.sourcePos]})` : "") +
            (spec.sourceDomainTag ? ` [${spec.sourceDomainTag}]` : "") +
            ` in Domain '${domain.name}'`,
        );
      }
      const targetWord = this.resolve(dictionary, spec.targetForm, spec.targetPos, spec.targetDomainTag);
      if (targetWord === undefined) {
        if (skipUnresolvable || this.isPhraseOnly(phraseBook, spec.targetForm, spec.targetPos)) continue;
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
    const semanticExistingEdges = new Set<string>();
    for (const [sourceWord, targetWord, relationshipType] of resolved) {
      if (!this.relationshipExists(store, wordGraphUuid(sourceWord), wordGraphUuid(targetWord), relationshipType)) {
        processor.create({
          sourceWordId: wordGraphUuid(sourceWord),
          targetWordId: wordGraphUuid(targetWord),
          relationshipType,
          sourceReferences: [CACHE_SOURCE_REFERENCE],
          confidence: SEEDER_DEFAULT_WEIGHT,
          provenance: SEEDER_DEFAULT_WEIGHT,
          temporal: SEEDER_DEFAULT_WEIGHT,
          activation: SEEDER_DEFAULT_WEIGHT,
        });
        seeded += 1;
      }

      this.copyOntoPermanentModel(
        semanticProcessor,
        semanticExistingEdges,
        lexicalProcessor,
        lexicalExistingEdges,
        wordForms,
        sourceWord,
        targetWord,
        relationshipType,
      );
    }
    return seeded;
  }

  /** Every curated fact this cache seeds also lands on its own permanent
   * home -- the target's own base-lemma WordForm's own `contractionOf`
   * for CONTRACTION (WordForm's own docstring, data/entities/word_form.ts, on why
   * it's a WordForm-level fact and many-to-many)
   * or a genuine SemanticRelationship for a true sense-to-sense semantic
   * kind (LEXICAL_TO_SEMANTIC_KIND's own docstring, word_seeder.ts, on
   * exactly which those are and why this cache uses four kinds --
   * SYNONYM/HYPONYM/HOLONYM -- WordNet-seeded data never actually
   * produces) -- the same split WordSeeder.seedWordNet's own
   * copySemanticRelationship applies to WordNet-sourced facts, applied
   * here to hand-curated ones instead. Each curated Word gets exactly
   * one private Sense of its own (registerUniqueSense, word_seeder.ts),
   * so `senseIds[0]` is never the "arbitrary primary sense of several"
   * simplification it would be for a genuinely polysemous WordNet Word --
   * there's only ever the one. A Word with no Sense at all yet (this
   * cache runs after WordSeeder.seedDomain's own Word seeding, but a
   * caller that skips Sense registration entirely is defensively
   * possible) silently contributes nothing rather than throwing --
   * missing Sense data is a Word-seeding gap, not something this cache
   * seeding pass should surface as its own error. */
  private copyOntoPermanentModel(
    semanticProcessor: SemanticRelationshipProcessor,
    semanticExistingEdges: Set<string>,
    lexicalProcessor: LexicalRelationshipProcessor | undefined,
    lexicalExistingEdges: Set<string>,
    wordForms: WordForms | undefined,
    sourceWord: Word,
    targetWord: Word,
    relationshipType: LexicalRelationshipType,
  ): void {
    if (relationshipType === LexicalRelationshipType.CONTRACTION) {
      // contractionOf lives on the target's own base-lemma WordForm now
      // (WordForm's own docstring on why), not on Word -- `wordForms`
      // undefined (defensively possible, this method's own docstring)
      // means there's nowhere left to record this fact at all, the same
      // "silently contributes nothing" outcome a missing Sense already
      // gets just below.
      const targetForm = wordForms?.registerBaseLemmaForm(targetWord);
      const sourceWordUuid = wordGraphUuid(sourceWord);
      if (targetForm !== undefined && !targetForm.contractionOf.some((id) => id.value === sourceWordUuid)) {
        targetForm.contractionOf = [...targetForm.contractionOf, { value: sourceWordUuid }];
      }
    }

    const semanticKind = LEXICAL_TO_SEMANTIC_KIND[relationshipType];
    if (semanticKind !== undefined) {
      const sourceSenseId = wordForms?.senseIdsOf(sourceWord)[0];
      const targetSenseId = wordForms?.senseIdsOf(targetWord)[0];
      if (sourceSenseId !== undefined && targetSenseId !== undefined && sourceSenseId.value !== targetSenseId.value) {
        const key = `${sourceSenseId.value}|${targetSenseId.value}|${semanticKind}`;
        if (!semanticExistingEdges.has(key)) {
          semanticExistingEdges.add(key);
          semanticProcessor.create({
            sourceSenseId: sourceSenseId.value,
            targetSenseId: targetSenseId.value,
            relationshipType: semanticKind,
            sourceReferences: [CACHE_SOURCE_REFERENCE],
            confidence: SEEDER_DEFAULT_WEIGHT,
            provenance: SEEDER_DEFAULT_WEIGHT,
            temporal: SEEDER_DEFAULT_WEIGHT,
            activation: SEEDER_DEFAULT_WEIGHT,
          });
        }
      }
      return;
    }

    // Every Morphological/Orthographic-group kind (including
    // CONTRACTION -- falls through from the branch above rather than
    // returning early there, since a curated contraction is *both* a
    // Word.contractionOf fact and its own permanent LexicalRelationship
    // now) becomes a real, permanent LexicalRelationship --
    // word_seeder.ts's own copyLexicalRelationship() applied here to
    // hand-curated facts instead of WordNet-sourced ones. Each curated
    // Word has exactly one private Sense (registerUniqueSense's own
    // "one per entry" contract), so senseIds[0] is unambiguous, not an
    // arbitrary-primary-of-several simplification.
    if (lexicalProcessor === undefined || wordForms === undefined) return;
    const sourceSenseId = wordForms.senseIdsOf(sourceWord)[0];
    const targetSenseId = wordForms.senseIdsOf(targetWord)[0];
    if (sourceSenseId === undefined || targetSenseId === undefined || sourceSenseId.value === targetSenseId.value) return;
    const sourceForm = wordForms.registerBaseLemmaForm(sourceWord);
    const targetForm = wordForms.registerBaseLemmaForm(targetWord);
    const sourceFormUuid = graphUuid(sourceForm);
    const targetFormUuid = graphUuid(targetForm);
    const key = `${sourceFormUuid}|${sourceSenseId.value}|${targetFormUuid}|${targetSenseId.value}|${relationshipType}`;
    if (lexicalExistingEdges.has(key)) return;
    lexicalExistingEdges.add(key);
    lexicalProcessor.create({
      sourceWordFormId: sourceFormUuid,
      sourceSenseId: sourceSenseId.value,
      targetWordFormId: targetFormUuid,
      targetSenseId: targetSenseId.value,
      relationshipType,
      sourceReferences: [CACHE_SOURCE_REFERENCE],
      confidence: SEEDER_DEFAULT_WEIGHT,
      provenance: SEEDER_DEFAULT_WEIGHT,
      temporal: SEEDER_DEFAULT_WEIGHT,
      activation: SEEDER_DEFAULT_WEIGHT,
    });
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

  /** Whether `lexicalForm` (optionally narrowed by `partOfSpeech`)
   * names a real, seeded Phrase -- seedDomain()'s own signal to skip a
   * spec silently rather than treat a Dictionary miss as a cache bug.
   * A Phrase endpoint genuinely can carry a MorphologicalPointerRelationship now
   * (word_seeder.ts's own seedWordNet does exactly that), but this
   * class's own `resolve()` only ever looks a spec's source/target Word
   * up in `dictionary` -- the bundled Common Relationship Cache this
   * class seeds from is hand-curated Word-to-Word data, a different
   * source from WordNet, with no spec of its own naming a Phrase
   * endpoint on purpose. */
  private isPhraseOnly(phraseBook: Phrases, lexicalForm: string, partOfSpeech?: PartOfSpeech): boolean {
    const candidates = phraseBook.lookupAll(lexicalForm);
    return partOfSpeech === undefined ? candidates.length > 0 : candidates.some((phrase) => phrase.partOfSpeech === partOfSpeech);
  }

  private relationshipExists(
    store: MorphologicalPointerRelationshipStore,
    sourceWordId: string,
    targetWordId: string,
    relationshipType: LexicalRelationshipType,
  ): boolean {
    return store
      .outgoing(sourceWordId)
      .some((relationship) => relationship.targetWordId.value === targetWordId && relationship.relationshipType === relationshipType);
  }
}
