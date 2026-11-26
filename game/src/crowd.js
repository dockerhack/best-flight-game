// crowd.js — the crowd meter. Clean figures lift it, sloppy ones drop it;
// a full meter is applause the whole harbour hears. The meter is the
// visible form of "the crowd is watching" in the screenshots.

export function newCrowd(size) {
  return { meter: 35, size: size || 50, cheering: 0, lastVerdict: '' };
}

export function crowdReact(crowd, verdict, dt) {
  crowd.lastVerdict = verdict;
  if (verdict === 'PERFECT') crowd.meter = Math.min(100, crowd.meter + 16);
  else if (verdict === 'CLEAN') crowd.meter = Math.min(100, crowd.meter + 9);
  else if (verdict === 'DECENT') crowd.meter = Math.min(100, crowd.meter + 3);
  else if (verdict === 'WIDE') crowd.meter = Math.max(0, crowd.meter - 6);
  else crowd.meter = Math.max(0, crowd.meter - 12);
  if (crowd.meter >= 85) crowd.cheering = Math.max(crowd.cheering, 1.6);
  return crowd;
}

export function updateCrowd(crowd, dt) {
  if (crowd.cheering > 0) crowd.cheering -= dt;
  // A quiet crowd drifts back toward the middle between figures.
  crowd.meter += (40 - crowd.meter) * dt * 0.02;
}

export function crowdLabel(crowd) {
  if (crowd.meter >= 85) return 'ROARING';
  if (crowd.meter >= 65) return 'ON ITS FEET';
  if (crowd.meter >= 45) return 'WATCHING';
  if (crowd.meter >= 25) return 'MURMURING';
  return 'SITTING DOWN';
}

// True while the crowd is actively cheering (drives the audio cheer).
export function isRoaring(crowd) {
  return crowd.cheering > 0 || crowd.meter >= 85;
}
