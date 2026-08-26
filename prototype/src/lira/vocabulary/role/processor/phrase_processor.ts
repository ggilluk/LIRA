import { PartOfSpeech } from "../../data/enums/part_of_speech";
import { ModifierRole } from "../../data/enums/modifier_role";
import { PhraseType } from "../../data/enums/phrase_type";
import type { Phrase } from "../../data/phrase";
import type { Dictionary } from "../../data/dictionary";
import type { Word } from "../../data/entities/word";
import { graphUuid as wordGraphUuid } from "../word_processor";

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
 *   of the POS-based default.
 * - ADVERB (~695 unique): the same pattern, more pronounced -- over half
 *   open with a preposition ("above all", "by hand", "in the meantime"),
 *   checked the same way before falling back to ADVERB_PHRASE.
 * - INFINITIVE_PHRASE has no WordNet ss_type of its own to key off at
 *   all (there's no "infinitive" synset category) -- every genuine case
 *   found ("to be sure", "to begin with") is WordNet-tagged ADVERB, so
 *   this is checked structurally, ahead of everything else: "to" as the
 *   first token, immediately followed by a real WordNet verb lemma
 *   (`verbLemmas`, built from the very same synset list this call is
 *   part of seeding), minus INFINITIVE_LOOKALIKE_DENYLIST's own three
 *   false positives.
 *
 * Returns `undefined` only for a `partOfSpeech` WordNet itself never
 * assigns to a multi-word lemma (PRONOUN, DETERMINER, ...) -- dead code
 * against real WordNet data today, kept only so this function has a
 * total, rather than partial, mapping over PartOfSpeech. */
export function classifyPhraseType(lemma: string, partOfSpeech: PartOfSpeech, verbLemmas: ReadonlySet<string>): PhraseType | undefined {
  const tokens = lemma.trim().toLowerCase().split(/\s+/);
  if (tokens[0] === "to" && tokens.length > 1 && verbLemmas.has(tokens[1]) && !INFINITIVE_LOOKALIKE_DENYLIST.has(lemma.toLowerCase())) {
    return PhraseType.INFINITIVE_PHRASE;
  }
  if (
    (partOfSpeech === PartOfSpeech.ADJECTIVE || partOfSpeech === PartOfSpeech.ADVERB) &&
    PHRASE_TYPE_PREPOSITIONS.has(tokens[0])
  ) {
    return PhraseType.PREPOSITIONAL_PHRASE;
  }
  switch (partOfSpeech) {
    case PartOfSpeech.NOUN:
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

/** Finds the index of the last token in `possiblePos` whose own set
 * could be read as `targetPos`, restricted to positions *before* the
 * first token that could be read as a Preposition, if any -- the shared
 * Head Identification Rule NounPhrase, AdjectivePhrase, and AdverbPhrase
 * all follow in practice (data/phrase_type_patterns_and_word_roles.md's
 * own Word Patterns table): every row headed by one of those three
 * classes either has no Preposition at all (Head is simply the last
 * `targetPos`-capable token overall) or has the Head appear immediately
 * before a trailing "Preposition + complement" span ("(Noun[Head]) +
 * Preposition + Noun", "(Adjective[Head]) + Preposition + Noun") --
 * never after it. Falls back to the last `targetPos`-capable token
 * anywhere in the sequence when none appears before that boundary (a
 * case that table's own rows never exercise, kept only so this stays a
 * total function over any token sequence). Returns `undefined` when no
 * token could be read as `targetPos` at all. */
function lastTargetPosBeforeFirstPreposition(possiblePos: readonly ReadonlySet<PartOfSpeech>[], targetPos: PartOfSpeech): number | undefined {
  const firstPrepositionIndex = possiblePos.findIndex((pos) => pos.has(PartOfSpeech.PREPOSITION));
  const boundary = firstPrepositionIndex === -1 ? possiblePos.length : firstPrepositionIndex;
  for (let i = boundary - 1; i >= 0; i--) {
    if (possiblePos[i].has(targetPos)) return i;
  }
  for (let i = possiblePos.length - 1; i >= boundary; i--) {
    if (possiblePos[i].has(targetPos)) return i;
  }
  return undefined;
}

/** `possiblePos.findIndex(pos => pos.has(targetPos))`, starting the
 * search at `from` -- Array.prototype.findIndex has no `fromIndex`
 * parameter of its own, so this slices first; wrapped to return
 * `undefined` (this module's own "not found" convention for a position)
 * instead of `-1`. */
function firstIndexWithPos(possiblePos: readonly ReadonlySet<PartOfSpeech>[], targetPos: PartOfSpeech, from: number): number | undefined {
  const index = possiblePos.slice(from).findIndex((pos) => pos.has(targetPos));
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
  return lastTargetPosBeforeFirstPreposition(possiblePos, PartOfSpeech.ADVERB);
}

/** Assigns a ModifierRole (enums/modifier_role.ts) to every one of `tokens`
 * -- `phrase.wordRoles`'s own producer, called from linkPhraseWords()
 * below for the same Phrase whose `words` it resolves, so both arrays
 * end up index-aligned. Implements
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
      headIndex = lastTargetPosBeforeFirstPreposition(possiblePos, PartOfSpeech.NOUN);
      break;
    case PhraseType.ADJECTIVE_PHRASE:
      headIndex = lastTargetPosBeforeFirstPreposition(possiblePos, PartOfSpeech.ADJECTIVE);
      break;
    case PhraseType.ADVERB_PHRASE:
      headIndex = adverbPhraseHeadIndex(possiblePos, tokens);
      break;
    case PhraseType.VERB_PHRASE:
      headIndex = firstIndexWithPos(possiblePos, PartOfSpeech.VERB, 0);
      break;
    case PhraseType.PREPOSITIONAL_PHRASE:
      headIndex = firstIndexWithPos(possiblePos, PartOfSpeech.PREPOSITION, 0);
      break;
    case PhraseType.INFINITIVE_PHRASE:
      roles[0] = ModifierRole.PARTICLE;
      headIndex = firstIndexWithPos(possiblePos, PartOfSpeech.VERB, 1);
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
 * ("toy poodle" -> ["toy", "poodle"]) and resolves each one against
 * `dictionary`, storing the result on `phrase.words` -- see that
 * field's own docstring (data/phrase.ts) for why it's stored by uuid
 * reference rather than computed on demand. `dictionary.lookup` matches
 * case-insensitively and, for a token with more than one homograph,
 * picks its own first-seeded sense (the same arbitrary-but-deterministic
 * choice definitionWords() already makes for a definition token,
 * word_processor.ts) -- this is a structural decomposition of the
 * phrase's own spelling, not a semantic claim about which sense of "toy"
 * is meant. A token position stays undefined when `dictionary` has no
 * Word for it at all (WordNet itself never lexicalizes some closed-class
 * function words -- "rule of thumb"'s own "of" -- as a standalone
 * sense). Also populates `phrase.wordRoles` from the same token list,
 * via classifyModifierRoles() above (this module's own docstring on its
 * per-PhraseType rules) -- done here, not as a separate pass, so both
 * `words`-derived fields are always computed together.
 * classifyModifierRoles() deliberately doesn't reuse this function's own
 * single arbitrary-homograph `phrase.words` resolution, though -- it
 * resolves every token's own full *set* of possible parts of speech
 * instead (possiblePartsOfSpeech(), this module), since relying on one
 * arbitrary pick here would misidentify a phrase's own Head whenever
 * that pick happens to land on the wrong homograph (that function's own
 * docstring has the "give up" example). Derives
 * `phrase.unresolvedHeadWord`/`phrase.headWordForm` (data/phrase.ts's
 * own docstring on each) directly from the just-computed `wordRoles` --
 * whichever position (if any) holds ModifierRole.HEAD -- rather than
 * leaving every later caller to re-scan `wordRoles` for it themselves.
 *
 * Also resolves `phrase.headWord` (data/phrase.ts's own docstring on why
 * it's distinct from `unresolvedHeadWord`, the graph-reference pointer):
 * `dictionary.findByUuid()` against `unresolvedHeadWord`'s own value,
 * exactly the resolution that field's docstring already names as the
 * intended path. And `phrase.preModifiers`/`phrase.postModifiers`
 * (data/phrase.ts's own docstring on each, and every `*_phrase.ts`
 * subtype's own narrowing of them): every position holding
 * ModifierRole.MODIFIER that resolves to a real Word (`dictionary.
 * findByUuid()` again) goes into `preModifiers` when it sits before the
 * Head, `postModifiers` when after. Deliberately Word-only: the Phrase
 * Role Allowed Types table (data/phrase_type_patterns_and_word_roles.md)
 * also permits a MODIFIER to be a sub-phrase (AdjectivePhrase,
 * NounPhrase, AdverbPhrase, PrepositionalPhrase) or a Clause, but
 * nothing in this codebase performs constituency parsing *within* a
 * phrase's own text -- classifyModifierRoles() above only ever reasons
 * about flat whitespace tokens, never nested spans -- so a MODIFIER
 * token that resolves to a Phrase/Clause span rather than a single Word
 * is left out of both arrays rather than guessed at. */
export function linkPhraseWords(phrase: Phrase, dictionary: Dictionary): void {
  const tokens = phrase.text.trim().split(/\s+/).filter((token) => token.length > 0);
  phrase.words = tokens.map((token) => {
    const word = dictionary.lookup(token);
    return word === undefined ? undefined : { value: wordGraphUuid(word) };
  });
  phrase.wordRoles = classifyModifierRoles(phrase.phraseType, tokens, dictionary);
  const headIndex = phrase.wordRoles.indexOf(ModifierRole.HEAD);
  phrase.unresolvedHeadWord = headIndex === -1 ? undefined : phrase.words[headIndex];
  phrase.headWordForm = headIndex === -1 ? undefined : { value: tokens[headIndex] };
  phrase.headWord = phrase.unresolvedHeadWord === undefined ? undefined : dictionary.findByUuid(phrase.unresolvedHeadWord.value);

  const preModifiers: Word[] = [];
  const postModifiers: Word[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (phrase.wordRoles[i] !== ModifierRole.MODIFIER) continue;
    const wordId = phrase.words[i];
    const word = wordId === undefined ? undefined : dictionary.findByUuid(wordId.value);
    if (word === undefined) continue;
    (headIndex !== -1 && i < headIndex ? preModifiers : postModifiers).push(word);
  }
  phrase.preModifiers = preModifiers;
  phrase.postModifiers = postModifiers;
}
