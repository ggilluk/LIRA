/** The Vocabulary Service: runs WordSeeder, RelationshipSeeder, and
 * DictionaryView off the main thread, inside a real browser Web Worker
 * -- the browser-tab stand-in for a server-side Vocabulary process.
 * Nothing in here touches the DOM (WordSeeder/RelationshipSeeder/
 * Dictionary/DictionaryView are all pure data/string logic, same as the
 * Python originals), so the whole pipeline runs unmodified in a worker;
 * only the rendered HTML strings and status messages cross back to the
 * main thread via postMessage (VocabularyWorkerClient, the main-thread
 * side of this same protocol).
 *
 * This worker is deliberately the entire content of a Vite worker entry
 * (`new Worker(new URL("./vocabulary_worker.ts", import.meta.url), { type:
 * "module" })` in vocabulary_worker_client.ts) -- everything it imports
 * (WordSeeder, RelationshipSeeder, VocabularyContext, DictionaryView, and
 * the ~5MB bundled Common Vocabulary Cache JSON they read) bundles into
 * this worker's own chunk, not the main thread's, so the page that
 * mounts the Portal shell stays light while this chunk loads and runs
 * in parallel. handleSeedWordNet's own ~21MB Princeton WordNet dict/
 * text is deliberately NOT part of that always-loaded chunk -- it's
 * fetched as its own lazy `import()` only once a "seed-wordnet" request
 * actually arrives (wordnet_loader.ts's own docstring), so a session
 * that never triggers it never pays for it. */

import { DictionaryView } from "../../ui/server/dictionary_controller";
import { VocabularyContext } from "../../data/vocabulary_context";
import { NounCharacterFormSeeder } from "../noun_character_form_seeder";
import { PrepositionSenseSeeder } from "../preposition_sense_seeder";
import { RelationshipSeeder } from "../relationship_seeder";
import { WordCoordinationSeeder } from "../word_coordination_seeder";
import { WordSeeder } from "../word_seeder";
import type { PartOfSpeech } from "../../data/enums/part_of_speech";
import type { Word } from "../../data/entities/word";
import type { WordForm } from "../../data/entities/word_form";
import type { Phrase } from "../../data/entities/phrase";
import type { LookupWordsRequest } from "./dictionary_query_protocol";
import type {
  LinkPortRequest,
  RenderedFragment,
  RenderRequest,
  ResolveHierarchyRequest,
  SearchLexicalRelationshipsRequest,
  SearchPhrasesRequest,
  SearchRelationshipsRequest,
  SearchSensesRequest,
  SearchWordsRequest,
  SeedCommonVocabularyRequest,
  SeedWordNetRequest,
  VocabularyDomainSummary,
  VocabularyWorkerMessage,
  VocabularyWorkerRequest,
} from "./vocabulary_worker_protocol";

interface WorkerScope {
  postMessage(message: unknown): void;
  addEventListener(type: "message", listener: (event: MessageEvent<VocabularyWorkerRequest>) => void): void;
}
const ctx = self as unknown as WorkerScope;

interface SeededDomain {
  name: string;
  parentName?: string;
  vocabulary: VocabularyContext;
}

const domains = new Map<string, SeededDomain>();
const renderCache = new Map<string, RenderedFragment>();
// Domain names with a seed-wordnet run currently in flight -- guards
// against a rapid double click (or two independent UI callers) firing
// two overlapping seedWordNet passes against the same Domain at once;
// the client itself also disables its trigger while "running" (this
// module's own handleSeedWordNet posts that state), so this is a
// defensive backstop, not the primary guard.
const wordNetSeedingDomains = new Set<string>();
// Same backstop as wordNetSeedingDomains, for handleSeedCommonVocabulary
// runs instead.
const commonVocabularySeedingDomains = new Set<string>();
// Whether Physics's own one-time Dictionary snapshot (VocabularyContext.seedFrom)
// has already been taken -- guards against handleSeedCommonVocabulary
// retaking it on a second "Seed Vocabulary" click, which would append a
// second, fully duplicate copy of every Common Word into Physics
// (Dictionary.seedFrom's own docstring: it always copies unconditionally,
// with no dedup of its own -- that's this module's job to guard, the same
// way it was implicitly guarded before by only ever running once, at boot).
let physicsBootstrapped = false;

function post(message: VocabularyWorkerMessage): void {
  ctx.postMessage(message);
}

function summaryOf(domain: SeededDomain): VocabularyDomainSummary {
  return {
    name: domain.name,
    parentName: domain.parentName,
    wordCount: domain.vocabulary.dictionary.totalEntries(),
    // semanticRelationships, not lexicalRelationships -- the latter is
    // seeding-internal scratch state now (VocabularyContext's own
    // docstring, data/vocabulary_context.ts), so counting it here would surface a
    // number nothing else in the UI shows any more.
    relationshipCount: domain.vocabulary.semanticRelationships.totalRelationships(),
  };
}

/** Registers every Domain empty, seeding nothing -- unlike this
 * function's earlier version, which always ran seedClosedClassWords/
 * RelationshipSeeder against Common (and, via Physics's own
 * VocabularyContext.seedFrom snapshot, Physics too) before "ready" ever
 * fired, whether or not the Vocabulary UI was ever opened that session.
 * Both are now on-demand actions the Vocabulary tab's own toolbar
 * triggers (portal_shell.ts's own renderVocabToolbar(), "Seed
 * Vocabulary" -> handleSeedCommonVocabulary below, "Load WordNet" ->
 * handleSeedWordNet) -- this only builds the empty Domain shells a
 * caller needs something to address ("Common", "Physics") before
 * either action has anything to target. */
async function handleInit(): Promise<void> {
  try {
    post({ type: "status", state: "running", detail: "Registering Domains…" });
    const commonDomain: SeededDomain = { name: "Common", vocabulary: new VocabularyContext("Common") };
    domains.set(commonDomain.name, commonDomain);
    const physicsDomain: SeededDomain = { name: "Physics", parentName: "Common", vocabulary: new VocabularyContext("Physics") };
    domains.set(physicsDomain.name, physicsDomain);

    const summaries: VocabularyDomainSummary[] = [...domains.values()].map(summaryOf);

    post({ type: "status", state: "done", detail: `${domains.size} Domains ready — seed vocabulary or load WordNet to add words` });
    post({ type: "ready", domains: summaries });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    post({ type: "status", state: "error", detail: message });
    post({ type: "error", message });
  }
}

/** Handles an on-demand SeedCommonVocabularyRequest -- the Common
 * Vocabulary Cache's own seed files (SeedCommonVocabularyRequest's own
 * docstring), as opposed to handleSeedWordNet's Princeton WordNet dict/
 * text. The first successful run against "Common" also refreshes
 * Physics's own one-time Dictionary snapshot (VocabularyContext.seedFrom)
 * -- deferred here to whenever Common's seed data actually lands rather
 * than unconditionally at boot (this module's own handleInit no longer
 * seeds anything at all), guarded by `physicsBootstrapped` so a second
 * "Seed Vocabulary" click doesn't duplicate every Common Word into
 * Physics a second time (Dictionary.seedFrom's own docstring on why it
 * can't dedup that itself). Mirrors handleSeedWordNet's own status/
 * domain-updated reporting shape. */
async function handleSeedCommonVocabulary(request: SeedCommonVocabularyRequest): Promise<void> {
  const domain = domains.get(request.domain);
  if (!domain) {
    post({ type: "error", message: `Vocabulary Service: unknown Domain '${request.domain}'` });
    return;
  }
  if (commonVocabularySeedingDomains.has(domain.name)) return;
  commonVocabularySeedingDomains.add(domain.name);

  try {
    post({ type: "status", state: "running", detail: `Seeding the Common Vocabulary Cache into ${domain.name}…` });
    const wordSeeder = new WordSeeder("en");
    // Words and Phrases counted separately for the status messages
    // below, not off seedDomain()'s own combined return value (it
    // counts both together, by design -- an idempotency check just
    // wants "did this add anything", not a words/phrases breakdown).
    // Dictionary.totalEntries()/Phrases.totalEntries() before vs.
    // after gives the accurate split without changing that method's
    // own established single-number contract (vocabulary.test.ts's own
    // assertions on it, in particular).
    const wordCountBefore = domain.vocabulary.dictionary.totalEntries();
    const phraseCountBefore = domain.vocabulary.phrases.totalEntries();
    // No separate AuxiliarySeeder/DeterminerSeeder call needed here --
    // WordSeeder.seedClosedClassWords() (called by seedDomain() below)
    // already runs both internally, before its own loadCache() loop,
    // for every caller (role/word_seeder.ts's own docstring on that
    // method, and on MANDATORY_FILES above it, for the full ordering
    // rationale -- in particular why AuxiliarySeeder has to run first,
    // ahead of "be"/"have"/"do"'s own VERB homograph in
    // metalinguistic_verbs.json).
    // excludeOpenClasses: "Load WordNet" is this prototype's actual
    // source of truth for NOUN/VERB/ADJECTIVE/ADVERB coverage now
    // (word_seeder.ts's own seedClosedClassWords docstring) -- paired
    // with skipUnresolvable below, since most of the Common Relationship
    // Cache's own specs relate open-class words this call now leaves
    // unseeded by design.
    wordSeeder.seedDomain(domain, { excludeOpenClasses: true });
    const wordsSeeded = domain.vocabulary.dictionary.totalEntries() - wordCountBefore;
    const phrasesSeeded = domain.vocabulary.phrases.totalEntries() - phraseCountBefore;

    post({
      type: "status",
      state: "running",
      detail: `Seeded ${wordsSeeded} words, ${phrasesSeeded} phrases into ${domain.name} — seeding relationships…`,
    });
    const relationshipSeeder = new RelationshipSeeder("en");
    const relationshipsSeeded = await relationshipSeeder.seedDomain(domain, { skipUnresolvable: true });

    renderCache.delete(domain.name);
    const updatedDomains: SeededDomain[] = [domain];

    const physicsDomain = domains.get("Physics");
    if (domain.name === "Common" && physicsDomain && !physicsBootstrapped) {
      physicsDomain.vocabulary.dictionary.seedFrom(domain.vocabulary.dictionary);
      physicsDomain.vocabulary.phrases.seedFrom(domain.vocabulary.phrases);
      physicsBootstrapped = true;
      renderCache.delete(physicsDomain.name);
      updatedDomains.push(physicsDomain);
    }

    post({
      type: "status",
      state: "done",
      detail: `Vocabulary seeded into ${domain.name} — ${wordsSeeded.toLocaleString()} words, ${phrasesSeeded.toLocaleString()} phrases, ${relationshipsSeeded.toLocaleString()} relationships`,
    });
    for (const updated of updatedDomains) post({ type: "domain-updated", domain: summaryOf(updated) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    post({ type: "status", state: "error", detail: message });
    post({ type: "error", message });
  } finally {
    commonVocabularySeedingDomains.delete(domain.name);
  }
}

/** Handles an on-demand SeedWordNetRequest -- see that request type's
 * own docstring (vocabulary_worker_protocol.ts) for why it always
 * targets "Common" in practice, even though it's addressed by name.
 * Reports progress via the same "status" channel handleInit uses
 * (WordSeeder.seedWordNet's own onProgress -- word_seeder.ts's own
 * docstring on why each call is followed by a yield back to the event
 * loop, which is what lets these messages actually leave the Worker
 * one by one instead of all arriving at once after the whole run
 * finishes), then invalidates that Domain's cached DictionaryView
 * fragment (it's now stale -- WordNet just added Words/relationships
 * to the same Dictionary/LexicalRelationshipStore DictionaryView
 * rendered against) and posts a DomainUpdatedMessage with the Domain's
 * refreshed counts. */
async function handleSeedWordNet(request: SeedWordNetRequest): Promise<void> {
  const domain = domains.get(request.domain);
  if (!domain) {
    post({ type: "error", message: `Vocabulary Service: unknown Domain '${request.domain}'` });
    return;
  }
  if (wordNetSeedingDomains.has(domain.name)) return;
  wordNetSeedingDomains.add(domain.name);

  try {
    post({ type: "status", state: "running", detail: `Loading Princeton WordNet 3.1 for ${domain.name}…`, progress: 0 });
    const seeder = new WordSeeder("en");
    // Each pass reports its own 0->1 progress fraction (word_seeder.ts's
    // own seedWordNet docstring on the two passes) -- the bar fills once
    // for word/synonym seeding, then again for every other relationship
    // kind, rather than trying to divide one bar's own fraction across
    // two passes whose relative durations aren't known up front.
    const phaseLabel: Record<"words" | "relationships", string> = { words: "words", relationships: "relationships" };
    // Words and Phrases counted separately for the status message below,
    // the same before/after totalEntries() diff handleSeedCommonVocabulary
    // above uses and for the identical reason -- seedWordNet's own
    // wordsSeeded return value counts multi-word synset members
    // (word_seeder.ts's own isMultiWordLemma()) together with
    // single-word ones, by design.
    const wordCountBefore = domain.vocabulary.dictionary.totalEntries();
    const phraseCountBefore = domain.vocabulary.phrases.totalEntries();
    const result = await seeder.seedWordNet(domain, (phase, processed, total) => {
      post({
        type: "status",
        state: "running",
        detail: `Seeding WordNet ${phaseLabel[phase]} into ${domain.name} — ${processed.toLocaleString()} / ${total.toLocaleString()} synsets…`,
        progress: processed / total,
      });
    });
    // Last step of the WordNet load, after every Word/Phrase/relationship
    // from the seeded synsets themselves already exists -- sets
    // wordCharacterForms on the punctuation-mark Nouns already seeded
    // above (NounCharacterFormSeeder's own docstring on why it updates
    // in place rather than creating a sibling copy). Any Noun it does
    // have to create outright (essentially unreachable against a real
    // WordNet seed -- every one of its lemmas already resolves to a real
    // Noun) is still included in wordsSeeded below like any other new
    // Word this run added to the Dictionary.
    new NounCharacterFormSeeder(domain.vocabulary.dictionary).seed();
    // Verb/Noun WordNet-sense cross-references for every hand-curated
    // PREPOSITION (preposition_sense_seeder.ts's own docstring on why
    // this can only run now, after seedWordNet() above, rather than
    // alongside the Common Vocabulary Relationship Cache in
    // handleSeedCommonVocabulary()) -- doesn't affect wordsSeeded/
    // phrasesSeeded below, since it only ever adds SemanticRelationship
    // edges between Senses that already exist.
    new PrepositionSenseSeeder("en").seed(domain);
    // WordCoordination for a small, closed set of fixed coordinate
    // expressions ("salt and pepper", "back and forth", ...) --
    // word_coordination_seeder.ts's own docstring on why this can only
    // run now too (every `coordinates` word here is open-class,
    // WordNet-seeded). Doesn't affect wordsSeeded/phrasesSeeded below,
    // the same reason PrepositionSenseSeeder above doesn't: it only
    // ever adds Coordinations, never a new Word/Phrase.
    new WordCoordinationSeeder("en").seed(domain);

    const wordsSeeded = domain.vocabulary.dictionary.totalEntries() - wordCountBefore;
    const phrasesSeeded = domain.vocabulary.phrases.totalEntries() - phraseCountBefore;

    renderCache.delete(domain.name);
    post({
      type: "status",
      state: "done",
      detail: `WordNet seeded into ${domain.name} — ${wordsSeeded.toLocaleString()} words, ${phrasesSeeded.toLocaleString()} phrases, ${result.relationshipsSeeded.toLocaleString()} relationships`,
    });
    post({ type: "domain-updated", domain: summaryOf(domain) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    post({ type: "status", state: "error", detail: message });
    post({ type: "error", message });
  } finally {
    wordNetSeedingDomains.delete(domain.name);
  }
}

/** Wrapped in try/catch, unlike this function's earlier version --
 * DictionaryView.renderFragment() is generally cheap against the
 * Common Vocabulary Cache scale this was first built for, but a much
 * larger Domain (WordSeeder.seedWordNet's own ~211,000 Words) can still
 * hit MAX_INTERACTIVE_WORDS's own capacity ceiling in ways that are
 * hard to fully rule out in advance (dictionary_view.ts's own
 * docstring on why JSON.stringify itself can throw past a certain
 * size). Before this wrapping, an exception here left the client's
 * matching renderDomain() Promise pending forever -- nothing ever
 * posted a "rendered" message for that requestId, and nothing told the
 * client to stop waiting either. */
function handleRender(request: RenderRequest): void {
  const domain = domains.get(request.domain);
  if (!domain) {
    post({ type: "render-error", requestId: request.requestId, message: `Vocabulary Service: unknown Domain '${request.domain}'` });
    return;
  }

  const cached = renderCache.get(domain.name);
  if (cached !== undefined) {
    post({ type: "rendered", requestId: request.requestId, domain: domain.name, fragment: cached });
    return;
  }

  try {
    const view = new DictionaryView(domain.vocabulary.dictionary, domain.vocabulary.semanticRelationships, {
      title: `LIRA — ${domain.name}`,
      domainName: domain.name,
      phrases: domain.vocabulary.phrases,
      senses: domain.vocabulary.senses,
      wordForms: domain.vocabulary.wordForms,
      lexicalRelationships: domain.vocabulary.lexicalRelationships,
      coordinations: domain.vocabulary.coordinations,
    });
    const [style, body, script] = view.renderFragment();
    const fragment: RenderedFragment = { style, body, script };
    renderCache.set(domain.name, fragment);
    post({ type: "rendered", requestId: request.requestId, domain: domain.name, fragment });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    post({ type: "render-error", requestId: request.requestId, message });
    post({ type: "error", message: `Vocabulary Service: failed to render '${domain.name}': ${message}` });
  }
}

/** Resolves a Words-tab search on demand, against the real Dictionary
 * (DictionaryView.searchWords()) rather than a pre-embedded array --
 * the fragment's own script dispatches a "lira-search-words" DOM event
 * for this whenever the target Domain is over MAX_INTERACTIVE_WORDS
 * (dictionary_view.ts's own renderWordsOverCapacity()); PortalShell
 * relays it here (portal_shell.ts's own bridge) and relays the result
 * back the same way. Always posts a result, even for an unknown Domain
 * (empty), rather than leaving the caller's search hanging. */
function handleSearchWords(request: SearchWordsRequest): void {
  const domain = domains.get(request.domain);
  if (!domain) {
    post({ type: "search-words-result", requestId: request.requestId, words: [], totalMatches: 0 });
    return;
  }

  const view = new DictionaryView(domain.vocabulary.dictionary, domain.vocabulary.semanticRelationships, {
    title: `LIRA — ${domain.name}`,
    domainName: domain.name,
    phrases: domain.vocabulary.phrases,
    senses: domain.vocabulary.senses,
    wordForms: domain.vocabulary.wordForms,
    lexicalRelationships: domain.vocabulary.lexicalRelationships,
    coordinations: domain.vocabulary.coordinations,
  });
  try {
    const { words, totalMatches } = view.searchWords({
      wordId: request.wordId,
      word: request.word,
      gloss: request.gloss,
      definition: request.definition,
      pos: request.pos,
      domain: request.domainLabel,
      rootWordsOnly: request.rootWordsOnly,
      limit: request.limit,
    });
    post({ type: "search-words-result", requestId: request.requestId, words, totalMatches });
  } catch (error) {
    // Without this, an exception here (this handler's own docstring has
    // no try/catch of its own to fall back on, unlike handleRender()
    // just above) would propagate out of this Worker's own "message"
    // listener uncaught -- silently dropped by the browser (no
    // window.onerror on the main thread ever fires for it, since
    // vocabulary_worker_client.ts never registers a Worker.onerror
    // handler either), leaving wordLookupInFlight permanently stuck for
    // this id (lookupWordForDetailPanel()'s own docstring) and the
    // requesting detail panel frozen on whatever it last showed,
    // forever, with no visible error anywhere. Posting a real result
    // (even an empty one) here is what lets renderDetailPanel() show
    // "This word could not be found." instead.
    const message = error instanceof Error ? error.message : String(error);
    post({ type: "error", message: `Vocabulary Service: failed to resolve wordId '${request.wordId}': ${message}` });
    post({ type: "search-words-result", requestId: request.requestId, words: [], totalMatches: 0 });
  }
}

/** handleSearchWords()'s own exact counterpart for the Phrases tab --
 * see that function's own docstring; dispatched from
 * renderPhrasesOverCapacity() (dictionary_view.ts) whenever the target
 * Domain's own Phrases is over MAX_INTERACTIVE_WORDS_PHRASES. */
function handleSearchPhrases(request: SearchPhrasesRequest): void {
  const domain = domains.get(request.domain);
  if (!domain) {
    post({ type: "search-phrases-result", requestId: request.requestId, phrases: [], totalMatches: 0 });
    return;
  }

  const view = new DictionaryView(domain.vocabulary.dictionary, domain.vocabulary.semanticRelationships, {
    title: `LIRA — ${domain.name}`,
    domainName: domain.name,
    phrases: domain.vocabulary.phrases,
    senses: domain.vocabulary.senses,
    wordForms: domain.vocabulary.wordForms,
    lexicalRelationships: domain.vocabulary.lexicalRelationships,
    coordinations: domain.vocabulary.coordinations,
  });
  const { phrases, totalMatches } = view.searchPhrases({
    word: request.word,
    gloss: request.gloss,
    definition: request.definition,
    pos: request.pos,
    limit: request.limit,
  });
  post({ type: "search-phrases-result", requestId: request.requestId, phrases, totalMatches });
}

/** handleSearchPhrases()'s own exact counterpart for the Senses tab --
 * dispatched from renderSensesOverCapacity() (dictionary_view.ts)
 * whenever the target Domain's own Senses store is over
 * MAX_INTERACTIVE_WORDS. */
function handleSearchSenses(request: SearchSensesRequest): void {
  const domain = domains.get(request.domain);
  if (!domain) {
    post({ type: "search-senses-result", requestId: request.requestId, senses: [], totalMatches: 0 });
    return;
  }

  const view = new DictionaryView(domain.vocabulary.dictionary, domain.vocabulary.semanticRelationships, {
    title: `LIRA — ${domain.name}`,
    domainName: domain.name,
    phrases: domain.vocabulary.phrases,
    senses: domain.vocabulary.senses,
    wordForms: domain.vocabulary.wordForms,
    lexicalRelationships: domain.vocabulary.lexicalRelationships,
    coordinations: domain.vocabulary.coordinations,
  });
  const { senses, totalMatches } = view.searchSenses({
    word: request.word,
    gloss: request.gloss,
    definition: request.definition,
    pos: request.pos,
    limit: request.limit,
  });
  post({ type: "search-senses-result", requestId: request.requestId, senses, totalMatches });
}

function handleSearchRelationships(request: SearchRelationshipsRequest): void {
  const domain = domains.get(request.domain);
  if (!domain) {
    post({ type: "search-relationships-result", requestId: request.requestId, relationships: [], totalMatches: 0 });
    return;
  }

  const view = new DictionaryView(domain.vocabulary.dictionary, domain.vocabulary.semanticRelationships, {
    title: `LIRA — ${domain.name}`,
    domainName: domain.name,
    phrases: domain.vocabulary.phrases,
    senses: domain.vocabulary.senses,
    wordForms: domain.vocabulary.wordForms,
    lexicalRelationships: domain.vocabulary.lexicalRelationships,
    coordinations: domain.vocabulary.coordinations,
  });
  const { relationships, totalMatches } = view.searchRelationships({
    wordId: request.wordId,
    query: request.query,
    limit: request.limit,
  });
  post({ type: "search-relationships-result", requestId: request.requestId, relationships, totalMatches });
}

/** handleSearchRelationships()'s own exact counterpart against
 * `DictionaryView.searchLexicalRelationships()` -- the Word Detail
 * UI's own "Sense.Lexical.Relationships" section, dispatched from
 * fetchDetailLexicalRelsIfNeeded() (client_detail_panel_controller.ts)
 * whenever a selected Word's detail panel needs them over
 * MAX_INTERACTIVE_WORDS. */
function handleSearchLexicalRelationships(request: SearchLexicalRelationshipsRequest): void {
  const domain = domains.get(request.domain);
  if (!domain) {
    post({ type: "search-lexical-relationships-result", requestId: request.requestId, relationships: [], totalMatches: 0 });
    return;
  }

  const view = new DictionaryView(domain.vocabulary.dictionary, domain.vocabulary.semanticRelationships, {
    title: `LIRA — ${domain.name}`,
    domainName: domain.name,
    phrases: domain.vocabulary.phrases,
    senses: domain.vocabulary.senses,
    wordForms: domain.vocabulary.wordForms,
    lexicalRelationships: domain.vocabulary.lexicalRelationships,
    coordinations: domain.vocabulary.coordinations,
  });
  const { relationships, totalMatches } = view.searchLexicalRelationships({
    wordId: request.wordId,
    query: request.query,
    limit: request.limit,
  });
  post({ type: "search-lexical-relationships-result", requestId: request.requestId, relationships, totalMatches });
}

function handleResolveHierarchy(request: ResolveHierarchyRequest): void {
  const domain = domains.get(request.domain);
  if (!domain) {
    post({
      type: "resolve-hierarchy-result",
      requestId: request.requestId,
      nodes: [],
      edges: [],
      roots: [],
      totalEdgeCount: 0,
      totalNodeCount: 0,
      fellBack: false,
      truncated: false,
    });
    return;
  }

  const view = new DictionaryView(domain.vocabulary.dictionary, domain.vocabulary.semanticRelationships, {
    title: `LIRA — ${domain.name}`,
    domainName: domain.name,
    phrases: domain.vocabulary.phrases,
    senses: domain.vocabulary.senses,
    wordForms: domain.vocabulary.wordForms,
    lexicalRelationships: domain.vocabulary.lexicalRelationships,
    coordinations: domain.vocabulary.coordinations,
  });
  const result = view.resolveHierarchy({ kind: request.kind, wordId: request.wordId, limit: request.limit });
  post({ type: "resolve-hierarchy-result", requestId: request.requestId, ...result });
}

// The direct MessagePort to the Linguistic Service worker
// (dictionary_query_protocol.ts's own docstring) -- undefined until
// main.ts's own one-time "link-port" message arrives, which it sends
// right after constructing both workers, well before any real read
// request could reach the Linguistic Service.
let linguisticsPort: MessagePort | undefined;

function handleLinkPort(request: LinkPortRequest): void {
  linguisticsPort = request.port;
  linguisticsPort.onmessage = (event: MessageEvent<LookupWordsRequest>) => handleLookupWords(event.data);
}

/** Answers one LookupWordsRequest -- every real Word/WordForm/Phrase
 * this Domain's own seeded stores have for any of `request.texts`
 * (dictionary_query_protocol.ts's own docstring on why this is
 * text-driven rather than a full-store export). `domains.get()` comes
 * back empty/undefined exactly when nothing has been seeded into this
 * Domain yet (handleInit's own "seeds nothing at startup" default, or
 * a Domain name the Linguistic Service never should have addressed) --
 * either way this simply reports no matches, the same honest
 * "UNRESOLVED, not guessed" behaviour identifyWord itself already
 * gives a genuinely-unseeded token. */
function handleLookupWords(request: LookupWordsRequest): void {
  if (!linguisticsPort) return;
  const domain = domains.get(request.domain);
  if (!domain) {
    linguisticsPort.postMessage({ type: "lookup-words-result", requestId: request.requestId, words: [], wordForms: [], phrases: [] });
    return;
  }
  const words: Word[] = [];
  const wordForms: { word: Word; form: WordForm }[] = [];
  const phrases: { phrase: Phrase; partOfSpeech: PartOfSpeech }[] = [];
  for (const text of request.texts) {
    words.push(...domain.vocabulary.dictionary.lookupAll(text));
    wordForms.push(...domain.vocabulary.wordForms.lookupByText(text));
    for (const phrase of domain.vocabulary.phrases.lookupAll(text)) {
      phrases.push({ phrase, partOfSpeech: domain.vocabulary.phrases.partOfSpeechOf(phrase)! });
    }
  }
  linguisticsPort.postMessage({ type: "lookup-words-result", requestId: request.requestId, words, wordForms, phrases });
}

ctx.addEventListener("message", (event) => {
  const request = event.data;
  if (request.type === "init") void handleInit();
  else if (request.type === "link-port") handleLinkPort(request);
  else if (request.type === "render") handleRender(request);
  else if (request.type === "seed-wordnet") void handleSeedWordNet(request);
  else if (request.type === "seed-common-vocabulary") void handleSeedCommonVocabulary(request);
  else if (request.type === "search-words") handleSearchWords(request);
  else if (request.type === "search-phrases") handleSearchPhrases(request);
  else if (request.type === "search-senses") handleSearchSenses(request);
  else if (request.type === "search-relationships") handleSearchRelationships(request);
  else if (request.type === "search-lexical-relationships") handleSearchLexicalRelationships(request);
  else if (request.type === "resolve-hierarchy") handleResolveHierarchy(request);
});
