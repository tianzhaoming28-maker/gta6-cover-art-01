# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/tianzhaoming28-maker/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/tianzhaoming28-maker/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Cover Studio turns your own photos and a caption into multi-panel poster
cover art: angled GTA-style panels, a Vice City sunset or neon colour
grade, and bold outlined display lettering — exported as a PNG in the
common post sizes **1080 × 1080**, **1080 × 1350** and **1920 × 1080**.

It is an original design: no Rockstar logos, artwork or fonts. Photos are
read on your own machine and never uploaded; the app is plain static
files and works fully offline.

## What it does

- **Four multi-panel layouts** — Poster Five, Lean Four, Strip Trio and
  Hero Duo — with slanted shared edges and bright panel separators.
- **Any photos, any panel** — add several photos by file picker or drag &
  drop, click a panel to select it, click a photo to place it, drag the
  photo inside its panel to reframe, and zoom per panel. One photo can
  fill every panel, or several photos can be spread across them.
- **Five colour grades** — Vice Sunset, Neon Night, Golden Hour, Noir
  Rain and Clean Pop — each a photo filter plus a unifying wash and
  vignette, applied live.
- **Caption editor** — a big outlined title, an accent subtitle bar and a
  letter-spaced kicker, placed at the foot or the head of the cover.
- **One-click export** — the preview and the exported PNG are the same
  drawing at different resolutions, so what you see is the file you get.
- Two AI-generated sample scenes (pier, boulevard) are built in so the
  app can be tried with no photos at hand.

## Run it

Serve the `app/` folder with any static file server and open it in a
desktop browser, for example:

```sh
cd app && python3 -m http.server 8080
# then open http://localhost:8080
```

No build step, no network requests, no dependencies.

## How this entry is packaged

`main.ts` (Node 22, standard library only) hands the entry in: it copies
the app's text files to `/output` (`MAKEFUN_OUTPUT_DIR` overrides the
destination locally), materialises the binary payloads — the sample
photos and the screenshots, carried in the repo as single-line base64 in
`samples-data.ts` / `screenshots-data.ts`, packed by `tools/pack.mjs`
from the gitignored `assets-src/` and `screenshots-src/` folders — and
writes `/output/dossier.json` with the vendored `vendor/makefun-app.ts`
library.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots: `1-cover-wide.jpg` (an exported 1920 × 1080 cover, shown at
1280 × 720), `2-editor.jpg` (the editor with photos loaded),
`3-cover-portrait.jpg` (1080 × 1350, shown at 1024 × 1280) and
`4-cover-square.jpg` (1080 × 1080) — all drawn by the app itself from the
bundled sample photos.

## License

MIT — see `LICENSE`.

---

Built for the [make.fun](https://make.fun/bounty/gta6-cover-art-01)
gta6-cover-art-01 bounty · Owner: tianzhaoming28-maker ·
[Join make.fun with referral qn2pqd71](https://make.fun/r/qn2pqd71)

---

<sub>Entered on [make.fun](https://make.fun/?ref=qn2pqd71&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
