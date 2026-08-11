import { copyWordWithFreshUuid, type Word } from "./word";

/** Lexicon storage layer: the top-level container aggregating Word
 * records for a language (Vocabulary Layer developer specification,
 * 3). Ported from vocabulary/data/dictionary.py -- the Python version
 * is thread-safe (a lock around every access); JavaScript's
 * single-threaded execution model gives that guarantee for free, so no
 * lock is ported.
 *
 * Python's `lookup_all`/`find_by_uuid` are a linear scan over every
 * Word (`for word in self.words if ...`), which is fine for a batch
 * script that calls them a handful of times. This port calls them from
 * a live, interactive page instead -- DictionaryView.wordRecords()
 * alone calls the equivalent of lookupAll once per definition word
 * across every Word in the Dictionary, and RelationshipSeeder.resolve()
 * calls it once per cached relationship (thousands, against thousands
 * of Words) -- so a linear scan here is quadratic overall and was
 * measured freezing the page for several seconds on the real Common
 * Vocabulary Cache (~3,100 words, ~6,100 relationships). `byText`/
 * `byUuid` keep the exact same lookup() and lookupAll() behaviour
 * (case-insensitive text match, first-seeded-wins default, every
 * homograph returned) but backed by a hash map instead of a scan. */
export class Dictionary {
  private words: Word[] = [];
  private readonly byText = new Map<string, Word[]>();
  private readonly byUuid = new Map<string, Word>();

  all(): readonly Word[] {
    return this.words.slice();
  }

  lookup(text: string): Word | undefined {
    const matches = this.lookupAll(text);
    return matches.length > 0 ? matches[0] : undefined;
  }

  /** Returns every Word whose surface text matches `text`
   * (case-insensitive) -- every homograph, not just the first. A word
   * with more than one legitimate part of speech (e.g. "run" as NOUN
   * vs VERB), or more than one meaning under the exact same (text,
   * partOfSpeech) (a word-sense conflict, 9.2), is modelled as multiple
   * Word entries (4.1: "one lexical form in one language and one
   * grammatical category"), each sharing the same unmodified `text`
   * and `lexicalForm` but each with its own `entryId` -- lookup() only
   * ever surfaces the first such entry; this is how the rest become
   * visible too. */
  lookupAll(text: string): readonly Word[] {
    return this.byText.get(text.toLowerCase())?.slice() ?? [];
  }

  findByUuid(wordId: string): Word | undefined {
    return this.byUuid.get(wordId);
  }

  append(word: Word): void {
    this.words.push(word);
    const key = word.text.toLowerCase();
    const bucket = this.byText.get(key);
    if (bucket) bucket.push(word);
    else this.byText.set(key, [word]);
    this.byUuid.set(word.uuid.value, word);
  }

  totalEntries(): number {
    return this.words.length;
  }

  /** Bootstraps this Dictionary with a copy of every Word in `other` --
   * used to seed a newly created Domain's Dictionary from the reserved
   * Common Domain's Dictionary. Each Word is shallow-copied so the two
   * Domains never share a mutable Word instance, and given a freshly
   * generated uuid -- a shallow copy shares the *same* Identifier
   * object (and so the same uuid.value) as the original otherwise,
   * which would give two different Domains' copies of "be" the
   * identical per-Domain-graph identity. `entryId` is deliberately left
   * untouched by the shallow copy: it's the stable Qualified Word
   * Identity, the same underlying Common Vocabulary Cache entry
   * regardless of how many Domains hold their own runtime copy of it. */
  seedFrom(other: Dictionary): void {
    for (const word of other.words) {
      this.append(copyWordWithFreshUuid(word));
    }
  }
}
