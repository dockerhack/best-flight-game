// main.ts — the entrypoint the grader runs (node22 main.ts).
// It stages this repository's playable game and its screenshots into the
// grader's output directory and writes the dossier the scorer rebuilds
// from the same files. The scorer requires the two dossiers to be
// byte-for-byte identical, so this file does the staging exactly once,
// from the committed files, and nothing else.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Where the staged entry goes: the grader's directory, or /output locally.
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
// The repository root: the directory this file lives in.
const repoRoot = dirname(fileURLToPath(import.meta.url));

const gameEntry = join(repoRoot, 'game', 'index.html');
const shotsDir = join(repoRoot, 'screenshots');

// Refuse to hand in half an entry: check first, copy nothing yet.
if (!existsSync(gameEntry)) {
  throw new Error('game/index.html is missing — the game is not complete');
}
if (!existsSync(shotsDir)) {
  throw new Error('screenshots/ is missing — render the shots first');
}

// Stage a clean copy: drop whatever a previous run left behind.
mkdirSync(outDir, { recursive: true });
rmSync(join(outDir, 'game'), { recursive: true, force: true });
rmSync(join(outDir, 'screenshots'), { recursive: true, force: true });
rmSync(join(outDir, 'dossier.json'), { force: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

// The dossier of the staged entry, under the competition's caps.
// These numbers are the competition gate's own caps, so the dossier this
// program writes is the one the scorer rebuilds from the same staged files.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

// A zero-byte dossier would hand in nothing while looking like a success.
if (dossier.length === 0) {
  throw new Error('buildDossier returned an empty dossier — nothing to hand in');
}

const dossierPath = join(outDir, 'dossier.json');
writeFileSync(dossierPath, dossier);
console.log(`wrote ${dossierPath} (${dossier.length} bytes)`);
