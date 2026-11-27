// routines.js — the three routines and the flight flow:
// takeoff → figures → landing → results. Each routine flies six named
// figures at one venue, then lands on the runway for a scored touchdown.
const ROUTINES = [
  { id: 'precision', name: 'Precision', venue: 0,
    desc: 'Six classic figures, tight tolerances. The judges are strict.',
    figures: ['loop', 'aileron-roll', 'immelmann', 'split-s', 'hammerhead', 'chandelle'] },
  { id: 'freestyle', name: 'Freestyle', venue: 3,
    desc: 'Smoke, style and big shapes over the harbour at dusk.',
    figures: ['cuban-eight', 'barrel-roll', 'slow-roll', 'snap-roll', 'avalanche', 'rolling-circle'] },
  { id: 'crowd', name: 'Crowd Line', venue: 4,
    desc: 'Low, loud and close to the crowd — fly for the roar.',
    figures: ['lomcevak', 'tail-slide', 'torque-roll', 'knife-edge', 'vertical-eight', 'falling-leaf'] }
];

function routineById(id) { return ROUTINES.find((r) => r.id === id); }

// The results screen appears 2.6 s after the touchdown so the player
// sees the landing callout first. The timer is tracked so starting a
// new routine cancels it — otherwise the old timer fires mid-flight
// in the new routine and kicks the player to the results screen.
let resultsTimer = null;

function startRoutine(routineId) {
  if (resultsTimer) { clearTimeout(resultsTimer); resultsTimer = null; }
  const routine = routineById(routineId) || ROUTINES[0];
  Game.routineId = routine.id;
  Game.venueIdx = routine.venue;
  Game.runSeed = (Date.now() % 100000) | 0;
  Game.rng = mulberry32(Game.runSeed);
  resetPlane();
  Game.figureList = routine.figures.map(figureById);
  Game.rivalScores = simulateRivalScores(Game.runSeed);
  Game.ringLog = []; // per-ring diagnostic for the play-test
  Game.mode = 'flying';
  Game.phase = 'takeoff';
  Game.plane.x = venue().runway.x;
  Game.plane.z = 0;
  setCallout(venue().name.toUpperCase(), routine.name + '  •  ' + venue().tagline, 'venue', 3.5);
  showScreen('none');
}

function updateRoutine(dt) {
  if (Game.phase === 'figures') updateJudging(dt);
  if (Game.phase === 'landing') updateLanding(dt);
  // Slow crowd drift back toward the venue baseline.
  const base = venue().crowdBase;
  Game.crowd += (base - Game.crowd) * 0.004 * dt;
}

function beginLanding() {
  Game.phase = 'landing';
  const p = Game.plane;
  const rx = venue().runway.x;
  Game.landing = {
    x: rx, y: 2, z: p.z + 620,
    touchdown: null
  };
  setCallout('LANDING', 'Line up with the runway strip ahead — flare gently.', 'info', 3.5);
}

function updateLanding(dt) {
  const p = Game.plane;
  const L = Game.landing;
  if (!L) return;
  // Touchdown: plane reaches the ground near the runway.
  if (p.y <= 2.6 && p.airborne) {
    const dx = Math.abs(p.x - L.x);
    const vs = Math.abs(p.vspeed);
    const aligned = dx < 10;
    const soft = vs < 2.5;
    const speedOk = p.speed > 65 && p.speed < 115;
    const score = (aligned ? 4 : clamp(4 - (dx - 10) * 0.15, 0, 4))
      + (soft ? 3.5 : clamp(3.5 - (vs - 2.5) * 0.6, 0, 3.5))
      + (speedOk ? 2.5 : 1);
    L.touchdown = { dx, vs, speed: p.speed, score };
    p.onGround = true;
    p.airborne = false;
    p.y = 2;
    p.pitch = 0;
    p.roll = 0;
    p.bank = 0; p.bankTarget = 0;
    p.mroll = 0; p.mrollTarget = 0;
    finishRoutine(L.touchdown);
  }
}

function finishRoutine(touch) {
  Game.phase = 'done';
  const figTotal = Game.figureScores.reduce((s, f) => s + f.total, 0);
  const figMax = Game.figureScores.length * 10;
  const landScore = touch ? touch.score : 0;
  const crowdBonus = Game.crowd >= 80 ? 10 : Game.crowd >= 60 ? 5 : 0;
  const total = figTotal + landScore + crowdBonus;
  const maxTotal = figMax + 10 + 10;
  const pct = maxTotal ? total / maxTotal : 0;
  const stars = pct >= 0.88 ? 3 : pct >= 0.72 ? 2 : pct >= 0.55 ? 1 : 0;
  const points = Math.round(total * 10);
  Game.points += points;
  Game.stars = stars;
  Game.lastResult = {
    routine: routineById(Game.routineId),
    figTotal, figMax, landScore, crowdBonus, total, maxTotal, pct, stars, points,
    touch, rivals: Game.rivalScores
  };
  if (touch && touch.score >= 9) {
    setCallout('GREASED IT!', 'Touchdown ' + touch.vs.toFixed(1) + ' m/s  •  ' + touch.dx.toFixed(0) + ' m off centre', 'perfect', 3.5);
    setAnnounce(pickLine(Game.rng, 'landingGood'));
    cheer();
  } else if (touch) {
    setCallout('LANDED — ' + touch.score.toFixed(1) + ' / 10', 'Touchdown ' + touch.vs.toFixed(1) + ' m/s', 'good', 3);
    setAnnounce(pickLine(Game.rng, 'landingHard'));
  }
  // The timer only fires if the routine is still the one that just
  // finished — a new routine or a staged shot started in the meantime
  // must not be kicked to the results screen by a stale timer.
  resultsTimer = setTimeout(() => {
    if (Game.phase === 'done' && Game.mode === 'flying') { Game.mode = 'results'; showScreen('results'); }
  }, 2600);
}

function endRoutineEarly(reason) {
  if (Game.phase === 'done') return;
  Game.phase = 'done';
  Game.lastResult = {
    routine: routineById(Game.routineId),
    figTotal: Game.figureScores.reduce((s, f) => s + f.total, 0),
    figMax: Game.figureScores.length * 10,
    landScore: 0, crowdBonus: 0,
    total: 0, maxTotal: 1, pct: 0, stars: 0, points: 0,
    touch: null, rivals: Game.rivalScores, early: reason
  };
  Game.mode = 'results';
  showScreen('results');
}
