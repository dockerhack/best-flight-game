// terrain.js — recognisable terrain for the chase camera. Everything is
// drawn in world space and projected, so the ground, coast, volcano,
// canyon, harbour and runway all recede ahead of the aircraft. Flat
// coloured blobs are banned: every venue has a landmark you can name.
function drawSky(ctx, v) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H * 0.62);
  g.addColorStop(0, v.skyTop);
  g.addColorStop(0.55, v.skyMid);
  g.addColorStop(1, v.skyLow);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H * 0.62);
  // Sun / moon.
  const s = v.sun;
  const sx = s.x * VIEW_W, sy = s.y * VIEW_H;
  const glow = ctx.createRadialGradient(sx, sy, 4, sx, sy, s.r * 3.2);
  glow.addColorStop(0, s.glow);
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sx - s.r * 3.2, sy - s.r * 3.2, s.r * 6.4, s.r * 6.4);
  ctx.fillStyle = s.color;
  ctx.beginPath();
  ctx.arc(sx, sy, s.r, 0, TAU);
  ctx.fill();
}

function drawStars(ctx, seed) {
  const rng = mulberry32(seed);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 90; i++) {
    const x = rng() * VIEW_W;
    const y = rng() * VIEW_H * 0.3;
    const r = rng() * 1.6 + 0.4;
    ctx.fillRect(x, y, r, r);
  }
}

// The ground is split by a coastline: water on the far side, land on the
// near side, with a sand strip and breaking-wave foam along the line.
function drawGround(ctx, cam, v) {
  const p = Game.plane;
  const horizonY = cam.horizonY;
  // Coastline ahead: absolute z, period 1500 m, wavy in x.
  const coastBase = Math.floor((p.z + 500) / 1500) * 1500 + 350;
  const pts = [];
  for (let x = -700; x <= 700; x += 50) {
    const z = coastBase + 46 * Math.sin(x * 0.008 + coastBase * 0.01);
    const pr = project({ x: x, y: 0, z: Math.max(z, cam.z + 8) }, cam);
    if (pr) pts.push(pr);
  }
  // Water: horizon down to the coast.
  ctx.fillStyle = v.sea;
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  ctx.lineTo(VIEW_W, horizonY);
  if (pts.length) {
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x, pts[i].y);
  } else {
    ctx.lineTo(VIEW_W, VIEW_H);
    ctx.lineTo(0, VIEW_H);
  }
  ctx.closePath();
  ctx.fill();
  // Deep-water gradient near the horizon.
  const wg = ctx.createLinearGradient(0, horizonY, 0, horizonY + 120);
  wg.addColorStop(0, v.seaDeep);
  wg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = wg;
  ctx.fillRect(0, horizonY, VIEW_W, 120);

  // Land: coast down to the bottom of the screen.
  if (pts.length) {
    ctx.fillStyle = v.land;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (const q of pts) ctx.lineTo(q.x, q.y);
    ctx.lineTo(VIEW_W, VIEW_H);
    ctx.lineTo(0, VIEW_H);
    ctx.closePath();
    ctx.fill();
    // Sand strip just inland of the foam.
    ctx.fillStyle = v.sand;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (const q of pts) ctx.lineTo(q.x, q.y + 10);
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x, pts[i].y + 26);
    ctx.closePath();
    ctx.fill();
    // Breaking-wave foam: white dashes along the coast.
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i += 2) {
      const q = pts[i];
      ctx.moveTo(q.x - 14, q.y);
      ctx.lineTo(q.x + 14, q.y);
    }
    ctx.stroke();
  } else {
    ctx.fillStyle = v.land;
    ctx.fillRect(0, horizonY, VIEW_W, VIEW_H - horizonY);
  }
}

// Distant landmark silhouettes on the horizon, faded in/out by distance.
function farAlpha(dist) {
  return clamp((dist - 500) / 350, 0, 1) * clamp((2400 - dist) / 350, 0, 1);
}

function drawDistant(ctx, cam, v) {
  const p = Game.plane;
  if (v.feature === 'volcano') {
    const vz = Math.floor((p.z + 1400) / 3000) * 3000 + 900;
    const dist = vz - cam.z;
    const a = farAlpha(dist);
    if (a <= 0) return;
    const vx = -380;
    const baseL = project({ x: vx - 260, y: 0, z: vz }, cam);
    const baseR = project({ x: vx + 260, y: 0, z: vz }, cam);
    const peak = project({ x: vx, y: 300, z: vz }, cam);
    if (!baseL || !baseR || !peak) return;
    ctx.globalAlpha = a;
    ctx.fillStyle = '#3a3230';
    ctx.beginPath();
    ctx.moveTo(baseL.x, baseL.y);
    ctx.lineTo(peak.x, peak.y);
    ctx.lineTo(baseR.x, baseR.y);
    ctx.closePath();
    ctx.fill();
    // Crater smoke: grey puffs rising from the peak.
    ctx.fillStyle = 'rgba(200,200,200,0.75)';
    for (let i = 0; i < 4; i++) {
      const sp = project({ x: vx - 20 + i * 16, y: 320 + i * 26, z: vz }, cam);
      if (sp) {
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, (10 + i * 5) * sp.s, 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  } else if (v.feature === 'canyon') {
    // Far ridge line across the horizon.
    ctx.strokeStyle = v.landFar;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = -700; x <= 700; x += 80) {
      const z = Math.floor((p.z + 1600) / 3000) * 3000;
      const pr = project({ x: x, y: 60 + 40 * Math.sin(x * 0.01), z: z }, cam);
      if (pr) { if (x === -700) ctx.moveTo(pr.x, pr.y); else ctx.lineTo(pr.x, pr.y); }
    }
    ctx.stroke();
  }
}

// Venue-specific near features: palms, canyon walls, harbour town,
// city lights, terraces. All positioned in absolute world z with a
// period so they approach and pass as the plane flies.
function drawFeature(ctx, cam, v) {
  const p = Game.plane;
  const rng = mulberry32(99);
  if (v.feature === 'lagoon') {
    // Palm clusters along the shore, left and right.
    for (let k = -1; k <= 2; k++) {
      const pz = Math.floor((p.z + 300) / 700) * 700 + k * 700;
      const dist = pz - cam.z;
      if (dist < 60 || dist > 1400) continue;
      for (const px of [-160, 140, 220]) {
        const base = project({ x: px, y: 0, z: pz }, cam);
        const top = project({ x: px, y: 26, z: pz }, cam);
        if (!base || !top) continue;
        const s = base.s;
        ctx.strokeStyle = '#5a4630';
        ctx.lineWidth = Math.max(2, 3 * s);
        ctx.beginPath();
        ctx.moveTo(base.x, base.y);
        ctx.lineTo(top.x, top.y);
        ctx.stroke();
        ctx.fillStyle = '#2f7a3e';
        for (let f = 0; f < 5; f++) {
          const a = (f / 5) * TAU;
          ctx.beginPath();
          ctx.ellipse(top.x + Math.cos(a) * 12 * s, top.y + Math.sin(a) * 4 * s, 13 * s, 3.5 * s, a, 0, TAU);
          ctx.fill();
        }
      }
    }
  } else if (v.feature === 'canyon') {
    // Cliff walls left and right with strata bands, plus rice terraces
    // stepping up the left wall face. The walls stand well off the
    // course so they frame the scene instead of swallowing it.
    for (const side of [-1, 1]) {
      const wx = side * 320;
      const z0 = cam.z + 200, z1 = cam.z + 1400;
      const b0 = project({ x: wx, y: 0, z: z0 }, cam);
      const t0 = project({ x: wx, y: 95, z: z0 }, cam);
      const b1 = project({ x: wx, y: 0, z: z1 }, cam);
      const t1 = project({ x: wx, y: 95, z: z1 }, cam);
      if (!b0 || !t0 || !b1 || !t1) continue;
      ctx.fillStyle = side < 0 ? '#8a5a34' : '#7a4e2e';
      ctx.beginPath();
      ctx.moveTo(b0.x, b0.y); ctx.lineTo(t0.x, t0.y);
      ctx.lineTo(t1.x, t1.y); ctx.lineTo(b1.x, b1.y);
      ctx.closePath();
      ctx.fill();
      // Strata bands across the wall face.
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 2;
      for (let h = 20; h < 95; h += 18) {
        const a = project({ x: wx, y: h, z: z0 }, cam);
        const b = project({ x: wx, y: h, z: z1 }, cam);
        if (a && b) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    // Rice terraces: green bands hugging the left wall face.
    for (let i = 0; i < 5; i++) {
      const h = 22 + i * 15;
      const a = project({ x: -320, y: h, z: cam.z + 300 + i * 90 }, cam);
      const b = project({ x: -320, y: h, z: cam.z + 1150 }, cam);
      if (!a || !b) continue;
      ctx.strokeStyle = i % 2 ? '#7fae4e' : '#5d8a3a';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  } else if (v.feature === 'harbour') {
    // Town cluster on the LAND side of the coast (z below the coast
    // line), right of the runway: small blocks with warm lit windows.
    const coastBase = Math.floor((p.z + 500) / 1500) * 1500 + 350;
    for (let k = 0; k < 3; k++) {
      const tz = coastBase - 140 - k * 220;
      const dist = tz - cam.z;
      if (dist < 40 || dist > 1200) continue;
      for (let i = 0; i < 9; i++) {
        const bx = 110 + (i % 3) * 60 + ((i * 37) % 20);
        const by = 0;
        const bh = 24 + ((i * 53) % 36);
        const b0 = project({ x: bx, y: by, z: tz + (i % 2) * 40 }, cam);
        const b1 = project({ x: bx, y: bh, z: tz + (i % 2) * 40 }, cam);
        if (!b0 || !b1) continue;
        const w = Math.max(6, 34 * b0.s);
        ctx.fillStyle = '#2c2c3e';
        ctx.fillRect(b0.x - w / 2, b1.y, w, b0.y - b1.y);
        ctx.fillStyle = '#ffcf7a';
        for (let win = 0; win < 3; win++) {
          if (rng() < 0.7) ctx.fillRect(b0.x - w / 2 + 4 + win * (w / 3), b1.y + 5 + ((win * 7) % 12), 3, 3);
        }
      }
    }
  } else if (v.feature === 'night') {
    // City lights grid on the land below.
    for (let k = 0; k < 2; k++) {
      const gz = Math.floor((p.z + 400) / 800) * 800 + k * 800;
      const dist = gz - cam.z;
      if (dist < 60 || dist > 1200) continue;
      for (let i = 0; i < 40; i++) {
        const gx = -320 + ((i * 67) % 640);
        const gp = project({ x: gx, y: 0, z: gz + ((i * 31) % 160) }, cam);
        if (!gp) continue;
        ctx.fillStyle = i % 3 ? '#ffd27a' : '#9fd8ff';
        ctx.fillRect(gp.x, gp.y, 2.5, 2.5);
      }
    }
  }
}
