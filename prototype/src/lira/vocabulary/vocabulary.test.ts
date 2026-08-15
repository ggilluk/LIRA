import { describe, expect, it } from "vitest";
import { Dictionary } from "./data/dictionary";
import { LexicalRelationshipStore } from "./data/lexical_relationship_store";
import { LexicalRelationshipSystemPropertyTensor } from "./data/lexical_relationship_tensor";
import { LexicalRelationshipType } from "./data/lexical_relationship_type";
import { PartOfSpeech } from "./data/part_of_speech";
import { antonyms, createWord, hypernyms, hyponyms, synonyms } from "./data/word";
import { AsyncDictionaryHydrator } from "./role/dictionary_hydrator";
import { DictionaryProcessor } from "./role/dictionary_processor";
import { LexicalRelationshipProcessor } from "./role/lexical_relationship_processor";
import { RelationshipSeeder } from "./role/relationship_seeder";
import { WordSeeder } from "./role/word_seeder";
import { loadWordNetSynsets } from "./role/wordnet_loader";
import { DictionaryView } from "./ui/dictionary_view";

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

  it("linkForm/formsOf/lemmaOf record and query the lemma index", () => {
    const dictionary = new Dictionary();
    const measure = createWord({ text: "measure", partOfSpeech: PartOfSpeech.VERB });
    const measured = createWord({ text: "measured", partOfSpeech: PartOfSpeech.VERB });
    const measuring = createWord({ text: "measuring", partOfSpeech: PartOfSpeech.VERB });
    dictionary.append(measure);
    dictionary.append(measured);
    dictionary.append(measuring);

    dictionary.linkForm(measure, measured, ["PAST_TENSE_FORM", "PAST_PARTICIPLE_FORM"]);
    dictionary.linkForm(measure, measuring, ["PRESENT_PARTICIPLE_FORM"]);

    const forms = dictionary.formsOf(measure);
    expect(forms.map((f) => f.word.text).sort()).toEqual(["measured", "measuring"]);
    expect(forms.find((f) => f.word.text === "measured")?.derivationKinds).toEqual(["PAST_TENSE_FORM", "PAST_PARTICIPLE_FORM"]);

    expect(dictionary.lemmaOf(measured)?.word.text).toBe("measure");
    expect(dictionary.lemmaOf(measure)).toBeUndefined();
    expect(dictionary.formsOf(measured)).toHaveLength(0);
  });

  it("seedFrom replays the source dictionary's own lemma links onto the fresh copies", () => {
    const source = new Dictionary();
    const base = createWord({ text: "walk", partOfSpeech: PartOfSpeech.VERB });
    const form = createWord({ text: "walked", partOfSpeech: PartOfSpeech.VERB });
    source.append(base);
    source.append(form);
    source.linkForm(base, form, ["PAST_TENSE_FORM"]);

    const target = new Dictionary();
    target.seedFrom(source);

    const [copiedBase, copiedForm] = target.all();
    expect(target.formsOf(copiedBase).map((f) => f.word.uuid.value)).toEqual([copiedForm.uuid.value]);
    expect(target.lemmaOf(copiedForm)?.word.uuid.value).toBe(copiedBase.uuid.value);
    // The link is against the NEW copies, not the original source Words.
    expect(target.formsOf(base)).toHaveLength(0);
  });

  it("phraseSpanLimit tracks the longest multi-word Word.text appended, starting from 1", () => {
    const dictionary = new Dictionary();
    expect(dictionary.phraseSpanLimit).toBe(1);

    dictionary.append(createWord({ text: "give up", partOfSpeech: PartOfSpeech.VERB }));
    expect(dictionary.phraseSpanLimit).toBe(2);

    dictionary.append(createWord({ text: "in spite of", partOfSpeech: PartOfSpeech.PREPOSITION }));
    expect(dictionary.phraseSpanLimit).toBe(3);

    // A later, shorter multi-word entry never lowers the limit back down.
    dictionary.append(createWord({ text: "each other", partOfSpeech: PartOfSpeech.PRONOUN }));
    expect(dictionary.phraseSpanLimit).toBe(3);
  });
});

describe("DictionaryProcessor.identifyPhrase", () => {
  it("prefers the longest seeded multi-word span over single-token lookups", () => {
    const dictionary = new Dictionary();
    dictionary.append(createWord({ text: "in", partOfSpeech: PartOfSpeech.PREPOSITION }));
    dictionary.append(createWord({ text: "of", partOfSpeech: PartOfSpeech.PREPOSITION }));
    dictionary.append(createWord({ text: "in spite of", partOfSpeech: PartOfSpeech.PREPOSITION }));
    const processor = new DictionaryProcessor(dictionary, new AsyncDictionaryHydrator(dictionary), "Common");

    const rawTokens = ["he", "waited", "in", "spite", "of", "the", "rain"];
    const result = processor.identifyPhrase(rawTokens, 2);

    expect(result.tokenSpan).toBe(3);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].word?.text).toBe("in spite of");
  });

  it("falls back to a plain single-token identifyWord lookup, hydration included, when no phrase matches", () => {
    const dictionary = new Dictionary();
    dictionary.append(createWord({ text: "cat", partOfSpeech: PartOfSpeech.NOUN }));
    const hydrator = new AsyncDictionaryHydrator(dictionary);
    const processor = new DictionaryProcessor(dictionary, hydrator, "Common");

    const result = processor.identifyPhrase(["the", "cat", "sat"], 1);

    expect(result.tokenSpan).toBe(1);
    expect(result.candidates[0].word?.text).toBe("cat");
  });

  it("never mistakes an unmatched shorter span (\"in spite\") for a candidate of its own", () => {
    const dictionary = new Dictionary();
    dictionary.append(createWord({ text: "spite", partOfSpeech: PartOfSpeech.NOUN }));
    dictionary.append(createWord({ text: "in spite of", partOfSpeech: PartOfSpeech.PREPOSITION }));
    const processor = new DictionaryProcessor(dictionary, new AsyncDictionaryHydrator(dictionary), "Common");

    // "in spite" (2 tokens) matches nothing on its own -- only the full
    // 3-token "in spite of" is seeded -- so the longest-match search
    // must skip straight past it to the 3-token span, not settle for a
    // false positive on the shorter one.
    const result = processor.identifyPhrase(["standing", "in", "spite", "of", "warnings"], 1);
    expect(result.tokenSpan).toBe(3);
    expect(result.candidates[0].word?.text).toBe("in spite of");
  });

  it("resolves \"in spite of\" as one PREPOSITION span against the real bundled Common Vocabulary Cache", () => {
    const dictionary = new Dictionary();
    new WordSeeder("en").seedClosedClassWords(dictionary);
    const processor = new DictionaryProcessor(dictionary, new AsyncDictionaryHydrator(dictionary), "Common");

    const rawTokens = ["he", "stood", "his", "ground", "in", "spite", "of", "the", "storm"];
    const result = processor.identifyPhrase(rawTokens, 4);

    expect(result.tokenSpan).toBe(3);
    expect(result.candidates.some((c) => c.partOfSpeech === PartOfSpeech.PREPOSITION)).toBe(true);
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

  it("wires the real Common Vocabulary Cache's nested lemma groups into the seeded Dictionary's lemma index", () => {
    const dictionary = new Dictionary();
    new WordSeeder("en").seedClosedClassWords(dictionary);

    // "measure" -> "measured" is nested in promoted_words.json with
    // BOTH PAST_TENSE_FORM and PAST_PARTICIPLE_FORM (the same surface
    // form legitimately satisfies both for a regular verb).
    const measure = dictionary.lookupAll("measure").find((w) => w.partOfSpeech === PartOfSpeech.VERB);
    expect(measure).toBeDefined();
    const forms = dictionary.formsOf(measure!);
    expect(forms.length).toBeGreaterThan(0);
    const measured = forms.find((f) => f.word.text === "measured");
    expect(measured?.derivationKinds).toEqual(expect.arrayContaining(["PAST_TENSE_FORM", "PAST_PARTICIPLE_FORM"]));

    // The reverse lookup agrees.
    expect(dictionary.lemmaOf(measured!.word)?.word.uuid.value).toBe(measure!.uuid.value);

    // Flattening didn't change what's actually seeded -- "measured" is
    // still independently reachable through the normal flat lookup(),
    // exactly as if it had never been nested on disk.
    expect(dictionary.lookup("measured")?.partOfSpeech).toBe(PartOfSpeech.VERB);
  });
});

describe("loadWordNetSynsets against the bundled Princeton WordNet 3.1 dict/ files", () => {
  it("parses the real synset data, one entry per line", async () => {
    const synsets = await loadWordNetSynsets();
    expect(synsets.length).toBeGreaterThan(100000);

    // 01385012-a: "large, big" -- above average in size, ... (data.adj).
    const largeBig = synsets.find((s) => s.synsetId === "01385012-a");
    expect(largeBig?.lemmas).toEqual(expect.arrayContaining(["large", "big"]));
    expect(largeBig?.partOfSpeech).toBe(PartOfSpeech.ADJECTIVE);
    expect(largeBig?.definition).toContain("above average in size");
    expect(largeBig?.examples).toEqual(expect.arrayContaining(["a large city"]));
  }, 30000);
});

describe("WordSeeder.seedWordNet against the bundled Princeton WordNet 3.1 dict/ files", () => {
  it("seeds every synset member as a Word carrying its synsetId, wires every WordNet pointer to a LexicalRelationship, and stays idempotent across both", async () => {
    const dictionary = new Dictionary();
    const lexicalRelationships = new LexicalRelationshipStore();
    const lexicalRelationshipProcessor = new LexicalRelationshipProcessor(
      lexicalRelationships,
      new LexicalRelationshipSystemPropertyTensor(),
    );
    const seeder = new WordSeeder("en");
    const domain = { vocabulary: { dictionary, lexicalRelationships, lexicalRelationshipProcessor } };

    const first = await seeder.seedWordNet(domain);
    expect(first.wordsSeeded).toBeGreaterThan(100000);
    // Far beyond the SYNONYM-only total (~158,000) -- every other
    // WordNet pointer type (hypernym, meronym, antonym, ...) is now
    // wired too, word_seeder.ts's own seedWordNet docstring on its
    // second pass. Below 1,000,000 (unlike an earlier version of this
    // assertion): relationshipKindForPointer's own docstring on why
    // WordNet's redundant both-ends pointer encoding no longer produces
    // two edges per fact for the complementary-kind (HYPERNYM/HYPONYM,
    // xMERONYM/xHOLONYM) and symmetric-kind (ANTONYM, VERB_GROUP,
    // ATTRIBUTE, ALSO_SEE, DERIVED_FORM) pairs SYMMETRIC_RELATIONSHIP_KINDS
    // covers.
    expect(first.relationshipsSeeded).toBeGreaterThan(700000);
    expect(first.relationshipsSeeded).toBeLessThan(900000);
    expect(dictionary.totalEntries()).toBe(first.wordsSeeded);
    expect(lexicalRelationships.totalRelationships()).toBe(first.relationshipsSeeded);

    const big = dictionary
      .lookupAll("big")
      .find((word) => word.partOfSpeech === PartOfSpeech.ADJECTIVE && word.synsetId?.value === "01385012-a");
    expect(big).toBeDefined();
    expect(big?.isCommon).toBe(true);
    expect(big?.synsetId?.schemeId).toBe("wn31");
    expect(synonyms(big!, lexicalRelationships, dictionary).map((w) => w.text)).toEqual(["large"]);

    // 00001930-n "physical entity" -- HYPERNYM -> 00001740-n "entity"
    // (dict/data.noun's own first two real synset lines).
    const physicalEntity = dictionary
      .lookupAll("physical entity")
      .find((word) => word.synsetId?.value === "00001930-n");
    expect(physicalEntity).toBeDefined();
    expect(hypernyms(physicalEntity!, lexicalRelationships, dictionary).map((w) => w.text)).toEqual(["entity"]);
    // The reciprocal direction resolves too, off the identical stored
    // edge (hyponyms()'s own docstring) -- "entity" is never told apart
    // from "physical entity" by a second, separately-stored HYPONYM edge.
    const entity = dictionary.lookupAll("entity").find((word) => word.synsetId?.value === "00001740-n");
    expect(entity).toBeDefined();
    expect(hyponyms(entity!, lexicalRelationships, dictionary).map((w) => w.text)).toContain("physical entity");

    // 00001740-a "able" -- ANTONYM -> 00002098-a "unable" (both
    // directions -- antonyms() itself reads direction="both").
    const able = dictionary.lookupAll("able").find((word) => word.synsetId?.value === "00001740-a");
    expect(able).toBeDefined();
    expect(antonyms(able!, lexicalRelationships, dictionary).map((w) => w.text)).toEqual(["unable"]);
    const unable = dictionary.lookupAll("unable").find((word) => word.synsetId?.value === "00002098-a");
    expect(antonyms(unable!, lexicalRelationships, dictionary).map((w) => w.text)).toEqual(["able"]);
    // Only one ANTONYM edge is actually stored for this pair (a genuine
    // regression check for SYMMETRIC_RELATIONSHIP_KINDS -- antonyms()
    // reading direction="both" would still pass even if both directions
    // were separately stored, so this checks the underlying store directly).
    const antonymEdgesBetween = [
      ...lexicalRelationships.outgoing(able!.uuid.value),
      ...lexicalRelationships.incoming(able!.uuid.value),
    ].filter((r) => r.relationshipType === LexicalRelationshipType.ANTONYM && (r.sourceWordId.value === unable!.uuid.value || r.targetWordId.value === unable!.uuid.value));
    expect(antonymEdgesBetween).toHaveLength(1);

    // Every new WordNet-sourced kind actually appears at least once --
    // a regression check against relationshipKindForPointer silently
    // mapping a symbol to the wrong (or an existing, wrong) kind.
    const seenKinds = new Set(lexicalRelationships.all().map((r) => r.relationshipType));
    for (const kind of [
      LexicalRelationshipType.PERTAINYM,
      LexicalRelationshipType.SIMILAR_TO,
      LexicalRelationshipType.INSTANCE_HYPERNYM,
      LexicalRelationshipType.PART_MERONYM,
      LexicalRelationshipType.MEMBER_MERONYM,
      LexicalRelationshipType.SUBSTANCE_MERONYM,
      LexicalRelationshipType.ALSO_SEE,
      LexicalRelationshipType.VERB_GROUP,
      LexicalRelationshipType.ATTRIBUTE,
      LexicalRelationshipType.REGION_DOMAIN,
      LexicalRelationshipType.USAGE_DOMAIN,
    ]) {
      expect(seenKinds.has(kind), `expected at least one ${LexicalRelationshipType[kind]} edge`).toBe(true);
    }
    // HYPONYM/TROPONYM/INSTANCE_HYPONYM/PART_HOLONYM/MEMBER_HOLONYM/
    // SUBSTANCE_HOLONYM are never seeded at all -- relationshipKindForPointer
    // canonicalizes their own WordNet pointer symbols onto their
    // complementary kind instead (this is the fix itself, not an
    // implementation detail: a word's own relationship list no longer
    // shows both "X is a type of Y" and the reciprocal "Y has hyponym
    // X" as two separate entries for the identical fact). TOPIC_DOMAIN is
    // never seeded either, for a different reason: seedPointerRelationship
    // intercepts `;c`/`-c` pointers and tags the word itself
    // (domainTag/relatedDomainTags) instead of creating an edge (see the
    // dedicated "topic-domain pointers" test below).
    for (const kind of [
      LexicalRelationshipType.HYPONYM,
      LexicalRelationshipType.TROPONYM,
      LexicalRelationshipType.INSTANCE_HYPONYM,
      LexicalRelationshipType.PART_HOLONYM,
      LexicalRelationshipType.MEMBER_HOLONYM,
      LexicalRelationshipType.SUBSTANCE_HOLONYM,
      LexicalRelationshipType.TOPIC_DOMAIN,
    ]) {
      expect(seenKinds.has(kind), `expected no ${LexicalRelationshipType[kind]} edges at all`).toBe(false);
    }

    // Topic-domain pointers (`;c`/`-c`) tag the word itself
    // (domainTag/relatedDomainTags) instead of becoming a relationship --
    // "infusion" (dict/data.noun offset 00324358) carries exactly one
    // topic pointer, to the "medicine" (medical_specialty) category.
    const infusion = dictionary.lookupAll("infusion").find((word) => word.synsetId?.value === "00324358-n");
    expect(infusion).toBeDefined();
    expect(infusion?.domainTag?.value).toBe("medicine");
    expect(infusion?.relatedDomainTags).toEqual([]);

    // "winger" (offset 10802147) carries FOUR topic pointers -- it's a
    // wing position in soccer, field hockey, rugby, AND football. None
    // should be lost: exactly one becomes domainTag (first-wins), the
    // other three land in relatedDomainTags, with no duplicates -- same
    // outcome whether a given (word, category) fact is discovered via
    // winger's own `;c` pointer or via the category synset's reciprocal
    // `-c` pointer back to winger.
    const winger = dictionary.lookupAll("winger").find((word) => word.synsetId?.value === "10802147-n");
    expect(winger).toBeDefined();
    expect(winger?.domainTag).toBeDefined();
    const wingerDomains = [winger!.domainTag!.value, ...winger!.relatedDomainTags.map((tag) => tag.value)];
    expect(wingerDomains).toHaveLength(4);
    expect(new Set(wingerDomains).size).toBe(4);
    expect(new Set(wingerDomains)).toEqual(new Set(["soccer", "field hockey", "rugby", "football"]));

    // Re-seeding the same Domain neither duplicates Words nor
    // recreates any relationship, of any kind -- nor does it disturb or
    // duplicate any already-assigned domainTag/relatedDomainTags.
    const second = await seeder.seedWordNet(domain);
    expect(second.wordsSeeded).toBe(0);
    expect(second.relationshipsSeeded).toBe(0);
    expect(dictionary.totalEntries()).toBe(first.wordsSeeded);
    expect(infusion?.domainTag?.value).toBe("medicine");
    expect(new Set([winger!.domainTag!.value, ...winger!.relatedDomainTags.map((tag) => tag.value)])).toEqual(
      new Set(["soccer", "field hockey", "rugby", "football"]),
    );
    expect(lexicalRelationships.totalRelationships()).toBe(first.relationshipsSeeded);
  }, 60000);

  it("a word's own relationships never show both a hypernym/hyponym (or antonym/meronym/...) fact and its reciprocal listing as two separate entries", async () => {
    const dictionary = new Dictionary();
    const lexicalRelationships = new LexicalRelationshipStore();
    const lexicalRelationshipProcessor = new LexicalRelationshipProcessor(
      lexicalRelationships,
      new LexicalRelationshipSystemPropertyTensor(),
    );
    await new WordSeeder("en").seedWordNet({ vocabulary: { dictionary, lexicalRelationships, lexicalRelationshipProcessor } });

    const dog = dictionary.lookupAll("dog").find((w) => w.partOfSpeech === PartOfSpeech.NOUN && w.synsetId?.value === "02086723-n");
    expect(dog).toBeDefined();

    // Both directions still resolve correctly (dog has real hypernyms
    // -- canine/canid/domestic animal -- and real hyponyms -- poodle,
    // among many others) ...
    const dogHypernyms = hypernyms(dog!, lexicalRelationships, dictionary).map((w) => w.text);
    const dogHyponyms = hyponyms(dog!, lexicalRelationships, dictionary).map((w) => w.text);
    expect(dogHypernyms).toContain("canine");
    expect(dogHyponyms).toContain("poodle");

    // ... but every one of dog's own relationships (outgoing + incoming,
    // exactly what the Vocabulary UI's detail panel queries via
    // DictionaryView.searchRelationships({ wordId })) touches dog
    // directly exactly once per (other word, kind) pair -- never a
    // second entry for the identical fact viewed from the other end.
    const dogRelationships = [...lexicalRelationships.outgoing(dog!.uuid.value), ...lexicalRelationships.incoming(dog!.uuid.value)];
    const seenPairs = new Set<string>();
    for (const r of dogRelationships) {
      const otherId = r.sourceWordId.value === dog!.uuid.value ? r.targetWordId.value : r.sourceWordId.value;
      const pairKey = `${otherId}|${r.relationshipType}`;
      expect(seenPairs.has(pairKey), `duplicate (other word, kind) pair: ${pairKey}`).toBe(false);
      seenPairs.add(pairKey);
    }
  }, 60000);
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

describe("DictionaryView.searchWords", () => {
  it("matches the same fields client-side matchesQuery()/filteredWords() does, on demand rather than against a pre-embedded array", () => {
    const dictionary = new Dictionary();
    const big = createWord({ text: "big", partOfSpeech: PartOfSpeech.ADJECTIVE, definition: { value: "of considerable size" } });
    const large = createWord({ text: "large", partOfSpeech: PartOfSpeech.ADJECTIVE, definition: { value: "above average size" } });
    const cat = createWord({ text: "cat", partOfSpeech: PartOfSpeech.NOUN, definition: { value: "a small domesticated feline" }, isRootWord: true });
    dictionary.append(big);
    dictionary.append(large);
    dictionary.append(cat);

    const relationships = new LexicalRelationshipStore();
    const view = new DictionaryView(dictionary, relationships, { domainName: "Common" });

    // Substring match on lexical_form, case-insensitive.
    expect(view.searchWords({ word: "BIG" }).words.map((w) => w.lexical_form)).toEqual(["big"]);
    // Substring match on definition.
    expect(view.searchWords({ definition: "size" }).words.map((w) => w.lexical_form)).toEqual(["big", "large"]);
    // pos filter.
    expect(view.searchWords({ pos: "NOUN" }).words.map((w) => w.lexical_form)).toEqual(["cat"]);
    // rootWordsOnly filter.
    expect(view.searchWords({ rootWordsOnly: true }).words.map((w) => w.lexical_form)).toEqual(["cat"]);
    // No match.
    expect(view.searchWords({ word: "nonexistent" }).words).toEqual([]);
  });

  it("`wordId` bypasses every other filter for an O(1) exact lookup", () => {
    const dictionary = new Dictionary();
    const big = createWord({ text: "big", partOfSpeech: PartOfSpeech.ADJECTIVE });
    const large = createWord({ text: "large", partOfSpeech: PartOfSpeech.ADJECTIVE });
    dictionary.append(big);
    dictionary.append(large);
    const view = new DictionaryView(dictionary, new LexicalRelationshipStore(), { domainName: "Common" });

    const found = view.searchWords({ wordId: large.uuid.value });
    expect(found.totalMatches).toBe(1);
    expect(found.words.map((w) => w.lexical_form)).toEqual(["large"]);

    // Every other filter is ignored once wordId is set -- this would
    // match nothing by pos alone (both Words here are ADJECTIVE), but
    // wordId still resolves the exact Word asked for.
    const ignoresOtherFilters = view.searchWords({ wordId: big.uuid.value, pos: "NOUN" });
    expect(ignoresOtherFilters.words.map((w) => w.lexical_form)).toEqual(["big"]);

    expect(view.searchWords({ wordId: "not-a-real-id" }).totalMatches).toBe(0);
  });

  it("caps `words` at `limit` but reports the true, uncapped totalMatches", () => {
    const dictionary = new Dictionary();
    for (let i = 0; i < 10; i++) {
      dictionary.append(createWord({ text: `word${i}`, partOfSpeech: PartOfSpeech.NOUN }));
    }
    const relationships = new LexicalRelationshipStore();
    const view = new DictionaryView(dictionary, relationships, { domainName: "Common" });

    const result = view.searchWords({ word: "word", limit: 3 });
    expect(result.words).toHaveLength(3);
    expect(result.totalMatches).toBe(10);
  });

  it("resolves against the real bundled WordNet-scale dataset without embedding it (regression check for the RangeError MAX_INTERACTIVE_WORDS exists to avoid)", async () => {
    const dictionary = new Dictionary();
    const lexicalRelationships = new LexicalRelationshipStore();
    const lexicalRelationshipProcessor = new LexicalRelationshipProcessor(
      lexicalRelationships,
      new LexicalRelationshipSystemPropertyTensor(),
    );
    await new WordSeeder("en").seedWordNet({ vocabulary: { dictionary, lexicalRelationships, lexicalRelationshipProcessor } });

    const view = new DictionaryView(dictionary, lexicalRelationships, { domainName: "Common" });
    const result = view.searchWords({ word: "large", limit: 50 });
    expect(result.totalMatches).toBeGreaterThan(0);
    expect(result.words.length).toBeLessThanOrEqual(50);
    expect(result.words.every((w) => w.lexical_form.toLowerCase().includes("large"))).toBe(true);
    // Every WordNet-seeded Word carries its synset id as sense_id
    // (word.synsetId's own docstring) -- the vocabulary UI shows this
    // to the right of the word.
    expect(result.words.every((w) => typeof w.sense_id === "string" && w.sense_id.length > 0)).toBe(true);
  }, 30000);

  it("sense_id is null for a Word that didn't come from WordSeeder.seedWordNet", () => {
    const dictionary = new Dictionary();
    dictionary.append(createWord({ text: "big", partOfSpeech: PartOfSpeech.ADJECTIVE }));
    const view = new DictionaryView(dictionary, new LexicalRelationshipStore(), { domainName: "Common" });

    expect(view.searchWords({ word: "big" }).words[0].sense_id).toBeNull();
  });
});

describe("DictionaryView.searchRelationships", () => {
  function buildFixture() {
    const dictionary = new Dictionary();
    const big = createWord({ text: "big", partOfSpeech: PartOfSpeech.ADJECTIVE });
    const large = createWord({ text: "large", partOfSpeech: PartOfSpeech.ADJECTIVE });
    const small = createWord({ text: "small", partOfSpeech: PartOfSpeech.ADJECTIVE });
    dictionary.append(big);
    dictionary.append(large);
    dictionary.append(small);

    const store = new LexicalRelationshipStore();
    const processor = new LexicalRelationshipProcessor(store, new LexicalRelationshipSystemPropertyTensor());
    processor.create({ sourceWordId: big.uuid.value, targetWordId: large.uuid.value, relationshipType: LexicalRelationshipType.SYNONYM, sourceReferences: [] });
    processor.create({ sourceWordId: big.uuid.value, targetWordId: small.uuid.value, relationshipType: LexicalRelationshipType.ANTONYM, sourceReferences: [] });

    const view = new DictionaryView(dictionary, store, { domainName: "Common" });
    return { view, big, large, small };
  }

  it("resolves every relationship touching `wordId`, both outgoing and incoming", () => {
    const { view, big, large, small } = buildFixture();

    const forBig = view.searchRelationships({ wordId: big.uuid.value });
    expect(forBig.totalMatches).toBe(2);
    expect(forBig.relationships.map((r) => r.kind).sort()).toEqual(["ANTONYM", "SYNONYM"]);

    const forLarge = view.searchRelationships({ wordId: large.uuid.value });
    expect(forLarge.totalMatches).toBe(1);
    expect(forLarge.relationships[0].kind).toBe("SYNONYM");
    expect(forLarge.relationships[0].source_text).toBe("big");
    expect(forLarge.relationships[0].target_text).toBe("large");

    expect(view.searchRelationships({ wordId: small.uuid.value }).totalMatches).toBe(1);
  });

  it("matches `query` against source text, target text, or kind, across the whole store when `wordId` is omitted", () => {
    const { view } = buildFixture();

    expect(view.searchRelationships({ query: "large" }).relationships.map((r) => r.kind)).toEqual(["SYNONYM"]);
    expect(view.searchRelationships({ query: "anton" }).relationships.map((r) => r.kind)).toEqual(["ANTONYM"]);
    expect(view.searchRelationships({ query: "nonexistent" }).relationships).toEqual([]);
    expect(view.searchRelationships({}).totalMatches).toBe(2);
  });

  it("caps `relationships` at `limit` but reports the true, uncapped totalMatches", () => {
    const dictionary = new Dictionary();
    const words = Array.from({ length: 10 }, (_, i) => createWord({ text: `word${i}`, partOfSpeech: PartOfSpeech.NOUN }));
    for (const w of words) dictionary.append(w);

    const store = new LexicalRelationshipStore();
    const processor = new LexicalRelationshipProcessor(store, new LexicalRelationshipSystemPropertyTensor());
    for (let i = 0; i < words.length - 1; i++) {
      processor.create({ sourceWordId: words[i].uuid.value, targetWordId: words[i + 1].uuid.value, relationshipType: LexicalRelationshipType.SYNONYM, sourceReferences: [] });
    }

    const view = new DictionaryView(dictionary, store, { domainName: "Common" });
    const result = view.searchRelationships({ limit: 3 });
    expect(result.relationships).toHaveLength(3);
    expect(result.totalMatches).toBe(9);
  });

  it("resolves against the real bundled WordNet-scale relationship graph without embedding it (regression check mirroring searchWords' own)", async () => {
    const dictionary = new Dictionary();
    const lexicalRelationships = new LexicalRelationshipStore();
    const lexicalRelationshipProcessor = new LexicalRelationshipProcessor(
      lexicalRelationships,
      new LexicalRelationshipSystemPropertyTensor(),
    );
    await new WordSeeder("en").seedWordNet({ vocabulary: { dictionary, lexicalRelationships, lexicalRelationshipProcessor } });

    const view = new DictionaryView(dictionary, lexicalRelationships, { domainName: "Common" });
    const large = dictionary.lookup("large");
    expect(large).toBeDefined();

    const result = view.searchRelationships({ wordId: large!.uuid.value, limit: 25 });
    expect(result.totalMatches).toBeGreaterThan(0);
    expect(result.relationships.length).toBeLessThanOrEqual(25);
    expect(result.relationships.every((r) => r.source_id === large!.uuid.value || r.target_id === large!.uuid.value)).toBe(true);
    // Both sides of a WordNet-seeded relationship carry their own
    // sense_id (source_sense_id/target_sense_id) -- the vocabulary UI's
    // detail panel shows this next to each related word.
    expect(result.relationships.every((r) => typeof r.source_sense_id === "string" && typeof r.target_sense_id === "string")).toBe(true);
  }, 30000);
});

describe("DictionaryView.resolveHierarchy", () => {
  // vehicle
  //  |- car
  //  |   |- sedan
  //  |- truck
  //  |- boat
  // fruit
  //  |- apple
  function buildTreeFixture() {
    const dictionary = new Dictionary();
    const words = {} as Record<string, ReturnType<typeof createWord>>;
    for (const text of ["vehicle", "car", "sedan", "truck", "boat", "fruit", "apple"]) {
      words[text] = createWord({ text, partOfSpeech: PartOfSpeech.NOUN });
      dictionary.append(words[text]);
    }
    const store = new LexicalRelationshipStore();
    const processor = new LexicalRelationshipProcessor(store, new LexicalRelationshipSystemPropertyTensor());
    const hypernym = (child: string, parent: string) =>
      processor.create({ sourceWordId: words[child].uuid.value, targetWordId: words[parent].uuid.value, relationshipType: LexicalRelationshipType.HYPERNYM, sourceReferences: [] });
    hypernym("car", "vehicle");
    hypernym("sedan", "car");
    hypernym("truck", "vehicle");
    hypernym("boat", "vehicle");
    hypernym("apple", "fruit");

    const view = new DictionaryView(dictionary, store, { domainName: "Common" });
    return { view, words };
  }

  it("with no wordId, centres on the broadest root -- the root with the most total reachable descendants", () => {
    const { view, words } = buildTreeFixture();
    const result = view.resolveHierarchy({ kind: "HYPERNYM" });
    expect(result.fellBack).toBe(false);
    expect(result.roots).toEqual([words.vehicle.uuid.value]);
    expect(result.totalEdgeCount).toBe(5);
    expect(result.totalNodeCount).toBe(7);
    // The whole subtree under vehicle is included -- car, sedan, truck, boat.
    const includedTexts = result.nodes.map((n) => n.lexical_form).sort();
    expect(includedTexts).toEqual(["boat", "car", "sedan", "truck", "vehicle"]);
    // fruit/apple are a separate root -- not part of vehicle's own subtree.
    expect(includedTexts).not.toContain("fruit");
    expect(includedTexts).not.toContain("apple");
  });

  // Regression check for the "broadest root" heuristic itself: a root
  // with FEWER direct children but a much larger total subtree must
  // still win over a root with more direct children but a small,
  // shallow one -- the exact "entity vs. change" shape of bug an
  // earlier direct-child-count-only heuristic got wrong (WordNet's own
  // shallow verb taxonomy can give a broad verb concept more *direct*
  // hyponyms than "entity" has, while entity's own subtree still
  // dwarfs it in total size).
  //
  // wide_shallow          deep_narrow
  //  |- w1                 |- d1
  //  |- w2                     |- d1a .. d1j (10 more)
  //  |- w3
  //  |- w4
  it("picks the root with the largest total subtree, not merely the most direct children", () => {
    const dictionary = new Dictionary();
    const words = {} as Record<string, ReturnType<typeof createWord>>;
    const names = ["wide_shallow", "w1", "w2", "w3", "w4", "deep_narrow", "d1", ...Array.from({ length: 10 }, (_, i) => `d1${String.fromCharCode(97 + i)}`)];
    for (const text of names) {
      words[text] = createWord({ text, partOfSpeech: PartOfSpeech.NOUN });
      dictionary.append(words[text]);
    }
    const store = new LexicalRelationshipStore();
    const processor = new LexicalRelationshipProcessor(store, new LexicalRelationshipSystemPropertyTensor());
    const hypernym = (child: string, parent: string) =>
      processor.create({ sourceWordId: words[child].uuid.value, targetWordId: words[parent].uuid.value, relationshipType: LexicalRelationshipType.HYPERNYM, sourceReferences: [] });
    for (const child of ["w1", "w2", "w3", "w4"]) hypernym(child, "wide_shallow");
    hypernym("d1", "deep_narrow");
    for (let i = 0; i < 10; i++) hypernym(`d1${String.fromCharCode(97 + i)}`, "d1");

    const view = new DictionaryView(dictionary, store, { domainName: "Common" });
    const result = view.resolveHierarchy({ kind: "HYPERNYM" });
    // wide_shallow has 4 direct children (more than deep_narrow's 1),
    // but only 5 total descendants; deep_narrow has 12. The broadest
    // root must be deep_narrow.
    expect(result.roots).toEqual([words.deep_narrow.uuid.value]);
  });

  it("with a wordId, builds the ancestor chain up to the root plus that word's own descendants", () => {
    const { view, words } = buildTreeFixture();
    const result = view.resolveHierarchy({ kind: "HYPERNYM", wordId: words.sedan.uuid.value });
    expect(result.roots).toEqual([words.vehicle.uuid.value]);
    const edgePairs = result.edges.map((e) => [e.parentId, e.childId]);
    expect(edgePairs).toContainEqual([words.vehicle.uuid.value, words.car.uuid.value]);
    expect(edgePairs).toContainEqual([words.car.uuid.value, words.sedan.uuid.value]);
    // Nothing from the unrelated fruit/apple branch leaks in.
    expect(result.nodes.map((n) => n.lexical_form)).not.toContain("fruit");
  });

  it("truncates the descendant walk at `limit` and reports `truncated: true`", () => {
    const { view } = buildTreeFixture();
    const result = view.resolveHierarchy({ kind: "HYPERNYM", limit: 2 });
    expect(result.truncated).toBe(true);
    expect(result.nodes.length).toBeLessThanOrEqual(2);
  });

  it("falls back with fellBack: true for a fully symmetric kind (every node has both directions)", () => {
    const dictionary = new Dictionary();
    const big = createWord({ text: "big", partOfSpeech: PartOfSpeech.ADJECTIVE });
    const small = createWord({ text: "small", partOfSpeech: PartOfSpeech.ADJECTIVE });
    dictionary.append(big);
    dictionary.append(small);
    const store = new LexicalRelationshipStore();
    const processor = new LexicalRelationshipProcessor(store, new LexicalRelationshipSystemPropertyTensor());
    processor.create({ sourceWordId: big.uuid.value, targetWordId: small.uuid.value, relationshipType: LexicalRelationshipType.ANTONYM, sourceReferences: [] });
    processor.create({ sourceWordId: small.uuid.value, targetWordId: big.uuid.value, relationshipType: LexicalRelationshipType.ANTONYM, sourceReferences: [] });

    const view = new DictionaryView(dictionary, store, { domainName: "Common" });
    const result = view.resolveHierarchy({ kind: "ANTONYM" });
    expect(result.fellBack).toBe(true);
    expect(result.totalEdgeCount).toBe(2);
  });

  it("resolves against the real bundled WordNet-scale dataset, correctly oriented (broad root, narrow leaves) for a kind only stored in the child->parent direction", async () => {
    const dictionary = new Dictionary();
    const lexicalRelationships = new LexicalRelationshipStore();
    const lexicalRelationshipProcessor = new LexicalRelationshipProcessor(
      lexicalRelationships,
      new LexicalRelationshipSystemPropertyTensor(),
    );
    await new WordSeeder("en").seedWordNet({ vocabulary: { dictionary, lexicalRelationships, lexicalRelationshipProcessor } });

    const view = new DictionaryView(dictionary, lexicalRelationships, { domainName: "Common" });
    const poodle = dictionary.lookupAll("poodle").find((w) => w.partOfSpeech === PartOfSpeech.NOUN);
    expect(poodle).toBeDefined();

    const result = view.resolveHierarchy({ kind: "HYPERNYM", wordId: poodle!.uuid.value, limit: 200 });
    expect(result.fellBack).toBe(false);
    expect(result.nodes.length).toBeGreaterThan(0);
    // poodle itself is a leaf, not a root -- its own root should be a
    // genuinely broad noun (HYPERNYM_INVERTED handling's own reason for
    // existing: without it, the root would come out as poodle's own
    // most *specific* breed instead). Walking up poodle's own single-
    // inheritance chain (dog -> canine -> ... ) should reach WordNet's
    // own real top-level noun root, "entity".
    const rootWord = result.nodes.find((n) => n.id === result.roots[0]);
    expect(rootWord).toBeDefined();
    expect(rootWord!.lexical_form).toBe("entity");
    // poodle itself must be included, reachable from the ancestor chain.
    expect(result.nodes.map((n) => n.lexical_form)).toContain("poodle");

    // "entity" should also win as the *overall* broadest HYPERNYM root
    // (no wordId) -- the regression check for the "picks the root with
    // the largest total subtree" fix above, against the real corpus:
    // WordNet's own noun taxonomy is almost entirely one connected tree
    // under entity (tens of thousands of nouns), dwarfing even the
    // largest single verb root (HYPERNYM also covers verbs, which have
    // a much shallower, narrower taxonomy overall -- an earlier,
    // direct-child-count-only heuristic picked a broad verb like
    // "change" here instead, this method's own docstring on why).
    const broadestRoot = view.resolveHierarchy({ kind: "HYPERNYM" });
    expect(broadestRoot.fellBack).toBe(false);
    expect(broadestRoot.roots.length).toBe(1);
    const broadestRootWord = broadestRoot.nodes.find((n) => n.id === broadestRoot.roots[0]);
    expect(broadestRootWord?.lexical_form).toBe("entity");
  }, 30000);
});
