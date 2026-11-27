// figures.js — the 18 named figures of the Cendrawasih Airshow Circuit.
// Every figure is a list of gate rings in figure-local space: the plane
// starts at (x0, y0, z0) flying +Z and must pass the rings in order.
// A figure may also demand a roll (roll360 / roll180 / bank90) while its
// rings are being flown. Ring radius r is in metres.
const FIG_R = 14; // standard ring radius

// The loop is a true circle in the Y-Z plane (centre above the entry
// point), stretched forward along +Z so every ring's z is strictly
// increasing — the plane only ever flies forward, so a ring behind it in
// z can never be hit. The stretch must be large: with a small stretch
// the rings bunch up near the top of the loop (sin falls after 90°)
// and the plane gets 0.2 s to climb between them. K = 110 keeps the
// tightest gap at ~47 m, about 0.7 s at cruise — flyable.
const LOOP_K = (R) => 110;

function loopRings(o, R) {
  const K = LOOP_K(R);
  const out = [];
  for (const a of [45, 90, 135, 180, 225, 270, 315]) {
    const t = a * Math.PI / 180;
    // The loop leans sideways (x = 0.45R sin φ) so the smoke draws a
    // visible ellipse from the chase camera instead of an edge-on line.
    out.push({ x: o.x + 0.45 * R * Math.sin(t), y: o.y + R * (1 - Math.cos(t)), z: o.z + R * Math.sin(t) + K * t, r: FIG_R });
  }
  return out;
}

function loopEndZ(o, R) { return o.z + LOOP_K(R) * Math.PI * 2; }

function straightRings(o, n, step, r) {
  const out = [];
  for (let i = 1; i <= n; i++) out.push({ x: o.x, y: o.y, z: o.z + step * i, r: r || FIG_R });
  return out;
}

function climbRings(o, n, dy, dz, r) {
  const out = [];
  for (let i = 1; i <= n; i++) out.push({ x: o.x, y: o.y + dy * i, z: o.z + dz * i, r: r || FIG_R });
  return out;
}

function helixRings(o, n, step, rad) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    const a = (i - 1) * (Math.PI * 2 / n);
    out.push({ x: o.x + rad * Math.cos(a), y: o.y + rad * Math.sin(a), z: o.z + step * i, r: FIG_R });
  }
  return out;
}

function halfLoopDownRings(o, R) {
  const K = LOOP_K(R);
  const out = [];
  for (const a of [45, 90, 135, 180]) {
    const t = a * Math.PI / 180;
    out.push({ x: o.x + 0.45 * R * Math.sin(t), y: o.y - R * (1 - Math.cos(t)), z: o.z + R * Math.sin(t) + K * t, r: FIG_R });
  }
  return out;
}

function chandelleRings(o, R) {
  // A climbing turn — but a true 180° chandelle would fly the plane
  // back through its own rings, so the turn is a gentle 28 m swing
  // with even 42 m ring spacing. Still climbs 55 m; still a chandelle.
  const out = [];
  for (let i = 0; i < 6; i++) {
    const t = ((30 + 30 * i) * Math.PI) / 180;
    out.push({ x: o.x + 28 * Math.sin(t), y: o.y + 55 * Math.sin(t / 2), z: o.z + 42 * (i + 1), r: FIG_R });
  }
  return out;
}

function rollingCircleRings(o, R) {
  // A circle in the X-Z plane, stretched forward like the loop so z is
  // monotonic — without the stretch the rings come back toward the
  // plane and can never be hit. R = 50 keeps the lateral swing flyable.
  const K = 100;
  const out = [];
  for (const a of [45, 90, 135, 180, 225, 270, 315]) {
    const t = a * Math.PI / 180;
    out.push({ x: o.x + R * Math.sin(t), y: o.y, z: o.z + R * (1 - Math.cos(t)) + K * t, r: FIG_R });
  }
  return out;
}

function fallingLeafRings(o) {
  const out = [];
  // A gentle rock, not a 84 m swing: the plane can move ~30 m/s
  // sideways, so the swing is ±12 m over a 60 m ring gap.
  const xs = [-12, 12, -12, 12, -12, 0];
  for (let i = 0; i < xs.length; i++) {
    out.push({ x: o.x + xs[i], y: o.y - 22 * (i + 1), z: o.z + 60 * (i + 1), r: FIG_R });
  }
  return out;
}

function cubanEightRings(o, R) {
  const first = loopRings(o, R);
  // Second loop starts where the first one ends, offset sideways.
  const o2 = { x: o.x + 85, y: o.y, z: loopEndZ(o, R) };
  const second = loopRings(o2, R);
  return first.concat(second);
}

function verticalEightRings(o, R) {
  const first = loopRings(o, R);
  // Second loop starts where the first one ends, stacked above.
  const o2 = { x: o.x, y: o.y + 2 * R, z: loopEndZ(o, R) };
  const second = loopRings(o2, R);
  return first.concat(second);
}

function hammerheadRings(o) {
  // Climb 5 rings of 22 m over 60 m of z (pitch ~20°, a climb rate
  // the plane can actually hold for the whole step), pivot at the top,
  // dive 5 rings the same way back down. The old 30 m step left the
  // plane ~4 m short on every ring, which added up to a miss.
  const out = climbRings(o, 5, 22, 60);
  out.push({ x: o.x, y: o.y + 110, z: o.z + 300, r: 12 });
  for (let i = 1; i <= 5; i++) out.push({ x: o.x, y: o.y + 110 - 22 * i, z: o.z + 300 + 60 * i, r: FIG_R });
  return out;
}

function tailSlideRings(o) {
  // Climb, hang at the top, slide back down. Same flyable spacing as
  // the hammerhead: 22 m of climb/dive per 60 m of z.
  const out = climbRings(o, 3, 22, 60);
  out.push({ x: o.x, y: o.y + 66, z: o.z + 180, r: 12 });
  out.push({ x: o.x, y: o.y + 50, z: o.z + 220, r: 12 });
  for (let i = 1; i <= 3; i++) out.push({ x: o.x, y: o.y + 50 - 22 * i, z: o.z + 220 + 60 * i, r: FIG_R });
  return out;
}

// id, name, routine, target speed (kt), roll demand, ring builder, blurb.
const FIGURES = [
  { id: 'loop', name: 'Loop', routine: 'precision', speed: 130, roll: null,
    rings: (o) => loopRings(o, 55), blurb: 'One clean circle in the sky.' },
  { id: 'aileron-roll', name: 'Aileron Roll', routine: 'precision', speed: 140, roll: 'roll360',
    rings: (o) => straightRings(o, 5, 34), blurb: 'A full roll on a straight line.' },
  { id: 'immelmann', name: 'Immelmann', routine: 'precision', speed: 135, roll: 'roll180',
    rings: (o) => loopRings(o, 55).slice(0, 4).concat(
      // The straight rings sit 60 m apart, not 34: after the half
      // loop the plane is still turning back toward the line, and
      // 34 m (0.5 s) is not enough to straighten out — it missed both
      // by 17–25 m. 60 m gives it time to level the heading.
      straightRings({ x: o.x, y: o.y + 110, z: o.z + LOOP_K(55) * Math.PI }, 2, 60)),
    blurb: 'Half a loop, half a roll — reverse course, gain height.' },
  { id: 'split-s', name: 'Split-S', routine: 'precision', speed: 150, roll: 'roll180',
    rings: (o) => straightRings(o, 1, 30).concat(halfLoopDownRings({ x: o.x, y: o.y, z: o.z + 30 }, 55)),
    blurb: 'Roll inverted, dive through the half loop.' },
  { id: 'cuban-eight', name: 'Cuban Eight', routine: 'freestyle', speed: 130, roll: 'roll180',
    rings: (o) => cubanEightRings(o, 48), blurb: 'Two loops, one eight, smoke everywhere.' },
  { id: 'hammerhead', name: 'Hammerhead', routine: 'precision', speed: 120, roll: null,
    rings: (o) => hammerheadRings(o), blurb: 'Straight up, pivot, straight down.' },
  { id: 'chandelle', name: 'Chandelle', routine: 'precision', speed: 125, roll: null,
    rings: (o) => chandelleRings(o, 70), blurb: 'A climbing 180° turn, smooth as silk.' },
  { id: 'barrel-roll', name: 'Barrel Roll', routine: 'freestyle', speed: 145, roll: 'roll360',
    rings: (o) => helixRings(o, 6, 60, 22), blurb: 'A corkscrew around the flight path.' },
  { id: 'slow-roll', name: 'Slow Roll', routine: 'freestyle', speed: 135, roll: 'roll360slow',
    rings: (o) => straightRings(o, 6, 34), blurb: 'One slow, level roll. No wobble.' },
  { id: 'snap-roll', name: 'Snap Roll', routine: 'freestyle', speed: 150, roll: 'roll360fast',
    rings: (o) => straightRings(o, 4, 30), blurb: 'A violent flick-roll — blink and miss it.' },
  { id: 'lomcevak', name: 'Lomcevak', routine: 'freestyle', speed: 110, roll: 'roll360',
    rings: (o) => loopRings(o, 30), blurb: 'The tumble: end over end, smoke trailing.' },
  { id: 'tail-slide', name: 'Tail Slide', routine: 'crowd', speed: 115, roll: null,
    rings: (o) => tailSlideRings(o), blurb: 'Climb until the air gives up, slide back down.' },
  { id: 'torque-roll', name: 'Torque Roll', routine: 'crowd', speed: 105, roll: 'roll360slow',
    rings: (o) => climbRings(o, 5, 22, 60), blurb: 'Hang on the prop and pirouette.' },
  { id: 'knife-edge', name: 'Knife-Edge Pass', routine: 'crowd', speed: 150, roll: 'bank90',
    rings: (o) => straightRings(o, 5, 36), blurb: 'Ninety degrees of bank, straight at the crowd.' },
  { id: 'avalanche', name: 'Avalanche', routine: 'freestyle', speed: 135, roll: 'roll360',
    rings: (o) => loopRings(o, 55), blurb: 'A loop with a snap roll at the top.' },
  { id: 'rolling-circle', name: 'Rolling Circle', routine: 'freestyle', speed: 130, roll: 'roll360',
    rings: (o) => rollingCircleRings(o, 50), blurb: 'A full circle, rolling the whole way round.' },
  { id: 'vertical-eight', name: 'Vertical Eight', routine: 'freestyle', speed: 125, roll: null,
    rings: (o) => verticalEightRings(o, 45), blurb: 'Two loops stacked into an eight.' },
  { id: 'falling-leaf', name: 'Falling Leaf', routine: 'crowd', speed: 100, roll: null,
    rings: (o) => fallingLeafRings(o), blurb: 'Rocking wings all the way down.' }
];

function figureById(id) { return FIGURES.find((f) => f.id === id); }
