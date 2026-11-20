// Panel layouts for the cover maker. Each layout is a set of polygons in
// normalised canvas coordinates (0..1 on both axes). Panels are drawn in
// order, clipped to their polygon, and finished with a bright separator
// stroke — the angled multi-panel poster look this app is built around.
// The polygons deliberately lean: slanted shared edges read as motion and
// keep the collage from looking like a plain grid.

/** One panel: a polygon plus a label the editor shows in its panel list. */
function panel(label, points) {
  return { label, points };
}

export const LAYOUTS = [
  {
    id: 'poster-five',
    name: 'Poster Five',
    blurb: 'Wide hero scene over a split middle and a two-shot foot.',
    panels: [
      panel('Hero scene', [[0, 0], [1, 0], [1, 0.52], [0, 0.60]]),
      panel('Middle left', [[0, 0.60], [0.52, 0.545], [0.50, 0.80], [0, 0.82]]),
      panel('Middle right', [[0.52, 0.545], [1, 0.52], [1, 0.80], [0.50, 0.80]]),
      panel('Foot left', [[0, 0.82], [0.50, 0.80], [0.50, 1], [0, 1]]),
      panel('Foot right', [[0.50, 0.80], [1, 0.80], [1, 1], [0.50, 1]]),
    ],
  },
  {
    id: 'lean-four',
    name: 'Lean Four',
    blurb: 'One tall leaning portrait beside a stacked trio.',
    panels: [
      panel('Tall portrait', [[0, 0], [0.45, 0], [0.38, 1], [0, 1]]),
      panel('Top wide', [[0.45, 0], [1, 0], [1, 0.48], [0.418, 0.48]]),
      panel('Lower left', [[0.418, 0.48], [0.72, 0.48], [0.70, 1], [0.38, 1]]),
      panel('Lower right', [[0.72, 0.48], [1, 0.48], [1, 1], [0.70, 1]]),
    ],
  },
  {
    id: 'strip-trio',
    name: 'Strip Trio',
    blurb: 'Three angled vertical strips over a full-width banner.',
    panels: [
      panel('Strip one', [[0, 0], [0.36, 0], [0.30, 0.78], [0, 0.78]]),
      panel('Strip two', [[0.36, 0], [0.68, 0], [0.64, 0.78], [0.30, 0.78]]),
      panel('Strip three', [[0.68, 0], [1, 0], [1, 0.78], [0.64, 0.78]]),
      panel('Banner', [[0, 0.78], [1, 0.78], [1, 1], [0, 1]]),
    ],
  },
  {
    id: 'hero-duo',
    name: 'Hero Duo',
    blurb: 'A dominant hero panel with two supporting frames.',
    panels: [
      panel('Hero portrait', [[0, 0], [0.58, 0], [0.52, 1], [0, 1]]),
      panel('Upper support', [[0.58, 0], [1, 0], [1, 0.52], [0.548, 0.52]]),
      panel('Lower support', [[0.548, 0.52], [1, 0.52], [1, 1], [0.52, 1]]),
    ],
  },
];

/** Looks up a layout by id, falling back to the first layout. */
export function layoutById(id) {
  return LAYOUTS.find((layout) => layout.id === id) ?? LAYOUTS[0];
}

/** The axis-aligned bounding box of a polygon, in normalised coordinates. */
export function panelBounds(points) {
  let minX = 1; let minY = 1; let maxX = 0; let maxY = 0;
  for (const [x, y] of points) {
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/** Even-odd point-in-polygon test used when the editor picks a panel by click. */
export function pointInPanel(points, x, y) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const crosses = (yi > y) !== (yj > y);
    const atX = ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses && x < atX) inside = !inside;
  }
  return inside;
}
