import type { Text } from "../../../value_objects";
import { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Senses } from "../../data/senses";
import {
  createWord,
  endsInConsonantY,
  shouldDoubleFinalConsonant,
  validateFormText,
  validateWordFormAttributes,
  type Word,
  type WordFormIssue,
} from "../../data/word";
import type { Verb } from "../../data/entities/verb";

export type VerbInit = Pick<Verb, "text"> & Partial<Omit<Verb, "text" | "partOfSpeech">>;

export function createVerb(init: VerbInit): Verb {
  const verb = createWord({ ...init, partOfSpeech: PartOfSpeech.VERB }) as Verb;
  if (verb.isNominalisedIndicator === undefined) verb.isNominalisedIndicator = false;
  if (verb.isAdjectivisedIndicator === undefined) verb.isAdjectivisedIndicator = false;
  return verb;
}

export function isVerb(word: Word): word is Verb {
  return word.partOfSpeech === PartOfSpeech.VERB;
}

/** Resolved text of every WordNet generic verb frame `verb` participates
 * in *for this one sense* -- Senses.setMemberMetadata()'s own read side
 * (../data/senses.ts), written once per (Verb, Sense) pair by
 * WordSeeder.seedWordNet's own synsetMemberToWord(). `senseId` is one of
 * `verb.senseIds`'s own entries (Word.senseIds's own docstring on why a
 * Verb can carry more than one); passing a senseId this Verb doesn't
 * actually lexicalize just returns undefined, the same as no frame data
 * ever having been set. Undefined for a Verb that didn't come from
 * WordSeeder.seedWordNet (every Common Vocabulary Cache entry, which has
 * no frame data of its own). */
export function framesForSense(senses: Senses, verb: Verb, senseId: string): readonly string[] | undefined {
  return senses.metadataFor(senseId, verb.uuid.value)?.frames as readonly string[] | undefined;
}

// Verb's own row of the matrix's String Pattern column (../data/word_form_part_of_speech_matrix.md),
// scoped to exactly the rules that apply to Verb specifically -- see
// each field's own docstring above for which numbered rule(s) these are
// and why the rest of that row's rules (irregular, curated-only, or
// another class's own) are simply absent here.
export const VERB_FORM_PATTERNS: Readonly<Record<string, readonly string[]>> = {
  presentTenseForm: [],
  pastTenseForm: ["/ed$/i", "/ied$/i", "/([bcdfghjklmnpqrstvwxyz])\\1ed$/i"],
  thirdPersonSingularPresentForm: ["/s$/i", "/es$/i", "/ies$/i"],
  presentParticipleForm: ["/ing$/i", "/([bcdfghjklmnpqrstvwxyz])\\1ing$/i", "/ying$/i"],
  pastParticipleForm: ["/ed$/i", "/ied$/i", "/([bcdfghjklmnpqrstvwxyz])\\1ed$/i", "/(en|n)$/i"],
  bareInfinitiveForm: [],
  firstPersonForm: [],
  secondPersonForm: [],
  thirdPersonForm: [],
};

/** Validates every *_Form field this Verb carries -- its own row above,
 * plus baseLemmaCanonicalForm via Word's own validateWordFormAttributes
 * -- against VERB_FORM_PATTERNS. Returns every issue found, not just
 * the first; empty means every populated field is internally consistent
 * with the matrix, not that every field is populated (undefined is
 * never an issue, validateFormText's own docstring). */
export function validateVerb(verb: Verb): readonly WordFormIssue[] {
  const issues: WordFormIssue[] = [...validateWordFormAttributes(verb)];
  const check = (field: keyof typeof VERB_FORM_PATTERNS, text: Text | undefined): void => {
    if (text === undefined) return;
    const issue = validateFormText(field, text, VERB_FORM_PATTERNS[field]);
    if (issue !== undefined) issues.push(issue);
  };
  check("presentTenseForm", verb.presentTenseForm);
  check("pastTenseForm", verb.pastTenseForm);
  check("thirdPersonSingularPresentForm", verb.thirdPersonSingularPresentForm);
  check("presentParticipleForm", verb.presentParticipleForm);
  check("pastParticipleForm", verb.pastParticipleForm);
  check("bareInfinitiveForm", verb.bareInfinitiveForm);
  check("firstPersonForm", verb.firstPersonForm);
  check("secondPersonForm", verb.secondPersonForm);
  check("thirdPersonForm", verb.thirdPersonForm);
  return issues;
}

/** pastTenseForm's and pastParticipleForm's own Generation Transform
 * (../data/word_form_part_of_speech_matrix.md) -- regular English verbs
 * spell both identically ("walk" -> "walked" is both at once, "stop" ->
 * "stopped" is both at once), so both fields below reuse this one
 * function. Covers every regular-case rule (`/e$/i`, `/[^aeiou]y$/i`,
 * and the doubled-final-consonant case via shouldDoubleFinalConsonant())
 * for both fields alike; every remaining rule on either field's own row
 * is an irregular or unchanged form with no spelling signal to detect,
 * and the doubling case itself is left undefined for a lemma
 * shouldDoubleFinalConsonant() can't confidently call either way (that
 * function's own docstring, ../data/word.ts). */
function regularEdForm(lemma: string): Text | undefined {
  if (endsInConsonantY(lemma)) return { value: `${lemma.slice(0, -1)}ied`, formats: ["/ied$/i"] };
  if (/e$/i.test(lemma)) return { value: `${lemma}d`, formats: ["/ed$/i"] };
  const doubling = shouldDoubleFinalConsonant(lemma);
  if (doubling === "abstain") return undefined;
  if (doubling === "double") return { value: `${lemma}${lemma.slice(-1)}ed`, formats: ["/([bcdfghjklmnpqrstvwxyz])\\1ed$/i"] };
  return { value: `${lemma}ed`, formats: ["/ed$/i"] };
}

/** thirdPersonSingularPresentForm's own Generation Transform -- regular-
 * case rules #1-3 only; rule #4 (irregular, "have" -> "has") has no
 * spelling signal to detect, so a lemma always falls through to one of
 * the first three (this field has no doubling rule of its own, unlike
 * pastTenseForm, so every lemma gets a value here). */
function regularThirdPersonSingularForm(lemma: string): Text {
  if (endsInConsonantY(lemma)) return { value: `${lemma.slice(0, -1)}ies`, formats: ["/ies$/i"] };
  if (/(s|x|z|ch|sh|o)$/i.test(lemma)) return { value: `${lemma}es`, formats: ["/es$/i"] };
  return { value: `${lemma}s`, formats: ["/s$/i"] };
}

/** presentParticipleForm's own Generation Transform -- regular-case
 * rules #1-4 (`/ie$/i` -> "ying"; a consonant immediately before a
 * final silent `e` -> drop it and add "ing"; the doubled-final-
 * consonant case via shouldDoubleFinalConsonant(); plain "-ing"
 * otherwise). A lemma ending in `e` preceded by a *vowel* ("agree",
 * "argue", "dye") is genuinely ambiguous by spelling alone -- English
 * keeps the `e` for some ("agreeing") and drops it for others
 * ("arguing"), and telling them apart needs the matrix's own Silent-E
 * Classification / Pronunciation data (../data/word_form_part_of_speech_matrix.md),
 * which doesn't exist in this codebase -- so that case is left
 * undefined rather than guessed either way. */
function regularIngForm(lemma: string): Text | undefined {
  if (/ie$/i.test(lemma)) return { value: `${lemma.slice(0, -2)}ying`, formats: ["/ying$/i"] };
  if (/[^aeiouy]e$/i.test(lemma)) return { value: `${lemma.slice(0, -1)}ing`, formats: ["/ing$/i"] };
  if (/e$/i.test(lemma)) return undefined;
  const doubling = shouldDoubleFinalConsonant(lemma);
  if (doubling === "abstain") return undefined;
  if (doubling === "double") return { value: `${lemma}${lemma.slice(-1)}ing`, formats: ["/([bcdfghjklmnpqrstvwxyz])\\1ing$/i"] };
  return { value: `${lemma}ing`, formats: ["/ing$/i"] };
}

/** pastTenseForm's and pastParticipleForm's own Exception Lookup
 * (../data/word_form_part_of_speech_matrix.md names it "Irregular Verb
 * Lookup" but never populates it) -- a closed, well-known set any
 * English grammar reference agrees on, so unlike the matrix's other
 * named Exception Lookup tables (gradability, person/case, ...) this
 * one is a fact of English, not an open curation project, and
 * generateVerbForms() below checks it before ever falling through to
 * the regular -ed rules -- without it, a genuinely irregular lemma like
 * "eat" would get a spelling-rule guess ("eated") instead of its real
 * form ("ate"/"eaten").
 *
 * Two known gaps, both accepted rather than solved here. (1) Keyed by
 * spelling alone, not by sense -- the rare English verb that's
 * genuinely irregular in one sense and regular in another ("lie"
 * recline -> "lay"/"lain" vs. "lie" deceive -> "lied"/"lied"; "hang"
 * suspend -> "hung" vs. "hang" execute -> "hanged") gets the irregular
 * form on every seeded sense of that spelling, including the regular
 * one -- telling the two apart needs a sense-level Exception Lookup
 * this codebase doesn't have. (2) "be" is deliberately absent -- its
 * own past tense is "was"/"were" depending on grammatical number, which
 * this table's single-value-per-lemma shape can't express;
 * generateVerbForms() skips pastTenseForm/pastParticipleForm generation
 * for "be" outright instead of guessing. */
const IRREGULAR_VERB_FORMS: Readonly<Record<string, { past: string; pastParticiple: string }>> = {
  arise: { past: "arose", pastParticiple: "arisen" },
  awake: { past: "awoke", pastParticiple: "awoken" },
  bear: { past: "bore", pastParticiple: "borne" },
  beat: { past: "beat", pastParticiple: "beaten" },
  become: { past: "became", pastParticiple: "become" },
  begin: { past: "began", pastParticiple: "begun" },
  bend: { past: "bent", pastParticiple: "bent" },
  bet: { past: "bet", pastParticiple: "bet" },
  bind: { past: "bound", pastParticiple: "bound" },
  bite: { past: "bit", pastParticiple: "bitten" },
  bleed: { past: "bled", pastParticiple: "bled" },
  blow: { past: "blew", pastParticiple: "blown" },
  break: { past: "broke", pastParticiple: "broken" },
  breed: { past: "bred", pastParticiple: "bred" },
  bring: { past: "brought", pastParticiple: "brought" },
  build: { past: "built", pastParticiple: "built" },
  burst: { past: "burst", pastParticiple: "burst" },
  buy: { past: "bought", pastParticiple: "bought" },
  catch: { past: "caught", pastParticiple: "caught" },
  choose: { past: "chose", pastParticiple: "chosen" },
  cling: { past: "clung", pastParticiple: "clung" },
  come: { past: "came", pastParticiple: "come" },
  cost: { past: "cost", pastParticiple: "cost" },
  creep: { past: "crept", pastParticiple: "crept" },
  cut: { past: "cut", pastParticiple: "cut" },
  deal: { past: "dealt", pastParticiple: "dealt" },
  dig: { past: "dug", pastParticiple: "dug" },
  do: { past: "did", pastParticiple: "done" },
  draw: { past: "drew", pastParticiple: "drawn" },
  drink: { past: "drank", pastParticiple: "drunk" },
  drive: { past: "drove", pastParticiple: "driven" },
  eat: { past: "ate", pastParticiple: "eaten" },
  fall: { past: "fell", pastParticiple: "fallen" },
  feed: { past: "fed", pastParticiple: "fed" },
  feel: { past: "felt", pastParticiple: "felt" },
  fight: { past: "fought", pastParticiple: "fought" },
  find: { past: "found", pastParticiple: "found" },
  flee: { past: "fled", pastParticiple: "fled" },
  fling: { past: "flung", pastParticiple: "flung" },
  fly: { past: "flew", pastParticiple: "flown" },
  forbid: { past: "forbade", pastParticiple: "forbidden" },
  forget: { past: "forgot", pastParticiple: "forgotten" },
  forgive: { past: "forgave", pastParticiple: "forgiven" },
  freeze: { past: "froze", pastParticiple: "frozen" },
  get: { past: "got", pastParticiple: "gotten" },
  give: { past: "gave", pastParticiple: "given" },
  go: { past: "went", pastParticiple: "gone" },
  grind: { past: "ground", pastParticiple: "ground" },
  grow: { past: "grew", pastParticiple: "grown" },
  hang: { past: "hung", pastParticiple: "hung" },
  have: { past: "had", pastParticiple: "had" },
  hear: { past: "heard", pastParticiple: "heard" },
  hide: { past: "hid", pastParticiple: "hidden" },
  hit: { past: "hit", pastParticiple: "hit" },
  hold: { past: "held", pastParticiple: "held" },
  hurt: { past: "hurt", pastParticiple: "hurt" },
  keep: { past: "kept", pastParticiple: "kept" },
  kneel: { past: "knelt", pastParticiple: "knelt" },
  know: { past: "knew", pastParticiple: "known" },
  lay: { past: "laid", pastParticiple: "laid" },
  lead: { past: "led", pastParticiple: "led" },
  leave: { past: "left", pastParticiple: "left" },
  lend: { past: "lent", pastParticiple: "lent" },
  let: { past: "let", pastParticiple: "let" },
  lie: { past: "lay", pastParticiple: "lain" },
  lose: { past: "lost", pastParticiple: "lost" },
  make: { past: "made", pastParticiple: "made" },
  mean: { past: "meant", pastParticiple: "meant" },
  meet: { past: "met", pastParticiple: "met" },
  mistake: { past: "mistook", pastParticiple: "mistaken" },
  overcome: { past: "overcame", pastParticiple: "overcome" },
  pay: { past: "paid", pastParticiple: "paid" },
  put: { past: "put", pastParticiple: "put" },
  quit: { past: "quit", pastParticiple: "quit" },
  read: { past: "read", pastParticiple: "read" },
  ride: { past: "rode", pastParticiple: "ridden" },
  ring: { past: "rang", pastParticiple: "rung" },
  rise: { past: "rose", pastParticiple: "risen" },
  run: { past: "ran", pastParticiple: "run" },
  say: { past: "said", pastParticiple: "said" },
  see: { past: "saw", pastParticiple: "seen" },
  seek: { past: "sought", pastParticiple: "sought" },
  sell: { past: "sold", pastParticiple: "sold" },
  send: { past: "sent", pastParticiple: "sent" },
  set: { past: "set", pastParticiple: "set" },
  shake: { past: "shook", pastParticiple: "shaken" },
  shine: { past: "shone", pastParticiple: "shone" },
  shoot: { past: "shot", pastParticiple: "shot" },
  show: { past: "showed", pastParticiple: "shown" },
  shrink: { past: "shrank", pastParticiple: "shrunk" },
  shut: { past: "shut", pastParticiple: "shut" },
  sing: { past: "sang", pastParticiple: "sung" },
  sink: { past: "sank", pastParticiple: "sunk" },
  sit: { past: "sat", pastParticiple: "sat" },
  sleep: { past: "slept", pastParticiple: "slept" },
  slide: { past: "slid", pastParticiple: "slid" },
  speak: { past: "spoke", pastParticiple: "spoken" },
  spend: { past: "spent", pastParticiple: "spent" },
  spin: { past: "spun", pastParticiple: "spun" },
  spit: { past: "spat", pastParticiple: "spat" },
  split: { past: "split", pastParticiple: "split" },
  spread: { past: "spread", pastParticiple: "spread" },
  spring: { past: "sprang", pastParticiple: "sprung" },
  stand: { past: "stood", pastParticiple: "stood" },
  steal: { past: "stole", pastParticiple: "stolen" },
  stick: { past: "stuck", pastParticiple: "stuck" },
  sting: { past: "stung", pastParticiple: "stung" },
  stink: { past: "stank", pastParticiple: "stunk" },
  strike: { past: "struck", pastParticiple: "struck" },
  swear: { past: "swore", pastParticiple: "sworn" },
  sweep: { past: "swept", pastParticiple: "swept" },
  swim: { past: "swam", pastParticiple: "swum" },
  swing: { past: "swung", pastParticiple: "swung" },
  take: { past: "took", pastParticiple: "taken" },
  teach: { past: "taught", pastParticiple: "taught" },
  tear: { past: "tore", pastParticiple: "torn" },
  tell: { past: "told", pastParticiple: "told" },
  think: { past: "thought", pastParticiple: "thought" },
  throw: { past: "threw", pastParticiple: "thrown" },
  understand: { past: "understood", pastParticiple: "understood" },
  wake: { past: "woke", pastParticiple: "woken" },
  wear: { past: "wore", pastParticiple: "worn" },
  weep: { past: "wept", pastParticiple: "wept" },
  win: { past: "won", pastParticiple: "won" },
  wind: { past: "wound", pastParticiple: "wound" },
  withdraw: { past: "withdrew", pastParticiple: "withdrawn" },
  write: { past: "wrote", pastParticiple: "written" },
};

/** Fills in this Verb's own derivable *_Form fields wherever still
 * undefined, from its own base lemma (`verb.text`) -- WordSeeder's own
 * seeding entry points (role/word_seeder.ts) call this right after
 * createVerb(), so every seeded Verb (WordNet or Common Vocabulary
 * Cache alike) gets its regular-case forms populated automatically,
 * without a hand-authored Verb built elsewhere (a test fixture, say)
 * acquiring fields it never asked for just by calling createVerb().
 * Only ever fills a field that's still undefined -- an explicitly-set
 * value (from `init`, or an earlier call, e.g. `frames`) is never
 * overwritten. pastTenseForm/pastParticipleForm check
 * IRREGULAR_VERB_FORMS first (that constant's own docstring on its two
 * known gaps); "be" gets neither (its own presentParticipleForm is also
 * special-cased separately, just below), and "have" gets its own
 * irregular thirdPersonSingularPresentForm ("has", not "haves")
 * alongside the table. firstPersonForm/secondPersonForm/thirdPersonForm
 * are left
 * alone entirely -- their one applicable rule for Verb (#3, an
 * irregular form like "be" -> "am") is `N/A` even in the matrix itself,
 * needing a person/number-aware Irregular Verb Lookup IRREGULAR_VERB_FORMS's
 * own single-value shape can't express either. Every value this
 * produces is provably one of that field's own recognised String
 * Patterns (VERB_FORM_PATTERNS above) or, for an irregular form, no
 * claimed format at all (matching the matrix's own N/A String Pattern
 * for every irregular rule) -- generateVerbForms() and validateVerb()
 * are built from the exact same matrix rows, so a freshly-generated
 * Verb always passes its own validateVerb() unchanged. */
export function generateVerbForms(verb: Verb): Verb {
  const lemma = verb.text;
  const irregular = IRREGULAR_VERB_FORMS[lemma];
  const generated: Partial<Verb> = {};
  if (verb.presentTenseForm === undefined) generated.presentTenseForm = { value: lemma };
  if (verb.bareInfinitiveForm === undefined) generated.bareInfinitiveForm = { value: lemma };
  if (verb.pastTenseForm === undefined) {
    if (irregular !== undefined) generated.pastTenseForm = { value: irregular.past };
    else if (lemma !== "be") {
      const pastTense = regularEdForm(lemma);
      if (pastTense !== undefined) generated.pastTenseForm = pastTense;
    }
  }
  if (verb.pastParticipleForm === undefined) {
    if (irregular !== undefined) generated.pastParticipleForm = { value: irregular.pastParticiple };
    else if (lemma !== "be") {
      const pastParticiple = regularEdForm(lemma);
      if (pastParticiple !== undefined) generated.pastParticipleForm = pastParticiple;
    }
  }
  if (verb.thirdPersonSingularPresentForm === undefined && lemma !== "be") {
    generated.thirdPersonSingularPresentForm = lemma === "have" ? { value: "has" } : regularThirdPersonSingularForm(lemma);
  }
  if (verb.presentParticipleForm === undefined) {
    // "be" is the one lemma regularIngForm() gets wrong: its own
    // consonant-before-silent-e branch assumes there's a real stem left
    // once the "e" is dropped ("writ" + "ing"), but "be" is nothing but
    // that one consonant + "e" -- stripping it leaves "b", not a stem,
    // so the general rule would produce "bing" instead of the real
    // "being". No other English verb is this short, so this is a
    // one-lemma exception, not a flaw in the general rule.
    if (lemma === "be") generated.presentParticipleForm = { value: "being", formats: ["/ing$/i"] };
    else {
      const presentParticiple = regularIngForm(lemma);
      if (presentParticiple !== undefined) generated.presentParticipleForm = presentParticiple;
    }
  }
  return { ...verb, ...generated };
}
