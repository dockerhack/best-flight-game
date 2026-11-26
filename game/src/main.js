// main.js — boot + screen flow + the routine engine. The game is a judged
// aerobatic championship: takeoff, fly the figures through the rings, land
// what you started, then the judges, the rivals and the shop.

import { CFG, VENUES, UPGRADES, ROUTINES, figureById } from './config.js';
import { makeRng } from './random.js';
import { keys, mouse, bindInput, readControls, consumeClick } from './input.js';
import { loadSave, storeSave } from './save.js';
import { newPlane, stepFlight, resetManeuver, upgradeBonus } from './flight.js';
import { maneuverOf, scoreFigure, landingVerdict } from './figures.js';
import { newTrail, updateSmoke } from './smoke.js';
import { buildVenue } from './venues.js';
import { newRivalState, rivalVenueScores, recordVenueRivals, standings } from './rivals.js';
import { venueVerdict } from './judges.js';
import { newCrowd, crowdReact, updateCrowd } from './crowd.js';
import { newParticles, burst, updateParticles } from './particles.js';
import { newFeel, callout, bigCallout, addShake, updateFeel } from './feel.js';
import { ensureAudio, engineSound, playBell, playCheer, playThud } from './audio.js';
import { createRenderer, render } from './render.js';
import { startLoop } from './fixed-step-loop.js';
import { screenClick } from './screens.js';
import { stageShot, isShotMode } from './shots.js';

const canvas = document.getElementById('game');
const renderer = createRenderer(canvas);
bindInput(canvas);
window.addEventListener('keydown', () => ensureAudio());
window.addEventListener('mousedown', () => ensureAudio());

const save = loadSave();

function newTour() {
  return {
    rivals: newRivalState(),
    upgrades: { engine: 0, smoke: 0, airframe: 0, prop: 0 },
    stars: [0, 0, 0, 0, 0],
    points: 0,
    venuesDone: 0,
  };
}

function newState() {
  const state = {
    screen: 'title',
    time: 0,
    venueIndex: 0,
    venue: null,
    gates: [],
    gateIndex: 0,
    phase: 'takeoff',
    plane: newPlane(),
    trail: newTrail(),
    particles: newParticles(),
    feel: newFeel(),
    crowd: newCrowd(40),
    score: { total: 0, figures: [], combo: 0, bestCombo: 0, stars: 0 },
    tour: newTour(),
    rng: makeRng(20261126),
    save,
    result: null,
    lastFigure: null,
    lastFigureId: '',
    routineTimeLeft: 0,
    freestyleCount: 0,
    rivalPlanes: null,
    mouse,
    prevPause: false,
  };
  state.venue = buildVenue(0, state.rng);
  state.gates = state.venue.gates;
  return state;
}

const state = newState();

// --- Venue setup ----------------------------------------------------------

function startVenue(i) {
  state.venueIndex = i;
  state.rng = makeRng(20261126 + i * 131);
  state.venue = buildVenue(i, state.rng);
  state.gates = state.venue.gates;
  state.gateIndex = 0;
  state.phase = 'takeoff';
  state.plane = newPlane();
  const bonus = upgradeBonus(state.tour.upgrades);
  state.plane.smokeFluid = bonus.smokeTank;
  state.trail = newTrail();
  state.particles = newParticles();
  state.feel = newFeel();
  state.crowd = newCrowd(state.venue.def.crowd);
  state.score = { total: 0, figures: [], combo: 0, bestCombo: 0, stars: 0 };
  state.result = null;
  state.lastFigure = null;
  state.lastFigureId = '';
  state.freestyleCount = 0;
  state.routineTimeLeft = state.venue.def.routine === 'freestyle' ? ROUTINES.freestyle.seconds : 0;
  state.rivalPlanes = null;
  state.screen = 'flying';
  callout(state.feel, state.venue.def.name, 'throttle up — ' + state.venue.def.sub);
}

// --- Scoring ---------------------------------------------------------------

function awardFigure(state, fig, m, deckBonus) {
  const result = scoreFigure(fig, state.plane, m, state.rng);
  let points = result.total;
  const clean = (result.verdict === 'PERFECT' || result.verdict === 'CLEAN') && state.plane.smokeOn;
  if (clean) {
    state.score.combo += 1;
    state.score.bestCombo = Math.max(state.score.bestCombo, state.score.combo);
  } else {
    state.score.combo = 0;
  }
  if (state.score.combo >= 3) points *= 2;
  if (deckBonus) points += deckBonus;
  state.score.total += points;
  state.score.figures.push({ name: fig.name, scores: result.scores, total: result.total });
  state.lastFigure = { name: fig.name, scores: result.scores, age: 0 };
  state.lastFigureId = fig.id;
  crowdReact(state.crowd, result.verdict, CFG.dt);
  if (state.score.combo >= 3) {
    bigCallout(state.feel, 'FULL SMOKE! ×' + state.score.combo + ' COMBO', result.callout);
    playCheer();
  } else {
    callout(state.feel, result.callout, deckBonus ? 'DECK BONUS +' + deckBonus.toFixed(1) : '');
  }
  if (result.verdict === 'PERFECT') playCheer();
  else playBell();
  // Best single figure this tour (max 30) — the line the title screen shows.
  if (result.total > (state.save.bestFigure || 0)) {
    state.save.bestFigure = result.total;
    state.save.bestLine = result.callout + ' ' + result.total.toFixed(1);
  }
  resetManeuver(state.plane);
  return result;
}

function resolveGate(state, gate) {
  const p = state.plane;
  const dx = p.x - gate.x;
  const dy = p.y - gate.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  gate.crossDist = Math.round(dist);
  if (dist <= gate.r) {
    gate.passed = true;
    const m = maneuverOf(p);
    let deckBonus = 0;
    if (gate.low) deckBonus = Math.max(0, (80 - p.y)) * 0.08;
    gate.result = awardFigure(state, gate.figure, m, deckBonus);
  } else {
    gate.passed = false;
    gate.result = null;
    state.score.combo = 0;
    callout(state.feel, 'MISSED THE RING', gate.figure.name + ' — the judges saw it');
    crowdReact(state.crowd, 'SLOPPY', CFG.dt);
    resetManeuver(state.plane);
  }
  state.gateIndex += 1;
  if (state.gateIndex >= state.gates.length) {
    state.phase = 'landing';
    callout(state.feel, 'LAST GATE — BRING HER HOME', 'runway ahead, flaps help');
  }
}

// Freestyle: any figure flown counts; variety pays, repeats halve.
function detectFreestyleFigure(state) {
  const p = state.plane;
  const pitchDeg = Math.abs(p.pitchTotal);
  const rollDeg = Math.abs(p.rollTotal);
  let fig = null;
  if (pitchDeg >= 540) fig = figureById('cuban-eight');
  else if (pitchDeg >= 300) fig = figureById(state.freestyleCount % 2 === 0 ? 'loop' : 'chandelle');
  else if (rollDeg >= 300) fig = figureById(state.freestyleCount % 2 === 0 ? 'aileron-roll' : 'barrel-roll');
  if (!fig) return;
  const m = { kind: fig.kind, deg: Math.max(pitchDeg, rollDeg) };
  // A repeat of the last figure pays half — capture the id BEFORE scoring,
  // because awardFigure overwrites lastFigureId.
  const prevFigureId = state.lastFigureId;
  const before = state.score.total;
  awardFigure(state, fig, m, 0);
  if (fig.id === prevFigureId && state.score.figures.length > 1) {
    state.score.total = before + (state.score.total - before) * 0.5;
  }
  state.freestyleCount += 1;
}

function resolveGround(state) {
  const p = state.plane;
  p.airborne = false;
  const h = state.venue.terrain.heightAt(p.x, p.z);
  const endRw = state.venue.terrain.runways[1];
  const onRunway = Math.abs(p.x - endRw.x) < 45 && p.z > endRw.z - 40 && p.z < endRw.z + endRw.len + 60;
  if (state.phase !== 'landing') {
    // Down early: the routine is cut short.
    const text = h > 5 ? 'INTO THE RIDGE!' : 'DITCHED IN THE LAGOON!';
    finishVenue(state, { verdict: 'CRASH', text, stars: 0 });
    return;
  }
  const verdict = landingVerdict(p, onRunway);
  if (verdict.verdict === 'CRASH') {
    // The ridge and the lagoon are different ends: name the right one.
    if (!onRunway && h <= 5) verdict.text = 'DITCHED IN THE LAGOON!';
    burst(state.particles, p, 'spark', 24);
    addShake(state.feel, 12);
    playThud();
    callout(state.feel, verdict.text, 'the crowd gasps');
  } else {
    if (verdict.verdict === 'GREASED') playCheer();
    else playThud();
    callout(state.feel, verdict.text, 'chocks in, engine off');
  }
  finishVenue(state, verdict);
}

function finishVenue(state, landing) {
  const figs = state.score.figures;
  const avg = figs.length
    ? figs.reduce((a, f) => a + f.total, 0) / figs.length / 3
    : 0;
  let stars = avg >= 8.5 ? 3 : avg >= 7 ? 2 : avg >= 5.5 ? 1 : 0;
  if (landing.verdict === 'GREASED') stars = Math.min(3, stars + 1);
  if (landing.verdict === 'CRASH') stars = 0;
  const points = Math.round(state.score.total) + stars * 5;
  state.tour.stars[state.venueIndex] = stars;
  state.tour.points += points;
  state.tour.venuesDone += 1;
  const rivals = rivalVenueScores(state.rng);
  recordVenueRivals(state.tour.rivals, rivals, avg);
  state.save.unlocked = Math.max(state.save.unlocked || 1, Math.min(5, state.venueIndex + 2));
  state.save.bestTotal = Math.max(state.save.bestTotal || 0, state.tour.rivals.playerTotal);
  storeSave(state.save);
  state.result = {
    figures: figs,
    landing,
    stars,
    points,
    standings: standings(state.tour.rivals),
    quote: venueVerdict(avg) + ' ' + state.venue.def.line,
    lastVenue: state.venueIndex >= VENUES.length - 1,
  };
  state.phase = 'done';
  state.screen = 'venueComplete';
}

// --- Demo autopilot for the title screen -----------------------------------

function demoCtl(state) {
  const p = state.plane;
  return {
    pitch: Math.max(-1, Math.min(1, (260 - p.y) / 120 + Math.sin(state.time * 0.5) * 0.3)),
    roll: Math.sin(state.time * 0.23) * 0.5,
    throttleUp: p.throttle < 0.75,
    throttleDown: false,
    smoke: Math.floor(state.time / 8) % 2 === 0,
    flaps: false,
    pause: false,
  };
}

// --- The update ------------------------------------------------------------

export function updateGame(st, ctl, dt) {
  st.time += dt;
  updateFeel(st.feel, dt);
  updateParticles(st.particles, dt);
  updateCrowd(st.crowd, dt);
  if (st.lastFigure) st.lastFigure.age += dt;

  if (st.screen === 'title') {
    // The tour idles behind the title: a demo biplane drawing smoke.
    const events = [];
    stepFlight(st.plane, demoCtl(st), st.tour.upgrades, { wind: 2, gusts: 1, wobble: 0 }, dt, events);
    updateSmoke(st.trail, st.plane, st.venue.def, dt);
    const click = consumeClick();
    if (click) screenClick(st, click.x, click.y, actions);
    if (keys.Enter) {
      keys.Enter = false;
      actions.startVenue(0);
    }
    return;
  }
  if (st.screen === 'howto' || st.screen === 'venueComplete' || st.screen === 'gameOver') {
    const click = consumeClick();
    if (click) screenClick(st, click.x, click.y, actions);
    return;
  }
  if (st.screen === 'paused') {
    if (ctl.pause && !st.prevPause) st.screen = 'flying';
    st.prevPause = ctl.pause;
    const click = consumeClick();
    if (click) screenClick(st, click.x, click.y, actions);
    return;
  }
  if (st.screen !== 'flying') return;

  // Pause on the rising edge of P.
  if (ctl.pause && !st.prevPause) {
    st.screen = 'paused';
    st.prevPause = ctl.pause;
    return;
  }
  st.prevPause = ctl.pause;

  const p = st.plane;
  const wasAirborne = p.airborne;
  const events = [];
  const env = { wind: st.venue.def.wind, gusts: st.venue.def.gusts, wobble: st.rng.wobble() };
  const status = stepFlight(p, ctl, st.tour.upgrades, env, dt, events);
  updateSmoke(st.trail, p, st.venue.def, dt);
  engineSound(p.throttle, p.speed, p.airborne);

  for (const ev of events) {
    if (ev.type === 'takeoff') {
      st.phase = 'routine';
      bigCallout(st.feel, 'AIRBORNE!', 'gear up — the routine is on');
    } else if (ev.type === 'overg') {
      callout(st.feel, 'OVER G! ' + ev.g.toFixed(1) + ' G', 'the airframe complains');
      burst(st.particles, p, 'spark', 10);
      addShake(st.feel, 6);
      if (p.overGStrikes >= 3) {
        finishVenue(st, { verdict: 'CRASH', text: 'GROUNDED — three over-G strikes', stars: 0 });
        return;
      }
    } else if (ev.type === 'dry') {
      callout(st.feel, ev.text, '');
    }
  }

  if (p.damage >= 100) {
    finishVenue(st, { verdict: 'CRASH', text: 'AIRFRAME GAVE OUT', stars: 0 });
    return;
  }

  // Touchdown.
  if (wasAirborne && status === 'ground' && p.y <= 0) {
    resolveGround(st);
    return;
  }

  if (st.phase === 'routine' || st.phase === 'landing') {
    if (st.venue.def.routine === 'freestyle') {
      if (st.phase === 'routine') {
        st.routineTimeLeft -= dt;
        detectFreestyleFigure(st);
      }
      if (st.routineTimeLeft <= 0 && st.phase === 'routine') {
        st.phase = 'landing';
        callout(st.feel, 'TIME! BRING HER HOME', 'freestyle over — land the routine');
      }
    } else if (st.gateIndex < st.gates.length) {
      const gate = st.gates[st.gateIndex];
      if (p.z >= gate.z) resolveGate(st, gate);
    }
  }
}

// --- Screen actions ---------------------------------------------------------

const actions = {
  startVenue(i) {
    if (i > 0 && i >= (state.save.unlocked || 1)) return;
    startVenue(i);
  },
  showHowto() {
    state.screen = 'howto';
  },
  showTitle() {
    state.screen = 'title';
    state.plane = newPlane();
    state.plane.y = 260;
    state.plane.speed = 95;
    state.plane.throttle = 0.7;
    state.plane.airborne = true;
    state.trail = newTrail();
    state.venue = buildVenue(state.venueIndex, state.rng);
    state.gates = state.venue.gates;
    state.gateIndex = 0;
  },
  resume() {
    state.screen = 'flying';
  },
  restartVenue() {
    startVenue(state.venueIndex);
  },
  buyUpgrade(id) {
    const u = UPGRADES.find((x) => x.id === id);
    if (!u) return;
    const level = state.tour.upgrades[id] || 0;
    if (level >= u.max) return;
    const cost = u.cost * (level + 1);
    if (state.tour.points < cost) return;
    state.tour.points -= cost;
    state.tour.upgrades[id] = level + 1;
    callout(state.feel, u.name + ' — LEVEL ' + (level + 1), 'fitted for the next venue');
  },
  nextVenue() {
    if (state.venueIndex >= VENUES.length - 1) {
      state.screen = 'gameOver';
      storeSave(state.save);
    } else {
      startVenue(state.venueIndex + 1);
    }
  },
  playAgain() {
    state.tour = newTour();
    state.screen = 'title';
    actions.showTitle();
  },
};

// --- Boot -------------------------------------------------------------------

// Title backdrop: the demo plane is already airborne over venue 1.
state.plane.y = 260;
state.plane.speed = 95;
state.plane.throttle = 0.7;
state.plane.airborne = true;

const api = {
  startVenue,
  updateGame,
  render(s) {
    render(renderer, s);
  },
};

// Exposed for play-testing and screenshots only: the live game state.
window.__game = state;

if (isShotMode()) {
  stageShot(state, api);
} else {
  startLoop(
    (dt) => updateGame(state, readControls(), dt),
    () => render(renderer, state),
  );
}
