// main.js — boot, game loop, render dispatch and the test hooks.
// The canvas is the game; DOM overlays are the menus.
let CV = null, CTX = null;
const CAM = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, horizonY: 260, cx: 640 };
let lastT = 0;

function render() {
  const ctx = CTX;
  const v = venue();
  updateCamera(CAM);
  drawSky(ctx, v);
  if (v.time === 'night') drawStars(ctx, 42);
  drawDistant(ctx, CAM, v);
  drawGround(ctx, CAM, v);
  drawFeature(ctx, CAM, v);
  drawRunway(ctx, CAM, v);
  if (Game.mode === 'flying' || Game.mode === 'shot') {
    drawRings(ctx, CAM);
    drawSmoke(ctx, CAM);
    if (Game.shot === 3) drawDistantPlane(ctx, CAM);
    drawPlane(ctx);
    drawHUD(ctx);
  } else {
    drawSmoke(ctx, CAM);
    drawPlane(ctx);
  }
}

function update(dt) {
  Game.time += dt;
  if (Game.mode === 'flying') {
    const k = keyDown();
    if (Game.autopilot) {
      autopilotStep(dt);
    } else {
      Game.plane.pitchTarget = (k.pitchUp ? -0.55 : 0) + (k.pitchDown ? 0.5 : 0);
      const bank = (k.bankLeft ? -0.95 : 0) + (k.bankRight ? 0.95 : 0);
      Game.plane.bankTarget = bank;
      if (k.throttleUp) Game.plane.throttleTarget = clamp(Game.plane.throttleTarget + dt * 0.6, 0, 1);
      if (k.throttleDown) Game.plane.throttleTarget = clamp(Game.plane.throttleTarget - dt * 0.6, 0, 1);
    }
    physicsStep(dt);
    updateRoutine(dt);
    pushTrail();
    audioTick();
  } else if (Game.mode === 'menu') {
    // Attract mode: the autopilot flies a gentle circuit over venue 0.
    if (!Game.plane.airborne && Game.plane.speed < 5) {
      Game.plane.throttleTarget = 1;
      Game.plane.pitchTarget = 0.2;
    }
    autopilotStep(dt);
    physicsStep(dt);
    pushTrail();
  }
}

function loop(t) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
  lastT = t;
  if (!Game.manual) update(dt * Game.timeScale);
  render();
}

function boot() {
  CV = document.getElementById('game');
  CTX = CV.getContext('2d');
  resetPlane();
  Game.plane.x = venue().runway.x;
  initInput();
  wireScreens();
  renderMenu();
  showScreen('menu');
  requestAnimationFrame(loop);
}

// ---- Test / automation hooks (also used by the headless play-test) ----
window.__game = {
  Game: Game,
  startRoutine: startRoutine,
  stageShot: stageShot,
  autoFly: function (on) { Game.autopilot = !!on; if (on) Game.smokeOn = true; },
  step: function (dt) { update(dt); render(); },
  state: function () {
    return {
      mode: Game.mode, phase: Game.phase,
      figureIdx: Game.figureIdx, figureTotal: Game.figureList.length,
      ringIdx: Game.ringIdx, rings: Game.rings.length,
      scores: Game.figureScores.map((s) => ({ name: s.figure.name, total: +s.total.toFixed(2), darma: +s.darma.toFixed(1), lestari: +s.lestari.toFixed(1), hendra: +s.hendra.toFixed(1) })),
      ringsHit: Game.stats.ringsHit, ringsTotal: Game.stats.ringsTotal,
      ringLog: Game.ringLog || [],
      crowd: Math.round(Game.crowd), fuel: Math.round(Game.fuel),
      smokeFluid: Math.round(Game.smokeFluid), damage: Math.round(Game.damage),
      points: Game.points, stars: Game.stars,
      plane: { x: +Game.plane.x.toFixed(1), y: +Game.plane.y.toFixed(1), z: +Game.plane.z.toFixed(1),
        speed: +Game.plane.speed.toFixed(1), pitch: +Game.plane.pitch.toFixed(2), roll: +Game.plane.roll.toFixed(2) },
      result: Game.lastResult ? { total: +Game.lastResult.total.toFixed(1), stars: Game.lastResult.stars, points: Game.lastResult.points } : null
    };
  }
};

window.addEventListener('DOMContentLoaded', boot);
