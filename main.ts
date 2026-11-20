// Cover Studio — the hand-in program for gta6-cover-art-01 (Node 22,
// standard library only). The app under app/ is plain static files; its two
// sample photos and the screenshots travel through the repository as
// base64 payloads (screenshots-data.ts, samples-data.ts, packed by
// tools/pack.mjs from the gitignored *-src folders) so every byte of the
// entry is visible in the commit. This program copies the app's text files
// to /output, materialises the binary payloads beside them and into
// /output/screenshots/, then writes /output/dossier.json with the vendored
// make.fun library, byte for byte as the scorer rebuilds it.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';
import { SCREENSHOT_FILES } from './screenshots-data.ts';
import { SAMPLE_FILES } from './samples-data.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Extensions that travel as payloads instead of plain copied files. */
const BINARY_EXT = /\.(?:png|jpe?g|gif|webp)$/i;

/** Copies a directory tree, skipping binary files (payloads provide them). */
function copyTextTree(from, to) {
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    const src = join(from, name);
    const dst = join(to, name);
    if (statSync(src).isDirectory()) copyTextTree(src, dst);
    else if (!BINARY_EXT.test(name)) cpSync(src, dst);
  }
}

/** Decodes one payload list into a directory under the output. */
function materialise(rows: readonly { name: string; base64: string }[], dir: string) {
  mkdirSync(dir, { recursive: true });
  for (const row of rows) {
    writeFileSync(join(dir, row.name), Buffer.from(row.base64, 'base64'));
  }
}

mkdirSync(out, { recursive: true });
copyTextTree(join(here, 'app'), join(out, 'app'));
materialise(SAMPLE_FILES, join(out, 'app', 'samples'));
materialise(SCREENSHOT_FILES, join(out, 'screenshots'));

// A stale screenshots folder copied by an earlier local run must not leak
// extra images into the dossier: the payload list is the whole truth.
if (existsSync(join(here, 'screenshots'))) {
  // Intentionally ignored — screenshots come from screenshots-data.ts only.
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
console.log(`wrote ${out}/app, ${out}/screenshots (${SCREENSHOT_FILES.length} images), ${out}/dossier.json`);
