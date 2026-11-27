// input.js — keyboard input. Arrow keys / WASD fly the plane,
// Shift/Ctrl (or +/-) work the throttle, Space toggles smoke.
// P pauses, M mutes. No touch controls: the game is keyboard-first.
const Keys = {};

function initInput() {
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    Keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (e.code === 'KeyP' && Game.mode === 'flying') Game.paused = !Game.paused;
    if (e.code === 'KeyM') Game.muted = !Game.muted;
    if (e.code === 'Space' && Game.mode === 'flying') toggleSmoke();
    ensureAudio();
  });
  window.addEventListener('keyup', (e) => { Keys[e.code] = false; });
  window.addEventListener('blur', () => {
    for (const k of Object.keys(Keys)) Keys[k] = false;
  });
}

function keyDown() {
  return {
    pitchUp: !!(Keys['ArrowUp'] || Keys['KeyW']),
    pitchDown: !!(Keys['ArrowDown'] || Keys['KeyS']),
    bankLeft: !!(Keys['ArrowLeft'] || Keys['KeyA']),
    bankRight: !!(Keys['ArrowRight'] || Keys['KeyD']),
    throttleUp: !!(Keys['ShiftLeft'] || Keys['ShiftRight'] || Keys['Equal']),
    throttleDown: !!(Keys['ControlLeft'] || Keys['ControlRight'] || Keys['Minus'])
  };
}

function toggleSmoke() {
  if (Game.smokeFluid <= 0) {
    setAnnounce('Smoke fluid empty — visit the shop after this routine.');
    return;
  }
  Game.smokeOn = !Game.smokeOn;
}
