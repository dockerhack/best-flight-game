// camera.js — the TRUE chase camera. The camera sits behind and slightly
// above the biplane and looks forward over its nose; the horizon sits in
// the upper third of the frame. The camera follows yaw fully, pitch
// partially (so a loop reads without the view flipping), and roll a touch.
// project() turns a world point into screen space with a focal length.
const FOCAL = 700;
const VIEW_W = 1280, VIEW_H = 720;

function updateCamera(cam) {
  const p = Game.plane;
  const yaw = p.heading;
  // Camera offset in plane-local space: 13 m back, 2.6 m up.
  const bx = -Math.sin(yaw) * 13, bz = -Math.cos(yaw) * 13;
  cam.x = p.x + bx;
  cam.y = p.y + 2.6;
  cam.z = p.z + bz;
  cam.yaw = yaw;
  cam.pitch = p.pitch * 0.42;
  cam.roll = p.roll * 0.18;
  // Horizon line: upper third, nudged by camera pitch.
  cam.horizonY = VIEW_H * 0.34 - cam.pitch * FOCAL * 0.55;
  cam.cx = VIEW_W / 2 - cam.roll * 40;
}

function project(pt, cam) {
  let dx = pt.x - cam.x;
  let dy = pt.y - cam.y;
  let dz = pt.z - cam.z;
  // Rotate by -yaw around Y.
  const cy = Math.cos(-cam.yaw), sy = Math.sin(-cam.yaw);
  let x1 = dx * cy + dz * sy;
  let z1 = -dx * sy + dz * cy;
  // Rotate by -pitch around X.
  const cp = Math.cos(-cam.pitch), sp = Math.sin(-cam.pitch);
  let y2 = dy * cp - z1 * sp;
  let z2 = dy * sp + z1 * cp;
  if (z2 < 1.2) return null;
  const s = FOCAL / z2;
  return { x: cam.cx + x1 * s, y: cam.horizonY - y2 * s, s: s, z: z2 };
}

// Project a ground point (y = 0) — same as project, kept explicit.
function projectGround(x, z, cam) { return project({ x: x, y: 0, z: z }, cam); }
