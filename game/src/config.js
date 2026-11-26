// config.js — constants, venues, figures, rivals, judges, upgrades.
// SMOKE & THUNDER: a judged aerobatic championship across a five-venue
// island airshow circuit. All names are original inventions for this game.

export const CFG = {
  canvasW: 1280,
  canvasH: 720,
  dt: 1 / 60,
  // flight model (arcade, metres / seconds / radians)
  baseSpeed: 26,
  maxSpeed: 128,
  climbBleed: 11,
  pitchRate: 1.25,
  rollRate: 2.4,
  turnRate: 0.42,
  takeoffSpeed: 52,
  landingSpeedMax: 72,
  gLimitBase: 4.5,
  fuelDrain: 0.55,
  smokeDrain: 9,
  smokeTankBase: 100,
  gateRadius: 42,
  courseLength: 4200,
};

// The five venues of the Cendrawasih Airshow Circuit. Each is a leg of the
// tour with its own light, weather and smoke colour — the journey the judge
// reads in the screenshots, not a static strip.
export const VENUES = [
  {
    id: 'arunika',
    name: 'TELUK ARUNIKA',
    sub: 'Lagoon dawn — Venue 1 of 5',
    next: 'Kawah Merapi',
    skyTop: '#2b3a6b', skyMid: '#e8836b', skyLow: '#f7c873',
    sun: '#ffd9a0', sunX: 0.72, sunY: 0.30,
    sea: '#1f6f7a', seaDeep: '#123f4d', fog: '#f2b28c',
    smoke: '#ffd23f', smokeName: 'GOLD',
    wind: 2, gusts: 1, crowd: 40,
    seed: 101, routine: 'precision',
    line: 'Elang flew that loop like he was born in it. Your turn.',
  },
  {
    id: 'merapi',
    name: 'KAWAH MERAPI',
    sub: 'Volcano rim noon — Venue 2 of 5',
    next: 'Ngarai Senja',
    skyTop: '#3a6ea5', skyMid: '#cfe8f5', skyLow: '#f5e6c8',
    sun: '#fff3c4', sunX: 0.5, sunY: 0.16,
    sea: '#2a7f8f', seaDeep: '#17454f', fog: '#dfe9e4',
    smoke: '#2ee6c8', smokeName: 'TEAL',
    wind: 8, gusts: 4, crowd: 65,
    seed: 202, routine: 'precision',
    line: 'Updrafts off the crater lip. Respect the rim, or it respects you.',
  },
  {
    id: 'senja',
    name: 'NGARAI SENJA',
    sub: 'Canyon golden hour — Venue 3 of 5',
    next: 'Pelabuhan Senja',
    skyTop: '#4a2d6b', skyMid: '#e86a5a', skyLow: '#ffc46b',
    sun: '#ff9e4f', sunX: 0.24, sunY: 0.42,
    sea: '#3a4a6b', seaDeep: '#232f45', fog: '#e8a06a',
    smoke: '#ffffff', smokeName: 'WHITE',
    wind: 12, gusts: 6, crowd: 80,
    seed: 303, routine: 'freestyle',
    line: 'Ninety seconds. The canyon keeps what it catches — make it count.',
  },
  {
    id: 'pelabuhan',
    name: 'PELABUHAN SENJA',
    sub: 'Harbour dusk, crowd line — Venue 4 of 5',
    next: 'Langit Malam',
    skyTop: '#1d2447', skyMid: '#b04a7a', skyLow: '#ff9e6b',
    sun: '#ff7a5c', sunX: 0.8, sunY: 0.52,
    sea: '#274b63', seaDeep: '#142c3d', fog: '#c96a7e',
    smoke: '#ff4fd8', smokeName: 'MAGENTA',
    wind: 5, gusts: 3, crowd: 100,
    seed: 404, routine: 'crowdline',
    line: 'The whole harbour is watching. Low is brave. The water is not.',
  },
  {
    id: 'malam',
    name: 'LANGIT MALAM',
    sub: 'Night finale over the lit capital — Venue 5 of 5',
    next: 'Championship',
    skyTop: '#050914', skyMid: '#1b2a52', skyLow: '#3a2a5e',
    sun: '#f5e6ff', sunX: 0.3, sunY: 0.2,
    sea: '#0e2233', seaDeep: '#081420', fog: '#2a2a52',
    smoke: '#ffd23f', smokeName: 'GOLD',
    wind: 4, gusts: 2, crowd: 100,
    seed: 505, routine: 'precision',
    line: 'Last routine. Instruments lit, city lit, and three rivals behind you.',
  },
];

// The 18 named figures. kind tells the detector what rotation to measure;
// need is the rotation (degrees) that counts as the figure flown.
export const FIGURES = [
  { id: 'loop', name: 'Loop', kind: 'pitch', need: 300, speedMin: 55, speedMax: 120, bankMax: 0.5, desc: 'Full vertical circle, top inverted' },
  { id: 'aileron-roll', name: 'Aileron Roll', kind: 'roll', need: 300, speedMin: 60, speedMax: 125, bankMax: 2.9, desc: 'One full roll on the axis' },
  { id: 'barrel-roll', name: 'Barrel Roll', kind: 'roll', need: 300, speedMin: 50, speedMax: 110, bankMax: 2.9, desc: 'Roll around a wide barrel path' },
  { id: 'hammerhead', name: 'Hammerhead', kind: 'pitch', need: 160, speedMin: 70, speedMax: 125, bankMax: 0.4, desc: 'Vertical up, pivot, vertical down' },
  { id: 'immelmann', name: 'Immelmann', kind: 'pitch', need: 170, speedMin: 60, speedMax: 120, bankMax: 0.6, desc: 'Half loop, half roll, reverse course' },
  { id: 'cuban-eight', name: 'Cuban Eight', kind: 'pitch', need: 540, speedMin: 60, speedMax: 120, bankMax: 0.7, desc: 'Two loops crossed on the 45s' },
  { id: 'snap-roll', name: 'Snap Roll', kind: 'roll', need: 300, speedMin: 45, speedMax: 90, bankMax: 2.9, desc: 'Stall flick, one fast rotation' },
  { id: 'slow-roll', name: 'Slow Roll', kind: 'roll', need: 300, speedMin: 65, speedMax: 115, bankMax: 2.9, desc: 'One roll, held level throughout' },
  { id: 'spin-recovery', name: 'Spin Recovery', kind: 'roll', need: 300, speedMin: 30, speedMax: 70, bankMax: 2.9, desc: 'Spin, then stop it dead on the line' },
  { id: 'tailslide', name: 'Tailslide', kind: 'pitch', need: 120, speedMin: 20, speedMax: 60, bankMax: 0.4, desc: 'Hang on the prop, slide back down' },
  { id: 'lomcevak', name: 'Lomcevak', kind: 'roll', need: 300, speedMin: 55, speedMax: 105, bankMax: 2.9, desc: 'Tumble end over end, gyroscopic' },
  { id: 'knife-edge', name: 'Knife-Edge', kind: 'roll', need: 90, speedMin: 70, speedMax: 125, bankMax: 1.5, desc: 'Fly sideways on the wing, held' },
  { id: 'vertical-roll', name: 'Vertical Roll', kind: 'roll', need: 300, speedMin: 75, speedMax: 125, bankMax: 2.9, desc: 'Roll while climbing straight up' },
  { id: 'half-cuban', name: 'Half-Cuban', kind: 'pitch', need: 300, speedMin: 60, speedMax: 120, bankMax: 0.6, desc: 'Five-eighths loop, half roll out' },
  { id: 'split-s', name: 'Split-S', kind: 'roll', need: 160, speedMin: 55, speedMax: 125, bankMax: 2.9, desc: 'Half roll, pull through the dive' },
  { id: 'chandelle', name: 'Chandelle', kind: 'pitch', need: 160, speedMin: 50, speedMax: 100, bankMax: 1.2, desc: 'Climbing 180, grace over power' },
  { id: 'lazy-eight', name: 'Lazy Eight', kind: 'pitch', need: 300, speedMin: 45, speedMax: 95, bankMax: 1.4, desc: 'Two lazy loops, a figure eight' },
  { id: 'stall-turn', name: 'Stall Turn', kind: 'pitch', need: 160, speedMin: 65, speedMax: 120, bankMax: 0.4, desc: 'Up, stall, kick around the top' },
];

// The three rival pilots. skill is their base judges' score; style colours
// how their per-venue scores swing.
export const RIVALS = [
  { id: 'elang', name: 'ELANG', tag: 'the veteran, precise', skill: 9.1, swing: 0.25, color: '#e8b23a' },
  { id: 'sari', name: 'SARI', tag: 'the daredevil, fast but wild', skill: 8.7, swing: 0.7, color: '#ff5a7a' },
  { id: 'bimo', name: 'BIMO', tag: 'the kid, fearless, sloppy', skill: 8.2, swing: 0.9, color: '#4fd2ff' },
];

export const JUDGES = ['Pak Darma', 'Bu Lestari', 'Koh Hendra'];

// Announcer between venues.
export const ANNOUNCER = 'Mbak Rani';

// Upgrade shop — bought between venues with championship points.
export const UPGRADES = [
  { id: 'engine', name: 'Hotter Engine', desc: '+vertical power, faster climbs', cost: 12, max: 3 },
  { id: 'smoke', name: 'Bigger Smoke Tank', desc: '+40 smoke fluid per level', cost: 8, max: 3 },
  { id: 'airframe', name: 'Stronger Airframe', desc: '+0.8 G-limit per level', cost: 10, max: 3 },
  { id: 'prop', name: 'Finer Prop', desc: 'sharper roll rate', cost: 8, max: 3 },
];

export const ROUTINES = {
  precision: { name: 'PRECISION', goal: 'Fly 6 set figures through the judged rings', gates: 6 },
  freestyle: { name: 'FREESTYLE', goal: 'Chain any figures for 90 seconds — variety + combos win', seconds: 90 },
  crowdline: { name: 'CROWD LINE', goal: 'Thread the banner gates low over the crowd — closest to the deck wins', gates: 5 },
};

export function figureById(id) {
  return FIGURES.find((f) => f.id === id) || FIGURES[0];
}

export const VENUE_COUNT = VENUES.length;

// The deck bonus rate for the crowd line: points per metre under 80 m.
export const DECK_BONUS_RATE = 0.08;

export function figureKinds(kind) {
  return FIGURES.filter((f) => f.kind === kind);
}
