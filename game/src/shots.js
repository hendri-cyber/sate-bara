// SATE BARA — staged screenshot states. Each shot builds a fixed, deterministic
// game state (seeded, no wall clock): the capture script loads ?shot=<name>&seed=11,
// the game draws exactly one frame and sets window.__shotReady.
// Every shot shows all six required elements: kitchen, order board, ingredients on
// the counter, one dish mid-assembly, a timer, and a plate ready to serve (shot 3).
import { TICKET_PATIENCE, CUSTOMERS } from './data.js';

const NOW = 100000; // fixed "now" so message/float expiry is deterministic

function ticket(dishId, done, patienceFrac, customerIdx, perfectCount = 0) {
  return {
    dishId,
    done,
    perfectCount,
    patience: TICKET_PATIENCE * patienceFrac,
    maxPatience: TICKET_PATIENCE,
    customer: CUSTOMERS[customerIdx % CUSTOMERS.length],
  };
}

function base(over) {
  return {
    phase: 'playing',
    now: NOW,
    timeLeft: 150,
    coins: 0,
    served: 0,
    combo: 0,
    bestCombo: 0,
    perfectGrills: 0,
    expired: 0,
    tickets: [],
    selectedTicket: 0,
    nextTicketIn: 8,
    grill: [null, null, null, null],
    tray: [null, null, null, null],
    message: null,
    floats: [],
    endStats: null,
    ...over,
  };
}

// Shot 1 — the whole stall at shift start: board full, grill going, counter full.
function cover() {
  return base({
    timeLeft: 161,
    coins: 86,
    served: 4,
    combo: 2,
    bestCombo: 3,
    perfectGrills: 3,
    tickets: [
      ticket('sate-ayam', ['ayam'], 0.8, 0, 1),
      ticket('sate-padang', [], 0.6, 1),
      ticket('es-teh', [], 0.9, 2),
    ],
    grill: [
      { meat: 'ayam', progress: 0.62, cookSeconds: 6 },
      { meat: 'kambing', progress: 0.3, cookSeconds: 6.4 },
      null,
      { meat: 'sapi', progress: 0.9, cookSeconds: 5.8 },
    ],
    tray: [{ meat: 'ayam', perfect: true }, null, null, null],
    message: { text: 'Shift dimulai! Pesanan pertama masuk.', until: NOW + 2000 },
  });
}

// Shot 2 — one dish mid-assembly: Sate Ayam 2/3 on the plate, sauce next.
function assembly() {
  return base({
    timeLeft: 132,
    coins: 124,
    served: 6,
    combo: 3,
    bestCombo: 4,
    perfectGrills: 5,
    tickets: [
      ticket('sate-ayam', ['ayam', 'lontong'], 0.55, 1, 1),
      ticket('sate-taichan', [], 0.7, 2),
      ticket('sate-kambing', [], 0.4, 3),
    ],
    grill: [
      { meat: 'sapi', progress: 0.7, cookSeconds: 6 },
      { meat: 'ayam', progress: 0.2, cookSeconds: 6.2 },
      null,
      null,
    ],
    tray: [{ meat: 'kambing', perfect: true }, null, null, null],
    message: { text: 'Lontong sudah di piring — tambah bumbu kacang!', until: NOW + 2000 },
  });
}

// Shot 3 — plate ready to serve: Sate Padang complete, bell glowing, coins flying.
function serve() {
  return base({
    timeLeft: 98,
    coins: 210,
    served: 9,
    combo: 4,
    bestCombo: 5,
    perfectGrills: 7,
    tickets: [
      ticket('sate-padang', ['sapi', 'lontong', 'padang'], 0.65, 2, 1),
      ticket('sate-ayam', ['ayam'], 0.8, 0, 1),
      ticket('es-teh', [], 0.5, 3),
    ],
    grill: [
      { meat: 'kambing', progress: 0.6, cookSeconds: 6 },
      null,
      { meat: 'sapi', progress: 0.35, cookSeconds: 6.1 },
      null,
    ],
    tray: [{ meat: 'ayam', perfect: true }, null, null, null],
    message: { text: 'Sate Padang disajikan! +32 koins · kombo x4', until: NOW + 2000 },
    floats: [{ text: '+32', x: 868, y: 420, until: NOW + 600, color: '#f2c14e' }],
  });
}

// Shot 4 — the rush: 3 tickets, one patience red, grill full, 0:38 left.
function rush() {
  return base({
    timeLeft: 38,
    coins: 342,
    served: 13,
    combo: 5,
    bestCombo: 6,
    perfectGrills: 11,
    expired: 1,
    tickets: [
      ticket('sate-campur', ['kambing'], 0.18, 0, 1),
      ticket('sate-ayam', [], 0.35, 1),
      ticket('sate-taichan', ['ayam'], 0.55, 2, 1),
    ],
    grill: [
      { meat: 'ayam', progress: 0.95, cookSeconds: 6 },
      { meat: 'kambing', progress: 0.68, cookSeconds: 6.3 },
      { meat: 'sapi', progress: 0.88, cookSeconds: 5.9 },
      { meat: 'ayam', progress: 0.4, cookSeconds: 6.2 },
    ],
    tray: [
      { meat: 'sapi', perfect: true },
      { meat: 'kambing', perfect: true },
      null,
      null,
    ],
    message: { text: 'Rush hour! Jangan sampai gosong!', until: NOW + 2000 },
  });
}

const SHOTS = { cover, assembly, serve, rush };

export function buildShotState(name, seed) {
  const fn = SHOTS[name];
  if (!fn) throw new Error(`unknown shot: ${name}`);
  return fn(seed);
}
