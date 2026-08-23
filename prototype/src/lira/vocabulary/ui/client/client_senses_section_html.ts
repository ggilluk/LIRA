/** Originally a verbatim slice of the embedded client script (original
 * dictionary_view.ts lines 3548-3625) -- padMeterRow()/sensesSectionHTML(),
 * shared by both Word and Phrase detail panels. Now also renders
 * WordSenseSummary.frames (ui/server/builder_word.ts), the real WordNet
 * verb-frame sentences for a VERB sense, in its own collapsible
 * <details> alongside the existing PAD one.
 *
 * Restructured a second time -- the first pass (senseRowHTML(), since
 * removed) nested Sense.Semantic.Relationships/Sense.Lexical.Relationships
 * inside each individual Sense's own row (WordForm -> Sense -> [Semantic,
 * Lexical]). The user asked for the opposite grouping: relationship
 * *kind* as the primary axis directly under the WordForm, Sense as the
 * secondary one nested inside each kind (WordForm -> [Semantic
 * Relationships, Lexical Relationships], each internally grouped by
 * which Sense a given relationship came from) -- so a reader browsing
 * "every semantic fact this WordForm has" isn't forced to open N
 * separate per-Sense sections to see them all, and likewise for lexical
 * facts. `senseSummaryRowHTML()` is what's left of the old per-Sense
 * row -- definition/frequency/synonyms/PAD/Verb-Frames, no relationship
 * data of its own -- rendered once, in its own plain "Senses" list, so
 * that basic per-Sense information still has exactly one home rather
 * than being duplicated inside both relationship-kind sections.
 * `wordFormRelationshipsSectionHTML()` is the new piece: one call for
 * Semantic, one for Lexical, each skipping any Sense that carries zero
 * relationships of that particular kind (a monosemous Word with ten
 * Lexical-Relationship-less senses would otherwise repeat "(0)" for no
 * reason) and sub-heading the rest by that Sense's own short
 * definition. Both `wordFormsSectionHTML()` (client_detail_panel_controller.ts,
 * the Word path) and `phraseSensesSectionHTML()` below (the Phrase path,
 * which has no WordForm of its own to group by at all, so its own
 * `phrase.senses` stands in for one) call these three pieces the same
 * way. */
export const CLIENT_SENSES_SECTION_HTML = `// One PAD (Pleasure-Arousal-Dominance) meter row: a track centred on
// zero, filled from the centre toward the value's sign -- accent
// colour for the named positive pole, the palette's warning red for
// the named negative pole (word.pad's own field docstrings: negative
// means the *named* low/opposite pole, e.g. Displeasure, not just
// "less").
function padMeterRow(posLabel, negLabel, value) {
  const clamped = Math.max(-1, Math.min(1, value));
  const pct = Math.abs(clamped) * 50;
  const negative = clamped < 0;
  const left = negative ? (50 - pct) : 50;
  return \`
    <div class="pad-row">
      <span class="pad-label">\${posLabel} / \${negLabel}</span>
      <span class="pad-track"><span class="pad-fill\${negative ? ' negative' : ''}" style="left:\${left}%;width:\${pct}%"></span></span>
      <span class="pad-value">\${clamped.toFixed(2)}</span>
    </div>\`;
}

// WordSenseSummary.frames's own raw text carries WordNet's own literal
// "----" placeholder standing in for the verb itself (VERB_FRAME_TEXT's
// own docstring, data/enums/verb_framed_example_template.ts) -- e.g. "Somebody ----s something" for
// "eat". Substituted here, client-side, with word's own real inflected
// spelling rather than shown as the raw WordNet placeholder: "----ing"
// (only ever "It is ----ing"/"Something is ----ing PP") against
// presentParticipleForm, "----s" (every other frame) against
// thirdPersonSingularPresentForm, falling back to naive lemma+suffix
// concatenation only for the pathological case neither *_Form entry is
// present in word.word_forms (shouldn't happen for a real seeded Verb --
// generateVerbForms() always populates both). Reads word.word_forms
// (already sent to the client for the Word Forms section) rather than
// requiring WordSenseSummary to carry its own copy of the same two
// values.
function verbFrameText(word, frame) {
  const formValue = (field) => {
    const entry = (word.word_forms || []).find(f => f.field === field);
    return entry ? entry.value : undefined;
  };
  const base = word.lexical_form;
  const ing = formValue('presentParticipleForm') || (base + 'ing');
  const thirdPerson = formValue('thirdPersonSingularPresentForm') || (base + 's');
  return frame.replace(/----ing/g, ing).replace(/----s/g, thirdPerson).replace(/----/g, base);
}

// One Sense's own plain info -- definition/frequency/synonyms, plus its
// own PAD affect and Verb Frames \`<details>\` when seeded -- no
// relationship data of any kind. Open by default only for the primary
// sense's own PAD/Frames \`<details>\` (same reasoning as before: a
// highly polysemous Word shouldn't dump every sense's own affect/frame
// data expanded at once); the row itself is always shown, never
// collapsed, since this list is the one place a reader finds out what a
// Sense actually *means* before deciding whether to open either
// relationship-kind section below for it.
function senseSummaryRowHTML(word, s, index) {
  return \`
    <li class="sense-row\${s.is_primary ? ' primary' : ''}">
      <span class="sense-number">\${index + 1}\${s.is_primary ? ' <span class="sense-primary-tag">primary</span>' : ''}</span>
      <span class="sense-definition">\${s.definition || '<span style="opacity:.6">No definition.</span>'}</span>
      <span class="sense-meta">\${domainPill(s.domain)}\${s.frequency !== null ? \` <span class="sense-frequency" title="WordNet tagged-occurrence count (SemCor semantic concordance)">freq \${s.frequency.toLocaleString()}</span>\` : ''}\${s.synonyms.length ? \` <span class="sense-synonyms">synonyms: \${s.synonyms.map(syn => \`<button class="link-btn" data-pivot-id="\${syn.id}">\${syn.text}</button>\`).join(', ')}</span>\` : ''}</span>
      \${s.pad ? \`
      <details class="sense-pad"\${s.is_primary ? ' open' : ''}>
        <summary>Affect (PAD, seeded)</summary>
        <div class="pad-meters">
          \${padMeterRow('Pleasure', 'Displeasure', s.pad.pleasure)}
          \${padMeterRow('Arousal', 'Non-Arousal', s.pad.arousal)}
          \${padMeterRow('Dominance', 'Submissive', s.pad.dominance)}
        </div>
      </details>\` : ''}
      \${s.frames && s.frames.length ? \`
      <details class="sense-frames"\${s.is_primary ? ' open' : ''}>
        <summary>Sense.Verb.Framed.Examples (\${s.frames.length})</summary>
        <ul class="sense-frame-list">\${s.frames.map(f => \`<li>\${verbFrameText(word, f)}</li>\`).join('')}</ul>
      </details>\` : ''}
    </li>\`;
}

// The new primary-axis-by-kind section -- one call each for Semantic
// and Lexical (\`sectionClass\`/\`heading\` name which). \`rels\` follows
// relationshipsSectionHTML's own null/[]/populated convention -- null
// while still loading over capacity, so the header count reads "…"
// rather than a wrong "0" until the real fetch resolves; a Sense is
// still shown as its own sub-group while loading (nothing to filter out
// yet), just with an unresolved count of its own. Once loaded, only a
// Sense that actually has ≥ 1 relationship of this one kind gets a
// sub-group at all -- \`senses\` is every Sense the owning WordForm (or,
// for a Phrase, every Sense it carries) has, most of which carry zero
// relationships of any one given kind, and repeating "Sense: <definition>
// (0)" for each would bury the ones that actually have something to
// show. Closed by default (no \`open\` attribute) regardless of primary
// sense -- unlike the old per-Sense \`<details>\`, this one can now
// aggregate a highly polysemous Word's *entire* relationship set behind
// one summary line, so leaving it open by default would be the exact
// "dump everything at once" outcome the old per-sense open/closed split
// was already trying to avoid.
function wordFormRelationshipsSectionHTML(sectionClass, heading, senses, rels) {
  const groups = senses
    .map(s => ({ sense: s, rels: rels === null ? null : rels.filter(r => r.via_sense_id === s.id) }))
    .filter(g => g.rels === null || g.rels.length > 0);
  if (!groups.length) return '';
  const anyLoading = groups.some(g => g.rels === null);
  const total = anyLoading ? '…' : groups.reduce((n, g) => n + g.rels.length, 0);
  return \`
    <details class="\${sectionClass}">
      <summary>\${heading} (\${total})</summary>
      \${groups.map(g => \`
        <div class="wordform-rel-sense-group\${g.sense.is_primary ? ' primary' : ''}">
          <div class="wordform-rel-sense-heading">Sense\${g.sense.is_primary ? ' <span class="sense-primary-tag">primary</span>' : ''}: \${g.sense.definition || '<span style="opacity:.6">No definition.</span>'}</div>
          <div class="detail-relationships-section">\${relationshipsSectionHTML(g.rels)}</div>
        </div>\`).join('')}
    </details>\`;
}

// senseSummaryRowHTML()'s own flat, ungrouped list, plus the same two
// relationship-kind sections a WordForm's own detail gets -- phraseDetailHTML()'s
// own use (client_detail_panel_controller.ts). A Phrase has no WordForm
// of its own to nest under at all (WordForm is a Word-only concept,
// data/word_form.ts's own docstring -- wordFormsFor() never returns
// anything for a Phrase-resolved record), so \`phrase.word_forms\` is
// always empty and WordRecord.senses's own flat, Word-level list (kept
// for exactly this kind of reader, that field's own docstring) stands
// in for the WordForm-scoped \`senses\` argument \`wordFormRelationshipsSectionHTML()\`
// otherwise expects.
function phraseSensesSectionHTML(phrase, rels, lexicalRels) {
  if (!phrase.senses || !phrase.senses.length) return '';
  return \`
    <div class="detail-section-title">Senses (\${phrase.senses.length})</div>
    <ol class="sense-list">
      \${phrase.senses.map((s, i) => senseSummaryRowHTML(phrase, s, i)).join('')}
    </ol>
    \${wordFormRelationshipsSectionHTML('sense-rels', 'Semantic Relationships', phrase.senses, rels)}
    \${wordFormRelationshipsSectionHTML('sense-lexical-rels', 'Lexical Relationships', phrase.senses, lexicalRels)}
  \`;
}
`;
