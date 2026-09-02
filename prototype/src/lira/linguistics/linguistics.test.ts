import { describe, expect, it } from "vitest";
import { Dictionary } from "../vocabulary/data/dictionary";
import { PartOfSpeech } from "../vocabulary/data/enums/part_of_speech";
import { Phrases } from "../vocabulary/data/phrases";
import { WordForms } from "../vocabulary/data/word_forms";
import { AsyncDictionaryHydrator } from "../vocabulary/role/dictionary_hydrator";
import { DictionaryProcessor } from "../vocabulary/role/dictionary_processor";
import { WordSeeder } from "../vocabulary/role/word_seeder";
import { GrammarConfigurator } from "./role/grammar_configurator";
import { LinguisticController } from "./role/linguistic_controller";
import { ValidationOutcome } from "./data/validation_outcome";
import { PhraseType } from "./data/phrase_type";
import { ClauseType } from "./data/clause_type";
import { isMainClause } from "./data/main_clause";
import { createSubordinateClause, isSubordinateClause, type SubordinateClauseType } from "./data/subordinate_clause";
import { SentenceType } from "./data/sentence_type";
import { ReadingErrorKind } from "./data/reading_error";
import { LinguisticUnitKind } from "./data/linguistic_unit_kind";
import { createUserPrompt } from "./ui/user_prompt";

function seededController(): LinguisticController {
  const dictionary = new Dictionary();
  const phraseBook = new Phrases();
  const wordForms = new WordForms();
  new WordSeeder("en").seedClosedClassWords(dictionary, phraseBook, undefined, undefined, wordForms);
  const hydrator = new AsyncDictionaryHydrator(dictionary);
  const processor = new DictionaryProcessor(dictionary, phraseBook, hydrator, "Common", wordForms);
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
    // ClauseReader always resolves a real reading to a genuine
    // MainClause, never a SubordinateClause (main_clause.ts's own
    // docstring -- clause-level recursion for DEPENDENT/RELATIVE/
    // COORDINATED isn't implemented yet).
    expect(isMainClause(clause)).toBe(true);
    expect(isSubordinateClause(clause)).toBe(false);
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

  it("resolves an inflected surface form ('agencies', not itself independently seeded) via its base Word's own generated pluralNumberForm, not UNRESOLVED", () => {
    // Built inline, not via seededController(), so the test can assert
    // "agencies" genuinely has no exact Dictionary entry of its own
    // before reading -- proving this exercises the new inflected-form
    // fallback rather than an accidental exact hit (root_words.json's
    // "entity" looked like a good example at first, but "entities" turns
    // out to already be independently seeded in promoted_words.json, so
    // it resolved via an ordinary exact match and never touched the
    // fallback at all -- caught only by checking this).
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    const wordForms = new WordForms();
    new WordSeeder("en").seedClosedClassWords(dictionary, phraseBook, undefined, undefined, wordForms);
    expect(dictionary.lookupAll("agencies")).toHaveLength(0);
    const hydrator = new AsyncDictionaryHydrator(dictionary);
    const processor = new DictionaryProcessor(dictionary, phraseBook, hydrator, "Common", wordForms);
    const controller = new LinguisticController(processor);

    const sentence = controller.readSentence("The agencies are known.");
    expect(sentence.errors.some((error) => error.tokenText === "agencies")).toBe(false);
    const agencies = sentence.clauses[0].tokens.find((token) => token.text === "agencies");
    expect(agencies?.partOfSpeech).toBe(PartOfSpeech.NOUN);
  });
});

describe("Sentence types: INTERROGATIVE/EXCLAMATORY recognised by terminal punctuation", () => {
  it("reads a '?'-terminated sentence as INTERROGATIVE and VALID", () => {
    const controller = seededController();
    const sentence = controller.readSentence("A meaning is a representation?");
    expect(sentence.sentenceType).toBe(SentenceType.INTERROGATIVE);
    expect(sentence.validation).toBe(ValidationOutcome.VALID);
    expect(sentence.punctuation?.text).toBe("?");
  });

  it("reads a '!'-terminated sentence as EXCLAMATORY and VALID", () => {
    const controller = seededController();
    const sentence = controller.readSentence("A meaning is a representation!");
    expect(sentence.sentenceType).toBe(SentenceType.EXCLAMATORY);
    expect(sentence.validation).toBe(ValidationOutcome.VALID);
    expect(sentence.punctuation?.text).toBe("!");
  });

  it("still reads the original '.'-terminated case as DECLARATIVE", () => {
    const controller = seededController();
    const sentence = controller.readSentence("A meaning is a representation.");
    expect(sentence.sentenceType).toBe(SentenceType.DECLARATIVE);
    expect(sentence.validation).toBe(ValidationOutcome.VALID);
  });

  it("reports a terminal mark matching no configured template as INVALID_PUNCTUATION_SEQUENCE, falling back to DECLARATIVE", () => {
    const controller = seededController();
    const sentence = controller.readSentence("A meaning is a representation;");
    expect(sentence.sentenceType).toBe(SentenceType.DECLARATIVE);
    expect(sentence.validation).toBe(ValidationOutcome.INVALID);
    expect(sentence.errors.some((error) => error.kind === ReadingErrorKind.INVALID_PUNCTUATION_SEQUENCE)).toBe(true);
  });
});

describe("Document/Heading/Paragraph reading hierarchy (Document -> Heading | Paragraph -> Sentence -> Phrase -> Word)", () => {
  it("readDocument identifies a Heading block ahead of Paragraph blocks, in order, each with the right sentence type", () => {
    const controller = seededController();
    const document = controller.readDocument([
      "## Overview",
      "A meaning is a representation.",
      "A meaning is a representation?",
      "A meaning is a representation!",
    ].join("\n"));

    expect(document.blocks).toHaveLength(4);
    expect(document.systemProperty?.kind).toBe(LinguisticUnitKind.Document);

    const [heading, declarative, interrogative, exclamatory] = document.blocks;
    expect(heading.blockKind).toBe("heading");
    if (heading.blockKind === "heading") {
      expect(heading.level).toBe(2);
      expect(heading.text).toBe("Overview");
      expect(heading.systemProperty?.kind).toBe(LinguisticUnitKind.Heading);
    }

    for (const [block, expectedType] of [
      [declarative, SentenceType.DECLARATIVE],
      [interrogative, SentenceType.INTERROGATIVE],
      [exclamatory, SentenceType.EXCLAMATORY],
    ] as const) {
      expect(block.blockKind).toBe("paragraph");
      if (block.blockKind === "paragraph") {
        expect(block.validation).toBe(ValidationOutcome.VALID);
        expect(block.sentences).toHaveLength(1);
        expect(block.sentences[0].sentenceType).toBe(expectedType);
      }
    }

    // A Heading always contributes VALID, and every Paragraph here
    // validated, so the Document as a whole is VALID too -- the
    // worst-outcome aggregation never finds a losing block.
    expect(document.validation).toBe(ValidationOutcome.VALID);
  });

  it("degrades Document validation to the worst of its Paragraph blocks (spec 20's own worked example)", () => {
    const controller = seededController();
    const document = controller.readDocument([
      "# Notes",
      "A meaning is a representation.",
      "The fox over the dog.",
    ].join("\n"));

    expect(document.blocks).toHaveLength(3);
    const [heading, validParagraph, invalidParagraph] = document.blocks;
    expect(heading.blockKind).toBe("heading");
    if (heading.blockKind === "heading") expect(heading.level).toBe(1);

    expect(validParagraph.blockKind).toBe("paragraph");
    if (validParagraph.blockKind === "paragraph") expect(validParagraph.validation).toBe(ValidationOutcome.VALID);

    expect(invalidParagraph.blockKind).toBe("paragraph");
    if (invalidParagraph.blockKind === "paragraph") expect(invalidParagraph.validation).toBe(ValidationOutcome.INVALID);

    expect(document.validation).toBe(ValidationOutcome.INVALID);
    // The invalid Paragraph's own Sentence-level error (from
    // ClauseReader.validate one level down) is still reachable from the
    // Document's own errors -- nothing gets dropped walking up the
    // hierarchy.
    expect(document.errors.some((error) => error.message.includes("predicate"))).toBe(true);
  });

  it("readParagraph aggregates worst-outcome validation across its own Sentences", () => {
    const controller = seededController();
    const paragraph = controller.readParagraph("A meaning is a representation. The fox over the dog.");
    expect(paragraph.sentences).toHaveLength(2);
    expect(paragraph.sentences[0].validation).toBe(ValidationOutcome.VALID);
    expect(paragraph.sentences[1].validation).toBe(ValidationOutcome.INVALID);
    expect(paragraph.validation).toBe(ValidationOutcome.INVALID);
  });

  it("tokenizePrompt's write path (unvalidated) also classifies Heading vs Paragraph lines the same way", () => {
    const controller = seededController();
    const document = controller.tokenizePrompt(createUserPrompt("## Title\nSome paragraph text here."));
    expect(document.blocks).toHaveLength(2);
    expect(document.blocks[0].blockKind).toBe("heading");
    expect(document.blocks[1].blockKind).toBe("paragraph");
  });
});

describe("Phrase support: multi-word Dictionary entries recognised while reading", () => {
  it("TokenResolver.resolveSentence collapses \"no one else\" into one TokenReading, not three", () => {
    const controller = seededController();
    const readings = controller.readingContext.tokenResolver.resolveSentence("He wanted no one else to know the truth.");

    const phraseReading = readings.find((reading) => reading.text === "no one else");
    expect(phraseReading).toBeDefined();
    expect(phraseReading?.tokenSpan).toBe(3);
    expect(phraseReading?.candidates.some((c) => c.partOfSpeech === PartOfSpeech.PRONOUN)).toBe(true);

    // 10 raw tokens (He/wanted/no/one/else/to/know/the/truth/.) collapse
    // to 8 readings once "no one else" is read as the single closed-class
    // entry it's seeded as.
    expect(readings).toHaveLength(8);
    expect(readings.some((reading) => reading.text === "no" || reading.text === "one" || reading.text === "else")).toBe(false);
  });

  it("readSentence materialises the phrase as a single Word token in the clause", () => {
    const controller = seededController();
    const sentence = controller.readSentence("He wanted no one else to know the truth.");

    const clauseWords = sentence.clauses[0].tokens;
    const phraseWord = clauseWords.find((word) => word.text === "no one else");
    expect(phraseWord).toBeDefined();
    expect(phraseWord?.partOfSpeech).toBe(PartOfSpeech.PRONOUN);
  });
});

describe("Learned lexical transition evidence (spec 15-24, Proposed)", () => {
  it("never records anything on its own -- reading a sentence alone leaves evidenceStore empty", () => {
    const controller = seededController();
    controller.readSentence("A meaning is a representation.");
    expect(controller.evidenceStore.totalObservations).toBe(0);
  });

  it("recordObservedReading is a no-op for a sentence that didn't validate (spec 17: only validated observations reinforce)", () => {
    const controller = seededController();
    const sentence = controller.readSentence("The fox over the dog.");
    expect(sentence.validation).toBe(ValidationOutcome.INVALID);

    const recorded = controller.recordObservedReading(sentence);
    expect(recorded).toBe(0);
    expect(controller.evidenceStore.totalObservations).toBe(0);
  });

  it("recordObservedReading reinforces every real transition in a VALID reading, and that evidence feeds a later scoringFactors call", () => {
    const controller = seededController();
    const sentence = controller.readSentence("A meaning is a representation.");
    expect(sentence.validation).toBe(ValidationOutcome.VALID);

    const recorded = controller.recordObservedReading(sentence);
    expect(recorded).toBeGreaterThan(0);
    expect(controller.evidenceStore.totalObservations).toBe(recorded);

    // Both "A meaning" (subject) and "a representation" (complement)
    // are NOUN_PHRASEs starting with a DETERMINER, so phrase-start (no
    // fromState) -> DETERMINER is a transition this one reading walked
    // twice -- it must have been reinforced.
    const firstWeight = controller.evidenceStore.weightFor(PhraseType.NOUN_PHRASE, undefined, PartOfSpeech.DETERMINER);
    expect(firstWeight).toBeGreaterThan(0);
    // A transition this reading never walked stays at 0 -- recording is
    // specific to what was actually observed, not a blanket bump.
    expect(controller.evidenceStore.weightFor(PhraseType.VERB_PHRASE, undefined, PartOfSpeech.NOUN)).toBe(0);

    // Reading the identical sentence again reinforces the same
    // transitions further -- spec 19's "repeated observations ...
    // changes lexicalEvidenceSum".
    const secondReading = controller.readSentence("A meaning is a representation.");
    const secondRecorded = controller.recordObservedReading(secondReading);
    expect(controller.evidenceStore.totalObservations).toBe(recorded + secondRecorded);
    expect(controller.evidenceStore.weightFor(PhraseType.NOUN_PHRASE, undefined, PartOfSpeech.DETERMINER)).toBe(firstWeight * 2);
  });
});

describe("MainClause/SubordinateClause -- Clause's own two narrowing subtypes", () => {
  it("isMainClause/isSubordinateClause distinguish INDEPENDENT from the other three ClauseType values", () => {
    // No real ClauseReader.read() call produces a SubordinateClause yet
    // (clause-level recursion for DEPENDENT/RELATIVE/COORDINATED isn't
    // implemented -- subordinate_clause.ts's own docstring), so this is
    // a pure, hand-built construction rather than a real seeded reading,
    // the same way this module's own synthetic edge-case tests already
    // are for cases with no real bundled example.
    const subordinateTypes: readonly SubordinateClauseType[] = [ClauseType.DEPENDENT, ClauseType.RELATIVE, ClauseType.COORDINATED];
    for (const clauseType of subordinateTypes) {
      const subordinate = createSubordinateClause({ text: "because it rained", clauseType });
      expect(isSubordinateClause(subordinate)).toBe(true);
      expect(isMainClause(subordinate)).toBe(false);
    }
  });
});
