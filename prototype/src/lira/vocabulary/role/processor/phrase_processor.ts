import { PartOfSpeech } from "../../data/enums/part_of_speech";
import { ModifierRole } from "../../data/enums/modifier_role";
import { PhraseType } from "../../data/enums/phrase_type";
import { ConjunctionType } from "../../data/enums/conjunction_type";
import type { Identifier } from "../../../value_objects";
import type { Phrase } from "../../data/entities/phrase";
import type { Dictionary } from "../../data/dictionary";
import type { Word } from "../../data/entities/word";
import type { Conjunction } from "../../data/entities/conjunction";
import type { WordForms } from "../../data/word_forms";
import { graphUuid as wordGraphUuid } from "../word_processor";
import { graphUuid as wordFormGraphUuid } from "../word_form_processor";
import { createNounPhrase } from "../../data/entities/noun_phrase";
import { createAdjectivePhrase } from "../../data/entities/adjective_phrase";
import { createAdverbPhrase } from "../../data/entities/adverb_phrase";
import { createPrepositionalPhrase } from "../../data/entities/prepositional_phrase";
import { isConjunction } from "./conjunction_processor";
import { createCoordination } from "../coordination_processor";
import type { Coordination } from "../../data/entities/coordination";
import type { Coordinations } from "../../data/coordinations";
import type { LinguisticUnit } from "../../../linguistics/data/linguistic_unit";
import type { Phrases } from "../../data/phrases";

// classifyPhraseType()'s own closed class of single-word prepositions --
// deliberately its own small, self-contained list rather than a read of
// the Common Vocabulary Cache's prepositions.json (assets/common/en/):
// seedWordNet is documented as a source fully independent of that cache
// (that method's own docstring, role/word_seeder.ts -- "never implied by
// seedDomain and must be called on its own"), and this list only needs
// to answer one narrow question (does a WordNet multi-word lemma's first
// token *read* as a preposition) for a closed class that hasn't changed
// in decades, not stay byte-for-byte in sync with the cache's own
// curated Word set. Verified against the bundled dict/ files (examine-
// then-classify, not guessed): every ADJECTIVE/ADVERB-tagged multi-word
// lemma opening with one of these (dict/data.adj, dict/data.adv) reads
// as a genuine Preposition + complement span on inspection -- "at
// fault", "in advance", "out of the blue", "to the letter" -- while the
// handful of NOUN-tagged lemmas sharing a leading word with this list
// ("down payment", "near miss", "off year") are compound nouns, not
// prepositional phrases (that leading word is a modifier, not a
// governing preposition) -- exactly why classifyPhraseType only applies
// this check for ADJECTIVE/ADVERB, never NOUN (see that function's own
// docstring).
const PHRASE_TYPE_PREPOSITIONS: ReadonlySet<string> = new Set([
  "aboard", "about", "above", "across", "after", "against", "along", "alongside", "amid", "amidst",
  "among", "amongst", "around", "as", "at", "atop", "before", "behind", "below", "beneath", "beside", "besides",
  "between", "beyond", "by", "circa", "concerning", "despite", "down", "during", "except", "excepting", "following",
  "from", "in", "including", "inside", "into", "like", "minus", "near", "notwithstanding", "of", "off", "on", "onto",
  "opposite", "out", "outside", "over", "past", "pending", "per", "plus", "regarding", "round", "save", "since",
  "than", "through", "throughout", "till", "to", "toward", "towards", "under", "underneath", "unlike", "until",
  "unto", "up", "upon", "versus", "via", "with", "within", "without", "worth",
]);

// classifyPhraseType()'s own small denylist of "to "-led lemmas whose
// second token happens to also be a real WordNet verb lemma (advantage,
// boot, date are all attested WordNet verbs), but which are genuinely
// NOT infinitive phrases -- "to date"/"to boot"/"to advantage" use "to"
// as a preposition ("until now", "besides", "to good effect"), not the
// infinitive marker, unlike the genuine infinitives they'd otherwise be
// indistinguishable from by the verbLemmas check alone ("to be sure",
// "to begin with"). Found by enumerating every "to_"-led multi-word
// lemma in dict/data.adv (the only file any occur in) and checking each
// by hand -- 3 false positives out of 36 candidates. A lemma denylisted
// here still gets classified, just via classifyPhraseType's own
// PREPOSITIONAL_PHRASE rule below instead (correctly, in all three
// cases: "to" + NP is exactly what these are structurally).
const INFINITIVE_LOOKALIKE_DENYLIST: ReadonlySet<string> = new Set(["to advantage", "to boot", "to date"]);

// classifyDeterminerPhrase()'s own small denylist of "a "-led lemmas
// whose second token happens to also be a real single-word WordNet Noun
// lemma (Capella the star; carte/mode inside the three-token "a la "
// idioms), but which are genuinely NOT Determiner Phrases -- "a
// capella"/"a la carte"/"a la mode" are Latin/French loans where "a"
// isn't the English indefinite article at all, unlike the genuine
// Determiner Phrases they'd otherwise be indistinguishable from by the
// nounLemmas check alone ("a bit", "a lot"). Found by enumerating every
// "a "-led multi-word ADJECTIVE/ADVERB lemma in the bundled dict/ files
// and checking each by hand -- 3 false positives out of 10 candidates
// whose own tail resolves a real Noun ("a cappella"/"a fortiori"/
// "a posteriori"/"a priori" have no Noun-lexicalized token at all, so
// they're already excluded without needing a denylist entry). A lemma
// denylisted here still gets classified, just via classifyPhraseType's
// own plain POS-based default instead (correctly, in all three cases --
// none is genuinely headed by a noun).
const DETERMINER_PHRASE_LOOKALIKE_DENYLIST: ReadonlySet<string> = new Set(["a capella", "a la carte", "a la mode"]);

/** True when `lemma` is structurally a Determiner Phrase -- the English
 * indefinite article ("a"/"an") followed by a real Noun-quantifier Head
 * ("a bit", "a few", "a lot") -- even though WordNet tags the phrase as
 * a whole by the idiomatic *function* it serves (a degree adverb, a
 * plain adjective), not by this internal *structure*, the identical
 * mismatch the PREPOSITIONAL_PHRASE check in classifyPhraseType() below
 * already corrects for. `nounLemmas` is `verbLemmas`'s own exact
 * counterpart (classifyPhraseType()'s own docstring on why a Dictionary
 * lookup can't be used here) -- every single-word NOUN-tagged lemma
 * across the whole synset list, built once up front by the same caller.
 *
 * Deliberately scoped to "a"/"an" alone, not the full
 * PHRASE_TYPE_DETERMINERS set classifyModifierRoles() below uses --
 * verified directly against the bundled dict/ files: broadening to
 * "all"/"every"/"each"/"the"/"many"/"that"/"what" pulls in over a dozen
 * further idioms ("all right", "all over", "that is to say", "every
 * last", "many a") whose own remaining tokens likewise happen to resolve
 * an unrelated, obscure Noun homograph ("right"'s civil-rights sense,
 * "over"'s cricket-innings sense, "say"'s "have your say" sense) purely
 * by coincidence, not because the idiom is genuinely headed by a noun --
 * correctly separating those from the genuine hits among them ("every
 * week", "each year", "this evening") would need real per-idiom
 * judgement this function doesn't attempt. "a"/"an" alone stays a clean,
 * small, real closed set instead: every hit is a genuine Determiner +
 * Noun-quantifier construction, and DETERMINER_PHRASE_LOOKALIKE_DENYLIST
 * above hand-covers its own three lookalikes exhaustively. */
function classifyDeterminerPhrase(tokens: readonly string[], lemma: string, nounLemmas: ReadonlySet<string>): boolean {
  if (tokens.length < 2 || (tokens[0] !== "a" && tokens[0] !== "an")) return false;
  if (DETERMINER_PHRASE_LOOKALIKE_DENYLIST.has(lemma.toLowerCase())) return false;
  return tokens.slice(1).some((token) => nounLemmas.has(token));
}

/** Chooses this multi-word `lemma`'s PhraseType from its own words and
 * `partOfSpeech` (already WordNet's own ss_type-derived classification,
 * synsetMemberToPhrase's own caller, role/word_seeder.ts) -- devised by
 * enumerating every multi-word lemma actually present in the bundled
 * dict/ files (data.noun/data.verb/data.adj/data.adv) and inspecting the
 * real distribution rather than guessing:
 *
 * - NOUN (~60,400 unique multi-word lemmas): essentially all are plain
 *   noun compounds ("18-karat gold", "toy poodle") -- even the ~50
 *   sharing a leading word with PHRASE_TYPE_PREPOSITIONS ("down
 *   payment", "near miss", "off year") are compound nouns headed by
 *   their last word, not prepositional phrases, so NOUN always maps
 *   straight to NOUN_PHRASE with no override.
 * - VERB (~2,840 unique): overwhelmingly phrasal verbs ("abide by",
 *   "account for", "add up") -- still verb-headed regardless of a
 *   trailing particle/preposition, so VERB always maps straight to
 *   VERB_PHRASE, no override either (and WordNet's own verb lemmas are
 *   never infinitive-marked -- zero "to "-led VERB-tagged lemmas exist
 *   in the bundled data, confirmed by direct inspection).
 * - ADJECTIVE (~510 unique, "a"+"s" ss_types both collapse to ADJECTIVE
 *   already, posForSsType): about a quarter open with a preposition
 *   ("at fault", "in advance", "out of print") -- WordNet tags these
 *   ADJECTIVE because that's the *function* they serve (predicate/
 *   attributive), but their internal *structure* is Preposition + NP,
 *   exactly PhraseType's own PREPOSITIONAL_PHRASE shape, checked ahead
 *   of the POS-based default. A handful more ("a few", "a couple of")
 *   are Determiner Phrases instead, checked the same structural way --
 *   classifyDeterminerPhrase()'s own docstring.
 * - ADVERB (~695 unique): the same PREPOSITIONAL_PHRASE pattern, more
 *   pronounced -- over half open with a preposition ("above all", "by
 *   hand", "in the meantime"). A further handful ("a bit", "a lot", "a
 *   little", "a trifle", "a good/great deal", "a hundred/million times")
 *   are Determiner Phrases WordNet tagged by their idiomatic function as
 *   degree adverbs -- classifyDeterminerPhrase() below.
 * - INFINITIVE_PHRASE has no WordNet ss_type of its own to key off at
 *   all (there's no "infinitive" synset category) -- every genuine case
 *   found ("to be sure", "to begin with") is WordNet-tagged ADVERB, so
 *   this is checked structurally, ahead of everything else: "to" as the
 *   first token, immediately followed by a real WordNet verb lemma
 *   (`verbLemmas`, built from the very same synset list this call is
 *   part of seeding), minus INFINITIVE_LOOKALIKE_DENYLIST's own three
 *   false positives.
 *
 * - PRONOUN has no WordNet ss_type of its own either (WordNet never
 *   assigns a multi-word lemma this part of speech -- dead code against
 *   real WordNet data specifically), but a real, hand-curated source
 *   does: the Common Vocabulary Cache's own pronouns.json carries 17
 *   genuine multi-word PRONOUN idioms ("each other", "one another", "no
 *   one", "someone else", "the former", "the latter", "a few", "a
 *   little", "a lot", "a bit", ...). A Pronoun-headed phrase is
 *   structurally a Noun Phrase -- data/phrase_type_patterns_and_word_roles.md's
 *   own "Phrase Role Allowed Types" table gives NounPhrase's own HEAD
 *   row as "Noun, Pronoun", not "Noun" alone (data/entities/noun_phrase.ts's
 *   own docstring on this exact point) -- so PRONOUN maps straight to
 *   NOUN_PHRASE, the same no-override treatment NOUN itself gets above.
 *
 * Returns `undefined` only for a `partOfSpeech` neither WordNet nor the
 * Common Vocabulary Cache ever assigns to a multi-word lemma
 * (DETERMINER, CONJUNCTION, ...) -- dead code against real bundled data
 * today, kept only so this function has a total, rather than partial,
 * mapping over PartOfSpeech. */
export function classifyPhraseType(
  lemma: string,
  partOfSpeech: PartOfSpeech,
  verbLemmas: ReadonlySet<string>,
  nounLemmas: ReadonlySet<string>,
): PhraseType | undefined {
  const tokens = lemma.trim().toLowerCase().split(/\s+/);
  if (tokens[0] === "to" && tokens.length > 1 && verbLemmas.has(tokens[1]) && !INFINITIVE_LOOKALIKE_DENYLIST.has(lemma.toLowerCase())) {
    return PhraseType.INFINITIVE_PHRASE;
  }
  if (classifyDeterminerPhrase(tokens, lemma, nounLemmas)) {
    return PhraseType.NOUN_PHRASE;
  }
  if (
    (partOfSpeech === PartOfSpeech.ADJECTIVE || partOfSpeech === PartOfSpeech.ADVERB) &&
    PHRASE_TYPE_PREPOSITIONS.has(tokens[0])
  ) {
    return PhraseType.PREPOSITIONAL_PHRASE;
  }
  switch (partOfSpeech) {
    case PartOfSpeech.NOUN:
    case PartOfSpeech.PRONOUN:
      return PhraseType.NOUN_PHRASE;
    case PartOfSpeech.VERB:
      return PhraseType.VERB_PHRASE;
    case PartOfSpeech.ADJECTIVE:
      return PhraseType.ADJECTIVE_PHRASE;
    case PartOfSpeech.ADVERB:
      return PhraseType.ADVERB_PHRASE;
    default:
      return undefined;
  }
}

// classifyModifierRoles()'s own closed set of core English determiners --
// PHRASE_TYPE_PREPOSITIONS's own counterpart, and needed for the exact
// same structural reason: WordNet lexicalizes none of these as a
// standalone sense either (there's no dict/data.* entry for "the" or
// "this" any more than there is for "of"), so Dictionary-only POS
// resolution can never recognise a Determiner in real seeded data
// without this. Deliberately excludes quantity words that double as
// degree adverbs before an Adjective/Adverb ("most reliable", "much
// better") -- "more"/"most"/"less"/"least"/"much"/"no" -- since the
// Determiner Common Rule (data/phrase_type_patterns_and_word_roles.md)
// applies uniformly regardless of PhraseType, and misreading one of
// those as a Determiner inside an AdjectivePhrase/AdverbPhrase would be
// wrong far more often than right; kept to the uncontroversial core
// (articles, demonstratives, possessive determiners, and the plain
// quantifiers/wh-determiners that don't double as degree words).
const PHRASE_TYPE_DETERMINERS: ReadonlySet<string> = new Set([
  "a", "an", "the",
  "this", "that", "these", "those",
  "my", "your", "his", "her", "its", "our", "their",
  "some", "any", "every", "each", "either", "neither", "all", "both", "several", "many", "few", "other", "another",
  "which", "what", "whose",
]);

// classifyModifierRoles()'s own closed set of English adverbs that
// postmodify (follow) rather than premodify (precede) the Adverb they
// qualify -- "quickly enough", "well enough" -- the one well-established
// exception (Quirk et al.'s own postmodification pattern) to the
// otherwise uniform "the later Adverb is the Head" rule every other
// target part of speech below shares. Deliberately a single-entry set,
// not a guess at a broader class: "indeed"/"too"/"so" all premodify or
// need their own clause-level context to parse as postmodifiers, so
// adding them here on spec would misclassify far more real Adverb
// Phrases than the one genuine case this set fixes.
const ADVERB_PHRASE_POSTMODIFIERS: ReadonlySet<string> = new Set(["enough"]);

/** Every Part of Speech `token` could plausibly be read as, for the
 * purposes of classifyModifierRoles() below -- deliberately a *set*, not
 * the single arbitrary homograph `dictionary.lookup` alone would pick
 * (linkPhraseWords()'s own docstring on why that single pick is
 * "structural, not semantic"): a real WordNet lemma is very often
 * genuinely ambiguous across parts of speech ("give" is both a NOUN,
 * rarely, and overwhelmingly a VERB), and picking the wrong single one
 * up front would silently misidentify a phrase's own Head (a VerbPhrase
 * like "give up" would otherwise see "give" resolve to its rare NOUN
 * sense and wrongly hand VerbPhrase's own Head rule to "up" instead).
 * Checking membership in the full set both fixes that and correctly
 * handles a token WordNet doesn't lexicalize on its own at all -- true
 * of nearly every real preposition and determiner ("at", "the"; see
 * linkPhraseWords()'s own "of" example) -- via the same two closed sets
 * classifyPhraseType() itself already relies on for exactly this reason
 * (PHRASE_TYPE_PREPOSITIONS, PHRASE_TYPE_DETERMINERS above). */
function possiblePartsOfSpeech(token: string, dictionary: Dictionary): ReadonlySet<PartOfSpeech> {
  const normalised = token.toLowerCase();
  const pos = new Set(dictionary.lookupAll(token).map((word) => word.partOfSpeech));
  if (PHRASE_TYPE_PREPOSITIONS.has(normalised)) pos.add(PartOfSpeech.PREPOSITION);
  if (PHRASE_TYPE_DETERMINERS.has(normalised)) pos.add(PartOfSpeech.DETERMINER);
  return pos;
}

/** The part(s) of speech `phraseType`'s own Head Identification Rule
 * targets (data/phrase_type_patterns_and_word_roles.md's own "Phrase
 * Role Allowed Types" table, HEAD row, per PhraseType -- NounPhrase's
 * own row allows either Noun or Pronoun, every other PhraseType exactly
 * one). Shared by classifyModifierRoles() below -- deciding *which
 * token position* is Head -- and by linkPhraseWords()'s own
 * resolvedWordFor() -- deciding *which of that position's own
 * homographs* actually is -- so the two can never drift apart. That
 * split used to be the whole bug behind "a few" resolving its own Head
 * to the wrong homograph: classifyModifierRoles() correctly found "few"
 * Noun-capable via possiblePartsOfSpeech()'s own full homograph set once
 * WordNet's own standalone NOUN sense for "few" existed, but
 * linkPhraseWords() went on to resolve the position via
 * `dictionary.lookup()`'s single first-seeded pick regardless -- the
 * closed-class DETERMINER Word "few" (role/determiner_seeder.ts) seeded
 * well before that WordNet sense ever could be, an entirely unrelated
 * word in the same lexical-form/POS-homograph family, not the Word
 * classifyModifierRoles() itself actually matched. */
function headTargetPartsOfSpeech(phraseType: PhraseType): ReadonlySet<PartOfSpeech> {
  switch (phraseType) {
    case PhraseType.NOUN_PHRASE:
      return new Set([PartOfSpeech.NOUN, PartOfSpeech.PRONOUN]);
    case PhraseType.ADJECTIVE_PHRASE:
      return new Set([PartOfSpeech.ADJECTIVE]);
    case PhraseType.ADVERB_PHRASE:
      return new Set([PartOfSpeech.ADVERB]);
    case PhraseType.VERB_PHRASE:
    case PhraseType.INFINITIVE_PHRASE:
      return new Set([PartOfSpeech.VERB]);
    case PhraseType.PREPOSITIONAL_PHRASE:
      return new Set([PartOfSpeech.PREPOSITION]);
  }
}

/** Finds the index of the last token in `possiblePos` whose own set
 * intersects `targetPos`, restricted to positions *before* the first
 * token that could be read as a Preposition, if any -- the shared Head
 * Identification Rule NounPhrase, AdjectivePhrase, and AdverbPhrase all
 * follow in practice (data/phrase_type_patterns_and_word_roles.md's own
 * Word Patterns table): every row headed by one of those three classes
 * either has no Preposition at all (Head is simply the last
 * `targetPos`-capable token overall) or has the Head appear immediately
 * before a trailing "Preposition + complement" span ("(Noun[Head]) +
 * Preposition + Noun", "(Adjective[Head]) + Preposition + Noun") --
 * never after it. Falls back to the last `targetPos`-capable token
 * anywhere in the sequence when none appears before that boundary (a
 * case that table's own rows never exercise, kept only so this stays a
 * total function over any token sequence). Returns `undefined` when no
 * token's own set intersects `targetPos` at all. */
function lastTargetPosBeforeFirstPreposition(possiblePos: readonly ReadonlySet<PartOfSpeech>[], targetPos: ReadonlySet<PartOfSpeech>): number | undefined {
  const matchesTarget = (pos: ReadonlySet<PartOfSpeech>) => [...targetPos].some((target) => pos.has(target));
  const firstPrepositionIndex = possiblePos.findIndex((pos) => pos.has(PartOfSpeech.PREPOSITION));
  const boundary = firstPrepositionIndex === -1 ? possiblePos.length : firstPrepositionIndex;
  for (let i = boundary - 1; i >= 0; i--) {
    if (matchesTarget(possiblePos[i])) return i;
  }
  for (let i = possiblePos.length - 1; i >= boundary; i--) {
    if (matchesTarget(possiblePos[i])) return i;
  }
  return undefined;
}

/** `possiblePos.findIndex(pos => intersects targetPos)`, starting the
 * search at `from` -- Array.prototype.findIndex has no `fromIndex`
 * parameter of its own, so this slices first; wrapped to return
 * `undefined` (this module's own "not found" convention for a position)
 * instead of `-1`. */
function firstIndexWithPos(possiblePos: readonly ReadonlySet<PartOfSpeech>[], targetPos: ReadonlySet<PartOfSpeech>, from: number): number | undefined {
  const index = possiblePos.slice(from).findIndex((pos) => [...targetPos].some((target) => pos.has(target)));
  return index === -1 ? undefined : index + from;
}

/** The index `tokens`' own COMPLEMENT span starts at, for `phraseType`s
 * that actually declare a COMPLEMENT row in their own
 * `PHRASE_TYPE_DETAILS[...].allowedTypes` (data/enums/phrase_type.ts) --
 * NounPhrase, AdjectivePhrase, PrepositionalPhrase; every other
 * PhraseType (VerbPhrase, AdverbPhrase, InfinitivePhrase -- none declare
 * a COMPLEMENT row) always returns `undefined` here. `undefined` either
 * way when there's no Head to complement (`headIndex === undefined`) or
 * nothing follows it.
 *
 * - NounPhrase/AdjectivePhrase: the first post-Head token capable of
 *   reading as a Preposition -- the same `PHRASE_TYPE_PREPOSITIONS`
 *   closed-set membership `classifyPhraseType()` itself already checks
 *   one level up, one Phrase-structure level deeper here: a NounPhrase's
 *   own "(Determiner) + (Modifiers) + Noun/Pronoun + (Complements)"
 *   structure (data/entities/noun_phrase.ts's own docstring) places its
 *   Complement immediately after that Preposition token, running to the
 *   end of `tokens` -- "abatement [of a nuisance]", the reported case
 *   this function exists for. `undefined` when no post-Head token
 *   qualifies (the overwhelmingly common case -- "toy poodle" has none).
 * - PrepositionalPhrase: always `headIndex + 1` when any token follows
 *   the Head, with no further condition -- PrepositionalPhrase's own
 *   "Preposition + Noun phrase/complement + (Modifiers)" structure
 *   places its Complement immediately after its own Preposition Head,
 *   every time ("within [the framework]", "out of [print]"). This
 *   supersedes the narrower, never-exercised-by-real-bundled-data post-
 *   Head Modifier rule `nonHeadModifierRole()` below still carries for
 *   PrepositionalPhrase (that rule's own docstring) -- a genuine
 *   multi-word PrepositionalPhrase always has *something* after its
 *   Head, so this always finds a Complement span there in practice,
 *   leaving that Modifier rule permanently unreachable but not removed,
 *   the same "kept for a case that table's own rows never exercise"
 *   status this module already gives a couple of its own fallback
 *   branches (`lastTargetPosBeforeFirstPreposition`'s own docstring). */
function complementStartIndex(phraseType: PhraseType | undefined, tokens: readonly string[], headIndex: number | undefined): number | undefined {
  if (headIndex === undefined) return undefined;
  switch (phraseType) {
    case PhraseType.NOUN_PHRASE:
    case PhraseType.ADJECTIVE_PHRASE: {
      const prepositionIndex = tokens.findIndex((token, i) => i > headIndex && PHRASE_TYPE_PREPOSITIONS.has(token.toLowerCase()));
      return prepositionIndex === -1 ? undefined : prepositionIndex;
    }
    case PhraseType.PREPOSITIONAL_PHRASE:
      return headIndex + 1 < tokens.length ? headIndex + 1 : undefined;
    default:
      return undefined;
  }
}

/** The PhraseType a COMPLEMENT span's own `tokens` should be built as,
 * once `complementStartIndex()` above has already decided a span
 * exists -- structural, not read off any WordNet-tagged part of speech
 * (there is none for an internal span this codebase invents from
 * constituency parsing, unlike `classifyPhraseType()`'s own top-level
 * WordNet-tagged input). PrepositionalPhrase's own COMPLEMENT allowed-
 * types row (`PHRASE_TYPE_DETAILS[PhraseType.PREPOSITIONAL_PHRASE].allowedTypes`)
 * genuinely allows six shapes (NounPhrase, Pronoun, Adverb, AdverbPhrase,
 * PrepositionalPhrase, Clause) -- only two are actually built here: a
 * nested PrepositionalPhrase when the span itself opens with another
 * Preposition-capable token ("out of [print]" -> "of print" nested one
 * level, itself complementing "of" with the single-token span
 * "print"), NounPhrase otherwise -- the overwhelmingly common real case
 * for both NounPhrase's and AdjectivePhrase's own COMPLEMENT row (which
 * only ever allow PrepositionalPhrase/Clause to begin with, so their
 * own span always opens with a Preposition by construction) and for
 * PrepositionalPhrase's own complement (`PHRASE_TYPE_PREPOSITIONS`'s own
 * closed set of ~80 real English prepositions never doubles as a
 * Pronoun/Adverb). Pronoun/Adverb/AdverbPhrase/Clause complements are
 * never constructed -- documented ahead of any real producer, the same
 * status `ModifierRole.COMPLEMENT` itself had before this function
 * existed (data/enums/modifier_role.ts's own former docstring on it). */
function classifyComplementPhraseType(tokens: readonly string[]): PhraseType {
  return tokens.length > 0 && PHRASE_TYPE_PREPOSITIONS.has(tokens[0].toLowerCase()) ? PhraseType.PREPOSITIONAL_PHRASE : PhraseType.NOUN_PHRASE;
}

/** The PhraseType a run of two or more consecutive MODIFIER- or
 * DETERMINER-role `tokens` should be built as, once `linkPhraseWords()`
 * has already decided the run doesn't collapse. Structural, the same
 * "never read off a WordNet-tagged part of speech" reasoning
 * `classifyComplementPhraseType()` above already has -- there is none
 * for an invented internal span. ADJECTIVE_PHRASE wins whenever any
 * token in the run is ADJECTIVE-capable (the reported case: "attributive
 * genitive" -- both tokens are real ADJECTIVE homographs, dict/index.adj
 * -- classifies here, matching the real independently-seeded
 * "attributive_genitive" ADJECTIVE Phrase exactly), else NOUN_PHRASE
 * whenever any token is NOUN-capable, else ADVERB_PHRASE, else
 * NOUN_PHRASE as the final default. A heuristic ordering, not an
 * exhaustive grammar -- the same pragmatic, documented-limitation spirit
 * `adverbPhraseHeadIndex()` below and `lastTargetPosBeforeFirstPreposition()`'s
 * own fallback branch already have, not a claim this always matches true
 * syntactic structure. */
function classifyModifierPhraseType(tokens: readonly string[], dictionary: Dictionary): PhraseType {
  const possiblePos = tokens.map((token) => possiblePartsOfSpeech(token, dictionary));
  if (possiblePos.some((pos) => pos.has(PartOfSpeech.ADJECTIVE))) return PhraseType.ADJECTIVE_PHRASE;
  if (possiblePos.some((pos) => pos.has(PartOfSpeech.NOUN))) return PhraseType.NOUN_PHRASE;
  if (possiblePos.some((pos) => pos.has(PartOfSpeech.ADVERB))) return PhraseType.ADVERB_PHRASE;
  return PhraseType.NOUN_PHRASE;
}

/** The one token index, strictly between the first and last position of
 * `tokens`, whose own `dictionary.lookupAll()` includes a real
 * `Conjunction` Word with `conjunctionType === ConjunctionType.COORDINATING`
 * -- `WordCoordinationSeeder`'s own identical resolution check
 * (role/word_coordination_seeder.ts), reused here for the same reason:
 * a modifier/determiner run shaped like "big and red" should become one
 * `Coordination`, not one flat nested Phrase whose own internal
 * structure quietly discards the fact it was ever coordinate at all.
 * Binary split only ("X and Y") -- no comma-aware N-ary coordination
 * ("red, white, and blue"): unlike `WordCoordinationSeeder`, which reads
 * N-ary coordinates from a structured JSON `coordinates` array, this
 * parses free text, and a real bundled multi-word WordNet/Common-
 * Vocabulary-Cache lemma never contains a coordinated modifier span at
 * all (verified directly: no `X_and_Y_Z`/`X_or_Y_Z` 3-word lemma exists
 * in dict/data.{noun,adj,verb,adv}, no closed-class JSON lemma contains
 * " and "/" or " either) -- so there is no real shape to generalise
 * against yet. `undefined` when no such token exists. */
function coordinatingConjunctionIndex(tokens: readonly string[], dictionary: Dictionary): number | undefined {
  for (let i = 1; i < tokens.length - 1; i++) {
    if (isCoordinatingConjunctionToken(tokens[i], dictionary)) return i;
  }
  return undefined;
}

/** AdverbPhrase's own Head Identification Rule -- everywhere else
 * `lastTargetPosBeforeFirstPreposition` decides it, except for the one
 * ambiguity that function alone can't resolve: two adjacent tokens both
 * capable of reading as Adverb, with no Preposition between or after
 * them, are structurally identical (ADVERB + ADVERB) whether they're
 * "Adverb[Modifier] + (Adverb[Head])" (a premodifying degree word,
 * "very quickly") or "(Adverb[Head]) + Adverb[Modifier]" (a
 * postmodifying one, "quickly enough") -- both real rows in this
 * codebase's own Word Patterns table. Checked first, using
 * ADVERB_PHRASE_POSTMODIFIERS to break the tie the same closed-set way
 * classifyPhraseType's own PHRASE_TYPE_PREPOSITIONS/
 * INFINITIVE_LOOKALIKE_DENYLIST do; falls through to the shared rule
 * for every other Adverb Phrase shape. */
function adverbPhraseHeadIndex(possiblePos: readonly ReadonlySet<PartOfSpeech>[], tokens: readonly string[]): number | undefined {
  for (let i = 1; i < tokens.length; i++) {
    if (possiblePos[i].has(PartOfSpeech.ADVERB) && possiblePos[i - 1].has(PartOfSpeech.ADVERB) && ADVERB_PHRASE_POSTMODIFIERS.has(tokens[i].toLowerCase())) {
      return i - 1;
    }
  }
  return lastTargetPosBeforeFirstPreposition(possiblePos, headTargetPartsOfSpeech(PhraseType.ADVERB_PHRASE));
}

/** Assigns a ModifierRole (enums/modifier_role.ts) to every one of `tokens`
 * -- called from linkPhraseWords() below, over the same token list its
 * own local `words` resolves, so the two stay index-aligned; neither is
 * stored back onto the Phrase itself (linkPhraseWords()'s own docstring
 * on why). Implements
 * data/phrase_type_patterns_and_word_roles.md's own per-PhraseType Head
 * Identification Rule and Word Role Assignment columns, plus its Common
 * Rules table, deriving each role from every token's own *possible*
 * parts of speech (possiblePartsOfSpeech() above -- not one arbitrarily-
 * picked homograph) and, for the one documented AdverbPhrase ambiguity,
 * the literal token text -- never from `phrase.definition`'s prose, the
 * same "Definition" Common Rule constraint `classifyPhraseType` above
 * already follows for `phraseType` itself.
 *
 * Every rule below was checked against all 28 rows of that document's
 * own Word Patterns table, seeded from the real bundled WordNet data,
 * and reproduces each one exactly, with one documented exception: two
 * adjacent Adverb-capable tokens are ambiguous from part of speech
 * alone (adverbPhraseHeadIndex's own docstring) -- resolved for the one
 * well-established postmodifying case ("enough"), not solved in
 * general.
 *
 * - NounPhrase/AdjectivePhrase/AdverbPhrase: Head is the last token
 *   capable of the matching target Part of Speech before the first
 *   Preposition-capable token (or overall, when there is none) --
 *   lastTargetPosBeforeFirstPreposition/adverbPhraseHeadIndex. Every
 *   Noun/Adjective/Adverb-capable token *before* the Head is a
 *   Modifier; nothing after it is (it either retains its own POS, or --
 *   AdverbPhrase only -- is itself a postmodifying Adverb, already
 *   excluded from being picked as Head above so it falls through to the
 *   same per-position ADVERB check as a pre-head one). NounPhrase/
 *   AdjectivePhrase only: the one post-Head token, if any, that starts a
 *   genuine Complement span (`complementStartIndex()` above) instead
 *   gets ModifierRole.COMPLEMENT -- every token after *that* one carries
 *   no role of its own at all, `undefined` same as an ordinary unrecognised
 *   token, since the whole trailing span becomes one nested Phrase
 *   instead (`linkPhraseWords()`'s own docstring on why).
 * - VerbPhrase: Head is the *first* Verb-capable token (every real row
 *   in the table opens with it). A token capable of reading as Adverb
 *   immediately followed by one capable of reading as Preposition is a
 *   phrasal-verb Particle ("look up to"); any other Adverb-capable
 *   token is a Modifier ("run quickly").
 * - PrepositionalPhrase: Head is the *first* Preposition-capable token
 *   -- deliberately only the first: a second one later in the sequence
 *   ("(Preposition[Head]) + Noun + Preposition + Noun") heads its own
 *   embedded Complement instead (`complementStartIndex()` above always
 *   finds one immediately after the Head for a genuine multi-word
 *   PrepositionalPhrase), which gets ModifierRole.COMPLEMENT; nothing
 *   after that position carries a role of its own, the identical
 *   NounPhrase/AdjectivePhrase reasoning just above.
 * - InfinitivePhrase: "to" (position 0, guaranteed by classifyPhraseType
 *   itself) is always a Particle, never a Head candidate
 *   (data/infinitive_phrase.ts's own docstring on why); Head is the
 *   first Verb-capable token after it. No Modifier/Particle/Determiner
 *   assignment beyond those two positions -- not covered by this
 *   codebase's own Word Patterns table, which has no InfinitivePhrase
 *   rows at all (that table's own note on why).
 *
 * Independent of every rule above: any token capable of reading as
 * DETERMINER always gets ModifierRole.DETERMINER, regardless of position
 * or PhraseType -- the Common Rules table's own "Determiner" row
 * ("Preserve Determiner from the seeded vocabulary") -- *except* a token
 * at or past a Complement span's own start index, which the Complement
 * rule above already claims first: a Determiner genuinely inside a
 * nested Complement ("of [a] nuisance") belongs to that nested Phrase's
 * own `determiners`, not this one's (`linkPhraseWords()`'s own
 * docstring). A token with an empty possible-POS set (`dictionary` has
 * no Word for it and it's in neither closed set) never gets a role. */
export function classifyModifierRoles(phraseType: PhraseType | undefined, tokens: readonly string[], dictionary: Dictionary): readonly (ModifierRole | undefined)[] {
  const roles: (ModifierRole | undefined)[] = tokens.map(() => undefined);
  if (phraseType === undefined || tokens.length === 0) return roles;
  const possiblePos = tokens.map((token) => possiblePartsOfSpeech(token, dictionary));

  let headIndex: number | undefined;
  switch (phraseType) {
    case PhraseType.NOUN_PHRASE:
    case PhraseType.ADJECTIVE_PHRASE:
      headIndex = lastTargetPosBeforeFirstPreposition(possiblePos, headTargetPartsOfSpeech(phraseType));
      break;
    case PhraseType.ADVERB_PHRASE:
      headIndex = adverbPhraseHeadIndex(possiblePos, tokens);
      break;
    case PhraseType.VERB_PHRASE:
      headIndex = firstIndexWithPos(possiblePos, headTargetPartsOfSpeech(phraseType), 0);
      break;
    case PhraseType.PREPOSITIONAL_PHRASE:
      headIndex = firstIndexWithPos(possiblePos, headTargetPartsOfSpeech(phraseType), 0);
      break;
    case PhraseType.INFINITIVE_PHRASE:
      roles[0] = ModifierRole.PARTICLE;
      headIndex = firstIndexWithPos(possiblePos, headTargetPartsOfSpeech(phraseType), 1);
      break;
  }
  if (headIndex !== undefined) roles[headIndex] = ModifierRole.HEAD;
  const complementStart = complementStartIndex(phraseType, tokens, headIndex);
  if (complementStart !== undefined) roles[complementStart] = ModifierRole.COMPLEMENT;

  for (let i = 0; i < tokens.length; i++) {
    if (i === headIndex || (phraseType === PhraseType.INFINITIVE_PHRASE && i === 0)) continue;
    if (complementStart !== undefined && i >= complementStart) continue;
    if (possiblePos[i].has(PartOfSpeech.DETERMINER)) {
      roles[i] = ModifierRole.DETERMINER;
      continue;
    }
    roles[i] = nonHeadModifierRole(phraseType, possiblePos, i, headIndex);
  }
  return roles;
}

/** The non-Head, non-Determiner ModifierRole for position `i` within a
 * Phrase of type `phraseType` whose own Head sits at `headIndex`, given
 * every token's own possible parts of speech `possiblePos` --
 * classifyModifierRoles()'s own per-PhraseType Word Role Assignment
 * switch, see that function's docstring for the full table-by-table
 * justification of each branch below. Returns `undefined` (retain only
 * the word's own Part of Speech, no separate Phrase Role) for every
 * case the matching document's Word Patterns table itself never assigns
 * a role to. */
function nonHeadModifierRole(
  phraseType: PhraseType | undefined,
  possiblePos: readonly ReadonlySet<PartOfSpeech>[],
  i: number,
  headIndex: number | undefined,
): ModifierRole | undefined {
  const pos = possiblePos[i];
  switch (phraseType) {
    case PhraseType.NOUN_PHRASE:
      if (headIndex !== undefined && i < headIndex && (pos.has(PartOfSpeech.NOUN) || pos.has(PartOfSpeech.ADJECTIVE) || pos.has(PartOfSpeech.ADVERB))) {
        return ModifierRole.MODIFIER;
      }
      return undefined;
    case PhraseType.VERB_PHRASE:
      if (pos.has(PartOfSpeech.ADVERB)) {
        return possiblePos[i + 1]?.has(PartOfSpeech.PREPOSITION) ? ModifierRole.PARTICLE : ModifierRole.MODIFIER;
      }
      return undefined;
    case PhraseType.ADJECTIVE_PHRASE:
      if (headIndex !== undefined && i < headIndex && (pos.has(PartOfSpeech.ADVERB) || pos.has(PartOfSpeech.ADJECTIVE))) {
        return ModifierRole.MODIFIER;
      }
      return undefined;
    case PhraseType.ADVERB_PHRASE:
      return pos.has(PartOfSpeech.ADVERB) ? ModifierRole.MODIFIER : undefined;
    case PhraseType.PREPOSITIONAL_PHRASE:
      if (headIndex === undefined) return undefined;
      if (i < headIndex && pos.has(PartOfSpeech.ADVERB)) return ModifierRole.MODIFIER;
      if (i > headIndex && pos.has(PartOfSpeech.ADJECTIVE)) return ModifierRole.MODIFIER;
      return undefined;
    default:
      return undefined;
  }
}

/** The part-of-speech set a coordinate Word inside a MODIFIER or
 * DETERMINER run is allowed to resolve against -- `nonHeadModifierRole()`'s
 * own per-`phraseType` switch just above, re-expressed as the allowed-POS
 * set for that context instead of a per-token role decision, since
 * `resolveCoordinateSide()` (below) needs to resolve each coordinate's own
 * Word by the ROLE this run is playing in its parent Phrase, not by
 * re-guessing a POS from the coordinate tokens' own ambiguous homograph
 * set the way `classifyModifierPhraseType()` does for choosing a brand
 * new nested Phrase's own `phraseType` (a different concern -- that
 * nested Phrase gets its own full recursive `linkPhraseWords()` pass
 * afterward to self-correct any imprecision there; a Coordination's own
 * embedded Word has no such second pass). `role` is always MODIFIER or
 * DETERMINER (`buildModifierUnit()`'s only two callers, `linkPhraseWords()`);
 * DETERMINER ignores `phraseType` entirely -- the Common Rules table's
 * own "Determiner" row applies the same way regardless of PhraseType or
 * position (`Phrase.determiner`'s own docstring). `isPreHead` only
 * matters for PREPOSITIONAL_PHRASE, whose own MODIFIER row is the one
 * case `nonHeadModifierRole()` itself splits by position (ADVERB before
 * the Head, ADJECTIVE after) -- ignored, and may be omitted, for every
 * other `phraseType`/`role` combination. Empty for a `phraseType`/`role`
 * pair no Word Role Assignment row ever assigns MODIFIER to a
 * coordinate-eligible run for (INFINITIVE_PHRASE, `undefined`) --
 * `resolvedWordFor()`'s own graceful "falls back to the first homograph"
 * behavior for an empty target set, `resolveCoordinateSide()`'s own
 * unchanged reasoning either way. */
function modifierRunTargetPos(phraseType: PhraseType | undefined, role: ModifierRole.MODIFIER | ModifierRole.DETERMINER, isPreHead?: boolean): ReadonlySet<PartOfSpeech> {
  if (role === ModifierRole.DETERMINER) return new Set([PartOfSpeech.DETERMINER]);
  switch (phraseType) {
    case PhraseType.NOUN_PHRASE:
      return new Set([PartOfSpeech.NOUN, PartOfSpeech.ADJECTIVE, PartOfSpeech.ADVERB]);
    case PhraseType.VERB_PHRASE:
    case PhraseType.ADVERB_PHRASE:
      return new Set([PartOfSpeech.ADVERB]);
    case PhraseType.ADJECTIVE_PHRASE:
      return new Set([PartOfSpeech.ADVERB, PartOfSpeech.ADJECTIVE]);
    case PhraseType.PREPOSITIONAL_PHRASE:
      return new Set([isPreHead ? PartOfSpeech.ADVERB : PartOfSpeech.ADJECTIVE]);
    default:
      return new Set();
  }
}

/** Breaks `phrase`'s own `text` into its whitespace-separated tokens
 * ("toy poodle" -> ["toy", "poodle"]) and resolves every one of
 * `phrase.headWord`/`phrase.headWordForm`/`phrase.preModifier`/
 * `phrase.postModifier`/`phrase.determiner` (data/entities/phrase.ts's own
 * docstring on each) from that decomposition -- `words`/`wordRoles`
 * themselves (each token's own resolved Word reference and
 * classifyModifierRoles()'s own per-token role) are local to this
 * function, not stored back onto the Phrase: once the five fields above
 * exist as their own typed, purpose-built results, keeping the full
 * per-token arrays around too would just duplicate the same facts in a
 * second, untyped shape no real caller reads directly
 * (data_entity_design_decisions_log.md).
 *
 * `dictionary.lookup` matches case-insensitively and, for a token with
 * more than one homograph, picks its own first-seeded sense (the same
 * arbitrary-but-deterministic choice definitionWords() already makes
 * for a definition token, word_processor.ts) -- this is a structural
 * decomposition of the phrase's own spelling, not a semantic claim
 * about which sense of "toy" is meant. A token resolves to no Word at
 * all when `dictionary` has none for it (WordNet itself never
 * lexicalizes some closed-class function words -- "rule of thumb"'s
 * own "of" -- as a standalone sense). classifyModifierRoles()
 * deliberately doesn't reuse this single arbitrary-homograph
 * resolution, though -- it resolves every token's own full *set* of
 * possible parts of speech instead (possiblePartsOfSpeech(), this
 * module), since relying on one arbitrary pick here would misidentify a
 * phrase's own Head whenever that pick happens to land on the wrong
 * homograph (that function's own docstring has the "give up" example).
 * The Head position specifically carries this one step further still:
 * `words[headIndex]` is resolved via `resolvedWordFor()` below, not the
 * same first-seeded `dictionary.lookup()` pick every other position
 * uses -- searching every one of that token's own homographs for the
 * one actually matching `headTargetPartsOfSpeech(phrase.phraseType)`,
 * the identical target classifyModifierRoles() itself already matched
 * to identify this position as Head in the first place. Without this,
 * a real bundled-data case broke: "a few" (pronouns.json) correctly
 * identifies "few" as its own Head once WordNet seeds a standalone NOUN
 * sense for it ("a small elite group") -- but "few" is *also* a real
 * closed-class DETERMINER Word (role/determiner_seeder.ts), seeded
 * earlier, so `dictionary.lookup("few")`'s own first-seeded pick landed
 * on that entirely unrelated DETERMINER homograph instead of the Noun
 * `headTargetPartsOfSpeech` actually meant.
 *
 * `headWord` is whichever token position (if any) `wordRoles` holds
 * ModifierRole.HEAD for. `headWordForm` resolves that Head's own
 * resolved Word against `wordForms`, finding the one registered
 * WordForm (if any) whose own spelling case-insensitively matches this
 * Head's literal occurrence in `phrase.text` -- the same match
 * `definitionWordSegment()` performs (ui/server/builder_segment.ts).
 * `matchingFormId()` below is this exact single-token resolution;
 * `singleTokenModifierId()` further below is its own standalone
 * counterpart, used the identical way for a lone MODIFIER/DETERMINER
 * token -- both are "the one WordForm on this token's own resolved Word
 * spelled the way this token actually appears here", a token whose own
 * resolved Word carries no such WordForm resolving to `undefined`
 * rather than guessed at (`headWordForm`'s own docstring on this same
 * narrowing). `wordForms` is optional, matching every other seeding
 * pass's own `Senses`/`WordForms` convention -- omitted, every
 * WordForm-dependent field stays `undefined` even when a Head or
 * Modifier was identified.
 *
 * `preModifier`/`postModifier`/`determiner` each resolve one maximal
 * run of same-role tokens (`buildModifierUnit()` below) -- MODIFIER
 * tokens split into a pre-Head run and a post-Head run
 * (`preHeadModifierRun()`/`postHeadModifierRun()`), DETERMINER tokens
 * into one run regardless of position (`determinerRun()`, the Common
 * Rules table's own "Determiner" row applies regardless of position,
 * data/phrase_type_patterns_and_word_roles.md). A run of exactly one
 * token resolves the same way it always did -- a bare WordForm
 * `Identifier` (`singleTokenModifierId()`). A run of two or more tokens
 * is where this now genuinely differs from before: it becomes one
 * nested Phrase (`buildNestedPhrase()`, `classifyModifierPhraseType()`'s
 * own docstring on which PhraseType) or, when a genuine coordinating
 * conjunction sits inside the run ("big and red"), one real
 * `Coordination` (`coordinatingConjunctionIndex()`/
 * `registerModifierCoordination()`) -- the reported fix: "attributive
 * genitive case" used to give two independent, unrelated `preModifiers`
 * entries for "attributive" and "genitive" even though "attributive
 * genitive" is itself a real, independently-seeded two-word ADJECTIVE
 * lemma; it now collapses into that one nested AdjectivePhrase instead.
 *
 * One narrow, deliberate exception: a DETERMINER run that consumes
 * every token of `tokens` (only possible when there is no Head at all --
 * "each other", pronouns.json, neither "each" nor "other" resolving to
 * a Noun/Pronoun Word of its own) is never collapsed, even at length 2 --
 * doing so would build a nested Phrase whose own `text` is identical to
 * this Phrase's own, and recursively linking it would never terminate
 * (an identical child, forever). That one case resolves to the run's own
 * first token alone, `singleTokenModifierId()`'s plain single-token
 * treatment, dropping the rest -- a narrow, documented compromise for
 * this one idiom shape, not a general limitation.
 *
 * `phrase.complements` also genuinely builds a nested sub-Phrase, the
 * identical `buildNestedPhrase()` mechanism `preModifier`/`postModifier`/
 * `determiner` now share: when `classifyModifierRoles()` finds a
 * ModifierRole.COMPLEMENT position (`complementStartIndex()`'s own
 * docstring on exactly which token, per PhraseType), every token from
 * there to the end of `tokens` becomes one nested Phrase (a
 * PrepositionalPhrase or NounPhrase, `classifyComplementPhraseType()`'s
 * own docstring on which), complete with its own `headWord`/
 * `headWordForm`/`preModifier`/`postModifier`/`determiner`/`complements`.
 * `complements` stays an array (`data/entities/phrase.ts`'s own docstring
 * on why, unlike the three singular fields), always set (possibly
 * empty), never left `undefined`, whenever this function runs at all.
 *
 * `phrases` (optional, the same convention `wordForms` already has) is
 * this parent's own Phrases store -- when supplied, every nested Phrase
 * this function builds (for a Complement span, or for a collapsed
 * Modifier/Determiner run) is found-or-created directly *in* that store
 * (`registerNestedPhrase()`), so it becomes its own real, independently-
 * listed and independently-searchable entry, the same as a real
 * WordNet-seeded multi-word Phrase -- not just an object reachable only
 * by walking into its parent's own fields. `coordinations` (optional,
 * the identical convention) is this parent's own Coordinations store --
 * when supplied, every Coordination this function builds is likewise
 * found-or-created directly in it (`registerModifierCoordination()`).
 * Either store omitted, the corresponding nested Phrase/Coordination is
 * still built and fully linked exactly the same way, just never
 * registered anywhere -- purely an embedded, in-memory detail. */
/** `token`'s own resolved Word actually matching `targetPos` --
 * `linkPhraseWords()`'s own Head-position fix, `possiblePartsOfSpeech()`'s
 * full-homograph-set reasoning carried one step further: unlike
 * `dictionary.lookup()`'s single first-seeded-homograph pick, this
 * searches every one of `token`'s own homographs for the one actually
 * satisfying `targetPos`, falling back to `dictionary.lookup()`'s own
 * single pick only when none of them do (a role assigned via one of the
 * two synthetic closed-set memberships `possiblePartsOfSpeech()` itself
 * adds -- PHRASE_TYPE_PREPOSITIONS/PHRASE_TYPE_DETERMINERS -- carries no
 * real Word to resolve at all either way, so there's nothing more
 * specific to fall back to). */
function resolvedWordFor(token: string, targetPos: ReadonlySet<PartOfSpeech>, dictionary: Dictionary): Word | undefined {
  const homographs = dictionary.lookupAll(token);
  return homographs.find((word) => targetPos.has(word.partOfSpeech)) ?? dictionary.lookup(token);
}

/** `token`'s own WordForm reference, the standalone counterpart of
 * `linkPhraseWords()`'s own local `matchingFormId()` closure for a
 * single non-Head MODIFIER/DETERMINER token -- functionally identical
 * (`dictionary.lookup(token)` is exactly what `matchingFormId()` already
 * resolves any non-Head position to), just usable from a top-level
 * function that isn't itself a closure over `linkPhraseWords()`'s own
 * `words`/`tokens`, since `buildModifierUnit()` below is called with an
 * arbitrary token sub-span, not a whole-phrase index. `undefined` when
 * `dictionary` has no Word for `token` at all, or when its resolved
 * Word carries no WordForm spelled exactly the way `token` appears --
 * `headWordForm`'s own identical narrowing (data/entities/phrase.ts). */
function singleTokenModifierId(token: string, dictionary: Dictionary, wordForms?: WordForms): Identifier | undefined {
  const word = dictionary.lookup(token);
  if (word === undefined || wordForms === undefined) return undefined;
  const form = wordForms.formsOf(word).find((candidate) => candidate.text.value.toLowerCase() === token.toLowerCase());
  return form === undefined ? undefined : { value: wordFormGraphUuid(form) };
}

/** The `partOfSpeech` a synthetic, constituency-derived nested Phrase
 * gets tagged with in `Phrases.append()` -- there is no WordNet tag to
 * carry over (`classifyComplementPhraseType()`/`classifyModifierPhraseType()`'s
 * own docstrings), so this invents a fresh, self-consistent one instead
 * of borrowing an arbitrary existing tag: NOUN for a NounPhrase (matching
 * `classifyPhraseType()`'s own NOUN -> NOUN_PHRASE default one Phrase-
 * structure level up), ADJECTIVE/ADVERB for an Adjective/AdverbPhrase
 * the same direct way, PREPOSITION for a PrepositionalPhrase -- genuinely
 * used for once, unlike every real WordNet-tagged PrepositionalPhrase,
 * which is always ADJECTIVE/ADVERB-tagged instead
 * (`data/entities/prepositional_phrase.ts`'s own docstring on why). This
 * also usefully distinguishes a constituency-derived nested Phrase from
 * a WordNet one at the `Phrases.partOfSpeechOf()` level, should a caller
 * ever need to tell them apart. */
function partOfSpeechForPhraseType(phraseType: PhraseType): PartOfSpeech {
  switch (phraseType) {
    case PhraseType.PREPOSITIONAL_PHRASE:
      return PartOfSpeech.PREPOSITION;
    case PhraseType.ADJECTIVE_PHRASE:
      return PartOfSpeech.ADJECTIVE;
    case PhraseType.ADVERB_PHRASE:
      return PartOfSpeech.ADVERB;
    default:
      return PartOfSpeech.NOUN;
  }
}

/** Builds a bare `phraseType`-shaped Phrase for `text` -- the one-of-four
 * dispatch `registerNestedPhrase()`/`buildNestedPhrase()` below both
 * need, kept as its own function so neither has to repeat it. */
function createNestedPhrase(phraseType: PhraseType, text: string): Phrase {
  switch (phraseType) {
    case PhraseType.PREPOSITIONAL_PHRASE:
      return createPrepositionalPhrase({ text });
    case PhraseType.ADJECTIVE_PHRASE:
      return createAdjectivePhrase({ text });
    case PhraseType.ADVERB_PHRASE:
      return createAdverbPhrase({ text });
    default:
      return createNounPhrase({ text });
  }
}

/** Finds or creates `text`'s own nested Phrase in `phrases`, so a
 * genuine, real constituent -- a Complement span ("of a nuisance") or a
 * collapsed multi-word Modifier/Determiner run ("attributive genitive")
 * alike -- becomes its own independently-listed, independently-
 * searchable entry in the Phrases store, not just an object embedded
 * inside its parent's own fields. Reuses an existing entry (matched by
 * `text` + `phraseType` + the same synthetic `partOfSpeech`
 * `partOfSpeechForPhraseType()` above assigns) rather than appending a
 * second copy whenever one already exists -- the same (text, tag) dedup
 * shape `word_seeder.ts`'s own WordNet Phrase append site already uses
 * for exactly the same reason. This is what keeps the whole feature
 * idempotent: `linkPhraseWords()` genuinely runs more than once over the
 * same real Phrase within a single seeding pass (`word_seeder.ts`'s own
 * closed-class-then-WordNet re-link pass) and again on every repeat
 * `seedWordNet()` call, and without this reuse check each of those would
 * append its own fresh duplicate every single time. A reused entry still
 * gets recursively re-linked below (`buildNestedPhrase()`'s own caller)
 * -- harmless and idempotent, `word_seeder.ts`'s own "simply recomputes
 * the identical result again" precedent for the closed-class re-link
 * pass. */
function registerNestedPhrase(phrases: Phrases, text: string, phraseType: PhraseType): Phrase {
  const partOfSpeech = partOfSpeechForPhraseType(phraseType);
  const existing = phrases.lookupAll(text).find((candidate) => candidate.phraseType === phraseType && phrases.partOfSpeechOf(candidate) === partOfSpeech);
  if (existing !== undefined) return existing;
  const created = createNestedPhrase(phraseType, text);
  phrases.append(created, partOfSpeech);
  return created;
}

/** Builds and fully links the one nested Phrase a Complement span, or a
 * collapsed Modifier/Determiner run, own `tokens` become --
 * `linkPhraseWords()`'s own docstring on both call shapes. `phraseType`
 * is decided by the caller (`classifyComplementPhraseType()` for a
 * Complement span, `classifyModifierPhraseType()` for a Modifier/
 * Determiner run or a coordinate side) -- never read off a WordNet-
 * tagged part of speech, there is none for an invented internal span.
 * When `phrases` is supplied, the Phrase itself is found-or-created via
 * `registerNestedPhrase()` above, so it becomes its own real,
 * independently-listed entry in the Phrases store; when omitted
 * (matching every other optional-store convention `linkPhraseWords()`
 * already has), it's built bare via `createNestedPhrase()` and never
 * registered anywhere, staying purely an embedded, in-memory detail of
 * its parent's own fields. Either way, the recursive `linkPhraseWords()`
 * call populates everything else on it exactly as if it had been a real
 * top-level Phrase all along -- including its own nested `complements`/
 * `preModifier`/`postModifier`/`determiner`, so a span nested two
 * Prepositions deep ("out of [print]" -> "of [print]" nested once more
 * inside that) resolves correctly, and (when `phrases`/`coordinations`
 * are supplied) registers itself the same way, without this function
 * needing its own separate recursion limit or loop. */
function buildNestedPhrase(
  tokens: readonly string[],
  phraseType: PhraseType,
  dictionary: Dictionary,
  wordForms?: WordForms,
  phrases?: Phrases,
  coordinations?: Coordinations<LinguisticUnit>,
): Phrase {
  const text = tokens.join(" ");
  const nested = phrases !== undefined ? registerNestedPhrase(phrases, text, phraseType) : createNestedPhrase(phraseType, text);
  linkPhraseWords(nested, dictionary, wordForms, phrases, coordinations);
  return nested;
}

/** One side of a coordinated Modifier/Determiner run ("big" or "red" in
 * "big and red") -- length 1 resolves via `resolvedWordFor()` against
 * `targetPos` (the same POS-aware resolution the Head position itself
 * gets, more precise than `singleTokenModifierId()`'s plain first-
 * homograph pick, since a coordinate side's own Word is embedded
 * directly into `Coordination.coordinates`, not referenced by
 * `Identifier` -- `createCoordination()`'s own established "embed real
 * objects, not references" shape, `WordCoordinationSeeder`'s identical
 * precedent); length 2 or more recurses into one further nested Phrase
 * via `buildNestedPhrase()`, one level only -- a coordinate side is
 * never itself searched for a second, nested coordination (no real
 * bundled data ever exercises this, `coordinatingConjunctionIndex()`'s
 * own docstring). `undefined` only when `tokens` is empty, which
 * `coordinatingConjunctionIndex()`'s own bounds (`1 <= i <= length - 2`)
 * already guarantee never happens for either side. */
function resolveCoordinateSide(
  tokens: readonly string[],
  targetPos: ReadonlySet<PartOfSpeech>,
  dictionary: Dictionary,
  wordForms?: WordForms,
  phrases?: Phrases,
  coordinations?: Coordinations<LinguisticUnit>,
): Word | Phrase | undefined {
  if (tokens.length === 0) return undefined;
  if (tokens.length === 1) return resolvedWordFor(tokens[0], targetPos, dictionary);
  return buildNestedPhrase(tokens, classifyModifierPhraseType(tokens, dictionary), dictionary, wordForms, phrases, coordinations);
}

/** Finds or creates a `Coordination` for `coordinates`/`coordinator` in
 * `coordinations` -- `Coordinations` has no text index at all
 * (documented design choice, data/coordinations.ts: "a Coordination
 * carries no `text` of its own to index"), so dedup here is a linear
 * scan comparing each coordinate's own `entryId.uuid` in order (a Word,
 * Phrase, and nested Coordination alike all carry that field) plus the
 * coordinator's own `value` -- cheap, a real Coordinations store stays
 * small. `registerNestedPhrase()`'s own reuse-before-create shape,
 * adapted to the store this actually has. Builds via `createCoordination()`
 * (role/coordination_processor.ts) when no match is found. `coordinator`
 * is resolved by the caller against the *existing* WordForm on the
 * matched Conjunction Word (`singleTokenModifierId()`) -- this function
 * never registers a new WordForm, `linkPhraseWords()`'s own identical
 * invariant. */
function registerModifierCoordination(
  coordinations: Coordinations<LinguisticUnit>,
  coordinates: readonly (Word | Phrase)[],
  coordinator: Identifier | undefined,
): Coordination<Word | Phrase> {
  // `coordinations.all()` is typed `Coordination<LinguisticUnit>` (the
  // store's own broad, mixed-specialisation shape, data/coordinations.ts's
  // own docstring) -- every coordinate here is in fact a Word or Phrase
  // (this function's own real callers, `buildModifierUnit()`), both of
  // which genuinely carry `entryId` despite `LinguisticUnit` itself not
  // declaring it, so the cast below is safe at runtime.
  const existing = coordinations.all().find((candidate) => {
    if (candidate.coordinates.length !== coordinates.length) return false;
    if ((candidate.coordinator?.value ?? undefined) !== (coordinator?.value ?? undefined)) return false;
    return candidate.coordinates.every((entry, i) => (entry as { entryId: Identifier }).entryId.uuid === coordinates[i].entryId.uuid);
  });
  if (existing !== undefined) return existing as unknown as Coordination<Word | Phrase>;
  const created = createCoordination<Word | Phrase>({ coordinates, coordinator });
  coordinations.append(created);
  return created;
}

/** Resolves one maximal run of same-role `tokens` (length 1 or more) to
 * `phrase.preModifier`/`postModifier`/`determiner`'s own value --
 * `linkPhraseWords()`'s own docstring on when each of the three calls
 * this, and on the one determiner-only exception it never reaches this
 * function for. Length 1 -> `singleTokenModifierId()` (unchanged from
 * before this feature). Length 2 or more -> `coordinatingConjunctionIndex()`
 * first: found -> split the run around it, `resolveCoordinateSide()`
 * each half against `targetPos` (`modifierRunTargetPos()`'s own docstring
 * on why this, not `classifyModifierPhraseType()`, decides each
 * coordinate Word's own POS -- the run's *role* in its parent Phrase
 * already pins that down, it isn't re-guessed from the coordinate
 * tokens' own ambiguous homograph set), `registerModifierCoordination()`
 * (or a bare, unregistered `createCoordination()` when `coordinations`
 * is omitted); not found -> `classifyModifierPhraseType()` +
 * `buildNestedPhrase()`, one flat nested Phrase for the whole run --
 * unlike the coordination branch, this one DOES still classify from the
 * run's own tokens, since it's deciding a brand new nested Phrase's own
 * `phraseType`, not a single Word's POS, and that nested Phrase gets its
 * own full recursive `linkPhraseWords()` pass afterward to self-correct
 * any imprecision here. `undefined` when `tokens` is empty (no run at
 * all). */
function buildModifierUnit(
  tokens: readonly string[],
  targetPos: ReadonlySet<PartOfSpeech>,
  dictionary: Dictionary,
  wordForms?: WordForms,
  phrases?: Phrases,
  coordinations?: Coordinations<LinguisticUnit>,
): Identifier | Phrase | Coordination<Word | Phrase> | undefined {
  if (tokens.length === 0) return undefined;
  if (tokens.length === 1) return singleTokenModifierId(tokens[0], dictionary, wordForms);

  const conjunctionIndex = coordinatingConjunctionIndex(tokens, dictionary);
  if (conjunctionIndex !== undefined) {
    const leftTokens = tokens.slice(0, conjunctionIndex);
    const rightTokens = tokens.slice(conjunctionIndex + 1);
    const left = resolveCoordinateSide(leftTokens, targetPos, dictionary, wordForms, phrases, coordinations);
    const right = resolveCoordinateSide(rightTokens, targetPos, dictionary, wordForms, phrases, coordinations);
    if (left !== undefined && right !== undefined) {
      const coordinatorWord = dictionary
        .lookupAll(tokens[conjunctionIndex])
        .find((word): word is Conjunction => isConjunction(word) && word.conjunctionType === ConjunctionType.COORDINATING);
      const coordinatorId = coordinatorWord !== undefined ? singleTokenModifierId(tokens[conjunctionIndex], dictionary, wordForms) : undefined;
      return coordinations !== undefined
        ? registerModifierCoordination(coordinations, [left, right], coordinatorId)
        : createCoordination<Word | Phrase>({ coordinates: [left, right], coordinator: coordinatorId });
    }
  }

  return buildNestedPhrase(tokens, classifyModifierPhraseType(tokens, dictionary), dictionary, wordForms, phrases, coordinations);
}

/** Whether `tokens[index]` resolves to a real COORDINATING `Conjunction`
 * Word -- `coordinatingConjunctionIndex()`'s own membership check, pulled
 * out as its own predicate so `extendRunBackward()`/`extendRunForward()`
 * below can reuse it to recognise a coordinator sitting inside an
 * otherwise-contiguous MODIFIER/DETERMINER run ("big *and* red"), not
 * just to locate one already known to be inside a run. */
function isCoordinatingConjunctionToken(token: string, dictionary: Dictionary): boolean {
  return dictionary.lookupAll(token).some((word): word is Conjunction => isConjunction(word) && word.conjunctionType === ConjunctionType.COORDINATING);
}

/** Extends a same-`role` run backward from `start` (exclusive) as far as
 * it goes -- one token at a time for an ordinary contiguous run, or two
 * at a time when the immediately preceding token is a real coordinating
 * conjunction (`isCoordinatingConjunctionToken()`) bridging back to
 * another same-`role` token just beyond it ("red" <- "and" <- "big", for
 * a MODIFIER run) -- `classifyModifierRoles()` never assigns MODIFIER or
 * DETERMINER to a Conjunction-only token itself (`nonHeadModifierRole()`'s
 * own switch has no Conjunction-role branch, `possiblePartsOfSpeech()`
 * never returns CONJUNCTION alongside NOUN/ADJECTIVE/ADVERB/DETERMINER
 * for any of "and"/"or"/"nor"/"but"), so without this bridge a
 * coordinator embedded in a run would stop `preHeadModifierRun()`/
 * `postHeadModifierRun()`/`determinerRun()` right at its own position,
 * the same way any other non-`role` token does -- `buildModifierUnit()`'s
 * own `coordinatingConjunctionIndex()` split would then never see it,
 * since it only ever runs over whatever span these three functions
 * already decided was the run. Only ever bridges one coordinator deep on
 * either side, matching `coordinatingConjunctionIndex()`'s own binary-
 * split-only scope ("X and Y", never a comma-joined "X, Y, and Z"). */
function extendRunBackward(wordRoles: readonly (ModifierRole | undefined)[], tokens: readonly string[], dictionary: Dictionary, start: number, role: ModifierRole): number {
  while (start > 0) {
    if (wordRoles[start - 1] === role) {
      start -= 1;
      continue;
    }
    if (start > 1 && wordRoles[start - 1] === undefined && wordRoles[start - 2] === role && isCoordinatingConjunctionToken(tokens[start - 1], dictionary)) {
      start -= 2;
      continue;
    }
    break;
  }
  return start;
}

/** `extendRunBackward()`'s own forward counterpart. */
function extendRunForward(wordRoles: readonly (ModifierRole | undefined)[], tokens: readonly string[], dictionary: Dictionary, end: number, role: ModifierRole): number {
  while (end + 1 < wordRoles.length) {
    if (wordRoles[end + 1] === role) {
      end += 1;
      continue;
    }
    if (end + 2 < wordRoles.length && wordRoles[end + 1] === undefined && wordRoles[end + 2] === role && isCoordinatingConjunctionToken(tokens[end + 1], dictionary)) {
      end += 2;
      continue;
    }
    break;
  }
  return end;
}

/** The maximal run of pre-Head MODIFIER-role `wordRoles`, immediately
 * adjacent to `headIndex` -- `[start, end)` token indices, `undefined`
 * when the token immediately before the Head isn't itself MODIFIER-role
 * (no run at all). Every real Word Role Assignment row places a
 * NounPhrase/AdjectivePhrase/AdverbPhrase's own pre-Head Modifiers
 * immediately before the Head with nothing else between, so an ordinary
 * run is genuinely contiguous -- but `extendRunBackward()`'s own bridging
 * lets this reach one token further back across a real coordinating
 * conjunction ("big and red" -> one run of three, not two separate
 * one-token Modifiers either side of an unrecognised "and"). */
function preHeadModifierRun(wordRoles: readonly (ModifierRole | undefined)[], headIndex: number, tokens: readonly string[], dictionary: Dictionary): [number, number] | undefined {
  if (headIndex <= 0 || wordRoles[headIndex - 1] !== ModifierRole.MODIFIER) return undefined;
  return [extendRunBackward(wordRoles, tokens, dictionary, headIndex - 1, ModifierRole.MODIFIER), headIndex];
}

/** `preHeadModifierRun()`'s own post-Head counterpart. */
function postHeadModifierRun(wordRoles: readonly (ModifierRole | undefined)[], headIndex: number, tokens: readonly string[], dictionary: Dictionary): [number, number] | undefined {
  if (headIndex === -1 || headIndex >= wordRoles.length - 1 || wordRoles[headIndex + 1] !== ModifierRole.MODIFIER) return undefined;
  return [headIndex + 1, extendRunForward(wordRoles, tokens, dictionary, headIndex + 1, ModifierRole.MODIFIER) + 1];
}

/** The maximal run of DETERMINER-role `wordRoles`, starting at the first
 * one found -- `[start, end)` token indices, `undefined` when no token
 * carries the role at all. Unlike `preHeadModifierRun()`/
 * `postHeadModifierRun()`, this never gates on a Head position (the
 * Common Rules table's own "Determiner" row applies regardless of
 * position or PhraseType, `Phrase.determiner`'s own docstring), so it
 * scans the whole token list -- ordinarily a genuinely contiguous run
 * ("each other", both tokens DETERMINER, positions 0-1, the one real
 * bundled multi-token case), extended the same `extendRunForward()` way
 * as `postHeadModifierRun()` across a real coordinating conjunction
 * ("his or her", never a real bundled example either, but structurally
 * identical to a coordinated Modifier run). */
function determinerRun(wordRoles: readonly (ModifierRole | undefined)[], tokens: readonly string[], dictionary: Dictionary): [number, number] | undefined {
  const start = wordRoles.indexOf(ModifierRole.DETERMINER);
  if (start === -1) return undefined;
  return [start, extendRunForward(wordRoles, tokens, dictionary, start, ModifierRole.DETERMINER) + 1];
}

export function linkPhraseWords(
  phrase: Phrase,
  dictionary: Dictionary,
  wordForms?: WordForms,
  phrases?: Phrases,
  coordinations?: Coordinations<LinguisticUnit>,
): void {
  const tokens = phrase.text.trim().split(/\s+/).filter((token) => token.length > 0);
  const wordRoles = classifyModifierRoles(phrase.phraseType, tokens, dictionary);
  const headIndex = wordRoles.indexOf(ModifierRole.HEAD);
  const headTargets = headIndex !== -1 && phrase.phraseType !== undefined ? headTargetPartsOfSpeech(phrase.phraseType) : undefined;
  const words = tokens.map((token, i) => {
    const word = i === headIndex && headTargets !== undefined ? resolvedWordFor(token, headTargets, dictionary) : dictionary.lookup(token);
    return word === undefined ? undefined : { value: wordGraphUuid(word) };
  });

  const matchingFormId = (i: number): Identifier | undefined => {
    const wordId = words[i];
    const word = wordId === undefined ? undefined : dictionary.findByUuid(wordId.value);
    if (word === undefined || wordForms === undefined) return undefined;
    const form = wordForms.formsOf(word).find((candidate) => candidate.text.value.toLowerCase() === tokens[i].toLowerCase());
    return form === undefined ? undefined : { value: wordFormGraphUuid(form) };
  };

  phrase.headWord = headIndex === -1 ? undefined : words[headIndex];
  phrase.headWordForm = headIndex === -1 ? undefined : matchingFormId(headIndex);

  const complementIndex = wordRoles.indexOf(ModifierRole.COMPLEMENT);
  phrase.complements =
    complementIndex === -1
      ? []
      : [buildNestedPhrase(tokens.slice(complementIndex), classifyComplementPhraseType(tokens.slice(complementIndex)), dictionary, wordForms, phrases, coordinations)];

  const preRun = preHeadModifierRun(wordRoles, headIndex, tokens, dictionary);
  phrase.preModifier =
    preRun === undefined
      ? undefined
      : buildModifierUnit(tokens.slice(preRun[0], preRun[1]), modifierRunTargetPos(phrase.phraseType, ModifierRole.MODIFIER, true), dictionary, wordForms, phrases, coordinations);

  const postRun = postHeadModifierRun(wordRoles, headIndex, tokens, dictionary);
  phrase.postModifier =
    postRun === undefined
      ? undefined
      : buildModifierUnit(tokens.slice(postRun[0], postRun[1]), modifierRunTargetPos(phrase.phraseType, ModifierRole.MODIFIER, false), dictionary, wordForms, phrases, coordinations);

  const detRun = determinerRun(wordRoles, tokens, dictionary);
  if (detRun === undefined) {
    phrase.determiner = undefined;
  } else if (detRun[0] === 0 && detRun[1] === tokens.length) {
    // The one deliberate exception a Determiner run never collapses for
    // -- `linkPhraseWords()`'s own docstring on why ("each other" would
    // otherwise recurse forever into an identical child).
    phrase.determiner = singleTokenModifierId(tokens[detRun[0]], dictionary, wordForms);
  } else {
    phrase.determiner = buildModifierUnit(tokens.slice(detRun[0], detRun[1]), modifierRunTargetPos(phrase.phraseType, ModifierRole.DETERMINER), dictionary, wordForms, phrases, coordinations);
  }
}
