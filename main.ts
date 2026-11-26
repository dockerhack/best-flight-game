// main.ts — hands the game in. Copies game/ and screenshots/ from this
// repository to /output (MAKEFUN_OUTPUT_DIR outside the grader) and writes
// /output/dossier.json with buildDossier from vendor/makefun-game.ts, the
// kit's copy, unchanged. The scorer rebuilds the dossier the same way and
// requires the two to match byte for byte.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const out = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const here = dirname(fileURLToPath(import.meta.url));

// Fail loudly, before copying anything, when the entry is incomplete.
if (!existsSync(join(here, 'game', 'index.html'))) {
  throw new Error('game/index.html is missing — the entry is not complete');
}
if (!existsSync(join(here, 'screenshots'))) {
  throw new Error('screenshots/ is missing — take the 4 shots first');
}

mkdirSync(out, { recursive: true });
rmSync(join(out, 'game'), { recursive: true, force: true });
rmSync(join(out, 'screenshots'), { recursive: true, force: true });
rmSync(join(out, 'dossier.json'), { force: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);
console.log('wrote ' + join(out, 'dossier.json') + ' (' + dossier.length + ' bytes)');
