// autopilot.js — a simple steer-to-the-next-ring autopilot used by the
// headless play-test and by the menu attract mode. It is not a cheat for
// scoring: a human can fly the same lines with the keyboard. The autopilot
// also performs the roll demanded by the current figure.
function autopilotStep(dt) {
  const p = Game.plane;
  // Out of fuel: glide, no throttle, whatever the figure wants.
  if (Game.fuel <= 0) {
    p.throttleTarget = 0;
    p.throttle = 0;
  }
  // Smoke is part of the performance: on during figures, off otherwise.
  if (Game.phase === 'figures' && Game.smokeFluid > 5) Game.smokeOn = true;
  if (Game.phase === 'takeoff' || Game.phase === 'landing') Game.smokeOn = false;
  if (!p.airborne) {
    // On the runway: full throttle, rotate when fast enough.
    p.throttleTarget = 1;
    p.pitchTarget = p.speed > ROTATE_SPEED ? 0.22 : 0;
    p.bankTarget = 0;
    p.mrollTarget = 0;
    return;
  }
  const fig = currentFigure();
  const ring = currentRing();
  if (Game.phase === 'landing' && Game.landing) {
    steerToLanding(dt);
    return;
  }
  if (Game.phase === 'climbout') {
    // Climb out to a safe figure altitude, level, then start figure 1.
    p.pitchTarget = 0.35;
    p.bankTarget = 0;
    p.mrollTarget = 0;
    p.throttleTarget = 0.55;
    if (p.y >= 160) {
      Game.phase = 'figures';
      startFigure(0);
    }
    return;
  }
  if (!ring) {
    // No ring: level out, hold speed, wait for the next figure.
    p.pitchTarget = 0;
    p.bankTarget = 0;
    p.mrollTarget = 0;
    p.throttleTarget = 0.62;
    return;
  }
  const dx = ring.x - p.x, dy = ring.y - p.y, dz = ring.z - p.z;
  const dist = Math.hypot(dx, dy, dz);
  // Steer at the ring, but never turn more than ~50° off the course to
  // chase one: a ring far to the side is a ring to miss, not a reason
  // to turn around and fly away from the course. The look-ahead is
  // clamped to 60 m: as the ring gets close, atan2(dx, dz) blows up
  // toward ±90° for a small lateral error, and the plane banks hard
  // for a ring it is about to cross anyway.
  const desiredHeading = clamp(Math.atan2(dx, Math.max(dz, 60)), -0.9, 0.9);
  const desiredPitch = Math.atan2(dy, Math.hypot(dx, dz));
  const hErr = normAngle(desiredHeading - p.heading);
  // Proportional steering. The bank chases fast (4 rad/s in physics),
  // so the heading tracks without the lag that made a plain
  // proportional bank hunt and weave ±35 m across a straight ring
  // line. No damping term: damping slowed the correction on roll
  // figures and cost more rings than it saved.
  p.bankTarget = clamp(hErr * 2.4, -1.05, 1.05);
  p.pitchTarget = clamp(desiredPitch, -1.1, 1.1);
  // Throttle for the figure's target speed (physics: speed ≈ 30 + throttle*190).
  const targetSpeed = fig ? fig.speed : 130;
  let thr = (targetSpeed - 30) / (MAX_SPEED - 30);
  if (dist > 150) thr += 0.12;
  if (dist < 40) thr -= 0.08;
  p.throttleTarget = Game.fuel <= 0 ? 0 : clamp(thr, 0.15, 0.95);

  // Roll demand: the manoeuvre roll is separate from the steering
  // bank, so the plane keeps steering at the rings while it rolls.
  // A continuous roll makes one revolution over the figure's length
  // (plus a margin so the demand is met): a rolling circle rolls once
  // around the circle, a snap roll flicks fast.
  if (fig && fig.roll) {
    if (fig.roll === 'bank90') {
      p.mrollTarget = 1.45; // hold knife-edge
    } else if (fig.roll === 'roll180') {
      // Roll to inverted for the first half of the figure, then roll
      // back level for the second half — the plane stays steerable and
      // the accumulated roll still satisfies the demand.
      p.mrollTarget = Game.ringIdx < Game.rings.length / 2 ? Math.PI : 0;
    } else {
      const first = Game.rings[0], last = Game.rings[Game.rings.length - 1];
      const span = last ? Math.max(60, last.z - first.z) : 120;
      const vMs = Math.max(30, p.speed * KT_TO_MS);
      const figDur = span / vMs;
      const mult = fig.roll === 'roll360slow' ? 1.0 : fig.roll === 'roll360fast' ? 1.8 : 1.15;
      const rate = (TAU * mult) / figDur;
      p.mroll = normAngle(p.mroll + rate * dt);
      p.mrollTarget = p.mroll;
    }
  } else {
    p.mrollTarget = 0;
  }
}

function steerToLanding(dt) {
  const p = Game.plane;
  const L = Game.landing;
  const dx = L.x - p.x, dy = L.y - p.y, dz = L.z - p.z;
  const desiredHeading = Math.atan2(dx, Math.max(dz, 60));
  const desiredPitch = clamp(Math.atan2(dy, Math.hypot(dx, dz)), -0.35, 0.1);
  const hErr = normAngle(desiredHeading - p.heading);
  p.bankTarget = clamp(hErr * 2.0, -0.6, 0.6);
  p.pitchTarget = desiredPitch;
  p.throttleTarget = p.speed > 95 ? 0.15 : 0.3;
  // Flare in the last 60 m.
  if (dz < 60 && dz > 0) p.pitchTarget = 0.12;
}
