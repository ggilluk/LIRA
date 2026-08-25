import { PartOfSpeech } from "../../vocabulary/data/enums/part_of_speech";
import { ClauseType } from "../data/clause_type";
import { LinguisticScope } from "../data/linguistic_scope";
import { ObligationKind } from "../data/sequencing_obligation";
import { PhraseType } from "../data/phrase_type";
import { SentenceType } from "../data/sentence_type";

/** Decouples linguistic configuration parameters from core processing
 * logic. GrammarConfigurator is the role LinguisticLexer,
 * ClauseSegmentationUtility, and SequenceEngine consult for the grammar
 * rules that drive their decisions -- not a passive data record, the
 * thing those roles are configured by.
 *
 * The read-path rule tables below (phrase/clause/sentence grammars,
 * obligation discharges, scope classification, search bounds) are the
 * Linguistics Layer developer specification's "GrammarConfigurator
 * extensions" (spec 11): SequenceEngine holds no grammar of its own --
 * every allowed start/next/end state, every raised and discharged
 * obligation, comes from here, which is what satisfies spec 11's "rules
 * must not be duplicated independently" for all three of
 * readPhrase()/readClause()/readSentence().
 *
 * Ported from linguistics/role/grammar_configurator.py. Python defers
 * importing PartOfSpeech inside factory functions purely to avoid a
 * module-scope import cycle within its own package; TypeScript's module
 * graph has no equivalent cycle here (see phrase.ts's own note on this),
 * so PartOfSpeech is imported normally at the top. */

export interface PhraseGrammar {
  phraseType: PhraseType;
  startStates: ReadonlySet<PartOfSpeech>;
  transitions: ReadonlyMap<PartOfSpeech, ReadonlySet<PartOfSpeech>>;
  endStates: ReadonlySet<PartOfSpeech>;
  // Priority order for selecting headPartOfSpeech among the states
  // actually present in a read phrase -- first entry found wins.
  headPreference: readonly PartOfSpeech[];
  // POS values that raise an obligation the moment they're read in this
  // phrase's scope (obligationDischarges below says what closes it).
  obligationsRaised: ReadonlyMap<PartOfSpeech, ObligationKind>;
  // PREPOSITIONAL_PHRASE only: after reading this POS, the engine
  // attempts a nested phrase of the given type as the continuation
  // instead of a POS transition.
  nestedPhraseAfter: ReadonlyMap<PartOfSpeech, PhraseType>;
  // INFINITIVE_PHRASE only: token text (not POS) that starts this
  // phrase, and the POS states allowed immediately after the marker.
  markerForms: ReadonlySet<string>;
  markerNextStates: ReadonlySet<PartOfSpeech>;
  markerObligation?: ObligationKind;
}

function phraseGrammar(init: Pick<PhraseGrammar, "phraseType" | "startStates" | "transitions" | "endStates" | "headPreference"> & Partial<PhraseGrammar>): PhraseGrammar {
  return {
    obligationsRaised: new Map(),
    nestedPhraseAfter: new Map(),
    markerForms: new Set(),
    markerNextStates: new Set(),
    ...init,
  };
}

export interface ClauseTemplate {
  clauseType: ClauseType;
  subjectPhraseTypes: ReadonlySet<PhraseType>;
  predicatePhraseTypes: ReadonlySet<PhraseType>;
  objectPhraseTypes: ReadonlySet<PhraseType>;
  complementPhraseTypes: ReadonlySet<PhraseType>;
  modifierPhraseTypes: ReadonlySet<PhraseType>;
  subjectRequired: boolean;
  predicateRequired: boolean;
  // This phase's approximation of "finite verb" (spec 13.1, 17): a
  // VERB_PHRASE headed by PartOfSpeech.VERB counts as finite.
  predicateHeadRequires: ReadonlySet<PartOfSpeech>;
  obligationsRaised: readonly ObligationKind[];
}

export interface SentenceTemplate {
  sentenceType: SentenceType;
  clauseTypes: ReadonlySet<ClauseType>;
  minClauses: number;
  maxClauses?: number;
  terminalPunctuation: ReadonlySet<string>;
}

function buildPhraseGrammars(): Map<PhraseType, PhraseGrammar> {
  const POS = PartOfSpeech;
  const coordination = ObligationKind.CONJUNCTION_REQUIRES_COORDINATED_ELEMENT;

  const grammars = new Map<PhraseType, PhraseGrammar>();

  grammars.set(PhraseType.NOUN_PHRASE, phraseGrammar({
    phraseType: PhraseType.NOUN_PHRASE,
    startStates: new Set([POS.DETERMINER, POS.ADJECTIVE, POS.NOUN, POS.PROPER_NOUN, POS.PRONOUN, POS.NUMERAL]),
    transitions: new Map<PartOfSpeech, ReadonlySet<PartOfSpeech>>([
      [POS.DETERMINER, new Set([POS.ADJECTIVE, POS.NUMERAL, POS.NOUN, POS.PROPER_NOUN])],
      [POS.NUMERAL, new Set([POS.ADJECTIVE, POS.NUMERAL, POS.NOUN, POS.PROPER_NOUN])],
      [POS.ADJECTIVE, new Set([POS.ADJECTIVE, POS.NOUN, POS.PROPER_NOUN, POS.CONJUNCTION])],
      // NOUN/PROPER_NOUN only continue via CONJUNCTION (real
      // coordination, "cats and dogs"), never via a bare NOUN->NOUN
      // self-loop -- see the Python original's own note on why an
      // unrestricted compound-noun chain is too eager against an
      // ambiguous NOUN/VERB word.
      [POS.NOUN, new Set([POS.CONJUNCTION])],
      [POS.PROPER_NOUN, new Set([POS.CONJUNCTION])],
      [POS.CONJUNCTION, new Set([POS.DETERMINER, POS.ADJECTIVE, POS.NUMERAL, POS.NOUN, POS.PROPER_NOUN, POS.PRONOUN])],
    ]),
    endStates: new Set([POS.NOUN, POS.PROPER_NOUN, POS.PRONOUN, POS.NUMERAL]),
    headPreference: [POS.NOUN, POS.PROPER_NOUN, POS.PRONOUN, POS.NUMERAL],
    obligationsRaised: new Map([
      [POS.DETERMINER, ObligationKind.DETERMINER_REQUIRES_NOMINAL_HEAD],
      [POS.CONJUNCTION, coordination],
    ]),
  }));

  grammars.set(PhraseType.VERB_PHRASE, phraseGrammar({
    phraseType: PhraseType.VERB_PHRASE,
    startStates: new Set([POS.AUXILIARY, POS.VERB, POS.ADVERB]),
    transitions: new Map<PartOfSpeech, ReadonlySet<PartOfSpeech>>([
      [POS.AUXILIARY, new Set([POS.AUXILIARY, POS.ADVERB, POS.VERB])],
      [POS.ADVERB, new Set([POS.AUXILIARY, POS.ADVERB, POS.VERB])],
      [POS.VERB, new Set([POS.ADVERB, POS.CONJUNCTION])],
      [POS.CONJUNCTION, new Set([POS.AUXILIARY, POS.VERB, POS.ADVERB])],
    ]),
    // Deliberately excludes AUXILIARY -- a bare "is"/"have"/"been" never
    // completes a VERB_PHRASE on its own. This is what makes "is"
    // resolve to VERB (not AUXILIARY) in "A meaning is a
    // representation.": AUXILIARY is a valid *start* but only VERB is a
    // valid *end*.
    endStates: new Set([POS.VERB]),
    headPreference: [POS.VERB],
    obligationsRaised: new Map([
      [POS.AUXILIARY, ObligationKind.AUXILIARY_REQUIRES_COMPATIBLE_VERB_FORM],
      [POS.CONJUNCTION, coordination],
    ]),
  }));

  grammars.set(PhraseType.ADJECTIVE_PHRASE, phraseGrammar({
    phraseType: PhraseType.ADJECTIVE_PHRASE,
    startStates: new Set([POS.ADVERB, POS.ADJECTIVE]),
    transitions: new Map<PartOfSpeech, ReadonlySet<PartOfSpeech>>([
      [POS.ADVERB, new Set([POS.ADVERB, POS.ADJECTIVE])],
      [POS.ADJECTIVE, new Set([POS.CONJUNCTION])],
      [POS.CONJUNCTION, new Set([POS.ADVERB, POS.ADJECTIVE])],
    ]),
    endStates: new Set([POS.ADJECTIVE]),
    headPreference: [POS.ADJECTIVE],
    obligationsRaised: new Map([[POS.CONJUNCTION, coordination]]),
  }));

  grammars.set(PhraseType.ADVERB_PHRASE, phraseGrammar({
    phraseType: PhraseType.ADVERB_PHRASE,
    startStates: new Set([POS.ADVERB]),
    transitions: new Map<PartOfSpeech, ReadonlySet<PartOfSpeech>>([
      [POS.ADVERB, new Set([POS.ADVERB, POS.CONJUNCTION])],
      [POS.CONJUNCTION, new Set([POS.ADVERB])],
    ]),
    endStates: new Set([POS.ADVERB]),
    headPreference: [POS.ADVERB],
    obligationsRaised: new Map([[POS.CONJUNCTION, coordination]]),
  }));

  grammars.set(PhraseType.PREPOSITIONAL_PHRASE, phraseGrammar({
    phraseType: PhraseType.PREPOSITIONAL_PHRASE,
    startStates: new Set([POS.PREPOSITION]),
    transitions: new Map(),
    // No POS ends a PP directly -- it ends when the nested NOUN_PHRASE
    // its PREPOSITION obligation-triggers ends (nestedPhraseAfter
    // below), never as a bare preposition.
    endStates: new Set(),
    headPreference: [POS.PREPOSITION],
    obligationsRaised: new Map([[POS.PREPOSITION, ObligationKind.PREPOSITION_REQUIRES_OBJECT]]),
    nestedPhraseAfter: new Map([[POS.PREPOSITION, PhraseType.NOUN_PHRASE]]),
  }));

  grammars.set(PhraseType.INFINITIVE_PHRASE, phraseGrammar({
    phraseType: PhraseType.INFINITIVE_PHRASE,
    // No seeded POS starts this phrase -- "to" is seeded only as
    // PREPOSITION, so the marker is matched by token text, never by
    // relabelling its seeded POS.
    startStates: new Set(),
    transitions: new Map(),
    endStates: new Set([POS.VERB]),
    headPreference: [POS.VERB],
    markerForms: new Set(["to"]),
    markerNextStates: new Set([POS.VERB]),
    markerObligation: ObligationKind.INFINITIVE_MARKER_REQUIRES_BASE_VERB,
  }));

  return grammars;
}

function buildClauseElementTemplates(): Map<ClauseType, ClauseTemplate> {
  const POS = PartOfSpeech;
  const templates = new Map<ClauseType, ClauseTemplate>();
  templates.set(ClauseType.INDEPENDENT, {
    clauseType: ClauseType.INDEPENDENT,
    subjectPhraseTypes: new Set([PhraseType.NOUN_PHRASE]),
    predicatePhraseTypes: new Set([PhraseType.VERB_PHRASE]),
    objectPhraseTypes: new Set([PhraseType.NOUN_PHRASE]),
    complementPhraseTypes: new Set([PhraseType.NOUN_PHRASE, PhraseType.ADJECTIVE_PHRASE]),
    modifierPhraseTypes: new Set([PhraseType.ADVERB_PHRASE, PhraseType.PREPOSITIONAL_PHRASE]),
    subjectRequired: true,
    predicateRequired: true,
    predicateHeadRequires: new Set([POS.VERB]),
    obligationsRaised: [ObligationKind.DECLARATIVE_CLAUSE_REQUIRES_FINITE_VERB],
  });
  // DEPENDENT/RELATIVE/COORDINATED: Phase 2 (clause_type.ts) -- no entry
  // here, so ClauseReader must report those UNRESOLVED rather than
  // guess a template for them.
  return templates;
}

function buildSentenceTemplates(): Map<SentenceType, SentenceTemplate> {
  const templates = new Map<SentenceType, SentenceTemplate>();
  templates.set(SentenceType.DECLARATIVE, {
    sentenceType: SentenceType.DECLARATIVE,
    clauseTypes: new Set([ClauseType.INDEPENDENT]),
    minClauses: 1,
    maxClauses: 1,
    terminalPunctuation: new Set(["."]),
  });
  // INTERROGATIVE/EXCLAMATORY reuse DECLARATIVE's exact clause shape --
  // this phase recognises a sentence as interrogative/exclamatory by
  // its terminal punctuation alone ("?"/"!"), not by word-order
  // grammar (subject-auxiliary inversion, wh-fronting, etc. are not
  // modelled by PhraseReader/ClauseReader at all yet, so there is
  // nothing for a distinct clause template to check). SentenceReader.read()
  // picks whichever of these three templates' terminalPunctuation
  // actually matches the sentence's own final punctuation mark, tried
  // in Map insertion order -- see that file's own docstring.
  templates.set(SentenceType.INTERROGATIVE, {
    sentenceType: SentenceType.INTERROGATIVE,
    clauseTypes: new Set([ClauseType.INDEPENDENT]),
    minClauses: 1,
    maxClauses: 1,
    terminalPunctuation: new Set(["?"]),
  });
  templates.set(SentenceType.EXCLAMATORY, {
    sentenceType: SentenceType.EXCLAMATORY,
    clauseTypes: new Set([ClauseType.INDEPENDENT]),
    minClauses: 1,
    maxClauses: 1,
    terminalPunctuation: new Set(["!"]),
  });
  // IMPERATIVE: still Phase 2 (sentence_type.ts) -- an imperative
  // clause has no subject at all ("Stop."), which this phase's
  // ClauseTemplate.subjectRequired=true (INDEPENDENT) would reject
  // outright; recognising it needs its own ClauseTemplate, not just a
  // new terminal-punctuation set.
  return templates;
}

function buildObligationDischarges(): Map<ObligationKind, ReadonlySet<PartOfSpeech>> {
  const POS = PartOfSpeech;
  const coordinable = new Set([
    POS.NOUN, POS.PROPER_NOUN, POS.PRONOUN, POS.NUMERAL, POS.DETERMINER,
    POS.VERB, POS.AUXILIARY, POS.ADJECTIVE, POS.ADVERB,
  ]);
  return new Map([
    [ObligationKind.DETERMINER_REQUIRES_NOMINAL_HEAD, new Set([POS.NOUN, POS.PROPER_NOUN, POS.NUMERAL])],
    [ObligationKind.PREPOSITION_REQUIRES_OBJECT, new Set([POS.NOUN, POS.PROPER_NOUN, POS.PRONOUN, POS.NUMERAL])],
    [ObligationKind.AUXILIARY_REQUIRES_COMPATIBLE_VERB_FORM, new Set([POS.VERB])],
    [ObligationKind.INFINITIVE_MARKER_REQUIRES_BASE_VERB, new Set([POS.VERB])],
    [ObligationKind.CONJUNCTION_REQUIRES_COORDINATED_ELEMENT, coordinable],
    // Phase 2 obligations -- never raised in this phase, so an empty
    // discharge set is never actually consulted; present so
    // validateAgainstVocabulary() has one row per ObligationKind member
    // to check, not just the ones this phase raises.
    [ObligationKind.RELATIVE_PRONOUN_OPENS_RELATIVE_CLAUSE, new Set()],
    [ObligationKind.DECLARATIVE_CLAUSE_REQUIRES_FINITE_VERB, new Set([POS.VERB])],
    [ObligationKind.QUOTATION_MUST_CLOSE, new Set()],
    [ObligationKind.PARENTHETICAL_MUST_CLOSE, new Set()],
  ]);
}

export class GrammarConfigurator {
  coordinatingConjunctions: Set<string> = new Set(["and", "but", "or", "so", "yet", "for"]);
  clauseDelimiters: Set<string> = new Set([","]);
  sentenceAbbreviationExceptions = String.raw`(?<!\bDr)(?<!\bEd)(?<!\bJan)(?<!\bU\.S)`;

  // --- Read-path rule tables (spec 11) -----------------------------
  phraseGrammars: Map<PhraseType, PhraseGrammar> = buildPhraseGrammars();
  clauseElementTemplates: Map<ClauseType, ClauseTemplate> = buildClauseElementTemplates();
  sentenceTemplates: Map<SentenceType, SentenceTemplate> = buildSentenceTemplates();
  obligationDischarges: Map<ObligationKind, ReadonlySet<PartOfSpeech>> = buildObligationDischarges();

  // Scopes in which an unresolved (unseeded) token is absorbed as a
  // wildcard rather than aborting the whole read (spec 7).
  unknownTokenAbsorbingScopes: ReadonlySet<LinguisticScope> = new Set([LinguisticScope.NOUN_PHRASE, LinguisticScope.VERB_PHRASE]);
  // Scopes in which a CONJUNCTION token is read as phrase-internal
  // coordination rather than a clause/sentence-level boundary.
  coordinableScopes: ReadonlySet<LinguisticScope> = new Set([
    LinguisticScope.NOUN_PHRASE, LinguisticScope.VERB_PHRASE,
    LinguisticScope.ADJECTIVE_PHRASE, LinguisticScope.ADVERB_PHRASE,
  ]);

  // Bounds for SequenceEngine.findValidSequences's DP/beam search
  // (naive exhaustive search hit a 200k-node cap on one 14-token
  // sentence) -- exceeding maxSequenceSearchNodes truncates the search
  // rather than exhausting it, and only the top
  // maxAlternativeInterpretations survivors are retained as
  // Interpretation alternatives (spec 15, 24).
  maxSequenceSearchNodes = 4000;
  maxAlternativeInterpretations = 3;

  /** Asserts every rule table is internally consistent -- a typo in a
   * table (spec 11's own rule tables) fails here, at LinguisticController
   * construction time, not mid-parse. */
  validateAgainstVocabulary(): void {
    const errors: string[] = [];

    for (const [phraseType, grammar] of this.phraseGrammars) {
      if (grammar.phraseType !== phraseType) {
        errors.push(`phraseGrammars[${PhraseType[phraseType]}].phraseType mismatch: ${PhraseType[grammar.phraseType]}`);
      }

      const reachableStates = new Set<PartOfSpeech>([...grammar.startStates, ...grammar.endStates, ...grammar.markerNextStates]);
      for (const targets of grammar.transitions.values()) {
        for (const target of targets) reachableStates.add(target);
      }
      for (const pos of grammar.headPreference) {
        if (!reachableStates.has(pos)) {
          errors.push(`${PhraseType[phraseType]}: headPreference ${PartOfSpeech[pos]} is not a reachable state`);
        }
      }

      const hasOrdinaryEnd = grammar.endStates.size > 0;
      const hasMarkerEnd = grammar.markerForms.size > 0 && grammar.markerNextStates.size > 0;
      // A PP-shaped phrase never ends on its own POS at all -- it ends
      // when the nested phrase its trigger POS opens ends.
      const hasNestedEnd = grammar.nestedPhraseAfter.size > 0;
      if (!hasOrdinaryEnd && !hasMarkerEnd && !hasNestedEnd) {
        errors.push(`${PhraseType[phraseType]}: no endStates, marker-based end, or nested-phrase end -- this phrase type can never validly close`);
      }

      for (const [pos, kind] of grammar.obligationsRaised) {
        if (!this.obligationDischarges.has(kind)) {
          errors.push(`${PhraseType[phraseType]}: obligation ${ObligationKind[kind]} raised by ${PartOfSpeech[pos]} has no obligationDischarges entry`);
        }
      }
      if (grammar.markerObligation !== undefined && !this.obligationDischarges.has(grammar.markerObligation)) {
        errors.push(`${PhraseType[phraseType]}: markerObligation ${ObligationKind[grammar.markerObligation]} has no obligationDischarges entry`);
      }

      for (const nestedType of grammar.nestedPhraseAfter.values()) {
        if (!this.phraseGrammars.has(nestedType)) {
          errors.push(`${PhraseType[phraseType]}: nestedPhraseAfter references unconfigured phrase type ${PhraseType[nestedType]}`);
        }
      }
    }

    for (const [clauseType, template] of this.clauseElementTemplates) {
      if (template.clauseType !== clauseType) {
        errors.push(`clauseElementTemplates[${ClauseType[clauseType]}].clauseType mismatch: ${ClauseType[template.clauseType]}`);
      }
      const roles: readonly [string, ReadonlySet<PhraseType>][] = [
        ["subject", template.subjectPhraseTypes],
        ["predicate", template.predicatePhraseTypes],
        ["object", template.objectPhraseTypes],
        ["complement", template.complementPhraseTypes],
        ["modifier", template.modifierPhraseTypes],
      ];
      for (const [roleName, phraseTypes] of roles) {
        for (const phraseType of phraseTypes) {
          if (!this.phraseGrammars.has(phraseType)) {
            errors.push(`clauseElementTemplates[${ClauseType[clauseType]}].${roleName} references unconfigured phrase type ${PhraseType[phraseType]}`);
          }
        }
      }
      for (const kind of template.obligationsRaised) {
        if (!this.obligationDischarges.has(kind)) {
          errors.push(`clauseElementTemplates[${ClauseType[clauseType]}]: obligation ${ObligationKind[kind]} has no obligationDischarges entry`);
        }
      }
    }

    for (const [sentenceType, template] of this.sentenceTemplates) {
      if (template.sentenceType !== sentenceType) {
        errors.push(`sentenceTemplates[${SentenceType[sentenceType]}].sentenceType mismatch: ${SentenceType[template.sentenceType]}`);
      }
      for (const clauseType of template.clauseTypes) {
        if (!this.clauseElementTemplates.has(clauseType)) {
          errors.push(`sentenceTemplates[${SentenceType[sentenceType]}] references unconfigured clause type ${ClauseType[clauseType]}`);
        }
      }
      if (template.minClauses < 1) {
        errors.push(`sentenceTemplates[${SentenceType[sentenceType]}]: minClauses must be >= 1`);
      }
      if (template.maxClauses !== undefined && template.maxClauses < template.minClauses) {
        errors.push(`sentenceTemplates[${SentenceType[sentenceType]}]: maxClauses < minClauses`);
      }
    }

    if (errors.length > 0) {
      throw new Error("GrammarConfigurator rule tables are inconsistent:\n" + errors.map((e) => `  - ${e}`).join("\n"));
    }
  }
}
