// rivals.js — the three rival pilots and the running rivalry score.
// Elang is precise, Sari is wild, Bimo is fearless and sloppy: their
// per-venue scores swing around their skill, and the standings table on the
// results screen is the championship the player is chasing.

import { RIVALS } from './config.js';

export function newRivalState() {
  const totals = {};
  for (const r of RIVALS) totals[r.id] = 0;
  return { totals, venueScores: [], playerTotal: 0 };
}

// One venue's rival scores: skill plus a seeded swing, so the same venue
// never repeats the same table.
export function rivalVenueScores(rng) {
  return RIVALS.map((r) => {
    const s = r.skill + rng.wobble() * r.swing;
    return { id: r.id, name: r.name, score: Math.round(Math.max(0, Math.min(10, s)) * 10) / 10 };
  });
}

export function recordVenueRivals(state, venueScores, playerAvg) {
  state.venueScores.push(venueScores);
  for (const s of venueScores) state.totals[s.id] += s.score;
  state.playerTotal += playerAvg;
}

// Standings table, best first, with the player slotted in.
export function standings(state) {
  const rows = RIVALS.map((r) => ({
    name: r.name, tag: r.tag, total: Math.round(state.totals[r.id] * 10) / 10, you: false, color: r.color,
  }));
  rows.push({ name: 'YOU', tag: 'the challenger', total: Math.round(state.playerTotal * 10) / 10, you: true, color: '#ffd23f' });
  rows.sort((a, b) => b.total - a.total);
  return rows;
}

export function playerRank(state) {
  const rows = standings(state);
  return rows.findIndex((r) => r.you) + 1;
}

export function rivalById(id) {
  return RIVALS.find((r) => r.id === id) || RIVALS[0];
}
