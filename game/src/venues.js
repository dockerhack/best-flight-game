// venues.js — venue defs, weather and the gate layout for each routine.
// A venue is a leg of the tour: its light, its wind, its smoke colour and
// the gates the routine flies. Gates sit on the course line at increasing
// distance, each one carrying the figure the judges want to see.

import { VENUES, FIGURES, ROUTINES, figureById } from './config.js';
import { buildTerrain } from './terrain.js';

// The six-figure precision set per venue — a different programme each leg so
// no two venue screenshots repeat the same figure list.
const PRECISION_SETS = [
  ['loop', 'aileron-roll', 'hammerhead', 'immelmann', 'cuban-eight', 'split-s'],
  ['hammerhead', 'loop', 'vertical-roll', 'half-cuban', 'barrel-roll', 'stall-turn'],
  ['cuban-eight', 'snap-roll', 'loop', 'knife-edge', 'chandelle', 'lazy-eight'],
  ['aileron-roll', 'immelmann', 'loop', 'barrel-roll', 'hammerhead', 'split-s'],
  ['loop', 'cuban-eight', 'hammerhead', 'vertical-roll', 'immelmann', 'lomcevak'],
];

const CROWD_SETS = [
  ['chandelle', 'lazy-eight', 'split-s', 'aileron-roll', 'loop'],
];

export function venueDef(i) {
  return VENUES[i % VENUES.length];
}

export function buildVenue(i, rng) {
  const def = venueDef(i);
  const terrain = buildTerrain(def.seed, def);
  const gates = routineGates(def, i, rng);
  return { def, terrain, gates, index: i };
}

// Gates for the venue's routine. Precision: 6 rings, one figure each, at
// rising altitudes so the routine climbs, turns and dives. Freestyle: 4
// bonus rings, the figures are the pilot's choice. Crowd line: 5 low banner
// gates over the water, hugging the deck.
export function routineGates(def, venueIndex, rng) {
  const gates = [];
  if (def.routine === 'precision') {
    const set = PRECISION_SETS[venueIndex % PRECISION_SETS.length];
    const alts = [180, 260, 320, 240, 300, 200];
    // A gentle slalom: the rings swing across the course line, but no two
    // consecutive rings demand more lateral swing than the biplane can
    // turn at routine speed. A course no one can fly is not a challenge.
    const xs = [-30, 40, -50, 60, -35, 55];
    set.forEach((fid, k) => {
      gates.push({
        x: xs[k],
        y: alts[k] + (def.id === 'merapi' ? 60 : 0),
        z: 500 + k * 560,
        r: 46,
        figure: figureById(fid),
        passed: false,
        result: null,
      });
    });
  } else if (def.routine === 'freestyle') {
    const figs = ['cuban-eight', 'loop', 'barrel-roll', 'lomcevak'];
    const xs = [50, -65, 55, -75];
    figs.forEach((fid, k) => {
      gates.push({
        x: xs[k],
        y: 220 + k * 40,
        z: 600 + k * 700,
        r: 48,
        figure: figureById(fid),
        passed: false,
        result: null,
        bonus: true,
      });
    });
  } else {
    const set = CROWD_SETS[0];
    const xs = [25, -35, 30, -40, 35];
    set.forEach((fid, k) => {
      gates.push({
        x: xs[k],
        y: 34 + k * 6,
        z: 500 + k * 620,
        r: 44,
        figure: figureById(fid),
        passed: false,
        result: null,
        low: true,
      });
    });
  }
  return gates;
}

export function routineDef(def) {
  return ROUTINES[def.routine];
}

// The next-venue preview line, the ROLLING BOIL "NEXT STOP" pattern.
export function nextVenueLine(def) {
  return 'NEXT STOP — ' + def.next.toUpperCase();
}

export function venueById(id) {
  return VENUES.find((v) => v.id === id) || VENUES[0];
}
