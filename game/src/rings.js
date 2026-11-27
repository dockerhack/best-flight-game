// rings.js — gate rings in 3D space. A ring is a circle in the X-Y plane
// at a fixed z; projected, it reads as an ellipse the plane is about to
// fly through. The next ring is gold and pulses; later rings are white;
// passed rings flash green.
function drawRings(ctx, cam) {
  const rings = Game.rings;
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    const c = project(r, cam);
    if (!c) continue;
    const rx = project({ x: r.x + r.r, y: r.y, z: r.z }, cam);
    const ry = project({ x: r.x, y: r.y + r.r, z: r.z }, cam);
    if (!rx || !ry) continue;
    const w = Math.abs(rx.x - c.x);
    const h = Math.abs(ry.y - c.y);
    if (w < 2 || h < 2) continue;
    const isNext = i === Game.ringIdx;
    let color = 'rgba(255,255,255,0.85)';
    let lw = clamp(2.2 * c.s, 1.5, 7);
    if (r.passed) { color = '#37e08a'; }
    else if (isNext) {
      color = '#ffd23f';
      lw = clamp((2.6 + Math.sin(Game.time * 5) * 0.9) * c.s, 2, 9);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, w, h, 0, 0, TAU);
    ctx.stroke();
    // Inner glow ring for the next gate.
    if (isNext) {
      ctx.strokeStyle = 'rgba(255,210,63,0.35)';
      ctx.lineWidth = lw * 2.4;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, w, h, 0, 0, TAU);
      ctx.stroke();
      // Distance tag below the ring (never over the aircraft, the
      // banner, or the smoke).
      ctx.fillStyle = '#ffd23f';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const dz = Math.max(0, r.z - Game.plane.z);
      ctx.fillText(Math.round(dz) + ' m', c.x, c.y + h + 22);
    }
  }
}
