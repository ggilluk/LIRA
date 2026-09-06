import { createClause, type Clause } from "../data/clause";
import { ClauseType } from "../data/clause_type";
import { LinguisticUnitKind } from "../data/linguistic_unit_kind";
import { createMainClause } from "../data/main_clause";
import { createSubordinateClause, type SubordinateClauseType } from "../data/subordinate_clause";
import type { Phrase } from "../data/phrase";
import type { Word } from "../../vocabulary/data/entities/word";
import { createReadingError, ReadingErrorKind, type ReadingError } from "../data/reading_error";
import { isPunctuation, type TokenReading } from "../data/token_reading";
import { ValidationOutcome } from "../data/validation_outcome";
import { embeddedSubjectClauseSpan, embeddingTrigger } from "./clause_embedding";
import type { ClauseTemplate, GrammarConfigurator } from "./grammar_configurator";
import type { PhraseReader } from "./phrase_reader";
import { createScoringFactors } from "./reading_scorer";
import type { SequenceEngine } from "./sequence_engine";

/** ClauseReader: spec 13.3's actual readClause() implementation. Reads
 * a token span as a sequence of Phrases (via PhraseReader), then
 * assigns each phrase a clause role (subject/predicate/object/
 * complement/modifier) against GrammarConfigurator.clauseElementTemplates.
 * Only ClauseType.INDEPENDENT has a populated template in this phase --
 * see clause_type.ts -- so this always attempts exactly one flat,
 * non-recursive independent-clause reading over its whole span;
 * relative/dependent/coordinated clauses (clause-level recursion) are
 * Phase 2.
 *
 * Clause validity is not simply the worst of its phrases' validity:
 * spec 20's own worked example ("The fox over the dog.") has two
 * individually VALID phrases (a NOUN_PHRASE, a PREPOSITIONAL_PHRASE)
 * but an INVALID clause, because no VERB_PHRASE predicate exists at
 * all. So this combines its own template-level check (subject/
 * predicate/finite-verb presence) with the worst outcome among its
 * phrases -- see validate.
 *
 * Ported from linguistics/role/clause_reader.py. */

// Copular/linking-verb forms -- when the predicate's own head word is
// one of these, a following NOUN_PHRASE/ADJECTIVE_PHRASE is a
// complement ("A meaning IS a representation."), not an object;
// anything else with a following NOUN_PHRASE reads that phrase as an
// object instead. A closed, hand-picked set rather than a
// morphological test, since real transitivity/linking-verb
// classification isn't seeded data this phase has access to.
const LINKING_VERB_FORMS = new Set(["is", "are", "was", "were", "be", "been", "being", "am"]);

export interface ClauseReadOptions {
  startIndex?: number;
  endIndex?: number;
  grammar?: GrammarConfigurator;
  trace?: unknown[];
  // Which ClauseTemplate this read attempts -- INDEPENDENT (the default,
  // every real top-level read) or DEPENDENT, the one other populated
  // template (clause_embedding.ts's own docstring): ClauseReader.read()
  // recurses into itself with this set to DEPENDENT for a candidate
  // embedded-subject-clause span, never called this way from outside
  // this file. RELATIVE/COORDINATED still have no template at all
  // (grammar_configurator.ts), so passing either here still reports
  // UNRESOLVED via emptyClause() below, unchanged.
  clauseType?: ClauseType;
  // Whether this read attempts its own embedded-subject-clause
  // recognition -- true by default, false on the one recursive call
  // read() itself makes to try a candidate embedded span. Required,
  // not incidental: a free-relative trigger ("what") IS the embedded
  // clause's own subject (embeddingTrigger()'s own docstring,
  // clause_embedding.ts), so the recursive read's span starts at that
  // exact same token -- without this guard it would immediately
  // recognise "what" as a trigger all over again and recurse forever.
  // The same "one level only" scoping this session's own Coordination
  // work already settled on for a coordinate side
  // (resolveCoordinateSide(), vocabulary/role/processor/phrase_processor.ts) --
  // an embedded clause is never itself searched for a second, nested
  // embedded clause.
  allowEmbedding?: boolean;
}

export class ClauseReader {
  constructor(
    public readonly phraseReader: PhraseReader,
    private readonly engine: SequenceEngine,
    private readonly grammar: GrammarConfigurator,
  ) {}

  /** `trace`, when an array is passed, is threaded straight through to
   * every PhraseReader.read() call this clause makes. Purely additive/
   * observational. */
  read(tokens: readonly TokenReading[], options: ClauseReadOptions = {}): Clause {
    const activeGrammar = options.grammar ?? this.grammar;
    const startIndex = options.startIndex ?? 0;
    const endIndex = options.endIndex ?? tokens.length;
    const clauseType = options.clauseType ?? ClauseType.INDEPENDENT;
    const template = activeGrammar.clauseElementTemplates.get(clauseType);

    if (template === undefined || startIndex >= endIndex) {
      return this.emptyClause(tokens, startIndex, endIndex);
    }

    const phrases: Phrase[] = [];
    const orderedWordChunks: Word[][] = [];
    let resolvedSubject: Phrase | Clause | undefined;
    const nestedClauses: Clause[] = [];
    let index = startIndex;
    while (index < endIndex) {
      const token = tokens[index];
      if (isPunctuation(token)) {
        index += 1;
        continue;
      }
      // Embedded-subject-clause recognition (clause_embedding.ts's own
      // docstring) -- only attempted once, and only before a subject-
      // shaped phrase has already been read: "no subject found yet" is
      // a purely local check over `phrases` so far, the same
      // subjectPhraseTypes set assignRoles() below itself checks, not a
      // duplicate of that function's own full role-resolution state
      // machine.
      if (
        (options.allowEmbedding ?? true) &&
        resolvedSubject === undefined &&
        !phrases.some((phrase) => phrase.phraseType !== undefined && template.subjectPhraseTypes.has(phrase.phraseType))
      ) {
        const embeddedStart = embeddingTrigger(token);
        if (embeddedStart !== undefined) {
          const found = embeddedSubjectClauseSpan(embeddedStart, endIndex, tokens, this.engine, template, (spanStart, boundary) =>
            this.read(tokens, { startIndex: spanStart, endIndex: boundary, grammar: activeGrammar, clauseType: ClauseType.DEPENDENT, allowEmbedding: false, trace: options.trace }));
          if (found !== undefined) {
            resolvedSubject = found.embedded;
            nestedClauses.push(found.embedded);
            // A complementizer trigger ("that") sits at `index`, one
            // position *before* `embeddedStart` -- consumed here, never
            // becoming a Phrase of its own, but still a real word this
            // clause's own text contains. Materialise it directly
            // (never routed through phraseReader.read(), the only other
            // place a token normally becomes a Word) so it's never
            // silently absent from `clause.text`/`.tokens` the way a
            // dropped token once made "is" vanish from a read Sentence
            // entirely (this log's own AUXILIARY/`is` mystery section) --
            // a free-relative trigger ("what") needs no such step, it's
            // already the embedded clause's own first token, included in
            // `found.embedded.tokens` below.
            if (embeddedStart !== index) {
              const triggerWord = this.phraseReader.graphProcessor.materialiseToken(token, token.tokenIndex, token.candidates[0]);
              orderedWordChunks.push([triggerWord]);
            }
            orderedWordChunks.push(found.embedded.tokens);
            index = found.boundary;
            continue;
          }
        }
      }
      const phrase = this.phraseReader.read(tokens, { startIndex: index, endIndex, grammar: activeGrammar, trace: options.trace });
      phrases.push(phrase);
      orderedWordChunks.push(phrase.words);
      index = phrase.endPosition > index ? phrase.endPosition : index + 1;
    }

    const { subject, predicate, obj, complement, modifiers } = this.assignRoles(phrases, template, resolvedSubject);
    const finiteVerb = predicate?.headWord;

    const { validation, errors: ownErrors } = this.validate(phrases, subject, predicate, template);
    const phraseErrors = phrases.flatMap((phrase) => this.allPhraseErrors(phrase));
    const nestedClauseErrors = nestedClauses.flatMap((nested) => nested.errors);
    const errors: readonly ReadingError[] = [...ownErrors, ...phraseErrors, ...nestedClauseErrors];

    const factors = createScoringFactors({
      validation,
      unresolvedTokenCount: phrases.filter((phrase) => phrase.validation === ValidationOutcome.UNRESOLVED).length,
      undischargedObligationCount: phrases.reduce((sum, phrase) => sum + phrase.openObligations.length, 0),
      finiteVerbPhraseCount: predicate !== undefined ? 1 : 0,
      phraseCount: phrases.length,
      lexicalEvidenceSum: phrases.reduce((sum, phrase) => sum + phrase.confidence, 0),
    });
    const confidence = this.engine.scorer.confidence(factors);

    const allWords = orderedWordChunks.flat();
    const clauseInit = {
      text: allWords.map((word) => word.text).join(" "),
      tokens: allWords,
      phrases,
      subject, predicate, object: obj, complement, modifiers,
      finiteVerb, nestedClauses,
      startPosition: startIndex, endPosition: index,
      validation, confidence, errors,
    };
    // INDEPENDENT (the one ClauseType every real top-level read still
    // resolves to) builds a MainClause; DEPENDENT (this file's own
    // recursive embedded-subject-clause read, above) builds a real
    // SubordinateClause -- the first ClauseType.DEPENDENT read/RELATIVE/
    // COORDINATED still have no template at all (grammar_configurator.ts),
    // so those still can't reach this line at all, only emptyClause()
    // above.
    const clause = clauseType === ClauseType.INDEPENDENT
      ? createMainClause(clauseInit)
      : createSubordinateClause({ ...clauseInit, clauseType: clauseType as SubordinateClauseType });
    // Phase 1 reads at most one clause per sentence (clause_type.ts),
    // so 0 is always this clause's own sequence number within its
    // sentence.
    clause.systemProperty = this.phraseReader.graphProcessor.createPropertyWrapper(
      clause, LinguisticUnitKind.Clause, 0, "ClauseReader_ReadLayer",
    );
    return clause;
  }

  private assignRoles(
    phrases: readonly Phrase[], template: ClauseTemplate, resolvedSubject?: Phrase | Clause,
  ): { subject?: Phrase | Clause; predicate?: Phrase; obj?: Phrase; complement?: Phrase; modifiers: Phrase[] } {
    let subject: Phrase | Clause | undefined = resolvedSubject;
    let predicate: Phrase | undefined;
    let obj: Phrase | undefined;
    let complement: Phrase | undefined;
    const modifiers: Phrase[] = [];

    for (const phrase of phrases) {
      if (phrase.phraseType === undefined) continue;
      if (predicate === undefined) {
        if (subject === undefined && template.subjectPhraseTypes.has(phrase.phraseType)) {
          subject = phrase;
          continue;
        }
        if (template.predicatePhraseTypes.has(phrase.phraseType)) {
          predicate = phrase;
          continue;
        }
        modifiers.push(phrase);
        continue;
      }

      // Past the predicate, no subject found yet -- subject-auxiliary
      // inversion ("Did the young woman open the gate?": the AUXILIARY
      // "Did" alone already satisfies predicateHeadRequires on its own,
      // long before the real main verb "open" is even reached, so the
      // ordinary pre-predicate scan above never finds a subject at
      // all). The first subject-eligible phrase found now is the
      // (inverted) subject, not the object -- real English word order
      // for a yes/no question, a fronted wh-question, or "Is behind the
      // station a safe place to wait?"'s own PrepositionalPhrase
      // subject alike. Never fires for an ordinary declarative, where
      // the pre-predicate scan above already found the subject.
      if (subject === undefined && template.subjectPhraseTypes.has(phrase.phraseType)) {
        subject = phrase;
        continue;
      }

      // Past the predicate: first NOUN_PHRASE/ADJECTIVE_PHRASE becomes
      // the object or complement (never both), everything else is a
      // modifier.
      if (obj === undefined && complement === undefined && template.complementPhraseTypes.has(phrase.phraseType)) {
        const isLinking = predicate.headWord !== undefined && LINKING_VERB_FORMS.has(predicate.headWord.text.toLowerCase());
        if (!isLinking && template.objectPhraseTypes.has(phrase.phraseType)) {
          obj = phrase;
        } else {
          complement = phrase;
        }
        continue;
      }
      modifiers.push(phrase);
    }

    return { subject, predicate, obj, complement, modifiers };
  }

  private validate(
    phrases: readonly Phrase[], subject: Phrase | Clause | undefined, predicate: Phrase | undefined, template: ClauseTemplate,
  ): { validation: ValidationOutcome; errors: ReadingError[] } {
    const errors: ReadingError[] = [];
    let ownOutcome = ValidationOutcome.VALID;

    if (template.subjectRequired && subject === undefined) {
      ownOutcome = ValidationOutcome.INVALID;
      errors.push(createReadingError({
        kind: ReadingErrorKind.NO_VALID_CLAUSE_SEQUENCE, level: LinguisticUnitKind.Clause,
        message: "No subject-shaped phrase found before the predicate",
      }));
    }
    if (template.predicateRequired && predicate === undefined) {
      ownOutcome = ValidationOutcome.INVALID;
      errors.push(createReadingError({
        kind: ReadingErrorKind.MISSING_PREDICATE, level: LinguisticUnitKind.Clause,
        message: "No VERB_PHRASE found for this clause's predicate",
      }));
    } else if (predicate !== undefined && (predicate.headPartOfSpeech === undefined || !template.predicateHeadRequires.has(predicate.headPartOfSpeech))) {
      ownOutcome = ValidationOutcome.INVALID;
      errors.push(createReadingError({
        kind: ReadingErrorKind.MISSING_FINITE_VERB, level: LinguisticUnitKind.Clause,
        message: "The clause's predicate has no finite verb form",
      }));
    }

    const phraseOutcomes = phrases.filter((phrase) => phrase.phraseType !== undefined).map((phrase) => phrase.validation);
    // `subject` is only ever a Clause when embeddedSubjectClauseSpan()
    // (clause_embedding.ts) already required it to be VALID before
    // accepting that boundary -- included here anyway rather than relied
    // on silently, so this reduction stays correct even if that
    // invariant ever changes.
    const outcomes = subject !== undefined && "clauseType" in subject ? [ownOutcome, subject.validation, ...phraseOutcomes] : [ownOutcome, ...phraseOutcomes];
    const worst = outcomes.reduce((worstSoFar, outcome) => (outcome < worstSoFar ? outcome : worstSoFar));
    return { validation: worst, errors };
  }

  /** A phrase's own `.errors` deliberately excludes its nested
   * phrases' errors, so Clause/Sentence-level error reporting (spec
   * 21) still needs every error reachable from one place -- this walks
   * nestedPhrases to collect them. */
  private allPhraseErrors(phrase: Phrase): ReadingError[] {
    const errors = [...phrase.errors];
    for (const nested of phrase.nestedPhrases) errors.push(...this.allPhraseErrors(nested));
    return errors;
  }

  private emptyClause(tokens: readonly TokenReading[], startIndex: number, endIndex: number): Clause {
    const error = createReadingError({
      kind: ReadingErrorKind.NO_VALID_CLAUSE_SEQUENCE, level: LinguisticUnitKind.Clause,
      message: "Empty token span or no clause template configured for ClauseType.INDEPENDENT",
      tokenIndex: startIndex < tokens.length ? startIndex : undefined,
    });
    const clause = createClause({
      text: "", tokens: [], isIndependent: undefined, clauseType: undefined,
      startPosition: startIndex, endPosition: endIndex,
      validation: ValidationOutcome.INVALID, confidence: 0.0, errors: [error],
    });
    clause.systemProperty = this.phraseReader.graphProcessor.createPropertyWrapper(
      clause, LinguisticUnitKind.Clause, 0, "ClauseReader_ReadLayer",
    );
    return clause;
  }
}
