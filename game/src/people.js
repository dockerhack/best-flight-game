// people.js — the named people of the circuit: three judges, three rival
// pilots and the announcer. The cooking-final lesson was that winners have
// named people with stories; these names appear in the HUD, the briefing,
// the results and the announcer lines.
const JUDGES = [
  { name: 'Pak Darma', focus: 'line', blurb: 'Line and geometry — rings dead centre.' },
  { name: 'Bu Lestari', focus: 'smooth', blurb: 'Smoothness — no jerks, no wobble.' },
  { name: 'Koh Hendra', focus: 'smoke', blurb: 'Smoke and showmanship — draw it bold.' }
];

const RIVALS = [
  { name: 'Elang', callsign: 'ELANG-1', skill: 0.88, color: '#e8442e',
    story: 'Ex-airforce, flies like the runway owes him money.' },
  { name: 'Sari', callsign: 'SARI-7', skill: 0.83, color: '#2e7de8',
    story: 'Precision queen — never misses a ring centre.' },
  { name: 'Bimo', callsign: 'BIMO-3', skill: 0.79, color: '#e8a32e',
    story: 'Crowd favourite, flies low and loud.' }
];

const ANNOUNCER = { name: 'Mbak Rani', role: 'Announcer' };

const ANNOUNCE_LINES = {
  takeoff: [
    'Mbak Rani: And away she goes — SMOKE & THUNDER is rolling!',
    'Mbak Rani: Throttle up, wheels off the lagoon shore!'
  ],
  figurePerfect: [
    'Mbak Rani: PERFECT! The crowd is on its feet!',
    'Mbak Rani: Look at that smoke — a textbook figure!',
    'Mbak Rani: The judges are smiling. That was beautiful.'
  ],
  figureGood: [
    'Mbak Rani: Clean through the rings — solid flying.',
    'Mbak Rani: Nice and tidy. The crowd liked that one.'
  ],
  figureWeak: [
    'Mbak Rani: A bit ragged there — the judges noticed.',
    'Mbak Rani: Through the rings, but the line wandered.'
  ],
  landingGood: [
    'Mbak Rani: GREASED IT! What a landing!',
    'Mbak Rani: Wheels down, gentle as a feather.'
  ],
  landingHard: [
    'Mbak Rani: Oof — that one bounced. The judges felt it.',
    'Mbak Rani: Down, but not pretty. The runway forgives.'
  ],
  lowFuel: [
    'Mbak Rani: Fuel is getting low — bring her home, pilot!'
  ],
  smokeLow: [
    'Mbak Rani: Smoke fluid running dry — save it for the big one!'
  ]
};

function pickLine(rng, key) {
  const lines = ANNOUNCE_LINES[key] || ANNOUNCE_LINES.figureGood;
  return lines[Math.floor(rng() * lines.length)];
}
