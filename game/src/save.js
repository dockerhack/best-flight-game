// save.js — best scores and stars in localStorage, nothing else. The hosted
// game runs under a CSP that blocks cookies and service workers; localStorage
// is the one persistence the kit proves safe.

const KEY = 'smoke-and-thunder-save-v1';

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return freshSave();
    const s = JSON.parse(raw);
    if (!s || typeof s !== 'object') return freshSave();
    return { ...freshSave(), ...s };
  } catch (e) {
    return freshSave();
  }
}

export function freshSave() {
  return {
    bestTotal: 0,
    bestLine: '',
    bestFigure: 0,
    stars: [0, 0, 0, 0, 0],
    unlocked: 1,
    points: 0,
  };
}

// Wipe the save (used by "fly the tour again" when the player asks for it).
export function resetSave() {
  try {
    window.localStorage.removeItem(KEY);
  } catch (e) {
    // Storage may be unavailable; nothing to wipe.
  }
  return freshSave();
}

export function storeSave(s) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch (e) {
    // Storage may be unavailable (private mode, CSP); the game plays on.
  }
}
