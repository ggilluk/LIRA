/** The scopes SequenceEngine tracks while sequencing (Linguistics Layer
 * developer specification, 8.2; spec 17). A scope is what makes
 * adjacent-POS-transition validity insufficient on its own: the same
 * PartOfSpeech pair can be valid in one scope and invalid in another
 * (ADVERB->ADJECTIVE is a valid step inside an ADJECTIVE_PHRASE, not a
 * valid step inside a VERB_PHRASE's own transitions), and a scope can
 * raise obligations (SequencingObligation) that must be discharged
 * before it's allowed to close. RELATIVE_CLAUSE, PARENTHETICAL, and
 * QUOTATION are defined for a stable value space but not yet opened by
 * any GrammarConfigurator rule in this phase -- ENUMERATION is likewise
 * defined but not yet distinguished from ordinary COORDINATION.
 *
 * `7` is deliberately left unassigned, not renumbered away -- it used to
 * be INFINITIVE_PHRASE, opened by the (now-removed) INFINITIVE_PHRASE
 * PhraseGrammar/marker-step mechanism (grammar_configurator.ts's own
 * "Remove InfinitivePhrase" design log entry). Every value here is a
 * tensor code (this docstring's own opening line), so closing the gap
 * would silently renumber RELATIVE_CLAUSE/COORDINATION/ENUMERATION/
 * PARENTHETICAL/QUOTATION instead of just retiring the one value that's
 * actually gone.
 *
 * Ported from linguistics/data/linguistic_scope.py. */
export enum LinguisticScope {
  SENTENCE = 0,
  CLAUSE = 1,
  NOUN_PHRASE = 2,
  VERB_PHRASE = 3,
  ADJECTIVE_PHRASE = 4,
  ADVERB_PHRASE = 5,
  PREPOSITIONAL_PHRASE = 6,
  RELATIVE_CLAUSE = 8,
  COORDINATION = 9,
  ENUMERATION = 10,
  PARENTHETICAL = 11,
  QUOTATION = 12,
}
