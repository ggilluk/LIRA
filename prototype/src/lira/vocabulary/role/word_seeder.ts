/** Loads the Common Vocabulary Cache (vocabulary/assets/common/<language>/)
 * and seeds Dictionaries with it. The cache is not the authoritative
 * source of a Word -- see vocabulary/assets/common/en/README.md.
 *
 * Ported from vocabulary/role/word_seeder.py. Python reads the cache
 * from the filesystem at run time and can write promoted_words.json /
 * manifest.json back to disk (promoteWord, demoteWord, and
 * validateAssets' own self-healing create-if-missing behaviour); a
 * browser has no writable filesystem, so this port's promoteWord/
 * demoteWord mutate an in-memory overlay of promoted_words.json only
 * -- the change is visible to this WordSeeder instance for the rest of
 * the session (loadCache() picks it up immediately) but is never
 * persisted, and validateAssets() here only checks consistency, it
 * never fabricates a missing file.
 *
 * Schema divergence from Python (this prototype's assets only --
 * asset_loader.ts's own WordFileEntry.forms docstring): a base lemma's
 * word file entry may nest its own inflected forms under a `forms`
 * array instead of every surface form living as an independent
 * top-level entry. `loadCache()` flattens every nested form back into
 * its own top-level Word exactly as if it had never been nested (the
 * seeded Dictionary ends up with the identical set of Words either
 * way), while also recording which base each flattened form came from
 * (`formLinks`) so `seedClosedClassWords` can wire that grouping into
 * the target Dictionary's own lemma index (Dictionary.linkForm/
 * formsOf/lemmaOf) once both ends of a link have actually been
 * inserted. */

import { PartOfSpeech } from "../data/part_of_speech";
import { RegisterCode } from "../data/register_code";
import { EditorialLabel } from "../data/editorial_label";
import { HolonymRootWord } from "../data/holonym_root_word";
import { HypernymRootWord } from "../data/hypernym_root_word";
import { InterrogativeRootWord } from "../data/interrogative_root_word";
import { VectorPrimitiveRootWord } from "../data/vector_primitive_root_word";
import type { Text } from "../../value_objects";
import type { AttributeValue } from "../data/attribute_value";
import type { Dictionary } from "../data/dictionary";
import { LexicalRelationshipStore } from "../data/lexical_relationship_store";
import { LexicalRelationshipType, MERONYM_KIND_QUALIFIER, relationshipGroup, type MeronymKind } from "../data/lexical_relationship_type";
import { copyPhraseWithFreshUuid, createPhrase, type Phrase } from "../data/phrase";
import type { PhraseBook } from "../data/phrase_book";
import { createSense, type Sense } from "../data/sense";
import type { SenseStore } from "../data/sense_store";
import type { SourceReference } from "../data/source_reference";
import { copyWordWithFreshUuid, createWord, type Word } from "../data/word";
import {
  languageHasCommonCache,
  readWordDirJson,
  readWordFile,
  type WordFileDocument,
  type WordFileEntry,
  type WordManifestDocument,
} from "./asset_loader";
import type { LexicalRelationshipProcessor } from "./lexical_relationship_processor";
import { loadWordNetSynsets, type WordNetPointer, type WordNetSynset } from "./wordnet_loader";

/** createEdges' own pair-member type -- a LexicalRelationship's
 * sourceWordId/targetWordId are opaque uuid strings regardless of what
 * they name, so createEdges itself only ever reads `.uuid.value` off
 * each side; ordinarily that's a Word or Phrase, but seedPointerRelationship's
 * own semantic-group-and-synset-wide branch (that method's own docstring)
 * creates a single Sense-to-Sense edge instead of a member×member cross
 * product, so this union includes Sense too. */
type RelationshipEndpoint = Word | Phrase | Sense;

/** One flattened nested form's link back to its base lemma, keyed by
 * entryId (the stable Qualified Word Identity, unaffected by
 * copyWithFreshUuid) rather than by Word/uuid directly, since loadCache()
 * builds this before any Dictionary-specific copy exists yet --
 * seedClosedClassWords resolves entryId -> the copy it just inserted. */
interface FormLink {
  baseEntryId: string;
  formEntryId: string;
  derivationKinds: readonly string[];
}

export const MANDATORY_FILES = [
  "determiners.json",
  "pronouns.json",
  "auxiliaries.json",
  "prepositions.json",
  "coordinating_conjunctions.json",
  "subordinating_conjunctions.json",
  "particles.json",
  "punctuation.json",
  // symbols.json and numerals.json are appended last, not
  // alphabetically or arbitrarily: numerals.json's "one" is a homograph
  // of pronouns.json's existing "one" (indefinite PRONOUN, "one should
  // always...") -- pronouns.json must load first so PRONOUN stays
  // Dictionary.lookup()'s default.
  "symbols.json",
  "numerals.json",
] as const;

// Supplementary files: authored, validated, and always loaded/seeded
// like MANDATORY_FILES, but NOT counted toward the mandatory
// closed-class total -- open-class metalinguistic terms, not
// closed-class function words. Order matters: metalinguistic_nouns.json
// must load before metalinguistic_verbs.json ("cause"/"result" homograph),
// and MANDATORY_FILES always loads before SUPPLEMENTARY_FILES in full.
//
// root_words.json loads first -- the first (NOUN) words this cache
// seeds under the new Interrogative/Hypernym/Holonym/Vector-Primitive
// root word table (data/interrogative_root_word.ts's own docstring).
// Several of its 25 entries are deliberate homographs of an existing
// NOUN sense seeded elsewhere (e.g. "operation" already exists in
// promoted_words.json) -- each root_words.json entry carries its own
// domainTag ("root_word.common") specifically so validateAssets()'s
// duplicate (lexicalForm, partOfSpeech, domainTag) check treats it as
// legitimate polysemy rather than a collision (Word.domainTag's own
// docstring). One real, accepted trade-off: Dictionary.lookup()'s
// "first entry wins" default (word_seeder.ts's own numerals.json
// comment above) means a homograph here becomes the *default* sense
// for that (text, partOfSpeech) pair -- promoted_words.json always
// loads last regardless of this list's own order (loadCache() below),
// so there is no position in SUPPLEMENTARY_FILES that avoids this for
// the handful of words root_words.json shares with promoted_words.json.
// The one caller sensitive to that default (RelationshipSeeder's
// POS-less lookup fallback, role/relationship_seeder.ts) still resolves
// to a valid same-text-same-partOfSpeech Word either way -- see the
// full test suite, exercised against this exact bundled cache, for
// confirmation nothing actually broke.
export const SUPPLEMENTARY_FILES = [
  "root_words.json",
  "metalinguistic_nouns.json",
  "metalinguistic_verbs.json",
  "metalinguistic_adjectives.json",
  "metalinguistic_adverbs.json",
  "metalinguistic_proper_nouns.json",
  "metalinguistic_interjections.json",
] as const;

export const PROMOTED_FILE = "promoted_words.json";
export const MANIFEST_FILE = "manifest.json";
const OPEN_CLASSES = [PartOfSpeech.NOUN, PartOfSpeech.VERB, PartOfSpeech.ADJECTIVE, PartOfSpeech.ADVERB];

// root_words.json's own domainTag (that file's SUPPLEMENTARY_FILES
// comment above, and Word.domainTag's) -- seedClosedClassWords' one
// carve-out from skipping every OPEN_CLASSES Word: this doesn't name
// general vocabulary coverage, it names the curated Interrogative/
// Hypernym/Holonym/Vector-Primitive root-word table, and already exists
// specifically so these 25 NOUN entries coexist as deliberate homographs
// alongside WordNet's own senses rather than colliding with (or being
// skipped in favour of) them.
const ROOT_WORD_DOMAIN_TAG = "root_word.common";

// seedWordNet's own constants -- see that method's docstring.
const WORDNET_SOURCE_REFERENCE: SourceReference = {
  sourceName: { value: "Princeton WordNet 3.1" },
  sourceVersion: { value: "3.1" },
  referenceUri: { value: "https://wordnet.princeton.edu/" },
  licenceIdentifier: { value: "Princeton WordNet License" },
};
const WORDNET_SYNSET_ID_SCHEME = {
  schemeId: "wn31",
  schemeAgencyName: "Princeton University",
  schemeUri: "https://wordnet.princeton.edu/",
} as const;
// Every SYNONYM edge seedWordNet creates comes straight from WordNet
// synset membership, a curated linguistic fact, not an inference with
// genuine uncertainty attached -- same as-good-as-certain weight
// RelationshipSeeder uses for its own curated relationships
// (relationship_seeder.ts's own SEEDER_DEFAULT_WEIGHT). 0.9999 rather
// than a literal 1.0: certainty is never asserted as exactly 1.0.
const WORDNET_SEEDER_DEFAULT_WEIGHT = 0.9999;
// How often seedWordNet's own onProgress fires, in synsets processed --
// about 59 calls across the full ~117,800-synset dataset. Frequent
// enough for a progress bar to read as continuously moving, far below
// the per-postMessage-call overhead becoming visible against the
// per-synset work it's reporting on.
const PROGRESS_REPORT_INTERVAL = 2000;

// Pointer symbols relationshipKindForPointer resolves to the SAME kind
// regardless of which of a pair's two synsets a pointer was read from
// (WordNet lists "!"/"$"/"="/"^" symmetrically on both ends -- unlike
// the complementary-kind pairs that method's own docstring already
// canonicalizes via `swap` (HYPERNYM/HYPONYM, xMERONYM/xHOLONYM), a
// same-kind pair can't be caught by the exact (source, target, kind)
// triple `existingEdges` key alone -- source and target are simply
// swapped, kind is identical either way. createEdges() checks the
// reversed pair for these kinds too before creating a second, redundant
// edge for what both pointers describe as the identical fact.
const SYMMETRIC_RELATIONSHIP_KINDS: ReadonlySet<LexicalRelationshipType> = new Set([
  LexicalRelationshipType.ANTONYM,
  LexicalRelationshipType.VERB_GROUP,
  LexicalRelationshipType.ATTRIBUTE,
  LexicalRelationshipType.ALSO_SEE,
  // derivationKind()'s own fallback for a `+`/`<` pointer whose target
  // isn't noun/adjective/adverb -- when *both* ends of a derivation
  // pair fall to that same fallback (rather than one side resolving to
  // NOMINALISATION/ADJECTIVAL_DERIVATION/ADVERBIAL_DERIVATION), the
  // reciprocal pointer read from the other word's own synset produces
  // the identical (source, target) swapped under the identical kind.
  LexicalRelationshipType.DERIVED_FORM,
]);

/** `+`/`<`'s own shared rule: which Derivation-category kind
 * (lexical_relationship_type.ts) a cross-word derivation pointer becomes,
 * chosen by the *target* word's own part of speech -- WordNet's pointer
 * data names two related words without saying which specific
 * derivational relationship holds between them (no "agent noun" vs
 * "action noun" flag the way root_words.json's own curated entries can
 * carry), so this is a coarser, POS-driven rule rather than a lookup
 * against WordNet's own richer semantics: NOMINALISATION for a NOUN
 * target, ADJECTIVAL_DERIVATION for ADJECTIVE, ADVERBIAL_DERIVATION for
 * ADVERB, DERIVED_FORM (the generic catch-all) for anything else,
 * including a same-part-of-speech pair (WordNet's `+` occasionally
 * links two senses of the same word rather than crossing categories). */
function derivationKind(sourcePos: PartOfSpeech, targetPos: PartOfSpeech): LexicalRelationshipType {
  if (targetPos === sourcePos) return LexicalRelationshipType.DERIVED_FORM;
  switch (targetPos) {
    case PartOfSpeech.NOUN:
      return LexicalRelationshipType.NOMINALISATION;
    case PartOfSpeech.ADJECTIVE:
      return LexicalRelationshipType.ADJECTIVAL_DERIVATION;
    case PartOfSpeech.ADVERB:
      return LexicalRelationshipType.ADVERBIAL_DERIVATION;
    default:
      return LexicalRelationshipType.DERIVED_FORM;
  }
}

/** Maps one WordNet pointer symbol (WordNetPointer.symbol, wordnet_loader.ts)
 * onto the LexicalRelationshipType it becomes, given the pointer's own
 * source and target synsets' parts of speech -- `undefined` for a
 * symbol this class doesn't recognise (none as of WordNet 3.1's own
 * documented pointer set, but seedWordNetPointerRelationships skips
 * rather than throws, so a future WordNet release adding a new symbol
 * degrades to "not seeded" instead of failing the whole run); for
 * `;c`/`-c` specifically, which seedPointerRelationship intercepts
 * before ever calling this function -- a topic-domain pointer tags the
 * word itself (Word.domainTag/relatedDomainTags) rather than becoming a
 * TOPIC_DOMAIN relationship edge; see tagTopicDomain's own docstring;
 * `;r`/`-r`/`;u`/`-u` (region/usage domain) are unaffected by that
 * change and still become REGION_DOMAIN/USAGE_DOMAIN edges below; *or*
 * for `@i`/`~i` (instance-of, as opposed to `@`/`~`'s own class-
 * inclusion hypernymy/hyponymy) deliberately, on the same "not a
 * lexical fact worth drawing a distinction over" grounds
 * LexicalRelationshipType's own retired INSTANCE_HYPERNYM/
 * INSTANCE_HYPONYM ordinals explain (lexical_relationship_type.ts).
 *
 * `swap: true` means the edge WordNet's own record implies runs target
 * -> source, not source -> target -- true for `-r`/`-u` ("member of
 * this domain", the reciprocal listing of `;r`/`;u` "domain of synset"
 * recorded on the *other* synset's own entry; both symbols become the
 * same REGION_DOMAIN/USAGE_DOMAIN kind, always oriented word -> its
 * domain, regardless of which of the pair's two entries the pointer was
 * actually read from) -- and, for the same reason, for `~`/`%p`/`%m`/
 * `%s` too: WordNet redundantly encodes every hypernym/meronym fact
 * from BOTH ends -- the child/part's own `@`/`#p`/`#m`/`#s` pointer to
 * its parent/whole, *and* the parent/whole's own `~`/`%p`/`%m`/`%s`
 * pointer back to each child/part -- so canonicalizing the second
 * listing onto the exact same kind, swapped, means both pointers
 * resolve to the identical (child, HYPERNYM, parent) / (part, MERONYM,
 * whole) edge; the existing `existingEdges` dedup in seedWordNet (keyed
 * by the exact (source, target, kind) triple) then recognises whichever
 * pointer is processed second as already covered, instead of creating a
 * second, fully redundant HYPONYM/TROPONYM/HOLONYM edge for the
 * identical fact -- the "a word's own relationships also show the
 * hypernyms of its hyponyms" bug this fix addresses (vocabulary.test.ts's
 * own regression check on the resulting counts). Verb-specific
 * troponymy (WordNet's own name for verb hyponymy, still marked `~`)
 * canonicalizes the same way: its own `@` counterpart is already
 * POS-agnostic HYPERNYM, so there's no separate TROPONYM case to keep
 * here either.
 *
 * `%p`/`%m`/`%s` (not `#p`/`#m`/`#s`) are the ones that get `swap: true`
 * here -- easy to get backwards, since it looks like the mirror image of
 * `@`/`~` at a glance. Verified directly against the bundled dict/
 * files: "hand" (05572223, the whole) carries `%p 05574137` (finger,
 * the part) on its own entry, while "finger" (05574137, the part)
 * carries `#p 05572223` (hand, the whole) back -- so `%p`/`%m`/`%s`
 * behave like `~` (recorded on the broader/container entry, pointing
 * down at what it contains), and `#p`/`#m`/`#s` behave like `@`
 * (recorded on the specific/contained entry, pointing up at what
 * contains it), not the other way around.
 *
 * `meronymKind`, set only for the six meronym/holonym symbols, is the
 * MERONYM_KIND_QUALIFIER value seedPointerRelationship attaches to the
 * resulting edge's own `qualifiers` -- MERONYM's own docstring
 * (lexical_relationship_type.ts) on why "part of a larger whole" vs.
 * "member of a group" vs. "substance a whole is made of" is a property
 * of one MERONYM fact, not three separate relationship kinds. */
function relationshipKindForPointer(
  symbol: string,
  sourcePos: PartOfSpeech,
  targetPos: PartOfSpeech,
): { kind: LexicalRelationshipType; swap: boolean; meronymKind?: MeronymKind } | undefined {
  switch (symbol) {
    case "!":
      return { kind: LexicalRelationshipType.ANTONYM, swap: false };
    case "@":
      return { kind: LexicalRelationshipType.HYPERNYM, swap: false };
    case "~":
      return { kind: LexicalRelationshipType.HYPERNYM, swap: true };
    // `@i`/`~i` (instance-of) fall through to `default` -- deliberately
    // unrecognised, not seeded (this function's own docstring above).
    case "%p":
      return { kind: LexicalRelationshipType.MERONYM, swap: true, meronymKind: "part" };
    case "%m":
      return { kind: LexicalRelationshipType.MERONYM, swap: true, meronymKind: "member" };
    case "%s":
      return { kind: LexicalRelationshipType.MERONYM, swap: true, meronymKind: "substance" };
    case "#p":
      return { kind: LexicalRelationshipType.MERONYM, swap: false, meronymKind: "part" };
    case "#m":
      return { kind: LexicalRelationshipType.MERONYM, swap: false, meronymKind: "member" };
    case "#s":
      return { kind: LexicalRelationshipType.MERONYM, swap: false, meronymKind: "substance" };
    case "*":
      return { kind: LexicalRelationshipType.ENTAILMENT, swap: false };
    case ">":
      return { kind: LexicalRelationshipType.CAUSE, swap: false };
    case "^":
      return { kind: LexicalRelationshipType.ALSO_SEE, swap: false };
    case "$":
      return { kind: LexicalRelationshipType.VERB_GROUP, swap: false };
    case "&":
      return { kind: LexicalRelationshipType.SIMILAR_TO, swap: false };
    case "=":
      return { kind: LexicalRelationshipType.ATTRIBUTE, swap: false };
    case "\\":
      return { kind: LexicalRelationshipType.PERTAINYM, swap: false };
    case "+":
    case "<":
      return { kind: derivationKind(sourcePos, targetPos), swap: false };
    case ";r":
      return { kind: LexicalRelationshipType.REGION_DOMAIN, swap: false };
    case ";u":
      return { kind: LexicalRelationshipType.USAGE_DOMAIN, swap: false };
    case "-r":
      return { kind: LexicalRelationshipType.REGION_DOMAIN, swap: true };
    case "-u":
      return { kind: LexicalRelationshipType.USAGE_DOMAIN, swap: true };
    default:
      return undefined;
  }
}

/** The single Word at WordNetPointer's own 1-based `sourceWordIndex`/
 * `targetWordIndex` within `members` (that synset's own words, in the
 * same order as WordNetSynset.lemmas) -- empty, not a thrown error, if
 * the index is out of range (defensive only; every real WordNet 3.1
 * lexical pointer names a word position that exists in the synset it
 * names). Wrapped in an array, not returned bare, so
 * seedPointerRelationship's own sourceWords/targetWords stay uniform
 * whether a pointer was synset-level (the whole `members` array) or
 * lexical (this one-or-zero-element result). */
function indexedWord(members: readonly (Word | Phrase)[], oneBasedIndex: number): readonly (Word | Phrase)[] {
  const word = members[oneBasedIndex - 1];
  return word === undefined ? [] : [word];
}

/** Applies one topic-domain tag to `target` -- shared by tagTopicDomain's
 * own Sense-level (synset-wide `;c`/`-c` pointer) and Word/Phrase-level
 * (word-specific pointer) paths, since Sense/Word/Phrase all share the
 * identical domainTag/relatedDomainTags shape. The first topic found for
 * `target` sets domainTag; any different one after that is appended to
 * relatedDomainTags instead of silently dropped. Idempotent on a re-seed
 * with the identical tag -- both branches are no-ops the second time,
 * so no separate "already processed" tracking is needed. */
function applyDomainTag(target: { domainTag?: Text; relatedDomainTags: readonly Text[] }, categoryLemma: string): void {
  if (target.domainTag === undefined) {
    target.domainTag = { value: categoryLemma };
  } else if (target.domainTag.value !== categoryLemma && !target.relatedDomainTags.some((tag) => tag.value === categoryLemma)) {
    target.relatedDomainTags = [...target.relatedDomainTags, { value: categoryLemma }];
  }
}

/** Gives `entry` (a freshly-inserted Common Vocabulary Cache Word/Phrase
 * copy, seedClosedClassWords' own call sites) its own unique Sense --
 * one per entry, never shared with any other Word/Phrase, unlike
 * WordNet's own per-synset Sense (this cache has no synset/synonym-set
 * concept of its own to group entries by). A deliberate "for now"
 * stopgap so every seeded Word/Phrase has *a* Sense to resolve through
 * (DictionaryView's own domainTagsFor(), in particular -- without this,
 * a hand-curated entry's `senseId` stays undefined and every Sense-aware
 * reader silently falls back to reading the Word/Phrase's own fields
 * instead), not a claim that N hand-curated entries sharing a meaning
 * now share one Sense the way WordNet synonyms do -- that grouping still
 * lives entirely in RelationshipSeeder's own SYNONYM edges, untouched by
 * this. Carries over every Sense-owned field the entry already holds
 * (domainTag, relatedDomainTags, definition, gloss, usageNotes,
 * sourceReferences, isCommon) so a Sense-aware reader sees the identical
 * picture it would have read from the Word/Phrase directly -- both
 * copies exist side by side afterwards (the entry's own fields are left
 * exactly as they were), the same accepted duplication WordNet's own
 * Sense/Word split still carries for definition/usageNotes today. */
function registerUniqueSense(senseStore: SenseStore, entry: Word | Phrase): void {
  // Phrase has no root-word concept at all (root_words.json's own 25
  // entries are all single-word NOUNs) -- the `"words" in entry` check
  // (word.ts's own relatedWords()/addCandidate() use the identical
  // Phrase-vs-Word discriminator) is what tells the two apart here,
  // since a Phrase's own `words` field doesn't exist on Word.
  const isWord = !("words" in entry);
  const sense = createSense({
    domainTag: entry.domainTag,
    relatedDomainTags: entry.relatedDomainTags,
    definition: entry.definition,
    gloss: entry.gloss,
    usageNotes: entry.usageNotes,
    sourceReferences: entry.sourceReferences,
    isCommon: entry.isCommon,
    isRootWord: isWord && entry.isRootWord,
    interrogativeRootWord: isWord ? entry.interrogativeRootWord : undefined,
    hypernymRootWord: isWord ? entry.hypernymRootWord : undefined,
    holonymRootWord: isWord ? entry.holonymRootWord : undefined,
    vectorPrimitiveRootWord: isWord ? entry.vectorPrimitiveRootWord : undefined,
  });
  senseStore.append(sense);
  senseStore.registerMember(sense, entry);
}

// Shared by seedWordNet's own pass 1 and loadCache()'s own isMultiWord()
// (that method's own local copy of the identical check) -- kept as its
// own top-level function here, rather than imported from loadCache's
// closure, since the two run against unrelated inputs (a WordNet lemma
// vs. a Common Vocabulary Cache WordFileEntry) and have no other reason
// to share code.
function isMultiWordLemma(lemma: string): boolean {
  return /\s/.test(lemma.trim());
}

interface PromotedDocEntry extends WordFileEntry {
  reference_count?: number;
}

interface PromotedDoc {
  schema_version: string;
  language_code: string;
  part_of_speech: string | null;
  closed_class_kind: string;
  count: number;
  words: PromotedDocEntry[];
}

export class WordSeeder {
  private cache: Word[] | null = null;
  // Every cached entry whose text spans more than one whitespace-
  // separated token -- split out of `cache` at load time (loadCache()'s
  // own docstring) rather than kept as ordinary multi-word Words, per
  // Phrase's own docstring (data/phrase.ts) on why a closed-class
  // multi-word item is now its own lexical category.
  private cachePhrases: Phrase[] = [];
  private cacheFormLinks: FormLink[] = [];
  private promotedOverlay: PromotedDoc | null = null;

  constructor(
    private readonly languageCode: string = "en",
    private readonly promotionThreshold: number = 3,
    private readonly demotionThreshold: number = 1,
  ) {}

  /** Validates JSON schema, duplicate (lexicalForm, partOfSpeech,
   * domainTag) triples, lexical counts, mandatory file existence,
   * manifest consistency, and that every registerCodes/editorialLabels/
   * partOfSpeech value names a real enum member. Unlike Python's
   * version, never creates promoted_words.json or manifest.json when
   * missing (no filesystem to write to) -- both are required to
   * already be present in the bundled assets. */
  validateAssets(): void {
    if (!languageHasCommonCache(this.languageCode)) {
      throw new Error(`no Common Vocabulary Cache for language '${this.languageCode}'`);
    }

    const seenLexicalFormPos = new Set<string>();
    const seenEntryIds = new Set<string>();
    const fileCounts = new Map<string, number>();
    let computedTotal = 0;

    for (const filename of MANDATORY_FILES) {
      const count = this.validateWordFile(filename, seenLexicalFormPos, seenEntryIds, true);
      fileCounts.set(filename, count);
      computedTotal += count;
    }

    for (const filename of SUPPLEMENTARY_FILES) {
      fileCounts.set(filename, this.validateWordFile(filename, seenLexicalFormPos, seenEntryIds, true));
    }

    const promotedDoc = this.loadPromotedDoc();
    for (const entry of promotedDoc.words) {
      const key = `${entry.lexical_form} ${entry.part_of_speech} ${entry.domain_tag ?? ""}`;
      if (seenLexicalFormPos.has(key)) {
        throw new Error(
          `promoted word '${entry.lexical_form}' (${entry.part_of_speech}) duplicates an existing (lexical_form, part_of_speech, domain_tag) triple`,
        );
      }
      if (!entry.entry_id) throw new Error(`${PROMOTED_FILE}: '${entry.lexical_form}' is missing entry_id`);
      if (seenEntryIds.has(entry.entry_id)) {
        throw new Error(`${PROMOTED_FILE}: '${entry.lexical_form}' has entry_id '${entry.entry_id}', which duplicates an earlier entry`);
      }
      this.validateEntryEnums(PROMOTED_FILE, entry);
      seenLexicalFormPos.add(key);
      seenEntryIds.add(entry.entry_id);
      for (const form of entry.forms ?? []) {
        this.validateOneEntry(PROMOTED_FILE, form, seenLexicalFormPos, seenEntryIds);
        if (!form.derivation_kinds || form.derivation_kinds.length === 0) {
          throw new Error(`${PROMOTED_FILE}: '${form.lexical_form}', nested under '${entry.lexical_form}', is missing derivation_kinds`);
        }
      }
    }
    fileCounts.set(PROMOTED_FILE, promotedDoc.count ?? 0);

    const manifest = readWordDirJson<WordManifestDocument>(this.languageCode, MANIFEST_FILE);
    if (manifest === undefined) {
      throw new Error(`mandatory Common Vocabulary Cache file missing: ${MANIFEST_FILE}`);
    }
    if (manifest.total_lexical_forms !== computedTotal) {
      throw new Error(
        `manifest.json total_lexical_forms (${manifest.total_lexical_forms}) does not match the computed total (${computedTotal})`,
      );
    }
  }

  /** `doc.count` means "total lexical forms this file seeds", including
   * ones nested under a base lemma's own `forms` array -- unchanged
   * meaning from before nesting existed, just no longer equal to
   * `doc.words.length` on its own now that some entries live one level
   * deeper. Every entry gets the same validation regardless of nesting
   * depth (duplicate/entry_id/enum checks share `seenLexicalFormPos`/
   * `seenEntryIds` across top-level and nested entries alike, so a
   * duplicate is caught even if one copy is nested and the other
   * isn't), and a nested form additionally requires a non-empty
   * `derivation_kinds`. Nesting is only ever one level deep by
   * construction (see asset_loader.ts's own WordFileEntry.forms
   * docstring), so a nested form's own `forms` field is never read. */
  private validateWordFile(
    filename: string,
    seenLexicalFormPos: Set<string>,
    seenEntryIds: Set<string>,
    required: boolean,
  ): number {
    const doc = readWordFile(this.languageCode, filename);
    if (doc === undefined) {
      if (required) throw new Error(`mandatory Common Vocabulary Cache file missing: ${filename}`);
      return 0;
    }
    const totalEntries = doc.words.reduce((sum, entry) => sum + 1 + (entry.forms?.length ?? 0), 0);
    if (doc.count !== totalEntries) {
      throw new Error(`${filename}: count ${doc.count} does not match ${totalEntries} word entries (including nested forms)`);
    }
    for (const entry of doc.words) {
      this.validateOneEntry(filename, entry, seenLexicalFormPos, seenEntryIds);
      for (const form of entry.forms ?? []) {
        this.validateOneEntry(filename, form, seenLexicalFormPos, seenEntryIds);
        if (!form.derivation_kinds || form.derivation_kinds.length === 0) {
          throw new Error(`${filename}: '${form.lexical_form}', nested under '${entry.lexical_form}', is missing derivation_kinds`);
        }
      }
    }
    return doc.count;
  }

  /** Shared per-entry validation, walked for both a top-level entry and
   * each of its nested `forms`. */
  private validateOneEntry(
    filename: string,
    entry: WordFileEntry,
    seenLexicalFormPos: Set<string>,
    seenEntryIds: Set<string>,
  ): void {
    if (entry.language_code !== this.languageCode) {
      throw new Error(`${filename}: '${entry.lexical_form}' has language_code '${entry.language_code}', expected '${this.languageCode}'`);
    }
    if ((entry.normalised_form ?? undefined) !== entry.lexical_form.toLowerCase()) {
      throw new Error(`${filename}: '${entry.lexical_form}' has an inconsistent normalised_form`);
    }
    const key = `${entry.lexical_form} ${entry.part_of_speech} ${entry.domain_tag ?? ""}`;
    if (seenLexicalFormPos.has(key)) {
      throw new Error(`${filename}: duplicate lexical_form '${entry.lexical_form}' with part_of_speech '${entry.part_of_speech}' in the mandatory cache`);
    }
    if (!entry.entry_id) throw new Error(`${filename}: '${entry.lexical_form}' is missing entry_id`);
    if (seenEntryIds.has(entry.entry_id)) {
      throw new Error(`${filename}: '${entry.lexical_form}' has entry_id '${entry.entry_id}', which duplicates an earlier entry`);
    }
    this.validateEntryEnums(filename, entry);
    seenLexicalFormPos.add(key);
    seenEntryIds.add(entry.entry_id);
  }

  private validateEntryEnums(filename: string, entry: WordFileEntry): void {
    if (entry.part_of_speech !== undefined && !(entry.part_of_speech in PartOfSpeech)) {
      throw new Error(`${filename}: '${entry.lexical_form}' has unknown part_of_speech '${entry.part_of_speech}'`);
    }
    for (const code of entry.register_codes ?? []) {
      if (!(code in RegisterCode)) throw new Error(`${filename}: '${entry.lexical_form}' has unknown register_code '${code}'`);
    }
    for (const label of entry.editorial_labels ?? []) {
      if (!(label in EditorialLabel)) throw new Error(`${filename}: '${entry.lexical_form}' has unknown editorial_label '${label}'`);
    }
    if (entry.interrogative_root_word && !(entry.interrogative_root_word in InterrogativeRootWord)) {
      throw new Error(`${filename}: '${entry.lexical_form}' has unknown interrogative_root_word '${entry.interrogative_root_word}'`);
    }
    if (entry.hypernym_root_word && !(entry.hypernym_root_word in HypernymRootWord)) {
      throw new Error(`${filename}: '${entry.lexical_form}' has unknown hypernym_root_word '${entry.hypernym_root_word}'`);
    }
    if (entry.holonym_root_word && !(entry.holonym_root_word in HolonymRootWord)) {
      throw new Error(`${filename}: '${entry.lexical_form}' has unknown holonym_root_word '${entry.holonym_root_word}'`);
    }
    if (entry.vector_primitive_root_word && !(entry.vector_primitive_root_word in VectorPrimitiveRootWord)) {
      throw new Error(`${filename}: '${entry.lexical_form}' has unknown vector_primitive_root_word '${entry.vector_primitive_root_word}'`);
    }
    const syllableCount = entry.syllable_count;
    if (syllableCount !== undefined && syllableCount !== null && (!Number.isInteger(syllableCount) || syllableCount < 1)) {
      throw new Error(`${filename}: '${entry.lexical_form}' has an invalid syllable_count ${JSON.stringify(syllableCount)}`);
    }
  }

  private loadPromotedDoc(): PromotedDoc {
    if (this.promotedOverlay !== null) return this.promotedOverlay;
    const bundled = readWordDirJson<PromotedDoc>(this.languageCode, PROMOTED_FILE);
    this.promotedOverlay = bundled ?? this.emptyPromotedDoc();
    return this.promotedOverlay;
  }

  private emptyPromotedDoc(): PromotedDoc {
    return {
      schema_version: "2.0.0",
      language_code: this.languageCode,
      part_of_speech: null,
      closed_class_kind: "promoted_open_class",
      count: 0,
      words: [],
    };
  }

  /** Validates the assets, then parses every mandatory closed-class
   * file, every supplementary file, and the promoted-words overlay
   * into Word instances (isCommon=true on all of them) -- flattening
   * every nested `forms` entry into its own top-level Word right
   * alongside its base lemma's, so the returned list is identical to
   * what it would be if nesting didn't exist, while also recording each
   * flattening as a FormLink (`cacheFormLinks`) for seedClosedClassWords
   * to wire into a target Dictionary's lemma index. Cached after the
   * first call -- cacheFormLinks is populated in lockstep with `cache`
   * and never diverges from it.
   *
   * An entry whose own text spans more than one whitespace-separated
   * token ("in spite of") becomes a Phrase instead of a Word --
   * appended to `cachePhrases`, read back via loadPhrases() below, not
   * included in this method's own return value at all. A form nested
   * under a multi-word base (vanishingly rare in the real cache today,
   * but not assumed impossible) is classified the identical way,
   * independently of its own base -- if either half of a FormLink ends
   * up a Phrase rather than a Word, that link is simply never recorded
   * (FormLink/Dictionary.linkForm are Word-to-Word only; a Phrase has
   * no lemma-index concept of its own in this first pass). */
  loadCache(): readonly Word[] {
    if (this.cache !== null) return this.cache.slice();

    this.validateAssets();
    const words: Word[] = [];
    const phrases: Phrase[] = [];
    const links: FormLink[] = [];
    const isMultiWord = (entry: WordFileEntry): boolean => /\s/.test((entry.text ?? entry.lexical_form).trim());
    const pushOne = (entry: WordFileEntry): { entryId: string; isPhrase: boolean } => {
      if (isMultiWord(entry)) {
        phrases.push(this.entryToPhrase(entry));
        return { entryId: entry.entry_id, isPhrase: true };
      }
      words.push(this.entryToWord(entry));
      return { entryId: entry.entry_id, isPhrase: false };
    };
    const pushEntry = (entry: WordFileEntry): void => {
      const base = pushOne(entry);
      for (const form of entry.forms ?? []) {
        const pushedForm = pushOne(form);
        if (base.isPhrase || pushedForm.isPhrase) continue;
        links.push({ baseEntryId: entry.entry_id, formEntryId: form.entry_id, derivationKinds: form.derivation_kinds });
      }
    };
    for (const filename of [...MANDATORY_FILES, ...SUPPLEMENTARY_FILES]) {
      const doc = readWordFile(this.languageCode, filename) as WordFileDocument;
      for (const entry of doc.words) pushEntry(entry);
    }
    for (const entry of this.loadPromotedDoc().words) pushEntry(entry);
    this.cache = words;
    this.cachePhrases = phrases;
    this.cacheFormLinks = links;
    return words.slice();
  }

  /** Every cached multi-word entry as a Phrase, loading the cache first
   * if this is the first call -- the Phrase counterpart of loadCache()
   * itself, kept as its own method (not folded into loadCache()'s own
   * return value) since the two are genuinely different lexical
   * categories now, not one list a caller filters afterward. */
  loadPhrases(): readonly Phrase[] {
    this.loadCache();
    return this.cachePhrases.slice();
  }

  /** Appends a fresh copy of every cached Word into `dictionary` that
   * isn't already present -- matched by text, partOfSpeech, AND
   * domainTag, not text and partOfSpeech alone (see
   * vocabulary/role/word_seeder.py's own docstring for the full
   * homograph/polyseme rationale). Returns the number actually
   * appended -- idempotent, safe to call more than once against the
   * same Dictionary.
   *
   * `options.excludeOpenClasses`, default false, preserves this
   * method's original behaviour for every existing caller (Linguistics'
   * own test fixtures in particular, which seed this cache alone,
   * without ever loading WordNet, and need its full NOUN/VERB/ADJECTIVE/
   * ADVERB coverage to parse a realistic sentence). Only the Vocabulary
   * view's own "Seed Vocabulary" toolbar action (vocabulary_worker.ts's
   * handleSeedCommonVocabulary) opts in: with WordSeeder.seedWordNet
   * available as a separate, on-demand action in that same UI,
   * promoted_words.json and the metalinguistic_{nouns,verbs,adjectives,
   * adverbs}.json files' own open-class coverage (SUPPLEMENTARY_FILES'
   * own comment) is redundant there, and worse than redundant if
   * "Seed Vocabulary" is clicked *before* "Load WordNet": unlike a
   * WordNet sense, none of these cached entries carry a domainTag, so
   * they'd silently shadow -- not merely duplicate -- WordNet's own
   * richer entry for the identical (text, partOfSpeech) pair once it's
   * loaded (the `alreadyPresent` check just below matches on domainTag
   * too, and undefined equals undefined). root_words.json's own 25 NOUN
   * entries (ROOT_WORD_DOMAIN_TAG) are the one exception even when
   * `excludeOpenClasses` is set -- not general vocabulary coverage, the
   * curated Interrogative/Hypernym/Holonym/Vector-Primitive root-word
   * table, with no seeding path of its own outside this cache. Every
   * other closed class (pronoun, determiner, preposition, ..., symbol,
   * numeral, proper noun, interjection) is unaffected either way --
   * WordNet itself only ever seeds NOUN/VERB/ADJECTIVE/ADVERB Words, so
   * there's nothing for this cache's own closed-class entries to
   * compete with there. */
  seedClosedClassWords(
    dictionary: Dictionary,
    phraseBook: PhraseBook,
    options?: { excludeOpenClasses?: boolean },
    senseStore?: SenseStore,
  ): number {
    const excludeOpenClasses = options?.excludeOpenClasses ?? false;
    let seeded = 0;
    const insertedByEntryId = new Map<string, Word>();
    for (const word of this.loadCache()) {
      if (excludeOpenClasses && OPEN_CLASSES.includes(word.partOfSpeech) && word.domainTag?.value !== ROOT_WORD_DOMAIN_TAG) continue;
      const wordDomainTag = word.domainTag?.value;
      const alreadyPresent = dictionary
        .lookupAll(word.text)
        .some((existing) => existing.partOfSpeech === word.partOfSpeech && existing.domainTag?.value === wordDomainTag);
      if (alreadyPresent) continue;
      const copy = copyWordWithFreshUuid(word);
      dictionary.append(copy);
      insertedByEntryId.set(word.entryId.value, copy);
      if (senseStore !== undefined) registerUniqueSense(senseStore, copy);
      seeded += 1;
    }
    for (const link of this.cacheFormLinks) {
      const base = insertedByEntryId.get(link.baseEntryId);
      const form = insertedByEntryId.get(link.formEntryId);
      if (base && form) dictionary.linkForm(base, form, link.derivationKinds);
    }
    // Phrases (Phrase's own docstring on why these are split out of
    // `loadCache()` entirely rather than sharing Word's own dedup loop
    // above): the identical excludeOpenClasses/alreadyPresent shape,
    // just matched by (text, partOfSpeech) alone -- a Phrase has no
    // domainTag to further disambiguate with, since none of today's
    // real multi-word entries are ever true dictionary polysemes.
    for (const phrase of this.loadPhrases()) {
      if (excludeOpenClasses && OPEN_CLASSES.includes(phrase.partOfSpeech)) continue;
      const alreadyPresent = phraseBook
        .lookupAll(phrase.text)
        .some((existing) => existing.partOfSpeech === phrase.partOfSpeech);
      if (alreadyPresent) continue;
      const phraseCopy = copyPhraseWithFreshUuid(phrase);
      phraseBook.append(phraseCopy);
      if (senseStore !== undefined) registerUniqueSense(senseStore, phraseCopy);
      seeded += 1;
    }
    return seeded;
  }

  seedDomain(
    domain: { vocabulary: { dictionary: Dictionary; phrases: PhraseBook; senses?: SenseStore } },
    options?: { excludeOpenClasses?: boolean },
  ): number {
    return this.seedClosedClassWords(domain.vocabulary.dictionary, domain.vocabulary.phrases, options, domain.vocabulary.senses);
  }

  /** Seeds `domain` from the bundled Princeton WordNet 3.1 dict/ files
   * (assets/wordnet/, loaded via wordnet_loader.ts) rather than the
   * Common Vocabulary Cache -- a separate, independent source, so
   * unlike seedClosedClassWords this is never implied by seedDomain and
   * must be called on its own. Two passes over the same synset list:
   *
   * Pass 1 (`onProgress("words", ...)`) -- A WordNet synset IS a LIRA
   * Domain+Word (Word.synsetId's own docstring): both name one sense,
   * not one spelling. So each synset's member lemmas become one Word
   * apiece (isCommon=true, synsetId set to this synset's own --
   * synsetMemberToWord's own docstring on why that, not domainTag, is
   * what disambiguates true WordNet polysemy: the same lemma in more
   * than one synset lands as distinct Words, but reads as plain
   * "Common" in the UI rather than each getting its own synthetic
   * one-off domain), and every pairwise combination of a synset's
   * members is wired together with a SYNONYM LexicalRelationship -- the
   * direct encoding of "wordnet uses synsets, LIRA uses synonym
   * relationships": querying synonyms() on any one member (word.ts,
   * direction="both") already recovers the synset's full membership
   * from either endpoint without this needing to store the group itself
   * anywhere.
   *
   * Pass 2 (`onProgress("relationships", ...)`) -- every *other*
   * relation WordNet expresses between two synsets (or two specific
   * words within them), via each synset's own `pointers`
   * (wordnet_loader.ts's own WordNetPointer) -- hypernym, meronym,
   * antonym, and the rest relationshipKindForPointer above maps a
   * pointer symbol onto, with one exception: `;c`/`-c` (topic-domain)
   * pointers don't become a relationship edge at all -- seedPointerRelationship
   * intercepts them and tags the word itself instead (tagTopicDomain's
   * own docstring). Requires every synset's Words to already exist
   * (a pointer can name a synset processed later in file order, or in a
   * different POS file entirely -- `+`/`\` regularly cross from one
   * part of speech to another), which is exactly why this is its own
   * pass after pass 1 finishes rather than interleaved with it.
   *
   * Idempotent like seedClosedClassWords, across both passes: a lemma
   * already present under the same partOfSpeech and synsetId is reused
   * rather than duplicated, and an already-created (source, target,
   * kind) edge is never recreated, so calling this more than once
   * against the same Domain is safe.
   *
   * Async, unlike seedClosedClassWords -- loadWordNetSynsets() fetches
   * its dict/ text via a lazy `import()` (wordnet_loader.ts's own
   * docstring on why it isn't bundled eagerly like the Common
   * Vocabulary Cache), so nothing here can resolve synchronously.
   *
   * `onProgress`, if given, is called every PROGRESS_REPORT_INTERVAL
   * synsets within each pass (and once more at the end of that pass)
   * with (phase, processed, total) -- vocabulary_worker.ts's own call
   * site relays each call across the Worker boundary as a status
   * message so a caller-side progress bar can track a run against the
   * full ~117,800-synset dataset (each pass a few seconds of CPU-bound
   * work, worker.ts's docstring), instead of only seeing "running" for
   * that whole span with no sense of how far along it is. The `await`
   * after each call isn't there for the callback's own sake (it may
   * well be synchronous) -- it yields this loop back to the event loop
   * for a tick, so a message posted from inside `onProgress` actually
   * gets a chance to leave the Worker before the next few thousand
   * synsets' worth of synchronous work runs. */
  async seedWordNet(
    domain: {
      vocabulary: {
        dictionary: Dictionary;
        phrases: PhraseBook;
        senses: SenseStore;
        lexicalRelationships: LexicalRelationshipStore;
        lexicalRelationshipProcessor: LexicalRelationshipProcessor;
      };
    },
    onProgress?: (phase: "words" | "relationships", processed: number, total: number) => void,
  ): Promise<{ wordsSeeded: number; sensesSeeded: number; relationshipsSeeded: number }> {
    const dictionary = domain.vocabulary.dictionary;
    const phraseBook = domain.vocabulary.phrases;
    const senseStore = domain.vocabulary.senses;
    const store = domain.vocabulary.lexicalRelationships;
    const processor = domain.vocabulary.lexicalRelationshipProcessor;

    // LexicalRelationshipStore.outgoing() is indexed (O(1) amortized,
    // lexical_relationship_store.ts's own docstring) rather than a raw
    // linear scan, but it still allocates a fresh array copy on every
    // call -- real overhead multiplied across the hundreds of thousands
    // of candidate pairs a full WordNet seed (both passes) checks.
    // Scanning the store once up front into a Set instead avoids that
    // repeated Map lookup and allocation entirely, the same reasoning
    // Dictionary's byText/byUuid maps already apply to
    // lookup()/lookupAll() (dictionary.ts's own module docstring).
    // Keyed by kind as well as the pair, unlike an earlier version of
    // this method that tracked SYNONYM pairs alone -- pass 2 can create
    // more than one kind of edge between the same two Words (e.g. both
    // a `+` NOMINALISATION and an unrelated `^` ALSO_SEE), and each is
    // a distinct fact that must independently survive a re-seed.
    const existingEdges = new Set<string>();
    for (const relationship of store.all()) {
      existingEdges.add(`${relationship.sourceWordId.value}|${relationship.targetWordId.value}|${relationship.relationshipType}`);
    }

    let wordsSeeded = 0;
    let sensesSeeded = 0;
    let relationshipsSeeded = 0;

    const synsets = await loadWordNetSynsets();
    const synsetMembersById = new Map<string, Array<Word | Phrase>>();
    // Every Phrase newly created by this call's own pass 1, in creation
    // order -- linkPhraseWords() below can only resolve a Phrase's own
    // constituent Words correctly once pass 1 has finished seeding every
    // single-word synset member (a phrase like "toy poodle" can be
    // processed before the standalone "toy"/"poodle" synsets, in
    // whatever order loadWordNetSynsets() itself returns), so the
    // linking itself is deferred to right after this loop rather than
    // attempted inline. A Phrase found already-seeded from an earlier
    // seedWordNet run (the `existingPhrase` branch below) is skipped --
    // it was already linked the run that created it.
    const newPhrases: Phrase[] = [];

    let processed = 0;
    for (const synset of synsets) {
      // One Sense per synset, shared by every member -- Sense's own
      // docstring on why this exists (the shared-meaning data every
      // member used to duplicate its own copy of). Found-or-created the
      // same way a member Word/Phrase already is, keyed on synsetId
      // rather than (lemma, partOfSpeech, synsetId) since a synset has
      // exactly one Sense regardless of how many lemmas name it.
      let sense = senseStore.findBySynsetId(synset.synsetId);
      if (sense === undefined) {
        sense = createSense({
          synsetId: { value: synset.synsetId, ...WORDNET_SYNSET_ID_SCHEME },
          definition: synset.definition ? { value: synset.definition } : undefined,
          usageNotes: synset.examples.map((example) => ({ value: example })),
          isCommon: true,
          sourceReferences: [WORDNET_SOURCE_REFERENCE],
        });
        senseStore.append(sense);
        sensesSeeded += 1;
      }

      const members: Array<Word | Phrase> = [];
      for (const lemma of synset.lemmas) {
        if (lemma.length === 0) continue;
        // A multi-word lemma ("toy poodle", "ice cream") is a Phrase,
        // not a Word -- the same isMultiWord() split loadCache() already
        // applies to the Common Vocabulary Cache (that method's own
        // docstring), applied here to WordNet's own lemmas so a
        // multi-word sense gets exactly the same treatment a single-word
        // one does: full participation in this pass's SYNONYM wiring and
        // pass 2's pointer-relationship wiring below, just stored in
        // PhraseBook instead of Dictionary.
        if (isMultiWordLemma(lemma)) {
          const existingPhrase = phraseBook
            .lookupAll(lemma)
            .find((phrase) => phrase.partOfSpeech === synset.partOfSpeech && phrase.synsetId?.value === synset.synsetId);
          if (existingPhrase !== undefined) {
            members.push(existingPhrase);
            continue;
          }
          const phrase = this.synsetMemberToPhrase(synset, lemma);
          phraseBook.append(phrase);
          members.push(phrase);
          newPhrases.push(phrase);
          wordsSeeded += 1;
          continue;
        }
        const existing = dictionary
          .lookupAll(lemma)
          .find((word) => word.partOfSpeech === synset.partOfSpeech && word.synsetId?.value === synset.synsetId);
        if (existing !== undefined) {
          members.push(existing);
          continue;
        }
        const word = this.synsetMemberToWord(synset, lemma);
        dictionary.append(word);
        members.push(word);
        wordsSeeded += 1;
      }
      // Every member linked to this synset's own Sense, new or reused
      // (a reused member from an earlier seedWordNet run, before this
      // field existed, gets backfilled here too -- idempotent, safe to
      // register on every re-seed) -- SenseStore.registerMember()'s own
      // docstring on why this replaces a stored SYNONYM edge per pair
      // entirely: two members of the same Sense are synonyms *because*
      // they share it, not because a separate fact says so. synonyms()
      // (word.ts) now reads this membership index directly instead of
      // a LexicalRelationshipType.SYNONYM edge for any WordNet-derived
      // pair -- allPairs()'s own former call site here is gone, not
      // replaced.
      for (const member of members) senseStore.registerMember(sense, member);
      synsetMembersById.set(synset.synsetId, members);

      processed += 1;
      if (onProgress && (processed % PROGRESS_REPORT_INTERVAL === 0 || processed === synsets.length)) {
        onProgress("words", processed, synsets.length);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    // Every single-word synset member is seeded by now (the loop above
    // ran to completion), so every newly-created Phrase's own
    // constituent Words can be resolved with full Dictionary coverage --
    // this.linkPhraseWords()'s own docstring on why this can't happen
    // inline, above.
    for (const phrase of newPhrases) this.linkPhraseWords(phrase, dictionary);

    processed = 0;
    for (const synset of synsets) {
      const sourceMembers = synsetMembersById.get(synset.synsetId);
      if (sourceMembers !== undefined) {
        for (const pointer of synset.pointers) {
          relationshipsSeeded += this.seedPointerRelationship(processor, existingEdges, synset, sourceMembers, pointer, synsetMembersById, senseStore);
        }
      }

      processed += 1;
      if (onProgress && (processed % PROGRESS_REPORT_INTERVAL === 0 || processed === synsets.length)) {
        onProgress("relationships", processed, synsets.length);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    return { wordsSeeded, sensesSeeded, relationshipsSeeded };
  }

  /** One WordNetPointer, resolved and (if not already present) created
   * as a LexicalRelationship. Returns how many edges it actually added
   * (0 if the symbol is unrecognised, the target synset was never
   * seeded, an index pointed past the end of a synset's own member
   * list, every resulting pair was a self-edge, or every edge already
   * existed). A single pointer record can still produce more than one
   * edge: a synset-level pointer (sourceWordIndex/targetWordIndex both
   * 0, "the whole synset") pairs every member of the source synset with
   * every member of the target synset -- correct, not lossy, only
   * because every member of a synset is already a mutual synonym of
   * every other (pass 1's own SYNONYM edges), so connecting all-to-all
   * carries the identical meaning connecting one representative pair
   * would, just made explicit for each member instead of left implicit --
   * *except* when the resolved kind is itself Lexical Semantic
   * (relationshipGroup(kind) === 1, lexical_relationship_type.ts): a
   * synset-wide fact of that group is a fact about the two *senses*, not
   * about any one member pair, so it's stored as a single Sense-to-Sense
   * edge instead (found via SenseStore.findBySynsetId on each side) --
   * word.ts's own relatedWords() family expands that one edge back out to
   * every member on read (SenseStore.membersOf()), so callers still see
   * the identical member×member result this member×member branch would
   * have produced, just not stored that way. A *lexical* (word-specific)
   * pointer occurrence -- sourceWordIndex or targetWordIndex nonzero --
   * still becomes a direct Word/Phrase edge regardless of group, since it
   * names one specific word's relationship, not the synset's as a whole;
   * so does every Morphological/Orthographic-group kind (derivation,
   * pertainym, ...) even when synset-wide, since those aren't semantic
   * relationships at all (the user's own scoping instruction). */
  private seedPointerRelationship(
    processor: LexicalRelationshipProcessor,
    existingEdges: Set<string>,
    synset: WordNetSynset,
    sourceMembers: readonly (Word | Phrase)[],
    pointer: WordNetPointer,
    synsetMembersById: ReadonlyMap<string, Array<Word | Phrase>>,
    senseStore: SenseStore,
  ): number {
    const targetMembers = synsetMembersById.get(pointer.targetSynsetId);
    if (targetMembers === undefined || targetMembers.length === 0) return 0;

    if (pointer.symbol === ";c" || pointer.symbol === "-c") {
      this.tagTopicDomain(synset, sourceMembers, targetMembers, pointer, senseStore);
      return 0;
    }

    const resolved = relationshipKindForPointer(pointer.symbol, synset.partOfSpeech, targetMembers[0].partOfSpeech);
    if (resolved === undefined) return 0;

    const qualifiers: readonly AttributeValue[] | undefined =
      resolved.meronymKind !== undefined ? [{ name: { value: MERONYM_KIND_QUALIFIER }, value: { value: resolved.meronymKind } }] : undefined;

    if (pointer.sourceWordIndex === 0 && pointer.targetWordIndex === 0 && relationshipGroup(resolved.kind) === 1) {
      const sourceSense = senseStore.findBySynsetId(synset.synsetId);
      const targetSense = senseStore.findBySynsetId(pointer.targetSynsetId);
      if (sourceSense === undefined || targetSense === undefined || sourceSense.uuid.value === targetSense.uuid.value) return 0;
      const pair: readonly [Sense, Sense] = resolved.swap ? [targetSense, sourceSense] : [sourceSense, targetSense];
      return this.createEdges(processor, existingEdges, resolved.kind, [pair], qualifiers);
    }

    const sourceWords = pointer.sourceWordIndex === 0 ? sourceMembers : indexedWord(sourceMembers, pointer.sourceWordIndex);
    const targetWords = pointer.targetWordIndex === 0 ? targetMembers : indexedWord(targetMembers, pointer.targetWordIndex);

    const pairs: Array<readonly [Word | Phrase, Word | Phrase]> = [];
    for (const sw of sourceWords) {
      for (const tw of targetWords) {
        if (sw.uuid.value === tw.uuid.value) continue;
        pairs.push(resolved.swap ? [tw, sw] : [sw, tw]);
      }
    }
    return this.createEdges(processor, existingEdges, resolved.kind, pairs, qualifiers);
  }

  /** `;c`/`-c` (topic-domain pointer) handling, split out of
   * seedPointerRelationship's general edge-creation path -- unlike every
   * other recognised pointer symbol, a topic pointer no longer becomes a
   * LexicalRelationship edge (TOPIC_DOMAIN is consequently orphaned from
   * WordNet seeding, the same fate HYPONYM/TROPONYM/etc. already have --
   * relationshipKindForPointer's own docstring). It instead tags the
   * topic category's own representative lemma ("medicine", "chemistry",
   * ...) onto the tagged *Sense* now, not every one of its member Words/
   * Phrases individually (Sense.domainTag/relatedDomainTags' own
   * docstring on why this replaced the old per-member duplication -- a
   * topic domain is a property of the meaning, not of any one lemma that
   * happens to spell it): the first topic pointer found for a given
   * Sense sets that Sense's domainTag (mirroring how the Common
   * Vocabulary Cache's own polysemy already uses domainTag for a single
   * subdomain name); any *additional* topic this same sense also carries
   * in WordNet -- rarer, but real: e.g. "winger" is a wing position in
   * soccer, hockey, rugby, AND field_hockey -- is appended to
   * relatedDomainTags instead of silently dropped.
   *
   * A *word-specific* topic pointer (either index nonzero -- rare, but
   * the general pointer-index handling below doesn't assume it can't
   * happen) still tags the one named Word/Phrase directly instead of the
   * whole Sense, the same "only a synset-wide fact moves to Sense" rule
   * seedPointerRelationship's own relationship-kind branch uses. A
   * Word/Phrase with no Sense at all (every hand-curated Common
   * Vocabulary Cache entry, which never reaches this method) keeps using
   * its own domainTag/relatedDomainTags exactly as before -- untouched
   * by this change.
   *
   * `;c` is recorded on the tagged word's own synset, pointing at the
   * topic-category synset (sourceMembers = the word(s), targetMembers =
   * the category); `-c` is the reciprocal, recorded on the category
   * synset itself, pointing back at each tagged word (sourceMembers =
   * the category, targetMembers = the word(s)) -- mirroring
   * relationshipKindForPointer's own swap convention for the same pair,
   * so both symbols resolve to the identical (word, category) tagging
   * regardless of which of the two entries the pointer was read from. */
  private tagTopicDomain(
    synset: WordNetSynset,
    sourceMembers: readonly (Word | Phrase)[],
    targetMembers: readonly (Word | Phrase)[],
    pointer: WordNetPointer,
    senseStore: SenseStore,
  ): void {
    const sourceWords = pointer.sourceWordIndex === 0 ? sourceMembers : indexedWord(sourceMembers, pointer.sourceWordIndex);
    const targetWords = pointer.targetWordIndex === 0 ? targetMembers : indexedWord(targetMembers, pointer.targetWordIndex);

    const taggedWords = pointer.symbol === ";c" ? sourceWords : targetWords;
    const categoryWord = (pointer.symbol === ";c" ? targetWords[0] : sourceWords[0])
      ?? (pointer.symbol === ";c" ? targetMembers[0] : sourceMembers[0]);
    if (categoryWord === undefined) return;
    const categoryLemma = categoryWord.text;

    if (pointer.sourceWordIndex === 0 && pointer.targetWordIndex === 0) {
      const taggedSynsetId = pointer.symbol === ";c" ? synset.synsetId : pointer.targetSynsetId;
      const sense = senseStore.findBySynsetId(taggedSynsetId);
      if (sense !== undefined) {
        applyDomainTag(sense, categoryLemma);
        return;
      }
    }
    for (const word of taggedWords) applyDomainTag(word, categoryLemma);
  }

  /** Creates a LexicalRelationship for every (source, target) pair not
   * already in `existingEdges`, adding each newly-created one to that
   * same Set so a later call in the same seedWordNet run (or a later
   * seedWordNet run entirely) sees it as already present -- the shared
   * idempotency mechanism both seedWordNet passes funnel through. For a
   * SYMMETRIC_RELATIONSHIP_KINDS kind, also checks the reversed
   * (target, source, kind) key -- WordNet lists these symmetrically on
   * both ends (SYMMETRIC_RELATIONSHIP_KINDS's own docstring), so the
   * second pointer processed for an already-covered pair is recognised
   * as redundant instead of creating a second edge for the identical
   * fact, the same way relationshipKindForPointer's own `swap`
   * canonicalization already does for complementary-kind pairs
   * (HYPERNYM/HYPONYM, xMERONYM/xHOLONYM) via the exact-triple key
   * alone. Returns the number of edges actually created. */
  private createEdges(
    processor: LexicalRelationshipProcessor,
    existingEdges: Set<string>,
    kind: LexicalRelationshipType,
    pairs: Iterable<readonly [RelationshipEndpoint, RelationshipEndpoint]>,
    qualifiers?: readonly AttributeValue[],
  ): number {
    const symmetric = SYMMETRIC_RELATIONSHIP_KINDS.has(kind);
    let created = 0;
    for (const [source, target] of pairs) {
      const key = `${source.uuid.value}|${target.uuid.value}|${kind}`;
      const reverseKey = symmetric ? `${target.uuid.value}|${source.uuid.value}|${kind}` : undefined;
      if (existingEdges.has(key) || (reverseKey !== undefined && existingEdges.has(reverseKey))) continue;
      processor.create({
        sourceWordId: source.uuid.value,
        targetWordId: target.uuid.value,
        relationshipType: kind,
        sourceReferences: [WORDNET_SOURCE_REFERENCE],
        qualifiers,
        confidence: WORDNET_SEEDER_DEFAULT_WEIGHT,
        provenance: WORDNET_SEEDER_DEFAULT_WEIGHT,
        temporal: WORDNET_SEEDER_DEFAULT_WEIGHT,
        activation: WORDNET_SEEDER_DEFAULT_WEIGHT,
      });
      existingEdges.add(key);
      created += 1;
    }
    return created;
  }

  /** Breaks `phrase`'s own `text` into its whitespace-separated
   * tokens ("toy poodle" -> ["toy", "poodle"]) and resolves each one
   * against `dictionary`, storing the result on `phrase.words` -- see
   * that field's own docstring (data/phrase.ts) for why it's stored by
   * uuid reference rather than computed on demand. `dictionary.lookup`
   * matches case-insensitively and, for a token with more than one
   * homograph, picks its own first-seeded sense (the same arbitrary-
   * but-deterministic choice definitionWords() already makes for a
   * definition token, word.ts) -- this is a structural decomposition of
   * the phrase's own spelling, not a semantic claim about which sense
   * of "toy" is meant. A token position stays undefined when
   * `dictionary` has no Word for it at all (WordNet itself never
   * lexicalizes some closed-class function words -- "rule of thumb"'s
   * own "of" -- as a standalone sense). */
  private linkPhraseWords(phrase: Phrase, dictionary: Dictionary): void {
    const tokens = phrase.text.trim().split(/\s+/).filter((token) => token.length > 0);
    phrase.words = tokens.map((token) => dictionary.lookup(token)?.uuid);
  }

  // domainTag deliberately left unset here -- unlike root_words.json's
  // true dictionary polysemy (Word.domainTag's own docstring), a
  // WordNet synset isn't itself a curated, human-meaningful subdomain
  // name; it's an opaque per-sense identifier. Giving each of WordNet's
  // ~117,800 synsets its own domainTag would turn the Domain column/
  // filter into ~117,800 one-off values instead of the plain "Common"
  // every other Common Vocabulary Cache word gets -- synsetId
  // (Word.synsetId's own docstring) already carries the synset-level
  // identity this class needs for its own dedup, without repurposing
  // domainTag to also carry it. Only pass 2's tagTopicDomain sets
  // domainTag afterward, and only for the minority of senses (~6,690 of
  // ~117,800) WordNet itself tags with a topic-domain pointer -- a
  // sparse, small-vocabulary label ("medicine", "chemistry", ...), not
  // a per-synset identifier, so it doesn't fragment the Domain filter
  // the way a domainTag-per-synset scheme would.
  private synsetMemberToWord(synset: WordNetSynset, lemma: string): Word {
    return createWord({
      text: lemma,
      partOfSpeech: synset.partOfSpeech,
      languageCode: { value: this.languageCode },
      definition: synset.definition ? { value: synset.definition } : undefined,
      usageNotes: synset.examples.map((example) => ({ value: example })),
      synsetId: { value: synset.synsetId, ...WORDNET_SYNSET_ID_SCHEME },
      isCommon: true,
      sourceReferences: [WORDNET_SOURCE_REFERENCE],
    });
  }

  /** synsetMemberToWord's own counterpart for a multi-word lemma --
   * identical fields, mapped onto Phrase's own field set instead, so a
   * multi-word synset member (isMultiWordLemma()'s own check, this
   * class's pass 1) is seeded exactly like a single-word one: same
   * definition/examples/synsetId/isCommon/sourceReferences, same
   * eligibility for pass 2's pointer-relationship and topic-domain
   * wiring (both now typed Word | Phrase throughout). */
  private synsetMemberToPhrase(synset: WordNetSynset, lemma: string): Phrase {
    return createPhrase({
      text: lemma,
      partOfSpeech: synset.partOfSpeech,
      languageCode: { value: this.languageCode },
      definition: synset.definition ? { value: synset.definition } : undefined,
      usageNotes: synset.examples.map((example) => ({ value: example })),
      synsetId: { value: synset.synsetId, ...WORDNET_SYNSET_ID_SCHEME },
      isCommon: true,
      sourceReferences: [WORDNET_SOURCE_REFERENCE],
    });
  }

  /** Adds `word` to the in-memory promoted-words overlay if it belongs
   * to an open lexical class and its cross-domain reference count
   * exceeds promotionThreshold. Returns whether it was added.
   * `referenceCount` is supplied by the caller -- this class has no
   * visibility into how many Domains reference a Word. Unlike Python's
   * version, this never writes promoted_words.json to disk -- the
   * effect lasts only for this WordSeeder instance's remaining
   * lifetime (see this module's own docstring). */
  promoteWord(word: Word, referenceCount: number): boolean {
    if (!OPEN_CLASSES.includes(word.partOfSpeech)) return false;
    if (referenceCount <= this.promotionThreshold) return false;

    const doc = this.loadPromotedDoc();
    const domainTag = word.domainTag?.value ?? null;
    const alreadyPromoted = doc.words.some(
      (entry) => entry.lexical_form === word.lexicalForm?.value && entry.part_of_speech === PartOfSpeech[word.partOfSpeech]
        && (entry.domain_tag ?? null) === domainTag,
    );
    if (alreadyPromoted) return false;

    const entry: PromotedDocEntry = { ...this.wordToEntry(word), closed_class: false, reference_count: referenceCount };
    doc.words.push(entry);
    doc.count = doc.words.length;
    this.cache = null;
    return true;
  }

  /** Removes `word` from the in-memory promoted-words overlay if
   * referenceCount has fallen below demotionThreshold. Never deletes
   * the authoritative Word or touches its owning Domain -- only this
   * generated overlay entry, and (unlike Python) never persisted. */
  demoteWord(word: Word, referenceCount: number): boolean {
    if (referenceCount >= this.demotionThreshold) return false;
    const doc = this.loadPromotedDoc();
    const before = doc.words.length;
    doc.words = doc.words.filter((entry) => entry.lexical_form !== word.lexicalForm?.value);
    if (doc.words.length === before) return false;
    doc.count = doc.words.length;
    this.cache = null;
    return true;
  }

  private entryToWord(entry: WordFileEntry): Word {
    const optText = (value: string | null | undefined) => (value ? { value } : undefined);
    const optCode = (value: string | null | undefined) => (value ? { value } : undefined);
    const optNumber = (value: number | null | undefined) => (value === null || value === undefined ? undefined : { value });

    const sourceReferences = (entry.source_references ?? []).map((ref) => ({
      sourceName: { value: ref.source_name },
      sourceVersion: optText(ref.source_version),
      externalIdentifier: ref.external_identifier ? { value: ref.external_identifier } : undefined,
      referenceUri: ref.reference_uri ? { value: ref.reference_uri } : undefined,
      licenceIdentifier: ref.licence_identifier ? { value: ref.licence_identifier } : undefined,
    }));

    return createWord({
      text: entry.text ?? entry.lexical_form,
      entryId: { value: entry.entry_id },
      partOfSpeech: PartOfSpeech[entry.part_of_speech as keyof typeof PartOfSpeech],
      version: optText(entry.version) ?? { value: "1.0" },
      languageCode: { value: entry.language_code },
      lexicalForm: { value: entry.lexical_form },
      normalisedForm: { value: entry.normalised_form },
      scriptCode: optCode(entry.script_code),
      gloss: optText(entry.gloss),
      definition: optText(entry.definition),
      usageNotes: (entry.usage_notes ?? []).map((note) => ({ value: note })),
      registerCodes: (entry.register_codes ?? []).map((code) => RegisterCode[code as keyof typeof RegisterCode]),
      dialectCodes: (entry.dialect_codes ?? []).map((code) => ({ value: code })),
      editorialLabels: (entry.editorial_labels ?? []).map((label) => EditorialLabel[label as keyof typeof EditorialLabel]),
      syllableRepresentation: optText(entry.syllable_representation),
      syllableCount: optNumber(entry.syllable_count),
      stressPattern: optText(entry.stress_pattern),
      frequencyValue: optNumber(entry.frequency_value),
      frequencyScale: optCode(entry.frequency_scale),
      etymologyText: optText(entry.etymology_text),
      firstRecordedUse: optText(entry.first_recorded_use),
      sourceReferences,
      isCommon: true,
      domainTag: optText(entry.domain_tag),
      seededPleasureDispleasureWeight: optNumber(entry.seeded_pleasure_displeasure_weight),
      seededArousalNonArousalWeight: optNumber(entry.seeded_arousal_non_arousal_weight),
      seededDominanceSubmissiveWeight: optNumber(entry.seeded_dominance_submissive_weight),
      isRootWord: entry.is_root_word ?? false,
      interrogativeRootWord: entry.interrogative_root_word
        ? InterrogativeRootWord[entry.interrogative_root_word as keyof typeof InterrogativeRootWord]
        : undefined,
      hypernymRootWord: entry.hypernym_root_word
        ? HypernymRootWord[entry.hypernym_root_word as keyof typeof HypernymRootWord]
        : undefined,
      holonymRootWord: entry.holonym_root_word
        ? HolonymRootWord[entry.holonym_root_word as keyof typeof HolonymRootWord]
        : undefined,
      vectorPrimitiveRootWord: entry.vector_primitive_root_word
        ? VectorPrimitiveRootWord[entry.vector_primitive_root_word as keyof typeof VectorPrimitiveRootWord]
        : undefined,
      isDerivableNoun: entry.is_derivable_noun ?? false,
    });
  }

  /** entryToWord's own counterpart for a multi-word entry -- the same
   * WordFileEntry schema (no separate Phrase asset schema exists;
   * loadCache()'s own isMultiWord() check is what decides which of the
   * two this becomes), mapped onto Phrase's own leaner field set:
   * every field a closed-class multi-word item plausibly needs
   * (text/lexicalForm/definition/gloss/usageNotes/register+dialect
   * codes/editorialLabels/sourceReferences/isCommon), but none of
   * Word's own root-word/PAD-affect/derivable-noun/pronunciation
   * fields -- none of those are ever populated for a real multi-word
   * Common Vocabulary Cache entry today, and Phrase has no field to
   * carry them even if a future entry tried. */
  private entryToPhrase(entry: WordFileEntry): Phrase {
    const optText = (value: string | null | undefined) => (value ? { value } : undefined);

    const sourceReferences = (entry.source_references ?? []).map((ref) => ({
      sourceName: { value: ref.source_name },
      sourceVersion: optText(ref.source_version),
      externalIdentifier: ref.external_identifier ? { value: ref.external_identifier } : undefined,
      referenceUri: ref.reference_uri ? { value: ref.reference_uri } : undefined,
      licenceIdentifier: ref.licence_identifier ? { value: ref.licence_identifier } : undefined,
    }));

    return createPhrase({
      text: entry.text ?? entry.lexical_form,
      entryId: { value: entry.entry_id },
      partOfSpeech: PartOfSpeech[entry.part_of_speech as keyof typeof PartOfSpeech],
      version: optText(entry.version) ?? { value: "1.0" },
      languageCode: { value: entry.language_code },
      lexicalForm: { value: entry.lexical_form },
      normalisedForm: { value: entry.normalised_form },
      gloss: optText(entry.gloss),
      definition: optText(entry.definition),
      usageNotes: (entry.usage_notes ?? []).map((note) => ({ value: note })),
      registerCodes: (entry.register_codes ?? []).map((code) => RegisterCode[code as keyof typeof RegisterCode]),
      dialectCodes: (entry.dialect_codes ?? []).map((code) => ({ value: code })),
      editorialLabels: (entry.editorial_labels ?? []).map((label) => EditorialLabel[label as keyof typeof EditorialLabel]),
      sourceReferences,
      isCommon: true,
    });
  }

  private wordToEntry(word: Word): WordFileEntry {
    return {
      entry_id: word.entryId.value,
      domain_tag: word.domainTag?.value ?? null,
      lexical_form: word.lexicalForm?.value ?? word.text,
      normalised_form: word.normalisedForm?.value ?? word.text.toLowerCase(),
      text: word.text,
      version: word.version.value,
      language_code: word.languageCode.value,
      script_code: word.scriptCode?.value ?? null,
      part_of_speech: PartOfSpeech[word.partOfSpeech],
      closed_class: false,
      definition: word.definition?.value ?? null,
      gloss: word.gloss?.value ?? null,
      usage_notes: word.usageNotes.map((note) => note.value),
      register_codes: word.registerCodes.map((code) => RegisterCode[code]),
      editorial_labels: word.editorialLabels.map((label) => EditorialLabel[label]),
      dialect_codes: word.dialectCodes.map((code) => code.value),
      pronunciations: [],
      syllable_representation: word.syllableRepresentation?.value ?? null,
      syllable_count: word.syllableCount?.value ?? null,
      stress_pattern: word.stressPattern?.value ?? null,
      frequency_value: word.frequencyValue?.value ?? null,
      frequency_scale: word.frequencyScale?.value ?? null,
      etymology_text: word.etymologyText?.value ?? null,
      first_recorded_use: word.firstRecordedUse?.value ?? null,
      seeded_pleasure_displeasure_weight: word.seededPleasureDispleasureWeight?.value ?? null,
      seeded_arousal_non_arousal_weight: word.seededArousalNonArousalWeight?.value ?? null,
      seeded_dominance_submissive_weight: word.seededDominanceSubmissiveWeight?.value ?? null,
      is_root_word: word.isRootWord,
      interrogative_root_word: word.interrogativeRootWord !== undefined ? InterrogativeRootWord[word.interrogativeRootWord] : null,
      hypernym_root_word: word.hypernymRootWord !== undefined ? HypernymRootWord[word.hypernymRootWord] : null,
      holonym_root_word: word.holonymRootWord !== undefined ? HolonymRootWord[word.holonymRootWord] : null,
      vector_primitive_root_word: word.vectorPrimitiveRootWord !== undefined ? VectorPrimitiveRootWord[word.vectorPrimitiveRootWord] : null,
      is_derivable_noun: word.isDerivableNoun,
      source_references: word.sourceReferences.map((ref) => ({
        source_name: ref.sourceName.value,
        source_version: ref.sourceVersion?.value ?? null,
        external_identifier: ref.externalIdentifier?.value ?? null,
        reference_uri: ref.referenceUri?.value ?? null,
        licence_identifier: ref.licenceIdentifier?.value ?? null,
      })),
    };
  }
}
