// terrain.js — heightfield archipelago. Seeded island blobs over a teal sea,
// plus a runway strip at the start of the course and one at the end. The
// chase camera projects these into 2D; the height function also decides
// whether a low pass ends in the water or the ridge.

import { makeRng } from './random.js';

export function buildTerrain(seed, venue) {
  const rng = makeRng(seed);
  const islands = [];
  // A dozen islands scattered off the course line, a few near it for the
  // low passes to thread. Heights in metres, radii in metres.
  for (let i = 0; i < 14; i++) {
    const side = rng.pick([-1, 1]);
    const x = side * rng.range(120, 900) + rng.range(-40, 40);
    const z = rng.range(-300, 4400);
    islands.push({
      x, z,
      r: rng.range(90, 320),
      h: rng.range(28, 150),
      green: rng.range(0.4, 1),
      peak: rng.next() < 0.4,
    });
  }
  // The home island under the start strip, and the capital island at the end.
  islands.push({ x: -40, z: 60, r: 420, h: 60, green: 0.8, peak: false });
  islands.push({ x: 120, z: 4300, r: 520, h: 90, green: 0.7, peak: true });
  // Volcano venue gets a cone on the course line.
  if (venue.id === 'merapi') {
    islands.push({ x: 260, z: 2100, r: 380, h: 320, green: 0.25, peak: true, volcano: true });
  }
  // Canyon venue gets two walls hemming the course in.
  if (venue.id === 'senja') {
    islands.push({ x: -320, z: 1800, r: 300, h: 260, green: 0.45, peak: true });
    islands.push({ x: 330, z: 2400, r: 300, h: 240, green: 0.45, peak: true });
  }

  const runways = [
    { x: 0, z: 0, len: 260, w: 26, name: 'STRIP' },
    { x: 60, z: 4200, len: 300, w: 30, name: 'STRIP' },
  ];

  function heightAt(x, z) {
    let h = 0;
    for (const isl of islands) {
      const dx = x - isl.x;
      const dz = z - isl.z;
      const d2 = dx * dx + dz * dz;
      const r2 = isl.r * isl.r;
      if (d2 < r2 * 2.2) {
        const fall = Math.exp(-d2 / (r2 * 0.55));
        h += isl.h * fall;
      }
    }
    return h;
  }

  return { islands, runways, heightAt, seed };
}

// The nearest runway strip to a point — the landing check reads this.
export function nearestRunway(terrain, x, z) {
  let best = null;
  let bestD = Infinity;
  for (const rw of terrain.runways) {
    const dz = Math.max(0, Math.abs(z - (rw.z + rw.len / 2)) - rw.len / 2);
    const d = Math.hypot(x - rw.x, dz);
    if (d < bestD) {
      bestD = d;
      best = rw;
    }
  }
  return { runway: best, distance: bestD };
}
