// shop.js — the upgrade shop. Points earned from routines buy smoke
// colours, a stronger engine, a tougher airframe and bigger tanks.
// Purchases apply immediately to the next routine.
const SHOP_ITEMS = [
  { id: 'smoke-magenta', name: 'Magenta smoke', cost: 150, kind: 'smoke', value: 'magenta',
    desc: 'Hot pink ribbon — the crowd sees it from the beach.' },
  { id: 'smoke-cyan', name: 'Cyan smoke', cost: 150, kind: 'smoke', value: 'cyan',
    desc: 'Electric blue against a sunset sky.' },
  { id: 'smoke-rainbow', name: 'Rainbow smoke', cost: 400, kind: 'smoke', value: 'rainbow',
    desc: 'The ribbon changes colour mid-figure. Pure show-off.' },
  { id: 'engine-1', name: 'Engine tune +1', cost: 300, kind: 'engine',
    desc: '+12% power. Faster climbs, tighter loops.' },
  { id: 'airframe-1', name: 'Airframe brace +1', cost: 300, kind: 'airframe',
    desc: '+1 G of structural limit. Pull harder.' },
  { id: 'fuel-1', name: 'Fuel tank +25', cost: 200, kind: 'fuelTank',
    desc: '+25 fuel per routine. Fly longer.' },
  { id: 'smoke-tank-1', name: 'Smoke tank +25', cost: 200, kind: 'smokeTank',
    desc: '+25 smoke fluid per routine. More ribbon.' }
];

const ownedShop = {};

function shopBuy(id) {
  const item = SHOP_ITEMS.find((i) => i.id === id);
  if (!item || ownedShop[id]) return false;
  if (Game.points < item.cost) return false;
  Game.points -= item.cost;
  ownedShop[id] = true;
  if (item.kind === 'smoke') Game.smokeColor = item.value;
  if (item.kind === 'engine') Game.upgrades.engine += 1;
  if (item.kind === 'airframe') Game.upgrades.airframe += 1;
  if (item.kind === 'fuelTank') Game.upgrades.fuelTank += 1;
  if (item.kind === 'smokeTank') Game.upgrades.smokeTank += 1;
  return true;
}
