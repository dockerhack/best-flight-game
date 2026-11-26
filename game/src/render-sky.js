// render-sky.js — sky, sea, terrain, rings, runway, smoke ribbon, the
// biplane and particles, through a pseudo-3D chase projection written here.
// The camera sits behind and above the biplane and looks along its nose;
// the world is projected with a focal length, the horizon tilts with bank.

import { CFG } from './config.js';

const FOCAL = 900;
const CX = CFG.canvasW / 2;
const CY = CFG.canvasH / 2;

// Project a world point into screen space. The chase camera is LEVEL:
// it sits behind the plane on the heading line and looks forward with
// world-up. The plane banks and pitches inside the frame; the horizon
// never spins, so the world can never vanish behind the camera mid-loop.
// A small bank roll is applied in screen space for feel.
// Returns null when behind the camera.
function project(state, x, y, z) {
  const p = state.plane;
  const camX = p.x - Math.sin(p.heading) * 16;
  const camY = p.y + 4.5;
  const camZ = p.z - Math.cos(p.heading) * 16;
  const dx = x - camX;
  const dy = y - camY;
  const dz = z - camZ;
  const sinH = Math.sin(p.heading);
  const cosH = Math.cos(p.heading);
  // Camera space, level: x right, y up, z forward along the heading.
  const xc = dx * cosH - dz * sinH;
  const yc = dy;
  const zc = dx * sinH + dz * cosH;
  if (zc < 3) return null;
  let sx = CX + (xc / zc) * FOCAL;
  let sy = CY - (yc / zc) * FOCAL;
  // Bank rolls the world a little around the frame centre.
  const bank = p.bank * 0.3;
  if (bank !== 0) {
    const sinB = Math.sin(bank);
    const cosB = Math.cos(bank);
    const rx = sx - CX;
    const ry = sy - CY;
    sx = CX + rx * cosB - ry * sinB;
    sy = CY + rx * sinB + ry * cosB;
  }
  return { x: sx, y: sy, d: zc, scale: FOCAL / zc };
}

function lerpColor(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) + (((pb >> 16) & 255) - ((pa >> 16) & 255)) * t);
  const g = Math.round(((pa >> 8) & 255) + (((pb >> 8) & 255) - ((pa >> 8) & 255)) * t);
  const bl = Math.round((pa & 255) + ((pb & 255) - (pa & 255)) * t);
  return 'rgb(' + r + ',' + g + ',' + bl + ')';
}

export function drawWorld(ctx, state) {
  const { def } = state.venue;
  const p = state.plane;
  const W = CFG.canvasW;
  const H = CFG.canvasH;

  // --- Sky + sea, split at a horizon that dips slightly with altitude
  // and tilts a little with bank. The camera stays level, so the horizon
  // never leaves the frame mid-loop.
  const horizonY = CY + Math.min(60, Math.max(0, p.y) * 0.08);
  ctx.save();
  ctx.translate(CX, horizonY);
  ctx.rotate(-p.bank * 0.3);
  ctx.translate(-CX, -horizonY);
  const sky = ctx.createLinearGradient(0, 0, 0, Math.max(10, horizonY));
  sky.addColorStop(0, def.skyTop);
  sky.addColorStop(0.55, def.skyMid);
  sky.addColorStop(1, def.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(-40, -40, W + 80, horizonY + 40);
  const sea = ctx.createLinearGradient(0, horizonY, 0, H + 40);
  sea.addColorStop(0, def.sea);
  sea.addColorStop(1, def.seaDeep);
  ctx.fillStyle = sea;
  ctx.fillRect(-40, horizonY, W + 80, H - horizonY + 40);
  // Sun (or the night moon) with a halo.
  const sunX = def.sunX * W;
  const sunY = horizonY - (horizonY - def.sunY * H) * 0.9;
  const halo = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 120);
  halo.addColorStop(0, def.sun);
  halo.addColorStop(0.25, def.sun + 'cc');
  halo.addColorStop(1, def.sun + '00');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = def.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 26, 0, Math.PI * 2);
  ctx.fill();
  // Sea shimmer: a few perspective lines that sell the water.
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const y = horizonY + 24 + i * i * 9 + i * 26;
    if (y > H) break;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y + Math.sin(state.time * 0.7 + i) * 3);
    ctx.stroke();
  }
  ctx.restore();

  // --- Islands, far to near.
  const islands = state.venue.terrain.islands
    .map((isl) => ({ isl, pr: project(state, isl.x, isl.h * 0.55, isl.z) }))
    .filter((o) => o.pr && o.pr.x > -300 && o.pr.x < W + 300 && o.pr.y < H + 120)
    .sort((a, b) => b.pr.d - a.pr.d);
  for (const { isl, pr } of islands) {
    const w = isl.r * pr.scale * 2;
    const h = Math.max(4, isl.h * pr.scale * 0.9);
    const green = lerpColor('#7a6a4a', '#2f7a4a', isl.green);
    ctx.fillStyle = isl.volcano ? '#3a2a28' : green;
    ctx.beginPath();
    ctx.ellipse(pr.x, pr.y, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    if (isl.peak) {
      ctx.fillStyle = isl.volcano ? '#241a18' : lerpColor('#5a4a3a', '#2a5a3a', isl.green);
      ctx.beginPath();
      ctx.moveTo(pr.x - w * 0.22, pr.y);
      ctx.lineTo(pr.x, pr.y - h * 0.9);
      ctx.lineTo(pr.x + w * 0.22, pr.y);
      ctx.closePath();
      ctx.fill();
      if (isl.volcano) {
        ctx.fillStyle = 'rgba(255,90,40,0.85)';
        ctx.beginPath();
        ctx.arc(pr.x, pr.y - h * 0.9, Math.max(2, w * 0.03), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Night venue: town lights on the capital island.
    if (state.venue.def.id === 'malam' && isl.r > 400) {
      ctx.fillStyle = 'rgba(255,220,130,0.9)';
      for (let i = 0; i < 26; i++) {
        const lx = pr.x + Math.sin(i * 12.9898) * w * 0.32;
        const ly = pr.y - Math.abs(Math.cos(i * 7.233)) * h * 0.5;
        ctx.fillRect(lx, ly, 2.5, 2.5);
      }
    }
  }

  // --- Runway strips, projected as quads on the water's edge.
  for (const rw of state.venue.terrain.runways) {
    const hw = rw.w / 2;
    const corners = [
      project(state, rw.x - hw, 1, rw.z - 20),
      project(state, rw.x + hw, 1, rw.z - 20),
      project(state, rw.x + hw, 1, rw.z + rw.len),
      project(state, rw.x - hw, 1, rw.z + rw.len),
    ];
    if (corners.some((c) => !c)) continue;
    ctx.fillStyle = '#2c2c30';
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 4; i++) ctx.lineTo(corners[i].x, corners[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo((corners[0].x + corners[1].x) / 2, (corners[0].y + corners[1].y) / 2);
    ctx.lineTo((corners[2].x + corners[3].x) / 2, (corners[2].y + corners[3].y) / 2);
    ctx.stroke();
  }

  // --- Gate rings: the next one gold and glowing, later ones dim, passed green.
  state.gates.forEach((g, gi) => {
    const pr = project(state, g.x, g.y, g.z);
    if (!pr) return;
    const r = Math.max(3, g.r * pr.scale);
    const next = gi === state.gateIndex && !g.passed;
    ctx.lineWidth = Math.max(2, Math.min(9, r * 0.09));
    if (g.passed) ctx.strokeStyle = 'rgba(80,220,120,0.9)';
    else if (next) ctx.strokeStyle = '#ffd23f';
    else ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.arc(pr.x, pr.y, r, 0, Math.PI * 2);
    ctx.stroke();
    if (next) {
      ctx.strokeStyle = 'rgba(255,210,63,0.35)';
      ctx.lineWidth = Math.max(4, r * 0.16);
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, r * 1.12, 0, Math.PI * 2);
      ctx.stroke();
      // Figure name over the ring when it is close enough to read.
      if (pr.d < 1400) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(g.figure.name.toUpperCase(), pr.x, pr.y - r - 12);
      }
    }
  });

  // --- Smoke ribbon: the figure the pilot flew, drawn bright.
  drawSmoke(ctx, state);

  // --- Rival planes in the distance (freestyle shot + live rivals).
  if (state.rivalPlanes) {
    for (const rp of state.rivalPlanes) {
      const pr = project(state, rp.x, rp.y, rp.z);
      if (!pr || pr.d < 20) continue;
      drawMiniPlane(ctx, pr.x, pr.y, Math.max(8, 2600 / pr.d), rp.color, rp.bank || 0);
      if (rp.label) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(rp.label, pr.x, pr.y - Math.max(12, 2600 / pr.d) - 6);
        ctx.textAlign = 'left';
      }
    }
  }

  // --- Particles.
  for (const pt of state.particles) {
    const pr = project(state, pt.x, pt.y, pt.z);
    if (!pr) continue;
    const a = 1 - pt.age / pt.life;
    ctx.fillStyle = pt.kind === 'spark' ? 'rgba(255,180,60,' + a + ')'
      : pt.kind === 'spray' ? 'rgba(200,230,255,' + (a * 0.8) + ')'
      : 'rgba(220,220,220,' + (a * 0.6) + ')';
    ctx.beginPath();
    ctx.arc(pr.x, pr.y, Math.max(1.5, 4 * pr.scale * a + 1), 0, Math.PI * 2);
    ctx.fill();
  }

  // --- The Cendrawasih biplane, chase view, centre-low in frame.
  drawPlane(ctx, state);
}

function drawSmoke(ctx, state) {
  const pts = state.trail.points;
  if (pts.length < 2) return;
  // Project once; split the line wherever the camera loses a point.
  let run = [];
  const flush = () => {
    if (run.length < 2) { run = []; return; }
    for (let pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      ctx.moveTo(run[0].x, run[0].y);
      for (let i = 1; i < run.length; i++) ctx.lineTo(run[i].x, run[i].y);
      ctx.strokeStyle = run[0].color;
      ctx.globalAlpha = pass === 0 ? 0.28 : 0.9;
      ctx.lineWidth = pass === 0 ? 13 : 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    run = [];
  };
  for (const pt of pts) {
    const pr = project(state, pt.x, pt.y, pt.z);
    if (!pr) { flush(); continue; }
    // Fade the oldest puffs.
    const fade = Math.max(0.25, 1 - pt.age / 14);
    run.push({ x: pr.x, y: pr.y, color: pt.color, fade });
    if (run.length > 1) {
      // Per-segment width by distance is approximated by the two passes.
    }
  }
  flush();
}

function drawMiniPlane(ctx, x, y, size, color, bank) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(bank);
  ctx.fillStyle = color;
  ctx.fillRect(-size, -size * 0.14, size * 2, size * 0.28);
  ctx.fillRect(-size * 0.2, -size * 0.5, size * 0.4, size);
  ctx.restore();
}

// The hero biplane, drawn in code: cream fuselage, red wings, gold trim,
// spinning prop, roundels, registration PK-SMT on the tail.
function drawPlane(ctx, state) {
  const p = state.plane;
  const x = CX;
  const y = CY + 46 + Math.sin(p.pitch) * 26;
  const scale = 1 + Math.sin(p.pitch) * 0.06;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(p.bank * 0.45);
  ctx.scale(scale, scale);
  // Propeller disc + blades.
  ctx.fillStyle = 'rgba(40,40,50,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, -64, 10, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(30,30,40,0.85)';
  ctx.lineWidth = 4;
  const pa = p.propAngle % Math.PI;
  ctx.beginPath();
  ctx.moveTo(-Math.sin(pa) * 30, -64 - Math.cos(pa) * 30);
  ctx.lineTo(Math.sin(pa) * 30, -64 + Math.cos(pa) * 30);
  ctx.stroke();
  // Lower wing.
  ctx.fillStyle = '#c23b2e';
  roundRect(ctx, -78, -18, 156, 16, 7);
  ctx.fill();
  ctx.fillStyle = '#f2e3c6';
  ctx.fillRect(-78, -12, 156, 3);
  // Fuselage.
  ctx.fillStyle = '#f2e3c6';
  ctx.beginPath();
  ctx.ellipse(0, -8, 15, 62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c23b2e';
  ctx.beginPath();
  ctx.ellipse(0, 34, 12, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cockpit + pilot.
  ctx.fillStyle = '#3a2a1a';
  ctx.beginPath();
  ctx.ellipse(0, -26, 9, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8b23a';
  ctx.beginPath();
  ctx.arc(0, -30, 6, 0, Math.PI * 2);
  ctx.fill();
  // Upper wing (closer to camera, wider).
  ctx.fillStyle = '#a93226';
  roundRect(ctx, -96, 6, 192, 18, 8);
  ctx.fill();
  ctx.fillStyle = '#f2e3c6';
  ctx.fillRect(-96, 13, 192, 3);
  // Roundels on the upper wing.
  for (const rx of [-52, 52]) {
    ctx.fillStyle = '#f2e3c6';
    ctx.beginPath();
    ctx.arc(rx, 15, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c23b2e';
    ctx.beginPath();
    ctx.arc(rx, 15, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Tailplanes + fin.
  ctx.fillStyle = '#c23b2e';
  roundRect(ctx, -34, 46, 68, 10, 5);
  ctx.fill();
  ctx.fillStyle = '#a93226';
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.lineTo(-10, 62);
  ctx.lineTo(10, 62);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2b2b30';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PK-SMT', 0, 60);
  // Gold trim line along the fuselage.
  ctx.strokeStyle = '#e8b23a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-13, -40);
  ctx.quadraticCurveTo(-16, 0, -11, 34);
  ctx.moveTo(13, -40);
  ctx.quadraticCurveTo(16, 0, 11, 34);
  ctx.stroke();
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
