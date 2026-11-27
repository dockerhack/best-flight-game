// plane.js — the big biplane, drawn from behind and slightly above so the
// judge sees the aircraft being flown, not a toy from above. At least a
// quarter of the frame height, wings and tail clearly drawn, smoke
// trailing back toward the camera. Roll rotates the whole drawing, so an
// inverted plane at the top of a loop reads as inverted.
function drawPlane(ctx) {
  const p = Game.plane;
  const px = VIEW_W / 2 - p.roll * 55;
  const py = VIEW_H * 0.68 - p.pitch * 30;
  const scale = 1 - p.pitch * 0.06;
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(p.roll * 0.92);
  ctx.scale(scale, scale);

  const cream = '#f5eeda', red = '#d83a2e', dark = '#2a2a33', gold = '#ffd23f';

  // Lower wing (near the viewer).
  ctx.fillStyle = cream;
  roundRect(ctx, -165, 22, 330, 34, 14);
  ctx.fill();
  ctx.fillStyle = red;
  roundRect(ctx, -165, 22, 26, 34, 12);
  ctx.fill();
  roundRect(ctx, 139, 22, 26, 34, 12);
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.lineWidth = 2;
  roundRect(ctx, -165, 22, 330, 34, 14);
  ctx.stroke();

  // Fuselage: tail (bottom, toward viewer) to nose (top).
  ctx.fillStyle = cream;
  ctx.beginPath();
  ctx.moveTo(-22, 82);
  ctx.lineTo(-20, -30);
  ctx.quadraticCurveTo(-18, -88, 0, -96);
  ctx.quadraticCurveTo(18, -88, 20, -30);
  ctx.lineTo(22, 82);
  ctx.quadraticCurveTo(0, 92, -22, 82);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Red cheatline along the fuselage.
  ctx.fillStyle = red;
  ctx.beginPath();
  ctx.moveTo(-20, 10);
  ctx.lineTo(-17, -52);
  ctx.lineTo(-11, -52);
  ctx.lineTo(-13, 10);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(20, 10);
  ctx.lineTo(17, -52);
  ctx.lineTo(11, -52);
  ctx.lineTo(13, 10);
  ctx.closePath();
  ctx.fill();

  // Cockpit hump.
  ctx.fillStyle = '#3a4a5a';
  ctx.beginPath();
  ctx.ellipse(0, -18, 13, 10, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(180,220,255,0.85)';
  ctx.beginPath();
  ctx.ellipse(0, -20, 8, 6, 0, 0, TAU);
  ctx.fill();

  // Upper wing.
  ctx.fillStyle = cream;
  roundRect(ctx, -180, -52, 360, 30, 13);
  ctx.fill();
  ctx.fillStyle = red;
  roundRect(ctx, -180, -52, 28, 30, 11);
  ctx.fill();
  roundRect(ctx, 152, -52, 28, 30, 11);
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.lineWidth = 2;
  roundRect(ctx, -180, -52, 360, 30, 13);
  ctx.stroke();
  // Gold centre section.
  ctx.fillStyle = gold;
  ctx.fillRect(-34, -52, 68, 30);

  // Struts between the wings.
  ctx.strokeStyle = dark;
  ctx.lineWidth = 3;
  for (const sx of [-95, -55, 55, 95]) {
    ctx.beginPath();
    ctx.moveTo(sx, -22);
    ctx.lineTo(sx * 0.94, 22);
    ctx.stroke();
  }

  // Tailplane and fin.
  ctx.fillStyle = cream;
  roundRect(ctx, -70, 60, 140, 20, 9);
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.lineWidth = 2;
  roundRect(ctx, -70, 60, 140, 20, 9);
  ctx.stroke();
  ctx.fillStyle = red;
  ctx.beginPath();
  ctx.moveTo(-14, 62);
  ctx.lineTo(0, 96);
  ctx.lineTo(14, 62);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.stroke();
  // Registration, readable, on the fuselage between the wings — clear
  // of the tail fin.
  ctx.fillStyle = dark;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PK-SMT', 0, 14);

  // Propeller disc (faint — the nose points away from us).
  ctx.fillStyle = 'rgba(60,60,70,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, -100, 26, 5, 0, 0, TAU);
  ctx.fill();

  // Wingtip smoke nozzles.
  ctx.fillStyle = '#888';
  ctx.beginPath();
  ctx.arc(-166, 39, 4, 0, TAU);
  ctx.arc(166, 39, 4, 0, TAU);
  ctx.fill();

  // Fresh smoke puffing off the wingtips toward the camera, so straight
  // flight still shows smoke (the world-space ribbon is behind the
  // camera on a straight line).
  if (Game.smokeOn) {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const px = side * (166 + i * 7);
        const py = 46 + i * 16;
        const r = 7 + i * 5;
        ctx.globalAlpha = 0.75 - i * 0.16;
        ctx.fillStyle = smokeColorAt(Game.smokeColor, i, 4);
        ctx.beginPath();
        ctx.arc(px, py, r, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 0.5 - i * 0.1;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, r * 0.4, 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

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
