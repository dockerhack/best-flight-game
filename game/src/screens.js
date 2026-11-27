// screens.js — DOM overlay screens: menu, briefing, results, shop.
// The game itself is canvas; these panels are plain DOM so buttons are
// real buttons (and headless tests can click them).
const SCREENS = ['menu', 'briefing', 'results', 'shop'];

function showScreen(name) {
  for (const s of SCREENS) {
    const el = document.getElementById('screen-' + s);
    if (el) el.style.display = s === name ? 'block' : 'none';
  }
  if (name === 'results') renderResults();
  if (name === 'shop') renderShop();
  if (name === 'menu') renderMenu();
}

function el(id) { return document.getElementById(id); }

function renderMenu() {
  const pts = el('menu-points');
  if (pts) pts.textContent = 'Points: ' + Game.points + '  •  Upgrades: engine +' + Game.upgrades.engine
    + '  airframe +' + Game.upgrades.airframe + '  smoke: ' + Game.smokeColor;
  const vb = el('venue-buttons');
  if (vb) {
    vb.innerHTML = '';
    VENUES.forEach((v, i) => {
      const b = document.createElement('button');
      b.className = 'pick' + (i === Game.venueIdx ? ' sel' : '');
      b.textContent = v.name + ' — ' + v.time;
      b.onclick = () => { Game.venueIdx = i; renderMenu(); };
      vb.appendChild(b);
    });
  }
  const rb = el('routine-buttons');
  if (rb) {
    rb.innerHTML = '';
    ROUTINES.forEach((r) => {
      const b = document.createElement('button');
      b.className = 'pick' + (r.id === Game.routineId ? ' sel' : '');
      b.textContent = r.name + ' — ' + r.figures.length + ' figures';
      b.onclick = () => { Game.routineId = r.id; Game.venueIdx = r.venue; renderMenu(); };
      rb.appendChild(b);
    });
  }
}

function renderBriefing() {
  const r = routineById(Game.routineId);
  const v = venue();
  el('brief-venue').textContent = v.name + ' — ' + v.tagline;
  el('brief-routine').textContent = r.name + ': ' + r.desc;
  el('brief-blurb').textContent = v.blurb;
  el('brief-figures').innerHTML = r.figures.map((id) => {
    const f = figureById(id);
    return '<li><b>' + f.name + '</b> — ' + f.blurb + ' (target ' + f.speed + ' kt)</li>';
  }).join('');
  el('brief-rivals').innerHTML = RIVALS.map((x) => '<li><b>' + x.name + '</b> (' + x.callsign + ') — ' + x.story + '</li>').join('');
  el('brief-judges').innerHTML = JUDGES.map((j) => '<li><b>' + j.name + '</b> — ' + j.blurb + '</li>').join('');
}

function renderResults() {
  const res = Game.lastResult;
  if (!res) return;
  el('res-title').textContent = res.routine.name + ' — ' + venue().name;
  let html = '';
  if (res.early) html += '<p class="warn">Routine ended early: ' + res.early + '</p>';
  html += '<table><tr><th>Figure</th><th>Darma</th><th>Lestari</th><th>Hendra</th><th>Total</th></tr>';
  for (const s of Game.figureScores) {
    html += '<tr><td>' + s.figure.name + '</td><td>' + s.darma.toFixed(1) + '</td><td>' + s.lestari.toFixed(1)
      + '</td><td>' + s.hendra.toFixed(1) + '</td><td><b>' + s.total.toFixed(1) + '</b></td></tr>';
  }
  html += '</table>';
  if (res.touch) {
    html += '<p>Landing: <b>' + res.touch.score.toFixed(1) + ' / 10</b> — touchdown '
      + res.touch.vs.toFixed(1) + ' m/s, ' + res.touch.dx.toFixed(0) + ' m off centre, '
      + Math.round(res.touch.speed) + ' kt.</p>';
  }
  html += '<p>Figures ' + res.figTotal.toFixed(1) + ' / ' + res.figMax
    + '  •  Landing ' + res.landScore.toFixed(1) + '  •  Crowd bonus ' + res.crowdBonus
    + '  •  <b>' + res.total.toFixed(1) + ' / ' + res.maxTotal + '</b></p>';
  html += '<p class="stars">' + '★'.repeat(res.stars) + '☆'.repeat(3 - res.stars)
    + ' &nbsp; +' + res.points + ' points &nbsp;•&nbsp; Rings ' + Game.stats.ringsHit + '/' + Game.stats.ringsTotal
    + ' &nbsp;•&nbsp; Perfect figures ' + Game.stats.perfect + '</p>';
  html += '<h3>Leaderboard</h3><ol>';
  const mine = { name: 'YOU (SMOKE & THUNDER)', score: Math.round(res.total) };
  const board = res.rivals.concat([mine]).sort((a, b) => b.score - a.score);
  for (const row of board) {
    html += '<li>' + row.name + ' — <b>' + row.score + '</b></li>';
  }
  html += '</ol>';
  el('res-body').innerHTML = html;
}

function renderShop() {
  el('shop-points').textContent = 'Points: ' + Game.points;
  const list = el('shop-list');
  list.innerHTML = '';
  for (const item of SHOP_ITEMS) {
    const owned = !!ownedShop[item.id];
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.innerHTML = '<b>' + item.name + '</b> — ' + item.cost + ' pts<br><span>' + item.desc + '</span>';
    const b = document.createElement('button');
    b.textContent = owned ? 'OWNED' : 'Buy';
    b.disabled = owned || Game.points < item.cost;
    b.onclick = () => { if (shopBuy(item.id)) renderShop(); };
    div.appendChild(b);
    list.appendChild(div);
  }
}

function wireScreens() {
  el('btn-start').onclick = () => { renderBriefing(); showScreen('briefing'); };
  el('btn-fly').onclick = () => startRoutine(Game.routineId);
  el('btn-back-menu').onclick = () => { Game.mode = 'menu'; showScreen('menu'); };
  el('btn-shop').onclick = () => showScreen('shop');
  el('btn-shop-back').onclick = () => showScreen('menu');
  el('btn-again').onclick = () => startRoutine(Game.routineId);
  el('btn-change').onclick = () => { Game.mode = 'menu'; showScreen('menu'); };
  el('btn-results-shop').onclick = () => showScreen('shop');
  el('btn-results-menu').onclick = () => { Game.mode = 'menu'; showScreen('menu'); };
}
