/** The sentence types Sentence.read() can recognise (Linguistics Layer
 * developer specification, 6.1). DECLARATIVE ("."), INTERROGATIVE ("?"),
 * and EXCLAMATORY ("!") each have a populated SentenceTemplate
 * (grammar_configurator.ts's own buildSentenceTemplates, prototype
 * only -- Python's own sentence_reader.py still hardcodes DECLARATIVE,
 * see this session's standing TypeScript-only scope), all three sharing
 * DECLARATIVE's exact clause shape and distinguished purely by terminal
 * punctuation; none of them enforce distinct word-order grammar (no
 * subject-auxiliary inversion, wh-fronting, etc. -- PhraseReader/
 * ClauseReader don't model that yet). IMPERATIVE alone remains
 * unpopulated: an imperative clause has no subject at all ("Stop."),
 * which needs its own ClauseTemplate (subjectRequired=false), not just
 * a new terminal-punctuation set -- still Phase 2. A sentence that
 * matches no populated template is reported INVALID/UNRESOLVED rather
 * than guessed.
 *
 * Ported from linguistics/data/sentence_type.py. */
export enum SentenceType {
  DECLARATIVE = 0,
  INTERROGATIVE = 1,
  IMPERATIVE = 2,
  EXCLAMATORY = 3,
}
