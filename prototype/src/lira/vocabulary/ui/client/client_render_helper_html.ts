/** Verbatim slice of the embedded client script (original dictionary_view.ts
 * lines 2683-3055) -- the WORDS/PHRASES/.../DOMAIN_COLORS data bindings, shared
 * `state`, and the generic pill/badge/definition-rendering render helpers,
 * plus the pos/domain/hierarchy-kind filter-population helpers that
 * physically sit right alongside them in the original script. */
export const CLIENT_RENDER_HELPER_HTML = `const WORDS = @@WORDS_JSON@@;
const PHRASES = @@PHRASES_JSON@@;
const SENSES = @@SENSES_JSON@@;
const RELS = @@RELS_JSON@@;
const UNRESOLVED = @@UNRESOLVED_JSON@@;
const POS_COLORS = @@POS_COLORS_JSON@@;
const GROUP_COLORS = @@GROUP_COLORS_JSON@@;
const GROUP_NAMES = @@GROUP_NAMES_JSON@@;
const DOMAIN_COLORS = @@DOMAIN_COLORS_JSON@@;
// True when this Domain's own Word/relationship count is over
// DictionaryView's own MAX_INTERACTIVE_WORDS (that constant's own
// docstring) -- WORDS/RELS above are deliberately [] in that case, not
// a truncated slice of the real data, so the stat tiles below fall back
// to the true, still-accurate TOTAL_WORD_COUNT/TOTAL_RELATIONSHIP_COUNT
// instead of the empty arrays' own (misleadingly zero) length.
const OVER_CAPACITY = @@OVER_CAPACITY_JSON@@;
// Same reasoning as OVER_CAPACITY just above, checked against the
// Phrases's own count instead -- PHRASES is deliberately [] whenever
// this is true (render()'s own overCapacityPhrases), not a truncated
// slice, so the Phrases stat tile falls back to TOTAL_PHRASE_COUNT the
// same way the Words tile already falls back to TOTAL_WORD_COUNT.
const OVER_CAPACITY_PHRASES = @@OVER_CAPACITY_PHRASES_JSON@@;
// Same reasoning as OVER_CAPACITY_PHRASES just above, checked against
// the Senses store's own count instead.
const OVER_CAPACITY_SENSES = @@OVER_CAPACITY_SENSES_JSON@@;
const TOTAL_WORD_COUNT = @@WORD_COUNT@@;
const TOTAL_PHRASE_COUNT = @@PHRASE_COUNT@@;
const TOTAL_SENSE_COUNT = @@SENSE_COUNT@@;
const TOTAL_RELATIONSHIP_COUNT = @@RELATIONSHIP_COUNT@@;
// The pos-filter/domain-filter <select> options -- computed server-side
// off every Word in the Dictionary (render()'s own posValues/
// domainValues), not derived from WORDS here: WORDS is [] whenever
// OVER_CAPACITY is true, which used to leave both filters silently
// empty despite the Dictionary actually holding hundreds of thousands
// of Words (populatePosFilter/populateDomainFilter's own docstrings).
const POS_VALUES = @@POS_VALUES_JSON@@;
const DOMAIN_VALUES = @@DOMAIN_VALUES_JSON@@;
// The Hierarchy/Cyclic tabs' own "Relationship kind" dropdowns -- same
// reasoning as POS_VALUES/DOMAIN_VALUES just above, computed server-side
// off the whole SemanticRelationshipStore (render()'s own
// relationshipKindCounts()) rather than scanned from RELS, which is []
// whenever OVER_CAPACITY is true. One \`{kind, group, count}\` entry per
// kind actually present in this Dictionary.
const RELATIONSHIP_KIND_COUNTS = @@RELATIONSHIP_KIND_COUNTS_JSON@@;

// selectedWordId is shared across every tab -- Words (row highlight +
// detail panel), Relationships (scopes the table to just this word),
// Hierarchy (the tree's own "centre word"), and Cyclic (highlights its
// own cluster) all read the *same* value, rather than each tab tracking
// its own independent selection the way an earlier version of this
// script did. selectWord() below is the one place that ever writes it.
const state = {
  tab: "words", search: { word: "", gloss: "", definition: "" }, pos: "", domain: "", rootWordsOnly: false,
  selectedWordId: null,
  hierarchyKind: null, cyclicKind: null,
  sort: { words: ["lexical_form", 1], rels: ["source_text", 1] },
};

function titleCase(s) {
  return s.toLowerCase().split("_").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

// Reciprocal-kind groupings for the Hierarchy/Cyclic kind selectors --
// shown together under one <optgroup> rather than scattered across a
// flat alphabetical list, so a reciprocal pair (or, for TROPONYM, the
// verb-specific hyponymy triple sharing HYPERNYM) reads as one unit.
// HYPERNYM/HYPONYM/TROPONYM applies to nouns (HYPERNYM/HYPONYM) and
// verbs (TROPONYM/HYPERNYM, troponymy being verb-specific hyponymy --
// examples/troponym_verb_backfill.py's own module docstring);
// MERONYM/HOLONYM applies to nouns. A kind not listed here (SYNONYM,
// ANTONYM, RELATED, CAUSE, ENTAILMENT, every morphological/orthographic
// kind) has no distinct reciprocal-kind partner of its own -- either
// genuinely symmetric (stored both directions under the same kind),
// paired with LEMMA_FORM generically, or -- CAUSE and ENTAILMENT
// specifically -- simply not a reciprocal pair at all: both apply to
// verbs and often co-occur on the identical WordNet pointer pair
// (\`>\` alongside \`*\`), but they name two distinct relations
// (causation, logical entailment), not two directions of one relation
// the way
// HYPERNYM/HYPONYM or MERONYM/HOLONYM are -- grouping them here would
// misleadingly imply CAUSE is "the opposite of" ENTAILMENT, which it
// isn't; each stays in the plain ungrouped list instead.
const KIND_PAIR_GROUPS = [
  { label: "Hypernym / Hyponym / Troponym", kinds: ["HYPERNYM", "HYPONYM", "TROPONYM"] },
  { label: "Meronym / Holonym", kinds: ["MERONYM", "HOLONYM"] },
];

// Builds <option>s for every kind in \`counts\`, grouping any kind listed
// in KIND_PAIR_GROUPS under its own <optgroup> (kinds sorted within the
// group in the order declared, not alphabetically, so e.g. Hypernym
// reads before Hyponym) and appending every remaining kind afterward,
// alphabetically, exactly as before this grouping existed.
function appendKindOptions(select, counts) {
  const remaining = new Set(Object.keys(counts));
  KIND_PAIR_GROUPS.forEach(({ label, kinds }) => {
    const present = kinds.filter(k => remaining.has(k));
    if (present.length < 2) return; // nothing to pair here in this Dictionary
    const group = document.createElement("optgroup");
    group.label = label;
    present.forEach(kind => {
      const opt = document.createElement("option");
      opt.value = kind;
      opt.textContent = \`\${titleCase(kind)} (\${counts[kind]})\`;
      group.appendChild(opt);
      remaining.delete(kind);
    });
    select.appendChild(group);
  });
  [...remaining].sort().forEach(kind => {
    const opt = document.createElement("option");
    opt.value = kind;
    opt.textContent = \`\${titleCase(kind)} (\${counts[kind]})\`;
    select.appendChild(opt);
  });
}

function posPill(pos) {
  const color = POS_COLORS[pos] || "#7A7A7A";
  return \`<span class="pill" style="background:\${color}">\${titleCase(pos)}</span>\`;
}

// word.phrase_type's own pill -- only ever set on a record resolved
// from a Phrase (WordRecord.phrase_type's own docstring), so this is
// only ever called from phraseDetailHTML()/phraseRowHtml(), alongside
// posPill()/domainPill(), never for an ordinary Word. Its own fixed colour, distinct from both
// POS_COLORS and DOMAIN_COLORS, since phraseType is neither -- it's a
// third, independent classification (grammatical internal structure,
// PhraseType's own docstring, vocabulary/data/enums/phrase_type.ts) that can
// appear alongside a Phrase's own partOfSpeech pill in the same row.
function phraseTypePill(phraseType) {
  return \`<span class="pill" style="background:#6E5A9E">\${titleCase(phraseType)}</span>\`;
}

// The Princeton WordNet 3.1 synset a Word/related-word came from
// (WordRecord.sense_id / RelationshipRecord.*_sense_id), rendered as a
// small muted tag to the right of its own word text -- "" (nothing
// shown) for a Word with no sense_id, i.e. every Common Vocabulary
// Cache entry that didn't come from WordSeeder.seedWordNet.
function senseIdBadge(senseId) {
  return senseId ? \`<span class="sense-id" title="Princeton WordNet 3.1 synset">\${senseId}</span>\` : "";
}

// RelationshipRecord.target_category/source_category's own render --
// WordNet's lexicographer-file category for the *other* end's own
// Sense ("noun.artifact"), Sense.senseDomainTag's own docstring on why
// it's always shown POS-qualified, never truncated. "" (nothing shown)
// for a hand-curated Sense with no WordNet source, same as senseIdBadge.
function categoryBadge(category) {
  return category ? \`<span class="category-tag" title="WordNet lexicographer-file category">\${category}</span>\` : "";
}

function relPill(kind, group) {
  const color = GROUP_COLORS[group] !== undefined ? GROUP_COLORS[group] : "#7A7A7A";
  return \`<span class="pill" style="background:\${color}" title="\${GROUP_NAMES[group] || ''}">\${titleCase(kind)}</span>\`;
}

// word_seeder.ts's own relationshipKindForPointer stores only ONE edge
// per hypernym/meronym-family fact (a word's own outgoing kind), never
// a second, separately-labelled edge for the reciprocal direction --
// but a word's own relationship list still needs to read as "Hyponym"/
// "Holonym" when it's on the *receiving* end of one of these, not
// "Hypernym"/"Meronym" again with only the arrow reversed (that would
// misread as "the other word is my hypernym", not "I have the other
// word as a hyponym"). This is a display-only relabelling -- the
// underlying relationshipSentence() call still uses the real stored
// kind, which already reads correctly regardless of viewing direction
// (relationshipsSectionHTML's own call site), and the pill's own colour
// (relPill's \`group\` argument) is unaffected either way: every kind
// listed here is a SemanticRelationshipKind now, and relationshipRecordFor()'s
// own docstring already reports group 1 ("Lexical Semantic") for every
// one of them unconditionally, reciprocal pairs included.
const RECIPROCAL_DISPLAY_KIND = {
  HYPERNYM: "HYPONYM",
  MERONYM: "HOLONYM",
};

function displayKind(kind, outgoing) {
  return outgoing ? kind : (RECIPROCAL_DISPLAY_KIND[kind] || kind);
}

function domainPill(domain) {
  if (!domain) return "";
  // A polysemous Common word's domain reads as "<hypernym>.common"
  // (Word.domain_tag) rather than plain "Common" -- still a Common
  // word, so it keeps Common's own colour rather than falling through
  // to the generic "unknown domain" grey.
  const color = DOMAIN_COLORS[domain] || (domain.endsWith(".common") ? DOMAIN_COLORS["Common"] : "#7A7A7A");
  return \`<span class="pill" style="background:\${color}">\${domain}</span>\`;
}

// One plain-English sentence per relationship kind, always phrased in
// terms of the edge's own (source, target) -- e.g. a HYPERNYM edge is
// stored as (narrower, HYPERNYM, broader), so "source is a type of
// target" reads correctly regardless of which side the viewer selected
// (relationshipsForWord's otherText/outgoing only control the arrow and
// which word is clickable, not this sentence). Kinds not listed fall
// back to a generic "source is target-kind-related to target".
const RELATIONSHIP_SENTENCES = {
  // Lexical Semantic
  SYNONYM: (s, t) => \`\${s} means the same as \${t}.\`,
  ANTONYM: (s, t) => \`\${s} is the opposite of \${t}.\`,
  HYPERNYM: (s, t) => \`\${s} is a type of \${t}.\`,
  HYPONYM: (s, t) => \`\${t} is a type of \${s}.\`,
  // WordNet distinguishes what kind of part-whole fact this is (a piece
  // of a larger whole, a member of a group, or a substance a whole is
  // made of) via a \`meronymKind\` qualifier on the same MERONYM kind,
  // not three separate relationship kinds (MERONYM's own docstring,
  // lexical_relationship_type.ts) -- \`q\` reads that qualifier straight
  // from the row (relationshipRecordFor()'s own qualifier field,
  // dictionary_view.ts), defaulting to the general "part of" phrasing
  // for an unqualified, hand-curated Common Vocabulary Cache fact.
  MERONYM: (s, t, q) => (q === "member" ? \`\${s} is a member of \${t}.\` : q === "substance" ? \`\${s} is made of \${t}.\` : \`\${s} is a part of \${t}.\`),
  HOLONYM: (s, t, q) => (q === "member" ? \`\${t} is a member of \${s}.\` : q === "substance" ? \`\${t} is made of \${s}.\` : \`\${t} is a part of \${s}.\`),
  TROPONYM: (s, t) => \`\${t} is a specific manner of \${s}.\`,
  ENTAILMENT: (s, t) => \`\${s} entails \${t}.\`,
  CAUSE: (s, t) => \`\${s} causes \${t}.\`,
  RELATED: (s, t) => \`\${s} is related to \${t}.\`,
  // Lexical Semantic -- WordNet-sourced (lexical_relationship_type.ts's
  // own docstring on PERTAINYM through USAGE_DOMAIN)
  SIMILAR_TO: (s, t) => \`\${s} is similar in meaning to \${t}.\`,
  ALSO_SEE: (s, t) => \`\${s} is related to \${t} -- see also.\`,
  VERB_GROUP: (s, t) => \`\${s} and \${t} are closely related senses.\`,
  ATTRIBUTE: (s, t) => \`\${s} is a value of the attribute \${t}.\`,
  TOPIC_DOMAIN: (s, t) => \`\${s} belongs to the \${t} topic domain.\`,
  REGION_DOMAIN: (s, t) => \`\${s} belongs to the \${t} regional domain.\`,
  USAGE_DOMAIN: (s, t) => \`\${s} belongs to the \${t} usage domain.\`,
  // Morphological -- base relation
  LEMMA_FORM: (s, t) => \`\${t} is the base (lemma) form of \${s}.\`,
  INFLECTION: (s, t) => \`\${t} is an inflected form of \${s}.\`,
  // Morphological -- number
  SINGULAR_FORM: (s, t) => \`\${t} is the singular form of \${s}.\`,
  PLURAL_FORM: (s, t) => \`\${t} is the plural form of \${s}.\`,
  // Morphological -- tense
  PRESENT_TENSE_FORM: (s, t) => \`\${t} is the present-tense form of \${s}.\`,
  PAST_TENSE_FORM: (s, t) => \`\${t} is the past-tense form of \${s}.\`,
  // Morphological -- aspect
  PRESENT_PARTICIPLE_FORM: (s, t) => \`\${t} is the present-participle form of \${s}.\`,
  PAST_PARTICIPLE_FORM: (s, t) => \`\${t} is the past-participle form of \${s}.\`,
  // Morphological -- person
  FIRST_PERSON_FORM: (s, t) => \`\${t} is the first-person form of \${s}.\`,
  SECOND_PERSON_FORM: (s, t) => \`\${t} is the second-person form of \${s}.\`,
  THIRD_PERSON_FORM: (s, t) => \`\${t} is the third-person form of \${s}.\`,
  // Morphological -- degree
  COMPARATIVE_FORM: (s, t) => \`\${t} is the comparative form of \${s}.\`,
  SUPERLATIVE_FORM: (s, t) => \`\${t} is the superlative form of \${s}.\`,
  // Morphological -- derivation
  DERIVED_FORM: (s, t) => \`\${t} is derived from \${s}.\`,
  AGENT_NOUN_DERIVATION: (s, t) => \`\${t} is the agent-noun form of \${s}.\`,
  NOMINALISATION: (s, t) => \`\${t} is the noun form of \${s}.\`,
  ADJECTIVAL_DERIVATION: (s, t) => \`\${t} is the adjective form of \${s}.\`,
  ADVERBIAL_DERIVATION: (s, t) => \`\${t} is the adverb form of \${s}.\`,
  PERTAINYM: (s, t) => \`\${s} pertains to \${t}.\`,
  // Morphological -- pronoun form
  PRONOUN_OBJECT_FORM: (s, t) => \`\${t} is the object form of \${s}.\`,
  PRONOUN_SUBJECT_FORM: (s, t) => \`\${t} is the subject form of \${s}.\`,
  PRONOUN_POSSESSIVE_DETERMINER_FORM: (s, t) => \`\${t} is the possessive-determiner form of \${s}.\`,
  PRONOUN_POSSESSIVE_FORM: (s, t) => \`\${t} is the possessive form of \${s}.\`,
  PRONOUN_REFLEXIVE_FORM: (s, t) => \`\${t} is the reflexive form of \${s}.\`,
  PRONOUN_RECIPROCAL_FORM: (s, t) => \`\${t} is the reciprocal form of \${s}.\`,
  // Orthographic and Naming
  SPELLING_VARIANT: (s, t) => \`\${t} is a spelling variant of \${s}.\`,
  HISTORICAL_SPELLING: (s, t) => \`\${t} is a historical spelling of \${s}.\`,
  ABBREVIATION: (s, t) => \`\${t} is an abbreviation of \${s}.\`,
  ACRONYM: (s, t) => \`\${t} is an acronym formed from \${s}.\`,
  INITIALISM: (s, t) => \`\${t} is an initialism formed from \${s}.\`,
  CONTRACTION: (s, t) => \`\${t} is a contracted form of \${s}.\`,
  TRANSLITERATION: (s, t) => \`\${t} is a transliteration of \${s}.\`,
  CAPITALISATION: (s, t) => \`\${t} is a capitalisation variant of \${s}.\`,
  DIACRITIC_VARIANT: (s, t) => \`\${t} is a diacritic variant of \${s}.\`,
};

function relationshipSentence(kind, sourceText, targetText, qualifier) {
  const template = RELATIONSHIP_SENTENCES[kind];
  if (template) return template(sourceText, targetText, qualifier);
  return \`\${sourceText} is \${titleCase(kind).toLowerCase()}-related to \${targetText}.\`;
}

function truncate(text, max) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
}

// Renders word.definition_segments (DictionaryView._definition_segments)
// as inline text with each word token wrapped in a hover/focus tooltip
// identifying its own part of speech, domain, and a short gloss -- built
// from Word.definition_words() (vocabulary/documentation/README.md, 4.4)
// on the Python side, not re-derived here. Plain-text segments
// (punctuation, whitespace) pass through unwrapped, so the sentence
// reads exactly as word.definition itself does.
function definitionSegmentHTML(seg) {
  if (!seg.word) return seg.text;
  if (!seg.resolved) {
    return \`<span class="def-word def-word-unresolved" tabindex="0">\${seg.text}\`
      + \`<span class="def-tooltip"><span class="tt-title">\${seg.text}</span>\`
      + \`<span class="tt-meta">Not in this Dictionary</span></span></span>\`;
  }
  const meta = [titleCase(seg.pos)];
  if (seg.domain) meta.push(seg.domain);
  return \`<span class="def-word" tabindex="0" data-word-id="\${seg.word_id}">\${seg.text}\`
    + \`<span class="def-tooltip"><span class="tt-title">\${seg.lexical_form}</span>\`
    + \`<span class="tt-meta">\${meta.join(" &middot; ")}</span>\${truncate(seg.gloss, 110)}</span></span>\`;
}

function renderDefinition(word) {
  if (!word.definition_segments || !word.definition_segments.length) {
    return word.definition || word.gloss || "No definition on record.";
  }
  return \`<span class="def-text">\${word.definition_segments.map(definitionSegmentHTML).join("")}</span>\`;
}

function populatePosFilter() {
  const select = document.getElementById("pos-filter");
  POS_VALUES.forEach(pos => {
    const opt = document.createElement("option");
    opt.value = pos;
    opt.textContent = titleCase(pos);
    select.appendChild(opt);
  });
}

function populateDomainFilter() {
  const select = document.getElementById("domain-filter");
  DOMAIN_VALUES.forEach(domain => {
    const opt = document.createElement("option");
    opt.value = domain;
    opt.textContent = domain;
    select.appendChild(opt);
  });
}

function populateHierarchyKindFilter() {
  const select = document.getElementById("hierarchy-kind");
  const counts = {};
  RELATIONSHIP_KIND_COUNTS.forEach(({ kind, count }) => { counts[kind] = count; });
  const kinds = Object.keys(counts).sort();
  appendKindOptions(select, counts);
  state.hierarchyKind = kinds[0] || null;
  if (state.hierarchyKind) select.value = state.hierarchyKind;
}

// Relabels every existing <option> in #hierarchy-kind with a count
// scoped to the shared selection, instead of leaving them stuck at
// populateHierarchyKindFilter()'s own whole-Dictionary counts forever
// -- the set of kinds offered never changes (only appendKindOptions
// does that), just the "(N)" each one reports, so this only ever
// touches option.textContent rather than rebuilding the <select>
// (preserving its own open/scroll state). Falls back to the
// whole-Dictionary count for a kind while nothing is selected, and
// also while a selected word's own relationship list is still an
// in-flight over-capacity fetch (detailRelsCache.get() returns
// undefined until fetchDetailRelsIfNeeded()'s request resolves) --
// showing 0 for every kind in that brief window would read as "this
// word has no relationships" before the real answer has even arrived.
function refreshHierarchyKindCounts() {
  const select = document.getElementById("hierarchy-kind");
  if (!select) return;
  const totals = {};
  RELATIONSHIP_KIND_COUNTS.forEach(({ kind, count }) => { totals[kind] = count; });
  let scoped = null;
  if (state.selectedWordId) {
    const rows = OVER_CAPACITY ? detailRelsCache.get(state.selectedWordId) : relationshipsForWord(state.selectedWordId);
    if (rows) {
      scoped = {};
      rows.forEach(r => { scoped[r.kind] = (scoped[r.kind] || 0) + 1; });
    }
  }
  select.querySelectorAll("option").forEach(opt => {
    const kind = opt.value;
    if (!kind) return;
    const count = scoped ? (scoped[kind] || 0) : (totals[kind] || 0);
    opt.textContent = \`\${titleCase(kind)} (\${count})\`;
  });
}`;
