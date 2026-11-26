// render.js — canvas setup + draw dispatch. One fixed internal resolution
// (1280x720); the canvas is letterboxed by CSS. Every frame: world, then
// HUD, then the screen overlay for the current screen.

import { CFG } from './config.js';
import { drawWorld } from './render-sky.js';
import { drawHud } from './render-hud.js';
import { drawScreenOverlay } from './screens.js';

export function createRenderer(canvas) {
  canvas.width = CFG.canvasW;
  canvas.height = CFG.canvasH;
  const ctx = canvas.getContext('2d');
  return { canvas, ctx };
}

export function render(r, state) {
  const { ctx } = r;
  ctx.save();
  // Screen shake: a small random offset while the shake value is alive.
  if (state.feel.shake > 0.2) {
    const s = state.feel.shake;
    ctx.translate((Math.sin(state.time * 71) * s) | 0, (Math.cos(state.time * 53) * s) | 0);
  }
  drawWorld(ctx, state);
  drawHud(ctx, state);
  drawScreenOverlay(ctx, state);
  drawVignette(ctx);
  ctx.restore();
  // Gold flash on a big callout.
  if (state.feel.flash > 0.01) {
    ctx.fillStyle = 'rgba(255,210,63,' + (state.feel.flash * 0.25).toFixed(3) + ')';
    ctx.fillRect(0, 0, CFG.canvasW, CFG.canvasH);
  }
}

// A soft dark edge so the HUD panels sit on the frame, not float over it.
function drawVignette(ctx) {
  const g = ctx.createRadialGradient(
    CFG.canvasW / 2, CFG.canvasH / 2, CFG.canvasH * 0.55,
    CFG.canvasW / 2, CFG.canvasH / 2, CFG.canvasH * 0.95,
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CFG.canvasW, CFG.canvasH);
}
