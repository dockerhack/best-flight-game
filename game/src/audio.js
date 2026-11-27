// audio.js — tiny WebAudio synth. No audio files, no network.
// Engine hum follows the throttle; rings chime; a perfect figure gets
// a crowd cheer (filtered noise). Everything is guarded so the game
// works with audio unavailable (headless test runs included).
let AC = null;
let engineOsc = null, engineGain = null, engineFilter = null;

function ensureAudio() {
  if (AC || Game.muted) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    AC = new Ctx();
    engineOsc = AC.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 55;
    engineFilter = AC.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 320;
    engineGain = AC.createGain();
    engineGain.gain.value = 0.0;
    engineOsc.connect(engineFilter);
    engineFilter.connect(engineGain);
    engineGain.connect(AC.destination);
    engineOsc.start();
  } catch (e) { AC = null; }
}

function audioTick() {
  if (!AC || Game.muted || !engineOsc) return;
  try {
    const p = Game.plane;
    const target = (Game.mode === 'flying' && !Game.paused) ? 0.02 + p.throttle * 0.05 : 0.0;
    engineGain.gain.setTargetAtTime(target, AC.currentTime, 0.1);
    engineOsc.frequency.setTargetAtTime(48 + p.throttle * 60 + p.speed * 0.15, AC.currentTime, 0.1);
  } catch (e) { /* audio is best-effort */ }
}

function beep(freq, dur, type, vol) {
  if (!AC || Game.muted) return;
  try {
    const o = AC.createOscillator();
    const g = AC.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.value = vol || 0.08;
    o.connect(g); g.connect(AC.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + dur);
    o.stop(AC.currentTime + dur);
  } catch (e) { /* ignore */ }
}

function ringChime() { beep(880, 0.18, 'sine', 0.09); setTimeout(() => beep(1320, 0.22, 'sine', 0.07), 70); }

function cheer() {
  if (!AC || Game.muted) return;
  try {
    const len = AC.sampleRate * 1.2;
    const buf = AC.createBuffer(1, len, AC.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = AC.createBufferSource();
    src.buffer = buf;
    const f = AC.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.6;
    const g = AC.createGain();
    g.gain.value = 0.12;
    src.connect(f); f.connect(g); g.connect(AC.destination);
    src.start();
  } catch (e) { /* ignore */ }
}
