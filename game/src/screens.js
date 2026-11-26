// screens.js — title, how-to, pause, venue-complete and game-over screens.
// Buttons are one source of truth: buttonsFor(state) computes every rect,
// the draw pass paints them and the click pass tests them.

import { CFG, VENUES, UPGRADES, ANNOUNCER } from './config.js';
import { standings } from './rivals.js';

function button(ctx, b, hover) {
  ctx.fillStyle = hover ? '#ffd23f' : 'rgba(8,12,24,0.78)';
  ctx.beginPath();
  ctx.roundRect(b.x, b.y, b.w, b.h, 8);
  ctx.fill();
  ctx.strokeStyle = hover ? '#fff' : 'rgba(255,255,255,0.35)';
  ctx.lineWidth = hover ? 2 : 1;
  ctx.stroke();
  ctx.fillStyle = hover ? '#1a1206' : '#fff';
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 6);
  if (b.sub) {
    ctx.fillStyle = hover ? '#4a3410' : '#9fd8e8';
    ctx.font = '12px sans-serif';
    ctx.fillText(b.sub, b.x + b.w / 2, b.y + b.h / 2 + 22);
  }
  ctx.textAlign = 'left';
}

function hovered(state, b) {
  const m = state.mouse || { x: -1, y: -1 };
  return m.x >= b.x && m.x <= b.x + b.w && m.y >= b.y && m.y <= b.y + b.h;
}

// Every clickable rect for the current screen, in one place.
export function buttonsFor(state) {
  const W = CFG.canvasW;
  const H = CFG.canvasH;
  const list = [];
  if (state.screen === 'title') {
    list.push({ id: 'start', x: W / 2 - 150, y: 430, w: 300, h: 52, label: 'START THE TOUR' });
    list.push({ id: 'howto', x: W / 2 - 150, y: 494, w: 300, h: 44, label: 'HOW TO FLY' });
    VENUES.forEach((v, i) => {
      const unlocked = i < (state.save.unlocked || 1);
      list.push({
        id: 'venue-' + i,
        x: W / 2 - 310 + i * 128, y: 560, w: 116, h: 44,
        label: unlocked ? 'VENUE ' + (i + 1) : 'LOCKED',
        sub: unlocked ? v.name : '',
      });
    });
  } else if (state.screen === 'howto') {
    list.push({ id: 'back', x: W / 2 - 110, y: 620, w: 220, h: 48, label: 'BACK' });
  } else if (state.screen === 'paused') {
    list.push({ id: 'resume', x: W / 2 - 150, y: 330, w: 300, h: 50, label: 'RESUME  (P)' });
    list.push({ id: 'restart', x: W / 2 - 150, y: 392, w: 300, h: 44, label: 'RESTART VENUE' });
    list.push({ id: 'quit', x: W / 2 - 150, y: 448, w: 300, h: 44, label: 'QUIT TO TITLE' });
  } else if (state.screen === 'venueComplete') {
    const r = state.result;
    UPGRADES.forEach((u, i) => {
      const level = state.tour.upgrades[u.id] || 0;
      const cost = u.cost * (level + 1);
      list.push({
        id: 'buy-' + u.id,
        x: 190 + i * 232, y: 528, w: 212, h: 56,
        label: (level >= u.max ? 'MAXED' : 'BUY — ' + cost + ' PTS'),
        sub: u.name + '  Lv' + level + '/' + u.max,
      });
    });
    list.push({
      id: 'next',
      x: W / 2 - 160, y: 606, w: 320, h: 52,
      label: r && r.lastVenue ? 'SEE FINAL STANDINGS' : 'NEXT VENUE — ' + (state.venue.def.next || '').toUpperCase(),
    });
  } else if (state.screen === 'gameOver') {
    list.push({ id: 'again', x: W / 2 - 160, y: 560, w: 320, h: 52, label: 'FLY THE TOUR AGAIN' });
    list.push({ id: 'title', x: W / 2 - 160, y: 624, w: 320, h: 44, label: 'BACK TO TITLE' });
  }
  return list;
}

function dim(ctx, alpha) {
  ctx.fillStyle = 'rgba(5,8,18,' + alpha + ')';
  ctx.fillRect(0, 0, CFG.canvasW, CFG.canvasH);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(8,12,24,0.88)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,210,63,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function drawScreenOverlay(ctx, state) {
  const W = CFG.canvasW;
  const H = CFG.canvasH;
  const buttons = buttonsFor(state);
  if (state.screen === 'title') {
    dim(ctx, 0.42);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 64px sans-serif';
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(8,12,24,0.9)';
    ctx.strokeText('SMOKE & THUNDER', W / 2, 150);
    ctx.fillText('SMOKE & THUNDER', W / 2, 150);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('the Cendrawasih Airshow Circuit', W / 2, 192);
    ctx.fillStyle = '#9fd8e8';
    ctx.font = '17px sans-serif';
    ctx.fillText('5 venues  ·  3 routines  ·  18 figures  ·  3 rival pilots  ·  smoke that draws your line', W / 2, 224);
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'italic 16px sans-serif';
    ctx.fillText('"' + state.venue.def.line + '"  — ' + ANNOUNCER, W / 2, 258);
    if (state.save.bestTotal > 0) {
      ctx.fillStyle = '#fff';
      ctx.font = '15px sans-serif';
      ctx.fillText('Best championship total: ' + Math.round(state.save.bestTotal) + '   ·   Best line: ' + (state.save.bestLine || '—'), W / 2, 292);
    }
    ctx.fillStyle = '#9fd8e8';
    ctx.font = '15px sans-serif';
    ctx.fillText('Fly the figures. Draw them in smoke. Beat Elang, Sari and Bimo.', W / 2, 400);
    ctx.fillStyle = '#8a8a9a';
    ctx.font = '13px sans-serif';
    ctx.fillText('ENTER — start the tour   ·   P — pause in flight   ·   click a venue to jump in', W / 2, 640);
    ctx.textAlign = 'left';
    for (const b of buttons) button(ctx, b, hovered(state, b));
  } else if (state.screen === 'howto') {
    dim(ctx, 0.72);
    panel(ctx, W / 2 - 360, 60, 720, 540);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('HOW TO FLY', W / 2, 108);
    ctx.fillStyle = '#fff';
    ctx.font = '17px sans-serif';
    const lines = [
      '↑ / ↓  —  pitch: pull up for loops, push over for dives',
      '← / →  —  roll: bank to turn, roll for aileron and barrel rolls',
      'W / S  —  throttle: full power up the vertical, idle down it',
      'SPACE  —  smoke on/off: the ribbon draws the figure you flew',
      'F  —  flaps for landing   ·   P  —  pause',
      '',
      'PRECISION — fly the 6 set figures through the gold rings.',
      'FREESTYLE — 90 seconds, chain any figures; variety pays, repeats halve.',
      'CROWD LINE — thread the low banner gates; closer to the deck, more points.',
      '',
      'Score: the three judges score each figure 0–10. Three clean figures',
      'in a row with smoke on is FULL SMOKE ×2. Over the G-limit three times',
      'grounds you. Fuel is finite — save some for the landing.',
      'Land on the strip: GREASED IT! is a star. Miss it and it is the ridge.',
    ];
    lines.forEach((l, i) => ctx.fillText(l, W / 2, 148 + i * 26));
    ctx.textAlign = 'left';
    for (const b of buttons) button(ctx, b, hovered(state, b));
  } else if (state.screen === 'paused') {
    dim(ctx, 0.6);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('PAUSED', W / 2, 280);
    ctx.textAlign = 'left';
    for (const b of buttons) button(ctx, b, hovered(state, b));
  } else if (state.screen === 'venueComplete') {
    dim(ctx, 0.62);
    const r = state.result;
    panel(ctx, 140, 28, 1000, 664);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('VENUE COMPLETE — ' + state.venue.def.name, W / 2, 72);
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('★'.repeat(r.stars) + '☆'.repeat(3 - r.stars), W / 2, 116);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Landing: ' + r.landing.text + '   ·   Championship points: +' + r.points, W / 2, 144);
    // Figure table.
    ctx.textAlign = 'left';
    ctx.fillStyle = '#9fd8e8';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('FIGURE', 190, 176);
    ctx.fillText('PAK DARMA', 480, 176);
    ctx.fillText('BU LESTARI', 600, 176);
    ctx.fillText('KOH HENDRA', 720, 176);
    ctx.fillText('TOTAL', 860, 176);
    ctx.fillStyle = '#fff';
    ctx.font = '15px sans-serif';
    r.figures.forEach((f, i) => {
      const y = 202 + i * 26;
      ctx.fillText(f.name, 190, y);
      ctx.fillText(f.scores[0].toFixed(1), 480, y);
      ctx.fillText(f.scores[1].toFixed(1), 600, y);
      ctx.fillText(f.scores[2].toFixed(1), 720, y);
      ctx.fillText(f.total.toFixed(1), 860, y);
    });
    // Rival standings.
    ctx.fillStyle = '#9fd8e8';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('CHAMPIONSHIP STANDINGS', 190, 372);
    ctx.fillStyle = '#fff';
    ctx.font = '15px sans-serif';
    r.standings.forEach((s, i) => {
      const y = 398 + i * 26;
      ctx.fillStyle = s.you ? '#ffd23f' : '#fff';
      ctx.fillText((i + 1) + '.  ' + s.name + '  —  ' + s.tag, 190, y);
      ctx.fillText(s.total.toFixed(1), 860, y);
    });
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'italic 16px sans-serif';
    ctx.fillText('"' + r.quote + '"  — ' + ANNOUNCER, W / 2, 500);
    ctx.fillStyle = '#9fd8e8';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('UPGRADE SHOP  ·  ' + state.tour.points + ' PTS', W / 2, 522);
    ctx.textAlign = 'left';
    for (const b of buttons) button(ctx, b, hovered(state, b));
    ctx.fillStyle = '#8a8a9a';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('For the judge: the smoke ribbon is the figure I flew — score the line, not the fetch.', W / 2, 676);
    ctx.textAlign = 'left';
  } else if (state.screen === 'gameOver') {
    dim(ctx, 0.6);
    panel(ctx, 240, 80, 800, 560);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('CHAMPIONSHIP FINAL', W / 2, 140);
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText('The Cendrawasih Airshow Circuit is flown. The crowd is still cheering.', W / 2, 176);
    const rows = standings(state.tour.rivals);
    ctx.textAlign = 'left';
    ctx.font = 'bold 20px sans-serif';
    rows.forEach((s, i) => {
      const y = 240 + i * 44;
      ctx.fillStyle = s.you ? '#ffd23f' : '#fff';
      ctx.fillText((i + 1) + '.  ' + s.name, 320, y);
      ctx.fillText(s.total.toFixed(1), 880, y);
    });
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9fd8e8';
    ctx.font = '16px sans-serif';
    ctx.fillText('Best line this tour: ' + (state.save.bestLine || '—'), W / 2, 500);
    ctx.fillText('Championship total: ' + Math.round(state.tour.rivals.playerTotal), W / 2, 528);
    ctx.textAlign = 'left';
    for (const b of buttons) button(ctx, b, hovered(state, b));
  }
}

// Handle one click. actions are supplied by main.js (no circular import).
export function screenClick(state, x, y, actions) {
  const buttons = buttonsFor(state);
  for (const b of buttons) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      const id = b.id;
      if (id === 'start') actions.startVenue(0);
      else if (id === 'howto') actions.showHowto();
      else if (id === 'back') actions.showTitle();
      else if (id.startsWith('venue-')) actions.startVenue(parseInt(id.slice(6), 10));
      else if (id === 'resume') actions.resume();
      else if (id === 'restart') actions.restartVenue();
      else if (id === 'quit') actions.showTitle();
      else if (id.startsWith('buy-')) actions.buyUpgrade(id.slice(4));
      else if (id === 'next') actions.nextVenue();
      else if (id === 'again') actions.playAgain();
      else if (id === 'title') actions.showTitle();
      return true;
    }
  }
  return false;
}
