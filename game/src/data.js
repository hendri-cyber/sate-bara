// SATE BARA — game data: ingredients, dishes, palette, tuning.
// No imports: plain data the rest of the game reads.

export const W = 1280;
export const H = 720;
export const SHIFT_SECONDS = 180; // one 3-minute shift
export const MAX_TICKETS = 3;
export const GRILL_SLOTS = 4;
export const TICKET_PATIENCE = 45; // seconds per ticket
export const COOK_SECONDS = 6; // a skewer cooks in ~6 s (green zone 55-85%)
export const GREEN_LOW = 0.55;
export const GREEN_HIGH = 0.85;
export const BURN_AT = 0.97;

// Palette: charcoal stall at night, glowing embers, cream tickets.
export const C = {
  bg: '#1d1712',
  bg2: '#241a12',
  wood: '#6b4226',
  woodLight: '#8a5a33',
  woodDark: '#4a2c17',
  ember: '#ff7a1a',
  emberSoft: '#ffb347',
  emberDeep: '#c33d0e',
  cream: '#f5e6c8',
  creamDim: '#cbb890',
  board: '#2f4f3e',
  boardEdge: '#24402f',
  chalk: '#f2f7ee',
  red: '#e5484d',
  green: '#46a758',
  gold: '#f2c14e',
  ink: '#241a12',
  plate: '#f7f3ea',
  smoke: 'rgba(220, 210, 195, 0.35)',
};

// Counter bins (keys 1-8). kind: 'skewer' goes on the grill first; the rest go
// straight onto the plate. meat: which cooked skewer a raw one becomes.
export const INGREDIENTS = [
  { id: 'ayam', name: 'Ayam', sub: 'tusuk mentah', kind: 'skewer', meat: 'ayam', key: '1', meatColor: '#e8a08a', rawColor: '#f2b8a0' },
  { id: 'kambing', name: 'Kambing', sub: 'tusuk mentah', kind: 'skewer', meat: 'kambing', key: '2', meatColor: '#a34d3d', rawColor: '#c96a55' },
  { id: 'sapi', name: 'Sapi', sub: 'tusuk mentah', kind: 'skewer', meat: 'sapi', key: '3', meatColor: '#8f2f2a', rawColor: '#b0493f' },
  { id: 'lontong', name: 'Lontong', sub: 'nasi padat', kind: 'side', key: '4', color: '#f3ead2' },
  { id: 'kacang', name: 'Bumbu Kacang', sub: 'saus gurih', kind: 'side', key: '5', color: '#9c5a24' },
  { id: 'padang', name: 'Kuah Padang', sub: 'kari kuning', kind: 'side', key: '6', color: '#e0a52e' },
  { id: 'sambal', name: 'Sambal', sub: 'pedas', kind: 'side', key: '7', color: '#d43d2a' },
  { id: 'esteh', name: 'Es Teh', sub: 'manis dingin', kind: 'side', key: '8', color: '#c97b2d' },
];

export const ING_BY_ID = Object.fromEntries(INGREDIENTS.map((g) => [g.id, g]));

// Dishes. components: ingredient ids in serving order. price: base coins.
export const DISHES = [
  { id: 'sate-ayam', name: 'Sate Ayam', components: ['ayam', 'lontong', 'kacang'], price: 18 },
  { id: 'sate-kambing', name: 'Sate Kambing', components: ['kambing', 'lontong', 'kacang'], price: 24 },
  { id: 'sate-padang', name: 'Sate Padang', components: ['sapi', 'lontong', 'padang'], price: 26 },
  { id: 'sate-taichan', name: 'Sate Taichan', components: ['ayam', 'sambal', 'lontong'], price: 20 },
  { id: 'es-teh', name: 'Es Teh Manis', components: ['esteh'], price: 8 },
  { id: 'sate-campur', name: 'Sate Campur', components: ['kambing', 'sapi', 'kacang'], price: 30 },
];

export const DISH_BY_ID = Object.fromEntries(DISHES.map((d) => [d.id, d]));

// Customer faces: name + skin/shirt colors, drawn as simple vector portraits.
export const CUSTOMERS = [
  { name: 'Pakde', skin: '#d9a066', shirt: '#3e6b4f', hat: '#8a5a33' },
  { name: 'Mbak', skin: '#e8b48a', shirt: '#b3402f', hair: '#241a12' },
  { name: 'Mas', skin: '#c98d5a', shirt: '#2f5d8a', cap: '#e0a52e' },
  { name: 'Bu', skin: '#e0aa72', shirt: '#7a4a8a', hair: '#3a3a3a' },
];

export function gradeFor(coins) {
  if (coins >= 380) return 'S';
  if (coins >= 300) return 'A';
  if (coins >= 200) return 'B';
  if (coins >= 100) return 'C';
  return 'D';
}
