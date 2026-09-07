import type { Dictionary } from "../data/dictionary";
import type { Senses } from "../data/senses";
import type { WordForms } from "../data/word_forms";
import { createSense, graphUuid as senseGraphUuid } from "./sense_processor";
import { createAdverb, isAdverb } from "./processor/adverb_processor";
import { createAuxiliary, isAuxiliary } from "./processor/auxiliary_processor";
import { isPronoun } from "./processor/pronoun_processor";
import { graphUuid as wordGraphUuid } from "./word_processor";
import { graphUuid as formGraphUuid } from "./word_form_processor";
import { LanguageStyleCode, LanguageStyleCodelist } from "../../value_objects";
import type { Identifier } from "../../value_objects";
import type { Word } from "../data/entities/word";
import type { WordForm } from "../data/entities/word_form";

const NEUTRAL = new LanguageStyleCode(LanguageStyleCodelist.NEUTRAL);

interface SingleWordSeed {
  lemma: string;
  definition: string;
}

// "not" and its enclitic spelling "n't" -- both ADVERB, matching how
// this codebase already classes every other sentential-negation/degree
// closed-class ADVERB. Genuinely necessary before ContractionSeeder's own
// 7 lemmas below can point `contractionOf` at anything honest:
// PartOfSpeech.PARTICLE's retirement (assets/common/en/README.md's own
// particles.json row) left "not" resolving only to an unrelated WordNet
// VERB homograph and "n't" with no Dictionary entry at all -- neither is
// a negator today without this. "n't" is itself modelled as a one-
// component contraction of "not" (`contractionOf: [not]`) -- not a
// separate lexeme, recreating exactly the historical `not -> n't
// CONTRACTION` relationship that same README row documents as having
// existed before the retirement, and doubling as WordForm.contractionOf's
// own one-component example (the field is many-to-many, not always a
// pair -- data/entities/word_form.ts's own docstring).
const NEGATOR_WORDS: readonly SingleWordSeed[] = [
  {
    lemma: "not",
    definition: "Used to express negation, refusal, or denial of what follows. Example: 'She is not here.'",
  },
  {
    lemma: "n't",
    definition:
      "The enclitic, orthographically bound spelling of 'not', attached directly to a preceding auxiliary or modal verb with no space of its own. Example: 'It isn't ready.'",
  },
];

// The 7 full contractions AuxiliarySeeder's own AUXILIARY_LEMMAS comment
// names as still missing a lemma-model equivalent (role/auxiliary_seeder.ts):
// "auxiliaries.json's own remaining 7 entries -- the full contractions
// (don't, can't, I'm, it's, isn't, wasn't, hadn't)". Each is its own
// invariant, single-spelling AUXILIARY lemma (the same shape must/ought/
// need/dare already have -- no further inflection of its own), so unlike
// AUXILIARY_LEMMAS' own multi-form entries, each gets exactly one
// base-lemma WordForm here, never a field-specific one.
const CONTRACTION_WORDS: readonly SingleWordSeed[] = [
  {
    lemma: "don't",
    definition:
      "Contraction of 'do' and 'not' -- the negated do-support auxiliary, used for negative statements, questions, and imperatives with a main verb that has no auxiliary of its own. Example: 'I don't agree.'",
  },
  {
    lemma: "can't",
    definition: "Contraction of 'can' and 'not' -- expresses the negation of present ability, possibility, or permission. Example: 'She can't swim.'",
  },
  {
    lemma: "isn't",
    definition: "Contraction of 'is' and 'not' -- the negated third-person-singular present form of 'be'. Example: 'The door isn't locked.'",
  },
  {
    lemma: "wasn't",
    definition: "Contraction of 'was' and 'not' -- the negated first/third-person-singular past form of 'be'. Example: 'He wasn't there.'",
  },
  {
    lemma: "hadn't",
    definition: "Contraction of 'had' and 'not' -- the negated past tense form of the perfect-aspect auxiliary 'have'. Example: 'They hadn't finished.'",
  },
  {
    lemma: "I'm",
    definition: "Contraction of 'I' and 'am' -- the first-person-singular present form of 'be', with the pronoun 'I' as its own subject. Example: 'I'm ready.'",
  },
  {
    lemma: "it's",
    definition:
      "Contraction of 'it' and 'is' -- the third-person-singular present form of 'be', with the pronoun 'it' as its own subject. Not to be confused with the possessive determiner 'its' (no apostrophe). Example: 'It's raining.'",
  },
];

/** Seeds "not"/"n't" (Step 0) and the 7 full-contraction AUXILIARY lemmas
 * AuxiliarySeeder's own AUXILIARY_LEMMAS comment names as still missing
 * (Step 1), then wires every one's own `contractionOf` -- the grammar
 * analysis behind this shape (rather than pointing at a `Phrase`) lives in
 * `documentation/architecture/data_entity_design_decisions_log.md`'s own
 * "WordForm.contractionOf's target" section; short version: neither of
 * this family's two real syntactic shapes (Auxiliary + Negator: don't,
 * can't, isn't, wasn't, hadn't; Subject Pronoun + finite Auxiliary: I'm,
 * it's) fits any of PhraseType's own six structural shapes -- VERB_PHRASE's
 * own Head Identification Rule admits only `Verb`, never `Auxiliary`
 * (data/enums/phrase_type.ts), and a Subject + finite verb pairing is
 * Clause-shaped, not Phrase-shaped, in any grammar. `Clause` itself has no
 * persisted, addressable store anywhere in this codebase (unlike
 * Dictionary/Phrases/Senses/WordForms) -- it's built fresh per sentence
 * read by ClauseReader, never seeded -- so a Clause target isn't available
 * either without inventing Clause persistence from nothing, disproportionate
 * to 2 contractions. Every entry here therefore points `contractionOf` at
 * the honest thing that already exists: a `Word` Identifier for a bare
 * lemma (do/can/not/n't/I/it), or a `WordForm` Identifier for a specific
 * inflected spelling that is itself not an independently addressable Word
 * under this codebase's own lemma+WordForm model (is/was/had/am, each a
 * WordForm of "be" or "have" -- data/entities/word_form.ts's own docstring
 * on why an inflected spelling isn't a separate Word any more; Identifier
 * itself carries no type of its own to narrow, the same "an Identifier
 * carries no type to narrow" reasoning `Phrase.headWord`'s own docstring
 * already gives, data/entities/phrase.ts). Set directly here rather than
 * through RelationshipSeeder's generic cache-driven CONTRACTION pipeline
 * (role/relationship_seeder.ts) -- that pipeline is Word-to-Word only and
 * predates the lemma+WordForm consolidation (this session's own Phase 1-6
 * migration), and these are fixed structural facts about English
 * orthography, not curated cache data that varies, AuxiliarySeeder's own
 * "data this seeder authors directly rather than reads from an asset file"
 * precedent.
 *
 * Called from `WordSeeder.seedClosedClassWords()`, after its own
 * `loadCache()` loop (not alongside AuxiliarySeeder/DeterminerSeeder ahead
 * of it) -- "I"/"it" (pronouns.json) and "be"/"have"'s own WordForms don't
 * exist yet at that earlier point; ordering against WordNet's own
 * homograph race is unaffected either way, since seedWordNet() only ever
 * runs as its own separate pass, after seedClosedClassWords() has already
 * finished in full. */
export class ContractionSeeder {
  constructor(
    private readonly dictionary: Dictionary,
    private readonly senses?: Senses,
    private readonly wordForms?: WordForms,
  ) {}

  /** Idempotent, AuxiliarySeeder's own "upsert, never duplicate" shape:
   * a lemma already present under its own expected part of speech is left
   * entirely alone (including `contractionOf`) on a re-seed. Returns how
   * many new Words were created. */
  seed(): { created: number } {
    let created = 0;

    const notWord = this.upsert(NEGATOR_WORDS[0], isAdverb, createAdverb);
    created += notWord.created;
    const nApostropheTWord = this.upsert(NEGATOR_WORDS[1], isAdverb, createAdverb);
    created += nApostropheTWord.created;
    this.setContractionOf(nApostropheTWord.word, [{ value: wordGraphUuid(notWord.word) }]);

    const doWord = this.dictionary.lookupAll("do").find(isAuxiliary);
    const canWord = this.dictionary.lookupAll("can").find(isAuxiliary);
    const beWord = this.dictionary.lookupAll("be").find(isAuxiliary);
    const haveWord = this.dictionary.lookupAll("have").find(isAuxiliary);
    const iWord = this.dictionary.lookupAll("I").find(isPronoun);
    const itWord = this.dictionary.lookupAll("it").find(isPronoun);
    const isForm = beWord !== undefined ? this.namedFormOf(beWord, "is") : undefined;
    const amForm = beWord !== undefined ? this.namedFormOf(beWord, "am") : undefined;
    const wasForm = beWord !== undefined ? this.namedFormOf(beWord, "was") : undefined;
    const hadForm = haveWord !== undefined ? this.namedFormOf(haveWord, "had") : undefined;
    const nApostropheT = nApostropheTWord.word;

    const wordId = (word: Word | undefined): Identifier | undefined => (word !== undefined ? { value: wordGraphUuid(word) } : undefined);
    const formId = (form: WordForm | undefined): Identifier | undefined => (form !== undefined ? { value: formGraphUuid(form) } : undefined);
    const pair = (a: Identifier | undefined, b: Identifier | undefined): readonly Identifier[] | undefined => (a !== undefined && b !== undefined ? [a, b] : undefined);

    const componentsByLemma: Record<string, readonly Identifier[] | undefined> = {
      "don't": pair(wordId(doWord), wordId(nApostropheT)),
      "can't": pair(wordId(canWord), wordId(nApostropheT)),
      "isn't": pair(formId(isForm), wordId(nApostropheT)),
      "wasn't": pair(formId(wasForm), wordId(nApostropheT)),
      "hadn't": pair(formId(hadForm), wordId(nApostropheT)),
      "I'm": pair(wordId(iWord), formId(amForm)),
      "it's": pair(wordId(itWord), formId(isForm)),
    };

    for (const seed of CONTRACTION_WORDS) {
      const result = this.upsert(seed, isAuxiliary, createAuxiliary);
      created += result.created;
      const components = componentsByLemma[seed.lemma];
      if (components !== undefined) this.setContractionOf(result.word, components);
    }

    return { created };
  }

  private namedFormOf(word: Word, text: string): WordForm | undefined {
    return this.wordForms?.formsOf(word).find((form) => form.text.value === text);
  }

  private setContractionOf(word: Word, components: readonly Identifier[]): void {
    const form = this.wordForms?.registerBaseLemmaForm(word);
    if (form !== undefined) form.contractionOf = components;
  }

  private upsert(
    seed: SingleWordSeed,
    isExpectedPos: (word: Word) => boolean,
    create: (init: { text: string; definition: { value: string }; isCommon: boolean }) => Word,
  ): { word: Word; created: number } {
    const existing = this.dictionary.lookupAll(seed.lemma).find(isExpectedPos);
    if (existing !== undefined) return { word: existing, created: 0 };

    const word = create({ text: seed.lemma, definition: { value: seed.definition }, isCommon: true });
    this.dictionary.append(word);
    this.wordForms?.registerBaseLemmaForm(word, { value: seed.lemma, languageStyleCode: NEUTRAL });

    if (this.senses !== undefined) {
      const sense = createSense({ definition: { value: seed.definition }, gloss: { value: seed.definition }, isCommon: true });
      this.senses.append(sense);
      this.senses.registerMember(sense, word);
      const form = this.wordForms?.registerBaseLemmaForm(word);
      if (form !== undefined) form.senseIds = [...form.senseIds, { value: senseGraphUuid(sense) }];
    }

    return { word, created: 1 };
  }
}
