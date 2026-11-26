// fixed-step-loop.js — simulation/render split. The sim runs at a fixed
// 60 Hz no matter the display rate; rendering only draws the latest state.
// (The FPS winner was praised for this file by name.)

import { CFG } from './config.js';

export function startLoop(update, render) {
  let last = performance.now();
  let acc = 0;
  function frame(now) {
    const elapsed = Math.min(0.25, (now - last) / 1000);
    last = now;
    acc += elapsed;
    let steps = 0;
    while (acc >= CFG.dt && steps < 5) {
      update(CFG.dt);
      acc -= CFG.dt;
      steps += 1;
    }
    if (steps === 5) acc = 0;
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
