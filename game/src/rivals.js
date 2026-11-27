// rivals.js — the three rival pilots. Their routine scores are simulated
// deterministically from the run seed, so the leaderboard is stable for a
// given run. One rival plane is also drawn small in the distance during
// the freestyle shot.
function simulateRivalScores(seed) {
  const rng = mulberry32(seed + 77);
  const maxTotal = 80; // 6 figures x 10 + landing 10 + crowd 10
  return RIVALS.map((r) => {
    const score = Math.round(r.skill * (0.9 + rng() * 0.1) * maxTotal);
    return { name: r.name, callsign: r.callsign, color: r.color, score };
  }).sort((a, b) => b.score - a.score);
}

function rivalPlanePos() {
  // A rival plane far ahead and to the side, for the freestyle shot.
  const p = Game.plane;
  return { x: p.x + 120, y: p.y + 26, z: p.z + 320 };
}
