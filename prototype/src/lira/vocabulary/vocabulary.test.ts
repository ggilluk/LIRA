import { describe, expect, it } from "vitest";
import { Dictionary } from "./data/dictionary";
import { LexicalRelationshipStore } from "./data/lexical_relationship_store";
import { LexicalRelationshipSystemPropertyTensor } from "./data/lexical_relationship_tensor";
import { LexicalRelationshipType } from "./data/lexical_relationship_type";
import { PartOfSpeech } from "./data/part_of_speech";
import { createWord, hypernyms, synonyms } from "./data/word";
import { LexicalRelationshipProcessor } from "./role/lexical_relationship_processor";
import { RelationshipSeeder } from "./role/relationship_seeder";
import { WordSeeder } from "./role/word_seeder";

describe("Dictionary", () => {
  it("lookupAll returns every homograph sharing one surface text", () => {
    const dictionary = new Dictionary();
    dictionary.append(createWord({ text: "that", partOfSpeech: PartOfSpeech.DETERMINER }));
    dictionary.append(createWord({ text: "that", partOfSpeech: PartOfSpeech.PRONOUN }));

    expect(dictionary.lookupAll("THAT")).toHaveLength(2);
    expect(dictionary.lookup("that")?.partOfSpeech).toBe(PartOfSpeech.DETERMINER);
  });

  it("seedFrom copies every Word with a fresh uuid but the same entryId", () => {
    const source = new Dictionary();
    const word = createWord({ text: "be", partOfSpeech: PartOfSpeech.AUXILIARY });
    source.append(word);

    const target = new Dictionary();
    target.seedFrom(source);

    const copied = target.all()[0];
    expect(copied.uuid.value).not.toBe(word.uuid.value);
    expect(copied.entryId.value).toBe(word.entryId.value);
  });
});

describe("Word derived properties", () => {
  it("resolves synonyms/hypernyms through a LexicalRelationshipStore", () => {
    const dictionary = new Dictionary();
    const big = createWord({ text: "big", partOfSpeech: PartOfSpeech.ADJECTIVE });
    const large = createWord({ text: "large", partOfSpeech: PartOfSpeech.ADJECTIVE });
    const sizeable = createWord({ text: "sizeable", partOfSpeech: PartOfSpeech.ADJECTIVE });
    dictionary.append(big);
    dictionary.append(large);
    dictionary.append(sizeable);

    const store = new LexicalRelationshipStore();
    const tensor = new LexicalRelationshipSystemPropertyTensor();
    const processor = new LexicalRelationshipProcessor(store, tensor);

    processor.create({
      sourceWordId: big.uuid.value,
      targetWordId: large.uuid.value,
      relationshipType: LexicalRelationshipType.SYNONYM,
      sourceReferences: [],
    });
    processor.create({
      sourceWordId: big.uuid.value,
      targetWordId: sizeable.uuid.value,
      relationshipType: LexicalRelationshipType.HYPERNYM,
      sourceReferences: [],
    });

    expect(synonyms(big, store, dictionary).map((w) => w.text)).toEqual(["large"]);
    expect(hypernyms(big, store, dictionary).map((w) => w.text)).toEqual(["sizeable"]);
  });
});

describe("WordSeeder against the bundled Common Vocabulary Cache", () => {
  it("validates the bundled assets without throwing", () => {
    const seeder = new WordSeeder("en");
    expect(() => seeder.validateAssets()).not.toThrow();
  });

  it("seeds the mandatory closed-class words and stays idempotent", () => {
    const seeder = new WordSeeder("en");
    const dictionary = new Dictionary();
    const domain = { vocabulary: { dictionary } };

    const first = seeder.seedDomain(domain);
    const second = seeder.seedDomain(domain);

    expect(first).toBeGreaterThan(300);
    expect(second).toBe(0);
    expect(dictionary.lookup("the")?.partOfSpeech).toBe(PartOfSpeech.DETERMINER);
  });
});

describe("RelationshipSeeder against the bundled Common Relationship Cache", () => {
  it("validates the bundled assets' checksum without throwing", async () => {
    const seeder = new RelationshipSeeder("en");
    await expect(seeder.validateAssets()).resolves.toBeUndefined();
  });

  it("seeds relationships that resolve against a seeded Dictionary", async () => {
    const wordSeeder = new WordSeeder("en");
    const dictionary = new Dictionary();
    wordSeeder.seedDomain({ vocabulary: { dictionary } });

    const lexicalRelationships = new LexicalRelationshipStore();
    const vocabulary = {
      dictionary,
      lexicalRelationships,
      lexicalRelationshipProcessor: new LexicalRelationshipProcessor(
        lexicalRelationships,
        new LexicalRelationshipSystemPropertyTensor(),
      ),
    };

    const relationshipSeeder = new RelationshipSeeder("en");
    const seeded = await relationshipSeeder.seedDomain({ name: "Common", vocabulary });

    expect(seeded).toBeGreaterThan(1000);
    expect(vocabulary.lexicalRelationships.totalRelationships()).toBe(seeded);
  });
});
