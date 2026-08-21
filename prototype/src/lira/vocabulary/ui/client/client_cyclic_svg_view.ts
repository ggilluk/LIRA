/** Verbatim slice of the embedded client script (original dictionary_view.ts
 * lines 4759-4844) -- clusterGraphSVG: SVG generation from layout data. */
export const CLIENT_CYCLIC_SVG_VIEW = `function clusterGraphSVG(group, wordById, kind) {
  const lineHeight = 15;
  const boxDims = new Map();
  group.clusters.forEach(c => {
    const labels = c.wordIds.map(id => wordById.get(id).lexical_form);
    const width = Math.max(64, Math.max(...labels.map(l => l.length)) * 7.2 + 24);
    const height = c.wordIds.length * lineHeight + 14;
    boxDims.set(c.id, { width, height });
  });

  const level = boxLevels(group.clusters, group.edges, kind);
  const maxLevel = Math.max(...group.clusters.map(c => level.get(c.id)));
  const byLevel = [];
  for (let i = 0; i <= maxLevel; i++) byLevel.push([]);
  group.clusters.forEach(c => byLevel[level.get(c.id)].push(c));
  byLevel.forEach(list => list.sort((a, b) => wordById.get(a.wordIds[0]).lexical_form.localeCompare(wordById.get(b.wordIds[0]).lexical_form)));
  const orderedByLevel = reduceCrossings(byLevel, group.edges);

  const rowGap = 22;
  const marginX = 40, marginY = 30;
  const maxBoxWidth = Math.max(...group.clusters.map(c => boxDims.get(c.id).width));
  const columnStep = maxBoxWidth + 100;
  const colHeights = orderedByLevel.map(list => list.reduce((s, c) => s + boxDims.get(c.id).height, 0) + rowGap * Math.max(0, list.length - 1));
  const maxColHeight = Math.max(...colHeights);
  const width = marginX * 2 + maxBoxWidth + maxLevel * columnStep;
  const height = marginY * 2 + maxColHeight;

  const boxPos = new Map();
  const wordPos = new Map();
  orderedByLevel.forEach((list, lvl) => {
    let y = marginY + (maxColHeight - colHeights[lvl]) / 2;
    const x = marginX + maxBoxWidth / 2 + lvl * columnStep;
    list.forEach(c => {
      const d = boxDims.get(c.id);
      const pos = { x, y: y + d.height / 2 };
      boxPos.set(c.id, pos);
      c.wordIds.forEach((wid, idx) => {
        wordPos.set(wid, { x: pos.x, y: pos.y - d.height / 2 + 12 + idx * lineHeight });
      });
      y += d.height + rowGap;
    });
  });

  const edgeKeys = new Set(group.edges.map(r => \`\${r.source_id}|\${r.target_id}\`));
  const drawn = new Set();
  let linesHTML = "";
  group.edges.forEach(r => {
    const key = \`\${r.source_id}|\${r.target_id}\`;
    const revKey = \`\${r.target_id}|\${r.source_id}\`;
    if (drawn.has(key) || drawn.has(revKey)) return;
    drawn.add(key);
    const p1 = wordPos.get(r.source_id), p2 = wordPos.get(r.target_id);
    if (!p1 || !p2) return;
    const bidirectional = edgeKeys.has(revKey);
    linesHTML += \`<line x1="\${p1.x.toFixed(1)}" y1="\${p1.y.toFixed(1)}" x2="\${p2.x.toFixed(1)}" y2="\${p2.y.toFixed(1)}" class="cyclic-edge" marker-end="url(#cyclic-arrow)" \${bidirectional ? 'marker-start="url(#cyclic-arrow)"' : ''} />\`;
  });

  // Boxes drawn as a layer, word labels as the layer above -- so a
  // line's visible end sits right at the box edge (the box fill
  // occludes the segment inside it) while the label stays legible on top.
  let boxesHTML = "";
  let wordsHTML = "";
  group.clusters.forEach(c => {
    const pos = boxPos.get(c.id);
    const dims = boxDims.get(c.id);
    boxesHTML += \`<rect x="\${(pos.x - dims.width / 2).toFixed(1)}" y="\${(pos.y - dims.height / 2).toFixed(1)}" width="\${dims.width.toFixed(1)}" height="\${dims.height.toFixed(1)}" rx="6" class="cyclic-box" />\`;
    c.wordIds.forEach(wid => {
      const w = wordById.get(wid);
      const wp = wordPos.get(wid);
      const color = POS_COLORS[w.pos] || "#7A7A7A";
      // Highlights the shared selection's own node, if it's part of
      // this cluster graph -- selectWord()'s own docstring on why every
      // tab (including Cyclic) reflects the same selected word.
      const isSelected = wid === state.selectedWordId;
      wordsHTML += \`<g class="cyclic-node\${isSelected ? ' cyclic-node-selected' : ''}" data-pivot-id="\${wid}" tabindex="0" transform="translate(\${wp.x.toFixed(1)},\${wp.y.toFixed(1)})">\`
        + \`<circle r="4" fill="\${color}" cx="\${(-dims.width / 2 + 11).toFixed(1)}" />\`
        + \`<text x="\${(-dims.width / 2 + 19).toFixed(1)}" y="4" text-anchor="start">\${w.lexical_form}</text></g>\`;
    });
  });

  return \`<div class="cyclic-svg-wrap"><svg viewBox="0 0 \${width} \${height}" width="\${width}" height="\${height}" class="cyclic-graph">\`
    + \`<defs><marker id="cyclic-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">\`
    + \`<path d="M0,0 L10,5 L0,10 z" class="cyclic-arrow" /></marker></defs>\`
    + \`\${linesHTML}\${boxesHTML}\${wordsHTML}</svg></div>\`;
}
`;
