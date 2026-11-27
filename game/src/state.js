// state.js — the single game state object and its reset logic.
// Everything the renderer, physics and screens read lives here.
const SMOKE_COLORS = {
  gold: '#ffd23f', magenta: '#ff4fd8', cyan: '#37d6ff', rainbow: '#ff7a3c'
};

const Game = {
  mode: 'menu',           // menu | briefing | flying | results | shop | shot
  venueIdx: 0,
  routineId: 'precision',
  time: 0,
  timeScale: 1,
  manual: false,
  paused: false,

  plane: null,            // reset by resetPlane()
  trail: [],              // smoke ribbon points {x,y,z,color}
  rings: [],              // active figure rings
  ringIdx: 0,
  figureIdx: 0,
  figureList: [],         // figure defs for this routine
  figureRoll: 0,          // accumulated roll during current figure (rad)
  figureStart: null,      // snapshot at figure start
  figureScores: [],       // {figure, darma, lestari, hendra, total}
  phase: 'takeoff',        // takeoff | figures | landing | done
  landing: null,          // landing run state

  fuel: 100, smokeFluid: 100, damage: 0,
  crowd: 55,              // 0..100
  points: 0, stars: 0,
  smokeColor: 'gold',
  smokeOn: false,
  autopilot: false,
  rivalScores: [],        // {name, score} computed per routine
  upgrades: { engine: 0, airframe: 0, fuelTank: 0, smokeTank: 0 },
  callout: null,          // {text, sub, until, kind}
  announce: null,         // {text, until}
  judgesChip: null,       // {scores, until} shown after a figure
  message: null,          // small toast {text, until}
  shot: null,             // active staged shot config or null
  muted: false,
  runSeed: 1234,
  rng: mulberry32(1234),
  stats: { ringsHit: 0, ringsTotal: 0, perfect: 0 }
};

function freshPlane() {
  return {
    x: 0, y: 2, z: 0,
    speed: 0, throttle: 0, throttleTarget: 0,
    heading: 0, pitch: 0, roll: 0,
    pitchTarget: 0,
    // The bank steers the plane; the manoeuvre roll is a figure demand.
    // They are separate angles: a roll must not drag the heading, and
    // the plane must still steer while it rolls. The drawn roll is
    // bank + manoeuvre roll, combined in physicsStep.
    bank: 0, bankTarget: 0, mroll: 0, mrollTarget: 0,
    headingRate: 0, // rad/s, set by physicsStep — the autopilot's
    // steering damps against it so the bank does not hunt
    rolling: false, // kept for the test hook; no longer drives the turn
    g: 1, vspeed: 0,
    onGround: true, airborne: false
  };
}

function resetPlane() {
  Game.plane = freshPlane();
  Game.trail = [];
  Game.rings = [];
  Game.ringIdx = 0;
  Game.figureIdx = 0;
  Game.figureRoll = 0;
  Game.figureStart = null;
  Game.figureScores = [];
  Game.phase = 'takeoff';
  Game.landing = null;
  Game.fuel = 100 + Game.upgrades.fuelTank * 25;
  Game.smokeFluid = 100 + Game.upgrades.smokeTank * 25;
  Game.damage = 0;
  Game.crowd = VENUES[Game.venueIdx].crowdBase;
  Game.smokeOn = false;
  Game.callout = null;
  Game.announce = null;
  Game.judgesChip = null;
  Game.stats = { ringsHit: 0, ringsTotal: 0, perfect: 0 };
}

function setCallout(text, sub, kind, secs) {
  Game.callout = { text: text, sub: sub || '', kind: kind || 'info', until: Game.time + (secs || 2.6) };
}

function setAnnounce(text, secs) {
  Game.announce = { text: text, until: Game.time + (secs || 4) };
}

function venue() { return VENUES[Game.venueIdx]; }
