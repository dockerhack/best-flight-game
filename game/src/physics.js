// physics.js — the flight model. Arcade-simple but honest: throttle sets
// target speed, bank turns the plane, pitch climbs and dives, G builds
// with manoeuvring, fuel and smoke fluid drain, damage accrues past the
// G limit. Speeds in knots, distances in metres, angles in radians.
const KT_TO_MS = 0.514444;
const MAX_SPEED = 220;
const MIN_FLY_SPEED = 42;
const ROTATE_SPEED = 55;

function physicsStep(dt) {
  const p = Game.plane;
  if (Game.paused) return;

  const enginePower = 1 + Game.upgrades.engine * 0.12;
  const gLimit = 6 + Game.upgrades.airframe * 1.0;

  // Throttle: keyboard or autopilot sets throttleTarget; spool toward it.
  p.throttle += clamp(p.throttleTarget - p.throttle, -dt * 0.8, dt * 0.8);
  p.throttle = clamp(p.throttle, 0, 1);

  // Speed chases the throttle, with drag.
  const targetSpeed = 30 + p.throttle * (MAX_SPEED - 30) * enginePower;
  p.speed += (targetSpeed - p.speed) * (1 - Math.exp(-dt * 0.45));

  // Pitch and roll chase their targets (rates in rad/s). The steering
  // bank chases fast (4 rad/s) so the heading does not lag and hunt;
  // the manoeuvre roll chases at the normal roll rate (2.4 rad/s).
  const pitchRate = 1.5;
  const bankRate = 4.0;
  const rollRate = 2.4;
  const prevPitch = p.pitch, prevRoll = p.roll, prevMroll = p.mroll;
  p.pitch += clamp(p.pitchTarget - p.pitch, -pitchRate * dt, pitchRate * dt);
  // The steering bank and the manoeuvre roll are chased separately,
  // then combined into the plane's drawn roll. The bank is what turns
  // the plane; the manoeuvre roll is a figure demand that must not
  // drag the heading (a 180° roll used to net ~+0.5 rad of heading,
  // and two roll figures in a row flew the plane backwards off the
  // course). The keyboard sets bankTarget — it is the steering bank.
  p.bank += clamp(p.bankTarget - p.bank, -bankRate * dt, bankRate * dt);
  p.mroll += clamp(p.mrollTarget - p.mroll, -rollRate * dt, rollRate * dt);
  p.roll = normAngle(p.bank + p.mroll);

  // Bank turns the plane; pitch changes altitude. Positive bank is a
  // right bank (right wing down), which must turn the heading right
  // (toward +X). The sign here is the whole steering model — get it
  // wrong and the plane turns away from every ring.
  const turnRate = Math.sin(p.bank) * 0.7 * (p.speed / 140);
  p.heading = normAngle(p.heading + turnRate * dt);
  p.headingRate = turnRate;
  const vMs = p.speed * KT_TO_MS;
  p.x += Math.sin(p.heading) * vMs * dt;
  p.z += Math.cos(p.heading) * vMs * dt;
  p.vspeed = Math.sin(p.pitch) * vMs;
  p.y += p.vspeed * dt;

  // G: 1g plus pitch-rate and bank contributions. The bank term uses
  // the steering bank, not the drawn roll — a manoeuvre roll adds its
  // own small term from its rate, so a clean roll reads as smooth.
  const dPitch = Math.abs(p.pitch - prevPitch) / Math.max(dt, 1e-4);
  const dMroll = Math.abs(p.mroll - prevMroll) / Math.max(dt, 1e-4);
  const g = 1 + dPitch * 0.4 + Math.abs(Math.sin(p.bank)) * 0.6 + Math.abs(p.pitch) * 0.4 + dMroll * 0.15;
  p.g = lerp(p.g, g, 0.25);

  // Stall: too slow and airborne means the nose drops.
  if (p.airborne && p.speed < MIN_FLY_SPEED) {
    p.pitch = Math.max(p.pitch - 0.6 * dt, -0.5);
    p.y -= (MIN_FLY_SPEED - p.speed) * 0.12 * dt;
  }

  // Takeoff: rotate once fast enough on the runway.
  if (p.onGround && p.speed >= ROTATE_SPEED && p.pitchTarget > 0.05) {
    p.onGround = false;
    p.airborne = true;
    p.y = Math.max(p.y, 2.5);
    if (Game.phase === 'takeoff') {
      Game.phase = 'climbout';
      setAnnounce(pickLine(Game.rng, 'takeoff'));
      beep(660, 0.15, 'triangle', 0.08);
    }
  }

  // Ground: stay on the runway surface unless landing (handled by routines).
  if (p.onGround) {
    p.y = 2;
    p.pitch = 0;
  }
  if (p.y < 2 && p.airborne) {
    // Hit the ground outside a landing: a hard hit hurts, a gentle
    // brush just bounces. (A flat +18 per frame would kill a gliding
    // plane in under a second — the out-of-fuel death spiral.)
    if (Game.phase !== 'landing') {
      const hard = Math.abs(p.vspeed) > 8;
      Game.damage = Math.min(100, Game.damage + (hard ? 18 : 2));
      p.y = 2;
      p.vspeed = 0;
      p.pitch = 0.25;
      if (hard) setCallout('TOO LOW!', 'Pulled up — the ground is not a ring.', 'warn', 2.2);
    }
  }

  // Fuel, smoke fluid, damage.
  Game.fuel = Math.max(0, Game.fuel - p.throttle * 0.22 * dt);
  if (Game.smokeOn && Game.smokeFluid > 0) {
    Game.smokeFluid = Math.max(0, Game.smokeFluid - 1.1 * dt);
    if (Game.smokeFluid <= 0) {
      Game.smokeOn = false;
      setAnnounce(pickLine(Game.rng, 'smokeLow'));
    }
  }
  if (p.g > gLimit) {
    Game.damage = Math.min(100, Game.damage + (p.g - gLimit) * 3.0 * dt);
  }
  if (Game.fuel <= 0 && p.throttle > 0) {
    p.throttleTarget = 0;
    p.throttle = 0;
    setAnnounce(pickLine(Game.rng, 'lowFuel'));
  }
  if (Game.damage >= 100) {
    endRoutineEarly('The airframe gave up — too much G and too many hard hits.');
  }
}
