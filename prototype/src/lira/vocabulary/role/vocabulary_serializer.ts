import type { Dictionary } from "../data/dictionary";
import type { Phrases } from "../data/phrases";
import type { WordForms } from "../data/word_forms";
import type { Senses } from "../data/senses";

/** Rebuilds `WordForms.formsByWordId` and `Senses.membersBySenseId` --
 * the two side-indexes no single store's own `loadFromFile()` can
 * rebuild by itself, since both mirror pointer fields that live on the
 * *other* side (`Word.wordFormIds`, and a Word's own senses via
 * `WordForms.senseIdsOf()`/a Phrase's own `senseIds`) rather than on
 * anything `WordForms`/`Senses` own directly -- each store's own
 * `saveToFile()` docstring calls this out as the same "known, accepted
 * gap" `WordForms.seedFrom()` already has for cross-Domain copies,
 * solved one layer up instead of inside either store.
 *
 * Call once, after `Dictionary.loadFromFile()`/`Phrases.loadFromFile()`/
 * `WordForms.loadFromFile()`/`Senses.loadFromFile()` have all already
 * run for the same Domain -- every pointer this function follows
 * (`word.wordFormIds`, `phrase.senseIds`) is assumed already correct
 * (loaded verbatim, not regenerated), so this only ever rebuilds
 * *lookup* indexes over that data, never mutates the pointers
 * themselves. `registerMember()` on both stores is already idempotent
 * (their own docstrings), so calling this against a Domain that was
 * never actually loaded from a file -- only ever seeded normally -- is
 * always safe too, just a no-op replay of links that already exist.
 *
 * Order matters: the Word-senses pass reads `wordForms.senseIdsOf(word)`,
 * which itself reads `formsByWordId` -- so `formsByWordId` must already
 * be rebuilt (the first loop) before the second loop runs. */
export function relinkAfterLoad(dictionary: Dictionary, phraseBook: Phrases, wordForms: WordForms, senses: Senses): void {
  for (const word of dictionary.all()) {
    for (const ref of word.wordFormIds) {
      const form = wordForms.findByUuid(Number(ref.value));
      if (form) wordForms.registerMember(form, word);
    }
  }
  for (const word of dictionary.all()) {
    for (const senseId of wordForms.senseIdsOf(word)) {
      const sense = senses.findByUuid(Number(senseId.value));
      if (sense) senses.registerMember(sense, word);
    }
  }
  for (const phrase of phraseBook.all()) {
    for (const senseId of phrase.senseIds) {
      const sense = senses.findByUuid(Number(senseId.value));
      if (sense) senses.registerMember(sense, phrase);
    }
  }
}
