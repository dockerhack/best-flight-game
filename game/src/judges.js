// judges.js — the three judges and their per-figure scores. Pak Darma
// scores the line, Bu Lestari scores the grace, Koh Hendra scores the nerve:
// the same figure reads slightly differently to each, which is why the
// results screen shows all three numbers, not one.

import { JUDGES } from './config.js';

export const JUDGE_NAMES = JUDGES;

// Three scores for one figure, centred on base with a seeded wobble.
export function judgeScores(base, rng) {
  return JUDGE_NAMES.map(() => {
    const s = base + rng.wobble() * 0.55;
    return Math.max(0, Math.min(10, Math.round(s * 10) / 10));
  });
}

// The verdict line the judges give the whole venue.
export function venueVerdict(avg) {
  if (avg >= 9.0) return 'A routine the circuit will talk about for years.';
  if (avg >= 8.0) return 'Clean, brave, and the crowd is on its feet.';
  if (avg >= 7.0) return 'Solid flying — the judges want more nerve next time.';
  if (avg >= 5.5) return 'Ragged in places, but the line was there.';
  return 'The judges saw the effort. The smoke hid the rest.';
}

export const JUDGE_COUNT = JUDGES.length;

// Mean of one figure's three scores.
export function averageScore(scores) {
  return scores.reduce((a, s) => a + s, 0) / scores.length;
}
