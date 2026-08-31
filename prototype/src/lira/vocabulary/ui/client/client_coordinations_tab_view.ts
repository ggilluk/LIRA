/** The Coordinations tab's own filtering and row rendering --
 * client_phrases_tab_view.ts's own leaner counterpart: Coordination is
 * seeded from a small, closed, hand-curated set today
 * (word_coordination_seeder.ts's own docstring), nowhere near WordNet
 * scale, so there's no over-capacity search dispatch/debounce here at
 * all -- COORDINATIONS is always the full, real list, filtered
 * entirely client-side, the same way every tab worked before
 * MAX_INTERACTIVE_WORDS-scale data existed. No detail panel either:
 * a Coordination carries no relationships/sense/definition of its own
 * for one to show (builder_coordination.ts's own docstring). */
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

// "salt and pepper" (two coordinates) / "red, white, and blue" (three
// or more, Oxford-comma style) -- Coordination.coordinates's own
// docstring on why this reads as one flat list rather than a nested
// binary tree. Falls back to "and" for the vanishingly rare case
// c.coordinator itself is undefined (an asyndetic Coordination,
// Coordination.coordinator's own docstring) -- no real seeded entry
// today actually omits it, but the join still needs some conjunction
// to display.
function coordinatesText(c) {
  const conj = c.coordinator || "and";
  if (c.coordinates.length <= 1) return c.coordinates.join(", ");
  if (c.coordinates.length === 2) return c.coordinates.join(\` \${conj} \`);
  return c.coordinates.slice(0, -1).join(", ") + \`, \${conj} \` + c.coordinates[c.coordinates.length - 1];
}

function coordinationRowHtml(c) {
  return \`
    <tr>
      <td>\${coordinatesText(c)}</td>
      <td>\${posPill(c.pos)}</td>
      <td>\${c.coordinator || '<span style="opacity:.5">&mdash;</span>'}</td>
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
