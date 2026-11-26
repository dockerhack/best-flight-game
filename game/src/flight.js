// flight.js — lift, drag, throttle, G-load physics for the Cendrawasih
// biplane. Arcade on purpose: the skill is throttle + turn discipline, not
// a flight-model exam. All angles in radians, speeds in m/s, heights in m.

import { CFG } from './config.js';

export function newPlane() {
  return {
    x: 0, y: 0, z: 0,          // position: lateral, altitude, distance along course
    heading: 0,               // 0 = straight down the course (+z)
    pitch: 0,                 // nose up positive, wrapped to [-PI, PI] for rendering
    pitchAngle: 0,            // UNWRAPPED pitch: a loop runs this 0 -> 2*PI
    bank: 0,                  // right wing down positive
    speed: 0,
    throttle: 0,
    fuel: 100,
    smokeFluid: 100,
    smokeOn: false,
    flaps: false,
    g: 1,
    damage: 0,
    overGStrikes: 0,
    overGFlag: false,
    airborne: false,
    landed: null,             // { verdict, text } once the routine ends on the ground
    crashed: false,
    // Manoeuvre totals since the last gate — the figure detector reads these.
    pitchTotal: 0,            // signed degrees of pitch rotation accumulated
    rollTotal: 0,             // signed degrees of roll rotation accumulated
    maxBank: 0,               // steepest bank since the last gate
    minSpeed: 999, maxSpeed: 0,
    vspeed: 0,                // vertical speed, for landing verdicts
    propAngle: 0,             // propeller spin, visual only
  };
}

export function upgradeBonus(upgrades) {
  return {
    engine: 1 + 0.12 * (upgrades.engine || 0),
    smokeTank: CFG.smokeTankBase + 40 * (upgrades.smoke || 0),
    gLimit: CFG.gLimitBase + 0.8 * (upgrades.airframe || 0),
    roll: 1 + 0.18 * (upgrades.prop || 0),
  };
}

// One fixed step. ctl comes from readControls() or the shot autopilot.
// env is { wind, gusts, wobble } from the venue. events collects what
// happened this step for callouts and the crowd.
export function stepFlight(p, ctl, upgrades, env, dt, events) {
  const bonus = upgradeBonus(upgrades);

  // Throttle: W/S move it, Shift/Ctrl are the same pair.
  if (ctl.throttleUp) p.throttle = Math.min(1, p.throttle + dt * 0.55);
  if (ctl.throttleDown) p.throttle = Math.max(0, p.throttle - dt * 0.55);
  p.flaps = !!ctl.flaps;
  p.smokeOn = !!ctl.smoke;

  const targetSpeed = (CFG.baseSpeed + p.throttle * (CFG.maxSpeed - CFG.baseSpeed)) * bonus.engine;
  const flapDrag = p.flaps ? 0.82 : 1;
  // Climbing bleeds speed, diving gains it — energy management is the game.
  const climbBleed = Math.sin(p.pitch) * CFG.climbBleed;
  p.speed += ((targetSpeed * flapDrag - climbBleed) - p.speed) * Math.min(1, dt * 0.9);
  if (p.speed < 0) p.speed = 0;

  // Stick: pitch and roll rates, sharper with the finer prop. Pitch is
  // UNWRAPPED: holding the stick back flies a real loop — pitchAngle runs
  // 0 -> 2*PI while the velocity stays tangent to the loop circle, so the
  // plane goes up, over the top (moving briefly backwards) and down the
  // far side, exactly like a loop. pitch is the wrapped view of it.
  const pitchRate = ctl.pitch * CFG.pitchRate;
  const rollRate = ctl.roll * CFG.rollRate * bonus.roll;
  p.pitchAngle += pitchRate * dt;
  p.pitch = wrapAngle(p.pitchAngle);
  p.bank += rollRate * dt;
  p.bank = Math.max(-1.5, Math.min(1.5, p.bank));
  // The biplane levels its wings gently when the stick is centred.
  if (ctl.roll === 0) p.bank *= Math.max(0, 1 - dt * 0.55);

  // Turn: bank turns the heading, faster when slow.
  p.heading += Math.sin(p.bank) * CFG.turnRate * (62 / Math.max(30, p.speed)) * dt;

  // Manoeuvre totals for the figure detector: genuine rotation flown.
  p.pitchTotal += pitchRate * dt * (180 / Math.PI);
  p.rollTotal += rollRate * dt * (180 / Math.PI);
  p.maxBank = Math.max(p.maxBank, Math.abs(p.bank));
  p.minSpeed = Math.min(p.minSpeed, p.speed);
  p.maxSpeed = Math.max(p.maxSpeed, p.speed);

  // Wind: a steady push plus gusts that shove the nose sideways.
  const gust = env.gusts * (env.wobble || 0) * dt;
  p.heading += gust * 0.02;
  p.x += env.wind * 0.4 * dt;

  // Move.
  const fwdX = Math.sin(p.heading);
  const fwdZ = Math.cos(p.heading);
  const horiz = Math.cos(p.pitch);
  p.z += fwdZ * p.speed * horiz * dt;
  p.x += fwdX * p.speed * horiz * dt;
  const prevY = p.y;
  p.y += p.speed * Math.sin(p.pitch) * dt;
  p.vspeed = (p.y - prevY) / Math.max(dt, 1e-6);
  p.propAngle += dt * (4 + p.throttle * 40 + p.speed * 0.25);

  // G-load: bank + pitch rate. Over the limit stresses the airframe.
  const gTarget = 1 + Math.abs(Math.sin(p.bank)) * 1.6 + Math.abs(pitchRate) * 0.9;
  p.g += (gTarget - p.g) * Math.min(1, dt * 6);
  if (p.airborne && p.g > bonus.gLimit) {
    p.damage += dt * 14;
    if (!p.overGFlag) {
      p.overGFlag = true;
      p.overGStrikes += 1;
      events.push({ type: 'overg', g: p.g });
    }
  } else if (p.g < bonus.gLimit - 0.4) {
    p.overGFlag = false;
  }

  // Fuel: throttle burns it, vertical work burns it faster.
  const burn = CFG.fuelDrain * (0.25 + p.throttle) * (1 + Math.max(0, Math.sin(p.pitch)) * 0.9);
  p.fuel = Math.max(0, p.fuel - burn * dt);
  if (p.fuel <= 0 && p.throttle > 0.15) {
    p.throttle = 0.15;
    events.push({ type: 'dry', text: 'FUEL LOW — glide her home' });
  }

  // Takeoff: rotate off the runway once fast enough with the nose up.
  if (!p.airborne) {
    p.y = 0;
    if (p.speed > CFG.takeoffSpeed && p.pitch > 0.12) {
      p.airborne = true;
      events.push({ type: 'takeoff', text: 'AIRBORNE!' });
    }
  }

  // Ground contact.
  if (p.airborne && p.y <= 0) {
    p.y = 0;
    return 'ground';
  }
  return p.airborne ? 'flying' : 'ground';
}

export function resetManeuver(p) {
  p.pitchTotal = 0;
  p.rollTotal = 0;
  p.maxBank = 0;
  p.minSpeed = 999;
  p.maxSpeed = 0;
}

// Wrap an angle to [-PI, PI].
export function wrapAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}
