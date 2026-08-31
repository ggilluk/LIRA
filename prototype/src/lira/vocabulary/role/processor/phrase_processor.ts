import { PartOfSpeech } from "../../data/enums/part_of_speech";
import { ModifierRole } from "../../data/enums/modifier_role";
import { PhraseType } from "../../data/enums/phrase_type";
import type { Identifier } from "../../../value_objects";
import type { Phrase } from "../../data/phrase";
import type { Dictionary } from "../../data/dictionary";
import type { Word } from "../../data/entities/word";
import type { WordForms } from "../../data/word_forms";
import { graphUuid as wordGraphUuid } from "../word_processor";
import { graphUuid as wordFormGraphUuid } from "../word_form_processor";

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
 *   same per-position ADVERB check as a pre-head one).
 * - VerbPhrase: Head is the *first* Verb-capable token (every real row
 *   in the table opens with it). A token capable of reading as Adverb
 *   immediately followed by one capable of reading as Preposition is a
 *   phrasal-verb Particle ("look up to"); any other Adverb-capable
 *   token is a Modifier ("run quickly").
 * - PrepositionalPhrase: Head is the *first* Preposition-capable token
 *   -- deliberately only the first: a second one later in the sequence
 *   ("(Preposition[Head]) + Noun + Preposition + Noun") heads its own
 *   embedded complement instead and keeps only its own POS, no role. A
 *   pre-head Adverb-capable token is a Modifier; a post-head Adjective-
 *   capable token is a Modifier; a Noun/Pronoun either side retains its
 *   own POS.
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
 * ("Preserve Determiner from the seeded vocabulary"). A token with an
 * empty possible-POS set (`dictionary` has no Word for it and it's in
 * neither closed set) never gets a role. */
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

  for (let i = 0; i < tokens.length; i++) {
    if (i === headIndex || (phraseType === PhraseType.INFINITIVE_PHRASE && i === 0)) continue;
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

/** Breaks `phrase`'s own `text` into its whitespace-separated tokens
 * ("toy poodle" -> ["toy", "poodle"]) and resolves every one of
 * `phrase.headWord`/`phrase.headWordForm`/`phrase.preModifiers`/
 * `phrase.postModifiers`/`phrase.determiners` (data/phrase.ts's own
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
 * `matchingFormId()` below is this exact resolution, shared by every
 * field that needs it: `headWordForm` and every `preModifiers`/
 * `postModifiers`/`determiners` entry alike are all "the one WordForm
 * on this token's own resolved Word spelled the way this token actually
 * appears here" -- a token whose own resolved Word carries no such
 * WordForm is left out of whichever field it would have populated,
 * rather than guessed at (`headWordForm`'s own docstring on this same
 * narrowing). `wordForms` is optional, matching every other seeding
 * pass's own `Senses`/`WordForms` convention -- omitted, every
 * WordForm-dependent field stays empty/undefined even when a Head or
 * Modifier was identified.
 *
 * `preModifiers`/`postModifiers` collect every MODIFIER-role token
 * (before/after the Head, respectively); `determiners` collects every
 * DETERMINER-role token, never split pre/post (the Common Rules table's
 * own "Determiner" row applies regardless of position,
 * data/phrase_type_patterns_and_word_roles.md). Deliberately Word/WordForm-only:
 * the Phrase Role Allowed Types table also permits a MODIFIER to be a
 * sub-phrase (AdjectivePhrase, NounPhrase, AdverbPhrase,
 * PrepositionalPhrase) or a Clause, but nothing in this codebase
 * performs constituency parsing *within* a phrase's own text --
 * classifyModifierRoles() above only ever reasons about flat whitespace
 * tokens, never nested spans -- so a MODIFIER token that resolves to a
 * Phrase/Clause span rather than a single Word is left out of every
 * array rather than guessed at. */
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

export function linkPhraseWords(phrase: Phrase, dictionary: Dictionary, wordForms?: WordForms): void {
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

  const preModifiers: Identifier[] = [];
  const postModifiers: Identifier[] = [];
  const determiners: Identifier[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (i === headIndex) continue;
    if (wordRoles[i] !== ModifierRole.MODIFIER && wordRoles[i] !== ModifierRole.DETERMINER) continue;
    const formId = matchingFormId(i);
    if (formId === undefined) continue;
    if (wordRoles[i] === ModifierRole.DETERMINER) determiners.push(formId);
    else (headIndex !== -1 && i < headIndex ? preModifiers : postModifiers).push(formId);
  }
  phrase.preModifiers = preModifiers;
  phrase.postModifiers = postModifiers;
  phrase.determiners = determiners;
}
