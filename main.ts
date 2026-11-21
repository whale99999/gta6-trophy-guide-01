// Leonida Platinum — GTA VI trophy guide & tracker (Node 22, standard library only).
// The guide is this directory's app/ folder: plain static files a browser opens at
// app/index.html (ES modules, CSS, no build step), fully offline — it loads nothing
// over the network, and its trophy list and guides live in app/data/trophies.json.
// This program hands it in: it copies app/ and screenshots/ from beside this file
// to /output and writes /output/dossier.json, the summary the judge reads (your
// screenshots, the first load's files and bytes, and your source), with the vendored
// make.fun library. Leave vendor/makefun-frontend.ts as it is: the scorer requires
// dossier.json to be byte for byte what its own copy of that library writes.
// Verification first: the trophy file must parse with all 55 guides, and
// screenshots/ must hold 3 or 4 images — a failed verification stops the run.
//
// Before copying, it verifies the two things the gate checks first: the trophy file
// parses and names all 55 official trophies with a guide each, and screenshots/
// holds 3 or 4 images. A failed verification stops the run with a plain error.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const EXPECTED_TROPHIES = 55;

function verifyEntry() {
  const trophyPath = join(here, 'app', 'data', 'trophies.json');
  if (!existsSync(trophyPath)) throw new Error('missing app/data/trophies.json');
  const data = JSON.parse(readFileSync(trophyPath, 'utf8'));
  const trophies = Array.isArray(data) ? data : data.trophies;
  if (!Array.isArray(trophies) || trophies.length !== EXPECTED_TROPHIES) {
    throw new Error(`expected ${EXPECTED_TROPHIES} trophies, found ${Array.isArray(trophies) ? trophies.length : 'none'}`);
  }
  for (const trophy of trophies) {
    if (!trophy.name || typeof trophy.guide !== 'string' || !trophy.guide.trim()) {
      throw new Error(`trophy ${trophy.id ?? '?'} (${trophy.name ?? 'unnamed'}) has no guide`);
    }
  }
  const shotsDir = join(here, 'screenshots');
  if (!existsSync(shotsDir)) throw new Error('missing screenshots/');
  const shots = readdirSync(shotsDir).filter((name) => !name.startsWith('.'));
  if (shots.length < 3 || shots.length > 4) {
    throw new Error(`expected 3 or 4 screenshots, found ${shots.length}`);
  }
}

verifyEntry();

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
