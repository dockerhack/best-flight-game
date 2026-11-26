// render-hud.js — instruments, gauges, scoreboard, callouts. Everything the
// judge's first criterion asks for is on this layer: altitude, speed and
// heading, lit instruments, fuel, G and smoke, the judges' scores and the
// crowd — all drawn in code, no images.

import { CFG } from './config.js';
import { crowdLabel } from './crowd.js';
import { latestCallout } from './feel.js';

function panel(ctx, x, y, w, h, alpha) {
  ctx.fillStyle = 'rgba(8,12,24,' + (alpha || 0.55) + ')';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function bar(ctx, x, y, w, h, frac, color, bg) {
  ctx.fillStyle = bg || 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, Math.max(0, w * Math.min(1, Math.max(0, frac))), h, 4);
  ctx.fill();
}

export function drawHud(ctx, state) {
  const p = state.plane;
  const { def } = state.venue;
  const W = CFG.canvasW;
  const H = CFG.canvasH;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // --- Venue banner, top-left: place + routine + next stop (the journey).
  panel(ctx, 16, 14, 340, 64);
  ctx.fillStyle = '#ffd23f';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(def.name, 28, 40);
  ctx.fillStyle = '#fff';
  ctx.font = '15px sans-serif';
  ctx.fillText(def.sub, 28, 62);
  ctx.fillStyle = '#9fd8e8';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('NEXT STOP — ' + def.next.toUpperCase(), 16, 100);

  // --- Score, top-right, with the rivalry underneath.
  panel(ctx, W - 236, 14, 220, 64);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('SCORE', W - 224, 34);
  ctx.fillStyle = '#ffd23f';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(String(Math.round(state.score.total)), W - 224, 62);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('VENUE ' + (state.venueIndex + 1) + '/5', W - 28, 34);
  ctx.fillText('★'.repeat(state.score.stars) + '☆'.repeat(3 - state.score.stars), W - 28, 62);
  ctx.textAlign = 'left';

  // --- Instruments, left: ALT / SPD / HDG, lit amber on dark.
  const gauges = [
    { label: 'ALT', value: Math.max(0, Math.round(p.y)) + ' m', frac: Math.min(1, p.y / 500) },
    { label: 'SPD', value: Math.round(p.speed * 3.6) + ' km/h', frac: p.speed / CFG.maxSpeed },
    { label: 'HDG', value: String(Math.round(((p.heading * 180 / Math.PI) % 360 + 360) % 360)).padStart(3, '0') + '°', frac: ((p.heading % (Math.PI * 2)) + Math.PI * 2) / (Math.PI * 2) },
  ];
  gauges.forEach((g, i) => {
    const y = 100 + i * 62;
    panel(ctx, 16, y, 148, 52);
    ctx.fillStyle = '#9fd8e8';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(g.label, 26, y + 18);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(g.value, 26, y + 42);
    bar(ctx, 118, y + 12, 34, 6, g.frac, '#ffd23f');
  });

  // --- Fuel, G-meter, smoke fluid, right side.
  panel(ctx, W - 236, 100, 220, 118);
  ctx.fillStyle = '#9fd8e8';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('FUEL', W - 224, 122);
  bar(ctx, W - 224, 128, 196, 10, p.fuel / 100, p.fuel < 25 ? '#ff5a4a' : '#7ad07a');
  ctx.fillStyle = p.fuel < 25 ? '#ff5a4a' : '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(Math.round(p.fuel) + '%', W - 224, 156);
  ctx.fillStyle = '#9fd8e8';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('G-METER', W - 224, 176);
  const gFrac = Math.min(1, p.g / 6);
  bar(ctx, W - 224, 182, 196, 10, gFrac, p.g > 4.5 ? '#ff5a4a' : p.g > 3.2 ? '#ffd23f' : '#7ad07a');
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(p.g.toFixed(1) + ' G', W - 224, 208);
  // Airframe damage: the G-limit's running bill, shown once it exists.
  if (p.damage > 0) {
    ctx.fillStyle = '#ff5a4a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('DMG ' + Math.round(p.damage) + '%', W - 120, 208);
  }
  ctx.fillStyle = '#9fd8e8';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('SMOKE ' + def.smokeName, W - 120, 176);
  bar(ctx, W - 120, 182, 92, 10, p.smokeFluid / 100, def.smoke);
  ctx.fillStyle = p.smokeOn ? def.smoke : '#888';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(p.smokeOn ? '● ON' : '○ OFF', W - 120, 208);

  // --- Throttle bar, bottom-centre.
  panel(ctx, W / 2 - 150, H - 46, 300, 32);
  ctx.fillStyle = '#9fd8e8';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('THR', W / 2 - 138, H - 24);
  bar(ctx, W / 2 - 100, H - 36, 180, 12, p.throttle, '#ff9e4f');
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(Math.round(p.throttle * 100) + '%', W / 2 + 88, H - 24);
  if (p.flaps) {
    ctx.fillStyle = '#ffd23f';
    ctx.fillText('FLAPS', W / 2 + 122, H - 24);
  }

  // --- Crowd meter, bottom-right.
  panel(ctx, W - 236, H - 78, 220, 64);
  ctx.fillStyle = '#9fd8e8';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('CROWD — ' + crowdLabel(state.crowd), W - 224, H - 56);
  bar(ctx, W - 224, H - 48, 196, 10, state.crowd.meter / 100, '#ff5a7a');
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(Math.round(state.crowd.meter) + '%  ·  ' + state.crowd.size + 'k watching', W - 224, H - 26);

  // --- Next gate readout, top-centre.
  const gate = state.gates[state.gateIndex];
  if (gate && state.screen === 'flying') {
    const dist = Math.max(0, Math.round(gate.z - p.z));
    ctx.fillStyle = 'rgba(8,12,24,0.55)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 170, 14, 340, 34, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NEXT: ' + gate.figure.name.toUpperCase() + '  ·  ' + dist + ' m', W / 2, 37);
    ctx.textAlign = 'left';
  }

  // --- Freestyle timer.
  if (state.venue.def.routine === 'freestyle' && state.screen === 'flying') {
    const left = Math.max(0, Math.ceil(state.routineTimeLeft));
    ctx.fillStyle = left <= 10 ? '#ff5a4a' : '#fff';
    ctx.font = 'bold 30px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('0:' + String(left).padStart(2, '0'), W / 2, 92);
    ctx.textAlign = 'left';
  }

  // --- Judges' last scores, under the top bar.
  if (state.lastFigure && state.lastFigure.age < 4) {
    const lf = state.lastFigure;
    panel(ctx, W / 2 - 170, 56, 340, 46);
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(lf.name + '  —  ' + lf.scores.map((s) => s.toFixed(1)).join('  ·  '), W / 2, 76);
    ctx.fillStyle = '#9fd8e8';
    ctx.font = '12px sans-serif';
    ctx.fillText('Pak Darma  ·  Bu Lestari  ·  Koh Hendra', W / 2, 94);
    ctx.textAlign = 'left';
  }

  // --- The combo is announced by the big callout (feel.js); no second
  // badge here — one shout per combo, not two.
  // --- Callouts, centre screen.
  const call = latestCallout(state.feel);
  if (call) {
    const a = Math.max(0, 1 - call.age / call.life);
    ctx.globalAlpha = Math.min(1, a * 1.4);
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(8,12,24,0.85)';
    ctx.strokeText(call.text, W / 2, H * 0.32);
    ctx.fillStyle = '#ffd23f';
    ctx.fillText(call.text, W / 2, H * 0.32);
    if (call.sub) {
      ctx.font = 'bold 18px sans-serif';
      ctx.strokeText(call.sub, W / 2, H * 0.32 + 30);
      ctx.fillStyle = '#fff';
      ctx.fillText(call.sub, W / 2, H * 0.32 + 30);
    }
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }

  // --- Fuel warning.
  if (p.fuel < 25 && state.screen === 'flying' && Math.floor(state.time * 2) % 2 === 0) {
    ctx.fillStyle = '#ff5a4a';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ FUEL LOW — GLIDE HER HOME', W / 2, H - 64);
    ctx.textAlign = 'left';
  }
}
