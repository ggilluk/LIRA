/** Seeds real `WordCoordination`s (`data/entities/word_coordination.ts`)
 * for a small, closed set of fixed, lexicalized coordinate expressions
 * -- "salt and pepper", "cause and effect", "back and forth", ... --
 * into `VocabularyContext.coordinations`. Source data:
 * assets/common/en/word_coordinations.json, one entry per expression
 * carrying its own `coordinates` (two or more lexical forms, all one
 * shared part of speech) and `coordinator` (a coordinating conjunction's
 * own lexical form) -- `assets/common/en/README.md`'s own "Word
 * coordinations" section has the full detail.
 *
 * Deliberately NOT part of the Common Vocabulary Cache's own
 * MANDATORY_FILES/SUPPLEMENTARY_FILES (word_seeder.ts) or
 * `validateAssets()`'s own count/manifest checks -- a Coordination
 * lexicalizes no new Word of its own (`coordinates` and `coordinator`
 * both resolve against Words that some other seeding pass already
 * created), so `word_coordinations.json` carries no `WordFileEntry`-
 * shaped schema for that validation to apply to at all
 * (`preposition_sense_seeder.ts`'s own identical reasoning for
 * `preposition_verb_noun_senses.json`, the precedent this mirrors).
 *
 * Every `coordinates` entry here is an open-class NOUN/ADVERB word,
 * which only exists in a Domain's own Dictionary once
 * `WordSeeder.seedWordNet()` has actually run against it -- unlike
 * `PrepositionSenseSeeder`'s own targets (every hand-curated PREPOSITION
 * already exists before WordNet ever loads), so this seeder is meant to
 * run only after `seedWordNet()` completes, `PrepositionSenseSeeder`'s
 * own identical timing (`role/web_worker/vocabulary_worker.ts`'s own
 * `handleSeedWordNet()` calls both, back to back). Idempotent across
 * repeated calls (an existing `entryId.value` is never seeded twice),
 * and silently seeds nothing before WordNet has loaded -- every
 * `coordinates` word fails to resolve yet, the same "skip, not an
 * error" treatment `skipUnresolvable` already gives an ordinary
 * unresolvable relationship spec. */

import { PartOfSpeech } from "../data/enums/part_of_speech";
import { ConjunctionType } from "../data/enums/conjunction_type";
import { isConjunction } from "./processor/conjunction_processor";
import { createCoordination } from "./coordination_processor";
import type { Coordinations } from "../data/coordinations";
import type { Dictionary } from "../data/dictionary";
import type { WordForms } from "../data/word_forms";
import type { Word } from "../data/entities/word";
import type { LinguisticUnit } from "../../linguistics/data/linguistic_unit";
import { identifier } from "../../value_objects";
import { readWordDirJson } from "./asset_loader";

const WORD_COORDINATIONS_FILE = "word_coordinations.json";

interface WordCoordinationEntry {
  entry_id: string;
  part_of_speech: string;
  coordinates: string[];
  coordinator: string;
}

interface WordCoordinationDocument {
  schema_version: string;
  language_code: string;
  count: number;
  coordinations: WordCoordinationEntry[];
}

/** The one homograph `dictionary.lookupAll(text)` returns whose own
 * `partOfSpeech` is exactly `partOfSpeech` -- `undefined` when none
 * match, never a fallback to some other homograph. Deliberately
 * stricter than `phrase_processor.ts`'s own `resolvedWordFor()`: that
 * function always returns *something* (a Head position always has a
 * real token to resolve, best-effort), but a coordinate here should
 * make this whole entry seed nothing at all rather than silently
 * coordinate the wrong homograph -- this session's own "a few" fix is
 * exactly the failure mode a silent fallback would risk repeating. */
function wordWithPartOfSpeech(dictionary: Dictionary, text: string, partOfSpeech: PartOfSpeech): Word | undefined {
  return dictionary.lookupAll(text).find((word) => word.partOfSpeech === partOfSpeech);
}

export class WordCoordinationSeeder {
  constructor(private readonly languageCode: string = "en") {}

  /** Returns how many new WordCoordinations this call actually created
   * (0 before WordNet has loaded, or on a Domain that already has every
   * one of them from an earlier call). */
  seed(domain: {
    vocabulary: {
      dictionary: Dictionary;
      wordForms: WordForms;
      coordinations: Coordinations<LinguisticUnit>;
    };
  }): number {
    const doc = readWordDirJson<WordCoordinationDocument>(this.languageCode, WORD_COORDINATIONS_FILE);
    if (doc === undefined) return 0;

    const { dictionary, wordForms, coordinations } = domain.vocabulary;
    const existingEntryValues = new Set(coordinations.all().map((coordination) => coordination.entryId.value));

    let seeded = 0;
    for (const entry of doc.coordinations) {
      if (existingEntryValues.has(entry.entry_id)) continue;

      const partOfSpeech = PartOfSpeech[entry.part_of_speech as keyof typeof PartOfSpeech];
      const resolvedCoordinates: Word[] = [];
      for (const text of entry.coordinates) {
        const word = wordWithPartOfSpeech(dictionary, text, partOfSpeech);
        if (word === undefined) break;
        resolvedCoordinates.push(word);
      }
      if (resolvedCoordinates.length !== entry.coordinates.length) continue;

      const coordinatorWord = dictionary
        .lookupAll(entry.coordinator)
        .filter(isConjunction)
        .find((word) => word.conjunctionType === ConjunctionType.COORDINATING);
      if (coordinatorWord === undefined) continue;
      const coordinatorForm = wordForms.baseLemmaFormOf(coordinatorWord);
      if (coordinatorForm === undefined) continue;

      coordinations.append(
        createCoordination<Word>({
          entryId: identifier(entry.entry_id),
          coordinates: resolvedCoordinates,
          coordinator: { value: coordinatorForm.entryId.uuid! },
        }),
      );
      existingEntryValues.add(entry.entry_id);
      seeded += 1;
    }
    return seeded;
  }
}
