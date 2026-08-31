/** The Coordinations tab's own filtering and row rendering --
 * client_phrases_tab_view.ts's own leaner counterpart: Coordination is
 * seeded from a small, closed, hand-curated set today
 * (word_coordination_seeder.ts's own docstring), nowhere near WordNet
 * scale, so there's no over-capacity search dispatch/debounce here at
 * all -- COORDINATIONS is always the full, real list, filtered
 * entirely client-side, the same way every tab worked before
 * MAX_INTERACTIVE_WORDS-scale data existed. No detail panel either:
 * a Coordination carries no relationships/sense/definition of its own
 * for one to show (builder_coordination.ts's own docstring).
 *
 * Also renders every standalone Conjunction Word/Phrase alongside the
 * real coordinate pairs, one merged, sorted list -- builder_coordination.ts's
 * own module docstring on why \`pos === "CONJUNCTION"\` is what tells a
 * Conjunction-itself row apart from a coordinate-pair row on the
 * client side too. */
export const CLIENT_COORDINATIONS_TAB_VIEW = `
function matchesCoordinationQuery(c) {
  const { word: wordQuery } = state.search;
  if (wordQuery) {
    const haystack = (c.coordinates.join(" ") + " " + (c.coordinator || "")).toLowerCase();
    if (!haystack.includes(wordQuery.toLowerCase())) return false;
  }
  return true;
}

function filteredCoordinations() {
  return COORDINATIONS.filter(c => matchesCoordinationQuery(c) && (!state.pos || c.pos === state.pos));
}

// A Conjunction-itself row (pos === "CONJUNCTION", no coordinator of
// its own) reads as its own token(s) rejoined with plain spaces --
// "as" + "long" + "as" -> "as long as", the same text linkPhraseWords()
// itself split it from, not a coordinated list. A real coordinate
// pair instead joins with its own conjunction: "salt and pepper" (two
// coordinates) / "red, white, and blue" (three or more, Oxford-comma
// style) -- Coordination.coordinates's own docstring on why this reads
// as one flat list rather than a nested binary tree. Falls back to
// "and" for the vanishingly rare case a real coordinate pair's own
// c.coordinator is undefined (an asyndetic Coordination,
// Coordination.coordinator's own docstring) -- no real seeded entry
// today actually omits it, but the join still needs some conjunction
// to display.
function coordinatesText(c) {
  if (c.pos === "CONJUNCTION") return c.coordinates.join(" ");
  const conj = c.coordinator || "and";
  if (c.coordinates.length <= 1) return c.coordinates.join(", ");
  if (c.coordinates.length === 2) return c.coordinates.join(\` \${conj} \`);
  return c.coordinates.slice(0, -1).join(", ") + \`, \${conj} \` + c.coordinates[c.coordinates.length - 1];
}

function conjunctionTypePill(conjunctionType) {
  if (!conjunctionType) return '<span style="opacity:.5">&mdash;</span>';
  const color = conjunctionType === "COORDINATING" ? "#3B6EA5" : "#B2542D";
  return \`<span class="pill" style="background:\${color}">\${titleCase(conjunctionType)}</span>\`;
}

function coordinationRowHtml(c) {
  return \`
    <tr>
      <td>\${coordinatesText(c)}</td>
      <td>\${posPill(c.pos)}</td>
      <td>\${c.coordinator || '<span style="opacity:.5">&mdash;</span>'}</td>
      <td>\${conjunctionTypePill(c.conjunction_type)}</td>
    </tr>\`;
}

function renderCoordinations() {
  const rows = filteredCoordinations();
  const body = document.getElementById("coordinations-body");
  document.getElementById("coordinations-empty").style.display = rows.length ? "none" : "block";
  const note = document.getElementById("coordinations-note");
  note.textContent = rows.length === COORDINATIONS.length
    ? \`\${rows.length} coordination\${rows.length === 1 ? '' : 's'}\`
    : \`Showing \${rows.length} of \${COORDINATIONS.length} coordinations\`;
  body.innerHTML = rows.map(coordinationRowHtml).join('');
}
`;
