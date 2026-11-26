// figures.js — figure definitions, gate-window detection and judging.
// A figure is scored when the plane crosses its gate ring: the judges look
// at the speed window, the bank, whether the manoeuvre was actually flown,
// and whether the smoke was on. Three judges score 0–10 each.

import { CFG } from './config.js';

// What the plane did since the last gate, in the detector's terms.
export function maneuverOf(p) {
  const pitchDeg = Math.abs(p.pitchTotal);
  const rollDeg = Math.abs(p.rollTotal);
  if (pitchDeg >= rollDeg && pitchDeg > 60) return { kind: 'pitch', deg: pitchDeg };
  if (rollDeg > 60) return { kind: 'roll', deg: rollDeg };
  return { kind: 'none', deg: Math.max(pitchDeg, rollDeg) };
}

// Score one figure. m is maneuverOf(p); speed is the entry speed in m/s.
// Returns { scores: [j1, j2, j3], total, verdict, callout }.
export function scoreFigure(fig, p, m, rng) {
  // Speeds are m/s throughout: the plane flies 26–128 m/s, the figure
  // windows in config.js are m/s too.
  const speedMin = fig.speedMin;
  const speedMax = fig.speedMax;
  let base = 6.4;

  // Speed window: inside it is clean, outside it costs.
  if (p.speed >= speedMin && p.speed <= speedMax) base += 1.1;
  else if (p.speed < speedMin * 0.8 || p.speed > speedMax * 1.15) base -= 1.6;
  else base -= 0.6;

  // The manoeuvre itself: flew the rotation, or just drifted through?
  const done = m.kind === fig.kind && m.deg >= fig.need * 0.85;
  const half = m.kind === fig.kind && m.deg >= fig.need * 0.45;
  if (done) base += 1.6;
  else if (half) base += 0.4;
  else base -= 1.4;

  // Bank discipline: too steep through a pitch figure reads as sloppy.
  if (fig.kind === 'pitch' && p.maxBank > fig.bankMax + 0.5) base -= 0.9;

  // Smoke on while the figure is flown: the line is the evidence.
  if (p.smokeOn && p.smokeFluid > 1) base += 0.5;

  base = Math.max(2.0, Math.min(10, base));
  const scores = [0, 1, 2].map(() => {
    const s = base + rng.wobble() * 0.55;
    return Math.max(0, Math.min(10, Math.round(s * 10) / 10));
  });
  const total = scores[0] + scores[1] + scores[2];
  const avg = total / 3;
  let verdict = 'SLOPPY';
  let callout = fig.name.toUpperCase() + ' — MESSY';
  if (avg >= 9.2) { verdict = 'PERFECT'; callout = 'PERFECT ' + fig.name.toUpperCase() + '!'; }
  else if (avg >= 8.2) { verdict = 'CLEAN'; callout = fig.name.toUpperCase() + ' CLEAN!'; }
  else if (avg >= 7.0) { verdict = 'DECENT'; callout = fig.name.toUpperCase() + ' — DECENT'; }
  else if (avg >= 5.5) { verdict = 'WIDE'; callout = fig.name.toUpperCase() + ' — WIDE'; }
  return { scores, total: Math.round(total * 10) / 10, verdict, callout, avg: Math.round(avg * 10) / 10 };
}

// Landing verdict from the touchdown state.
export function landingVerdict(p, onRunway) {
  if (!onRunway) return { verdict: 'CRASH', text: 'INTO THE RIDGE!', stars: 0 };
  const vs = Math.abs(p.vspeed);
  if (p.speed <= CFG.landingSpeedMax && vs < 3.5) {
    return { verdict: 'GREASED', text: 'GREASED IT!', stars: 1 };
  }
  if (p.speed <= CFG.landingSpeedMax + 18 && vs < 6) {
    return { verdict: 'BOUNCED', text: 'BOUNCED — but down!', stars: 0 };
  }
  return { verdict: 'HARD', text: 'HARD LANDING!', stars: 0 };
}
