// Fixed scenes for screenshots, driven by the page query string:
//   ?shot=cover   — the cover alone, filling the window at export size
//   ?shot=editor  — the full editor with sample photos loaded
// Scene parameters: layout, grade, size (e.g. 1080x1350), photos (comma
// list of sample names), title, subtitle, kicker, captionAt.
// window.__shotReady flips true once the scene has painted twice.

/** Parses a "1080x1350" style size, defaulting to a square. */
export function parseShotSize(raw) {
  const match = /^(\d+)x(\d+)$/.exec(raw ?? '');
  if (!match) return [1080, 1080];
  return [Number(match[1]), Number(match[2])];
}

/** Builds the scene described by the query and hands it to the editor's
 *  `apply` callback, which loads the photos and repaints. */
export async function runShot(query, apply) {
  const shot = query.get('shot');
  if (!shot) return false;
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photos = (query.get('photos') ?? 'pier')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  await apply({
    layoutId: query.get('layout') ?? undefined,
    gradeId: query.get('grade') ?? undefined,
    size: parseShotSize(query.get('size')),
    photoNames: photos,
    title: query.get('title') ?? undefined,
    subtitle: query.get('subtitle') ?? undefined,
    kicker: query.get('kicker') ?? undefined,
    captionAt: query.get('captionAt') ?? undefined,
  });
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
  return true;
}
