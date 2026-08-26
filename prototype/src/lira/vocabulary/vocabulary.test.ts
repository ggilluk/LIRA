import { describe, expect, it } from "vitest";
import { Dictionary } from "./data/dictionary";
import { MorphologicalPointerRelationshipStore } from "./data/morphological_pointer_relationship_store";
import { MorphologicalPointerRelationshipSystemPropertyTensor } from "./data/morphological_pointer_relationship_tensor";
import { LexicalRelationshipType } from "./data/enums/lexical_relationship_type";
import { SemanticRelationshipStore } from "./data/semantic_relationship_store";
import { SemanticRelationshipSystemPropertyTensor } from "./data/semantic_relationship_tensor";
import { SemanticRelationshipKind } from "./data/enums/semantic_relationship_kind";
import { SemanticRelationshipProcessor } from "./role/semantic_relationship_processor";
import { PartOfSpeech } from "./data/enums/part_of_speech";
import { WordFormField } from "./data/enums/word_forms_enum";
import type { Word } from "./data/entities/word";
import { createWord, graphUuid as wordGraphUuid, validateFormText } from "./role/word_processor";
import { stringPatternsFor } from "./data/matrices/pos_vs_wordform_matrice";
import { AdjectivePosition } from "./data/enums/adjective_position";
import { createAdjective, determineGradability, generateAdjectiveForms, isAdjective, syntacticPositionForSense, validateAdjective } from "./role/processor/adjective_processor";
import type { Adjective } from "./data/entities/adjective";
import { createAdverb, determineGradability as determineAdverbGradability, generateAdverbForms, isAdverb, validateAdverb } from "./role/processor/adverb_processor";
import type { Adverb } from "./data/entities/adverb";
import { isConjunction } from "./role/processor/conjunction_processor";
import { createDeterminer, isDeterminer, validateDeterminer } from "./role/processor/determiner_processor";
import { HypernymRootWord } from "./data/enums/hypernym_root_word";
import { isInterjection } from "./role/processor/interjection_processor";
import { createNoun, generateNounForms, isNoun, validateNoun } from "./role/processor/noun_processor";
import type { Noun } from "./data/entities/noun";
import { WordForms } from "./data/word_forms";
import { isNumeral } from "./role/processor/numeral_processor";
import { isPreposition } from "./role/processor/preposition_processor";
import { createPronoun, isPronoun, validatePronoun } from "./role/processor/pronoun_processor";
import { createVerb, framesForSense, generateVerbForms, isVerb, validateVerb } from "./role/processor/verb_processor";
import type { Verb } from "./data/entities/verb";
import { createPhrase, type Phrase } from "./data/phrase";
import { Phrases } from "./data/phrases";
import { PHRASE_TYPE_DETAILS, PhraseType } from "./data/enums/phrase_type";
import { PhraseRole } from "./data/enums/phrase_role";
import { isNounPhrase } from "./data/entities/noun_phrase";
import { isVerbPhrase } from "./data/entities/verb_phrase";
import { isAdjectivePhrase } from "./data/entities/adjective_phrase";
import { isAdverbPhrase } from "./data/entities/adverb_phrase";
import { isPrepositionalPhrase } from "./data/prepositional_phrase";
import { isInfinitivePhrase } from "./data/infinitive_phrase";
import { createSense, graphUuid as senseGraphUuid } from "./role/sense_processor";
import { Senses, memberUuid } from "./data/senses";
import { AsyncDictionaryHydrator } from "./role/dictionary_hydrator";
import { DictionaryProcessor } from "./role/dictionary_processor";
import { MorphologicalPointerRelationshipProcessor } from "./role/morphological_pointer_relationship_processor";
import { RelationshipSeeder } from "./role/relationship_seeder";
import { classifyPhraseRoles, classifyPhraseType, WordSeeder } from "./role/word_seeder";
import { NounCharacterFormSeeder } from "./role/noun_character_form_seeder";
import { PrepositionSenseSeeder } from "./role/preposition_sense_seeder";
import { IdentificationSource } from "./role/word_identifier";
import { loadWordNetSynsets } from "./role/wordnet_loader";
import { DictionaryView } from "./ui/server/dictionary_controller";

// generateXForms()'s own migrated POS types register a WordForm instead
// of assigning a named scalar field -- this reads one back the same way
// `word.field` used to, for test assertions.
function formTextOf(wordForms: WordForms, word: Word, field: string) {
  return wordForms.formsOf(word).find((form) => form.field === field)?.text;
}

// Word carries no `senseIds` of its own any more (WordForm's own
// docstring on why -- it lives on the base-lemma WordForm now);
// Phrase keeps its own field, untouched. This resolves either the
// same way word_seeder.ts's/resolver_domain.ts's own `"words" in
// entry` narrowing already does everywhere in production code.
function senseIdsOf(wordForms: WordForms, entry: Word | Phrase) {
  return "words" in entry ? entry.senseIds : wordForms.senseIdsOf(entry);
}

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

  it("PHRASE_TYPE_DETAILS.allowedTypes matches data/phrase_type_patterns_and_word_roles.md's own Phrase Role Allowed Types table, PhraseType by PhraseType", () => {
    expect(PHRASE_TYPE_DETAILS[PhraseType.NOUN_PHRASE].allowedTypes).toEqual({
      [PhraseRole.HEAD]: ["Noun", "Pronoun"],
      [PhraseRole.DETERMINER]: ["Determiner"],
      [PhraseRole.MODIFIER]: ["Adjective", "AdjectivePhrase", "Noun", "NounPhrase", "AdverbPhrase", "PrepositionalPhrase", "Clause"],
      [PhraseRole.COMPLEMENT]: ["PrepositionalPhrase", "Clause"],
    });
    expect(PHRASE_TYPE_DETAILS[PhraseType.VERB_PHRASE].allowedTypes).toEqual({
      [PhraseRole.HEAD]: ["Verb"],
      [PhraseRole.MODIFIER]: ["Adverb", "AdverbPhrase"],
      [PhraseRole.PARTICLE]: ["Adverb"],
    });
    expect(PHRASE_TYPE_DETAILS[PhraseType.ADJECTIVE_PHRASE].allowedTypes).toEqual({
      [PhraseRole.HEAD]: ["Adjective"],
      [PhraseRole.MODIFIER]: ["Adverb", "AdverbPhrase"],
      [PhraseRole.COMPLEMENT]: ["PrepositionalPhrase", "Clause"],
    });
    expect(PHRASE_TYPE_DETAILS[PhraseType.ADVERB_PHRASE].allowedTypes).toEqual({
      [PhraseRole.HEAD]: ["Adverb"],
      [PhraseRole.MODIFIER]: ["Adverb", "AdverbPhrase"],
    });
    expect(PHRASE_TYPE_DETAILS[PhraseType.PREPOSITIONAL_PHRASE].allowedTypes).toEqual({
      [PhraseRole.HEAD]: ["Preposition"],
      [PhraseRole.MODIFIER]: ["Adverb", "AdverbPhrase"],
      [PhraseRole.COMPLEMENT]: ["NounPhrase", "Pronoun", "Adverb", "AdverbPhrase", "PrepositionalPhrase", "Clause"],
    });
    // INFINITIVE_PHRASE carries no Phrase Role Allowed Types row in that
    // document, the same reason it carries no Phrase Type Classes row --
    // PHRASE_TYPE_DETAILS's own docstring on why.
    expect(PHRASE_TYPE_DETAILS[PhraseType.INFINITIVE_PHRASE].allowedTypes).toEqual({});
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

describe("validateFormText (role/word_processor.ts) -- the mechanism every POS class's own validate<Class>() reuses", () => {
  it("treats an unset formats as always valid -- no claim made, nothing to check", () => {
    expect(validateFormText(WordFormField.PLURAL_NUMBER_FORM, { value: "dogs" }, stringPatternsFor(WordFormField.PLURAL_NUMBER_FORM, PartOfSpeech.NOUN))).toBeUndefined();
  });

  it("accepts a recognised pattern that actually matches the value", () => {
    expect(
      validateFormText(WordFormField.PLURAL_NUMBER_FORM, { value: "dogs", formats: ["/s$/i"] }, stringPatternsFor(WordFormField.PLURAL_NUMBER_FORM, PartOfSpeech.NOUN)),
    ).toBeUndefined();
  });

  it("flags a recognised pattern that does not match the value", () => {
    const issue = validateFormText(WordFormField.PLURAL_NUMBER_FORM, { value: "dog", formats: ["/s$/i"] }, stringPatternsFor(WordFormField.PLURAL_NUMBER_FORM, PartOfSpeech.NOUN));
    expect(issue?.reason).toContain("does not match its own claimed format");
  });

  it("flags a format string that isn't a recognised String Pattern for that field", () => {
    // /ed$/i is a real pattern -- just not one of Noun.pluralNumberForm's own.
    const issue = validateFormText(WordFormField.PLURAL_NUMBER_FORM, { value: "walked", formats: ["/ed$/i"] }, stringPatternsFor(WordFormField.PLURAL_NUMBER_FORM, PartOfSpeech.NOUN));
    expect(issue?.reason).toContain("is not a recognised String Pattern");
  });

  it("flags any claimed format on a field the matrix marks fully N/A (empty pattern array)", () => {
    const issue = validateFormText(WordFormField.BASE_LEMMA_CANONICAL_FORM, { value: "dog", formats: ["/s$/i"] }, []);
    expect(issue?.reason).toContain("is not a recognised String Pattern");
  });

  it("scopes patterns per (class, field), not just per field name -- Noun's own apostrophe rule is not valid on Pronoun's identically-named field", () => {
    // Noun.possessiveCaseForm genuinely accepts this (the apostrophe rule).
    expect(
      validateFormText(WordFormField.POSSESSIVE_CASE_FORM, { value: "dog's", formats: ["/'s$/i"] }, stringPatternsFor(WordFormField.POSSESSIVE_CASE_FORM, PartOfSpeech.NOUN)),
    ).toBeUndefined();
    // Pronoun.possessiveCaseForm only recognises the closed fixed-word
    // lookup (rule #3) -- the apostrophe rule is Noun's own case, not
    // Pronoun's (pronoun.ts's own docstring).
    const issue = validateFormText(
      WordFormField.POSSESSIVE_CASE_FORM,
      { value: "dog's", formats: ["/'s$/i"] },
      stringPatternsFor(WordFormField.POSSESSIVE_CASE_FORM, PartOfSpeech.PRONOUN),
    );
    expect(issue?.reason).toContain("is not a recognised String Pattern");
  });

  it("recognises the doubled-final-consonant pattern (Past Tense Form rule #4)", () => {
    expect(
      validateFormText(
        WordFormField.PAST_TENSE_FORM,
        { value: "stopped", formats: ["/([bcdfghjklmnpqrstvwxyz])\\1ed$/i"] },
        stringPatternsFor(WordFormField.PAST_TENSE_FORM, PartOfSpeech.VERB),
      ),
    ).toBeUndefined();
  });
});

describe("validate<Class>() -- each POS class's own attribute validation", () => {
  it("returns no issues for a Word with nothing populated", () => {
    expect(validateNoun(createNoun({ text: "dog" }), new WordForms())).toEqual([]);
  });

  it("returns no issues when every populated field's formats are internally consistent", () => {
    const dog = createNoun({ text: "dog" });
    const wordForms = new WordForms();
    wordForms.registerNamedForm(dog, WordFormField.PLURAL_NUMBER_FORM, { value: "dogs", formats: ["/s$/i"] });
    wordForms.registerNamedForm(dog, WordFormField.POSSESSIVE_CASE_FORM, { value: "dog's", formats: ["/'s$/i"] });
    expect(validateNoun(dog, wordForms)).toEqual([]);
  });

  it("collects every issue found, not just the first", () => {
    const dog = createNoun({ text: "dog" });
    const wordForms = new WordForms();
    wordForms.registerNamedForm(dog, WordFormField.PLURAL_NUMBER_FORM, { value: "dog", formats: ["/s$/i"] }); // value doesn't match
    wordForms.registerNamedForm(dog, WordFormField.POSSESSIVE_CASE_FORM, { value: "dog's", formats: ["/self$/i"] }); // unrecognised pattern for this field
    const issues = validateNoun(dog, wordForms);
    expect(issues).toHaveLength(2);
    expect(issues.map((i) => i.field)).toEqual([WordFormField.PLURAL_NUMBER_FORM, WordFormField.POSSESSIVE_CASE_FORM]);
  });

  it("checks a Verb's own fields, including the fully-regex-derivable Present Participle Form", () => {
    const run = createVerb({ text: "run" });
    const runWordForms = new WordForms();
    runWordForms.registerNamedForm(run, WordFormField.PRESENT_PARTICIPLE_FORM, { value: "running", formats: ["/([bcdfghjklmnpqrstvwxyz])\\1ing$/i"] });
    expect(validateVerb(run, runWordForms)).toEqual([]);

    const badRun = createVerb({ text: "run" });
    const badRunWordForms = new WordForms();
    badRunWordForms.registerNamedForm(badRun, WordFormField.PRESENT_PARTICIPLE_FORM, { value: "runing", formats: ["/([bcdfghjklmnpqrstvwxyz])\\1ing$/i"] });
    expect(validateVerb(badRun, badRunWordForms)).toHaveLength(1);
  });

  it("checks an Adjective's degree forms", () => {
    const big = createAdjective({ text: "big" });
    const bigWordForms = new WordForms();
    bigWordForms.registerNamedForm(big, WordFormField.COMPARATIVE_DEGREE_FORM, { value: "bigger", formats: ["/([bcdfghjklmnpqrstvwxyz])\\1er$/i"] });
    expect(validateAdjective(big, bigWordForms)).toEqual([]);
  });

  it("checks a Pronoun's own closed fixed-word-lookup fields", () => {
    const she = createPronoun({ text: "she" });
    const sheWordForms = new WordForms();
    sheWordForms.registerNamedForm(she, WordFormField.SUBJECTIVE_CASE_FORM, { value: "she", formats: ["/^(I|we|you|he|she|it|they)$/i"] });
    expect(validatePronoun(she, sheWordForms)).toEqual([]);

    const badShe = createPronoun({ text: "she" });
    const badSheWordForms = new WordForms();
    badSheWordForms.registerNamedForm(badShe, WordFormField.SUBJECTIVE_CASE_FORM, { value: "her", formats: ["/^(I|we|you|he|she|it|they)$/i"] });
    expect(validatePronoun(badShe, badSheWordForms)).toHaveLength(1);
  });

  it("checks a Determiner's own possessive field, scoped to only the fixed-word rule", () => {
    const their = createDeterminer({ text: "their" });
    const theirWordForms = new WordForms();
    theirWordForms.registerNamedForm(their, WordFormField.POSSESSIVE_CASE_FORM, { value: "their", formats: ["/^(my|mine|your|yours|his|her|hers|its|our|ours|their|theirs)$/i"] });
    expect(validateDeterminer(their, theirWordForms)).toEqual([]);
  });

  it("checks baseLemmaCanonicalForm regardless of POS subtype, via the same per-form loop every validate<Class>() already runs (it's a real WordForm now, not a scalar Word field)", () => {
    const dog = createNoun({ text: "dog" });
    const dogWordForms = new WordForms();
    dogWordForms.registerNamedForm(dog, WordFormField.BASE_LEMMA_CANONICAL_FORM, { value: "dog", formats: ["/s$/i"] });
    expect(validateNoun(dog, dogWordForms)).toHaveLength(1);
  });

  it("checks an Adverb's degree forms the same way as Adjective's", () => {
    const fast = createAdverb({ text: "fast" });
    const fastWordForms = new WordForms();
    fastWordForms.registerNamedForm(fast, WordFormField.SUPERLATIVE_DEGREE_FORM, { value: "fastest", formats: ["/est$/i"] });
    expect(validateAdverb(fast, fastWordForms)).toEqual([]);
  });
});

describe("generate<Class>Forms() -- deriving *_Form values from a base lemma", () => {
  it("Noun: regular plural rules (-s, -es, -ies) and the always-on possessive", () => {
    const dog = createNoun({ text: "dog" });
    const box = createNoun({ text: "box" });
    const city = createNoun({ text: "city" });
    const wordForms = new WordForms();
    generateNounForms(dog, wordForms);
    generateNounForms(box, wordForms);
    generateNounForms(city, wordForms);
    expect(formTextOf(wordForms, dog, WordFormField.PLURAL_NUMBER_FORM)).toEqual({ value: "dogs", formats: ["/s$/i"] });
    expect(formTextOf(wordForms, box, WordFormField.PLURAL_NUMBER_FORM)).toEqual({ value: "boxes", formats: ["/es$/i"] });
    expect(formTextOf(wordForms, city, WordFormField.PLURAL_NUMBER_FORM)).toEqual({ value: "cities", formats: ["/ies$/i"] });
    expect(formTextOf(wordForms, dog, WordFormField.POSSESSIVE_CASE_FORM)).toEqual({ value: "dog's", formats: ["/'s$/i"] });
    expect(formTextOf(wordForms, dog, WordFormField.SINGULAR_NUMBER_FORM)).toEqual({ value: "dog" });
  });

  it("Noun: abstains on pluralNumberForm for an f/fe-ending lemma -- roof/roofs vs. knife/knives can't be told apart from spelling alone", () => {
    const knife = createNoun({ text: "knife" });
    const roof = createNoun({ text: "roof" });
    const wordForms = new WordForms();
    generateNounForms(knife, wordForms);
    generateNounForms(roof, wordForms);
    expect(formTextOf(wordForms, knife, WordFormField.PLURAL_NUMBER_FORM)).toBeUndefined();
    expect(formTextOf(wordForms, roof, WordFormField.PLURAL_NUMBER_FORM)).toBeUndefined();
  });

  it("Noun: never overwrites a field already registered", () => {
    const child = createNoun({ text: "child" });
    const wordForms = new WordForms();
    wordForms.registerNamedForm(child, WordFormField.PLURAL_NUMBER_FORM, { value: "children" });
    generateNounForms(child, wordForms);
    expect(formTextOf(wordForms, child, WordFormField.PLURAL_NUMBER_FORM)).toEqual({ value: "children" });
  });

  it("Noun: no-ops with no WordForms store -- produces a Noun with no inflected forms registered anywhere", () => {
    const dog = createNoun({ text: "dog" });
    expect(generateNounForms(dog, undefined)).toBe(dog);
  });

  it("Verb: regular past/participle/third-person/present-participle rules", () => {
    const walk = createVerb({ text: "walk" });
    const walkForms = new WordForms();
    generateVerbForms(walk, walkForms);
    expect(formTextOf(walkForms, walk, WordFormField.PAST_TENSE_FORM)).toEqual({ value: "walked", formats: ["/ed$/i"] });
    expect(formTextOf(walkForms, walk, WordFormField.PAST_PARTICIPLE_FORM)).toEqual({ value: "walked", formats: ["/ed$/i"] });
    expect(formTextOf(walkForms, walk, WordFormField.THIRD_PERSON_SINGULAR_PRESENT_FORM)).toEqual({ value: "walks", formats: ["/s$/i"] });
    expect(formTextOf(walkForms, walk, WordFormField.PRESENT_PARTICIPLE_FORM)).toEqual({ value: "walking", formats: ["/ing$/i"] });
    expect(formTextOf(walkForms, walk, WordFormField.PRESENT_TENSE_FORM)).toEqual({ value: "walk" });
    expect(formTextOf(walkForms, walk, WordFormField.BARE_INFINITIVE_FORM)).toEqual({ value: "walk" });

    const love = createVerb({ text: "love" });
    const loveForms = new WordForms();
    generateVerbForms(love, loveForms);
    expect(formTextOf(loveForms, love, WordFormField.PAST_TENSE_FORM)).toEqual({ value: "loved", formats: ["/ed$/i"] });

    const try_ = createVerb({ text: "try" });
    const tryForms = new WordForms();
    generateVerbForms(try_, tryForms);
    expect(formTextOf(tryForms, try_, WordFormField.PAST_TENSE_FORM)).toEqual({ value: "tried", formats: ["/ied$/i"] });
    expect(formTextOf(tryForms, try_, WordFormField.THIRD_PERSON_SINGULAR_PRESENT_FORM)).toEqual({ value: "tries", formats: ["/ies$/i"] });
  });

  it("Verb: doubles the final consonant for a monosyllabic CVC lemma, but abstains for a polysyllabic one that ends the same way", () => {
    const stop = createVerb({ text: "stop" });
    const stopForms = new WordForms();
    generateVerbForms(stop, stopForms);
    expect(formTextOf(stopForms, stop, WordFormField.PAST_TENSE_FORM)).toEqual({ value: "stopped", formats: ["/([bcdfghjklmnpqrstvwxyz])\\1ed$/i"] });
    expect(formTextOf(stopForms, stop, WordFormField.PRESENT_PARTICIPLE_FORM)).toEqual({ value: "stopping", formats: ["/([bcdfghjklmnpqrstvwxyz])\\1ing$/i"] });

    // "differ"/"open" end the identical consonant-vowel-consonant shape
    // "stop" does, but are two syllables, not one -- real English
    // doesn't double here ("differed"/"opened", not "differred"/
    // "openned"), and telling a genuine doubling case like "occur" apart
    // from these needs real stress data this codebase doesn't have, so
    // both fields are left undefined rather than guessed either way.
    const differ = createVerb({ text: "differ" });
    const differForms = new WordForms();
    generateVerbForms(differ, differForms);
    expect(formTextOf(differForms, differ, WordFormField.PAST_TENSE_FORM)).toBeUndefined();
    expect(formTextOf(differForms, differ, WordFormField.PRESENT_PARTICIPLE_FORM)).toBeUndefined();
  });

  it("Verb: presentParticipleForm's ie -> ying rule, and abstains on the vowel-before-e silent-e ambiguity", () => {
    const lie = createVerb({ text: "lie" });
    const lieForms = new WordForms();
    generateVerbForms(lie, lieForms);
    expect(formTextOf(lieForms, lie, WordFormField.PRESENT_PARTICIPLE_FORM)).toEqual({ value: "lying", formats: ["/ying$/i"] });

    const tie = createVerb({ text: "tie" });
    const tieForms = new WordForms();
    generateVerbForms(tie, tieForms);
    expect(formTextOf(tieForms, tie, WordFormField.PRESENT_PARTICIPLE_FORM)).toEqual({ value: "tying", formats: ["/ying$/i"] });

    // "agree"/"argue" both end in a vowel immediately before the final
    // "e" -- English keeps the e for some ("agreeing") and drops it for
    // others ("arguing"), which needs real Silent-E Classification data
    // this codebase doesn't have, so both abstain rather than guess.
    const agree = createVerb({ text: "agree" });
    const agreeForms = new WordForms();
    generateVerbForms(agree, agreeForms);
    expect(formTextOf(agreeForms, agree, WordFormField.PRESENT_PARTICIPLE_FORM)).toBeUndefined();

    const argue = createVerb({ text: "argue" });
    const argueForms = new WordForms();
    generateVerbForms(argue, argueForms);
    expect(formTextOf(argueForms, argue, WordFormField.PRESENT_PARTICIPLE_FORM)).toBeUndefined();
  });

  it("Verb: checks IRREGULAR_VERB_FORMS before ever falling through to the regular -ed rules", () => {
    const eat = createVerb({ text: "eat" });
    const eatForms = new WordForms();
    generateVerbForms(eat, eatForms);
    expect(formTextOf(eatForms, eat, WordFormField.PAST_TENSE_FORM)).toEqual({ value: "ate" });
    expect(formTextOf(eatForms, eat, WordFormField.PAST_PARTICIPLE_FORM)).toEqual({ value: "eaten" });

    const run = createVerb({ text: "run" });
    const runForms = new WordForms();
    generateVerbForms(run, runForms);
    expect(formTextOf(runForms, run, WordFormField.PAST_TENSE_FORM)).toEqual({ value: "ran" });
    expect(formTextOf(runForms, run, WordFormField.PAST_PARTICIPLE_FORM)).toEqual({ value: "run" });
  });

  it("Verb: \"have\" and \"be\" both get hand-written irregular values no general rule could produce", () => {
    const have = createVerb({ text: "have" });
    const haveForms = new WordForms();
    generateVerbForms(have, haveForms);
    expect(formTextOf(haveForms, have, WordFormField.PAST_TENSE_FORM)).toEqual({ value: "had" });
    expect(formTextOf(haveForms, have, WordFormField.THIRD_PERSON_SINGULAR_PRESENT_FORM)).toEqual({ value: "has" });

    const be = createVerb({ text: "be" });
    const beForms = new WordForms();
    generateVerbForms(be, beForms);
    expect(formTextOf(beForms, be, WordFormField.PAST_TENSE_FORM)).toBeUndefined();
    expect(formTextOf(beForms, be, WordFormField.PAST_PARTICIPLE_FORM)).toBeUndefined();
    expect(formTextOf(beForms, be, WordFormField.THIRD_PERSON_SINGULAR_PRESENT_FORM)).toBeUndefined();
    expect(formTextOf(beForms, be, WordFormField.PRESENT_PARTICIPLE_FORM)).toEqual({ value: "being", formats: ["/ing$/i"] });
  });

  it("Verb: no-ops with no WordForms store -- produces a Verb with no inflected forms registered anywhere", () => {
    const run = createVerb({ text: "run" });
    expect(generateVerbForms(run, undefined)).toBe(run);
  });

  it("Adjective/Adverb: regular comparative/superlative rules, including the shared doubling and y-ending cases", () => {
    // gradable=true throughout -- this test is only about which
    // orthographic rule regularDegreeForm() picks once synthetic
    // comparison has already been decided, not about
    // determineGradability() itself (its own dedicated tests below).
    const big = createAdjective({ text: "big" });
    const bigForms = new WordForms();
    generateAdjectiveForms(big, true, bigForms);
    expect(formTextOf(bigForms, big, WordFormField.COMPARATIVE_DEGREE_FORM)).toEqual({ value: "bigger", formats: ["/([bcdfghjklmnpqrstvwxyz])\\1er$/i"] });
    expect(formTextOf(bigForms, big, WordFormField.SUPERLATIVE_DEGREE_FORM)).toEqual({ value: "biggest", formats: ["/([bcdfghjklmnpqrstvwxyz])\\1est$/i"] });

    const happy = createAdjective({ text: "happy" });
    const happyForms = new WordForms();
    generateAdjectiveForms(happy, true, happyForms);
    expect(formTextOf(happyForms, happy, WordFormField.COMPARATIVE_DEGREE_FORM)).toEqual({ value: "happier", formats: ["/ier$/i"] });
    expect(formTextOf(happyForms, happy, WordFormField.SUPERLATIVE_DEGREE_FORM)).toEqual({ value: "happiest", formats: ["/iest$/i"] });

    const large = createAdjective({ text: "large" });
    const largeForms = new WordForms();
    generateAdjectiveForms(large, true, largeForms);
    expect(formTextOf(largeForms, large, WordFormField.COMPARATIVE_DEGREE_FORM)).toEqual({ value: "larger", formats: ["/er$/i"] });

    const fast = createAdverb({ text: "fast" });
    const fastForms = new WordForms();
    generateAdverbForms(fast, true, fastForms);
    expect(formTextOf(fastForms, fast, WordFormField.COMPARATIVE_DEGREE_FORM)).toEqual({ value: "faster", formats: ["/er$/i"] });
    expect(formTextOf(fastForms, fast, WordFormField.SUPERLATIVE_DEGREE_FORM)).toEqual({ value: "fastest", formats: ["/est$/i"] });
  });

  it("Adjective: a non-gradable adjective only ever gets a Positive Degree Form -- no mechanically well-formed but invalid Comparative/Superlative", () => {
    const ablative = createAdjective({ text: "ablative" });
    const ablativeForms = new WordForms();
    generateAdjectiveForms(ablative, false, ablativeForms);
    expect(formTextOf(ablativeForms, ablative, WordFormField.POSITIVE_DEGREE_FORM)).toEqual({ value: "ablative" });
    expect(formTextOf(ablativeForms, ablative, WordFormField.COMPARATIVE_DEGREE_FORM)).toBeUndefined();
    expect(formTextOf(ablativeForms, ablative, WordFormField.SUPERLATIVE_DEGREE_FORM)).toBeUndefined();
    expect(validateAdjective(ablative, ablativeForms)).toEqual([]);
  });

  it("Adjective: isPeriphrasticComparison picks more/most for longer adjectives, -er/-est for shorter ones, matching the matrix's own examples", () => {
    // 1 syllable -- synthetic.
    const tall = createAdjective({ text: "tall" });
    const tallForms = new WordForms();
    generateAdjectiveForms(tall, true, tallForms);
    expect(formTextOf(tallForms, tall, WordFormField.COMPARATIVE_DEGREE_FORM)).toEqual({ value: "taller", formats: ["/er$/i"] });
    expect(formTextOf(tallForms, tall, WordFormField.SUPERLATIVE_DEGREE_FORM)).toEqual({ value: "tallest", formats: ["/est$/i"] });

    // 2 syllables ending in "ow" -- still synthetic, one of English's
    // own real exceptions to "long words use more/most".
    const narrow = createAdjective({ text: "narrow" });
    const narrowForms = new WordForms();
    generateAdjectiveForms(narrow, true, narrowForms);
    expect(formTextOf(narrowForms, narrow, WordFormField.COMPARATIVE_DEGREE_FORM)).toEqual({ value: "narrower", formats: ["/er$/i"] });
    expect(formTextOf(narrowForms, narrow, WordFormField.SUPERLATIVE_DEGREE_FORM)).toEqual({ value: "narrowest", formats: ["/est$/i"] });

    // 3 syllables, no synthetic-eligible ending -- periphrastic.
    const accepting = createAdjective({ text: "accepting" });
    const acceptingForms = new WordForms();
    generateAdjectiveForms(accepting, true, acceptingForms);
    expect(formTextOf(acceptingForms, accepting, WordFormField.COMPARATIVE_DEGREE_FORM)).toEqual({ value: "more accepting", formats: ["/^more\\s+.+$/i"] });
    expect(formTextOf(acceptingForms, accepting, WordFormField.SUPERLATIVE_DEGREE_FORM)).toEqual({ value: "most accepting", formats: ["/^most\\s+.+$/i"] });
    expect(validateAdjective(accepting, acceptingForms)).toEqual([]);
  });

  it("Adverb: a non-gradable adverb only ever gets a Positive Degree Form, same gating as Adjective", () => {
    const anisotropically = createAdverb({ text: "anisotropically" });
    const anisotropicallyForms = new WordForms();
    generateAdverbForms(anisotropically, false, anisotropicallyForms);
    expect(formTextOf(anisotropicallyForms, anisotropically, WordFormField.POSITIVE_DEGREE_FORM)).toEqual({ value: "anisotropically" });
    expect(formTextOf(anisotropicallyForms, anisotropically, WordFormField.COMPARATIVE_DEGREE_FORM)).toBeUndefined();
    expect(formTextOf(anisotropicallyForms, anisotropically, WordFormField.SUPERLATIVE_DEGREE_FORM)).toBeUndefined();
    expect(validateAdverb(anisotropically, anisotropicallyForms)).toEqual([]);
  });

  it("Adverb: a lemma ending \"-ly\" is always periphrastic, never routed through Adjective's own \"y\" rule (there is no \"quicklier\")", () => {
    const scarcely = createAdverb({ text: "scarcely" });
    const scarcelyForms = new WordForms();
    generateAdverbForms(scarcely, true, scarcelyForms);
    expect(formTextOf(scarcelyForms, scarcely, WordFormField.COMPARATIVE_DEGREE_FORM)).toEqual({ value: "more scarcely", formats: ["/^more\\s+.+$/i"] });
    expect(formTextOf(scarcelyForms, scarcely, WordFormField.SUPERLATIVE_DEGREE_FORM)).toEqual({ value: "most scarcely", formats: ["/^most\\s+.+$/i"] });
    expect(validateAdverb(scarcely, scarcelyForms)).toEqual([]);

    // A non-"-ly" adverb still goes through the ordinary synthetic path.
    const fast = createAdverb({ text: "fast" });
    const fastForms = new WordForms();
    generateAdverbForms(fast, true, fastForms);
    expect(formTextOf(fastForms, fast, WordFormField.COMPARATIVE_DEGREE_FORM)).toEqual({ value: "faster", formats: ["/er$/i"] });
    expect(formTextOf(fastForms, fast, WordFormField.SUPERLATIVE_DEGREE_FORM)).toEqual({ value: "fastest", formats: ["/est$/i"] });
  });

  it("Adjective/Adverb: no-ops with no WordForms store -- produce a Word with no inflected forms registered anywhere", () => {
    const happy = createAdjective({ text: "happy" });
    expect(generateAdjectiveForms(happy, true, undefined)).toBe(happy);
    const fast = createAdverb({ text: "fast" });
    expect(generateAdverbForms(fast, true, undefined)).toBe(fast);
  });

  it("every generated Word passes its own validate<Class>() unchanged -- generation and validation are built from the same matrix rows", () => {
    const city = createNoun({ text: "city" });
    const cityWordForms = new WordForms();
    expect(validateNoun(generateNounForms(city, cityWordForms), cityWordForms)).toEqual([]);
    const stop = createVerb({ text: "stop" });
    const stopWordForms = new WordForms();
    expect(validateVerb(generateVerbForms(stop, stopWordForms), stopWordForms)).toEqual([]);
    const eat = createVerb({ text: "eat" });
    const eatWordForms = new WordForms();
    expect(validateVerb(generateVerbForms(eat, eatWordForms), eatWordForms)).toEqual([]);
    const happy = createAdjective({ text: "happy" });
    const happyWordForms = new WordForms();
    expect(validateAdjective(generateAdjectiveForms(happy, true, happyWordForms), happyWordForms)).toEqual([]);
    const fast = createAdverb({ text: "fast" });
    const fastWordForms = new WordForms();
    expect(validateAdverb(generateAdverbForms(fast, true, fastWordForms), fastWordForms)).toEqual([]);
  });

  it("Adjective: determineGradability checks every sense, not just the primary one, is direction-agnostic, and requires nothing more than the Attribute pointer itself", () => {
    const senses = new Senses();
    const wordForms = new WordForms();
    const relationships = new SemanticRelationshipStore();
    const processor = new SemanticRelationshipProcessor(relationships, new SemanticRelationshipSystemPropertyTensor());

    // "grandiloquent" -- Sense 1 (primary, no Attribute pointer at all)
    // and Sense 2 (carries a real Attribute pointer). Gradability must
    // be found from Sense 2 even though it is never the primary sense --
    // no Hypernym climbing is needed or attempted any more (the pointer
    // itself is the signal, determineGradability()'s own docstring on
    // why an earlier, narrower version of this function wrongly called
    // "tall" itself non-gradable).
    const grandiloquent = createAdjective({ text: "grandiloquent" });
    const primarySense = createSense({ definition: { value: "pompous" } });
    const scalarSense = createSense({ definition: { value: "elevated in style" } });
    senses.append(primarySense);
    senses.append(scalarSense);
    senses.registerMember(primarySense, grandiloquent);
    senses.registerMember(scalarSense, grandiloquent);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(grandiloquent), primarySense);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(grandiloquent), scalarSense);
    expect(wordForms.senseIdsOf(grandiloquent)[0].value).toBe(senseGraphUuid(primarySense));

    const elevation = createNoun({ text: "elevation" });
    const elevationSense = createSense({ definition: { value: "the degree to which something is elevated" } });
    senses.append(elevationSense);
    senses.registerMember(elevationSense, elevation);
    processor.create({ sourceSenseId: senseGraphUuid(scalarSense), targetSenseId: senseGraphUuid(elevationSense), relationshipType: SemanticRelationshipKind.ATTRIBUTE, sourceReferences: [] });
    expect(determineGradability(relationships, grandiloquent, wordForms)).toBe(true);

    // Direction-agnostic: ATTRIBUTE is one of WordSeeder's own
    // SYMMETRIC_RELATIONSHIP_KINDS (role/word_seeder.ts), so a real
    // pair's one stored edge can end up facing either way -- an
    // Attribute edge stored *into* this Adjective's own Sense
    // (incoming) must count exactly the same as one stored out of it.
    const reversed = createAdjective({ text: "reversed-case" });
    const reversedSense = createSense({ definition: { value: "exists only to test incoming-edge direction" } });
    senses.append(reversedSense);
    senses.registerMember(reversedSense, reversed);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(reversed), reversedSense);
    processor.create({ sourceSenseId: senseGraphUuid(elevationSense), targetSenseId: senseGraphUuid(reversedSense), relationshipType: SemanticRelationshipKind.ATTRIBUTE, sourceReferences: [] });
    expect(determineGradability(relationships, reversed, wordForms)).toBe(true);

    // "wooden" -- no Attribute pointer at all -- non-gradable.
    const wooden = createAdjective({ text: "wooden" });
    const woodenSense = createSense({ definition: { value: "made of wood" } });
    senses.append(woodenSense);
    senses.registerMember(woodenSense, wooden);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(wooden), woodenSense);
    expect(determineGradability(relationships, wooden, wordForms)).toBe(false);
  });

  it("Adverb: determineGradability inherits from a Pertainym-linked Adjective (read from a genuine SemanticRelationship, Sense-to-Sense), or falls back to a same-spelling flat Adjective when there's no Pertainym fact at all", () => {
    const dictionary = new Dictionary();
    const senses = new Senses();
    const wordForms = new WordForms();
    const relationships = new SemanticRelationshipStore();
    const processor = new SemanticRelationshipProcessor(relationships, new SemanticRelationshipSystemPropertyTensor());

    // "-ly"-derived case: "quickly" pertains to "quick" -- a real
    // SemanticRelationship (PERTAINYM, Sense-to-Sense -- SemanticRelationshipKind's
    // own docstring on why Pertainym lives there rather than on
    // Adverb/Word directly: the target genuinely differs from one sense
    // of a polysemous word to another, so a Word-level field can't
    // represent it correctly). "quick" itself carries a real Attribute
    // fact.
    const quickly = createAdverb({ text: "quickly" });
    const quick = createAdjective({ text: "quick" });
    dictionary.append(quick);
    const quickSense = createSense({ definition: { value: "accomplished with speed" } });
    senses.append(quickSense);
    senses.registerMember(quickSense, quick);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(quick), quickSense);
    const speed = createNoun({ text: "speed" });
    const speedSense = createSense({ definition: { value: "a rate of moving" } });
    senses.append(speedSense);
    senses.registerMember(speedSense, speed);
    processor.create({ sourceSenseId: senseGraphUuid(quickSense), targetSenseId: senseGraphUuid(speedSense), relationshipType: SemanticRelationshipKind.ATTRIBUTE, sourceReferences: [] });
    const quicklySense = createSense({ definition: { value: "with rapidity" } });
    senses.append(quicklySense);
    senses.registerMember(quicklySense, quickly);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(quickly), quicklySense);
    processor.create({ sourceSenseId: senseGraphUuid(quicklySense), targetSenseId: senseGraphUuid(quickSense), relationshipType: SemanticRelationshipKind.PERTAINYM, sourceReferences: [] });
    expect(determineAdverbGradability(relationships, dictionary, senses, quickly, wordForms)).toBe(true);

    // Flat-adverb case: "wide" (adverb) has no Pertainym fact of its
    // own at all, but shares its exact spelling with a gradable "wide"
    // (adjective) -- the fallback finds it by (partOfSpeech, spelling)
    // rather than by any edge.
    const wideAdverb = createAdverb({ text: "wide" });
    const wideAdjective = createAdjective({ text: "wide" });
    dictionary.append(wideAdjective);
    const wideSense = createSense({ definition: { value: "having a great extent from side to side" } });
    senses.append(wideSense);
    senses.registerMember(wideSense, wideAdjective);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(wideAdjective), wideSense);
    const width = createNoun({ text: "width" });
    const widthSense = createSense({ definition: { value: "the extent of something from side to side" } });
    senses.append(widthSense);
    senses.registerMember(widthSense, width);
    processor.create({ sourceSenseId: senseGraphUuid(wideSense), targetSenseId: senseGraphUuid(widthSense), relationshipType: SemanticRelationshipKind.ATTRIBUTE, sourceReferences: [] });
    expect(determineAdverbGradability(relationships, dictionary, senses, wideAdverb, wordForms)).toBe(true);

    // No Pertainym fact and no same-spelling Adjective at all --
    // nothing to inherit from, stays non-gradable.
    const somehow = createAdverb({ text: "somehow" });
    expect(determineAdverbGradability(relationships, dictionary, senses, somehow, wordForms)).toBe(false);
  });

  it("WordSeeder.seedWordNet wires generation in automatically -- a real seeded Noun/Verb gets its regular-case forms populated, and a real irregular verb gets its true irregular form, not a spelling-rule guess", async () => {
    const dictionary = new Dictionary();
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
    const wordForms = new WordForms();
    await new WordSeeder("en").seedWordNet({
      vocabulary: { dictionary, phrases: new Phrases(), senses: new Senses(), wordForms, morphologicalPointerRelationships, morphologicalPointerRelationshipProcessor, semanticRelationships, semanticRelationshipProcessor },
    });

    const dog = dictionary.lookupAll("dog").find(isNoun);
    expect(dog && formTextOf(wordForms, dog, WordFormField.PLURAL_NUMBER_FORM)).toEqual({ value: "dogs", formats: ["/s$/i"] });

    const run = dictionary.lookupAll("run").find(isVerb);
    expect(run && formTextOf(wordForms, run, WordFormField.PAST_TENSE_FORM)).toEqual({ value: "ran" });
    expect(run && formTextOf(wordForms, run, WordFormField.PAST_PARTICIPLE_FORM)).toEqual({ value: "run" });
  }, 30000);

  it("populates each seeded Sense's own senseDomainTag from its synset's real WordNet lexicographer-file category", async () => {
    const dictionary = new Dictionary();
    const senseStore = new Senses();
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
    const wordForms = new WordForms();
    await new WordSeeder("en").seedWordNet({
      vocabulary: { dictionary, phrases: new Phrases(), senses: senseStore, wordForms, morphologicalPointerRelationships, morphologicalPointerRelationshipProcessor, semanticRelationships, semanticRelationshipProcessor },
    });

    // 03005231-n: "chair" -- this feature's own worked example
    // (chair%1:06:00:: -> lex_filenum 06 -> noun.artifact).
    const chairSense = senseStore.findBySynsetId("03005231-n");
    expect(chairSense?.senseDomainTag).toEqual({ value: "noun.artifact" });

    // A VERB sense gets its own, differently-prefixed category too --
    // never truncated to the bare "communication"/"artifact" half.
    const run = dictionary.lookupAll("run").find(isVerb);
    const runSense = run && senseStore.findByUuid(wordForms.senseIdsOf(run)[0]?.value ?? "");
    expect(runSense?.senseDomainTag?.value).toMatch(/^verb\./);
  }, 30000);

  it("NounCharacterFormSeeder updates the existing Noun for a lemma in place -- merging every glyph a paired-mark lemma names into one Noun's own array -- and only creates a new one when no Noun with that lemma exists at all", async () => {
    const dictionary = new Dictionary();
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
    const wordForms = new WordForms();
    await new WordSeeder("en").seedWordNet({
      vocabulary: { dictionary, phrases: new Phrases(), senses: new Senses(), wordForms, morphologicalPointerRelationships, morphologicalPointerRelationshipProcessor, semanticRelationships, semanticRelationshipProcessor },
    });

    const comma = dictionary.lookupAll("comma").find(isNoun);
    const commaUuid = comma && wordGraphUuid(comma);
    const commaEntryId = comma?.entryId.value;
    const commaSenseIds = comma && wordForms.senseIdsOf(comma);
    const brace = dictionary.lookupAll("brace").find(isNoun);
    const originalDogCount = dictionary.lookupAll("dog").filter(isNoun).length;

    const { updated, created } = new NounCharacterFormSeeder(dictionary).seed();
    expect(updated).toBeGreaterThan(0);
    expect(created).toBe(0);

    // Updated in place -- same identity, same senseIds, no sibling
    // created (still exactly one "comma" Noun).
    expect(dictionary.lookupAll("comma").filter(isNoun)).toHaveLength(1);
    expect(comma?.wordCharacterForms).toEqual([{ value: "," }]);
    expect(comma && wordGraphUuid(comma)).toBe(commaUuid);
    expect(comma?.entryId.value).toBe(commaEntryId);
    expect(comma && wordForms.senseIdsOf(comma)).toEqual(commaSenseIds);

    // A paired-mark lemma gets BOTH of its glyphs merged onto the one
    // existing Noun -- no longer excluded, no longer split across
    // siblings.
    expect(brace?.wordCharacterForms.map((t) => t.value).sort()).toEqual(["{", "}"]);

    // A Noun with no relation to punctuation at all is untouched.
    expect(dictionary.lookupAll("dog").filter(isNoun)).toHaveLength(originalDogCount);
    const dog = dictionary.lookupAll("dog").find(isNoun);
    expect(dog?.wordCharacterForms).toEqual([]);

    // Idempotent: a second pass merges nothing further (every character
    // already present), creates nothing, adds no siblings.
    const second = new NounCharacterFormSeeder(dictionary).seed();
    expect(second.updated).toBe(0);
    expect(second.created).toBe(0);
    expect(dictionary.lookupAll("comma").filter(isNoun)).toHaveLength(1);
    expect(comma?.wordCharacterForms).toEqual([{ value: "," }]);
    expect(brace?.wordCharacterForms.map((t) => t.value).sort()).toEqual(["{", "}"]);
  }, 30000);

  it("NounCharacterFormSeeder creates a brand-new Noun, carrying every glyph its lemma names, when no Noun with that lemma exists at all", () => {
    const dictionary = new Dictionary();
    expect(dictionary.lookupAll("comma")).toHaveLength(0);
    expect(dictionary.lookupAll("brace")).toHaveLength(0);

    const { updated, created } = new NounCharacterFormSeeder(dictionary).seed();
    expect(updated).toBe(0);
    expect(created).toBeGreaterThan(0);

    const comma = dictionary.lookupAll("comma").find(isNoun);
    expect(comma?.wordCharacterForms).toEqual([{ value: "," }]);

    const brace = dictionary.lookupAll("brace").find(isNoun);
    expect(brace?.wordCharacterForms.map((t) => t.value).sort()).toEqual(["{", "}"]);
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
    expect(wordGraphUuid(copied)).not.toBe(wordGraphUuid(word));
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
    expect(target.formsOf(copiedBase).map((f) => wordGraphUuid(f.word))).toEqual([wordGraphUuid(copiedForm)]);
    expect(wordGraphUuid(target.lemmaOf(copiedForm)?.word!)).toBe(wordGraphUuid(copiedBase));
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

  it("resolves \"no one else\" as one PRONOUN span against the real bundled Common Vocabulary Cache -- now via Phrases, not a multi-word Word", () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    new WordSeeder("en").seedClosedClassWords(dictionary, phraseBook);
    // "no one else" is a Phrase now, not a Word (Phrase's own docstring,
    // data/phrase.ts) -- Dictionary itself never sees it.
    expect(dictionary.lookupAll("no one else")).toHaveLength(0);
    expect(phraseBook.lookupAll("no one else").some((p) => p.partOfSpeech === PartOfSpeech.PRONOUN)).toBe(true);
    const processor = new DictionaryProcessor(dictionary, phraseBook, new AsyncDictionaryHydrator(dictionary), "Common");

    const rawTokens = ["he", "wanted", "no", "one", "else", "to", "know"];
    const result = processor.identifyPhrase(rawTokens, 2);

    expect(result.tokenSpan).toBe(3);
    expect(result.candidates.some((c) => c.partOfSpeech === PartOfSpeech.PRONOUN)).toBe(true);
  });
});

// Dictionary.indexWordForms()/lookupFormMatches() themselves used to be
// exercised in a "Dictionary.indexWordForms / lookupFormMatches"
// describe block here -- rotated through Verb, then Adjective, then
// Pronoun as each POS subtype it had been fixtured against migrated
// its own generated forms onto the WordForms store instead
// (generateNounForms()'s/generateVerbForms()'s/generateAdjectiveForms()'s/
// generateAdverbForms()'s own docstrings). Pronoun/Determiner's own
// migration (data/entities/pronoun.ts's own docstring) was the last POS
// pair with any scalar `*_Form` field left to fixture against -- every
// POS subtype now registers real WordForm records instead, so this
// mechanism became fully dead code, not just under-exercised. Removed
// rather than kept synthetic (hand-faking a scalar field onto a Word no
// real seeding path would ever produce). The underlying
// `Dictionary.indexWordForms()`/`lookupFormMatches()`/`formTextIndex`/
// `WordFormMatch`, plus `pos_form_fields.ts`'s own `formTextsOf()`/
// `WordFormEntry`/`WORD_FORM_FIELDS`, were deleted in the same
// migration's own final cleanup pass.

describe("PartOfSpeechIdentifier / DictionaryProcessor: inflected-form fallback", () => {
  it("resolves an inflected surface form to its base Word, tagged INFLECTED_FORM with a lower confidence than any exact match and a reason naming the field", () => {
    const dictionary = new Dictionary();
    const wordForms = new WordForms();
    const run = createVerb({ text: "run" });
    dictionary.append(run);
    generateVerbForms(run, wordForms);
    const processor = new DictionaryProcessor(dictionary, new Phrases(), new AsyncDictionaryHydrator(dictionary), "Common", wordForms);

    const candidates = processor.identifyWord("ran");
    expect(candidates).toHaveLength(1);
    expect(wordGraphUuid(candidates[0].word!)).toBe(wordGraphUuid(run));
    expect(candidates[0].source).toBe(IdentificationSource.INFLECTED_FORM);
    expect(candidates[0].confidence).toBeLessThan(1.0);
    expect(candidates[0].reason).toContain(WordFormField.PAST_TENSE_FORM);
  });

  it("finds a Verb by its own irregular past-tense form via the WordForms store, now that Verb no longer writes a scalar *_Form field", () => {
    const dictionary = new Dictionary();
    const wordForms = new WordForms();
    const run = createVerb({ text: "run" });
    dictionary.append(run);
    generateVerbForms(run, wordForms);

    expect(dictionary.lookupAll("ran")).toEqual([]);
    const matches = wordForms.lookupByText("ran");
    expect(matches).toHaveLength(1);
    expect(wordGraphUuid(matches[0].word)).toBe(wordGraphUuid(run));
    expect(matches[0].form.field).toBe(WordFormField.PAST_TENSE_FORM);
  });

  it("an exact match always wins outright over an inflected match, even when both exist for the same surface text", () => {
    const dictionary = new Dictionary();
    const wordForms = new WordForms();
    const run = createVerb({ text: "run" });
    dictionary.append(run);
    generateVerbForms(run, wordForms);
    // A second, unrelated Word whose own BASE spelling happens to equal
    // "run"'s own pastTenseForm -- contrived, but exactly the precedence
    // case identifySeeded()'s own docstring calls out.
    const ranNoun = createNoun({ text: "ran" });
    dictionary.append(ranNoun);
    const processor = new DictionaryProcessor(dictionary, new Phrases(), new AsyncDictionaryHydrator(dictionary), "Common", wordForms);

    const candidates = processor.identifyWord("ran");
    expect(candidates.every((c) => c.source === IdentificationSource.SEEDED_VOCABULARY)).toBe(true);
    expect(candidates.some((c) => c.word !== undefined && wordGraphUuid(c.word) === wordGraphUuid(ranNoun))).toBe(true);
    // "run" (only reachable via the inflected fallback here) never
    // appears once an exact match exists for the same surface text.
    expect(candidates.some((c) => c.word !== undefined && wordGraphUuid(c.word) === wordGraphUuid(run))).toBe(false);
  });

  it("resolves a real WordNet-seeded plural back to its base Noun via the inflected-form fallback", async () => {
    const dictionary = new Dictionary();
    const wordForms = new WordForms();
    await new WordSeeder("en").seedWordNet({
      vocabulary: {
        dictionary,
        phrases: new Phrases(),
        senses: new Senses(),
        wordForms,
        morphologicalPointerRelationships: new MorphologicalPointerRelationshipStore(),
        morphologicalPointerRelationshipProcessor: new MorphologicalPointerRelationshipProcessor(new MorphologicalPointerRelationshipStore(), new MorphologicalPointerRelationshipSystemPropertyTensor()),
        semanticRelationships: new SemanticRelationshipStore(),
        semanticRelationshipProcessor: new SemanticRelationshipProcessor(new SemanticRelationshipStore(), new SemanticRelationshipSystemPropertyTensor()),
      },
    });
    const processor = new DictionaryProcessor(dictionary, new Phrases(), new AsyncDictionaryHydrator(dictionary), "Common", wordForms);

    expect(dictionary.lookupAll("commas")).toEqual([]);
    const candidates = processor.identifyWord("commas");
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].word?.text).toBe("comma");
    expect(candidates[0].source).toBe(IdentificationSource.INFLECTED_FORM);
  }, 30000);

  it("resolves an inflected Noun surface form via the new WordForms store, now that Noun no longer writes a scalar *_Form field", () => {
    const dictionary = new Dictionary();
    const wordForms = new WordForms();
    const dog = createNoun({ text: "dog" });
    dictionary.append(dog);
    generateNounForms(dog, wordForms);
    const processor = new DictionaryProcessor(dictionary, new Phrases(), new AsyncDictionaryHydrator(dictionary), "Common", wordForms);

    expect(dictionary.lookupAll("dogs")).toEqual([]);
    const candidates = processor.identifyWord("dogs");
    expect(candidates).toHaveLength(1);
    expect(wordGraphUuid(candidates[0].word!)).toBe(wordGraphUuid(dog));
    expect(candidates[0].source).toBe(IdentificationSource.INFLECTED_FORM);
    expect(candidates[0].reason).toContain(WordFormField.PLURAL_NUMBER_FORM);
  });
});

describe("Word derived properties", () => {
  it("SemanticRelationship resolves synonyms/hypernyms Sense-to-Sense", () => {
    const dictionary = new Dictionary();
    const senses = new Senses();
    const big = createWord({ text: "big", partOfSpeech: PartOfSpeech.ADJECTIVE });
    const large = createWord({ text: "large", partOfSpeech: PartOfSpeech.ADJECTIVE });
    const sizeable = createWord({ text: "sizeable", partOfSpeech: PartOfSpeech.ADJECTIVE });
    dictionary.append(big);
    dictionary.append(large);
    dictionary.append(sizeable);

    // Synonymy: no edge at all needed -- sharing a Sense already *is*
    // being a synonym (SemanticRelationshipKind's own docstring on why
    // SYNONYM has no WordNet-seeded edge to begin with).
    const bigSense = createSense({ definition: { value: "above average in size" } });
    senses.append(bigSense);
    senses.registerMember(bigSense, big);
    senses.registerMember(bigSense, large);
    expect(senses.membersOf(senseGraphUuid(bigSense)).filter((m) => memberUuid(m) !== wordGraphUuid(big)).map((w) => w.text)).toEqual(["large"]);

    // Hypernymy: a genuine Sense-to-Sense SemanticRelationship.
    const sizeableSense = createSense({ definition: { value: "large in amount or degree" } });
    senses.append(sizeableSense);
    senses.registerMember(sizeableSense, sizeable);
    const store = new SemanticRelationshipStore();
    const processor = new SemanticRelationshipProcessor(store, new SemanticRelationshipSystemPropertyTensor());
    processor.create({
      sourceSenseId: senseGraphUuid(bigSense),
      targetSenseId: senseGraphUuid(sizeableSense),
      relationshipType: SemanticRelationshipKind.HYPERNYM,
      sourceReferences: [],
    });
    const hypernymEdge = store.outgoing(senseGraphUuid(bigSense))[0];
    expect(hypernymEdge.relationshipType).toBe(SemanticRelationshipKind.HYPERNYM);
    expect(senses.membersOf(hypernymEdge.targetSenseId.value).map((w) => w.text)).toEqual(["sizeable"]);
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
    expect(wordGraphUuid(dictionary.lemmaOf(measured!.word)?.word!)).toBe(wordGraphUuid(measure!));

    // Flattening didn't change what's actually seeded -- "measured" is
    // still independently reachable through the normal flat lookup(),
    // exactly as if it had never been nested on disk.
    expect(dictionary.lookup("measured")?.partOfSpeech).toBe(PartOfSpeech.VERB);
  });

  it("PAD (Pleasure-Arousal-Dominance) lives on Sense, not on Word -- registerUniqueSense carries a hand-curated entry's own raw value across", () => {
    const dictionary = new Dictionary();
    const senseStore = new Senses();
    const wordForms = new WordForms();
    new WordSeeder("en").seedClosedClassWords(dictionary, new Phrases(), undefined, senseStore, wordForms);

    // "achieve" (VERB, promoted_words.json) is a real, non-neutral PAD
    // entry -- verified directly against the bundled JSON, not guessed:
    // 0.6/0.4/0.5.
    const achieve = dictionary.lookupAll("achieve").find((w) => w.partOfSpeech === PartOfSpeech.VERB)!;
    expect(achieve).toBeDefined();
    expect((achieve as unknown as Record<string, unknown>).seededPleasureDispleasureWeight).toBeUndefined();

    const sense = senseStore.findByUuid(wordForms.senseIdsOf(achieve)[0]!.value)!;
    expect(sense).toBeDefined();
    expect(sense.seededPleasureDispleasureWeight?.value).toBe(0.6);
    expect(sense.seededArousalNonArousalWeight?.value).toBe(0.4);
    expect(sense.seededDominanceSubmissiveWeight?.value).toBe(0.5);

    // The UI-facing read side (DictionaryView.sensesFor(), via
    // WordRecord.senses[i].pad) resolves through the Sense the identical
    // way -- per sense, not a single word-level reading any more.
    const view = new DictionaryView(dictionary, new SemanticRelationshipStore(), { domainName: "Common", senses: senseStore, wordForms });
    const record = view.searchWords({ wordId: wordGraphUuid(achieve) }).words[0];
    expect(record.senses[0].pad).toEqual({ pleasure: 0.6, arousal: 0.4, dominance: 0.5 });

    // A genuinely neutral word ("word"/NOUN, metalinguistic_nouns.json,
    // 0.0/0.0/0.0) still resolves as a real value, not null -- 0.0 is a
    // seeded neutral reading, distinct from no PAD ever having been
    // assigned at all.
    const word = dictionary.lookupAll("word").find((w) => w.partOfSpeech === PartOfSpeech.NOUN)!;
    const wordSense = senseStore.findByUuid(wordForms.senseIdsOf(word)[0]!.value)!;
    expect(wordSense.seededPleasureDispleasureWeight?.value).toBe(0.0);
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
    // Both fields live on Noun now, not Word (Noun's own docstring), so
    // isNoun() narrows before reading them.
    const entity = dictionary.lookupAll("entity").find((w) => w.partOfSpeech === PartOfSpeech.NOUN);
    expect(entity).toBeDefined();
    if (!isNoun(entity!)) throw new Error("unreachable");
    expect(entity.isRootWord).toBe(true);
    expect(entity.hypernymRootWord).toBe(HypernymRootWord.ENTITY);
    expect(entity.domainTag?.value).toBe("root_word.common");

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

  it("seeds every closed class through its own Word Form to Part of Speech Matrix subtype (Pronoun, Determiner, Preposition, Conjunction, Interjection, Numeral)", () => {
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

    // Pronoun's own Word Form Matrix fields (subjectiveCaseForm and the
    // rest), and even its own base-lemma WordForm, live as WordForm
    // records now, not scalar fields -- not populated by this seeding
    // path (no `wordForms` store was passed to seedClosedClassWords()
    // above), so `she` carries none at all.
    const she = dictionary.lookup("she");
    if (!isPronoun(she!)) throw new Error("unreachable");
    expect(she.wordFormIds).toEqual([]);
  });

  it("gives every hand-curated Word/Phrase its own unique Sense, carrying its domainTag/relatedDomainTags, when a Senses is supplied", () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    const senseStore = new Senses();
    const wordForms = new WordForms();
    const seeder = new WordSeeder("en");
    const domain = { vocabulary: { dictionary, phrases: phraseBook, senses: senseStore, wordForms } };

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
    // A hand-curated entry gets exactly one, private Sense of its own
    // (registerUniqueSense's own docstring) -- senseIds[0] is it.
    expect(wordForms.senseIdsOf(entity!)).toHaveLength(1);
    const entitySense = senseStore.findByUuid(wordForms.senseIdsOf(entity!)[0].value);
    expect(entitySense).toBeDefined();
    expect(entitySense?.domainTag?.value).toBe("root_word.common");
    expect(entitySense?.isCommon).toBe(true);
    expect(entitySense?.definition?.value).toBe(
      'The hypernym root word answering "what": the broadest category anything that exists falls under.',
    );
    expect(entitySense?.isRootWord).toBe(true);
    expect(entitySense?.hypernymRootWord).toBe(HypernymRootWord.ENTITY);

    // "she" (pronouns.json, no domainTag/root-word status of its own)
    // gets its own distinct Sense too -- one per entry, never shared,
    // unlike WordNet's own per-synset Sense (registerUniqueSense's own
    // docstring) -- and isRootWord correctly comes back false, not
    // merely undefined, for an ordinary closed-class Word's own Sense.
    const she = dictionary.lookup("she");
    expect(wordForms.senseIdsOf(she!)).toHaveLength(1);
    expect(wordForms.senseIdsOf(she!)[0].value).not.toBe(wordForms.senseIdsOf(entity!)[0].value);
    expect(senseStore.membersOf(wordForms.senseIdsOf(she!)[0].value)).toEqual([she]);
    expect(senseStore.findByUuid(wordForms.senseIdsOf(she!)[0].value)?.isRootWord).toBe(false);

    // A Phrase gets one too, same as a Word -- but never a root-word
    // one, since Phrase has no such concept at all (registerUniqueSense's
    // own docstring). Phrase keeps its own `senseIds` field directly
    // (unlike Word, whose senses moved onto its base-lemma WordForm).
    const eachOther = phraseBook.lookup("each other");
    expect(eachOther?.senseIds).toHaveLength(1);
    const eachOtherSense = senseStore.findByUuid(eachOther!.senseIds[0].value);
    expect(eachOtherSense).toBeDefined();
    expect(eachOtherSense?.isRootWord).toBe(false);

    // "about" (prepositions.json) is a hand-curated Word with more than
    // one Sense -- WordFileEntry.senses (asset_loader.ts's own docstring)
    // makes registerUniqueSense() run once per string instead of once for
    // the whole entry, each appending its own Sense onto "about"'s base-
    // lemma WordForm.senseIds in the source array's own order.
    const about = dictionary.lookup("about");
    const aboutSenseIds = wordForms.senseIdsOf(about!);
    expect(aboutSenseIds).toHaveLength(7);
    const aboutSenses = aboutSenseIds.map((id) => senseStore.findByUuid(id.value));
    expect(aboutSenses.every((sense) => sense !== undefined)).toBe(true);
    expect(aboutSenses[0]?.definition?.value).toBe("Around/on all sides of");
    expect(aboutSenses[6]?.definition?.value).toBe("Approximately in position/time");
    // Every distinct Sense really is its own Sense object, not the same
    // one registered 7 times -- registerMember() keeps their identities
    // apart in the store the same way "she"/"entity" above stay apart.
    expect(new Set(aboutSenseIds.map((id) => id.value)).size).toBe(7);

    // A single-sense PREPOSITION entry (no `senses` list of its own in
    // prepositions.json) still behaves exactly like every other ordinary
    // hand-curated Word -- one Sense, same as "she" above.
    const worth = dictionary.lookup("worth");
    expect(wordForms.senseIdsOf(worth!)).toHaveLength(1);

    // Most hand-curated Words get exactly one Sense of their own
    // (registerUniqueSense's own docstring, checked directly above), but
    // not every one -- AUXILIARY, seeded by a different path entirely
    // (AuxiliarySeeder, called from inside seedClosedClassWords() itself,
    // WordSeeder.MANDATORY_FILES's own comment), deliberately carries its
    // own Sense per distinct meaning ("am" carries 2 -- role/
    // auxiliary_seeder.ts's own docstring), and PREPOSITION now does too
    // for any entry with a hand-curated WordFileEntry.senses list
    // (asset_loader.ts's own docstring, prepositions.json). Summing each
    // Word's own real wordForms.senseIdsOf().length handles every POS
    // uniformly -- 1 for the ordinary case, more wherever the source data
    // says so -- with no need to special-case which POS varies.
    const expectedSenseTotal = (): number => {
      const wordSenseCount = dictionary.all().reduce((sum, w) => sum + wordForms.senseIdsOf(w).length, 0);
      return wordSenseCount + phraseBook.totalEntries();
    };
    expect(senseStore.totalEntries()).toBe(expectedSenseTotal());

    // Idempotent: re-seeding neither duplicates Senses nor reassigns
    // already-registered ones.
    const second = seeder.seedDomain(domain, { excludeOpenClasses: true });
    expect(second).toBe(0);
    expect(senseStore.totalEntries()).toBe(expectedSenseTotal());
    const reseededEntity = dictionary.lookupAll("entity").find((w) => w.partOfSpeech === PartOfSpeech.NOUN);
    expect(wordForms.senseIdsOf(reseededEntity!)[0].value).toBe(wordForms.senseIdsOf(entity!)[0].value);
  });

  it("seeds every multi-word closed-class entry as a Phrase, not a multi-word Word", () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    new WordSeeder("en").seedClosedClassWords(dictionary, phraseBook);

    // "each other" and "no one else" (both pronouns.json) are both real
    // multi-word Common Vocabulary Cache entries -- both should land in
    // the Phrases, neither in the Dictionary. (prepositions.json no
    // longer seeds any multi-word entry of its own -- assets/common/en/
    // README.md's own prepositions.json entry on why.)
    expect(dictionary.lookupAll("each other")).toHaveLength(0);
    expect(dictionary.lookupAll("no one else")).toHaveLength(0);
    const eachOther = phraseBook.lookup("each other");
    expect(eachOther?.partOfSpeech).toBe(PartOfSpeech.PRONOUN);
    const noOneElse = phraseBook.lookup("no one else");
    expect(noOneElse?.partOfSpeech).toBe(PartOfSpeech.PRONOUN);

    // Dictionary itself never saw a multi-word Word (seedClosedClassWords
    // alone is under test here, not seedWordNet -- a WordNet multi-word
    // lemma like "toy poodle" is a Phrase too, word_seeder.ts's own
    // seedWordNet), so its own phrase-span tracking stays at its
    // empty-Dictionary default.
    expect(dictionary.phraseSpanLimit).toBe(1);
    expect(phraseBook.spanLimit).toBeGreaterThanOrEqual(3); // "no one else"
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

  it("resolves each synset's own senseCategory from its real lex_filenum against the bundled dict/lexnames table, never leaving it empty", async () => {
    const synsets = await loadWordNetSynsets();

    // 03005231-n: "chair" -- sense key chair%1:06:00::, independently
    // confirmed against dict/index.sense -- lex_filenum 06 -> noun.artifact,
    // this feature's own worked example.
    const chair = synsets.find((s) => s.synsetId === "03005231-n");
    expect(chair?.senseCategory).toBe("noun.artifact");

    // 06855902-n: "comma" (dict/data.noun's own lex_filenum 10) --
    // confirms a second POS/category pairing beyond the worked example.
    const comma = synsets.find((s) => s.synsetId === "06855902-n");
    expect(comma?.senseCategory).toBe("noun.communication");

    // Validation rule: every real bundled synset's own lex_filenum
    // resolved against dict/lexnames without falling back to a derived
    // or empty value -- loadWordNetSynsets() itself would already have
    // thrown while parsing (parseSynsetLine's own docstring) had any
    // synset's lex_filenum failed to resolve, so this just confirms the
    // field is always populated on every synset that made it into the
    // returned array.
    expect(synsets.every((s) => s.senseCategory.length > 0)).toBe(true);
  }, 30000);
});

describe("WordSeeder.seedWordNet against the bundled Princeton WordNet 3.1 dict/ files", () => {
  it("seeds every synset member as a Word carrying its synsetId, wires every WordNet pointer to a MorphologicalPointerRelationship, and stays idempotent across both", async () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    const senseStore = new Senses();
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
    const seeder = new WordSeeder("en");
    const wordForms = new WordForms();
    const domain = { vocabulary: { dictionary, phrases: phraseBook, senses: senseStore, wordForms, morphologicalPointerRelationships, morphologicalPointerRelationshipProcessor, semanticRelationships, semanticRelationshipProcessor } };

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
    expect(morphologicalPointerRelationships.totalRelationships()).toBe(first.relationshipsSeeded);
    // One Sense per synset (Sense's own docstring) -- close to, but not
    // necessarily exactly, WordNet 3.1's own ~117,800 synset count (a
    // synset with every lemma empty, if one ever existed, would seed no
    // Sense at all -- none do in the bundled data, but this only
    // asserts the real order of magnitude, not the exact figure).
    expect(first.sensesSeeded).toBeGreaterThan(100000);

    // A Word/Phrase is now unique by (partOfSpeech, lemma), not by
    // synset (Word.senseIds's own docstring) -- resolving "the Word for
    // lemma X in synset Y" now goes through the synset's own Sense
    // first, then that Sense's own membership, rather than filtering
    // dictionary.lookupAll(X) by a per-Word synsetId that no longer
    // disambiguates a polysemous lemma's several synsets.
    const wordForSynset = (synsetId: string, lemma: string): Word => {
      const sense = senseStore.findBySynsetId(synsetId);
      const member = sense && senseStore.membersOf(senseGraphUuid(sense)).find((m) => m.text === lemma);
      if (member === undefined || "words" in member) throw new Error(`no Word for "${lemma}" in synset ${synsetId}`);
      return member;
    };
    const phraseForSynset = (synsetId: string, lemma: string): Phrase => {
      const sense = senseStore.findBySynsetId(synsetId);
      const member = sense && senseStore.membersOf(senseGraphUuid(sense)).find((m) => m.text === lemma);
      if (member === undefined || !("words" in member)) throw new Error(`no Phrase for "${lemma}" in synset ${synsetId}`);
      return member;
    };
    // synonyms()/hypernyms()/hyponyms()/antonyms()/meronyms()/holonyms()
    // (role/word_processor.ts) no longer exist -- retired along with MorphologicalPointerRelationshipStore's
    // own retirement from the permanent queryable model (role/word_processor.ts's
    // own "Derived properties" docstring). These two local helpers read
    // the same facts back from the real thing that replaced them:
    // Senses.membersOf() for synonymy, semanticRelationships (Sense-to-
    // Sense) for every other kind.
    const synonymsOf = (entry: Word | Phrase): (Word | Phrase)[] => {
      const seen = new Set([memberUuid(entry)]);
      const result: (Word | Phrase)[] = [];
      for (const senseId of senseIdsOf(wordForms, entry)) {
        for (const member of senseStore.membersOf(senseId.value)) {
          if (seen.has(memberUuid(member))) continue;
          seen.add(memberUuid(member));
          result.push(member);
        }
      }
      return result;
    };
    const semanticRelated = (
      entry: Word | Phrase,
      kind: SemanticRelationshipKind,
      direction: "outgoing" | "incoming" | "both" = "outgoing",
    ): (Word | Phrase)[] => {
      const seen = new Set([memberUuid(entry)]);
      const result: (Word | Phrase)[] = [];
      for (const senseId of senseIdsOf(wordForms, entry)) {
        const edges =
          direction === "both"
            ? [...semanticRelationships.outgoing(senseId.value), ...semanticRelationships.incoming(senseId.value)]
            : direction === "outgoing"
              ? semanticRelationships.outgoing(senseId.value)
              : semanticRelationships.incoming(senseId.value);
        for (const edge of edges) {
          if (edge.relationshipType !== kind) continue;
          const otherSenseId = edge.sourceSenseId.value === senseId.value ? edge.targetSenseId.value : edge.sourceSenseId.value;
          for (const member of senseStore.membersOf(otherSenseId)) {
            if (seen.has(memberUuid(member))) continue;
            seen.add(memberUuid(member));
            result.push(member);
          }
        }
      }
      return result;
    };
    expect(senseStore.totalEntries()).toBe(first.sensesSeeded);

    const big = wordForSynset("01385012-a", "big");
    expect(big.isCommon).toBe(true);
    expect(wordForms.synsetIdOf(big)?.schemeId).toBe("wn31");
    // synonyms() now unions every sense "big" carries (Word.senseIds's
    // own docstring, relatedWords()'s own generalization, role/word_processor.ts) --
    // "big" ADJECTIVE is genuinely polysemous ("above average in size",
    // "pregnant", "generous", "grown up", "boastful", ...), so its own
    // Word-level synonym list is every one of those senses' synonyms
    // together now, not just "above average in size"'s own "large". The
    // *sense-scoped* check right below is the one that actually proves
    // "big and large share a Sense".
    expect(synonymsOf(big).map((w) => w.text)).toContain("large");

    // "big" and "large" are the same Sense (Sense's own docstring on
    // why this is the point of the class -- a shared meaning, not a
    // duplicated copy of one per member), resolvable via the Word's own
    // senseIds reference.
    const large = wordForSynset("01385012-a", "large");
    expect(wordForms.senseIdsOf(big).length).toBeGreaterThan(0);
    const bigSenseId = senseGraphUuid(senseStore.findBySynsetId("01385012-a")!);
    expect(wordForms.senseIdsOf(big).map((id) => id.value)).toContain(bigSenseId);
    expect(wordForms.senseIdsOf(large).map((id) => id.value)).toContain(bigSenseId);
    // The sense-scoped synonym fact: every fellow member of *this one*
    // Sense, not big's own other, unrelated senses.
    expect(senseStore.membersOf(bigSenseId).map((m) => m.text)).toEqual(expect.arrayContaining(["big", "large"]));
    const bigSense = senseStore.findByUuid(bigSenseId);
    expect(bigSense).toBeDefined();
    expect(bigSense?.synsetId?.value).toBe("01385012-a");
    expect(bigSense?.definition?.value).toContain("above average in size");
    expect(bigSense?.isCommon).toBe(true);

    // 00001930-n "physical entity" -- HYPERNYM -> 00001740-n "entity".
    // A multi-word lemma, so it seeded as a Phrase, not a Word
    // (word_seeder.ts's own isMultiWordLemma() split) -- still wired
    // into the HYPERNYM graph exactly like a single-word synset member,
    // so hypernyms() resolves it as its own subject directly.
    const physicalEntity = phraseForSynset("00001930-n", "physical entity");
    expect(semanticRelated(physicalEntity, SemanticRelationshipKind.HYPERNYM, "outgoing").map((w) => w.text)).toEqual(["entity"]);
    // The reciprocal direction resolves too, off the identical stored
    // edge (hyponyms()'s own docstring) -- "entity" is never told apart
    // from "physical entity" by a second, separately-stored HYPONYM edge.
    // Resolving the Phrase-typed hyponym back into a displayable Word
    // needs the phraseBook fallback (relatedWords()'s own docstring,
    // role/word_processor.ts) -- the whole point of this test.
    const entity = wordForSynset("00001740-n", "entity");
    expect(semanticRelated(entity, SemanticRelationshipKind.HYPERNYM, "incoming").map((w) => w.text)).toContain("physical entity");

    // 00001740-a "able" -- ANTONYM -> 00002098-a "unable" (both
    // directions -- antonyms() itself reads direction="both").
    const able = wordForSynset("00001740-a", "able");
    expect(semanticRelated(able, SemanticRelationshipKind.ANTONYM, "both").map((w) => w.text)).toEqual(["unable"]);
    const unable = wordForSynset("00002098-a", "unable");
    expect(semanticRelated(unable, SemanticRelationshipKind.ANTONYM, "both").map((w) => w.text)).toEqual(["able"]);
    // Only one ANTONYM edge is actually stored for this pair (a genuine
    // regression check for SYMMETRIC_RELATIONSHIP_KINDS -- antonyms()
    // reading direction="both" would still pass even if both directions
    // were separately stored, so this checks the underlying store directly).
    const antonymEdgesBetween = [
      ...morphologicalPointerRelationships.outgoing(wordGraphUuid(able!)),
      ...morphologicalPointerRelationships.incoming(wordGraphUuid(able!)),
    ].filter((r) => r.relationshipType === LexicalRelationshipType.ANTONYM && (r.sourceWordId.value === wordGraphUuid(unable!) || r.targetWordId.value === wordGraphUuid(unable!)));
    expect(antonymEdgesBetween).toHaveLength(1);

    // Adjective Gradability Update: "big"/"large" (01385012-a) carries a
    // real WordNet Attribute pointer to "size" (05106204-n) --
    // determineGradability() (role/processor/adjective_processor.ts) requires nothing more
    // than the pointer itself -- so seedWordNet's own post-relationships
    // pass should have populated both Degree Form fields, synthetically
    // (monosyllabic -> "-er"/"-est", isPeriphrasticComparison's own
    // docstring).
    expect(isAdjective(big)).toBe(true);
    expect(formTextOf(wordForms, big, WordFormField.POSITIVE_DEGREE_FORM)).toEqual({ value: "big" });
    expect(formTextOf(wordForms, big, WordFormField.COMPARATIVE_DEGREE_FORM)).toEqual({ value: "bigger", formats: ["/([bcdfghjklmnpqrstvwxyz])\\1er$/i"] });
    expect(formTextOf(wordForms, big, WordFormField.SUPERLATIVE_DEGREE_FORM)).toEqual({ value: "biggest", formats: ["/([bcdfghjklmnpqrstvwxyz])\\1est$/i"] });

    // "tall" (02393670-a) carries its own real Attribute pointer to
    // "stature, height" (05009517-n) -- this is this feature's own
    // worked example ("Tall[Adjective, Sense 4] -> Attribute ->
    // Height[Noun] -> Scalar Dimension" => "Gradable(tall) = true"), and
    // a genuine regression check: an earlier version of determineGradability()
    // required climbing "stature, height"'s own Hypernym chain to one of
    // two narrow anchor synsets, but that chain climbs to
    // "bodily_property" -> "property" instead -- a sibling branch that
    // never reaches either anchor -- so it wrongly called "tall"
    // non-gradable.
    const tall = dictionary.lookupAll("tall").find((w) => isAdjective(w)) as Adjective;
    expect(tall).toBeDefined();
    expect(formTextOf(wordForms, tall, WordFormField.POSITIVE_DEGREE_FORM)).toEqual({ value: "tall" });
    expect(formTextOf(wordForms, tall, WordFormField.COMPARATIVE_DEGREE_FORM)).toEqual({ value: "taller", formats: ["/er$/i"] });
    expect(formTextOf(wordForms, tall, WordFormField.SUPERLATIVE_DEGREE_FORM)).toEqual({ value: "tallest", formats: ["/est$/i"] });

    // "wooden" (both real WordNet senses, 01145111-a "lacking ease or
    // grace" and 02586927-a "made ... of wood") carries no Attribute
    // pointer at all -- verified directly against the bundled
    // dict/data.adj, not guessed -- so it must come out non-gradable:
    // Positive Degree Form only, never a mechanically well-formed but
    // invalid "woodener"/"woodenest" (the exact bug this Gradability
    // Update closes).
    const wooden = dictionary.lookup("wooden")! as Adjective;
    expect(formTextOf(wordForms, wooden, WordFormField.POSITIVE_DEGREE_FORM)).toEqual({ value: "wooden" });
    expect(formTextOf(wordForms, wooden, WordFormField.COMPARATIVE_DEGREE_FORM)).toBeUndefined();
    expect(formTextOf(wordForms, wooden, WordFormField.SUPERLATIVE_DEGREE_FORM)).toBeUndefined();

    // Adverb Gradability Update (role/processor/adverb_processor.ts): "scarcely" (00003317-r)
    // carries a real WordNet Pertainym fact to "scarce" (adjective) --
    // a genuine SemanticRelationship now (PERTAINYM, Sense-to-Sense --
    // SemanticRelationshipKind's own docstring on why), not a Word-to-Word
    // edge. WordNet gives no adverb an Attribute pointer of its own at
    // all (verified directly against the bundled dict/data.adv, zero `=`
    // pointers exist there), so an Adverb's own gradability is inherited
    // through that Pertainym link to its base Adjective instead. "scarce"
    // is itself gradable, so "scarcely" is too -- and being "-ly"-ending,
    // it goes periphrastic ("more scarcely"), not through Adjective's own
    // "y" rule (there is no real "scarcelier").
    const scarcely = dictionary.lookup("scarcely")! as Adverb;
    expect(isAdverb(scarcely)).toBe(true);
    expect(formTextOf(wordForms, scarcely, WordFormField.COMPARATIVE_DEGREE_FORM)).toEqual({ value: "more scarcely", formats: ["/^more\\s+.+$/i"] });
    expect(formTextOf(wordForms, scarcely, WordFormField.SUPERLATIVE_DEGREE_FORM)).toEqual({ value: "most scarcely", formats: ["/^most\\s+.+$/i"] });
    expect(semanticRelated(scarcely, SemanticRelationshipKind.PERTAINYM, "outgoing").map((w) => w.text)).toContain("scarce");

    // "anisotropically" (00003675-r) carries a Pertainym fact to
    // "anisotropic", which carries no Attribute fact of its own --
    // non-gradable, correctly inherited through the Pertainym hop.
    const anisotropically = dictionary.lookup("anisotropically")! as Adverb;
    expect(formTextOf(wordForms, anisotropically, WordFormField.POSITIVE_DEGREE_FORM)).toEqual({ value: "anisotropically" });
    expect(formTextOf(wordForms, anisotropically, WordFormField.COMPARATIVE_DEGREE_FORM)).toBeUndefined();
    expect(formTextOf(wordForms, anisotropically, WordFormField.SUPERLATIVE_DEGREE_FORM)).toBeUndefined();
    expect(semanticRelated(anisotropically, SemanticRelationshipKind.PERTAINYM, "outgoing").map((w) => w.text)).toContain("anisotropic");

    // "wide" (00497722-r) is a flat adverb -- identical spelling to its
    // base Adjective ("wide roads"/"wandered wide") rather than a "-ly"
    // derivation -- and carries no Pertainym fact of its own at all
    // (verified directly against the bundled dict/data.adv). Adverb's
    // own determineGradability() falls back to the same-spelling
    // Adjective ("wide", 02571278-a, which carries its own real
    // Attribute pointer to "width") for exactly this case.
    const wideAdverb = dictionary.lookupAll("wide").find((w) => isAdverb(w)) as Adverb;
    expect(wideAdverb).toBeDefined();
    expect(formTextOf(wordForms, wideAdverb, WordFormField.COMPARATIVE_DEGREE_FORM)).toEqual({ value: "wider", formats: ["/er$/i"] });
    expect(formTextOf(wordForms, wideAdverb, WordFormField.SUPERLATIVE_DEGREE_FORM)).toEqual({ value: "widest", formats: ["/est$/i"] });
    expect(semanticRelated(wideAdverb, SemanticRelationshipKind.PERTAINYM, "outgoing")).toEqual([]);

    // Every new WordNet-sourced kind actually appears at least once --
    // a regression check against relationshipKindForPointer silently
    // mapping a symbol to the wrong (or an existing, wrong) kind.
    const seenKinds = new Set(morphologicalPointerRelationships.all().map((r) => r.relationshipType));
    for (const kind of [
      LexicalRelationshipType.SIMILAR_TO,
      LexicalRelationshipType.MERONYM,
      LexicalRelationshipType.ALSO_SEE,
      LexicalRelationshipType.VERB_GROUP,
      LexicalRelationshipType.ATTRIBUTE,
      LexicalRelationshipType.REGION_DOMAIN,
      LexicalRelationshipType.USAGE_DOMAIN,
      // PERTAINYM seeds as an ordinary, word-specific MorphologicalPointerRelationship
      // here too (this method's own copySemanticRelationship() docstring,
      // word_seeder.ts, on why it's then also copied out to a genuine
      // SemanticRelationship -- the scarcely/anisotropically/wide
      // assertions above) -- unlike the group below, it's never actually
      // absent.
      LexicalRelationshipType.PERTAINYM,
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
    // seeded xHOLONYM complement). TOPIC_DOMAIN is never seeded either --
    // seedPointerRelationship intercepts `;c`/`-c` pointers and tags the
    // word itself (domainTag/relatedDomainTags) instead of creating an
    // edge (see the dedicated "topic-domain pointers" test below).
    // Instance-of (`@i`/`~i`) is never seeded either -- relationshipKindForPointer's
    // own docstring on why LexicalRelationshipType's INSTANCE_HYPERNYM/
    // INSTANCE_HYPONYM ordinals are retired rather than populated -- so
    // seenKinds can never contain them at all (no enum member left to
    // even ask about).
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
    const meronymEdges = morphologicalPointerRelationships.all().filter((r) => r.relationshipType === LexicalRelationshipType.MERONYM);
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
    const hand = wordForSynset("05572223-n", "hand");
    const finger = wordForSynset("05574137-n", "finger");
    // The `%p`/`#p` pointer between "hand" and "finger" is synset-wide
    // (both indices 0), so it's stored as a single Sense-to-Sense edge,
    // not directly between the two Words (WordSeeder.seedPointerRelationship's
    // own docstring, this file's own WordNet-relationship-migration
    // tests above) -- checked at the Sense level here for that reason.
    const handSense = senseStore.findBySynsetId("05572223-n")!;
    const fingerSense = senseStore.findBySynsetId("05574137-n")!;
    const handFingerEdge = morphologicalPointerRelationships
      .all()
      .find(
        (r) =>
          r.relationshipType === LexicalRelationshipType.MERONYM &&
          ((r.sourceWordId.value === senseGraphUuid(handSense) && r.targetWordId.value === senseGraphUuid(fingerSense)) ||
            (r.sourceWordId.value === senseGraphUuid(fingerSense) && r.targetWordId.value === senseGraphUuid(handSense))),
      );
    expect(handFingerEdge).toBeDefined();
    expect(handFingerEdge?.sourceWordId.value).toBe(senseGraphUuid(fingerSense));
    expect(handFingerEdge?.targetWordId.value).toBe(senseGraphUuid(handSense));
    // meronyms()/holonyms() (role/word_processor.ts) already expand a Sense-to-Sense
    // edge back out to its member Words on read (relatedWords()'s own
    // senseStore-aware branch) -- reading that same stored direction
    // from opposite ends: "hand"'s meronyms are its own parts (finger
    // among them); "finger"'s holonyms are the wholes it's part of
    // (hand among them).
    expect(semanticRelated(hand, SemanticRelationshipKind.MERONYM, "incoming").map((w) => w.text)).toContain("finger");
    expect(semanticRelated(finger, SemanticRelationshipKind.MERONYM, "outgoing").map((w) => w.text)).toContain("hand");
    // And not the other way around -- "finger"'s own meronyms don't
    // include "hand" (finger isn't made of hands), nor does "hand"
    // holonym-wise claim to be part of "finger".
    expect(semanticRelated(finger, SemanticRelationshipKind.MERONYM, "incoming").map((w) => w.text)).not.toContain("hand");
    expect(semanticRelated(hand, SemanticRelationshipKind.MERONYM, "outgoing").map((w) => w.text)).not.toContain("finger");

    // Instance-of (`@i`/`~i`) pointers are never seeded at all --
    // relationshipKindForPointer's own docstring on why (word_seeder.ts).
    // "Hegira" is a real, direct instance of "flight"/"escape" in the
    // bundled data (dict/data.noun's own 00061368-n `@i` -> 00059563-n),
    // so no relationship of any kind should exist between the two Words.
    const hegira = wordForSynset("00061368-n", "Hegira");
    const flight = wordForSynset("00059563-n", "flight");
    const hegiraFlightEdges = [
      ...morphologicalPointerRelationships.outgoing(wordGraphUuid(hegira)),
      ...morphologicalPointerRelationships.incoming(wordGraphUuid(hegira)),
    ].filter((r) => r.sourceWordId.value === wordGraphUuid(flight) || r.targetWordId.value === wordGraphUuid(flight));
    expect(hegiraFlightEdges).toEqual([]);

    // Topic-domain pointers (`;c`/`-c`) tag the shared Sense now, once
    // per synset-wide pointer, not the word itself (word_seeder.ts's own
    // applyDomainTag/tagTopicDomain docstrings) -- "infusion" (dict/data.noun
    // offset 00324358) carries exactly one topic pointer, to the
    // "medicine" (medical_specialty) category.
    const infusion = wordForSynset("00324358-n", "infusion");
    const infusionSenseId = senseGraphUuid(senseStore.findBySynsetId("00324358-n")!);
    expect(wordForms.senseIdsOf(infusion).map((id) => id.value)).toContain(infusionSenseId);
    const infusionSense = senseStore.findByUuid(infusionSenseId);
    expect(infusionSense?.domainTag?.value).toBe("medicine");
    expect(infusionSense?.relatedDomainTags).toEqual([]);

    // "winger" (offset 10802147) carries FOUR topic pointers -- it's a
    // wing position in soccer, field hockey, rugby, AND football. None
    // should be lost: exactly one becomes domainTag (first-wins), the
    // other three land in relatedDomainTags, with no duplicates -- same
    // outcome whether a given (word, category) fact is discovered via
    // winger's own `;c` pointer or via the category synset's reciprocal
    // `-c` pointer back to winger.
    const winger = wordForSynset("10802147-n", "winger");
    const wingerSenseId = senseGraphUuid(senseStore.findBySynsetId("10802147-n")!);
    expect(wordForms.senseIdsOf(winger).map((id) => id.value)).toContain(wingerSenseId);
    const wingerSense = senseStore.findByUuid(wingerSenseId);
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
    expect(morphologicalPointerRelationships.totalRelationships()).toBe(first.relationshipsSeeded);
    // Re-seeding never disturbs an already-assigned senseIds either --
    // "big"/"large" still share the identical Sense they did before.
    expect(wordForms.senseIdsOf(wordForSynset("01385012-a", "big")).map((id) => id.value)).toContain(senseGraphUuid(bigSense!));
  }, 60000);

  it("a word's own relationships never show both a hypernym/hyponym (or antonym/meronym/...) fact and its reciprocal listing as two separate entries", async () => {
    const dictionary = new Dictionary();
    const senseStore = new Senses();
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
    const wordForms = new WordForms();
    await new WordSeeder("en").seedWordNet({
      vocabulary: { dictionary, phrases: new Phrases(), senses: senseStore, wordForms, morphologicalPointerRelationships, morphologicalPointerRelationshipProcessor, semanticRelationships, semanticRelationshipProcessor },
    });

    const dog = dictionary.lookupAll("dog").find((w) => w.partOfSpeech === PartOfSpeech.NOUN && wordForms.synsetIdOf(w)?.value === "02086723-n");
    expect(dog).toBeDefined();

    // Both directions still resolve correctly (dog has real hypernyms
    // -- canine/canid/domestic animal -- and real hyponyms -- poodle,
    // among many others) -- read via each of dog's own Senses now
    // (semanticRelationships is Sense-keyed, not Word-keyed).
    const senseIdsOfWord = (word: Word): string[] => wordForms.senseIdsOf(word).map((id) => id.value);
    const dogHypernyms = senseIdsOfWord(dog!).flatMap((senseId) =>
      semanticRelationships.outgoing(senseId).filter((r) => r.relationshipType === SemanticRelationshipKind.HYPERNYM).flatMap((r) => senseStore.membersOf(r.targetSenseId.value).map((m) => m.text)),
    );
    const dogHyponyms = senseIdsOfWord(dog!).flatMap((senseId) =>
      semanticRelationships.incoming(senseId).filter((r) => r.relationshipType === SemanticRelationshipKind.HYPERNYM).flatMap((r) => senseStore.membersOf(r.sourceSenseId.value).map((m) => m.text)),
    );
    expect(dogHypernyms).toContain("canine");
    expect(dogHyponyms).toContain("poodle");

    // ... but every one of dog's own relationships (outgoing + incoming,
    // exactly what the Vocabulary UI's detail panel queries via
    // DictionaryView.searchRelationships({ wordId })) touches dog's own
    // Senses exactly once per (other sense, kind) pair -- never a second
    // entry for the identical fact viewed from the other end.
    const seenPairs = new Set<string>();
    for (const senseId of senseIdsOfWord(dog!)) {
      for (const r of [...semanticRelationships.outgoing(senseId), ...semanticRelationships.incoming(senseId)]) {
        const otherSenseId = r.sourceSenseId.value === senseId ? r.targetSenseId.value : r.sourceSenseId.value;
        const pairKey = `${otherSenseId}|${r.relationshipType}`;
        expect(seenPairs.has(pairKey), `duplicate (other sense, kind) pair: ${pairKey}`).toBe(false);
        seenPairs.add(pairKey);
      }
    }
  }, 60000);

  it("a multi-word synset lemma seeds as a Phrase, not a Word, and behaves exactly like a Word in the relationship graph -- resolvable from both DictionaryView.searchRelationships and resolveHierarchy", async () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    const senseStore = new Senses();
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
    const wordForms = new WordForms();
    await new WordSeeder("en").seedWordNet({
      vocabulary: { dictionary, phrases: phraseBook, senses: senseStore, wordForms, morphologicalPointerRelationships, morphologicalPointerRelationshipProcessor, semanticRelationships, semanticRelationshipProcessor },
    });

    // 02116276-n "toy poodle" -- HYPERNYM -> 02115987-n "poodle" (dict/data.noun).
    const toyPoodle = phraseBook.lookupAll("toy poodle").find((phrase) => phrase.synsetId?.value === "02116276-n");
    expect(toyPoodle).toBeDefined();
    expect(toyPoodle?.isCommon).toBe(true);
    expect(toyPoodle?.phraseType).toBe(PhraseType.NOUN_PHRASE);
    // synsetMemberToPhrase()'s own dispatch actually instantiated this
    // one real seeded Phrase via createNounPhrase() (data/entities/noun_phrase.ts),
    // not plain createPhrase() -- isNounPhrase() narrows it back, the
    // same PhraseType-mirrors-PartOfSpeech pattern isNoun()/isVerb()/...
    // already give Word.
    expect(isNounPhrase(toyPoodle!)).toBe(true);
    expect(isVerbPhrase(toyPoodle!)).toBe(false);
    // classifyPhraseRoles()'s own NounPhrase Head rule -- "poodle" (the
    // last Noun-capable token, no Preposition present) is the Head;
    // "toy" precedes it, so it's a Modifier (data/entities/noun_phrase.ts's own
    // "toy" is genuinely a Noun/Verb homograph, but classifyPhraseRoles
    // checks every possible part of speech, not just dictionary.lookup's
    // own arbitrary single pick, so this holds regardless of which one
    // that pick happened to land on).
    expect(toyPoodle!.wordRoles).toEqual([PhraseRole.MODIFIER, PhraseRole.HEAD]);
    // Phrase.headWord/headWordForm -- derived straight from wordRoles'
    // own HEAD position (linkPhraseWords()'s own docstring), so this
    // must always agree with words[wordRoles.indexOf(HEAD)] exactly.
    expect(toyPoodle!.headWord?.value).toBe(toyPoodle!.words[1]?.value);
    expect(toyPoodle!.headWordForm?.value).toBe("poodle");

    // classifyPhraseType()'s own PREPOSITIONAL_PHRASE/INFINITIVE_PHRASE
    // rules, spot-checked against real seeded Phrases rather than just
    // the pure-function unit tests above -- "at fault" (01324381-s,
    // dict/data.adj) is WordNet-tagged ADJECTIVE but structurally a
    // Preposition + NP; "to be sure" (00151192-r, dict/data.adv) is
    // WordNet-tagged ADVERB but structurally an infinitive.
    const atFault = phraseBook.lookupAll("at fault").find((phrase) => phrase.synsetId?.value === "01324381-s");
    expect(atFault?.partOfSpeech).toBe(PartOfSpeech.ADJECTIVE);
    expect(atFault?.phraseType).toBe(PhraseType.PREPOSITIONAL_PHRASE);
    expect(isPrepositionalPhrase(atFault!)).toBe(true);
    // Narrowing is by phraseType, never by partOfSpeech -- "at fault"
    // is WordNet-tagged ADJECTIVE (checked above) but is not an
    // AdjectivePhrase, precisely because its own internal structure is
    // Preposition + NP, not (Degree modifiers) + Adjective.
    expect(isAdjectivePhrase(atFault!)).toBe(false);
    // "at" resolves to Head via classifyPhraseRoles()'s own
    // PHRASE_TYPE_PREPOSITIONS closed set regardless of whether the
    // Dictionary itself has an "at" sense -- it happens to have one here
    // too (index.noun lists a real, obscure "at" noun homograph), but
    // that's incidental to *why* it's the Head, not the reason. "fault"
    // retains its own POS (a post-head Noun gets no PrepositionalPhrase
    // role, that Word Role Assignment column's own "remaining words
    // retain their POS" rule).
    expect(atFault!.wordRoles).toEqual([PhraseRole.HEAD, undefined]);
    // headWord still resolves here since "at" happens to have its own
    // (obscure) Dictionary entry -- headWordForm names the token either
    // way, independent of whether headWord itself resolved.
    expect(atFault!.headWord?.value).toBe(atFault!.words[0]?.value);
    expect(atFault!.headWord).toBeDefined();
    expect(atFault!.headWordForm?.value).toBe("at");

    const toBeSure = phraseBook.lookupAll("to be sure").find((phrase) => phrase.synsetId?.value === "00151192-r");
    expect(toBeSure?.partOfSpeech).toBe(PartOfSpeech.ADVERB);
    expect(toBeSure?.phraseType).toBe(PhraseType.INFINITIVE_PHRASE);
    expect(isInfinitivePhrase(toBeSure!)).toBe(true);
    expect(isAdverbPhrase(toBeSure!)).toBe(false);
    // InfinitivePhrase's own fixed rule (data/infinitive_phrase.ts's own
    // docstring): "to" is always a Particle, never a Head candidate;
    // Head is the first Verb-capable token after it ("be"). "sure"
    // retains its own POS -- not covered by this codebase's own Word
    // Patterns table, which has no InfinitivePhrase rows.
    expect(toBeSure!.wordRoles).toEqual([PhraseRole.PARTICLE, PhraseRole.HEAD, undefined]);
    expect(toBeSure!.headWord?.value).toBe(toBeSure!.words[1]?.value);
    expect(toBeSure!.headWordForm?.value).toBe("be");
    expect(dictionary.lookupAll("toy poodle")).toEqual([]);

    const poodle = dictionary.lookupAll("poodle").find((w) => wordForms.synsetIdOf(w)?.value === "02115987-n");
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
    expect(toyPoodle!.words[0]?.value).toBe(wordGraphUuid(toy!));
    expect(toyPoodle!.words[1]?.value).toBe(wordGraphUuid(poodle!));

    // Seeded exactly like a Word: a genuine SemanticRelationship works
    // with the Phrase's own Sense as its own subject exactly like a
    // Word's. Synset 02115987-n itself has two lemmas -- "poodle" and
    // "poodle dog" -- so the synset-wide HYPERNYM fact, stored as one
    // Sense-to-Sense edge, expands to both members on read via
    // Senses.membersOf(), not just the one this test happens to look up
    // by name.
    const toyPoodleHypernyms = toyPoodle!.senseIds.flatMap((senseId) =>
      semanticRelationships
        .outgoing(senseId.value)
        .filter((r) => r.relationshipType === SemanticRelationshipKind.HYPERNYM)
        .flatMap((r) => senseStore.membersOf(r.targetSenseId.value).map((m) => m.text)),
    );
    expect(toyPoodleHypernyms.sort()).toEqual(["poodle", "poodle dog"]);
    // And the reverse direction resolves the Phrase back too.
    const poodleHyponyms = wordForms.senseIdsOf(poodle!).flatMap((senseId) =>
      semanticRelationships
        .incoming(senseId.value)
        .filter((r) => r.relationshipType === SemanticRelationshipKind.HYPERNYM)
        .flatMap((r) => senseStore.membersOf(r.sourceSenseId.value).map((m) => m.text)),
    );
    expect(poodleHyponyms).toContain("toy poodle");

    // The Vocabulary UI's own resolution paths (DictionaryView) see the
    // identical fact, regardless of which endpoint they start from --
    // both server-side, on-demand paths used at WordNet scale
    // (MAX_INTERACTIVE_WORDS), not just the small-Domain embedded path.
    const view = new DictionaryView(dictionary, semanticRelationships, { domainName: "Common", phrases: phraseBook, senses: senseStore, wordForms });

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
    const toyPoodleNode = hierarchy.nodes.find((n) => n.id === toyPoodle!.senseIds[0].value);
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
    expect(detail.phrase_word_segments![0]).toMatchObject({ text: "toy", word: true, resolved: true, word_id: wordGraphUuid(toy!) });
    expect(detail.phrase_word_segments![1]).toMatchObject({ text: "poodle", word: true, resolved: true, word_id: wordGraphUuid(poodle!), lexical_form: "poodle" });
    // An ordinary Word's own record never carries this field.
    expect(view.searchWords({ wordId: wordGraphUuid(poodle!) }).words[0].phrase_word_segments).toBeUndefined();

    // head_word (phraseHeadWordSegment()'s own docstring) -- one
    // DefinitionSegment singling out the Head among phrase_word_segments
    // above, "poodle" here (toyPoodle's own wordRoles already confirmed
    // this). An ordinary Word's own record never carries this field
    // either.
    expect(detail.head_word).toMatchObject({ text: "poodle", word: true, resolved: true, word_id: wordGraphUuid(poodle!), lexical_form: "poodle" });
    expect(view.searchWords({ wordId: wordGraphUuid(poodle!) }).words[0].head_word).toBeUndefined();
  }, 60000);

  it("classifyPhraseRoles() assigns Head/Modifier/Particle/Determiner per data/phrase_type_patterns_and_word_roles.md's own per-PhraseType rules, against real seeded WordNet Phrases", async () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    const senseStore = new Senses();
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
    await new WordSeeder("en").seedWordNet({
      vocabulary: { dictionary, phrases: phraseBook, senses: senseStore, morphologicalPointerRelationships, morphologicalPointerRelationshipProcessor, semanticRelationships, semanticRelationshipProcessor },
    });

    // "give up" (02686624-v, dict/data.verb) -- VerbPhrase's own "Adverb
    // immediately followed by a Preposition is a Particle" rule doesn't
    // fire here (nothing follows "up"), so it's a Modifier instead;
    // "give" is the Head even though dictionary.lookup("give") alone
    // would arbitrarily resolve to give's own rare NOUN sense ("there's
    // a lot of give in the rope") -- classifyPhraseRoles() checks every
    // possible part of speech per token, not that one arbitrary pick,
    // so it still finds "give"'s VERB sense and heads it correctly.
    const giveUp = phraseBook.lookupAll("give up").find((phrase) => phrase.synsetId?.value === "02686624-v");
    expect(giveUp?.phraseType).toBe(PhraseType.VERB_PHRASE);
    expect(giveUp!.wordRoles).toEqual([PhraseRole.HEAD, PhraseRole.MODIFIER]);
    expect(giveUp!.headWord?.value).toBe(giveUp!.words[0]?.value);
    expect(giveUp!.headWordForm?.value).toBe("give");

    // "look up to" (01831800-v, dict/data.verb) -- same Head rule as
    // "give up", but here "up" *is* immediately followed by a token
    // capable of reading as a Preposition ("to", via
    // PHRASE_TYPE_PREPOSITIONS), so this time it's a Particle, not a
    // Modifier. "to" itself retains its own POS -- a post-Head
    // Preposition in a VerbPhrase gets no role of its own, the same as
    // atFault's own trailing "fault" above.
    const lookUpTo = phraseBook.lookupAll("look up to").find((phrase) => phrase.synsetId?.value === "01831800-v");
    expect(lookUpTo?.phraseType).toBe(PhraseType.VERB_PHRASE);
    expect(lookUpTo!.wordRoles).toEqual([PhraseRole.HEAD, PhraseRole.PARTICLE, undefined]);
    expect(lookUpTo!.headWord?.value).toBe(lookUpTo!.words[0]?.value);
    expect(lookUpTo!.headWordForm?.value).toBe("look");

    // "long ago" (00022855-r, dict/data.adv) -- AdverbPhrase's own
    // premodifying case: "ago" is the Head (the later of two Adverb-
    // capable tokens, no Preposition present), "long" -- itself also
    // Noun/Verb/Adjective-capable, but that doesn't matter, only its
    // Adverb-capability does here -- is a Modifier.
    const longAgo = phraseBook.lookupAll("long ago").find((phrase) => phrase.synsetId?.value === "00022855-r");
    expect(longAgo?.phraseType).toBe(PhraseType.ADVERB_PHRASE);
    expect(longAgo!.wordRoles).toEqual([PhraseRole.MODIFIER, PhraseRole.HEAD]);
    expect(longAgo!.headWord?.value).toBe(longAgo!.words[1]?.value);
    expect(longAgo!.headWordForm?.value).toBe("ago");

    // "in the meantime" (00065346-r, dict/data.adv) -- PrepositionalPhrase
    // with a genuine Determiner in the middle: "in" heads it (via the
    // same PHRASE_TYPE_PREPOSITIONS closed-set path "at"/"to" use above),
    // "the" is a Determiner (PHRASE_TYPE_DETERMINERS, word_seeder.ts --
    // WordNet doesn't lexicalize determiners as standalone senses any
    // more than it does most prepositions), and "meantime" retains its
    // own POS.
    const inTheMeantime = phraseBook.lookupAll("in the meantime").find((phrase) => phrase.synsetId?.value === "00065346-r");
    expect(inTheMeantime?.phraseType).toBe(PhraseType.PREPOSITIONAL_PHRASE);
    expect(inTheMeantime!.wordRoles).toEqual([PhraseRole.HEAD, PhraseRole.DETERMINER, undefined]);
    expect(inTheMeantime!.headWord?.value).toBe(inTheMeantime!.words[0]?.value);
    expect(inTheMeantime!.headWordForm?.value).toBe("in");

    // classifyPhraseRoles() itself, called directly (not just through
    // the full seeding pipeline above), for the one documented ambiguity
    // its own docstring names: two adjacent Adverb-capable tokens with
    // no Preposition are structurally identical whether premodifying
    // ("very quickly") or postmodifying ("quickly enough") -- resolved
    // only for the closed-set "enough" case, defaulting to
    // premodifying (later token is Head) otherwise. Exercised as a pure
    // function here since no real bundled WordNet lemma happens to be
    // "X enough" as its own multi-word entry.
    expect(classifyPhraseRoles(PhraseType.ADVERB_PHRASE, ["quickly", "enough"], dictionary)).toEqual([PhraseRole.HEAD, PhraseRole.MODIFIER]);
    expect(classifyPhraseRoles(PhraseType.ADVERB_PHRASE, ["very", "quickly"], dictionary)).toEqual([PhraseRole.MODIFIER, PhraseRole.HEAD]);

    // A Common Vocabulary Cache closed-class Phrase never goes through
    // linkPhraseWords()/classifyPhraseRoles() at all (no constituency-
    // parsing pass of its own, `words`'s own docstring) -- wordRoles
    // stays empty, `words`'s own exact counterpart.
    const handCrafted = createPhrase({ text: "in spite of", partOfSpeech: PartOfSpeech.PREPOSITION, phraseType: PhraseType.PREPOSITIONAL_PHRASE });
    expect(handCrafted.wordRoles).toEqual([]);
    expect(handCrafted.headWord).toBeUndefined();
    expect(handCrafted.headWordForm).toBeUndefined();
  }, 60000);

  it("seeds a Noun/Verb/Adjective/Adverb subtype per Word, populating per-sense frames/syntacticPosition from real WordNet data previously discarded", async () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    const senseStore = new Senses();
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
    const wordForms = new WordForms();
    await new WordSeeder("en").seedWordNet({
      vocabulary: { dictionary, phrases: phraseBook, senses: senseStore, wordForms, morphologicalPointerRelationships, morphologicalPointerRelationshipProcessor, semanticRelationships, semanticRelationshipProcessor },
    });
    const wordForSynset = (synsetId: string, lemma: string): Word => {
      const sense = senseStore.findBySynsetId(synsetId);
      const member = sense && senseStore.membersOf(senseGraphUuid(sense)).find((m) => m.text === lemma);
      if (member === undefined || "words" in member) throw new Error(`no Word for "${lemma}" in synset ${synsetId}`);
      return member;
    };

    // "breathe" (00001740-v) carries frame records 2/8, both wordIndex 0
    // (the whole synset) -- dict/data.verb: "021 * ... 02 + 02 00 + 08 00".
    const breathe = wordForSynset("00001740-v", "breathe");
    expect(isVerb(breathe)).toBe(true);
    expect(isNoun(breathe)).toBe(false);
    if (!isVerb(breathe)) throw new Error("unreachable");
    const breatheFrames = framesForSense(senseStore, breathe, senseGraphUuid(senseStore.findBySynsetId("00001740-v")!));
    expect(breatheFrames).toEqual(expect.arrayContaining(["Somebody ----s", "Somebody ----s something"]));
    expect(breatheFrames).toHaveLength(2);

    // 00027261-v ("stretch"/"extend") -- frame 8 applies to the whole
    // synset (wordIndex 0), frame 2 to "stretch" alone (wordIndex 1,
    // dict/data.verb's own "02 + 08 00 + 02 01"): "stretch" (lemma index
    // 0) gets both; "extend" (lemma index 1) gets only the whole-synset
    // one -- proving per-lemma resolution, not per-synset copying.
    const stretchSenseId = senseGraphUuid(senseStore.findBySynsetId("00027261-v")!);
    const stretch = wordForSynset("00027261-v", "stretch");
    const extend = wordForSynset("00027261-v", "extend");
    if (!isVerb(stretch) || !isVerb(extend)) throw new Error("unreachable");
    const stretchFrames = framesForSense(senseStore, stretch, stretchSenseId);
    expect(stretchFrames).toEqual(expect.arrayContaining(["Somebody ----s something", "Somebody ----s"]));
    expect(stretchFrames).toHaveLength(2);
    expect(framesForSense(senseStore, extend, stretchSenseId)).toEqual(["Somebody ----s something"]);

    // "stretch" is itself polysemous (Word.senseIds's own docstring) --
    // 00101188-v is a second, distinct verb sense of the identical
    // lemma+POS, now the same merged Word as 00027261-v above rather
    // than a separate one, carrying its OWN, different frame set (just
    // frame 2, whole-synset, dict/data.verb's own "01 + 02 00") --
    // proving frames are stored per (word, sense), not per Word.
    expect(wordForms.senseIdsOf(stretch).length).toBeGreaterThan(1);
    const secondStretchSenseId = senseGraphUuid(senseStore.findBySynsetId("00101188-v")!);
    expect(wordForms.senseIdsOf(stretch).map((id) => id.value)).toContain(secondStretchSenseId);
    expect(framesForSense(senseStore, stretch, secondStretchSenseId)).toEqual(["Somebody ----s"]);
    // Querying the first sense's own frames off the same Word still
    // gives the first sense's own answer, unaffected by the second.
    expect(framesForSense(senseStore, stretch, stretchSenseId)).toEqual(stretchFrames);

    // "afraid" (00078253-a) is WordNet-marked "afraid(p)" -- predicate-
    // only. The marker itself must not survive into the spelling.
    const afraidSenseId = senseGraphUuid(senseStore.findBySynsetId("00078253-a")!);
    const afraid = wordForSynset("00078253-a", "afraid");
    expect(isAdjective(afraid)).toBe(true);
    if (!isAdjective(afraid)) throw new Error("unreachable");
    expect(afraid.text).toBe("afraid");
    expect(syntacticPositionForSense(senseStore, afraid, afraidSenseId)).toBe(AdjectivePosition.PREDICATE_ONLY);

    // "big" (01385012-a, already used elsewhere in this file) carries no
    // WordNet position marker at all -- unrestricted, not just "false".
    const bigSenseId = senseGraphUuid(senseStore.findBySynsetId("01385012-a")!);
    const big = wordForSynset("01385012-a", "big");
    if (!isAdjective(big)) throw new Error("unreachable");
    expect(syntacticPositionForSense(senseStore, big, bigSenseId)).toBeUndefined();

    // Every Noun/Adverb Word still narrows correctly, even with no
    // extra field of its own populated yet.
    const poodle = wordForSynset("02115987-n", "poodle");
    expect(isNoun(poodle)).toBe(true);
    expect(isVerb(poodle)).toBe(false);
    const someAdverb = dictionary.all().find((w) => w.partOfSpeech === PartOfSpeech.ADVERB);
    expect(someAdverb).toBeDefined();
    expect(isAdverb(someAdverb!)).toBe(true);
    expect(isNoun(someAdverb!)).toBe(false);
  }, 60000);

  it("deriveMorphologicalPointers() reads back all four real Noun/Verb/Adjective/Adverb derivation pairs from WordSeeder.seedWordNet's own already-seeded relationship graph, without creating a second edge or double-counting WordNet's own reciprocal pointer recording", async () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    const senseStore = new Senses();
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
    await new WordSeeder("en").seedWordNet({
      vocabulary: { dictionary, phrases: phraseBook, senses: senseStore, morphologicalPointerRelationships, morphologicalPointerRelationshipProcessor, semanticRelationships, semanticRelationshipProcessor },
    });

    // Four real WordNet pairs, one per surviving relationship
    // (deriveMorphologicalPointers()'s own docstring on exactly these
    // four, and on why an earlier iteration's other four -- each built
    // on the generic DERIVED_FORM kind -- were removed: WordNet records
    // its own `+` Derived-Form pointer reciprocally, once under each
    // word's own synset, and derivationKind() (role/word_seeder.ts)
    // picks a *different* kind for each direction, so a DERIVED_FORM-
    // based field never named a new fact, only restated whichever of
    // these four an already-passing assertion below already covers,
    // under a second, spurious name).
    const able = dictionary.lookupAll("able").find((w): w is Adjective => isAdjective(w));
    const ability = dictionary.lookupAll("ability").find((w): w is Noun => isNoun(w));
    const respire = dictionary.lookupAll("respire").find((w): w is Verb => isVerb(w));
    const respiratory = dictionary.lookupAll("respiratory").find((w): w is Adjective => isAdjective(w));
    const unbearable = dictionary.lookupAll("unbearable").find((w): w is Adjective => isAdjective(w));
    const unbearably = dictionary.lookupAll("unbearably").find((w): w is Adverb => isAdverb(w));
    const hyperventilate = dictionary.lookupAll("hyperventilate").find((w): w is Verb => isVerb(w));
    const hyperventilation = dictionary.lookupAll("hyperventilation").find((w): w is Noun => isNoun(w));
    for (const word of [able, ability, respire, respiratory, unbearable, unbearably, hyperventilate, hyperventilation]) expect(word).toBeDefined();

    // Verb.isNominalised / Noun.isDerivedFromVerb (NOMINALISATION).
    expect(hyperventilate!.isNominalised?.value).toBe(wordGraphUuid(hyperventilation!));
    expect(hyperventilate!.isNominalisedIndicator).toBe(true);
    expect(hyperventilation!.isDerivedFromVerb?.value).toBe(wordGraphUuid(hyperventilate!));
    expect(hyperventilation!.isDerivedFromVerbIndicator).toBe(true);
    // Reading the pointer back never creates a second, redundant edge --
    // exactly one NOMINALISATION edge exists between this one pair.
    expect(
      morphologicalPointerRelationships
        .outgoing(wordGraphUuid(hyperventilate!))
        .filter((edge) => edge.relationshipType === LexicalRelationshipType.NOMINALISATION && edge.targetWordId.value === wordGraphUuid(hyperventilation!)),
    ).toHaveLength(1);
    // Noun no longer has an isVerbalised field, and Verb no longer has
    // isDerivedFromNoun -- both removed, each an earlier iteration's
    // own DERIVED_FORM-sourced restatement of the identical fact just
    // checked above.
    expect((hyperventilation as unknown as Record<string, unknown>).isVerbalised).toBeUndefined();
    expect((hyperventilate as unknown as Record<string, unknown>).isDerivedFromNoun).toBeUndefined();

    // Adjective.isNominalised / Noun.isDerivedFromAdjective
    // (NOMINALISATION, source=Adjective this time -- the exact
    // disambiguation findDerivationTarget()'s own otherPos check exists
    // for, since this is the identical relationship kind checked above).
    expect(able!.isNominalised?.value).toBe(wordGraphUuid(ability!));
    expect(able!.isNominalisedIndicator).toBe(true);
    expect(ability!.isDerivedFromAdjective?.value).toBe(wordGraphUuid(able!));
    expect(ability!.isDerivedFromAdjectiveIndicator).toBe(true);
    // Noun no longer has an isAdjectivised field, and Adjective no
    // longer has isDerivedFromNoun -- both removed as this same pair's
    // own ADJECTIVAL_DERIVATION-classified reciprocal restatement.
    expect((ability as unknown as Record<string, unknown>).isAdjectivised).toBeUndefined();
    expect((able as unknown as Record<string, unknown>).isDerivedFromNoun).toBeUndefined();

    // Verb.isAdjectivised / Adjective.isDerivedFromVerb
    // (ADJECTIVAL_DERIVATION, source=Verb -- disambiguated from a
    // Noun-sourced ADJECTIVAL_DERIVATION edge the same way the two
    // NOMINALISATION checks above disambiguate by source).
    expect(respire!.isAdjectivised?.value).toBe(wordGraphUuid(respiratory!));
    expect(respire!.isAdjectivisedIndicator).toBe(true);
    expect(respiratory!.isDerivedFromVerb?.value).toBe(wordGraphUuid(respire!));
    expect(respiratory!.isDerivedFromVerbIndicator).toBe(true);
    // Adjective no longer has an isVerbalised field, and Verb no longer
    // has isDerivedFromAdjective -- both removed as this same pair's own
    // DERIVED_FORM-classified reciprocal restatement.
    expect((respiratory as unknown as Record<string, unknown>).isVerbalised).toBeUndefined();
    expect((respire as unknown as Record<string, unknown>).isDerivedFromAdjective).toBeUndefined();

    // Adjective.isAdverbialised / Adverb.isDerivedFromAdjective
    // (ADVERBIAL_DERIVATION).
    expect(unbearable!.isAdverbialised?.value).toBe(wordGraphUuid(unbearably!));
    expect(unbearable!.isAdverbialisedIndicator).toBe(true);
    expect(unbearably!.isDerivedFromAdjective?.value).toBe(wordGraphUuid(unbearable!));
    expect(unbearably!.isDerivedFromAdjectiveIndicator).toBe(true);
    // Adverb no longer has an isAdjectivised field, and Adjective no
    // longer has isDerivedFromAdverb -- both removed as this same
    // pair's own ADJECTIVAL_DERIVATION-classified reciprocal restatement.
    expect((unbearably as unknown as Record<string, unknown>).isAdjectivised).toBeUndefined();
    expect((unbearable as unknown as Record<string, unknown>).isDerivedFromAdverb).toBeUndefined();

    // A Word this pass found nothing for keeps every field at its own
    // "not derived" default -- undefined pointer, false indicator --
    // real data, not just createNoun()'s/createVerb()'s own
    // construction-time default (dictionary.all() is seeded, not
    // hand-built).
    expect(dictionary.all().some((w) => isNoun(w) && !w.isDerivedFromVerbIndicator && w.isDerivedFromVerb === undefined)).toBe(true);
    expect(dictionary.all().some((w) => isVerb(w) && !w.isNominalisedIndicator && w.isNominalised === undefined)).toBe(true);

    // A Common Vocabulary Cache closed-class Word never goes through
    // deriveMorphologicalPointers() at all (it only ever runs inside
    // seedWordNet, not seedClosedClassWords) -- every field stays at
    // createNoun()'s/createVerb()'s/createAdjective()'s/createAdverb()'s
    // own plain construction-time default.
    const handCraftedNoun = createNoun({ text: "widget" });
    expect(handCraftedNoun.isDerivedFromVerb).toBeUndefined();
    expect(handCraftedNoun.isDerivedFromVerbIndicator).toBe(false);
    const handCraftedVerb = createVerb({ text: "widgetize" });
    expect(handCraftedVerb.isNominalised).toBeUndefined();
    expect(handCraftedVerb.isNominalisedIndicator).toBe(false);
    const handCraftedAdjective = createAdjective({ text: "widgety" });
    expect(handCraftedAdjective.isNominalisedIndicator).toBe(false);
    expect(handCraftedAdjective.isAdverbialisedIndicator).toBe(false);
    const handCraftedAdverb = createAdverb({ text: "widgetily" });
    expect(handCraftedAdverb.isDerivedFromAdjectiveIndicator).toBe(false);

    // WordRecord.derivations (morphologicalDerivations(), ui/dictionary_view.ts)
    // -- read through the same wordId path the detail panel itself
    // uses, not the raw Word fields checked above. hyperventilation
    // (Noun) carries exactly one entry now (isDerivedFromVerb) -- not
    // two, confirming the earlier duplicate ("Is Derived From Verb" and
    // "Is Verbalised" both showing "hyperventilate") is actually gone,
    // not just relabelled. An ordinary closed-class Adjective carries
    // none.
    const view = new DictionaryView(dictionary, semanticRelationships, { domainName: "Common", phrases: phraseBook, senses: senseStore });
    const hyperventilationRecord = view.searchWords({ wordId: wordGraphUuid(hyperventilation!) }).words[0];
    expect(hyperventilationRecord.derivations).toEqual([
      { attribute: "isDerivedFromVerb", label: "Is Derived From Verb", target: { id: wordGraphUuid(hyperventilate!), text: "hyperventilate" } },
    ]);

    const someClosedClassAdjective = createAdjective({ text: "sample-adjective" });
    dictionary.append(someClosedClassAdjective);
    const closedClassRecord = view.searchWords({ wordId: wordGraphUuid(someClosedClassAdjective) }).words[0];
    expect(closedClassRecord.derivations).toEqual([]);
  }, 60000);

  it("a polysemous lemma seeds as exactly one Word, carrying every one of its real WordNet senses by reference", async () => {
    const dictionary = new Dictionary();
    const senseStore = new Senses();
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
    const wordForms = new WordForms();
    await new WordSeeder("en").seedWordNet({
      vocabulary: { dictionary, phrases: new Phrases(), senses: senseStore, wordForms, morphologicalPointerRelationships, morphologicalPointerRelationshipProcessor, semanticRelationships, semanticRelationshipProcessor },
    });

    // "big" (ADJECTIVE) has many real WordNet senses ("above average in
    // size", "important", "generous", ...) -- one Word now, not one per
    // synset (WordForms.senseIdsOf()'s own docstring), so lookupAll("big")
    // has exactly one ADJECTIVE entry, whose own senseIds names every one
    // of those senses, each resolving to its own distinct, real Sense.
    const bigs = dictionary.lookupAll("big").filter((w) => w.partOfSpeech === PartOfSpeech.ADJECTIVE);
    expect(bigs).toHaveLength(1);
    const big = bigs[0];
    expect(wordForms.senseIdsOf(big).length).toBeGreaterThan(1);
    const bigSenses = wordForms.senseIdsOf(big).map((id) => senseStore.findByUuid(id.value)!);
    expect(bigSenses.every((sense) => sense !== undefined)).toBe(true);
    // Every sense is genuinely distinct -- no duplicate Sense uuids, and
    // no two carry the identical definition text.
    expect(new Set(bigSenses.map((sense) => senseGraphUuid(sense))).size).toBe(bigSenses.length);
    expect(new Set(bigSenses.map((sense) => sense.definition?.value)).size).toBe(bigSenses.length);
    // "big"'s own first (primary) sense is "above average in size" --
    // by far its own highest Sense.senseFrequency (real WordNet
    // dict/index.sense tag_cnt data: 107 for "big" alone, 246 summed
    // with "large" also lexicalizing that synset, versus single digits
    // for every other sense "big" carries) -- not an accident of
    // seeding order (WordSeeder.seedWordNet's own orderSensesByFrequency).
    // synsetId's own "primary sense snapshot" reading (WordForms.synsetIdOf()'s
    // own docstring) matches senseIds[0] as a result.
    expect(wordForms.synsetIdOf(big)?.value).toBe(senseStore.findByUuid(wordForms.senseIdsOf(big)[0].value)?.synsetId?.value);
  }, 60000);

  it("orders a polysemous Word's own senseIds by real usage centrality (Sense.senseFrequency), not by seeding order", async () => {
    const dictionary = new Dictionary();
    const senseStore = new Senses();
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
    const wordForms = new WordForms();
    await new WordSeeder("en").seedWordNet({
      vocabulary: { dictionary, phrases: new Phrases(), senses: senseStore, wordForms, morphologicalPointerRelationships, morphologicalPointerRelationshipProcessor, semanticRelationships, semanticRelationshipProcessor },
    });

    // "bank" (NOUN) -- verified directly against the bundled
    // dict/index.sense, not guessed: summed across every lemma sharing
    // each synset, "sloping land beside water" (09236472-n) totals 25
    // (bank alone), "depository financial institution" (08437235-n)
    // totals 20 (bank's own 20; banking_concern/banking_company/
    // depository_financial_institution each contribute 0), a distant
    // third "the funds held by a gambling house" (09236341-n) totals 2,
    // and every remaining sense totals 0 or 1. This is real corpus data,
    // not a hand-picked example that confirms the intuitive "bank is
    // usually a financial institution" expectation -- it isn't, in the
    // bundled SemCor counts specifically.
    const bank = dictionary.lookupAll("bank").find((w) => w.partOfSpeech === PartOfSpeech.NOUN)!;
    expect(bank).toBeDefined();
    expect(wordForms.senseIdsOf(bank).length).toBeGreaterThanOrEqual(4);
    const orderedSynsetIds = wordForms.senseIdsOf(bank).map((id) => senseStore.findByUuid(id.value)?.synsetId?.value);
    expect(orderedSynsetIds.slice(0, 4)).toEqual(["09236472-n", "08437235-n", "09236341-n", "08479077-n"]);

    const riverbankSense = senseStore.findBySynsetId("09236472-n")!;
    const financialSense = senseStore.findBySynsetId("08437235-n")!;
    expect(riverbankSense.senseFrequency).toBe(25);
    expect(financialSense.senseFrequency).toBe(20);

    // synsetId stays in sync with the new senseIds[0] -- both are
    // documented (WordForms.synsetIdOf()'s own docstring) as always
    // naming the same "primary sense".
    expect(wordForms.synsetIdOf(bank)?.value).toBe("09236472-n");

    // The UI-facing read side (DictionaryView.sensesFor()) agrees:
    // entry 1 is marked primary and carries the same frequency value.
    const view = new DictionaryView(dictionary, semanticRelationships, { domainName: "Common", senses: senseStore, wordForms });
    const record = view.searchWords({ wordId: wordGraphUuid(bank) }).words[0];
    expect(record.senses[0].is_primary).toBe(true);
    expect(record.senses[0].frequency).toBe(25);
    expect(record.senses[1].frequency).toBe(20);
  }, 60000);

  it("PrepositionSenseSeeder links each hand-curated PREPOSITION's own primary Sense to its real WordNet Verb/Noun sense once WordNet has loaded, and is a no-op beforehand", async () => {
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
        dictionary,
        phrases: phraseBook,
        senses: senseStore,
        wordForms,
        morphologicalPointerRelationships,
        morphologicalPointerRelationshipProcessor,
        semanticRelationships,
        semanticRelationshipProcessor,
      },
    };

    // Called before WordNet has loaded (the real app's own order --
    // vocabulary_worker.ts's own handleSeedCommonVocabulary/
    // handleSeedWordNet split) -- nothing resolves yet, so nothing is
    // created, the same "skipped, not an error" outcome
    // skipUnresolvable already gives an ordinary relationship spec.
    expect(new PrepositionSenseSeeder("en").seed(domain)).toBe(0);

    new WordSeeder("en").seedClosedClassWords(dictionary, phraseBook, { excludeOpenClasses: true }, senseStore, wordForms);
    await new WordSeeder("en").seedWordNet(domain);

    // 81 hand-curated PREPOSITION entries, 2 edges apiece (Verb sense +
    // Noun sense) -- assets/common/en/relationships/preposition_verb_noun_senses.json's
    // own 81 entries.
    const seeded = new PrepositionSenseSeeder("en").seed(domain);
    expect(seeded).toBe(81 * 2);

    const on = dictionary.lookupAll("on").find((w) => w.partOfSpeech === PartOfSpeech.PREPOSITION)!;
    const onSenseId = wordForms.senseIdsOf(on)[0].value;
    const lieSense = senseStore.findBySynsetId("02696550-v")!;
    const positionSense = senseStore.findBySynsetId("05081943-n")!;
    const outgoing = semanticRelationships.outgoing(onSenseId);
    expect(
      outgoing.some(
        (r) => r.targetSenseId.value === senseGraphUuid(lieSense) && r.relationshipType === SemanticRelationshipKind.RELATED,
      ),
    ).toBe(true);
    expect(
      outgoing.some(
        (r) => r.targetSenseId.value === senseGraphUuid(positionSense) && r.relationshipType === SemanticRelationshipKind.RELATED,
      ),
    ).toBe(true);

    // Idempotent -- a second call against the same, already-seeded
    // Domain creates nothing new.
    expect(new PrepositionSenseSeeder("en").seed(domain)).toBe(0);
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

    const morphologicalPointerRelationships = new MorphologicalPointerRelationshipStore();
    const semanticRelationships = new SemanticRelationshipStore();
    const vocabulary = {
      dictionary,
      phrases,
      morphologicalPointerRelationships,
      morphologicalPointerRelationshipProcessor: new MorphologicalPointerRelationshipProcessor(
        morphologicalPointerRelationships,
        new MorphologicalPointerRelationshipSystemPropertyTensor(),
      ),
      semanticRelationships,
      semanticRelationshipProcessor: new SemanticRelationshipProcessor(
        semanticRelationships,
        new SemanticRelationshipSystemPropertyTensor(),
      ),
    };

    const relationshipSeeder = new RelationshipSeeder("en");
    const seeded = await relationshipSeeder.seedDomain({ name: "Common", vocabulary });

    expect(seeded).toBeGreaterThan(1000);
    expect(vocabulary.morphologicalPointerRelationships.totalRelationships()).toBe(seeded);
  });

  it("{ skipUnresolvable: true } skips (rather than throws on) a spec whose Word was deliberately left unseeded by WordSeeder's own excludeOpenClasses, mirroring the Vocabulary view's 'Seed Vocabulary' toolbar action", async () => {
    const wordSeeder = new WordSeeder("en");
    const dictionary = new Dictionary();
    const phrases = new Phrases();
    wordSeeder.seedDomain({ vocabulary: { dictionary, phrases } }, { excludeOpenClasses: true });

    const morphologicalPointerRelationships = new MorphologicalPointerRelationshipStore();
    const semanticRelationships = new SemanticRelationshipStore();
    const vocabulary = {
      dictionary,
      phrases,
      morphologicalPointerRelationships,
      morphologicalPointerRelationshipProcessor: new MorphologicalPointerRelationshipProcessor(
        morphologicalPointerRelationships,
        new MorphologicalPointerRelationshipSystemPropertyTensor(),
      ),
      semanticRelationships,
      semanticRelationshipProcessor: new SemanticRelationshipProcessor(
        semanticRelationships,
        new SemanticRelationshipSystemPropertyTensor(),
      ),
    };

    const relationshipSeeder = new RelationshipSeeder("en");
    // Without skipUnresolvable this would throw -- most Common
    // Relationship Cache specs relate open-class Words that
    // excludeOpenClasses left unseeded.
    await expect(relationshipSeeder.seedDomain({ name: "Common", vocabulary })).rejects.toThrow(/cannot resolve/);

    const seeded = await relationshipSeeder.seedDomain({ name: "Common", vocabulary }, { skipUnresolvable: true });
    expect(seeded).toBeGreaterThan(0);
    expect(vocabulary.morphologicalPointerRelationships.totalRelationships()).toBe(seeded);
  });

  it("hand-curated PREPOSITION 'Hypernym Preposition' pairs (e.g. \"above\"/\"over\") seed as RELATED SemanticRelationship edges, both directions", async () => {
    const wordSeeder = new WordSeeder("en");
    const dictionary = new Dictionary();
    const phrases = new Phrases();
    const senseStore = new Senses();
    const wordForms = new WordForms();
    wordSeeder.seedDomain({ vocabulary: { dictionary, phrases, senses: senseStore, wordForms } }, { excludeOpenClasses: true });

    const morphologicalPointerRelationships = new MorphologicalPointerRelationshipStore();
    const semanticRelationships = new SemanticRelationshipStore();
    const vocabulary = {
      dictionary,
      phrases,
      senses: senseStore,
      wordForms,
      morphologicalPointerRelationships,
      morphologicalPointerRelationshipProcessor: new MorphologicalPointerRelationshipProcessor(
        morphologicalPointerRelationships,
        new MorphologicalPointerRelationshipSystemPropertyTensor(),
      ),
      semanticRelationships,
      semanticRelationshipProcessor: new SemanticRelationshipProcessor(
        semanticRelationships,
        new SemanticRelationshipSystemPropertyTensor(),
      ),
    };

    const relationshipSeeder = new RelationshipSeeder("en");
    await relationshipSeeder.seedDomain({ name: "Common", vocabulary }, { skipUnresolvable: true });

    const above = dictionary.lookupAll("above").find((w) => w.partOfSpeech === PartOfSpeech.PREPOSITION)!;
    const over = dictionary.lookupAll("over").find((w) => w.partOfSpeech === PartOfSpeech.PREPOSITION)!;
    const aboveSenseId = wordForms.senseIdsOf(above)[0].value;
    const overSenseId = wordForms.senseIdsOf(over)[0].value;

    // "above" and "over" name each other as their own "Hypernym
    // Preposition" (a genuine reciprocal pair in the source data, not a
    // strict one-way hierarchy -- assets/common/en/relationships/README.md's
    // own entry on why RELATED, not HYPERNYM/HYPONYM, is the right kind
    // here), so both directions must resolve as real edges.
    expect(
      semanticRelationships
        .outgoing(aboveSenseId)
        .some((r) => r.targetSenseId.value === overSenseId && r.relationshipType === SemanticRelationshipKind.RELATED),
    ).toBe(true);
    expect(
      semanticRelationships
        .outgoing(overSenseId)
        .some((r) => r.targetSenseId.value === aboveSenseId && r.relationshipType === SemanticRelationshipKind.RELATED),
    ).toBe(true);
  });
});

describe("DictionaryView.searchWords", () => {
  it("matches the same fields client-side matchesQuery()/filteredWords() does, on demand rather than against a pre-embedded array", () => {
    const dictionary = new Dictionary();
    const senses = new Senses();
    const wordForms = new WordForms();
    const big = createWord({ text: "big", partOfSpeech: PartOfSpeech.ADJECTIVE });
    const large = createWord({ text: "large", partOfSpeech: PartOfSpeech.ADJECTIVE });
    const cat = createNoun({ text: "cat", isRootWord: true });
    dictionary.append(big);
    dictionary.append(large);
    dictionary.append(cat);
    // definition lives on Sense now (Sense's own docstring on why), not
    // on Word -- registered here the same way registerUniqueSense()
    // does for a real hand-curated entry.
    for (const [word, definition, isRootWord] of [
      [big, "of considerable size", false],
      [large, "above average size", false],
      [cat, "a small domesticated feline", true],
    ] as const) {
      const sense = createSense({ definition: { value: definition }, isRootWord });
      senses.append(sense);
      senses.registerMember(sense, word);
      wordForms.registerSense(wordForms.registerBaseLemmaForm(word), sense);
    }

    const view = new DictionaryView(dictionary, new SemanticRelationshipStore(), { domainName: "Common", senses, wordForms });

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
    const view = new DictionaryView(dictionary, new SemanticRelationshipStore(), { domainName: "Common" });

    const found = view.searchWords({ wordId: wordGraphUuid(large) });
    expect(found.totalMatches).toBe(1);
    expect(found.words.map((w) => w.lexical_form)).toEqual(["large"]);

    // Every other filter is ignored once wordId is set -- this would
    // match nothing by pos alone (both Words here are ADJECTIVE), but
    // wordId still resolves the exact Word asked for.
    const ignoresOtherFilters = view.searchWords({ wordId: wordGraphUuid(big), pos: "NOUN" });
    expect(ignoresOtherFilters.words.map((w) => w.lexical_form)).toEqual(["big"]);

    expect(view.searchWords({ wordId: "not-a-real-id" }).totalMatches).toBe(0);
  });

  it("caps `words` at `limit` but reports the true, uncapped totalMatches", () => {
    const dictionary = new Dictionary();
    for (let i = 0; i < 10; i++) {
      dictionary.append(createWord({ text: `word${i}`, partOfSpeech: PartOfSpeech.NOUN }));
    }
    const view = new DictionaryView(dictionary, new SemanticRelationshipStore(), { domainName: "Common" });

    const result = view.searchWords({ word: "word", limit: 3 });
    expect(result.words).toHaveLength(3);
    expect(result.totalMatches).toBe(10);
  });

  it("a WordRecord's own word_forms carries every real WordForm this Word carries, labelled and in registration order, and stays empty when nothing is seeded", () => {
    const dictionary = new Dictionary();
    const wordForms = new WordForms();
    const dog = createNoun({ text: "dog" });
    const cat = createNoun({ text: "cat" });
    dictionary.append(dog);
    dictionary.append(cat);
    wordForms.registerNamedForm(dog, WordFormField.BASE_LEMMA_CANONICAL_FORM, { value: "dog" });
    wordForms.registerNamedForm(dog, WordFormField.PLURAL_NUMBER_FORM, { value: "dogs", formats: ["/s$/i"] });
    wordForms.registerNamedForm(dog, WordFormField.POSSESSIVE_CASE_FORM, { value: "dog's", formats: ["/'s$/i"] });
    const view = new DictionaryView(dictionary, new SemanticRelationshipStore(), { domainName: "Common", wordForms });

    const dogRecord = view.searchWords({ wordId: wordGraphUuid(dog) }).words[0];
    expect(dogRecord.word_forms).toEqual([
      { field: WordFormField.BASE_LEMMA_CANONICAL_FORM, label: "Base Lemma Canonical Form", value: "dog", senses: [] },
      { field: WordFormField.PLURAL_NUMBER_FORM, label: "Plural Number Form", value: "dogs", senses: [] },
      { field: WordFormField.POSSESSIVE_CASE_FORM, label: "Possessive Case Form", value: "dog's", senses: [] },
    ]);

    const catRecord = view.searchWords({ wordId: wordGraphUuid(cat) }).words[0];
    expect(catRecord.word_forms).toEqual([]);
  });

  it("resolves against the real bundled WordNet-scale dataset without embedding it (regression check for the RangeError MAX_INTERACTIVE_WORDS exists to avoid)", async () => {
    const dictionary = new Dictionary();
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
    const wordForms = new WordForms();
    await new WordSeeder("en").seedWordNet({ vocabulary: { dictionary, phrases: new Phrases(), senses: new Senses(), wordForms, morphologicalPointerRelationships, morphologicalPointerRelationshipProcessor, semanticRelationships, semanticRelationshipProcessor } });

    const view = new DictionaryView(dictionary, semanticRelationships, { domainName: "Common", wordForms });
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
    const wordForms = new WordForms();
    await new WordSeeder("en").seedWordNet({
      vocabulary: { dictionary, phrases: new Phrases(), senses: senseStore, wordForms, morphologicalPointerRelationships, morphologicalPointerRelationshipProcessor, semanticRelationships, semanticRelationshipProcessor },
    });

    // "winger" (offset 10802147) carries FOUR topic-domain pointers,
    // now stored on its own Sense, not on the Word (word_seeder.ts's own
    // tagTopicDomain docstring) -- DictionaryView.senseFieldsFor() must
    // resolve them through senseId, not word.domainTag directly (always
    // undefined for a WordNet-seeded Word after this migration).
    const winger = dictionary.lookupAll("winger").find((w) => wordForms.synsetIdOf(w)?.value === "10802147-n");
    expect(winger).toBeDefined();
    expect(winger?.domainTag).toBeUndefined();

    const view = new DictionaryView(dictionary, semanticRelationships, { domainName: "Common", senses: senseStore, wordForms });
    const record = view.searchWords({ wordId: wordGraphUuid(winger!) }).words[0];
    expect(record.domain).not.toBeNull();
    expect(["soccer", "field hockey", "rugby", "football"]).toContain(record.domain);
    expect(new Set([record.domain, ...record.related_domains])).toEqual(new Set(["soccer", "field hockey", "rugby", "football"]));
  }, 30000);

  it("a WordRecord's own is_root_word and rootWordsOnly filter read through the shared Sense, falling back to isRootWord directly when the Senses has no matching Sense at all; definition (Sense-only now, Sense's own docstring on the accepted gap) simply goes blank in that same case, the same as PAD already does", () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    const senseStore = new Senses();
    const wordForms = new WordForms();
    new WordSeeder("en").seedDomain({ vocabulary: { dictionary, phrases: phraseBook, senses: senseStore, wordForms } }, { excludeOpenClasses: true });

    const entity = dictionary.lookupAll("entity").find((w) => w.partOfSpeech === PartOfSpeech.NOUN);
    expect(entity).toBeDefined();
    const entityDefinition = senseStore.findByUuid(wordForms.senseIdsOf(entity!)[0].value)?.definition?.value;
    expect(entityDefinition).toBeTruthy();

    // With the matching Senses: is_root_word comes back true (read
    // through the Sense, isRootWordFor()'s own docstring), the
    // rootWordsOnly filter finds it, and definition resolves through
    // the same Sense.
    const withSenses = new DictionaryView(dictionary, new SemanticRelationshipStore(), {
      domainName: "Common",
      phrases: phraseBook,
      senses: senseStore,
      wordForms,
    });
    const recordWithSenses = withSenses.searchWords({ wordId: wordGraphUuid(entity!) }).words[0];
    expect(recordWithSenses.is_root_word).toBe(true);
    expect(recordWithSenses.definition).toBe(entityDefinition);
    expect(withSenses.searchWords({ rootWordsOnly: true }).words.map((w) => w.lexical_form)).toContain("entity");

    // Without a matching Senses at all (a fresh, empty one -- the same
    // shape a cross-Domain copy's own Senses has today) -- is_root_word
    // still resolves correctly, falling back to Noun.isRootWord directly
    // (never stripped for hand-curated data), but definition now goes
    // blank rather than surviving: Word carries no `definition` of its
    // own any more for a fallback to read (Sense's own docstring on why
    // this is an accepted gap, the identical one PAD already has).
    const withoutSenses = new DictionaryView(dictionary, new SemanticRelationshipStore(), {
      domainName: "Common",
      phrases: phraseBook,
      senses: new Senses(),
      wordForms,
    });
    const recordWithoutSenses = withoutSenses.searchWords({ wordId: wordGraphUuid(entity!) }).words[0];
    expect(recordWithoutSenses.is_root_word).toBe(true);
    expect(recordWithoutSenses.definition).toBe("");
    expect(withoutSenses.searchWords({ rootWordsOnly: true }).words.map((w) => w.lexical_form)).toContain("entity");
  });

  it("sense_id is null for a Word that didn't come from WordSeeder.seedWordNet", () => {
    const dictionary = new Dictionary();
    dictionary.append(createWord({ text: "big", partOfSpeech: PartOfSpeech.ADJECTIVE }));
    const view = new DictionaryView(dictionary, new SemanticRelationshipStore(), { domainName: "Common" });

    expect(view.searchWords({ word: "big" }).words[0].sense_id).toBeNull();
  });

  it("a WordRecord's own senses lists every Sense a polysemous Word lexicalizes, marking exactly one primary", () => {
    const dictionary = new Dictionary();
    const senseStore = new Senses();
    const wordForms = new WordForms();
    const big = createAdjective({ text: "big" });
    const large = createAdjective({ text: "large" });
    const enceinte = createAdjective({ text: "enceinte" });
    dictionary.append(big);
    dictionary.append(large);
    dictionary.append(enceinte);

    const sizeSense = createSense({ definition: { value: "above average in size" }, isCommon: true });
    const pregnantSense = createSense({ definition: { value: "in an advanced stage of pregnancy" }, isCommon: true });
    senseStore.append(sizeSense);
    senseStore.append(pregnantSense);
    senseStore.registerMember(sizeSense, big);
    senseStore.registerMember(sizeSense, large);
    senseStore.registerMember(pregnantSense, big);
    senseStore.registerMember(pregnantSense, enceinte);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(big), sizeSense);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(big), pregnantSense);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(large), sizeSense);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(enceinte), pregnantSense);

    const view = new DictionaryView(dictionary, new SemanticRelationshipStore(), { domainName: "Common", senses: senseStore, wordForms });
    const record = view.searchWords({ wordId: wordGraphUuid(big) }).words[0];

    expect(record.senses).toHaveLength(2);
    expect(record.senses[0]).toMatchObject({ is_primary: true, definition: "above average in size" });
    expect(record.senses[0].synonyms).toEqual([{ id: wordGraphUuid(large), text: "large" }]);
    expect(record.senses[1]).toMatchObject({ is_primary: false, definition: "in an advanced stage of pregnancy" });
    expect(record.senses[1].synonyms).toEqual([{ id: wordGraphUuid(enceinte), text: "enceinte" }]);

    // A monosemous Word still gets exactly one entry, still marked primary.
    const largeRecord = view.searchWords({ wordId: wordGraphUuid(large) }).words[0];
    expect(largeRecord.senses).toEqual([expect.objectContaining({ is_primary: true, definition: "above average in size" })]);
  });

  it("a WordRecord's own senses expose each Sense's own Pertainym target(s) via a genuine SemanticRelationship, sense-scoped in searchRelationships({ wordId }) -- distinct per sense, not folded into one Word-level list", () => {
    const dictionary = new Dictionary();
    const senseStore = new Senses();
    const wordForms = new WordForms();
    const aural = createAdjective({ text: "aural" });
    const aura = createNoun({ text: "aura" });
    const ear = createNoun({ text: "ear" });
    dictionary.append(aural);
    dictionary.append(aura);
    dictionary.append(ear);

    // "aural" the real WordNet lemma: sense 1 pertains to "aura", the
    // unrelated sense 2 pertains to "ear" (SemanticRelationshipKind's
    // own docstring on why this is per-sense, verified against this
    // exact word).
    const auraSense = createSense({ definition: { value: "relating to or characterized by an aura" }, isCommon: true });
    const hearingSense = createSense({ definition: { value: "of or pertaining to hearing or the ear" }, isCommon: true });
    const auraNounSense = createSense({ definition: { value: "a distinctive but intangible quality" }, isCommon: true });
    const earNounSense = createSense({ definition: { value: "the sense organ for hearing" }, isCommon: true });
    senseStore.append(auraSense);
    senseStore.append(hearingSense);
    senseStore.append(auraNounSense);
    senseStore.append(earNounSense);
    senseStore.registerMember(auraSense, aural);
    senseStore.registerMember(hearingSense, aural);
    senseStore.registerMember(auraNounSense, aura);
    senseStore.registerMember(earNounSense, ear);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(aural), auraSense);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(aural), hearingSense);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(aura), auraNounSense);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(ear), earNounSense);

    const semanticStore = new SemanticRelationshipStore();
    const semanticProcessor = new SemanticRelationshipProcessor(semanticStore, new SemanticRelationshipSystemPropertyTensor());
    semanticProcessor.create({ sourceSenseId: senseGraphUuid(auraSense), targetSenseId: senseGraphUuid(auraNounSense), relationshipType: SemanticRelationshipKind.PERTAINYM, sourceReferences: [] });
    semanticProcessor.create({ sourceSenseId: senseGraphUuid(hearingSense), targetSenseId: senseGraphUuid(earNounSense), relationshipType: SemanticRelationshipKind.PERTAINYM, sourceReferences: [] });

    const view = new DictionaryView(dictionary, semanticStore, { domainName: "Common", senses: senseStore, wordForms });
    const record = view.searchWords({ wordId: wordGraphUuid(aural) }).words[0];
    const rels = view.searchRelationships({ wordId: wordGraphUuid(aural) }).relationships;

    expect(record.senses).toHaveLength(2);
    expect(rels.filter((r) => r.via_sense_id === record.senses[0].id).map((r) => r.target_text)).toEqual(["aura"]);
    expect(rels.filter((r) => r.via_sense_id === record.senses[1].id).map((r) => r.target_text)).toEqual(["ear"]);

    // A Sense with no Pertainym fact at all gets no rows, not an error.
    const wooden = createAdjective({ text: "wooden" });
    dictionary.append(wooden);
    const woodenSense = createSense({ definition: { value: "made of wood" }, isCommon: true });
    senseStore.append(woodenSense);
    senseStore.registerMember(woodenSense, wooden);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(wooden), woodenSense);
    const woodenRecord = view.searchWords({ wordId: wordGraphUuid(wooden) }).words[0];
    const woodenRels = view.searchRelationships({ wordId: wordGraphUuid(wooden) }).relationships;
    expect(woodenRels.filter((r) => r.via_sense_id === woodenRecord.senses[0].id)).toEqual([]);
  });

  it("a Phrase's own detail record gets senses too, resolved via phraseAsWord() the same way relationships already are", () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
    const senseStore = new Senses();
    const toyPoodle = createPhrase({ text: "toy poodle", partOfSpeech: PartOfSpeech.NOUN });
    phraseBook.append(toyPoodle);
    const sense = createSense({ definition: { value: "a small breed of poodle" }, isCommon: true });
    senseStore.append(sense);
    senseStore.registerMember(sense, toyPoodle);

    const view = new DictionaryView(dictionary, new SemanticRelationshipStore(), { domainName: "Common", phrases: phraseBook, senses: senseStore });
    const record = view.searchWords({ wordId: toyPoodle.uuid.value }).words[0];
    expect(record.senses).toEqual([expect.objectContaining({ is_primary: true, definition: "a small breed of poodle" })]);
  });
});

describe("DictionaryView.searchPhrases", () => {
  it("resolves against the real bundled WordNet-scale Phrases without embedding it (regression check mirroring searchWords' own)", async () => {
    const dictionary = new Dictionary();
    const phraseBook = new Phrases();
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
    await new WordSeeder("en").seedWordNet({
      vocabulary: { dictionary, phrases: phraseBook, senses: new Senses(), morphologicalPointerRelationships, morphologicalPointerRelationshipProcessor, semanticRelationships, semanticRelationshipProcessor },
    });
    expect(phraseBook.totalEntries()).toBeGreaterThan(20000);

    const view = new DictionaryView(dictionary, semanticRelationships, { domainName: "Common", phrases: phraseBook });
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
    const view = new DictionaryView(dictionary, new SemanticRelationshipStore(), { domainName: "Common", phrases: phraseBook });

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
    const wordForms = new WordForms();
    await new WordSeeder("en").seedWordNet({
      vocabulary: { dictionary, phrases: phraseBook, senses: senseStore, wordForms, morphologicalPointerRelationships, morphologicalPointerRelationshipProcessor, semanticRelationships, semanticRelationshipProcessor },
    });
    expect(senseStore.totalEntries()).toBeGreaterThan(100000);

    const view = new DictionaryView(dictionary, semanticRelationships, { domainName: "Common", phrases: phraseBook, senses: senseStore, wordForms });
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
    const view = new DictionaryView(dictionary, new SemanticRelationshipStore(), { domainName: "Common", senses: senseStore });

    const html = view.render();
    expect(html).toContain("const OVER_CAPACITY_SENSES = true;");
    expect(html).toContain("const SENSES = [];");
    expect(html).toContain(">20001<");
  });
});

describe("DictionaryView.searchRelationships", () => {
  // Every relationship SemanticRelationshipStore holds connects two
  // Senses, never two Words directly (SemanticRelationship's own
  // docstring) -- so this fixture, unlike its MorphologicalPointerRelationshipStore-era
  // version, needs a real Sense registered per Word before it can wire
  // any relationship at all. SYNONYM between "big" and "large" is a
  // real, explicit SemanticRelationship edge here (the shape hand-curated
  // data genuinely uses, RelationshipSeeder's own semantic_relationships.json --
  // unlike a WordNet-seeded pair, which never gets a SYNONYM edge at
  // all, sharing one Sense already being the fact itself).
  function buildFixture() {
    const dictionary = new Dictionary();
    const senses = new Senses();
    const wordForms = new WordForms();
    const big = createWord({ text: "big", partOfSpeech: PartOfSpeech.ADJECTIVE });
    const large = createWord({ text: "large", partOfSpeech: PartOfSpeech.ADJECTIVE });
    const small = createWord({ text: "small", partOfSpeech: PartOfSpeech.ADJECTIVE });
    dictionary.append(big);
    dictionary.append(large);
    dictionary.append(small);

    const bigSense = createSense({ definition: { value: "of considerable size" } });
    const largeSense = createSense({ definition: { value: "above average size" } });
    const smallSense = createSense({ definition: { value: "below average size" } });
    senses.append(bigSense);
    senses.append(largeSense);
    senses.append(smallSense);
    senses.registerMember(bigSense, big);
    senses.registerMember(largeSense, large);
    senses.registerMember(smallSense, small);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(big), bigSense);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(large), largeSense);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(small), smallSense);

    const store = new SemanticRelationshipStore();
    const processor = new SemanticRelationshipProcessor(store, new SemanticRelationshipSystemPropertyTensor());
    processor.create({ sourceSenseId: senseGraphUuid(bigSense), targetSenseId: senseGraphUuid(largeSense), relationshipType: SemanticRelationshipKind.SYNONYM, sourceReferences: [] });
    processor.create({ sourceSenseId: senseGraphUuid(bigSense), targetSenseId: senseGraphUuid(smallSense), relationshipType: SemanticRelationshipKind.ANTONYM, sourceReferences: [] });

    const view = new DictionaryView(dictionary, store, { domainName: "Common", senses, wordForms });
    return { view, big, large, small };
  }

  it("resolves every relationship touching `wordId`, both outgoing and incoming", () => {
    const { view, big, large, small } = buildFixture();

    const forBig = view.searchRelationships({ wordId: wordGraphUuid(big) });
    expect(forBig.totalMatches).toBe(2);
    expect(forBig.relationships.map((r) => r.kind).sort()).toEqual(["ANTONYM", "SYNONYM"]);

    const forLarge = view.searchRelationships({ wordId: wordGraphUuid(large) });
    expect(forLarge.totalMatches).toBe(1);
    expect(forLarge.relationships[0].kind).toBe("SYNONYM");
    expect(forLarge.relationships[0].source_text).toBe("big");
    expect(forLarge.relationships[0].target_text).toBe("large");

    expect(view.searchRelationships({ wordId: wordGraphUuid(small) }).totalMatches).toBe(1);
  });

  it("via_sense_id names which of a polysemous Word's own several Senses a Sense-expanded relationship came from -- distinct per sense, not one shared value", () => {
    const dictionary = new Dictionary();
    const senseStore = new Senses();
    const wordForms = new WordForms();
    const big = createAdjective({ text: "big" });
    const large = createAdjective({ text: "large" });
    const small = createAdjective({ text: "small" });
    const petite = createAdjective({ text: "petite" });
    [big, large, small, petite].forEach((w) => dictionary.append(w));

    const sizeSense = createSense({ definition: { value: "above average in size" }, isCommon: true });
    const pregnantSense = createSense({ definition: { value: "in an advanced stage of pregnancy" }, isCommon: true });
    const smallSense = createSense({ definition: { value: "below average in size" }, isCommon: true });
    const petiteSense = createSense({ definition: { value: "delicately small" }, isCommon: true });
    senseStore.append(sizeSense);
    senseStore.append(pregnantSense);
    senseStore.append(smallSense);
    senseStore.append(petiteSense);
    senseStore.registerMember(sizeSense, big);
    senseStore.registerMember(sizeSense, large);
    senseStore.registerMember(pregnantSense, big);
    senseStore.registerMember(smallSense, small);
    senseStore.registerMember(petiteSense, petite);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(big), sizeSense);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(big), pregnantSense);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(large), sizeSense);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(small), smallSense);
    wordForms.registerSense(wordForms.registerBaseLemmaForm(petite), petiteSense);

    const store = new SemanticRelationshipStore();
    const processor = new SemanticRelationshipProcessor(store, new SemanticRelationshipSystemPropertyTensor());
    // Two facts, from two different Senses of the same polysemous "big" --
    // each one's own row must be tagged with the Sense that actually
    // produced it, not conflated into one.
    processor.create({ sourceSenseId: senseGraphUuid(sizeSense), targetSenseId: senseGraphUuid(smallSense), relationshipType: SemanticRelationshipKind.ANTONYM, sourceReferences: [] });
    processor.create({ sourceSenseId: senseGraphUuid(pregnantSense), targetSenseId: senseGraphUuid(petiteSense), relationshipType: SemanticRelationshipKind.SIMILAR_TO, sourceReferences: [] });

    const view = new DictionaryView(dictionary, store, { domainName: "Common", senses: senseStore, wordForms });
    const result = view.searchRelationships({ wordId: wordGraphUuid(big) });

    const antonymRow = result.relationships.find((r) => r.kind === "ANTONYM");
    expect(antonymRow?.via_sense_id).toBe(senseGraphUuid(sizeSense));
    const similarRow = result.relationships.find((r) => r.kind === "SIMILAR_TO");
    expect(similarRow?.via_sense_id).toBe(senseGraphUuid(pregnantSense));
    expect(antonymRow?.via_sense_id).not.toBe(similarRow?.via_sense_id);
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
    const senses = new Senses();
    const words = Array.from({ length: 10 }, (_, i) => createWord({ text: `word${i}`, partOfSpeech: PartOfSpeech.NOUN }));
    const wordSenses = words.map((w, i) => {
      dictionary.append(w);
      const sense = createSense({ definition: { value: `sense ${i}` } });
      senses.append(sense);
      senses.registerMember(sense, w);
      return sense;
    });

    const store = new SemanticRelationshipStore();
    const processor = new SemanticRelationshipProcessor(store, new SemanticRelationshipSystemPropertyTensor());
    for (let i = 0; i < words.length - 1; i++) {
      processor.create({ sourceSenseId: senseGraphUuid(wordSenses[i]), targetSenseId: senseGraphUuid(wordSenses[i + 1]), relationshipType: SemanticRelationshipKind.SYNONYM, sourceReferences: [] });
    }

    const view = new DictionaryView(dictionary, store, { domainName: "Common", senses });
    const result = view.searchRelationships({ limit: 3 });
    expect(result.relationships).toHaveLength(3);
    expect(result.totalMatches).toBe(9);
  });

  it("resolves against the real bundled WordNet-scale relationship graph without embedding it (regression check mirroring searchWords' own)", async () => {
    const dictionary = new Dictionary();
    const senseStore = new Senses();
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
    const wordForms = new WordForms();
    await new WordSeeder("en").seedWordNet({ vocabulary: { dictionary, phrases: new Phrases(), senses: senseStore, wordForms, morphologicalPointerRelationships, morphologicalPointerRelationshipProcessor, semanticRelationships, semanticRelationshipProcessor } });

    const view = new DictionaryView(dictionary, semanticRelationships, { domainName: "Common", senses: senseStore, wordForms });
    const large = dictionary.lookup("large");
    expect(large).toBeDefined();

    const result = view.searchRelationships({ wordId: wordGraphUuid(large!), limit: 25 });
    expect(result.totalMatches).toBeGreaterThan(0);
    expect(result.relationships.length).toBeLessThanOrEqual(25);
    expect(result.relationships.every((r) => r.source_id === wordGraphUuid(large!) || r.target_id === wordGraphUuid(large!))).toBe(true);
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
  // resolveHierarchy() builds its graph off SemanticRelationshipStore now,
  // Sense-to-Sense exclusively (DictionaryView's own class docstring) --
  // every node id/root/edge endpoint this whole describe block asserts
  // on is therefore a Sense uuid (`senses[text].uuid.value`), not a Word
  // uuid, even though `wordId` (an input, resolved via resolveEntry()'s
  // own fallback) still takes a Word uuid exactly as before.
  function buildTreeFixture() {
    const dictionary = new Dictionary();
    const senseStore = new Senses();
    const wordForms = new WordForms();
    const words = {} as Record<string, ReturnType<typeof createWord>>;
    const senses = {} as Record<string, ReturnType<typeof createSense>>;
    for (const text of ["vehicle", "car", "sedan", "truck", "boat", "fruit", "apple"]) {
      words[text] = createWord({ text, partOfSpeech: PartOfSpeech.NOUN });
      dictionary.append(words[text]);
      senses[text] = createSense({ definition: { value: text } });
      senseStore.append(senses[text]);
      senseStore.registerMember(senses[text], words[text]);
      wordForms.registerSense(wordForms.registerBaseLemmaForm(words[text]), senses[text]);
    }
    const store = new SemanticRelationshipStore();
    const processor = new SemanticRelationshipProcessor(store, new SemanticRelationshipSystemPropertyTensor());
    const hypernym = (child: string, parent: string) =>
      processor.create({ sourceSenseId: senseGraphUuid(senses[child]), targetSenseId: senseGraphUuid(senses[parent]), relationshipType: SemanticRelationshipKind.HYPERNYM, sourceReferences: [] });
    hypernym("car", "vehicle");
    hypernym("sedan", "car");
    hypernym("truck", "vehicle");
    hypernym("boat", "vehicle");
    hypernym("apple", "fruit");

    const view = new DictionaryView(dictionary, store, { domainName: "Common", senses: senseStore, wordForms });
    return { view, words, senses };
  }

  it("with no wordId, centres on the broadest root -- the root with the most total reachable descendants", () => {
    const { view, senses } = buildTreeFixture();
    const result = view.resolveHierarchy({ kind: "HYPERNYM" });
    expect(result.fellBack).toBe(false);
    expect(result.roots).toEqual([senseGraphUuid(senses.vehicle)]);
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
    const senseStore = new Senses();
    const words = {} as Record<string, ReturnType<typeof createWord>>;
    const senses = {} as Record<string, ReturnType<typeof createSense>>;
    const names = ["wide_shallow", "w1", "w2", "w3", "w4", "deep_narrow", "d1", ...Array.from({ length: 10 }, (_, i) => `d1${String.fromCharCode(97 + i)}`)];
    for (const text of names) {
      words[text] = createWord({ text, partOfSpeech: PartOfSpeech.NOUN });
      dictionary.append(words[text]);
      senses[text] = createSense({ definition: { value: text } });
      senseStore.append(senses[text]);
      senseStore.registerMember(senses[text], words[text]);
    }
    const store = new SemanticRelationshipStore();
    const processor = new SemanticRelationshipProcessor(store, new SemanticRelationshipSystemPropertyTensor());
    const hypernym = (child: string, parent: string) =>
      processor.create({ sourceSenseId: senseGraphUuid(senses[child]), targetSenseId: senseGraphUuid(senses[parent]), relationshipType: SemanticRelationshipKind.HYPERNYM, sourceReferences: [] });
    for (const child of ["w1", "w2", "w3", "w4"]) hypernym(child, "wide_shallow");
    hypernym("d1", "deep_narrow");
    for (let i = 0; i < 10; i++) hypernym(`d1${String.fromCharCode(97 + i)}`, "d1");

    const view = new DictionaryView(dictionary, store, { domainName: "Common", senses: senseStore });
    const result = view.resolveHierarchy({ kind: "HYPERNYM" });
    // wide_shallow has 4 direct children (more than deep_narrow's 1),
    // but only 5 total descendants; deep_narrow has 12. The broadest
    // root must be deep_narrow.
    expect(result.roots).toEqual([senseGraphUuid(senses.deep_narrow)]);
  });

  it("with a wordId, builds the ancestor chain up to the root plus that word's own descendants", () => {
    const { view, words, senses } = buildTreeFixture();
    const result = view.resolveHierarchy({ kind: "HYPERNYM", wordId: wordGraphUuid(words.sedan) });
    expect(result.roots).toEqual([senseGraphUuid(senses.vehicle)]);
    const edgePairs = result.edges.map((e) => [e.parentId, e.childId]);
    expect(edgePairs).toContainEqual([senseGraphUuid(senses.vehicle), senseGraphUuid(senses.car)]);
    expect(edgePairs).toContainEqual([senseGraphUuid(senses.car), senseGraphUuid(senses.sedan)]);
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
    const senseStore = new Senses();
    const big = createWord({ text: "big", partOfSpeech: PartOfSpeech.ADJECTIVE });
    const small = createWord({ text: "small", partOfSpeech: PartOfSpeech.ADJECTIVE });
    dictionary.append(big);
    dictionary.append(small);
    const bigSense = createSense({ definition: { value: "big" } });
    const smallSense = createSense({ definition: { value: "small" } });
    senseStore.append(bigSense);
    senseStore.append(smallSense);
    senseStore.registerMember(bigSense, big);
    senseStore.registerMember(smallSense, small);
    const store = new SemanticRelationshipStore();
    const processor = new SemanticRelationshipProcessor(store, new SemanticRelationshipSystemPropertyTensor());
    processor.create({ sourceSenseId: senseGraphUuid(bigSense), targetSenseId: senseGraphUuid(smallSense), relationshipType: SemanticRelationshipKind.ANTONYM, sourceReferences: [] });
    processor.create({ sourceSenseId: senseGraphUuid(smallSense), targetSenseId: senseGraphUuid(bigSense), relationshipType: SemanticRelationshipKind.ANTONYM, sourceReferences: [] });

    const view = new DictionaryView(dictionary, store, { domainName: "Common", senses: senseStore });
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
    const senseStore = new Senses();
    const big = createWord({ text: "big", partOfSpeech: PartOfSpeech.ADJECTIVE });
    const small = createWord({ text: "small", partOfSpeech: PartOfSpeech.ADJECTIVE });
    dictionary.append(big);
    dictionary.append(small);
    const bigSense = createSense({ definition: { value: "big" } });
    const smallSense = createSense({ definition: { value: "small" } });
    senseStore.append(bigSense);
    senseStore.append(smallSense);
    senseStore.registerMember(bigSense, big);
    senseStore.registerMember(smallSense, small);
    const store = new SemanticRelationshipStore();
    const processor = new SemanticRelationshipProcessor(store, new SemanticRelationshipSystemPropertyTensor());
    processor.create({ sourceSenseId: senseGraphUuid(bigSense), targetSenseId: senseGraphUuid(smallSense), relationshipType: SemanticRelationshipKind.ANTONYM, sourceReferences: [] });

    const view = new DictionaryView(dictionary, store, { domainName: "Common", senses: senseStore });
    const result = view.resolveHierarchy({ kind: "ANTONYM" });
    expect(result.fellBack).toBe(true);
    expect(result.totalEdgeCount).toBe(1);

    // Same for SYNONYM, seeded the real way (allPairs(), one direction).
    const dictionary2 = new Dictionary();
    const senseStore2 = new Senses();
    const cat = createWord({ text: "cat", partOfSpeech: PartOfSpeech.NOUN });
    const feline = createWord({ text: "feline", partOfSpeech: PartOfSpeech.NOUN });
    dictionary2.append(cat);
    dictionary2.append(feline);
    const catSense = createSense({ definition: { value: "cat" } });
    const felineSense = createSense({ definition: { value: "feline" } });
    senseStore2.append(catSense);
    senseStore2.append(felineSense);
    senseStore2.registerMember(catSense, cat);
    senseStore2.registerMember(felineSense, feline);
    const store2 = new SemanticRelationshipStore();
    const processor2 = new SemanticRelationshipProcessor(store2, new SemanticRelationshipSystemPropertyTensor());
    processor2.create({ sourceSenseId: senseGraphUuid(catSense), targetSenseId: senseGraphUuid(felineSense), relationshipType: SemanticRelationshipKind.SYNONYM, sourceReferences: [] });

    const view2 = new DictionaryView(dictionary2, store2, { domainName: "Common", senses: senseStore2 });
    const result2 = view2.resolveHierarchy({ kind: "SYNONYM" });
    expect(result2.fellBack).toBe(true);
  });

  it("resolves against the real bundled WordNet-scale dataset, correctly oriented (broad root, narrow leaves) for a kind only stored in the child->parent direction", async () => {
    const dictionary = new Dictionary();
    const senseStore = new Senses();
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
    const wordForms = new WordForms();
    await new WordSeeder("en").seedWordNet({ vocabulary: { dictionary, phrases: new Phrases(), senses: senseStore, wordForms, morphologicalPointerRelationships, morphologicalPointerRelationshipProcessor, semanticRelationships, semanticRelationshipProcessor } });

    const view = new DictionaryView(dictionary, semanticRelationships, { domainName: "Common", senses: senseStore, wordForms });
    const poodle = dictionary.lookupAll("poodle").find((w) => w.partOfSpeech === PartOfSpeech.NOUN);
    expect(poodle).toBeDefined();

    const result = view.resolveHierarchy({ kind: "HYPERNYM", wordId: wordGraphUuid(poodle!), limit: 200 });
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
    // through synonyms() (role/word_processor.ts) and Senses.membersOf() directly,
    // not through this edge-graph-only method.
    const synonymHierarchy = view.resolveHierarchy({ kind: "SYNONYM" });
    expect(synonymHierarchy.fellBack).toBe(false);
    expect(synonymHierarchy.totalEdgeCount).toBe(0);
  }, 30000);
});
