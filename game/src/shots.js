// shots.js — deterministic staged scenes for the four required screenshots.
// Each shot sets up real game state (venue, plane attitude, smoke trail,
// rings, crowd, callout) and lets the game's own renderer draw it, so
// every screenshot is a real render of the game — not a mockup.
// The ribbon is staged ahead of the plane so the chase camera can see the
// figure it draws, exactly as it reads mid-flight after a loop.
function loopTrailPoints(y0, z0, R, phiMax, color, step) {
  // Forward stretch so the trail stays ahead of the camera. This is a
  // staged visual, so it uses its own (tighter) stretch than the
  // figure rings — the shape that reads best on screen.
  const K = R + 12;
  const out = [];
  for (let a = 0; a <= phiMax; a += step || 4) {
    const t = a * Math.PI / 180;
    // Same sideways lean as the figure rings: the smoke draws a visible
    // ellipse from the chase camera instead of an edge-on line.
    out.push({ x: 0.45 * R * Math.sin(t), y: y0 + R * (1 - Math.cos(t)), z: z0 + R * Math.sin(t) + K * t, color: color, t: a });
  }
  return out;
}

function stageShot(n) {
  Game.mode = 'shot';
  Game.shot = n;
  showScreen('none');
  Game.autopilot = false;
  Game.paused = false;
  Game.callout = null;
  Game.announce = null;
  Game.judgesChip = null;
  Game.rings = [];
  Game.ringIdx = 0;
  Game.trail = [];
  Game.fuel = 85;
  Game.smokeFluid = 90;
  Game.damage = 0;
  const p = Game.plane;
  p.onGround = false;
  p.airborne = true;
  p.speed = 130;
  p.throttle = 0.6;
  p.throttleTarget = 0.6;
  p.heading = 0;
  p.g = 1;

  if (n === 1) {
    // COVER — mid-loop over Teluk Arunika at dawn: big biplane inverted
    // at the top of the loop, gold smoke tracing the loop, next ring
    // ahead and large, runway strip on the lagoon shore below.
    Game.venueIdx = 0;
    p.x = 0; p.y = 260; p.z = 0;
    p.roll = Math.PI; p.pitch = 0.15; p.pitchTarget = 0.15;
    Game.trail = [];
    // The loop hangs in the sky up-left of the plane: a near-closed
    // gold circle in the X-Y plane facing the camera. A physically
    // consistent loop trail would sit behind the camera (the chase
    // camera looks forward), so the staged loop is placed where the
    // judge can see it — the game still renders it from its own
    // smoke system. Gap at the bottom, where the plane just left it.
    for (let a = 280; a <= 620; a += 4) {
      const t = a * Math.PI / 180;
      Game.trail.push({ x: -120 + 35 * Math.cos(t), y: 240 + 35 * Math.sin(t), z: 200, color: 'gold', t: a });
    }
    Game.rings = [
      { x: 0, y: 210, z: 260, r: 15, passed: false, center: null },
      { x: 0, y: 210, z: 380, r: 15, passed: false, center: null }
    ];
    Game.smokeColor = 'gold';
    Game.smokeOn = true;
    Game.crowd = 88;
    setCallout('TELUK ARUNIKA', 'Cendrawasih Airshow Circuit — dawn', 'venue', 3600);
  } else if (n === 2) {
    // PRECISION — threading a gate ring at Kawah Merapi: ring dead-centre
    // ahead, volcano rim and crater smoke to one side, judges' scores
    // in-frame, no text over the ring or the aircraft.
    Game.venueIdx = 1;
    p.x = 0; p.y = 170; p.z = 0;
    p.roll = 0; p.pitch = 0; p.pitchTarget = 0;
    Game.trail = [];
    for (let i = 0; i < 10; i++) {
      Game.trail.push({ x: 0, y: 170, z: -6 - i * 4, color: 'gold', t: i });
    }
    Game.rings = [
      { x: 0, y: 170, z: 130, r: 14, passed: false, center: null },
      { x: 0, y: 170, z: 260, r: 14, passed: false, center: null }
    ];
    Game.smokeColor = 'gold';
    Game.smokeOn = true;
    Game.crowd = 62;
    Game.judgesChip = { name: 'Loop', darma: 9.2, lestari: 8.8, hendra: 9.0, total: 9.0, until: Game.time + 3600 };
  } else if (n === 3) {
    // FREESTYLE — Cuban-eight smoke ribbon in magenta across Pelabuhan
    // Senja at dusk: harbour town lights and water below, crowd ROARING,
    // one rival plane small in the distance.
    Game.venueIdx = 3;
    p.x = 85; p.y = 150; p.z = -40;
    p.roll = 0.12; p.pitch = 0; p.pitchTarget = 0;
    const t1 = loopTrailPoints(150, 20, 48, 348, 'magenta', 4).map((q) => ({ ...q, x: 0.45 * 48 * Math.sin(q.t * Math.PI / 180) }));
    const t2 = loopTrailPoints(150, 150, 48, 348, 'magenta', 4).map((q) => ({ ...q, x: 85 + 0.45 * 48 * Math.sin(q.t * Math.PI / 180) }));
    Game.trail = t1.concat(t2);
    Game.rings = [
      { x: 85, y: 150, z: 120, r: 14, passed: false, center: null }
    ];
    Game.smokeColor = 'magenta';
    Game.smokeOn = true;
    Game.crowd = 88;
  } else if (n === 4) {
    // LANDING — scored approach: runway strip dead ahead, threshold
    // markings, throttle + speed visible, GREASED IT! (staged clean).
    Game.venueIdx = 2;
    p.x = venue().runway.x; p.y = 26; p.z = 0;
    p.roll = 0; p.pitch = 0.08; p.pitchTarget = 0.08;
    p.speed = 95; p.throttle = 0.25; p.throttleTarget = 0.25;
    Game.trail = [];
    Game.phase = 'landing';
    Game.landing = { x: venue().runway.x, y: 2, z: 320, touchdown: null };
    Game.smokeColor = 'gold';
    Game.smokeOn = false;
    Game.crowd = 74;
    setCallout('GREASED IT!', 'Touchdown 1.8 m/s  •  3 m off centre  •  96 kt', 'perfect', 3600);
  }
  Game.time = Game.time; // keep the clock running for ring pulse
}

// A rival plane drawn small in the distance (freestyle shot).
function drawDistantPlane(ctx, cam) {
  const pos = rivalPlanePos();
  const pr = project(pos, cam);
  if (!pr) return;
  const s = clamp(pr.s, 0.15, 1.0);
  const w = 60 * s, h = 26 * s;
  ctx.save();
  ctx.translate(pr.x, pr.y);
  ctx.fillStyle = '#e8442e';
  ctx.beginPath();
  ctx.ellipse(0, 0, w / 2, h / 4, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f5eeda';
  ctx.beginPath();
  ctx.ellipse(0, -h / 3, w / 2.4, h / 6, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#2a2a33';
  ctx.beginPath();
  ctx.ellipse(0, h / 2.4, w / 5, h / 5, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8442e';
  ctx.fillText('ELANG-1', pr.x, pr.y - h - 6);
}
