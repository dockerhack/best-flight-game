// particles.js — smoke puffs, sparks and spray. Small, cheap, and the only
// thing that makes an over-G strike or a water kiss read in a still frame.

export function newParticles() {
  return [];
}

export function burst(parts, p, kind, n) {
  for (let i = 0; i < n; i++) {
    parts.push({
      x: p.x + (Math.sin(i * 2.39) * 2),
      y: p.y + (Math.cos(i * 1.71) * 2),
      z: p.z + (Math.sin(i * 3.11) * 2),
      vx: Math.sin(i * 5.1) * 6,
      vy: Math.cos(i * 2.7) * 6,
      vz: Math.cos(i * 4.3) * 6,
      age: 0,
      life: kind === 'spark' ? 0.5 : 1.4,
      kind,
    });
  }
  if (parts.length > 240) parts.splice(0, parts.length - 240);
}

export function updateParticles(parts, dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const pt = parts[i];
    pt.age += dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.z += pt.vz * dt;
    pt.vy -= pt.kind === 'spray' ? 12 * dt : 2 * dt;
    if (pt.age > pt.life) parts.splice(i, 1);
  }
}

// One wingtip smoke puff, spawned where the trail leaves the wing.
export function puffAt(parts, p, color) {
  parts.push({
    x: p.x, y: p.y - 1.2, z: p.z,
    vx: 0, vy: 0.5, vz: -1,
    age: 0, life: 1.1, kind: 'puff', color: color || '#ffffff',
  });
  if (parts.length > 240) parts.splice(0, parts.length - 240);
}
