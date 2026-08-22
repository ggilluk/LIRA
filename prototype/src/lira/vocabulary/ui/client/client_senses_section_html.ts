/** Originally a verbatim slice of the embedded client script (original
 * dictionary_view.ts lines 3548-3625) -- padMeterRow()/sensesSectionHTML(),
 * shared by both Word and Phrase detail panels. Now also renders
 * WordSenseSummary.frames (ui/server/builder_word.ts), the real WordNet
 * verb-frame sentences for a VERB sense, in its own collapsible
 * <details> alongside the existing PAD one.
 *
 * Restructured to group by WordForm (word_wordform_sense_relationships.md's
 * own target model: Word -> WordForm -> Senses) -- sensesSectionHTML()
 * now iterates `word.word_forms` (WordRecord.word_forms, ui/server/builder_word.ts),
 * rendering one sense sub-list per WordForm that actually carries one or
 * more Senses (WordFormEntry.senses's own docstring -- empty for every
 * scalar-field-derived entry, e.g. pluralNumberForm, that isn't backed
 * by a real WordForm record). Each sense row keeps its existing
 * "Sense.Semantic.Relationships" `<details>` (`rels`, fetched via the
 * `search-relationships` worker message, `via_sense_id`-filtered,
 * unchanged) and gains a sibling "Sense.Lexical.Relationships" one
 * (`lexicalRels`, the identical fetch/filter shape against the new
 * `search-lexical-relationships` message) -- both reuse
 * relationshipsSectionHTML() as-is (client_detail_panel_controller.ts),
 * since a LexicalRelationshipRecord (ui/server/builder_lexical_relationship.ts)
 * carries the exact same source_text/target_text/kind/group/qualifier/
 * via_sense_id shape a RelationshipRecord does once
 * lexicalRelationshipsForWord() (client_words_tab_view.ts) enriches it
 * with the same otherId/otherText/... fields relationshipsForWord()
 * already computes. */
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

// \`rels\`/\`lexicalRels\` both follow relationshipsSectionHTML's own
// null/[]/populated convention -- null while still loading over
// capacity, so a sense's own nested relationship count shows "…" rather
// than a wrong "0" until the real fetch resolves. One sense row per
// (WordForm, Sense) pair, nested under its own WordForm heading -- Sense.pad/
// Sense.frames/Sense.Semantic.Relationships/Sense.Lexical.Relationships
// are each a native \`<details>\`, collapsible with zero extra JS, open
// by default only for the primary sense (the one most callers care
// about first), closed for the rest so a highly polysemous Word ("big",
// ~15 senses) doesn't dump fifteen expanded blocks at once. No PAD
// \`<details>\` at all for a sense with none seeded (every WordNet-seeded
// sense, most hand-curated ones too) -- nothing to show, so nothing to
// collapse.
function senseRowHTML(word, s, index, rels, lexicalRels) {
  // Every relationship here, PERTAINYM included, is a real
  // SemanticRelationship now (Sense-to-Sense -- SemanticRelationshipKind's
  // own docstring, data/enums/semantic_relationship_kind.ts), so
  // \`rels\` (fetched via searchRelationships({wordId}), which
  // sense-expands SemanticRelationshipStore itself) already
  // carries it -- nothing needs synthesizing client-side any more.
  const senseRels = rels === null ? null : rels.filter(r => r.via_sense_id === s.id);
  const count = senseRels === null ? '…' : senseRels.length;
  // lexicalRelationshipsForWord()'s own exact counterpart fact, against
  // the new LexicalRelationship store (data/lexical_relationship.ts) --
  // the Morphological/Orthographic-group facts this Sense's own WordForm
  // reaches (derivation, inflection, contraction, spelling variants, ...)
  // rather than the Lexical Semantic ones \`rels\` above already covers.
  const senseLexicalRels = lexicalRels === null ? null : lexicalRels.filter(r => r.via_sense_id === s.id);
  const lexicalCount = senseLexicalRels === null ? '…' : senseLexicalRels.length;
  return \`
    <li class="sense-row\${s.is_primary ? ' primary' : ''}">
      <span class="sense-number">\${index + 1}\${s.is_primary ? ' <span class="sense-primary-tag">primary</span>' : ''}</span>
      <span class="sense-definition">\${s.definition || '<span style="opacity:.6">No definition.</span>'}</span>
      <span class="sense-meta">\${domainPill(s.domain)}\${s.frequency !== null ? \` <span class="sense-frequency" title="WordNet tagged-occurrence count (SemCor semantic concordance)">freq \${s.frequency.toLocaleString()}</span>\` : ''}\${s.synonyms.length ? \` <span class="sense-synonyms">synonyms: \${s.synonyms.map(syn => \`<button class="link-btn" data-pivot-id="\${syn.id}">\${syn.text}</button>\`).join(', ')}</span>\` : ''}</span>
      <details class="sense-rels"\${s.is_primary ? ' open' : ''}>
        <summary>Sense.Semantic.Relationships (\${count})</summary>
        <div class="detail-relationships-section">\${relationshipsSectionHTML(senseRels)}</div>
      </details>
      <details class="sense-lexical-rels"\${s.is_primary ? ' open' : ''}>
        <summary>Sense.Lexical.Relationships (\${lexicalCount})</summary>
        <div class="detail-relationships-section">\${relationshipsSectionHTML(senseLexicalRels)}</div>
      </details>
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

function sensesSectionHTML(word, rels, lexicalRels) {
  const formsWithSenses = (word.word_forms || []).filter(f => f.senses && f.senses.length);
  if (!formsWithSenses.length) return '';
  const totalSenses = formsWithSenses.reduce((n, f) => n + f.senses.length, 0);
  return \`
    <div class="detail-section-title">Senses (\${totalSenses})</div>
    \${formsWithSenses.map(form => \`
      <div class="word-form-group">
        <div class="word-form-group-title">\${form.label}: <span class="word-form-value">\${form.value}</span></div>
        <ol class="sense-list">
          \${form.senses.map((s, i) => senseRowHTML(word, s, i, rels, lexicalRels)).join('')}
        </ol>
      </div>\`).join('')}
  \`;
}
`;
