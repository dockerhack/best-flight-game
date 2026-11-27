// hud.js — the in-flight HUD. Small, pushed to the edges, lit instruments:
// ALT / SPD / HDG top-left; fuel, G, throttle and smoke bars top-right;
// judges' chips bottom-left; crowd meter bottom-right; announcer line
// bottom-centre; exactly ONE callout at a time, centred high, never over
// the aircraft or the ring.
function chip(ctx, x, y, text) {
  ctx.font = 'bold 16px system-ui, sans-serif';
  const w = ctx.measureText(text).width + 18;
  ctx.fillStyle = 'rgba(10,14,24,0.62)';
  roundRect(ctx, x, y, w, 28, 7);
  ctx.fill();
  ctx.fillStyle = '#eef4ff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 9, y + 15);
}

function meterBar(ctx, x, y, label, frac, color) {
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(10,14,24,0.62)';
  roundRect(ctx, x, y, 144, 20, 6);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, x + 52, y + 4, Math.max(4, 86 * clamp(frac, 0, 1)), 12, 4);
  ctx.fill();
  ctx.fillStyle = '#eef4ff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + 6, y + 11);
}

function drawHUD(ctx) {
  const p = Game.plane;
  const v = venue();
  ctx.textBaseline = 'alphabetic';

  // Instruments, top-left.
  chip(ctx, 16, 14, 'ALT ' + fmtAlt(p.y));
  chip(ctx, 16, 48, 'SPD ' + fmtKts(p.speed));
  chip(ctx, 16, 82, 'HDG ' + fmtHdg(p.heading));

  // Fuel / G / throttle / smoke, top-right.
  meterBar(ctx, 1120, 14, 'FUEL', Game.fuel / 100, Game.fuel < 20 ? '#ff5a3c' : '#37d6ff');
  meterBar(ctx, 1120, 40, 'G ' + p.g.toFixed(1), p.g / 8, p.g > 6 ? '#ff5a3c' : '#ffd23f');
  meterBar(ctx, 1120, 66, 'THR', p.throttle, '#7be07b');
  meterBar(ctx, 1120, 92, 'SMOKE', Game.smokeFluid / 100, '#ff4fd8');

  // Routine progress, top-centre (flying only — shots stay clean).
  if (Game.mode === 'flying' && Game.figureList.length) {
    const fig = currentFigure();
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(238,244,255,0.92)';
    const txt = Game.phase === 'takeoff' ? 'TAKEOFF — rotate at 55 kt'
      : Game.phase === 'landing' ? 'LANDING — line up with the runway'
      : 'FIGURE ' + (Game.figureIdx + 1) + '/' + Game.figureList.length + ' — ' + (fig ? fig.name.toUpperCase() : '')
        + '  •  RINGS ' + Game.ringIdx + '/' + Game.rings.length;
    ctx.fillText(txt, VIEW_W / 2, 26);
  }

  // One callout at a time, centred high.
  if (Game.callout && Game.time < Game.callout.until) {
    const c = Game.callout;
    const colors = { perfect: '#ffd23f', good: '#ffffff', weak: '#ff9a8a', venue: '#ffd23f', figure: '#ffffff', info: '#eef4ff', warn: '#ff5a3c' };
    ctx.textAlign = 'center';
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(10,14,24,0.45)';
    const w = ctx.measureText(c.text).width + 44;
    roundRect(ctx, VIEW_W / 2 - w / 2, 128, w, 64, 12);
    ctx.fill();
    ctx.fillStyle = colors[c.kind] || '#ffffff';
    ctx.fillText(c.text, VIEW_W / 2, 172);
    if (c.sub) {
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(238,244,255,0.95)';
      ctx.fillText(c.sub, VIEW_W / 2, 214);
    }
  }

  // Judges' chips, bottom-left.
  if (Game.judgesChip && Game.time < Game.judgesChip.until) {
    const j = Game.judgesChip;
    ctx.textAlign = 'left';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(10,14,24,0.62)';
    roundRect(ctx, 16, 600, 250, 96, 10);
    ctx.fill();
    ctx.fillStyle = '#ffd23f';
    ctx.fillText(j.name.toUpperCase() + ' — ' + j.total.toFixed(1) + ' / 10', 30, 624);
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = '#eef4ff';
    ctx.fillText('Pak Darma (line)   ' + j.darma.toFixed(1), 30, 648);
    ctx.fillText('Bu Lestari (smooth)  ' + j.lestari.toFixed(1), 30, 670);
    ctx.fillText('Koh Hendra (smoke)  ' + j.hendra.toFixed(1), 30, 692);
  }

  // Crowd meter, bottom-right. Label always matches the number.
  const cl = crowdLabel();
  ctx.textAlign = 'right';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(10,14,24,0.62)';
  roundRect(ctx, 1000, 636, 264, 60, 10);
  ctx.fill();
  ctx.fillStyle = Game.crowd >= 80 ? '#ffd23f' : '#eef4ff';
  ctx.fillText('CROWD — ' + cl + '  ' + Math.round(Game.crowd) + '%', 1250, 660);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, 1014, 672, 236, 10, 5);
  ctx.fill();
  ctx.fillStyle = Game.crowd >= 80 ? '#ffd23f' : Game.crowd >= 60 ? '#7be07b' : '#37d6ff';
  roundRect(ctx, 1014, 672, Math.max(6, 236 * Game.crowd / 100), 10, 5);
  ctx.fill();

  // Announcer line, bottom-centre.
  if (Game.announce && Game.time < Game.announce.until) {
    ctx.font = 'italic 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(238,244,255,0.95)';
    ctx.fillText(Game.announce.text, VIEW_W / 2, 700);
  }

  // Warnings.
  if (Game.fuel < 20 && Game.mode === 'flying') {
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff5a3c';
    ctx.fillText('LOW FUEL — bring her home', VIEW_W / 2, 250);
  }
  if (Game.damage > 60 && Game.mode === 'flying') {
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff5a3c';
    ctx.fillText('AIRFRAME ' + Math.round(Game.damage) + '% — ease off the G', VIEW_W / 2, 274);
  }
}
