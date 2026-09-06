import { describe, expect, it } from "vitest";
import { Dictionary } from "../vocabulary/data/dictionary";
import { PartOfSpeech } from "../vocabulary/data/enums/part_of_speech";
import { Phrases } from "../vocabulary/data/phrases";
import { Senses } from "../vocabulary/data/senses";
import { WordForms } from "../vocabulary/data/word_forms";
import { MorphologicalPointerRelationshipStore } from "../vocabulary/data/morphological_pointer_relationship_store";
import { MorphologicalPointerRelationshipSystemPropertyTensor } from "../vocabulary/data/morphological_pointer_relationship_tensor";
import { SemanticRelationshipStore } from "../vocabulary/data/semantic_relationship_store";
import { SemanticRelationshipSystemPropertyTensor } from "../vocabulary/data/semantic_relationship_tensor";
import { MorphologicalPointerRelationshipProcessor } from "../vocabulary/role/morphological_pointer_relationship_processor";
import { SemanticRelationshipProcessor } from "../vocabulary/role/semantic_relationship_processor";
import { AsyncDictionaryHydrator } from "../vocabulary/role/dictionary_hydrator";
import { DictionaryProcessor } from "../vocabulary/role/dictionary_processor";
import { WordSeeder } from "../vocabulary/role/word_seeder";
import { createNoun } from "../vocabulary/role/processor/noun_processor";
import { createVerb } from "../vocabulary/role/processor/verb_processor";
import { createAdjective } from "../vocabulary/role/processor/adjective_processor";
import { GrammarConfigurator } from "./role/grammar_configurator";
import { LinguisticController } from "./role/linguistic_controller";
import { ValidationOutcome } from "./data/validation_outcome";
import { PhraseType } from "./data/phrase_type";
import type { Phrase } from "./data/phrase";
import { ClauseType } from "./data/clause_type";
import { isMainClause } from "./data/main_clause";
import { createSubordinateClause, isSubordinateClause, type SubordinateClauseType } from "./data/subordinate_clause";
import { createDeclarativeMainClause, isDeclarativeMainClause } from "./data/declarative_main_clause";
import { createInterrogativeMainClause, isInterrogativeMainClause } from "./data/interrogative_main_clause";
import { createImperativeMainClause, isImperativeMainClause } from "./data/imperative_main_clause";
import { createExclamativeMainClause, isExclamativeMainClause } from "./data/exclamative_main_clause";
import { createClause, type Clause } from "./data/clause";
import { createPhrase } from "./data/phrase";
import { isNounPhrase, type NounPhrase } from "./data/noun_phrase";
import { isVerbPhrase, type VerbPhrase } from "./data/verb_phrase";
import { isPrepositionalPhrase, type PrepositionalPhrase } from "./data/prepositional_phrase";
import { SentenceType } from "./data/sentence_type";
import { ReadingErrorKind } from "./data/reading_error";
import { LinguisticUnitKind } from "./data/linguistic_unit_kind";
import { createUserPrompt } from "./ui/user_prompt";
import { createScoringFactors, ReadingScorer } from "./role/reading_scorer";

function seededController(): LinguisticController {
  const dictionary = new Dictionary();
  const phraseBook = new Phrases();
  const wordForms = new WordForms();
  new WordSeeder("en").seedClosedClassWords(dictionary, phraseBook, undefined, undefined, wordForms);
  const hydrator = new AsyncDictionaryHydrator(dictionary);
  const processor = new DictionaryProcessor(dictionary, phraseBook, hydrator, "Common", wordForms);
  return new LinguisticController(processor);
}

// Real WordNet + real closed-class seeding, the same combination the
// deployed app's own "Seed Vocabulary" + "Load WordNet" actions run one
// after the other (vocabulary/role/web_worker/vocabulary_worker.ts) --
// needed for the clause-embedding tests below (data_entity_design_decisions_log.md's
// own diagnosis: both real reported sentences depend on real WordNet
// homograph resolution -- "unlocked"/"surprised" each genuinely being
// both an ADJECTIVE lemma and a VERB inflection, "happened" needing a
// real generated past-tense WordForm -- that a hand-seeded stand-in
// Dictionary can't be trusted to reproduce faithfully). Mirrors
// vocabulary.test.ts's own seededVocabularyFixture() -- memoized once per
// file, not reseeded per test, since WordSeeder.seedWordNet() alone
// reconstructs the whole ~92,000-Word graph from scratch every call.
let sharedWordNetController: Promise<LinguisticController> | undefined;

function seededWordNetController(): Promise<LinguisticController> {
  if (sharedWordNetController === undefined) {
    sharedWordNetController = (async () => {
      const dictionary = new Dictionary();
      const phraseBook = new Phrases();
      const senseStore = new Senses();
      const wordForms = new WordForms();
      const morphologicalPointerRelationships = new MorphologicalPointerRelationshipStore();
      const semanticRelationships = new SemanticRelationshipStore();
      const morphologicalPointerRelationshipProcessor = new MorphologicalPointerRelationshipProcessor(
        morphologicalPointerRelationships,
        new MorphologicalPointerRelationshipSystemPropertyTensor(),
      );
      const semanticRelationshipProcessor = new SemanticRelationshipProcessor(
        semanticRelationships,
        new SemanticRelationshipSystemPropertyTensor(),
      );
      const domain = {
        vocabulary: {
          dictionary, phrases: phraseBook, senses: senseStore, wordForms,
          morphologicalPointerRelationships, morphologicalPointerRelationshipProcessor,
          semanticRelationships, semanticRelationshipProcessor,
        },
      };
      new WordSeeder("en").seedDomain(domain, { excludeOpenClasses: true });
      await new WordSeeder("en").seedWordNet(domain);
      const hydrator = new AsyncDictionaryHydrator(dictionary);
      const processor = new DictionaryProcessor(dictionary, phraseBook, hydrator, "Common", wordForms);
      return new LinguisticController(processor);
    })();
  }
  return sharedWordNetController;
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
    // clause.subject is `Phrase | Clause | undefined` now
    // (declarative_main_clause.ts's own subject narrowing), but a real
    // ClauseReader.read() call only ever assigns a Phrase to it today
    // (no clause-embedding grammar exists yet) -- this cast reflects
    // that, the same way linguistics_worker.ts's own "words" in ...
    // check narrows it at runtime.
    expect((clause.subject as Phrase | undefined)?.phraseType).toBe(PhraseType.NOUN_PHRASE);
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
    // A real ClauseReader.read() call now does produce a genuine
    // ClauseType.DEPENDENT SubordinateClause -- the "ClauseReader
    // recognises an embedded nominal subject clause" describe block
    // below, against real seeded WordNet data -- but RELATIVE/
    // COORDINATED (clause-level recursion for a genuine relative clause
    // or clause coordination) still aren't implemented at all
    // (subordinate_clause.ts's own docstring), so those two stay a pure,
    // hand-built construction here, the same way this module's own
    // synthetic edge-case tests already are for cases with no real
    // bundled example.
    const subordinateTypes: readonly SubordinateClauseType[] = [ClauseType.DEPENDENT, ClauseType.RELATIVE, ClauseType.COORDINATED];
    for (const clauseType of subordinateTypes) {
      const subordinate = createSubordinateClause({ text: "because it rained", clauseType });
      expect(isSubordinateClause(subordinate)).toBe(true);
      expect(isMainClause(subordinate)).toBe(false);
    }
  });
});

describe("DeclarativeMainClause/InterrogativeMainClause/ImperativeMainClause/ExclamativeMainClause -- MainClause's own four mood subtypes", () => {
  it("each is* guard recognises only its own constructor's output, over both mood and every sibling mood", () => {
    // No real ClauseReader.read() call sets `mood` yet -- no
    // mood-classifying grammar exists (main_clause.ts's own docstring),
    // so these are pure, hand-built constructions, the same synthetic
    // approach the MainClause/SubordinateClause split above already
    // uses for its own still-undetected case.
    const declarative = createDeclarativeMainClause({ text: "She opened the door." });
    const interrogative = createInterrogativeMainClause({ text: "Did she open the door?" });
    const imperative = createImperativeMainClause({ text: "Open the door." });
    const exclamative = createExclamativeMainClause({ text: "What a beautiful day it is!" });

    expect(declarative.mood).toBe(SentenceType.DECLARATIVE);
    expect(interrogative.mood).toBe(SentenceType.INTERROGATIVE);
    expect(imperative.mood).toBe(SentenceType.IMPERATIVE);
    expect(exclamative.mood).toBe(SentenceType.EXCLAMATORY);

    // Every one is still a real MainClause underneath its own mood.
    for (const clause of [declarative, interrogative, imperative, exclamative]) {
      expect(isMainClause(clause)).toBe(true);
    }

    expect(isDeclarativeMainClause(declarative)).toBe(true);
    expect(isDeclarativeMainClause(interrogative)).toBe(false);
    expect(isDeclarativeMainClause(imperative)).toBe(false);
    expect(isDeclarativeMainClause(exclamative)).toBe(false);

    expect(isInterrogativeMainClause(interrogative)).toBe(true);
    expect(isInterrogativeMainClause(declarative)).toBe(false);

    expect(isImperativeMainClause(imperative)).toBe(true);
    expect(isImperativeMainClause(declarative)).toBe(false);

    expect(isExclamativeMainClause(exclamative)).toBe(true);
    expect(isExclamativeMainClause(declarative)).toBe(false);
  });
});

describe("MainClause mood subtypes' own subject/predicate narrowing", () => {
  it("Declarative/Interrogative/Exclamative accept a NounPhrase, PrepositionalPhrase, or embedded Clause subject and a VerbPhrase predicate", () => {
    const nounPhrase = createPhrase({ text: "she", phraseType: PhraseType.NOUN_PHRASE }) as NounPhrase;
    const prepositionalPhrase = createPhrase({ text: "in the garden", phraseType: PhraseType.PREPOSITIONAL_PHRASE }) as PrepositionalPhrase;
    const verbPhrase = createPhrase({ text: "opened the door", phraseType: PhraseType.VERB_PHRASE }) as VerbPhrase;
    const embeddedClause = createClause({ text: "that she left" });

    expect(isNounPhrase(nounPhrase)).toBe(true);
    expect(isPrepositionalPhrase(prepositionalPhrase)).toBe(true);
    expect(isVerbPhrase(verbPhrase)).toBe(true);

    for (const subject of [nounPhrase, prepositionalPhrase, embeddedClause]) {
      const declarative = createDeclarativeMainClause({ text: "...", subject, predicate: verbPhrase });
      expect(declarative.subject).toBe(subject);
      expect(declarative.predicate).toBe(verbPhrase);
    }
  });

  it("Imperative accepts only a NounPhrase subject (or none), never a PrepositionalPhrase or embedded Clause", () => {
    const nounPhrase = createPhrase({ text: "you", phraseType: PhraseType.NOUN_PHRASE }) as NounPhrase;
    const verbPhrase = createPhrase({ text: "open the door", phraseType: PhraseType.VERB_PHRASE }) as VerbPhrase;

    const withSubject = createImperativeMainClause({ text: "You open the door.", subject: nounPhrase, predicate: verbPhrase });
    expect(withSubject.subject).toBe(nounPhrase);

    const withoutSubject = createImperativeMainClause({ text: "Open the door.", predicate: verbPhrase });
    expect(withoutSubject.subject).toBeUndefined();
  });
});

describe("ReadingScorer -- rankKey's own VERB_PHRASE tie-break", () => {
  it("prefers a VERB_PHRASE candidate over an otherwise-tied non-VERB_PHRASE one, even when the last-resort tie-break would have favoured the other", () => {
    // Mirrors the real reported case: "The old house stands on the
    // hill." -- "stands" is a genuine NOUN ("stands", plural of the
    // furniture/vending sense)/VERB ("stands", third-person-singular of
    // "stand") homograph, every other ranking factor genuinely tied
    // (both a bare single-token completion, both VALID, no obligations).
    // The noun candidate is given a *better* (lower) candidateRankIndexSum
    // here on purpose, to prove isVerbPhraseCandidate's own earlier
    // tuple position actually outranks that tie-break, not just happens
    // to agree with it -- without this fix, the noun reading would win,
    // and the clause it belongs to would then find no VERB_PHRASE for
    // its own predicate at all (MISSING_PREDICATE/INVALID).
    const scorer = new ReadingScorer();
    const nounCandidate = createScoringFactors({ validation: ValidationOutcome.VALID, isVerbPhraseCandidate: 0, candidateRankIndexSum: 0 });
    const verbCandidate = createScoringFactors({ validation: ValidationOutcome.VALID, isVerbPhraseCandidate: 1, candidateRankIndexSum: 5 });
    const ranked = scorer.rank([["noun", nounCandidate], ["verb", verbCandidate]] as const);
    expect(ranked[0]).toBe("verb");
  });

  it("still lets a genuinely worse VERB_PHRASE candidate lose to a genuinely better non-VERB_PHRASE one -- this is a tie-break, not an override of real validation/span/obligation signals", () => {
    const scorer = new ReadingScorer();
    const invalidVerb = createScoringFactors({ validation: ValidationOutcome.INVALID, isVerbPhraseCandidate: 1 });
    const validNoun = createScoringFactors({ validation: ValidationOutcome.VALID, isVerbPhraseCandidate: 0 });
    const ranked = scorer.rank([["verb", invalidVerb], ["noun", validNoun]] as const);
    expect(ranked[0]).toBe("noun");
  });
});

describe("VERB_PHRASE grammar -- a bare AUXILIARY completes a copula predicate", () => {
  it("reads a copula sentence as VALID even when \"is\" only ever resolves via the INFLECTED_FORM fallback onto AUXILIARY \"be\", never a standalone VERB Dictionary entry -- the deployed app's own real seeding shape (Vocabulary tab's \"Seed Vocabulary\" action calls WordSeeder.seedDomain with excludeOpenClasses:true, word_seeder.ts's own seedClosedClassWords docstring), unlike seededController() above which seeds with excludeOpenClasses defaulted to false and so still gets a standalone closed-class \"is\" VERB entry that would mask this bug", () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    const wordForms = new WordForms();
    new WordSeeder("en").seedClosedClassWords(dictionary, phraseBook, { excludeOpenClasses: true }, undefined, wordForms);
    // No standalone Dictionary entry for "is" -- only reachable via the
    // inflected-form fallback onto AUXILIARY "be" (PartOfSpeechIdentifier.identifySeeded()'s
    // own two-tier lookup).
    expect(dictionary.lookupAll("is")).toHaveLength(0);
    expect(wordForms.lookupByText("is").some(({ word }) => word.partOfSpeech === PartOfSpeech.AUXILIARY)).toBe(true);
    dictionary.append(createNoun({ text: "meaning" }));
    dictionary.append(createNoun({ text: "representation" }));
    const hydrator = new AsyncDictionaryHydrator(dictionary, wordForms);
    const processor = new DictionaryProcessor(dictionary, phraseBook, hydrator, "Common", wordForms);
    const controller = new LinguisticController(processor);

    const sentence = controller.readSentence("A meaning is a representation.");
    expect(sentence.validation).toBe(ValidationOutcome.VALID);
    const clause = sentence.clauses[0];
    expect(clause.predicate?.phraseType).toBe(PhraseType.VERB_PHRASE);
    expect(clause.predicate?.text).toBe("is");
    // Still a linking-verb complement, not an object -- LINKING_VERB_FORMS
    // matches "is" by its own headWord text, not by POS, so this stays
    // unaffected by "is" now resolving as AUXILIARY instead of VERB.
    expect(clause.complement?.phraseType).toBe(PhraseType.NOUN_PHRASE);
    expect(clause.object).toBeUndefined();
  });

  it("still prefers the longer auxiliary-chain reading over stopping bare at the AUXILIARY when a real main verb follows (maximal munch) -- \"was unlocked\" reads as one VERB_PHRASE, not \"was\" alone with \"unlocked\" left dangling", () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    const wordForms = new WordForms();
    new WordSeeder("en").seedClosedClassWords(dictionary, phraseBook, { excludeOpenClasses: true }, undefined, wordForms);
    dictionary.append(createNoun({ text: "door" }));
    dictionary.append(createVerb({ text: "unlocked" }));
    const hydrator = new AsyncDictionaryHydrator(dictionary, wordForms);
    const processor = new DictionaryProcessor(dictionary, phraseBook, hydrator, "Common", wordForms);
    const controller = new LinguisticController(processor);

    const sentence = controller.readSentence("The door was unlocked.");
    expect(sentence.validation).toBe(ValidationOutcome.VALID);
    const clause = sentence.clauses[0];
    expect(clause.predicate?.text).toBe("was unlocked");
  });
});

describe("ClauseReader.assignRoles() -- subject-auxiliary inversion", () => {
  it("reads 'Did the young woman open the gate?' as VALID with the NounPhrase after the fronted AUXILIARY assigned as SUBJECT, not OBJECT", () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    const wordForms = new WordForms();
    new WordSeeder("en").seedClosedClassWords(dictionary, phraseBook, undefined, undefined, wordForms);
    dictionary.append(createAdjective({ text: "young" }));
    dictionary.append(createNoun({ text: "woman" }));
    dictionary.append(createVerb({ text: "open" }));
    dictionary.append(createNoun({ text: "gate" }));
    const hydrator = new AsyncDictionaryHydrator(dictionary, wordForms);
    const processor = new DictionaryProcessor(dictionary, phraseBook, hydrator, "Common", wordForms);
    const controller = new LinguisticController(processor);

    const sentence = controller.readSentence("Did the young woman open the gate?");
    expect(sentence.validation).toBe(ValidationOutcome.VALID);
    const clause = sentence.clauses[0];
    expect((clause.subject as Phrase | undefined)?.phraseType).toBe(PhraseType.NOUN_PHRASE);
    expect((clause.subject as Phrase | undefined)?.text).toBe("the young woman");
    expect(clause.object?.text).toBe("the gate");
  });
});

describe("ClauseReader.assignRoles() -- PrepositionalPhrase as clause subject (locative inversion)", () => {
  it("reads 'Under the bridge stands a statue.' as VALID with the PrepositionalPhrase assigned as SUBJECT", () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    const wordForms = new WordForms();
    new WordSeeder("en").seedClosedClassWords(dictionary, phraseBook, undefined, undefined, wordForms);
    dictionary.append(createNoun({ text: "bridge" }));
    dictionary.append(createVerb({ text: "stands" }));
    dictionary.append(createNoun({ text: "statue" }));
    const hydrator = new AsyncDictionaryHydrator(dictionary, wordForms);
    const processor = new DictionaryProcessor(dictionary, phraseBook, hydrator, "Common", wordForms);
    const controller = new LinguisticController(processor);

    const sentence = controller.readSentence("Under the bridge stands a statue.");
    expect(sentence.validation).toBe(ValidationOutcome.VALID);
    const clause = sentence.clauses[0];
    expect((clause.subject as Phrase | undefined)?.phraseType).toBe(PhraseType.PREPOSITIONAL_PHRASE);
    expect((clause.subject as Phrase | undefined)?.text).toBe("Under the bridge");
    expect(clause.predicate?.phraseType).toBe(PhraseType.VERB_PHRASE);
  });
});

describe("ClauseReader recognises an embedded nominal subject clause (clause_embedding.ts)", () => {
  it("reads 'That the door was unlocked surprised everyone.' as VALID with a real ClauseType.DEPENDENT SubordinateClause as SUBJECT -- the complementizer case", async () => {
    const controller = await seededWordNetController();
    const sentence = controller.readSentence("That the door was unlocked surprised everyone.");
    expect(sentence.validation).toBe(ValidationOutcome.VALID);

    const clause = sentence.clauses[0];
    const embedded = clause.subject as Clause;
    expect(embedded.clauseType).toBe(ClauseType.DEPENDENT);
    expect(isSubordinateClause(embedded)).toBe(true);
    expect(embedded.text).toBe("the door was unlocked");
    expect((embedded.subject as Phrase).text).toBe("the door");
    expect(embedded.predicate?.text).toBe("was unlocked");

    // The real matrix predicate -- "surprised" -- not stranded as a
    // modifier the way it used to be before this recognised "the door
    // was unlocked" as one embedded constituent (data_entity_design_decisions_log.md).
    expect(clause.predicate?.phraseType).toBe(PhraseType.VERB_PHRASE);
    expect(clause.predicate?.text).toBe("surprised");
    expect(clause.object?.text).toBe("everyone");
    expect(clause.nestedClauses).toEqual([embedded]);

    // "That" itself is consumed as a pure complementizer -- never a
    // Phrase of its own, correctly -- but must still be a real word in
    // this clause's own reconstructed text/tokens, not silently dropped
    // the way a consumed-but-never-materialised token once made "is"
    // vanish from a read Sentence entirely (this session's own
    // AUXILIARY/`is` mystery, data_entity_design_decisions_log.md).
    expect(clause.text).toBe("That the door was unlocked surprised everyone");
    expect(clause.tokens[0]?.text).toBe("That");
  });

  it("reads 'Did what happened yesterday surprise you?' as VALID with a real ClauseType.DEPENDENT SubordinateClause as SUBJECT -- the free-relative case, past the fronted AUXILIARY", async () => {
    const controller = await seededWordNetController();
    const sentence = controller.readSentence("Did what happened yesterday surprise you?");
    expect(sentence.validation).toBe(ValidationOutcome.VALID);

    const clause = sentence.clauses[0];
    const embedded = clause.subject as Clause;
    expect(embedded.clauseType).toBe(ClauseType.DEPENDENT);
    expect(embedded.text).toBe("what happened yesterday");
    expect((embedded.subject as Phrase).text).toBe("what");
    expect(embedded.predicate?.text).toBe("happened");

    // The matrix predicate stays bound to the fronted AUXILIARY alone --
    // the same discontinuous-predicate limitation
    // "Did the young woman open the gate?" already has above, unrelated
    // to and unchanged by this fix.
    expect(clause.predicate?.text).toBe("Did");
    expect(clause.object?.text).toBe("you");
  });

  it("falls back to the ordinary flat reading, unaffected, when the trigger word never resolves into a valid embedded clause -- 'That is fine.'", () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    const wordForms = new WordForms();
    new WordSeeder("en").seedClosedClassWords(dictionary, phraseBook, undefined, undefined, wordForms);
    dictionary.append(createAdjective({ text: "fine" }));
    const hydrator = new AsyncDictionaryHydrator(dictionary, wordForms);
    const processor = new DictionaryProcessor(dictionary, phraseBook, hydrator, "Common", wordForms);
    const controller = new LinguisticController(processor);

    const sentence = controller.readSentence("That is fine.");
    expect(sentence.validation).toBe(ValidationOutcome.VALID);
    const clause = sentence.clauses[0];
    // "That" itself is the (ordinary, unembedded) subject -- no boundary
    // ever satisfies embeddedSubjectClauseSpan()'s own two conditions
    // here (neither "is" alone nor "is fine" is a valid embedded clause:
    // AUXILIARY/ADJECTIVE, never subject-shaped), so this clause never
    // even attempts a Clause-typed subject.
    expect((clause.subject as Phrase | undefined)?.text).toBe("That");
    expect(clause.nestedClauses).toEqual([]);
  });

  it("never fires for an ordinary declarative with no complementizer/free-relative trigger at all -- regression, 'A meaning is a representation.' unaffected", () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    const wordForms = new WordForms();
    new WordSeeder("en").seedClosedClassWords(dictionary, phraseBook, { excludeOpenClasses: true }, undefined, wordForms);
    dictionary.append(createNoun({ text: "meaning" }));
    dictionary.append(createNoun({ text: "representation" }));
    const hydrator = new AsyncDictionaryHydrator(dictionary, wordForms);
    const processor = new DictionaryProcessor(dictionary, phraseBook, hydrator, "Common", wordForms);
    const controller = new LinguisticController(processor);

    const sentence = controller.readSentence("A meaning is a representation.");
    expect(sentence.validation).toBe(ValidationOutcome.VALID);
    const clause = sentence.clauses[0];
    expect((clause.subject as Phrase | undefined)?.phraseType).toBe(PhraseType.NOUN_PHRASE);
    expect((clause.subject as Phrase | undefined)?.text).toBe("A meaning");
    expect(clause.nestedClauses).toEqual([]);
  });
});

