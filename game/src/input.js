// input.js — keyboard + mouse. Arrow keys fly, W/S throttle, Space smoke,
// F flaps, P pause. Clicks are consumed one at a time by the screens.

export const keys = Object.create(null);

export const mouse = { x: 0, y: 0, clicked: false, down: false };

export function bindInput(canvas) {
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (!e.repeat) keys[e.code] = true;
    if (e.code === 'Space') keys.Space = true;
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });
  window.addEventListener('blur', () => {
    for (const k of Object.keys(keys)) keys[k] = false;
  });
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width) * canvas.width;
    mouse.y = ((e.clientY - r.top) / r.height) * canvas.height;
  });
  canvas.addEventListener('mousedown', (e) => {
    mouse.down = true;
    mouse.clicked = true;
    const r = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width) * canvas.width;
    mouse.y = ((e.clientY - r.top) / r.height) * canvas.height;
  });
  window.addEventListener('mouseup', () => {
    mouse.down = false;
  });
}

// Read the flying controls for one step. Pitch/roll are -1..1 stick deflections.
export function readControls() {
  const pitch = (keys.ArrowUp ? 1 : 0) - (keys.ArrowDown ? 1 : 0);
  const roll = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
  const throttleUp = keys.KeyW || keys.ShiftLeft || keys.ShiftRight;
  const throttleDown = keys.KeyS || keys.ControlLeft || keys.ControlRight;
  return {
    pitch,
    roll,
    throttleUp: !!throttleUp,
    throttleDown: !!throttleDown,
    smoke: !!keys.Space,
    flaps: !!keys.KeyF,
    pause: !!keys.KeyP,
  };
}

export function consumeClick() {
  if (!mouse.clicked) return null;
  mouse.clicked = false;
  return { x: mouse.x, y: mouse.y };
}

export function clearPauseKey() {
  keys.KeyP = false;
}

// Release every key (used when leaving a screen mid-press).
export function clearAllKeys() {
  for (const k of Object.keys(keys)) keys[k] = false;
}
