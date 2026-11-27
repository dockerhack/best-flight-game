// crowd.js — the crowd meter. It rises with clean flying, smoke and low
// passes, and falls with sloppy figures. The label must always match the
// number: ROARING only at 80+, MURMURING only below 45. The announcer
// never claims a roar the meter does not show.
function crowdLabel() {
  if (Game.crowd >= 80) return 'ROARING';
  if (Game.crowd >= 60) return 'CHEERING';
  if (Game.crowd >= 45) return 'WATCHING';
  return 'MURMURING';
}

function crowdNudge(amount) {
  Game.crowd = clamp(Game.crowd + amount, 0, 100);
}
