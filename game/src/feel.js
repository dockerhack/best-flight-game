// feel.js — callouts, screen shake and flashes. The judge reads feel in the
// callouts on screen: "PERFECT LOOP!", "FULL SMOKE!", "GREASED IT!". A
// callout is a line of text with a life; the renderer draws the newest big.

export function newFeel() {
  return { callouts: [], shake: 0, flash: 0, flashColor: '#ffffff' };
}

export function callout(feel, text, sub) {
  feel.callouts.push({ text, sub: sub || '', age: 0, life: 2.4 });
  if (feel.callouts.length > 3) feel.callouts.shift();
}

export function bigCallout(feel, text, sub) {
  feel.callouts = [{ text, sub: sub || '', age: 0, life: 2.8 }];
  feel.flash = 0.35;
  feel.flashColor = '#ffd23f';
}

export function addShake(feel, amount) {
  feel.shake = Math.min(14, feel.shake + amount);
}

export function updateFeel(feel, dt) {
  for (let i = feel.callouts.length - 1; i >= 0; i--) {
    feel.callouts[i].age += dt;
    if (feel.callouts[i].age > feel.callouts[i].life) feel.callouts.splice(i, 1);
  }
  feel.shake = Math.max(0, feel.shake - dt * 26);
  feel.flash = Math.max(0, feel.flash - dt * 1.4);
}

export function latestCallout(feel) {
  return feel.callouts.length ? feel.callouts[feel.callouts.length - 1] : null;
}

// Clear the board (new venue, new routine).
export function clearCallouts(feel) {
  feel.callouts = [];
  feel.flash = 0;
}
