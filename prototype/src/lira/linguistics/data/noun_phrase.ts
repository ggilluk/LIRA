/** NounPhrase: this layer's own Phrase (data/phrase.ts) narrowed by
 * `phraseType` -- the same discriminant-narrowing pattern
 * MainClause/SubordinateClause already use over Clause.clauseType
 * (main_clause.ts's own docstring), applied here to PhraseType instead
 * of ClauseType. Distinct from Vocabulary's own, differently-shaped
 * NounPhrase (vocabulary/data/entities/noun_phrase.ts) -- that one
 * narrows a *stored lexicon entry*; this one narrows a *live parse
 * result* PhraseReader.read() actually returns (this layer's own
 * Phrase, not Vocabulary's -- see phrase.ts's own docstring on that
 * split). No `create*()` constructor here the way Vocabulary's own
 * subtype files each have one: nothing in this layer ever constructs a
 * Phrase for one specific PhraseType directly -- PhraseReader.buildPhrase()
 * is the one real construction site, and it assigns `phraseType` from
 * whichever SequencePath won, generically, never through a
 * per-PhraseType constructor. */

import type { Phrase } from "./phrase";
import { PhraseType } from "./phrase_type";

export interface NounPhrase extends Phrase {
  phraseType: PhraseType.NOUN_PHRASE;
}

export function isNounPhrase(phrase: Phrase): phrase is NounPhrase {
  return phrase.phraseType === PhraseType.NOUN_PHRASE;
}
