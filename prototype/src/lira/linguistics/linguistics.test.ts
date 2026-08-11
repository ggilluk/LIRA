import { describe, expect, it } from "vitest";
import { Dictionary } from "../vocabulary/data/dictionary";
import { AsyncDictionaryHydrator } from "../vocabulary/role/dictionary_hydrator";
import { DictionaryProcessor } from "../vocabulary/role/dictionary_processor";
import { WordSeeder } from "../vocabulary/role/word_seeder";
import { GrammarConfigurator } from "./role/grammar_configurator";
import { LinguisticController } from "./role/linguistic_controller";
import { ValidationOutcome } from "./data/validation_outcome";
import { PhraseType } from "./data/phrase_type";
import { ClauseType } from "./data/clause_type";

function seededController(): LinguisticController {
  const dictionary = new Dictionary();
  new WordSeeder("en").seedClosedClassWords(dictionary);
  const hydrator = new AsyncDictionaryHydrator(dictionary);
  const processor = new DictionaryProcessor(dictionary, hydrator, "Common");
  return new LinguisticController(processor);
}

describe("GrammarConfigurator", () => {
  it("validates its own rule tables without throwing, against the real vocabulary", () => {
    expect(() => new GrammarConfigurator().validateAgainstVocabulary()).not.toThrow();
  });
});

describe("LinguisticController against the bundled Common Vocabulary Cache", () => {
  it("reads a well-formed declarative sentence as VALID with a subject/predicate/complement", () => {
    const controller = seededController();
    const sentence = controller.readSentence("A meaning is a representation.");

    expect(sentence.validation).toBe(ValidationOutcome.VALID);
    expect(sentence.sentenceType).toBeDefined();
    expect(sentence.clauses).toHaveLength(1);

    const clause = sentence.clauses[0];
    expect(clause.clauseType).toBe(ClauseType.INDEPENDENT);
    expect(clause.subject?.phraseType).toBe(PhraseType.NOUN_PHRASE);
    expect(clause.predicate?.phraseType).toBe(PhraseType.VERB_PHRASE);
    // "is" is a linking verb -- "a representation" is a complement, not
    // an object (clause_reader.ts's own LINKING_VERB_FORMS).
    expect(clause.complement?.phraseType).toBe(PhraseType.NOUN_PHRASE);
    expect(clause.object).toBeUndefined();
    expect(sentence.punctuation?.text).toBe(".");
  });

  it("reads spec 20's own worked example (\"The fox over the dog.\") as INVALID -- no predicate", () => {
    const controller = seededController();
    const sentence = controller.readSentence("The fox over the dog.");

    expect(sentence.validation).toBe(ValidationOutcome.INVALID);
    const clause = sentence.clauses[0];
    expect(clause.predicate).toBeUndefined();
    expect(clause.errors.some((error) => error.message.includes("predicate"))).toBe(true);
  });

  it("splits multi-sentence text the same way tokenizePrompt's write path does", () => {
    const controller = seededController();
    const sentences = controller.readText("A meaning is a representation. A word is a symbol.");
    expect(sentences).toHaveLength(2);
    expect(sentences[0].validation).toBe(ValidationOutcome.VALID);
    expect(sentences[1].validation).toBe(ValidationOutcome.VALID);
  });

  it("assigns each unit a tensor-backed systemProperty (Rule 14)", () => {
    const controller = seededController();
    const sentence = controller.readSentence("A meaning is a representation.");
    expect(sentence.systemProperty).toBeDefined();
    expect(sentence.systemProperty?.kind).toBeDefined();
    expect(sentence.clauses[0].systemProperty).toBeDefined();
    expect(sentence.clauses[0].subject?.systemProperty).toBeDefined();
  });

  it("reports an unknown word as UNRESOLVED rather than guessing a part of speech", () => {
    const controller = seededController();
    const sentence = controller.readSentence("The zorbnax is here.");
    expect(sentence.validation).not.toBe(ValidationOutcome.VALID);
    expect(sentence.errors.some((error) => error.tokenText === "zorbnax")).toBe(true);
  });
});
