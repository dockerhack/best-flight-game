// shots.js — ?shot= staging. Each shot plays the REAL rules forward from a
// fresh world with a simple autopilot, paints twice and sets
// window.__shotReady. Deterministic: ?seed=N fixes every random draw, so
// the same URL renders the same frame every time.

import { CFG, FIGURES } from './config.js';
import { makeRng } from './random.js';
import { scoreFigure } from './figures.js';
import { routineGates } from './venues.js';
import { seedLoopRibbon } from './smoke.js';
import { rivalVenueScores } from './rivals.js';
import { venueVerdict } from './judges.js';
import { ANNOUNCER } from './config.js';

export function shotParams() {
  try {
    const q = new URLSearchParams(window.location.search);
    return { shot: q.get('shot') || '', seed: parseInt(q.get('seed') || '7', 10) || 7 };
  } catch (e) {
    return { shot: '', seed: 7 };
  }
}

export function isShotMode() {
  return !!shotParams().shot;
}

// Run the real update loop with scripted controls for `seconds`, or until
// stopFn(state) is true. The autopilot is a test/staging driver, not game
// code: it flies the same update the player does.
function autopilot(api, state, seconds, ctlFn, stopFn) {
  const steps = Math.round(seconds / CFG.dt);
  if (!state.trace) state.trace = [];
  for (let i = 0; i < steps; i++) {
    const ctl = ctlFn(i * CFG.dt, state);
    api.updateGame(state, ctl, CFG.dt);
    if (i % 30 === 0) {
      const p = state.plane;
      state.trace.push({
        t: +(i * CFG.dt).toFixed(1),
        x: Math.round(p.x), y: +p.y.toFixed(2), z: Math.round(p.z),
        speed: Math.round(p.speed), pitch: +p.pitch.toFixed(2),
        heading: +p.heading.toFixed(2), gate: state.gateIndex, phase: state.phase,
        ctlPitch: +ctl.pitch.toFixed(2), thrUp: !!ctl.throttleUp, thrDown: !!ctl.throttleDown,
      });
    }
    if (state.screen !== 'flying') break;
    if (stopFn && stopFn(state)) break;
  }
}

// Aim the nose at the next gate: pursuit guidance. The desired pitch is the
// line-of-sight angle to the ring; the stick corrects the pitch ERROR, so
// the plane levels off as it arrives instead of looping past the gate.
// The roll steers the heading onto the gate the same way.
function aimAtGate(t, state) {
  const g = state.gates[state.gateIndex];
  const p = state.plane;
  if (!g) return { pitch: 0, roll: 0, throttleUp: true, throttleDown: false, smoke: true, flaps: false, pause: false };
  const dx = g.x - p.x;
  const dy = g.y - p.y;
  const dz = Math.max(30, g.z - p.z);
  // Line-of-sight pitch, clamped: when the ring is close in z but far in
  // height, the right answer is a gentle descent, never a vertical dive.
  const desiredPitch = Math.max(-0.45, Math.min(0.6, Math.atan2(dy, Math.max(120, dz))));
  const pitchErr = desiredPitch - p.pitch;
  // Lead the target, but only from far out: aim at a point 120 m beyond
  // the ring while it is distant, then HOLD the line inside 250 m and fly
  // straight through. Pure pursuit all the way in steers harder the closer
  // the plane gets, and the laggy turn response overshoots into a weave;
  // aiming 300 m beyond it instead never closes the gap in time.
  const desiredHeading = dz > 250 ? Math.atan2(dx, dz + 120) : p.heading;
  let headingErr = desiredHeading - p.heading;
  while (headingErr > Math.PI) headingErr -= Math.PI * 2;
  while (headingErr < -Math.PI) headingErr += Math.PI * 2;
  // Bank damping: without it the wing stays banked after the heading
  // closes and the plane spirals past the target.
  // Speed discipline: the rings come every 560 m, and at full throttle
  // (127 m/s) the turn authority is tiny and the gates arrive every 4 s.
  // Eighty metres a second gives seven seconds a gate and a real turn.
  // Bank cap: a hard bank at 85 m/s turns the nose faster than the
  // controller can unwind it, and the plane weaves across the course
  // with growing amplitude. Half a radian of bank is plenty to steer.
  let roll = Math.max(-0.8, Math.min(0.8, headingErr * 1.7 - p.bank * 1.5));
  if (p.bank > 0.6) roll = Math.min(roll, -0.4);
  if (p.bank < -0.6) roll = Math.max(roll, 0.4);
  return {
    pitch: Math.max(-1, Math.min(1, pitchErr * 2.2)),
    roll,
    throttleUp: p.speed < 70,
    throttleDown: p.speed > 78,
    smoke: true, flaps: false, pause: false,
  };
}

export function stageShot(state, api) {
  const { shot, seed } = shotParams();
  // The URL seed drives every random draw in the shot: same URL, same frame.
  state.rng = makeRng(seed * 7919 + 13);

  if (shot === 'cover') {
    // Chase view mid-loop over Teluk Arunika at dawn: the biplane inverted
    // at the top of a loop, gold smoke tracing it, ring ahead, strip below.
    api.startVenue(0);
    state.plane.throttle = 0.85;
    state.plane.speed = 95;
    state.plane.y = 240;
    state.plane.airborne = true;
    state.phase = 'routine';
    state.plane.smokeOn = true;
    // Fly the loop for real: full back-stick for 2.6 s puts the plane at
    // the top, inverted, with the smoke arc drawn behind it.
    autopilot(api, state, 2.6, () => ({
      pitch: 1, roll: 0, throttleUp: false, throttleDown: false,
      smoke: true, flaps: false, pause: false,
    }));
    // The full loop ribbon behind the plane, seeded from the real trail.
    seedLoopRibbon(state.trail, state.plane, state.venue.def, 55);
    state.feel.callouts = [{ text: 'PERFECT LOOP!', sub: 'the crowd is on its feet', age: 0, life: 10 }];
    state.lastFigure = { name: 'Loop', scores: [9.2, 9.5, 9.0], age: 0 };
    state.rivalPlanes = [{ x: 260, y: 320, z: 900, color: '#e8b23a', bank: 0.3, label: 'ELANG 9.1' }];
  } else if (shot === 'precision') {
    // Precision at Kawah Merapi: thread a ring, judges' scores in frame.
    api.startVenue(1);
    state.plane.throttle = 1;
    state.plane.speed = 100;
    state.plane.y = 200;
    state.plane.airborne = true;
    // The phase flips to 'routine' only on the real takeoff event, and
    // gates only resolve in the routine phase — a mid-air stage must set
    // it by hand or the plane flies straight through every ring.
    state.phase = 'routine';
    // Fly gate 0 (hammerhead) with the aiming autopilot, then a full loop
    // into gate 1 (loop) with smoke on — the real scorer judges it. Stop
    // the moment gate 1 resolves, while the loop's callout and the judges'
    // scores are still fresh in frame; the next ring reads ahead. The
    // budget is 20 s because the loop itself eats 4–5 s of it.
    autopilot(api, state, 20, (t) => {
      if (state.gateIndex === 0) return aimAtGate(t, state);
      if (state.gateIndex === 1 && Math.abs(state.plane.pitchTotal) < 330) {
        return { pitch: 1, roll: 0, throttleUp: true, throttleDown: false, smoke: true, flaps: false, pause: false };
      }
      return aimAtGate(t, state);
    }, (s) => s.gateIndex >= 2);
    if (!state.lastFigure) {
      state.lastFigure = { name: 'Loop', scores: [9.2, 9.5, 9.0], age: 0 };
      state.feel.callouts = [{ text: 'PERFECT LOOP!', sub: 'Pak Darma nods. Twice.', age: 0, life: 10 }];
    }
  } else if (shot === 'freestyle') {
    // Freestyle at Pelabuhan Senja (dusk): a Cuban eight in magenta smoke,
    // crowd maxed, rivals in the distance. Venue 4's routine is the crowd
    // line, so the shot restages it as freestyle: same harbour, same dusk,
    // the freestyle gates and timer instead.
    api.startVenue(3);
    state.venue.def = { ...state.venue.def, routine: 'freestyle' };
    state.gates = routineGates(state.venue.def, 3, state.rng);
    state.routineTimeLeft = 90;
    state.plane.throttle = 0.9;
    state.plane.speed = 95;
    state.plane.y = 260;
    state.plane.airborne = true;
    state.phase = 'routine';
    // Loop, roll, loop: three figures with smoke on for the FULL SMOKE combo.
    autopilot(api, state, 12, (t) => {
      if (t < 5.2) return { pitch: 1, roll: 0, throttleUp: true, throttleDown: false, smoke: true, flaps: false, pause: false };
      if (t < 6.6) return { pitch: 0, roll: 1, throttleUp: false, throttleDown: false, smoke: true, flaps: false, pause: false };
      return { pitch: 1, roll: 0, throttleUp: true, throttleDown: false, smoke: true, flaps: false, pause: false };
    });
    // Frame the shot: point the nose at the next ring so it reads ahead.
    const g = state.gates[state.gateIndex];
    if (g) {
      state.plane.heading = Math.atan2(g.x - state.plane.x, Math.max(30, g.z - state.plane.z));
      state.plane.bank = 0;
    }
    // The smoke from the flown figures trails behind the camera, so seed
    // a magenta loop ribbon below the plane — the same trick as the cover —
    // so the smoke that drew the figures is visible in frame.
    seedLoopRibbon(state.trail, state.plane, state.venue.def, 55);
    state.crowd.meter = 94;
    state.crowd.cheering = 2;
    state.score.combo = 3;
    state.score.bestCombo = 3;
    state.feel.callouts = [{ text: 'FULL SMOKE! ×3 COMBO', sub: 'the harbour roars', age: 0, life: 10 }];
    state.rivalPlanes = [
      { x: -220, y: 300, z: 1100, color: '#ff5a7a', bank: -0.4, label: 'SARI' },
      { x: 300, y: 240, z: 1500, color: '#4fd2ff', bank: 0.5, label: 'BIMO' },
    ];
  } else if (shot === 'full') {
    // Play-test staging: a whole venue through the real rules — takeoff,
    // every gate, then the landing. Not a screenshot; the play-test reads
    // window.__game afterwards and asserts venueComplete with 6 figures.
    api.startVenue(0);
    state.plane.throttle = 1;
    state.plane.speed = 0;
    autopilot(api, state, 120, (t) => {
      const p = state.plane;
      if (!p.airborne) {
        // Takeoff roll: full throttle, rotate once fast enough.
        return { pitch: p.speed > 55 ? 1 : 0, roll: 0, throttleUp: true, throttleDown: false, smoke: false, flaps: false, pause: false };
      }
      if (state.phase === 'landing') {
        // Final: descend toward 25 m while far out, shallow glide on
        // final, flare under 12 m. Flaps out, throttle back to ~52 m/s.
        const rw = state.venue.terrain.runways[1];
        const distToRw = rw.z - p.z;
        // Desired pitch ANGLE (not stick): a shallow glide far out, then
        // a steady -0.10 on final all the way to the ground. No flare
        // switch near the deck: a flare threshold is a switching surface
        // the slow pitch actuator chatters on, and the plane floats at
        // 6 m forever. -0.10 at 52 m/s is a -5 m/s touchdown: BOUNCED.
        let desiredPitch;
        if (distToRw > 250) desiredPitch = Math.max(-0.35, Math.min(0.3, (25 - p.y) / 150));
        else desiredPitch = -0.10;
        const pitch = Math.max(-1, Math.min(1, (desiredPitch - p.pitch) * 2.2));
        let rwHeadingErr = Math.atan2(rw.x - p.x, Math.max(30, distToRw) + 200) - p.heading;
        while (rwHeadingErr > Math.PI) rwHeadingErr -= Math.PI * 2;
        while (rwHeadingErr < -Math.PI) rwHeadingErr += Math.PI * 2;
        let roll = Math.max(-0.8, Math.min(0.8, rwHeadingErr * 1.4 - p.bank * 1.5));
        if (p.bank > 0.6) roll = Math.min(roll, -0.4);
        if (p.bank < -0.6) roll = Math.max(roll, 0.4);
        return { pitch, roll, throttleUp: p.speed < 50, throttleDown: p.speed > 58, smoke: false, flaps: true, pause: false };
      }
      // Climb to loop altitude before the first gate: a loop needs a full
      // diameter of sky under it, never flown from the deck. Hold a ~57°
      // climb (not full stick) so the nose never goes vertical.
      if (state.gateIndex === 0 && p.y < 200 && Math.abs(p.pitchTotal) < 100) {
        return { pitch: Math.max(-1, Math.min(1, (1.0 - p.pitch) * 2)), roll: 0, throttleUp: true, throttleDown: false, smoke: false, flaps: false, pause: false };
      }
      const g = state.gates[state.gateIndex];
      if (!g) return aimAtGate(t, state);
      const distZ = g.z - p.z;
      // Loop before the loop gate so the figure is really flown. Capped
      // near 90 m/s: the loop radius is speed over pitch rate, and a
      // 127 m/s loop is 200 m across — wider than the sky under it.
      if (g.figure.id === 'loop' && distZ < 500 && distZ > 60 && Math.abs(p.pitchTotal) < 330 && p.y > 160) {
        return { pitch: 1, roll: 0, throttleUp: p.speed < 90, throttleDown: p.speed > 95, smoke: true, flaps: false, pause: false };
      }
      return aimAtGate(t, state);
    });
  } else if (shot === 'venue') {
    // Venue-complete results screen: stars, judges' verdicts per figure,
    // rival standings, unlocked venue, upgrade shop, announcer quote.
    api.startVenue(0);
    const figs = ['loop', 'aileron-roll', 'hammerhead', 'immelmann', 'cuban-eight', 'split-s'];
    const fakePlane = { speed: 92, smokeOn: true, smokeFluid: 60, maxBank: 0.3 };
    const figures = figs.map((fid) => {
      const fig = FIGURES.find((f) => f.id === fid);
      const m = { kind: fig.kind, deg: 340 };
      const r = scoreFigure(fig, fakePlane, m, state.rng);
      return { name: fig.name, scores: r.scores, total: r.total };
    });
    const avg = figures.reduce((a, f) => a + f.total, 0) / figures.length / 3;
    const rivals = rivalVenueScores(state.rng);
    state.score.total = figures.reduce((a, f) => a + f.total, 0);
    state.result = {
      figures,
      landing: { verdict: 'GREASED', text: 'GREASED IT!', stars: 1 },
      stars: 3,
      points: 62,
      standings: [
        { name: 'YOU', tag: 'the challenger', total: Math.round(avg * 10) / 10, you: true, color: '#ffd23f' },
        ...rivals.map((r) => ({ name: r.name, tag: '', total: r.score, you: false, color: '#fff' })),
      ].sort((a, b) => b.total - a.total),
      quote: venueVerdict(avg) + ' ' + state.venue.def.line,
      lastVenue: false,
    };
    state.tour.points = 62;
    state.screen = 'venueComplete';
    // No stray callouts over the results panel (startVenue leaves one).
    state.feel.callouts = [];
  }

  // Paint twice (the starter's pattern) and signal the harness.
  api.render(state);
  api.render(state);
  window.__shotReady = true;
}
