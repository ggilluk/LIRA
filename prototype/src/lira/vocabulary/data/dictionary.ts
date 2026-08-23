import type { Word } from "./entities/word";
// Known, approved exception to data/ never importing role/ -- see
// role/word_processor.ts's own docstring: copyWordWithFreshUuid() is
// Word's own base-entity copier, needed here the same way every POS
// processor already needs it.
import { copyWordWithFreshUuid } from "../role/word_processor";

/** One inflected form linked to a base lemma (or, from lemmaOf's own
 * side, one base lemma linked to a form) -- Dictionary.linkForm/
 * formsOf/lemmaOf's own record shape. `derivationKinds` mirrors
 * relationships/morphological_relationships.json's own
 * `relationship_kind` vocabulary (LEMMA_FORM itself never appears
 * here, same reasoning as WordFileFormEntry.derivation_kinds); more
 * than one kind covers a single surface form legitimately satisfying
 * more than one inflectional role against the same base (most regular
 * English verbs' past tense and past participle are identical --
 * "measured" is both). */
export interface LemmaFormLink {
  word: Word;
  derivationKinds: readonly string[];
}

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
 * homograph returned) but backed by a hash map instead of a scan.
 *
 * `formsByBase`/`baseByForm` are this prototype's own addition (no
 * Python equivalent -- see word_seeder.ts's own module docstring on
 * the schema divergence this optimises): an O(1) lemma <-> inflected-
 * form index, populated by WordSeeder.seedClosedClassWords/seedFrom
 * from the nested `forms` grouping in the word-file JSON, so
 * "what forms does this lemma have" / "what lemma is this form of"
 * never needs a scan over LexicalRelationshipStore's morphological
 * edges (that store, and Word's own related-word derived properties,
 * are untouched -- this index is purely additive). Keyed by Word.uuid
 * (this Dictionary's own runtime identity for each Word, not the
 * persistent entryId), since formsOf/lemmaOf take and return live Word
 * instances that must actually belong to this Dictionary. */
export class Dictionary {
  private words: Word[] = [];
  private readonly byText = new Map<string, Word[]>();
  private readonly byUuid = new Map<string, Word>();
  private readonly formsByBase = new Map<string, LemmaFormLink[]>();
  private readonly baseByForm = new Map<string, LemmaFormLink>();
  private maxPhraseSpan = 1;

  all(): readonly Word[] {
    return this.words.slice();
  }

  /** The greatest number of whitespace-separated words any appended
   * Word's own `text` spans -- e.g. 3 once "in spite of" has been
   * appended. DictionaryProcessor.identifyPhrase uses this as its
   * longest-match search bound, so a phrase lookup never probes further
   * ahead than any entry could possibly need (Design Principle 1 treats
   * a multi-word closed-class item like "in spite of" or "each other"
   * as one independent lexical form / one Word, same as a single-word
   * entry -- this is what lets that Word actually get recognised as one
   * unit while reading, instead of only being reachable by looking up
   * its exact multi-word text directly). 1 when nothing multi-word has
   * been appended yet, so a Dictionary with no phrase entries costs
   * nothing extra at lookup time. */
  get phraseSpanLimit(): number {
    return this.maxPhraseSpan;
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

    const wordCount = key.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > this.maxPhraseSpan) this.maxPhraseSpan = wordCount;
  }

  totalEntries(): number {
    return this.words.length;
  }

  /** Records that `form` is an inflected form of base lemma `base`
   * (WordSeeder.seedClosedClassWords's own call site, driven by the
   * word-file JSON's nested `forms` grouping -- see this class's own
   * docstring). Both Words must already belong to this Dictionary
   * (i.e. already appended); linking never appends anything itself. */
  linkForm(base: Word, form: Word, derivationKinds: readonly string[]): void {
    const link: LemmaFormLink = { word: form, derivationKinds };
    const bucket = this.formsByBase.get(base.uuid.value);
    if (bucket) bucket.push(link);
    else this.formsByBase.set(base.uuid.value, [link]);
    this.baseByForm.set(form.uuid.value, { word: base, derivationKinds });
  }

  /** Every inflected form linked to `base` (e.g. "judge" ->
   * "judged"/"judging"/"judges"), each tagged with how it relates --
   * O(1) via this Dictionary's own lemma index. Empty for a word with
   * no known inflected forms, or one that IS itself an inflected form
   * of something else (see lemmaOf) -- a Word is never both in this
   * prototype's own nesting (asset_loader.ts's own WordFileEntry.forms
   * docstring: only ever one level deep). */
  formsOf(base: Word): readonly LemmaFormLink[] {
    return this.formsByBase.get(base.uuid.value)?.slice() ?? [];
  }

  /** The base lemma `form` is an inflected form of, if any -- the
   * reverse of formsOf. */
  lemmaOf(form: Word): LemmaFormLink | undefined {
    return this.baseByForm.get(form.uuid.value);
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
   * regardless of how many Domains hold their own runtime copy of it.
   *
   * `other`'s own lemma index is replayed onto the fresh copies too
   * (looked up by `other`'s original Word instances, re-linked via the
   * uuid -> copy map this builds along the way) -- without this,
   * Physics's own inherited Dictionary would silently lose every
   * formsOf/lemmaOf link Common had, even though every Word itself
   * carried over correctly. */
  seedFrom(other: Dictionary): void {
    const copyByOriginalUuid = new Map<string, Word>();
    for (const word of other.words) {
      const copy = copyWordWithFreshUuid(word);
      this.append(copy);
      copyByOriginalUuid.set(word.uuid.value, copy);
    }
    for (const word of other.words) {
      const copy = copyByOriginalUuid.get(word.uuid.value);
      if (!copy) continue;
      for (const link of other.formsOf(word)) {
        const formCopy = copyByOriginalUuid.get(link.word.uuid.value);
        if (formCopy) this.linkForm(copy, formCopy, link.derivationKinds);
      }
    }
  }
}
