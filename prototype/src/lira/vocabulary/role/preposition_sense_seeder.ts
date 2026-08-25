/** Seeds `RELATED` SemanticRelationship edges from each hand-curated
 * PREPOSITION Word's own primary Sense to a real WordNet Verb/Noun
 * Sense that grounds its core meaning -- e.g. "on" -> the "lie" verb
 * sense meaning "be positioned" (02696550-v), and the "position,
 * spatial relation" noun sense (05081943-n). Source data:
 * assets/common/en/relationships/preposition_verb_noun_senses.json,
 * one entry per PREPOSITION carrying a hand-curated `senses` list
 * (asset_loader.ts's own `WordFileEntry.senses` docstring,
 * assets/common/en/README.md's own Preposition senses section).
 *
 * Deliberately NOT part of the Common Vocabulary Relationship Cache
 * (relationship_seeder.ts's own CATEGORY_FILES/checksum validation):
 * every target here is a specific WordNet synset, which only exists
 * once WordSeeder.seedWordNet() has actually run against this Domain --
 * unlike every fact that cache seeds, which resolves purely from the
 * mandatory closed-class Words RelationshipSeeder.seedDomain() already
 * runs against, before WordNet ever loads (RelationshipSeeder itself
 * runs exactly once, from role/web_worker/vocabulary_worker.ts's own
 * handleSeedCommonVocabulary(), always ahead of any WordNet load).
 * This seeder is instead meant to run again after seedWordNet()
 * completes -- vocabulary_worker.ts's own handleSeedWordNet() calls it
 * there. Idempotent across repeated calls (an existing edge is never
 * re-created, the same guard relationship_seeder.ts's own
 * copyOntoPermanentModel() uses), and silently seeds nothing at all if
 * called before WordNet has been loaded into this Domain -- a verb/noun
 * synsetId that doesn't resolve yet (Senses.findBySynsetId()'s own "not
 * seeded" case) is treated the same as `skipUnresolvable` already treats
 * an ordinary relationship spec that can't resolve: skipped, not an
 * error. */

import { PartOfSpeech } from "../data/enums/part_of_speech";
import { SemanticRelationshipKind } from "../data/enums/semantic_relationship_kind";
import type { Dictionary } from "../data/dictionary";
import type { Senses } from "../data/senses";
import type { SemanticRelationshipStore } from "../data/semantic_relationship_store";
import type { WordForms } from "../data/word_forms";
import type { SourceReference } from "../data/source_reference";
import { graphUuid as senseGraphUuid } from "./sense_processor";
import type { SemanticRelationshipProcessor } from "./semantic_relationship_processor";
import { readRelationshipDirJson } from "./asset_loader";

const PREPOSITION_VERB_NOUN_SENSES_FILE = "preposition_verb_noun_senses.json";

interface PrepositionVerbNounSenseEntry {
  preposition: string;
  verb: string;
  verb_synset_id: string;
  noun: string;
  noun_synset_id: string;
}

interface PrepositionVerbNounSenseDocument {
  schema_version: string;
  language_code: string;
  count: number;
  entries: PrepositionVerbNounSenseEntry[];
}

const SOURCE_REFERENCE: SourceReference = {
  sourceName: { value: "LIRA English Common Vocabulary Relationship Cache v1" },
  sourceVersion: { value: "1.0.0" },
};

// Matches relationship_seeder.ts's own SEEDER_DEFAULT_WEIGHT -- a
// curated, hand-authored linguistic fact, not an observation or
// inference with genuine uncertainty attached.
const SEEDER_DEFAULT_WEIGHT = 0.9999;

export class PrepositionSenseSeeder {
  constructor(private readonly languageCode: string = "en") {}

  /** Returns how many new edges this call actually created (0 before
   * WordNet has loaded, or on a domain with no PREPOSITION senses at
   * all yet). */
  seed(domain: {
    vocabulary: {
      dictionary: Dictionary;
      wordForms: WordForms;
      senses: Senses;
      semanticRelationships: SemanticRelationshipStore;
      semanticRelationshipProcessor: SemanticRelationshipProcessor;
    };
  }): number {
    const doc = readRelationshipDirJson<PrepositionVerbNounSenseDocument>(this.languageCode, PREPOSITION_VERB_NOUN_SENSES_FILE);
    if (doc === undefined) return 0;

    const { dictionary, wordForms, senses, semanticRelationships, semanticRelationshipProcessor } = domain.vocabulary;
    const existingEdges = new Set(
      semanticRelationships.all().map((r) => `${r.sourceSenseId.value}|${r.targetSenseId.value}|${r.relationshipType}`),
    );

    let seeded = 0;
    for (const entry of doc.entries) {
      const prepositionWord = dictionary.lookupAll(entry.preposition).find((word) => word.partOfSpeech === PartOfSpeech.PREPOSITION);
      if (prepositionWord === undefined) continue;
      const sourceSenseId = wordForms.senseIdsOf(prepositionWord)[0];
      if (sourceSenseId === undefined) continue;

      for (const synsetId of [entry.verb_synset_id, entry.noun_synset_id]) {
        const targetSense = senses.findBySynsetId(synsetId);
        if (targetSense === undefined) continue;
        const targetSenseUuid = senseGraphUuid(targetSense);
        if (sourceSenseId.value === targetSenseUuid) continue;
        const key = `${sourceSenseId.value}|${targetSenseUuid}|${SemanticRelationshipKind.RELATED}`;
        if (existingEdges.has(key)) continue;
        existingEdges.add(key);
        semanticRelationshipProcessor.create({
          sourceSenseId: sourceSenseId.value,
          targetSenseId: targetSenseUuid,
          relationshipType: SemanticRelationshipKind.RELATED,
          sourceReferences: [SOURCE_REFERENCE],
          confidence: SEEDER_DEFAULT_WEIGHT,
          provenance: SEEDER_DEFAULT_WEIGHT,
          temporal: SEEDER_DEFAULT_WEIGHT,
          activation: SEEDER_DEFAULT_WEIGHT,
        });
        seeded += 1;
      }
    }
    return seeded;
  }
}
