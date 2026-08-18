import { describe, expect, it } from "vitest";
import { Dictionary } from "./data/dictionary";
import { LexicalRelationshipStore } from "./data/lexical_relationship_store";
import { LexicalRelationshipSystemPropertyTensor } from "./data/lexical_relationship_tensor";
import { LexicalRelationshipType } from "./data/enums/lexical_relationship_type";
import { PartOfSpeech } from "./data/enums/part_of_speech";
import { antonyms, createWord, holonyms, hypernyms, hyponyms, meronyms, synonyms, validateFormText, validateWordFormAttributes } from "./data/word";
import { AdjectivePosition, createAdjective, isAdjective, validateAdjective } from "./data/adjective";
import { createAdverb, isAdverb, validateAdverb } from "./data/adverb";
import { isConjunction } from "./data/conjunction";
import { createDeterminer, isDeterminer, validateDeterminer } from "./data/determiner";
import { HypernymRootWord } from "./data/enums/hypernym_root_word";
import { isInterjection } from "./data/interjection";
import { NOUN_FORM_PATTERNS, createNoun, isNoun, validateNoun } from "./data/noun";
import { isNumeral } from "./data/numeral";
import { isParticle } from "./data/particle";
import { isPreposition } from "./data/preposition";
import { PRONOUN_FORM_PATTERNS, createPronoun, isPronoun, validatePronoun } from "./data/pronoun";
import { VERB_FORM_PATTERNS, createVerb, isVerb, validateVerb } from "./data/verb";
import { createPhrase } from "./data/phrase";
import { Phrases } from "./data/phrases";
import { PHRASE_TYPE_DETAILS, PhraseType } from "./data/enums/phrase_type";
import { createSense } from "./data/sense";
import { Senses } from "./data/senses";
import { AsyncDictionaryHydrator } from "./role/dictionary_hydrator";
import { DictionaryProcessor } from "./role/dictionary_processor";
import { LexicalRelationshipProcessor } from "./role/lexical_relationship_processor";
import { RelationshipSeeder } from "./role/relationship_seeder";
import { classifyPhraseType, WordSeeder } from "./role/word_seeder";
import { loadWordNetSynsets } from "./role/wordnet_loader";
import { DictionaryView } from "./ui/dictionary_view";

describe("PhraseType", () => {
  it("carries the same six numeric codes, in the same order, as Linguistics' own PhraseType", () => {
    expect(PhraseType.NOUN_PHRASE).toBe(0);
    expect(PhraseType.VERB_PHRASE).toBe(1);
    expect(PhraseType.ADJECTIVE_PHRASE).toBe(2);
    expect(PhraseType.ADVERB_PHRASE).toBe(3);
    expect(PhraseType.PREPOSITIONAL_PHRASE).toBe(4);
    expect(PhraseType.INFINITIVE_PHRASE).toBe(5);
  });

  it("PHRASE_TYPE_DETAILS has a populated definition/structure/example for every PhraseType value", () => {
    const numericValues = Object.values(PhraseType).filter((v): v is number => typeof v === "number");
    for (const value of numericValues) {
      const details = PHRASE_TYPE_DETAILS[value as PhraseType];
      expect(details.definition.length).toBeGreaterThan(0);
      expect(details.structure.length).toBeGreaterThan(0);
      expect(details.example.length).toBeGreaterThan(0);
    }
  });

  it("a Phrase can carry a phraseType, defaulting to undefined when not classified", () => {
    const unclassified = createPhrase({ text: "in spite of", partOfSpeech: PartOfSpeech.PREPOSITION });
    expect(unclassified.phraseType).toBeUndefined();

    const classified = createPhrase({
      text: "the intelligent system",
      partOfSpeech: PartOfSpeech.NOUN,
      phraseType: PhraseType.NOUN_PHRASE,
    });
    expect(classified.phraseType).toBe(PhraseType.NOUN_PHRASE);
  });
});

describe("classifyPhraseType", () => {
  const verbLemmas = new Set(["be", "begin", "boot", "date", "advantage"]);

  it("maps NOUN/VERB straight to NOUN_PHRASE/VERB_PHRASE, even when the lemma opens with a preposition-lookalike word", () => {
    // "down payment"/"near miss" are compound nouns (down/near modify
    // the head noun), not prepositional phrases -- the real reason
    // classifyPhraseType never applies the preposition check to NOUN.
    expect(classifyPhraseType("down payment", PartOfSpeech.NOUN, verbLemmas)).toBe(PhraseType.NOUN_PHRASE);
    expect(classifyPhraseType("toy poodle", PartOfSpeech.NOUN, verbLemmas)).toBe(PhraseType.NOUN_PHRASE);
    // "abide by"/"out in" are phrasal verbs -- still verb-headed.
    expect(classifyPhraseType("abide by", PartOfSpeech.VERB, verbLemmas)).toBe(PhraseType.VERB_PHRASE);
    expect(classifyPhraseType("out in", PartOfSpeech.VERB, verbLemmas)).toBe(PhraseType.VERB_PHRASE);
  });

  it("reclassifies an ADJECTIVE/ADVERB lemma opening with a preposition as PREPOSITIONAL_PHRASE", () => {
    expect(classifyPhraseType("at fault", PartOfSpeech.ADJECTIVE, verbLemmas)).toBe(PhraseType.PREPOSITIONAL_PHRASE);
    expect(classifyPhraseType("out of print", PartOfSpeech.ADJECTIVE, verbLemmas)).toBe(PhraseType.PREPOSITIONAL_PHRASE);
    expect(classifyPhraseType("by hand", PartOfSpeech.ADVERB, verbLemmas)).toBe(PhraseType.PREPOSITIONAL_PHRASE);
    expect(classifyPhraseType("in the meantime", PartOfSpeech.ADVERB, verbLemmas)).toBe(PhraseType.PREPOSITIONAL_PHRASE);
  });

  it("falls back to the plain POS-based mapping for ADJECTIVE/ADVERB lemmas that don't open with a preposition", () => {
    expect(classifyPhraseType("Central American", PartOfSpeech.ADJECTIVE, verbLemmas)).toBe(PhraseType.ADJECTIVE_PHRASE);
    expect(classifyPhraseType("a lot", PartOfSpeech.ADVERB, verbLemmas)).toBe(PhraseType.ADVERB_PHRASE);
  });

  it("recognises a genuine infinitive (\"to\" + a real verb lemma) as INFINITIVE_PHRASE, ahead of the preposition check", () => {
    expect(classifyPhraseType("to be sure", PartOfSpeech.ADVERB, verbLemmas)).toBe(PhraseType.INFINITIVE_PHRASE);
    expect(classifyPhraseType("to begin with", PartOfSpeech.ADVERB, verbLemmas)).toBe(PhraseType.INFINITIVE_PHRASE);
  });

  it("does not mistake 'to' + a non-verb, or a denylisted to-lookalike, for an infinitive -- both fall through to PREPOSITIONAL_PHRASE", () => {
    // "a" isn't a verb -- "to a fault"/"to a T" are prepositional, not infinitival.
    expect(classifyPhraseType("to a fault", PartOfSpeech.ADVERB, verbLemmas)).toBe(PhraseType.PREPOSITIONAL_PHRASE);
    // "date"/"boot"/"advantage" ARE real WordNet verbs, but these three
    // specific lemmas are denylisted -- "to date"/"to boot"/"to
    // advantage" use "to" as a preposition, not an infinitive marker.
    expect(classifyPhraseType("to date", PartOfSpeech.ADVERB, verbLemmas)).toBe(PhraseType.PREPOSITIONAL_PHRASE);
    expect(classifyPhraseType("to boot", PartOfSpeech.ADVERB, verbLemmas)).toBe(PhraseType.PREPOSITIONAL_PHRASE);
    expect(classifyPhraseType("to advantage", PartOfSpeech.ADVERB, verbLemmas)).toBe(PhraseType.PREPOSITIONAL_PHRASE);
  });
});

describe("validateFormText (word.ts) -- the mechanism every POS class's own validate<Class>() reuses", () => {
  it("treats an unset formats as always valid -- no claim made, nothing to check", () => {
    expect(validateFormText("pluralNumberForm", { value: "dogs" }, NOUN_FORM_PATTERNS.pluralNumberForm)).toBeUndefined();
  });

  it("accepts a recognised pattern that actually matches the value", () => {
    expect(
      validateFormText("pluralNumberForm", { value: "dogs", formats: ["/s$/i"] }, NOUN_FORM_PATTERNS.pluralNumberForm),
    ).toBeUndefined();
  });

  it("flags a recognised pattern that does not match the value", () => {
    const issue = validateFormText("pluralNumberForm", { value: "dog", formats: ["/s$/i"] }, NOUN_FORM_PATTERNS.pluralNumberForm);
    expect(issue?.reason).toContain("does not match its own claimed format");
  });

  it("flags a format string that isn't a recognised String Pattern for that field", () => {
    // /ed$/i is a real pattern -- just not one of Noun.pluralNumberForm's own.
    const issue = validateFormText("pluralNumberForm", { value: "walked", formats: ["/ed$/i"] }, NOUN_FORM_PATTERNS.pluralNumberForm);
    expect(issue?.reason).toContain("is not a recognised String Pattern");
  });

  it("flags any claimed format on a field the matrix marks fully N/A (empty pattern array)", () => {
    const issue = validateFormText("baseLemmaCanonicalForm", { value: "dog", formats: ["/s$/i"] }, []);
    expect(issue?.reason).toContain("is not a recognised String Pattern");
  });

  it("scopes patterns per (class, field), not just per field name -- Noun's own apostrophe rule is not valid on Pronoun's identically-named field", () => {
    // Noun.possessiveCaseForm genuinely accepts this (the apostrophe rule).
    expect(
      validateFormText("possessiveCaseForm", { value: "dog's", formats: ["/'s$/i"] }, NOUN_FORM_PATTERNS.possessiveCaseForm),
    ).toBeUndefined();
    // Pronoun.possessiveCaseForm only recognises the closed fixed-word
    // lookup (rule #3) -- the apostrophe rule is Noun's own case, not
    // Pronoun's (pronoun.ts's own docstring).
    const issue = validateFormText("possessiveCaseForm", { value: "dog's", formats: ["/'s$/i"] }, PRONOUN_FORM_PATTERNS.possessiveCaseForm);
    expect(issue?.reason).toContain("is not a recognised String Pattern");
  });

  it("recognises the doubled-final-consonant pattern (Past Tense Form rule #4)", () => {
    expect(
      validateFormText("pastTenseForm", { value: "stopped", formats: ["/([bcdfghjklmnpqrstvwxyz])\\1ed$/i"] }, VERB_FORM_PATTERNS.pastTenseForm),
    ).toBeUndefined();
  });
});

describe("validate<Class>() -- each POS class's own attribute validation", () => {
  it("returns no issues for a Word with nothing populated", () => {
    expect(validateNoun(createNoun({ text: "dog" }))).toEqual([]);
  });

  it("returns no issues when every populated field's formats are internally consistent", () => {
    const dog = createNoun({
      text: "dog",
      pluralNumberForm: { value: "dogs", formats: ["/s$/i"] },
      possessiveCaseForm: { value: "dog's", formats: ["/'s$/i"] },
    });
    expect(validateNoun(dog)).toEqual([]);
  });

  it("collects every issue found, not just the first", () => {
    const dog = createNoun({
      text: "dog",
      pluralNumberForm: { value: "dog", formats: ["/s$/i"] }, // value doesn't match
      possessiveCaseForm: { value: "dog's", formats: ["/self$/i"] }, // unrecognised pattern for this field
    });
    const issues = validateNoun(dog);
    expect(issues).toHaveLength(2);
    expect(issues.map((i) => i.field)).toEqual(["pluralNumberForm", "possessiveCaseForm"]);
  });

  it("checks a Verb's own fields, including the fully-regex-derivable Present Participle Form", () => {
    const run = createVerb({ text: "run", presentParticipleForm: { value: "running", formats: ["/([bcdfghjklmnpqrstvwxyz])\\1ing$/i"] } });
    expect(validateVerb(run)).toEqual([]);

    const badRun = createVerb({ text: "run", presentParticipleForm: { value: "runing", formats: ["/([bcdfghjklmnpqrstvwxyz])\\1ing$/i"] } });
    expect(validateVerb(badRun)).toHaveLength(1);
  });

  it("checks an Adjective's degree forms", () => {
    const big = createAdjective({ text: "big", comparativeDegreeForm: { value: "bigger", formats: ["/([bcdfghjklmnpqrstvwxyz])\\1er$/i"] } });
    expect(validateAdjective(big)).toEqual([]);
  });

  it("checks a Pronoun's own closed fixed-word-lookup fields", () => {
    const she = createPronoun({ text: "she", subjectiveCaseForm: { value: "she", formats: ["/^(I|we|you|he|she|it|they)$/i"] } });
    expect(validatePronoun(she)).toEqual([]);

    const badShe = createPronoun({ text: "she", subjectiveCaseForm: { value: "her", formats: ["/^(I|we|you|he|she|it|they)$/i"] } });
    expect(validatePronoun(badShe)).toHaveLength(1);
  });

  it("checks a Determiner's own possessive field, scoped to only the fixed-word rule", () => {
    const their = createDeterminer({ text: "their", possessiveCaseForm: { value: "their", formats: ["/^(my|mine|your|yours|his|her|hers|its|our|ours|their|theirs)$/i"] } });
    expect(validateDeterminer(their)).toEqual([]);
  });

  it("checks Word.baseLemmaCanonicalForm regardless of POS subtype, via validateWordFormAttributes shared through every validate<Class>()", () => {
    const dog = createNoun({ text: "dog", baseLemmaCanonicalForm: { value: "dog", formats: ["/s$/i"] } });
    expect(validateWordFormAttributes(dog)).toHaveLength(1);
    expect(validateNoun(dog)).toHaveLength(1);
  });

  it("checks an Adverb's degree forms the same way as Adjective's", () => {
    const fast = createAdverb({ text: "fast", superlativeDegreeForm: { value: "fastest", formats: ["/est$/i"] } });
    expect(validateAdverb(fast)).toEqual([]);
  });
});

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
    const processor = new DictionaryProcessor(dictionary, new Phrases(), new AsyncDictionaryHydrator(dictionary), "Common");

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
    const processor = new DictionaryProcessor(dictionary, new Phrases(), hydrator, "Common");

    const result = processor.identifyPhrase(["the", "cat", "sat"], 1);

    expect(result.tokenSpan).toBe(1);
    expect(result.candidates[0].word?.text).toBe("cat");
  });

  it("never mistakes an unmatched shorter span (\"in spite\") for a candidate of its own", () => {
    const dictionary = new Dictionary();
    dictionary.append(createWord({ text: "spite", partOfSpeech: PartOfSpeech.NOUN }));
    dictionary.append(createWord({ text: "in spite of", partOfSpeech: PartOfSpeech.PREPOSITION }));
    const processor = new DictionaryProcessor(dictionary, new Phrases(), new AsyncDictionaryHydrator(dictionary), "Common");

    // "in spite" (2 tokens) matches nothing on its own -- only the full
    // 3-token "in spite of" is seeded -- so the longest-match search
    // must skip straight past it to the 3-token span, not settle for a
    // false positive on the shorter one.
    const result = processor.identifyPhrase(["standing", "in", "spite", "of", "warnings"], 1);
    expect(result.tokenSpan).toBe(3);
    expect(result.candidates[0].word?.text).toBe("in spite of");
  });

  it("resolves \"in spite of\" as one PREPOSITION span against the real bundled Common Vocabulary Cache -- now via Phrases, not a multi-word Word", () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    new WordSeeder("en").seedClosedClassWords(dictionary, phraseBook);
    // "in spite of" is a Phrase now, not a Word (Phrase's own docstring,
    // data/phrase.ts) -- Dictionary itself never sees it.
    expect(dictionary.lookupAll("in spite of")).toHaveLength(0);
    expect(phraseBook.lookupAll("in spite of").some((p) => p.partOfSpeech === PartOfSpeech.PREPOSITION)).toBe(true);
    const processor = new DictionaryProcessor(dictionary, phraseBook, new AsyncDictionaryHydrator(dictionary), "Common");

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
    const domain = { vocabulary: { dictionary, phrases: new Phrases() } };

    const first = seeder.seedDomain(domain);
    const second = seeder.seedDomain(domain);

    expect(first).toBeGreaterThan(300);
    expect(second).toBe(0);
    expect(dictionary.lookup("the")?.partOfSpeech).toBe(PartOfSpeech.DETERMINER);
  });

  it("wires the real Common Vocabulary Cache's nested lemma groups into the seeded Dictionary's lemma index", () => {
    const dictionary = new Dictionary();
    new WordSeeder("en").seedClosedClassWords(dictionary, new Phrases());

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

  it("seedClosedClassWords({ excludeOpenClasses: true }) skips every NOUN/VERB/ADJECTIVE/ADVERB cache entry except root_words.json's own curated root-word table", () => {
    const dictionary = new Dictionary();
    new WordSeeder("en").seedClosedClassWords(dictionary, new Phrases(), { excludeOpenClasses: true });

    // promoted_words.json is entirely NOUN/VERB/ADJECTIVE/ADVERB --
    // WordSeeder.seedWordNet is now this prototype's source of truth for
    // those four open classes, so none of it should be seeded here.
    // "measure"/VERB and "big"/ADJECTIVE are both real promoted_words.json
    // entries.
    expect(dictionary.lookupAll("measure").some((w) => w.partOfSpeech === PartOfSpeech.VERB)).toBe(false);
    expect(dictionary.lookupAll("big").some((w) => w.partOfSpeech === PartOfSpeech.ADJECTIVE)).toBe(false);

    // metalinguistic_nouns.json's "word"/NOUN is likewise skipped.
    expect(dictionary.lookupAll("word").some((w) => w.partOfSpeech === PartOfSpeech.NOUN)).toBe(false);

    // root_words.json's own 25 NOUN entries are the one carve-out --
    // isRootWord/hypernymRootWord and friends have no other seeding path.
    const entity = dictionary.lookupAll("entity").find((w) => w.partOfSpeech === PartOfSpeech.NOUN);
    expect(entity).toBeDefined();
    expect(entity?.isRootWord).toBe(true);
    expect(entity?.hypernymRootWord).toBe(HypernymRootWord.ENTITY);
    expect(entity?.domainTag?.value).toBe("root_word.common");

    // Every other closed class is unaffected.
    expect(dictionary.lookup("the")?.partOfSpeech).toBe(PartOfSpeech.DETERMINER);
    expect(dictionary.lookup("she")?.partOfSpeech).toBe(PartOfSpeech.PRONOUN);

    // Without the option (the default), the same open-class words ARE
    // seeded -- every other caller (Linguistics' own test fixtures in
    // particular) is completely unaffected by this option's existence.
    const unrestricted = new Dictionary();
    new WordSeeder("en").seedClosedClassWords(unrestricted, new Phrases());
    expect(unrestricted.lookupAll("measure").some((w) => w.partOfSpeech === PartOfSpeech.VERB)).toBe(true);
  });

  it("seeds every closed class through its own Word Form to Part of Speech Matrix subtype (Pronoun, Determiner, Preposition, Conjunction, Interjection, Numeral, Particle)", () => {
    const dictionary = new Dictionary();
    new WordSeeder("en").seedClosedClassWords(dictionary, new Phrases());

    expect(isPronoun(dictionary.lookup("she")!)).toBe(true);
    expect(isDeterminer(dictionary.lookup("the")!)).toBe(true);
    expect(isPreposition(dictionary.lookup("in")!)).toBe(true);
    expect(isConjunction(dictionary.lookup("and")!)).toBe(true);
    expect(isInterjection(dictionary.lookup("yes")!)).toBe(true);
    // "one" is a deliberate homograph -- pronouns.json's own indefinite
    // PRONOUN sense loads first and stays Dictionary.lookup()'s default
    // (word_seeder.ts's own numerals.json comment), so the NUMERAL sense
    // has to be found via lookupAll(), not lookup().
    expect(isNumeral(dictionary.lookupAll("one").find((w) => w.partOfSpeech === PartOfSpeech.NUMERAL)!)).toBe(true);
    expect(isParticle(dictionary.lookup("not")!)).toBe(true);

    // A subtype's own fields are real, assignable Text fields -- not
    // populated by this seeding path (none of the Common Vocabulary
    // Cache's own JSON schemas carry them), but present and undefined,
    // exactly like Noun.isCountable/Verb.frames for a non-WordNet Word.
    const she = dictionary.lookup("she");
    if (!isPronoun(she!)) throw new Error("unreachable");
    expect(she.subjectiveCaseForm).toBeUndefined();
    expect(she.baseLemmaCanonicalForm).toBeUndefined();
  });

  it("gives every hand-curated Word/Phrase its own unique Sense, carrying its domainTag/relatedDomainTags, when a Senses is supplied", () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    const senseStore = new Senses();
    const seeder = new WordSeeder("en");
    const domain = { vocabulary: { dictionary, phrases: phraseBook, senses: senseStore } };

    const first = seeder.seedDomain(domain, { excludeOpenClasses: true });
    expect(first).toBeGreaterThan(0);

    // root_words.json's own "entity" carries a real domainTag
    // ("root_word.common"), a real definition, and isRootWord/
    // hypernymRootWord -- its own Sense (word_seeder.ts's own
    // registerUniqueSense) must carry all of it, since
    // DictionaryView.senseFieldsFor()/isRootWordFor() now prefer the
    // Sense over the Word directly once a senseId is present.
    const entity = dictionary.lookupAll("entity").find((w) => w.partOfSpeech === PartOfSpeech.NOUN);
    expect(entity).toBeDefined();
    expect(entity?.senseId).toBeDefined();
    const entitySense = senseStore.findByUuid(entity!.senseId!.value);
    expect(entitySense).toBeDefined();
    expect(entitySense?.domainTag?.value).toBe("root_word.common");
    expect(entitySense?.isCommon).toBe(true);
    expect(entitySense?.definition?.value).toBe(entity?.definition?.value);
    expect(entitySense?.isRootWord).toBe(true);
    expect(entitySense?.hypernymRootWord).toBe(HypernymRootWord.ENTITY);

    // "she" (pronouns.json, no domainTag/root-word status of its own)
    // gets its own distinct Sense too -- one per entry, never shared,
    // unlike WordNet's own per-synset Sense (registerUniqueSense's own
    // docstring) -- and isRootWord correctly comes back false, not
    // merely undefined, for an ordinary closed-class Word's own Sense.
    const she = dictionary.lookup("she");
    expect(she?.senseId).toBeDefined();
    expect(she!.senseId!.value).not.toBe(entity!.senseId!.value);
    expect(senseStore.membersOf(she!.senseId!.value)).toEqual([she]);
    expect(senseStore.findByUuid(she!.senseId!.value)?.isRootWord).toBe(false);

    // A Phrase gets one too, same as a Word -- but never a root-word
    // one, since Phrase has no such concept at all (registerUniqueSense's
    // own docstring).
    const eachOther = phraseBook.lookup("each other");
    expect(eachOther?.senseId).toBeDefined();
    const eachOtherSense = senseStore.findByUuid(eachOther!.senseId!.value);
    expect(eachOtherSense).toBeDefined();
    expect(eachOtherSense?.isRootWord).toBe(false);

    expect(senseStore.totalEntries()).toBe(dictionary.totalEntries() + phraseBook.totalEntries());

    // Idempotent: re-seeding neither duplicates Senses nor reassigns
    // already-registered ones.
    const second = seeder.seedDomain(domain, { excludeOpenClasses: true });
    expect(second).toBe(0);
    expect(senseStore.totalEntries()).toBe(dictionary.totalEntries() + phraseBook.totalEntries());
    expect(dictionary.lookupAll("entity").find((w) => w.partOfSpeech === PartOfSpeech.NOUN)?.senseId?.value).toBe(
      entity!.senseId!.value,
    );
  });

  it("seeds every multi-word closed-class entry as a Phrase, not a multi-word Word", () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    new WordSeeder("en").seedClosedClassWords(dictionary, phraseBook);

    // "each other" (pronouns.json) and "in spite of" (prepositions.json)
    // are both real multi-word Common Vocabulary Cache entries -- both
    // should land in the Phrases, neither in the Dictionary.
    expect(dictionary.lookupAll("each other")).toHaveLength(0);
    expect(dictionary.lookupAll("in spite of")).toHaveLength(0);
    const eachOther = phraseBook.lookup("each other");
    expect(eachOther?.partOfSpeech).toBe(PartOfSpeech.PRONOUN);
    const inSpiteOf = phraseBook.lookup("in spite of");
    expect(inSpiteOf?.partOfSpeech).toBe(PartOfSpeech.PREPOSITION);

    // Dictionary itself never saw a multi-word Word (seedClosedClassWords
    // alone is under test here, not seedWordNet -- a WordNet multi-word
    // lemma like "toy poodle" is a Phrase too, word_seeder.ts's own
    // seedWordNet), so its own phrase-span tracking stays at its
    // empty-Dictionary default.
    expect(dictionary.phraseSpanLimit).toBe(1);
    expect(phraseBook.spanLimit).toBeGreaterThanOrEqual(3); // "in spite of"
    expect(phraseBook.totalEntries()).toBeGreaterThan(0);

    // Idempotent, the same way seedClosedClassWords itself already is --
    // re-seeding against the same (dictionary, phraseBook) pair adds
    // nothing new, Phrases included.
    const totalBefore = phraseBook.totalEntries();
    const second = new WordSeeder("en").seedClosedClassWords(dictionary, phraseBook);
    expect(second).toBe(0);
    expect(phraseBook.totalEntries()).toBe(totalBefore);
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
    const phraseBook = new Phrases();
    const senseStore = new Senses();
    const lexicalRelationships = new LexicalRelationshipStore();
    const lexicalRelationshipProcessor = new LexicalRelationshipProcessor(
      lexicalRelationships,
      new LexicalRelationshipSystemPropertyTensor(),
    );
    const seeder = new WordSeeder("en");
    const domain = { vocabulary: { dictionary, phrases: phraseBook, senses: senseStore, lexicalRelationships, lexicalRelationshipProcessor } };

    const first = await seeder.seedWordNet(domain);
    expect(first.wordsSeeded).toBeGreaterThan(100000);
    // Far smaller than an earlier version of this assertion
    // (~700,000-900,000): SYNONYM is no longer stored as an edge at all
    // (Senses.registerMember()'s own docstring -- WordSeeder's own
    // pass 1 relies on shared senseId alone), and a synset-wide Lexical
    // Semantic fact (HYPERNYM, MERONYM, ANTONYM, ...) collapses to one
    // Sense-to-Sense edge instead of a member x member cross product
    // (WordSeeder.seedPointerRelationship's own docstring) -- the whole
    // point of both changes. A lexical (word-specific) pointer
    // occurrence, and every Morphological/Orthographic-group kind, are
    // unaffected and still store one edge per member pair, which is why
    // this is a real reduction, not a collapse to "one edge per kind".
    expect(first.relationshipsSeeded).toBeGreaterThan(150000);
    expect(first.relationshipsSeeded).toBeLessThan(300000);
    // wordsSeeded counts Words and multi-word Phrases together
    // (word_seeder.ts's own seedWordNet docstring on isMultiWordLemma) --
    // same combined-count convention seedClosedClassWords already uses.
    expect(dictionary.totalEntries() + phraseBook.totalEntries()).toBe(first.wordsSeeded);
    expect(phraseBook.totalEntries()).toBeGreaterThan(0);
    expect(lexicalRelationships.totalRelationships()).toBe(first.relationshipsSeeded);
    // One Sense per synset (Sense's own docstring) -- close to, but not
    // necessarily exactly, WordNet 3.1's own ~117,800 synset count (a
    // synset with every lemma empty, if one ever existed, would seed no
    // Sense at all -- none do in the bundled data, but this only
    // asserts the real order of magnitude, not the exact figure).
    expect(first.sensesSeeded).toBeGreaterThan(100000);
    expect(senseStore.totalEntries()).toBe(first.sensesSeeded);

    const big = dictionary
      .lookupAll("big")
      .find((word) => word.partOfSpeech === PartOfSpeech.ADJECTIVE && word.synsetId?.value === "01385012-a");
    expect(big).toBeDefined();
    expect(big?.isCommon).toBe(true);
    expect(big?.synsetId?.schemeId).toBe("wn31");
    expect(synonyms(big!, lexicalRelationships, dictionary, undefined, senseStore).map((w) => w.text)).toEqual(["large"]);

    // "big" and "large" are the same Sense (Sense's own docstring on
    // why this is the point of the class -- a shared meaning, not a
    // duplicated copy of one per member), resolvable via the Word's own
    // new senseId reference.
    const large = dictionary
      .lookupAll("large")
      .find((word) => word.partOfSpeech === PartOfSpeech.ADJECTIVE && word.synsetId?.value === "01385012-a");
    expect(large).toBeDefined();
    expect(big?.senseId).toBeDefined();
    expect(large?.senseId?.value).toBe(big?.senseId?.value);
    const bigSense = senseStore.findByUuid(big!.senseId!.value);
    expect(bigSense).toBeDefined();
    expect(bigSense?.synsetId?.value).toBe("01385012-a");
    expect(bigSense?.definition?.value).toContain("above average in size");
    expect(bigSense?.isCommon).toBe(true);

    // 00001930-n "physical entity" -- HYPERNYM -> 00001740-n "entity".
    // A multi-word lemma, so it seeded as a Phrase, not a Word
    // (word_seeder.ts's own isMultiWordLemma() split) -- still wired
    // into the HYPERNYM graph exactly like a single-word synset member,
    // so hypernyms() resolves it as its own subject directly.
    const physicalEntity = phraseBook
      .lookupAll("physical entity")
      .find((phrase) => phrase.synsetId?.value === "00001930-n");
    expect(physicalEntity).toBeDefined();
    expect(hypernyms(physicalEntity!, lexicalRelationships, dictionary, undefined, senseStore).map((w) => w.text)).toEqual(["entity"]);
    // The reciprocal direction resolves too, off the identical stored
    // edge (hyponyms()'s own docstring) -- "entity" is never told apart
    // from "physical entity" by a second, separately-stored HYPONYM edge.
    // Resolving the Phrase-typed hyponym back into a displayable Word
    // needs the phraseBook fallback (relatedWords()'s own docstring,
    // word.ts) -- the whole point of this test.
    const entity = dictionary.lookupAll("entity").find((word) => word.synsetId?.value === "00001740-n");
    expect(entity).toBeDefined();
    expect(hyponyms(entity!, lexicalRelationships, dictionary, phraseBook, senseStore).map((w) => w.text)).toContain("physical entity");

    // 00001740-a "able" -- ANTONYM -> 00002098-a "unable" (both
    // directions -- antonyms() itself reads direction="both").
    const able = dictionary.lookupAll("able").find((word) => word.synsetId?.value === "00001740-a");
    expect(able).toBeDefined();
    expect(antonyms(able!, lexicalRelationships, dictionary, undefined, senseStore).map((w) => w.text)).toEqual(["unable"]);
    const unable = dictionary.lookupAll("unable").find((word) => word.synsetId?.value === "00002098-a");
    expect(antonyms(unable!, lexicalRelationships, dictionary, undefined, senseStore).map((w) => w.text)).toEqual(["able"]);
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
      LexicalRelationshipType.MERONYM,
      LexicalRelationshipType.ALSO_SEE,
      LexicalRelationshipType.VERB_GROUP,
      LexicalRelationshipType.ATTRIBUTE,
      LexicalRelationshipType.REGION_DOMAIN,
      LexicalRelationshipType.USAGE_DOMAIN,
    ]) {
      expect(seenKinds.has(kind), `expected at least one ${LexicalRelationshipType[kind]} edge`).toBe(true);
    }
    // HYPONYM/TROPONYM/HOLONYM are never seeded at all --
    // relationshipKindForPointer canonicalizes their own WordNet pointer
    // symbols onto their complementary kind instead (this is the fix
    // itself, not an implementation detail: a word's own relationship
    // list no longer shows both "X is a type of Y" and the reciprocal "Y
    // has hyponym X" as two separate entries for the identical fact --
    // MERONYM/HOLONYM's own docstring, lexical_relationship_type.ts, on
    // why a WordNet part/member/substance fact is one MERONYM edge with
    // a qualifier, not three separate kinds each with their own never-
    // seeded xHOLONYM complement). TOPIC_DOMAIN is never seeded either,
    // for a different reason: seedPointerRelationship intercepts `;c`/
    // `-c` pointers and tags the word itself (domainTag/relatedDomainTags)
    // instead of creating an edge (see the dedicated "topic-domain
    // pointers" test below). Instance-of (`@i`/`~i`) is never seeded
    // either -- relationshipKindForPointer's own docstring on why
    // LexicalRelationshipType's INSTANCE_HYPERNYM/INSTANCE_HYPONYM
    // ordinals are retired rather than populated -- so seenKinds can
    // never contain them at all (no enum member left to even ask about).
    for (const kind of [
      LexicalRelationshipType.HYPONYM,
      LexicalRelationshipType.TROPONYM,
      LexicalRelationshipType.HOLONYM,
      LexicalRelationshipType.TOPIC_DOMAIN,
    ]) {
      expect(seenKinds.has(kind), `expected no ${LexicalRelationshipType[kind]} edges at all`).toBe(false);
    }

    // The part/member/substance distinction WordNet itself draws is
    // recorded as a `meronymKind` qualifier on the shared MERONYM kind,
    // not three separate relationship kinds (MERONYM's own docstring) --
    // every seeded MERONYM edge should carry exactly one.
    const meronymEdges = lexicalRelationships.all().filter((r) => r.relationshipType === LexicalRelationshipType.MERONYM);
    expect(meronymEdges.length).toBeGreaterThan(0);
    const seenMeronymKinds = new Set(
      meronymEdges.map((r) => r.qualifiers.find((q) => q.name.value === "meronymKind")?.value.value),
    );
    expect(seenMeronymKinds).toEqual(new Set(["part", "member", "substance"]));

    // MERONYM's own stored direction is (part, MERONYM, whole) --
    // relationshipKindForPointer's own docstring, and the Common
    // Vocabulary Cache's own documented convention (assets/common/en/
    // relationships/README.md: "member --MERONYM--> group") -- a real
    // regression check against getting `%p`/`#p`'s own swap backwards
    // (easy to get wrong: `%p` sits on the *whole*'s own synset,
    // pointing at the part, the mirror image of `@`/hypernym). Verified
    // directly against the bundled dict/data.noun: "hand" (05572223)
    // carries `%p` -> "finger" (05574137); "finger" carries `#p` ->
    // "hand" back.
    const hand = dictionary.lookupAll("hand").find((word) => word.synsetId?.value === "05572223-n");
    const finger = dictionary.lookupAll("finger").find((word) => word.synsetId?.value === "05574137-n");
    expect(hand).toBeDefined();
    expect(finger).toBeDefined();
    // The `%p`/`#p` pointer between "hand" and "finger" is synset-wide
    // (both indices 0), so it's stored as a single Sense-to-Sense edge,
    // not directly between the two Words (WordSeeder.seedPointerRelationship's
    // own docstring, this file's own WordNet-relationship-migration
    // tests above) -- checked at the Sense level here for that reason.
    const handSense = senseStore.findByUuid(hand!.senseId!.value);
    const fingerSense = senseStore.findByUuid(finger!.senseId!.value);
    expect(handSense).toBeDefined();
    expect(fingerSense).toBeDefined();
    const handFingerEdge = lexicalRelationships
      .all()
      .find(
        (r) =>
          r.relationshipType === LexicalRelationshipType.MERONYM &&
          ((r.sourceWordId.value === handSense!.uuid.value && r.targetWordId.value === fingerSense!.uuid.value) ||
            (r.sourceWordId.value === fingerSense!.uuid.value && r.targetWordId.value === handSense!.uuid.value)),
      );
    expect(handFingerEdge).toBeDefined();
    expect(handFingerEdge?.sourceWordId.value).toBe(fingerSense!.uuid.value);
    expect(handFingerEdge?.targetWordId.value).toBe(handSense!.uuid.value);
    // meronyms()/holonyms() (word.ts) already expand a Sense-to-Sense
    // edge back out to its member Words on read (relatedWords()'s own
    // senseStore-aware branch) -- reading that same stored direction
    // from opposite ends: "hand"'s meronyms are its own parts (finger
    // among them); "finger"'s holonyms are the wholes it's part of
    // (hand among them).
    expect(meronyms(hand!, lexicalRelationships, dictionary, undefined, senseStore).map((w) => w.text)).toContain("finger");
    expect(holonyms(finger!, lexicalRelationships, dictionary, undefined, senseStore).map((w) => w.text)).toContain("hand");
    // And not the other way around -- "finger"'s own meronyms don't
    // include "hand" (finger isn't made of hands), nor does "hand"
    // holonym-wise claim to be part of "finger".
    expect(meronyms(finger!, lexicalRelationships, dictionary, undefined, senseStore).map((w) => w.text)).not.toContain("hand");
    expect(holonyms(hand!, lexicalRelationships, dictionary, undefined, senseStore).map((w) => w.text)).not.toContain("finger");

    // Instance-of (`@i`/`~i`) pointers are never seeded at all --
    // relationshipKindForPointer's own docstring on why (word_seeder.ts).
    // "Hegira" is a real, direct instance of "flight"/"escape" in the
    // bundled data (dict/data.noun's own 00061368-n `@i` -> 00059563-n),
    // so no relationship of any kind should exist between the two Words.
    const hegira = dictionary.lookupAll("Hegira").find((word) => word.synsetId?.value === "00061368-n");
    const flight = dictionary.lookupAll("flight").find((word) => word.synsetId?.value === "00059563-n");
    expect(hegira).toBeDefined();
    expect(flight).toBeDefined();
    const hegiraFlightEdges = [
      ...lexicalRelationships.outgoing(hegira!.uuid.value),
      ...lexicalRelationships.incoming(hegira!.uuid.value),
    ].filter((r) => r.sourceWordId.value === flight!.uuid.value || r.targetWordId.value === flight!.uuid.value);
    expect(hegiraFlightEdges).toEqual([]);

    // Topic-domain pointers (`;c`/`-c`) tag the shared Sense now, once
    // per synset-wide pointer, not the word itself (word_seeder.ts's own
    // applyDomainTag/tagTopicDomain docstrings) -- "infusion" (dict/data.noun
    // offset 00324358) carries exactly one topic pointer, to the
    // "medicine" (medical_specialty) category.
    const infusion = dictionary.lookupAll("infusion").find((word) => word.synsetId?.value === "00324358-n");
    expect(infusion).toBeDefined();
    const infusionSense = senseStore.findByUuid(infusion!.senseId!.value);
    expect(infusionSense?.domainTag?.value).toBe("medicine");
    expect(infusionSense?.relatedDomainTags).toEqual([]);

    // "winger" (offset 10802147) carries FOUR topic pointers -- it's a
    // wing position in soccer, field hockey, rugby, AND football. None
    // should be lost: exactly one becomes domainTag (first-wins), the
    // other three land in relatedDomainTags, with no duplicates -- same
    // outcome whether a given (word, category) fact is discovered via
    // winger's own `;c` pointer or via the category synset's reciprocal
    // `-c` pointer back to winger.
    const winger = dictionary.lookupAll("winger").find((word) => word.synsetId?.value === "10802147-n");
    expect(winger).toBeDefined();
    const wingerSense = senseStore.findByUuid(winger!.senseId!.value);
    expect(wingerSense?.domainTag).toBeDefined();
    const wingerDomains = [wingerSense!.domainTag!.value, ...wingerSense!.relatedDomainTags.map((tag) => tag.value)];
    expect(wingerDomains).toHaveLength(4);
    expect(new Set(wingerDomains).size).toBe(4);
    expect(new Set(wingerDomains)).toEqual(new Set(["soccer", "field hockey", "rugby", "football"]));

    // Re-seeding the same Domain neither duplicates Words nor
    // recreates any relationship, of any kind -- nor does it disturb or
    // duplicate any already-assigned domainTag/relatedDomainTags.
    const second = await seeder.seedWordNet(domain);
    expect(second.wordsSeeded).toBe(0);
    expect(second.sensesSeeded).toBe(0);
    expect(second.relationshipsSeeded).toBe(0);
    expect(dictionary.totalEntries() + phraseBook.totalEntries()).toBe(first.wordsSeeded);
    expect(senseStore.totalEntries()).toBe(first.sensesSeeded);
    expect(infusionSense?.domainTag?.value).toBe("medicine");
    expect(new Set([wingerSense!.domainTag!.value, ...wingerSense!.relatedDomainTags.map((tag) => tag.value)])).toEqual(
      new Set(["soccer", "field hockey", "rugby", "football"]),
    );
    expect(lexicalRelationships.totalRelationships()).toBe(first.relationshipsSeeded);
    // Re-seeding never disturbs an already-assigned senseId either --
    // "big"/"large" still share the identical Sense they did before.
    expect(dictionary.lookupAll("big").find((w) => w.synsetId?.value === "01385012-a")?.senseId?.value).toBe(
      bigSense!.uuid.value,
    );
  }, 60000);

  it("a word's own relationships never show both a hypernym/hyponym (or antonym/meronym/...) fact and its reciprocal listing as two separate entries", async () => {
    const dictionary = new Dictionary();
    const senseStore = new Senses();
    const lexicalRelationships = new LexicalRelationshipStore();
    const lexicalRelationshipProcessor = new LexicalRelationshipProcessor(
      lexicalRelationships,
      new LexicalRelationshipSystemPropertyTensor(),
    );
    await new WordSeeder("en").seedWordNet({ vocabulary: { dictionary, phrases: new Phrases(), senses: senseStore, lexicalRelationships, lexicalRelationshipProcessor } });

    const dog = dictionary.lookupAll("dog").find((w) => w.partOfSpeech === PartOfSpeech.NOUN && w.synsetId?.value === "02086723-n");
    expect(dog).toBeDefined();

    // Both directions still resolve correctly (dog has real hypernyms
    // -- canine/canid/domestic animal -- and real hyponyms -- poodle,
    // among many others) ...
    const dogHypernyms = hypernyms(dog!, lexicalRelationships, dictionary, undefined, senseStore).map((w) => w.text);
    const dogHyponyms = hyponyms(dog!, lexicalRelationships, dictionary, undefined, senseStore).map((w) => w.text);
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

  it("a multi-word synset lemma seeds as a Phrase, not a Word, and behaves exactly like a Word in the relationship graph -- resolvable from both DictionaryView.searchRelationships and resolveHierarchy", async () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    const senseStore = new Senses();
    const lexicalRelationships = new LexicalRelationshipStore();
    const lexicalRelationshipProcessor = new LexicalRelationshipProcessor(
      lexicalRelationships,
      new LexicalRelationshipSystemPropertyTensor(),
    );
    await new WordSeeder("en").seedWordNet({
      vocabulary: { dictionary, phrases: phraseBook, senses: senseStore, lexicalRelationships, lexicalRelationshipProcessor },
    });

    // 02116276-n "toy poodle" -- HYPERNYM -> 02115987-n "poodle" (dict/data.noun).
    const toyPoodle = phraseBook.lookupAll("toy poodle").find((phrase) => phrase.synsetId?.value === "02116276-n");
    expect(toyPoodle).toBeDefined();
    expect(toyPoodle?.isCommon).toBe(true);
    expect(toyPoodle?.phraseType).toBe(PhraseType.NOUN_PHRASE);

    // classifyPhraseType()'s own PREPOSITIONAL_PHRASE/INFINITIVE_PHRASE
    // rules, spot-checked against real seeded Phrases rather than just
    // the pure-function unit tests above -- "at fault" (01324381-s,
    // dict/data.adj) is WordNet-tagged ADJECTIVE but structurally a
    // Preposition + NP; "to be sure" (00151192-r, dict/data.adv) is
    // WordNet-tagged ADVERB but structurally an infinitive.
    const atFault = phraseBook.lookupAll("at fault").find((phrase) => phrase.synsetId?.value === "01324381-s");
    expect(atFault?.partOfSpeech).toBe(PartOfSpeech.ADJECTIVE);
    expect(atFault?.phraseType).toBe(PhraseType.PREPOSITIONAL_PHRASE);

    const toBeSure = phraseBook.lookupAll("to be sure").find((phrase) => phrase.synsetId?.value === "00151192-r");
    expect(toBeSure?.partOfSpeech).toBe(PartOfSpeech.ADVERB);
    expect(toBeSure?.phraseType).toBe(PhraseType.INFINITIVE_PHRASE);
    expect(dictionary.lookupAll("toy poodle")).toEqual([]);

    const poodle = dictionary.lookupAll("poodle").find((w) => w.synsetId?.value === "02115987-n");
    expect(poodle).toBeDefined();

    // Broken down into its own constituent Words, stored by uuid
    // reference (word_seeder.ts's own linkPhraseWords()) -- "toy" is
    // itself a real standalone WordNet sense (both a noun and a verb,
    // dict/data.noun and dict/data.verb), so this deliberately checks
    // against dictionary.lookup("toy") itself -- linkPhraseWords()'s own
    // first-homograph choice -- rather than asserting which particular
    // sense that resolves to.
    const toy = dictionary.lookup("toy");
    expect(toy).toBeDefined();
    expect(toyPoodle!.words).toHaveLength(2);
    expect(toyPoodle!.words[0]?.value).toBe(toy!.uuid.value);
    expect(toyPoodle!.words[1]?.value).toBe(poodle!.uuid.value);

    // Seeded exactly like a Word: hypernyms() works with the Phrase as
    // its own subject (relatedWords()'s own widened `word` param, word.ts).
    // Synset 02115987-n itself has two lemmas -- "poodle" and "poodle
    // dog" -- so the synset-wide HYPERNYM fact, stored as one Sense-to-
    // Sense edge (WordSeeder.seedPointerRelationship's own docstring),
    // expands to both members on read, not just the one this test
    // happens to look up by name.
    expect(hypernyms(toyPoodle!, lexicalRelationships, dictionary, undefined, senseStore).map((w) => w.text).sort()).toEqual(["poodle", "poodle dog"]);
    // And the reverse direction resolves the Phrase back via the
    // phraseBook fallback.
    expect(hyponyms(poodle!, lexicalRelationships, dictionary, phraseBook, senseStore).map((w) => w.text)).toContain("toy poodle");

    // The Vocabulary UI's own resolution paths (DictionaryView) see the
    // identical fact, regardless of which endpoint they start from --
    // both server-side, on-demand paths used at WordNet scale
    // (MAX_INTERACTIVE_WORDS), not just the small-Domain embedded path.
    const view = new DictionaryView(dictionary, lexicalRelationships, { domainName: "Common", phrases: phraseBook, senses: senseStore });

    // The Phrases tab's own detail panel resolves exclusively through
    // this wordId path (dictionary_view.ts's own wordForDetailPanel()
    // docstring -- "panel === 'phrases' always falls through to
    // wordLookupCache"), so phrase_type has to survive this exact
    // round trip, not just the raw Phrase object checked above.
    const atFaultSearch = view.searchWords({ wordId: atFault!.uuid.value });
    expect(atFaultSearch.words).toHaveLength(1);
    expect(atFaultSearch.words[0].phrase_type).toBe("PREPOSITIONAL_PHRASE");

    const toyPoodleSearch = view.searchWords({ wordId: toyPoodle!.uuid.value });
    expect(toyPoodleSearch.words[0].phrase_type).toBe("NOUN_PHRASE");

    // The Phrases tab's own row list (searchPhrases(), the over-capacity
    // counterpart to phraseRecords()' embedded array) carries phrase_type
    // too, not just the detail-panel's own wordId path above.
    const atFaultRow = view.searchPhrases({ word: "at fault" }).phrases.find((p) => p.id === atFault!.uuid.value);
    expect(atFaultRow?.phrase_type).toBe("PREPOSITIONAL_PHRASE");

    const forToyPoodle = view.searchRelationships({ wordId: toyPoodle!.uuid.value });
    expect(forToyPoodle.totalMatches).toBeGreaterThan(0);
    const hypernymRow = forToyPoodle.relationships.find((r) => r.kind === "HYPERNYM");
    expect(hypernymRow).toBeDefined();
    expect(hypernymRow?.source_text).toBe("toy poodle");
    expect(hypernymRow?.target_text).toBe("poodle");

    const hierarchy = view.resolveHierarchy({ kind: "HYPERNYM", wordId: toyPoodle!.uuid.value, limit: 50 });
    expect(hierarchy.fellBack).toBe(false);
    // This kind's own graph is keyed by Sense uuid for a synset-wide
    // fact (WordSeeder.seedPointerRelationship's own docstring) -- "toy
    // poodle"'s own uuid isn't a node in it directly, so resolveHierarchy()
    // falls back to its Sense's uuid instead (that method's own
    // docstring), centring the tree on the Sense, rendered via
    // resolveEntry()'s own representative-member simplification -- "toy
    // poodle" itself here, its own synset's only lemma.
    const toyPoodleNode = hierarchy.nodes.find((n) => n.id === toyPoodle!.senseId!.value);
    expect(toyPoodleNode).toBeDefined();
    expect(toyPoodleNode?.lexical_form).toBe("toy poodle");
    expect(hierarchy.nodes.map((n) => n.lexical_form)).toContain("poodle");

    // The detail panel's own headword-linking feature ("toy poodle"
    // links to "toy" and "poodle", the same way a definition's own word
    // tokens already link to the Words they mention) -- searchWords()'s
    // `wordId` branch attaches phrase_word_segments only when the
    // resolved record came from a Phrase, built from that Phrase's own
    // already-stored `words` references (phraseWordSegments()'s own
    // docstring), not re-derived on the spot.
    const detail = view.searchWords({ wordId: toyPoodle!.uuid.value }).words[0];
    expect(detail.phrase_word_segments).toHaveLength(2);
    expect(detail.phrase_word_segments![0]).toMatchObject({ text: "toy", word: true, resolved: true, word_id: toy!.uuid.value });
    expect(detail.phrase_word_segments![1]).toMatchObject({ text: "poodle", word: true, resolved: true, word_id: poodle!.uuid.value, lexical_form: "poodle" });
    // An ordinary Word's own record never carries this field.
    expect(view.searchWords({ wordId: poodle!.uuid.value }).words[0].phrase_word_segments).toBeUndefined();
  }, 60000);

  it("seeds a Noun/Verb/Adjective/Adverb subtype per Word, populating Verb.frames and Adjective.syntacticPosition from real WordNet data previously discarded", async () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    const senseStore = new Senses();
    const lexicalRelationships = new LexicalRelationshipStore();
    const lexicalRelationshipProcessor = new LexicalRelationshipProcessor(
      lexicalRelationships,
      new LexicalRelationshipSystemPropertyTensor(),
    );
    await new WordSeeder("en").seedWordNet({
      vocabulary: { dictionary, phrases: phraseBook, senses: senseStore, lexicalRelationships, lexicalRelationshipProcessor },
    });

    // "breathe" (00001740-v) carries frame records 2/8, both wordIndex 0
    // (the whole synset) -- dict/data.verb: "021 * ... 02 + 02 00 + 08 00".
    const breathe = dictionary.lookupAll("breathe").find((w) => w.synsetId?.value === "00001740-v");
    expect(breathe).toBeDefined();
    expect(isVerb(breathe!)).toBe(true);
    expect(isNoun(breathe!)).toBe(false);
    if (!isVerb(breathe!)) throw new Error("unreachable");
    expect(breathe.frames).toEqual(expect.arrayContaining(["Somebody ----s", "Somebody ----s something"]));
    expect(breathe.frames).toHaveLength(2);

    // 00027261-v ("stretch"/"extend") -- frame 8 applies to the whole
    // synset (wordIndex 0), frame 2 to "stretch" alone (wordIndex 1,
    // dict/data.verb's own "02 + 08 00 + 02 01"): "stretch" (lemma index
    // 0) gets both; "extend" (lemma index 1) gets only the whole-synset
    // one -- proving per-lemma resolution, not per-synset copying.
    const stretch = dictionary.lookupAll("stretch").find((w) => w.synsetId?.value === "00027261-v");
    const extend = dictionary.lookupAll("extend").find((w) => w.synsetId?.value === "00027261-v");
    if (!isVerb(stretch!) || !isVerb(extend!)) throw new Error("unreachable");
    expect(stretch.frames).toEqual(expect.arrayContaining(["Somebody ----s something", "Somebody ----s"]));
    expect(stretch.frames).toHaveLength(2);
    expect(extend.frames).toEqual(["Somebody ----s something"]);

    // "afraid" (00078253-a) is WordNet-marked "afraid(p)" -- predicate-
    // only. The marker itself must not survive into the spelling.
    const afraid = dictionary.lookupAll("afraid").find((w) => w.synsetId?.value === "00078253-a");
    expect(afraid).toBeDefined();
    expect(isAdjective(afraid!)).toBe(true);
    if (!isAdjective(afraid!)) throw new Error("unreachable");
    expect(afraid.text).toBe("afraid");
    expect(afraid.lexicalForm?.value).toBe("afraid");
    expect(afraid.syntacticPosition).toBe(AdjectivePosition.PREDICATE_ONLY);

    // "big" (01385012-a, already used elsewhere in this file) carries no
    // WordNet position marker at all -- unrestricted, not just "false".
    const big = dictionary.lookupAll("big").find((w) => w.synsetId?.value === "01385012-a");
    expect(big).toBeDefined();
    if (!isAdjective(big!)) throw new Error("unreachable");
    expect(big.syntacticPosition).toBeUndefined();

    // Every Noun/Adverb Word still narrows correctly, even with no
    // extra field of its own populated yet.
    const poodle = dictionary.lookupAll("poodle").find((w) => w.synsetId?.value === "02115987-n");
    expect(isNoun(poodle!)).toBe(true);
    expect(isVerb(poodle!)).toBe(false);
    const someAdverb = dictionary.all().find((w) => w.partOfSpeech === PartOfSpeech.ADVERB);
    expect(someAdverb).toBeDefined();
    expect(isAdverb(someAdverb!)).toBe(true);
    expect(isNoun(someAdverb!)).toBe(false);
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
    const phrases = new Phrases();
    wordSeeder.seedDomain({ vocabulary: { dictionary, phrases } });

    const lexicalRelationships = new LexicalRelationshipStore();
    const vocabulary = {
      dictionary,
      phrases,
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

  it("{ skipUnresolvable: true } skips (rather than throws on) a spec whose Word was deliberately left unseeded by WordSeeder's own excludeOpenClasses, mirroring the Vocabulary view's 'Seed Vocabulary' toolbar action", async () => {
    const wordSeeder = new WordSeeder("en");
    const dictionary = new Dictionary();
    const phrases = new Phrases();
    wordSeeder.seedDomain({ vocabulary: { dictionary, phrases } }, { excludeOpenClasses: true });

    const lexicalRelationships = new LexicalRelationshipStore();
    const vocabulary = {
      dictionary,
      phrases,
      lexicalRelationships,
      lexicalRelationshipProcessor: new LexicalRelationshipProcessor(
        lexicalRelationships,
        new LexicalRelationshipSystemPropertyTensor(),
      ),
    };

    const relationshipSeeder = new RelationshipSeeder("en");
    // Without skipUnresolvable this would throw -- most Common
    // Relationship Cache specs relate open-class Words that
    // excludeOpenClasses left unseeded.
    await expect(relationshipSeeder.seedDomain({ name: "Common", vocabulary })).rejects.toThrow(/cannot resolve/);

    const seeded = await relationshipSeeder.seedDomain({ name: "Common", vocabulary }, { skipUnresolvable: true });
    expect(seeded).toBeGreaterThan(0);
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
    await new WordSeeder("en").seedWordNet({ vocabulary: { dictionary, phrases: new Phrases(), senses: new Senses(), lexicalRelationships, lexicalRelationshipProcessor } });

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

  it("a WordRecord's own domain/related_domains read through the shared Sense, not the Word itself, for a WordNet-seeded polyseme", async () => {
    const dictionary = new Dictionary();
    const senseStore = new Senses();
    const lexicalRelationships = new LexicalRelationshipStore();
    const lexicalRelationshipProcessor = new LexicalRelationshipProcessor(
      lexicalRelationships,
      new LexicalRelationshipSystemPropertyTensor(),
    );
    await new WordSeeder("en").seedWordNet({ vocabulary: { dictionary, phrases: new Phrases(), senses: senseStore, lexicalRelationships, lexicalRelationshipProcessor } });

    // "winger" (offset 10802147) carries FOUR topic-domain pointers,
    // now stored on its own Sense, not on the Word (word_seeder.ts's own
    // tagTopicDomain docstring) -- DictionaryView.senseFieldsFor() must
    // resolve them through senseId, not word.domainTag directly (always
    // undefined for a WordNet-seeded Word after this migration).
    const winger = dictionary.lookupAll("winger").find((w) => w.synsetId?.value === "10802147-n");
    expect(winger).toBeDefined();
    expect(winger?.domainTag).toBeUndefined();

    const view = new DictionaryView(dictionary, lexicalRelationships, { domainName: "Common", senses: senseStore });
    const record = view.searchWords({ wordId: winger!.uuid.value }).words[0];
    expect(record.domain).not.toBeNull();
    expect(["soccer", "field hockey", "rugby", "football"]).toContain(record.domain);
    expect(new Set([record.domain, ...record.related_domains])).toEqual(new Set(["soccer", "field hockey", "rugby", "football"]));
  }, 30000);

  it("a WordRecord's own is_root_word and rootWordsOnly filter read through the shared Sense, and definition/gloss survive when the Senses has no matching Sense at all (the Physics-from-Common cross-Domain gap senseFieldsFor()'s own docstring accepts)", () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    const senseStore = new Senses();
    new WordSeeder("en").seedDomain({ vocabulary: { dictionary, phrases: phraseBook, senses: senseStore } }, { excludeOpenClasses: true });

    const entity = dictionary.lookupAll("entity").find((w) => w.partOfSpeech === PartOfSpeech.NOUN);
    expect(entity).toBeDefined();

    // With the matching Senses: is_root_word comes back true (read
    // through the Sense, isRootWordFor()'s own docstring), the
    // rootWordsOnly filter finds it, and definition/gloss resolve
    // (dual-written onto both Word and Sense, senseFieldsFor()'s own
    // docstring on why neither is stripped for hand-curated data).
    const withSenses = new DictionaryView(dictionary, new LexicalRelationshipStore(), { domainName: "Common", phrases: phraseBook, senses: senseStore });
    const recordWithSenses = withSenses.searchWords({ wordId: entity!.uuid.value }).words[0];
    expect(recordWithSenses.is_root_word).toBe(true);
    expect(recordWithSenses.definition).toBe(entity!.definition!.value);
    expect(withSenses.searchWords({ rootWordsOnly: true }).words.map((w) => w.lexical_form)).toContain("entity");

    // Without a matching Senses at all (a fresh, empty one -- the
    // same shape a cross-Domain copy's own Senses has today) --
    // is_root_word and definition still resolve correctly, falling back
    // to entity's own fields (never stripped for hand-curated data)
    // rather than silently going blank/false.
    const withoutSenses = new DictionaryView(dictionary, new LexicalRelationshipStore(), { domainName: "Common", phrases: phraseBook, senses: new Senses() });
    const recordWithoutSenses = withoutSenses.searchWords({ wordId: entity!.uuid.value }).words[0];
    expect(recordWithoutSenses.is_root_word).toBe(true);
    expect(recordWithoutSenses.definition).toBe(entity!.definition!.value);
    expect(withoutSenses.searchWords({ rootWordsOnly: true }).words.map((w) => w.lexical_form)).toContain("entity");
  });

  it("sense_id is null for a Word that didn't come from WordSeeder.seedWordNet", () => {
    const dictionary = new Dictionary();
    dictionary.append(createWord({ text: "big", partOfSpeech: PartOfSpeech.ADJECTIVE }));
    const view = new DictionaryView(dictionary, new LexicalRelationshipStore(), { domainName: "Common" });

    expect(view.searchWords({ word: "big" }).words[0].sense_id).toBeNull();
  });
});

describe("DictionaryView.searchPhrases", () => {
  it("resolves against the real bundled WordNet-scale Phrases without embedding it (regression check mirroring searchWords' own)", async () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    const lexicalRelationships = new LexicalRelationshipStore();
    const lexicalRelationshipProcessor = new LexicalRelationshipProcessor(
      lexicalRelationships,
      new LexicalRelationshipSystemPropertyTensor(),
    );
    await new WordSeeder("en").seedWordNet({
      vocabulary: { dictionary, phrases: phraseBook, senses: new Senses(), lexicalRelationships, lexicalRelationshipProcessor },
    });
    expect(phraseBook.totalEntries()).toBeGreaterThan(20000);

    const view = new DictionaryView(dictionary, lexicalRelationships, { domainName: "Common", phrases: phraseBook });
    const result = view.searchPhrases({ word: "poodle", limit: 50 });
    expect(result.totalMatches).toBeGreaterThan(0);
    expect(result.phrases.length).toBeLessThanOrEqual(50);
    expect(result.phrases.every((p) => p.lexical_form.toLowerCase().includes("poodle"))).toBe(true);
    expect(result.phrases.some((p) => p.lexical_form === "toy poodle")).toBe(true);
  }, 60000);

  it("render() gates the embedded PHRASES array behind the same MAX_INTERACTIVE_WORDS threshold wordRecords() already has, once a Phrases grows past it, while still reporting the true, uncapped total in the Phrases stat tile", () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    // Fabricated, not WordNet-seeded -- exercises render()'s own
    // capacity gate directly, without paying the cost of a real WordNet
    // seed just to get a Phrases this large.
    for (let i = 0; i < 20001; i++) {
      phraseBook.append(createPhrase({ text: `phrase number ${i}`, partOfSpeech: PartOfSpeech.NOUN }));
    }
    const view = new DictionaryView(dictionary, new LexicalRelationshipStore(), { domainName: "Common", phrases: phraseBook });

    const html = view.render();
    expect(html).toContain("const OVER_CAPACITY_PHRASES = true;");
    expect(html).toContain("const PHRASES = [];");
    expect(html).toContain(">20001<");
  });
});

describe("DictionaryView.searchSenses", () => {
  it("resolves against the real bundled WordNet-scale Senses store without embedding it (regression check mirroring searchWords'/searchPhrases' own)", async () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    const senseStore = new Senses();
    const lexicalRelationships = new LexicalRelationshipStore();
    const lexicalRelationshipProcessor = new LexicalRelationshipProcessor(
      lexicalRelationships,
      new LexicalRelationshipSystemPropertyTensor(),
    );
    await new WordSeeder("en").seedWordNet({
      vocabulary: { dictionary, phrases: phraseBook, senses: senseStore, lexicalRelationships, lexicalRelationshipProcessor },
    });
    expect(senseStore.totalEntries()).toBeGreaterThan(100000);

    const view = new DictionaryView(dictionary, lexicalRelationships, { domainName: "Common", phrases: phraseBook, senses: senseStore });
    const wordResult = view.searchSenses({ word: "large", limit: 50 });
    expect(wordResult.totalMatches).toBeGreaterThan(0);
    expect(wordResult.senses.length).toBeLessThanOrEqual(50);
    expect(wordResult.senses.every((s) => s.lexical_form.toLowerCase().includes("large"))).toBe(true);

    // "big"/"large" (01385012-a, "above average in size") share one
    // Sense (the WordSeeder.seedWordNet test's own bigSense assertions)
    // -- its own SenseRecord should list both members (among that
    // synset's other lemmas too) joined into `lexical_form`, with a
    // real member_count and a consistent pos derived from them. Found
    // by its own definition text, unique enough not to need a high
    // limit the way the broad `word: "large"` search above does (a
    // plain word search could plausibly sort this one sense past a
    // small limit -- "big"/"large" are also both members of an
    // unrelated "in an advanced stage of pregnancy" synset, and
    // Senses sort by their own joined lexical_form, not synset offset).
    const definitionResult = view.searchSenses({ definition: "above average in size", limit: 50 });
    const bigLargeSense = definitionResult.senses.find((s) => s.synset_id === "01385012-a");
    expect(bigLargeSense).toBeDefined();
    expect(bigLargeSense?.member_count).toBe(bigLargeSense?.members.length);
    expect(bigLargeSense?.member_count).toBeGreaterThanOrEqual(2);
    expect(bigLargeSense?.pos).toBe("ADJECTIVE");
    expect(bigLargeSense?.definition).toContain("above average in size");

    // The Words tab's own detail panel resolves a Sense-uuid pivot
    // (a Senses-tab row click) through the shared searchWords()/wordId
    // path -- DictionaryView.searchWords()'s own Senses fallback --
    // rather than a parallel lookup of its own.
    const pivot = view.searchWords({ wordId: bigLargeSense!.id });
    expect(pivot.totalMatches).toBe(1);
    expect(["big", "large"]).toContain(pivot.words[0].lexical_form);
    expect(pivot.words[0].relationship_count).toBeGreaterThan(0);
  }, 60000);

  it("render() gates the embedded SENSES array behind the same MAX_INTERACTIVE_WORDS threshold wordRecords()/phraseRecords() already have, once a Senses store grows past it, while still reporting the true, uncapped total in the Senses stat tile", () => {
    const dictionary = new Dictionary();
    const senseStore = new Senses();
    // Fabricated, not WordNet-seeded -- exercises render()'s own
    // capacity gate directly, without paying the cost of a real WordNet
    // seed just to get a Senses store this large.
    for (let i = 0; i < 20001; i++) {
      senseStore.append(createSense({ definition: { value: `sense number ${i}` } }));
    }
    const view = new DictionaryView(dictionary, new LexicalRelationshipStore(), { domainName: "Common", senses: senseStore });

    const html = view.render();
    expect(html).toContain("const OVER_CAPACITY_SENSES = true;");
    expect(html).toContain("const SENSES = [];");
    expect(html).toContain(">20001<");
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
    const senseStore = new Senses();
    const lexicalRelationships = new LexicalRelationshipStore();
    const lexicalRelationshipProcessor = new LexicalRelationshipProcessor(
      lexicalRelationships,
      new LexicalRelationshipSystemPropertyTensor(),
    );
    await new WordSeeder("en").seedWordNet({ vocabulary: { dictionary, phrases: new Phrases(), senses: senseStore, lexicalRelationships, lexicalRelationshipProcessor } });

    const view = new DictionaryView(dictionary, lexicalRelationships, { domainName: "Common", senses: senseStore });
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

  it("still falls back with fellBack: true for a symmetric kind stored as only ONE directed edge per fact -- WordSeeder's own real storage shape, not the two-directions-stored shape a naive root check would need", () => {
    // A real WordNet-seeded ANTONYM/SYNONYM/etc. fact is stored as a
    // single directed edge (SYMMETRIC_RELATIONSHIP_KINDS's own dedup in
    // word_seeder.ts, and allPairs()'s own i<j-only pairing for
    // SYNONYM) -- "every node has both directions" is therefore never
    // true for this data, so fellBack must be driven by
    // SYMMETRIC_HIERARCHY_KINDS naming the kind explicitly, not by
    // inferring it from "zero root candidates" (which, given only one
    // direction stored, finds a real "root" -- whichever word happens
    // to sort first -- and would otherwise draw a nonsensical tree
    // instead of falling back to a cluster view).
    const dictionary = new Dictionary();
    const big = createWord({ text: "big", partOfSpeech: PartOfSpeech.ADJECTIVE });
    const small = createWord({ text: "small", partOfSpeech: PartOfSpeech.ADJECTIVE });
    dictionary.append(big);
    dictionary.append(small);
    const store = new LexicalRelationshipStore();
    const processor = new LexicalRelationshipProcessor(store, new LexicalRelationshipSystemPropertyTensor());
    processor.create({ sourceWordId: big.uuid.value, targetWordId: small.uuid.value, relationshipType: LexicalRelationshipType.ANTONYM, sourceReferences: [] });

    const view = new DictionaryView(dictionary, store, { domainName: "Common" });
    const result = view.resolveHierarchy({ kind: "ANTONYM" });
    expect(result.fellBack).toBe(true);
    expect(result.totalEdgeCount).toBe(1);

    // Same for SYNONYM, seeded the real way (allPairs(), one direction).
    const dictionary2 = new Dictionary();
    const cat = createWord({ text: "cat", partOfSpeech: PartOfSpeech.NOUN });
    const feline = createWord({ text: "feline", partOfSpeech: PartOfSpeech.NOUN });
    dictionary2.append(cat);
    dictionary2.append(feline);
    const store2 = new LexicalRelationshipStore();
    const processor2 = new LexicalRelationshipProcessor(store2, new LexicalRelationshipSystemPropertyTensor());
    processor2.create({ sourceWordId: cat.uuid.value, targetWordId: feline.uuid.value, relationshipType: LexicalRelationshipType.SYNONYM, sourceReferences: [] });

    const view2 = new DictionaryView(dictionary2, store2, { domainName: "Common" });
    const result2 = view2.resolveHierarchy({ kind: "SYNONYM" });
    expect(result2.fellBack).toBe(true);
  });

  it("resolves against the real bundled WordNet-scale dataset, correctly oriented (broad root, narrow leaves) for a kind only stored in the child->parent direction", async () => {
    const dictionary = new Dictionary();
    const senseStore = new Senses();
    const lexicalRelationships = new LexicalRelationshipStore();
    const lexicalRelationshipProcessor = new LexicalRelationshipProcessor(
      lexicalRelationships,
      new LexicalRelationshipSystemPropertyTensor(),
    );
    await new WordSeeder("en").seedWordNet({ vocabulary: { dictionary, phrases: new Phrases(), senses: senseStore, lexicalRelationships, lexicalRelationshipProcessor } });

    const view = new DictionaryView(dictionary, lexicalRelationships, { domainName: "Common", senses: senseStore });
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

    // SYNONYM against the real corpus: no longer a stored edge at all
    // (Senses.registerMember()'s own docstring -- WordSeeder's own
    // pass 1 relies on shared senseId alone, not a per-pair edge), so
    // this kind's own graph is simply empty now rather than falling
    // back to a cluster view -- synonymy is still fully queryable, just
    // through synonyms() (word.ts) and Senses.membersOf() directly,
    // not through this edge-graph-only method.
    const synonymHierarchy = view.resolveHierarchy({ kind: "SYNONYM" });
    expect(synonymHierarchy.fellBack).toBe(false);
    expect(synonymHierarchy.totalEdgeCount).toBe(0);
  }, 30000);
});
