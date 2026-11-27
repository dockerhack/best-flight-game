// util.js — small math helpers shared by every module. No dependencies.
const TAU = Math.PI * 2;

function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
function lerp(a, b, t) { return a + (b - a) * t; }
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

// Wrap an angle to [-PI, PI].
function normAngle(a) {
  while (a > Math.PI) a -= TAU;
  while (a < -Math.PI) a += TAU;
  return a;
}

// Deterministic seeded RNG (mulberry32) so rival scores and venue
// details are stable run to run.
function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted(rng, items) {
  let total = 0;
  for (const it of items) total += it.w || 1;
  let r = rng() * total;
  for (const it of items) { r -= it.w || 1; if (r <= 0) return it; }
  return items[items.length - 1];
}

// Format helpers for the HUD.
function fmtKts(v) { return Math.round(v) + ' kt'; }
function fmtAlt(v) { return Math.round(v) + ' m'; }
function fmtHdg(v) {
  let d = Math.round(v * 180 / Math.PI);
  d = ((d % 360) + 360) % 360;
  return String(d).padStart(3, '0') + '°';
}
