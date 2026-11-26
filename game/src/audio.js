// audio.js — WebAudio synthesized in code: engine drone pitched to throttle,
// wind, crowd cheers, judge bell. No audio files. Everything is guarded:
// audio only starts after a user gesture, and a headless shot run must never
// crash on it.

let ctx = null;
let master = null;
let engineOsc = null;
let engineOsc2 = null;
let engineGain = null;
let windSrc = null;
let windGain = null;
let windFilter = null;

export function ensureAudio() {
  try {
    if (ctx) {
      if (ctx.state === 'suspended') void ctx.resume();
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.14;
    master.connect(ctx.destination);
    engineOsc = ctx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 62;
    engineOsc2 = ctx.createOscillator();
    engineOsc2.type = 'sine';
    engineOsc2.frequency.value = 31;
    engineGain = ctx.createGain();
    engineGain.gain.value = 0;
    engineOsc.connect(engineGain);
    engineOsc2.connect(engineGain);
    engineGain.connect(master);
    engineOsc.start();
    engineOsc2.start();
    // Wind: looped noise through a band-pass filter.
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    windSrc = ctx.createBufferSource();
    windSrc.buffer = buf;
    windSrc.loop = true;
    windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 700;
    windFilter.Q.value = 0.6;
    windGain = ctx.createGain();
    windGain.gain.value = 0;
    windSrc.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(master);
    windSrc.start();
    return true;
  } catch (e) {
    ctx = null;
    return false;
  }
}

// Called every frame while flying: engine note follows throttle + speed,
// wind follows airspeed.
export function engineSound(throttle, speed, airborne) {
  if (!ctx || !engineOsc) return;
  try {
    const t = ctx.currentTime;
    const freq = 58 + throttle * 95 + speed * 0.35;
    engineOsc.frequency.setTargetAtTime(freq, t, 0.08);
    engineOsc2.frequency.setTargetAtTime(freq / 2, t, 0.08);
    engineGain.gain.setTargetAtTime(airborne ? 0.10 + throttle * 0.12 : 0.05 + throttle * 0.08, t, 0.1);
    windGain.gain.setTargetAtTime(Math.min(0.16, speed * 0.0011), t, 0.15);
    windFilter.frequency.setTargetAtTime(400 + speed * 6, t, 0.15);
  } catch (e) { /* audio is cosmetic; never break the game */ }
}

export function playBell() {
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    for (const f of [880, 1318]) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.22, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + 1);
    }
  } catch (e) { /* noop */ }
}

export function playCheer() {
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    const len = ctx.sampleRate * 0.7;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1100;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t);
  } catch (e) { /* noop */ }
}

export function playThud() {
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.25);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + 0.32);
  } catch (e) { /* noop */ }
}

// Lower the master volume (title screen, pause) without rebuilding the graph.
export function setMasterVolume(v) {
  if (!ctx || !master) return;
  try {
    master.gain.setTargetAtTime(Math.max(0, Math.min(1, v)) * 0.14, ctx.currentTime, 0.1);
  } catch (e) { /* noop */ }
}

// Silence the engine drone (venue complete, game over).
export function stopEngine() {
  if (!ctx || !engineGain) return;
  try {
    engineGain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    windGain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
  } catch (e) { /* noop */ }
}
