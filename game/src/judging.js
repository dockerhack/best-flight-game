// judging.js — ring-pass detection and the three judges.
// A figure is flown by passing its rings in order. Each ring records how
// centred the plane was; the judges then score line (Pak Darma), smoothness
// (Bu Lestari) and smoke/showmanship (Koh Hendra). The crowd meter only
// celebrates when it actually agrees — no cheering banner over a
// murmuring crowd.
function currentFigure() {
  if (Game.figureIdx >= Game.figureList.length) return null;
  return Game.figureList[Game.figureIdx];
}

function currentRing() {
  if (Game.ringIdx >= Game.rings.length) return null;
  return Game.rings[Game.ringIdx];
}

function startFigure(idx) {
  const fig = Game.figureList[idx];
  if (!fig) return;
  const p = Game.plane;
  // Rings are built relative to where the plane actually is — a figure
  // starting 150 m above a plane that just took off is un-flyable.
  const origin = { x: p.x, y: p.y, z: p.z + 150 };
  let rings = fig.rings(origin).map((r) => ({ ...r, passed: false, center: null }));
  // Lift the whole figure if any ring would sit below a safe altitude.
  let minY = Infinity;
  for (const r of rings) minY = Math.min(minY, r.y);
  if (minY < 15) {
    const lift = 15 - minY;
    for (const r of rings) r.y += lift;
  }
  Game.rings = rings;
  Game.ringIdx = 0;
  Game.figureRoll = 0;
  Game.figureStart = { fuel: Game.fuel, damage: Game.damage, gSum: 0, gN: 0, smokeTime: 0, bankTime: 0, startTime: Game.time };
  Game.stats.ringsTotal += Game.rings.length;
  setCallout(fig.name.toUpperCase(), fig.blurb + '  •  Target ' + fig.speed + ' kt', 'figure', 3.2);
  beep(520, 0.12, 'triangle', 0.07);
}

function updateJudging(dt) {
  const p = Game.plane;
  const fig = currentFigure();
  if (!fig || Game.phase !== 'figures') return;

  // Track smoothness inputs and roll progress.
  const fs = Game.figureStart;
  if (fs) {
    fs.gSum += Math.abs(p.g - 1);
    fs.gN += 1;
    if (Game.smokeOn) fs.smokeTime += dt;
    if (Math.abs(Math.abs(p.roll) - Math.PI / 2) < 0.3) fs.bankTime += dt;
  }
  Game.figureRoll += Math.abs(normAngle(p.mroll - (Game._prevMroll ?? p.mroll)));
  Game._prevMroll = p.mroll;

  const ring = currentRing();
  if (!ring) {
    finishFigure();
    return;
  }
  // Ring passed when the plane's z crosses the ring plane.
  if (p.z >= ring.z - 1) {
    const dx = p.x - ring.x, dy = p.y - ring.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= ring.r) {
      ring.passed = true;
      ring.center = clamp(1 - dist / ring.r, 0, 1);
      Game.stats.ringsHit += 1;
      ringChime();
    } else {
      ring.passed = false;
      ring.center = 0;
    }
    // Diagnostic log for the play-test: where was the plane when each
    // ring was judged? (Read by __game.state().)
    (Game.ringLog = Game.ringLog || []).push({
      fig: fig.name, idx: Game.ringIdx,
      dx: +dx.toFixed(1), dy: +dy.toFixed(1), dist: +dist.toFixed(1),
      hit: ring.passed, px: +p.x.toFixed(0), py: +p.y.toFixed(0), pz: +p.z.toFixed(0),
      rx: +ring.x.toFixed(0), ry: +ring.y.toFixed(0), rz: +ring.z.toFixed(0),
      hdg: +p.heading.toFixed(2), pitch: +p.pitch.toFixed(2), bank: +p.bank.toFixed(2)
    });
    Game.ringIdx += 1;
    if (Game.ringIdx >= Game.rings.length) finishFigure();
  }
}

function rollDemandMet(fig) {
  if (!fig.roll) return true;
  const r = Game.figureRoll;
  if (fig.roll === 'roll360' || fig.roll === 'roll360fast') return r >= TAU * 0.8;
  if (fig.roll === 'roll360slow') return r >= TAU * 0.8;
  if (fig.roll === 'roll180') return r >= Math.PI * 0.75;
  if (fig.roll === 'bank90') return (Game.figureStart?.bankTime || 0) > 1.2;
  return true;
}

function finishFigure() {
  const fig = currentFigure();
  const fs = Game.figureStart;
  const rings = Game.rings;
  let centerSum = 0, hit = 0;
  for (const r of rings) { if (r.passed) { centerSum += r.center; hit += 1; } }
  const centerAvg = rings.length ? centerSum / rings.length : 0;
  const hitRate = rings.length ? hit / rings.length : 0;

  const avgGDev = fs && fs.gN ? fs.gSum / fs.gN : 0;
  const smooth = clamp(1 - avgGDev * 0.35 - (Game.damage - fs.damage) * 0.03, 0, 1);
  // Smoke fraction is measured against the figure's own duration — the
  // old denominator (rings × 2.2 s) was ~4× longer than a short figure
  // actually takes, so smoke could never score above ~0.25.
  const figDur = fs ? Math.max(1, Game.time - fs.startTime) : 1;
  const smokeFrac = fs ? clamp(fs.smokeTime / figDur, 0, 1) : 0;
  const rollOk = rollDemandMet(fig) ? 1 : 0.55;

  const darma = clamp(centerAvg * 10 * (0.7 + 0.3 * hitRate), 0, 10);
  const lestari = clamp(smooth * 10, 0, 10);
  const hendra = clamp(smokeFrac * 8 + rollOk * 2, 0, 10);
  const total = darma * 0.4 + lestari * 0.35 + hendra * 0.25;

  Game.figureScores.push({ figure: fig, darma, lestari, hendra, total });
  Game.judgesChip = {
    name: fig.name, darma, lestari, hendra, total,
    until: Game.time + 4.5
  };

  // Crowd reacts to the flying, not to the banner.
  if (total >= 9) {
    Game.crowd = clamp(Game.crowd + 9, 0, 100);
    Game.stats.perfect += 1;
  } else if (total >= 7.5) {
    Game.crowd = clamp(Game.crowd + 4, 0, 100);
  } else if (total >= 6) {
    Game.crowd = clamp(Game.crowd + 1, 0, 100);
  } else {
    Game.crowd = clamp(Game.crowd - 4, 0, 100);
  }

  // Callout is the figure and its score — neutral. The announcer line
  // carries any celebration, and only when the crowd is actually roaring.
  const scoreText = total.toFixed(1) + ' / 10';
  if (total >= 9) {
    setCallout(fig.name.toUpperCase() + ' — ' + scoreText, 'Darma ' + darma.toFixed(1) + '  •  Lestari ' + lestari.toFixed(1) + '  •  Hendra ' + hendra.toFixed(1), 'perfect', 3.0);
    if (Game.crowd >= 80) {
      setAnnounce(pickLine(Game.rng, 'figurePerfect'));
      cheer();
    } else {
      setAnnounce('Mbak Rani: A perfect figure — the judges loved it.');
    }
  } else if (total >= 7) {
    setCallout(fig.name.toUpperCase() + ' — ' + scoreText, 'Darma ' + darma.toFixed(1) + '  •  Lestari ' + lestari.toFixed(1) + '  •  Hendra ' + hendra.toFixed(1), 'good', 2.6);
    setAnnounce(pickLine(Game.rng, 'figureGood'));
  } else {
    setCallout(fig.name.toUpperCase() + ' — ' + scoreText, 'The judges want a cleaner line.', 'weak', 2.6);
    setAnnounce(pickLine(Game.rng, 'figureWeak'));
  }

  Game.figureIdx += 1;
  if (Game.figureIdx >= Game.figureList.length) {
    beginLanding();
  } else {
    startFigure(Game.figureIdx);
  }
}
