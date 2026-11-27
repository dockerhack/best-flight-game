// runway.js — the runway strip. It runs the whole course at the venue's
// runway x so a strip is visible in every shot, with centreline dashes
// and threshold bars at the landing target during the landing phase.
// At night and dusk the edges are lit.
function drawRunway(ctx, cam, v) {
  const rx = v.runway.x;
  const half = 10;
  // Near end clamped just ahead of the camera: a near corner behind the
  // camera must not blank the whole strip.
  const z0 = cam.z + 8;
  const z1 = cam.z + 1700;
  const a = project({ x: rx - half, y: 0.4, z: z0 }, cam);
  const b = project({ x: rx + half, y: 0.4, z: z0 }, cam);
  const c = project({ x: rx + half, y: 0.4, z: z1 }, cam);
  const d = project({ x: rx - half, y: 0.4, z: z1 }, cam);
  if (!a || !b || !c || !d) return;
  ctx.fillStyle = v.runway.surface;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y);
  ctx.closePath();
  ctx.fill();
  // Edge lines.
  ctx.strokeStyle = v.runway.edge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y); ctx.lineTo(d.x, d.y);
  ctx.moveTo(b.x, b.y); ctx.lineTo(c.x, c.y);
  ctx.stroke();
  // Centreline dashes every 45 m.
  ctx.fillStyle = v.runway.edge;
  for (let z = Math.floor(cam.z / 45) * 45; z < z1; z += 45) {
    const p1 = project({ x: rx - 1.2, y: 0.5, z: z }, cam);
    const p2 = project({ x: rx + 1.2, y: 0.5, z: z }, cam);
    const p3 = project({ x: rx + 1.2, y: 0.5, z: z + 16 }, cam);
    const p4 = project({ x: rx - 1.2, y: 0.5, z: z + 16 }, cam);
    if (!p1 || !p2 || !p3 || !p4) continue;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
    ctx.closePath();
    ctx.fill();
  }
  // Threshold bars at the landing target (or the nearest 1500 m mark).
  const tz = Game.phase === 'landing' && Game.landing ? Game.landing.z
    : Math.floor((cam.z + 900) / 1500) * 1500;
  for (const off of [-5, -2, 2, 5]) {
    const p1 = project({ x: rx + off - 1.6, y: 0.5, z: tz }, cam);
    const p2 = project({ x: rx + off + 1.6, y: 0.5, z: tz }, cam);
    const p3 = project({ x: rx + off + 1.6, y: 0.5, z: tz + 12 }, cam);
    const p4 = project({ x: rx + off - 1.6, y: 0.5, z: tz + 12 }, cam);
    if (!p1 || !p2 || !p3 || !p4) continue;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
    ctx.closePath();
    ctx.fill();
  }
  // Edge lights at night / dusk.
  if (v.time === 'night' || v.time === 'dusk') {
    for (let z = Math.floor(cam.z / 60) * 60; z < z1; z += 60) {
      for (const side of [-1, 1]) {
        const pl = project({ x: rx + side * half, y: 1, z: z }, cam);
        if (!pl) continue;
        ctx.fillStyle = '#9fd8ff';
        ctx.beginPath();
        ctx.arc(pl.x, pl.y, Math.max(1.5, 2.2 * pl.s), 0, TAU);
        ctx.fill();
      }
    }
  }
}
