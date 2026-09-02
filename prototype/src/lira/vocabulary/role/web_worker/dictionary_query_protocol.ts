/** Message protocol over the direct MessagePort the Vocabulary Service
 * worker (vocabulary_worker.ts) and the Linguistic Service worker
 * (linguistics_worker.ts) share -- established once by the main thread
 * (main.ts creates one MessageChannel and transfers one port to each
 * worker via each one's own regular postMessage protocol), then used
 * peer-to-peer with no further main-thread involvement.
 *
 * This exists so the Linguistic Service can resolve raw text against
 * the Vocabulary Service's own real seeded Dictionary/Phrases/WordForms
 * instead of maintaining an independent copy of its own -- see
 * linguistics_worker.ts's own module docstring on why it used to (a
 * second WordSeeder pass, capped at the Common Vocabulary Cache's own
 * closed-class words, permanently blind to WordNet) and why that's
 * gone now.
 *
 * Deliberately request/response over raw text, not "give me your whole
 * Dictionary": `LookupWordsRequest.texts` is every candidate
 * (whitespace-joined) span the Linguistic Service is about to probe for
 * one read -- DictionaryProcessor.identifyPhrase's own longest-match
 * search bound (dictionary_processor.ts's own docstring) keeps that set
 * small (a handful of n-grams per token position, not the whole input
 * text's own power set) -- so one round trip per read call covers
 * everything that read could possibly need, without ever transferring
 * the Vocabulary Service's full seeded Dictionary (tens of thousands of
 * Words once WordNet is loaded) over the wire. */

import type { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Word } from "../../data/entities/word";
import type { WordForm } from "../../data/entities/word_form";
import type { Phrase } from "../../data/entities/phrase";

export interface LookupWordsRequest {
  type: "lookup-words";
  requestId: string;
  /** Which Domain to query -- "Common", matching the one Domain name
   * the Linguistic Service has ever addressed (linguistics_worker.ts's
   * own hardcoded DictionaryProcessor domainName). */
  domain: string;
  /** Every distinct (already-lowercased) whitespace-joined span the
   * requesting read is about to check -- both single tokens and every
   * multi-word n-gram identifyPhrase's own search would try. */
  texts: readonly string[];
}

/** Every real Word/WordForm/Phrase match this Domain's own Dictionary/
 * WordForms/Phrases stores have for any of `LookupWordsRequest.texts` --
 * real, plain-data entity objects (Word/WordForm/Phrase are all plain
 * interfaces, no class instances or functions on them), sent as-is
 * through the MessagePort's own structured-clone transfer with no
 * custom serialisation needed. The requester reconstructs its own
 * local Dictionary/WordForms/Phrases by inserting these (deduplicated
 * by `entryId`) rather than re-deriving them from raw cache files.
 *
 * `words` covers every exact-spelling match (`Dictionary.lookupAll`)
 * -- including an ordinary multi-word WordNet Word ("toy poodle"),
 * which is seeded into Dictionary directly, not Phrases
 * (dictionary_processor.ts's own docstring on that split). `wordForms`
 * covers every inflected-spelling match (`WordForms.lookupByText`) --
 * each paired with the Word it belongs to, since a caller reconstructing
 * a local WordForms store needs both to call registerMember(form, word).
 * `phrases` covers every closed-class multi-word idiom match
 * (`Phrases.lookupAll`) -- "each other", "in spite of", the small
 * closed set Phrases itself holds -- each paired with its own
 * `partOfSpeech`, since `Phrases` keeps that in a private side index
 * rather than on `Phrase` itself (`Phrases.append()`'s own signature,
 * data/phrases.ts), so a caller rebuilding a local `Phrases` store
 * needs it to call `append()` correctly. */
export interface LookupWordsResult {
  type: "lookup-words-result";
  requestId: string;
  words: readonly Word[];
  wordForms: readonly { word: Word; form: WordForm }[];
  phrases: readonly { phrase: Phrase; partOfSpeech: PartOfSpeech }[];
}

export interface LookupWordsError {
  type: "lookup-words-error";
  requestId: string;
  message: string;
}

export type DictionaryQueryRequest = LookupWordsRequest;
export type DictionaryQueryResponse = LookupWordsResult | LookupWordsError;
