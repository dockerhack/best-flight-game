// smoke.js — the smoke ribbon. Every frame the plane flies with smoke on,
// its position is recorded; the ribbon is drawn as a continuous stroked
// path through the trail points (oldest to newest), widening and fading
// as the smoke ages. It is the brightest thing in the frame and the
// visible proof of the figure just flown: a loop draws a loop, a Cuban
// eight draws an eight. Fresh smoke also puffs off the wingtips
// (drawn in plane.js) so straight flight still shows smoke.
const TRAIL_MAX = 420;

function pushTrail() {
  const p = Game.plane;
  if (!Game.smokeOn || !p.airborne || p.speed < 40) return;
  if (Game.smokeFluid <= 0) return;
  Game.trail.push({ x: p.x, y: p.y, z: p.z, color: Game.smokeColor, t: Game.time });
  if (Game.trail.length > TRAIL_MAX) Game.trail.shift();
}

function smokeColorAt(color, i, n) {
  if (color === 'rainbow') {
    const hue = (i / n) * 360;
    return 'hsl(' + Math.round(hue) + ', 95%, 62%)';
  }
  return SMOKE_COLORS[color] || SMOKE_COLORS.gold;
}

function drawSmoke(ctx, cam) {
  const trail = Game.trail;
  const n = trail.length;
  if (n < 2) return;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Two passes: a wide soft outer ribbon, then a bright core.
  for (const pass of [0, 1]) {
    for (let i = 0; i < n - 1; i++) {
      const a = trail[i], b = trail[i + 1];
      const pa = project(a, cam), pb = project(b, cam);
      if (!pa || !pb) continue;
      // Skip segments hugging the camera (they blow up in perspective).
      if (pa.z < 6 || pb.z < 6) continue;
      const age = i / n; // 0 = oldest, 1 = newest
      const s = clamp((pa.s + pb.s) / 2, 0.3, 2.0);
      const base = pass === 0
        ? (7 + (1 - age) * 12) * s
        : (3 + (1 - age) * 5) * s;
      ctx.strokeStyle = pass === 0
        ? smokeColorAt(a.color, i, n)
        : '#ffffff';
      ctx.globalAlpha = pass === 0 ? 0.30 + 0.55 * age : 0.25 + 0.55 * age;
      ctx.lineWidth = Math.max(1.5, base);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}
