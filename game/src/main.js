// SATE BARA — game state, loop, input, scoring.
// Runs from static files only: no network, no external assets.
import { C, W, H, SHIFT_SECONDS, MAX_TICKETS, GRILL_SLOTS, TICKET_PATIENCE, COOK_SECONDS, GREEN_LOW, GREEN_HIGH, BURN_AT, INGREDIENTS, ING_BY_ID, DISHES, DISH_BY_ID, CUSTOMERS, gradeFor } from './data.js';
import { drawScene, ticketRect, grillSlotRect, traySlotRect, binRect, bellRect, initRenderer } from './render3d.js';
import { mulberry32, clamp } from './random.js';
import { buildShotState } from './shots.js';

const canvas = document.getElementById('game');
initRenderer(canvas);

// ---- tiny WebAudio blips (created on first gesture; silent in shot mode) ----
let audioCtx = null;
function blip(freq, dur, type = 'sine', vol = 0.06) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (_) { /* audio is decoration; never break the game */ }
}
const sfxClick = () => blip(660, 0.06);
const sfxDing = () => { blip(880, 0.12); setTimeout(() => blip(1318, 0.18), 90); };
const sfxBuzz = () => blip(150, 0.16, 'sawtooth', 0.05);

// ---- state ----
function freshState() {
  return {
    phase: 'title',
    now: 0,
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    combo: 0,
    bestCombo: 0,
    perfectGrills: 0,
    expired: 0,
    tickets: [],
    selectedTicket: 0,
    nextTicketIn: 2,
    grill: [null, null, null, null],
    tray: [null, null, null, null],
    message: null,
    floats: [],
    endStats: null,
  };
}

let state = freshState();

function say(text, ms = 2200) {
  state.message = { text, until: state.now + ms };
}

function spawnTicket(rng) {
  const used = new Set(state.tickets.map((t) => t.dishId));
  const pool = DISHES.filter((d) => !used.has(d.id));
  const dish = pool.length ? pool[Math.floor(rng() * pool.length)] : DISHES[Math.floor(rng() * DISHES.length)];
  const free = CUSTOMERS.filter((c) => !state.tickets.some((t) => t.customer === c));
  const customer = (free.length ? free : CUSTOMERS)[Math.floor(rng() * (free.length ? free : CUSTOMERS).length)];
  state.tickets.push({
    dishId: dish.id,
    done: [],
    perfectCount: 0,
    patience: TICKET_PATIENCE,
    maxPatience: TICKET_PATIENCE,
    customer,
  });
  if (state.tickets.length === 1) state.selectedTicket = 0;
}

function startShift() {
  state = freshState();
  state.phase = 'playing';
  state.now = performance.now();
  spawnTicket(Math.random);
  say('Shift dimulai! Pesanan pertama masuk.');
  sfxDing();
}

function endShift() {
  state.phase = 'over';
  state.endStats = {
    coins: state.coins,
    served: state.served,
    bestCombo: Math.max(1, state.bestCombo),
    perfectGrills: state.perfectGrills,
    expired: state.expired,
    grade: gradeFor(state.coins),
  };
  sfxDing();
}

function serveSelected() {
  const tk = state.tickets[state.selectedTicket];
  if (!tk) { say('Belum ada pesanan.'); return; }
  const dish = DISH_BY_ID[tk.dishId];
  if (tk.done.length < dish.components.length) {
    say(`Belum lengkap: ${tk.done.length}/${dish.components.length} bahan.`);
    sfxBuzz();
    return;
  }
  const patienceFrac = tk.patience / tk.maxPatience;
  const patienceBonus = Math.round(dish.price * 0.5 * patienceFrac);
  const perfectBonus = 4 * tk.perfectCount;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const mult = Math.min(2, 1 + 0.1 * (state.combo - 1));
  const earned = Math.round((dish.price + patienceBonus + perfectBonus) * mult);
  state.coins += earned;
  state.served += 1;
  const r = bellRect();
  state.floats.push({ text: `+${earned}`, x: r.x + r.w / 2, y: r.y - 6, until: state.now + 1200, color: C.gold });
  state.tickets.splice(state.selectedTicket, 1);
  state.selectedTicket = 0;
  say(`${dish.name} disajikan! +${earned} koins${state.combo > 1 ? ` · kombo x${state.combo}` : ''}`);
  sfxDing();
}

// Add a counter/tray component to the selected ticket's plate.
function addToPlate(componentId, perfect = false) {
  const tk = state.tickets[state.selectedTicket];
  if (!tk) { say('Pilih tiket dulu — klik pesanan di papan.'); return; }
  const dish = DISH_BY_ID[tk.dishId];
  if (!dish.components.includes(componentId)) {
    state.combo = 0;
    say(`Bukan untuk ${dish.name} — kombo reset.`);
    sfxBuzz();
    return;
  }
  if (tk.done.includes(componentId)) {
    say(`${ING_BY_ID[componentId].name} sudah di piring.`);
    return;
  }
  tk.done.push(componentId);
  if (perfect) tk.perfectCount += 1;
  sfxClick();
  if (tk.done.length === dish.components.length) say(`${dish.name} lengkap — bunyikan lonceng!`);
}

function onBin(i) {
  if (state.phase !== 'playing') return;
  const g = INGREDIENTS[i];
  if (!g) return;
  if (g.kind === 'skewer') {
    const free = state.grill.findIndex((s) => s === null);
    if (free < 0) { say('Grill penuh! Ambil dulu yang sudah matang.'); sfxBuzz(); return; }
    state.grill[free] = { meat: g.id, progress: 0, cookSeconds: COOK_SECONDS * (0.9 + Math.random() * 0.3) };
    sfxClick();
  } else {
    addToPlate(g.id);
  }
}

function onGrillSlot(i) {
  if (state.phase !== 'playing') return;
  const slot = state.grill[i];
  if (!slot) return;
  if (slot.progress >= BURN_AT) {
    state.grill[i] = null;
    state.combo = 0;
    say('Gosong! Dibuang — kombo reset.');
    sfxBuzz();
    return;
  }
  if (slot.progress >= GREEN_LOW) {
    const free = state.tray.findIndex((s) => s === null);
    if (free < 0) { say('Nampan penuh! Pakai dulu sate yang matang.'); sfxBuzz(); return; }
    const perfect = slot.progress <= GREEN_HIGH;
    state.tray[free] = { meat: slot.meat, perfect };
    state.grill[i] = null;
    if (perfect) { state.perfectGrills += 1; say('Matang sempurna! +bonus saat disajikan.'); }
    sfxClick();
  } else {
    say('Belum matang — tunggu sampai meteran hijau.');
  }
}

function onTraySlot(i) {
  if (state.phase !== 'playing') return;
  const item = state.tray[i];
  if (!item) return;
  addToPlate(item.meat, item.perfect);
  if (state.tickets[state.selectedTicket] && state.tickets[state.selectedTicket].done.includes(item.meat)) {
    state.tray[i] = null;
  }
}

function pointIn(r, x, y) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function onClick(x, y) {
  if (state.phase === 'title') { startShift(); return; }
  if (state.phase === 'over') {
    if (pointIn({ x: 540, y: 360, w: 200, h: 56 }, x, y)) startShift();
    return;
  }
  if (state.phase === 'paused') return;
  // tickets
  for (let i = 0; i < MAX_TICKETS; i++) {
    if (pointIn(ticketRect(i), x, y)) {
      if (state.tickets[i]) { state.selectedTicket = i; sfxClick(); }
      return;
    }
  }
  // grill slots
  for (let i = 0; i < GRILL_SLOTS; i++) {
    if (pointIn(grillSlotRect(i), x, y)) { onGrillSlot(i); return; }
    if (pointIn(traySlotRect(i), x, y)) { onTraySlot(i); return; }
  }
  // counter bins
  for (let i = 0; i < INGREDIENTS.length; i++) {
    if (pointIn(binRect(i), x, y)) { onBin(i); return; }
  }
  // serve bell
  if (pointIn(bellRect(), x, y)) { serveSelected(); return; }
}

canvas.addEventListener('click', (e) => onClick(e.offsetX, e.offsetY));

document.addEventListener('keydown', (e) => {
  if (e.key === ' ') {
    e.preventDefault();
    if (state.phase === 'title') startShift();
    else if (state.phase === 'over') startShift();
    else if (state.phase === 'playing') serveSelected();
    return;
  }
  if (state.phase === 'paused') {
    if (e.key === 'p' || e.key === 'P' || e.key === ' ') { state.phase = 'playing'; sfxClick(); }
    else if (e.key === 'r' || e.key === 'R') startShift();
    return;
  }
  if (state.phase !== 'playing') {
    if ((e.key === 'r' || e.key === 'R') && state.phase !== 'title') startShift();
    return;
  }
  if (e.key >= '1' && e.key <= '8') { onBin(Number(e.key) - 1); return; }
  if (e.key === 'p' || e.key === 'P') { state.phase = 'paused'; return; }
  if (e.key === 'r' || e.key === 'R') { startShift(); return; }
  if (e.key === 'Tab') {
    e.preventDefault();
    if (state.tickets.length > 1) {
      state.selectedTicket = (state.selectedTicket + 1) % state.tickets.length;
      sfxClick();
    }
  }
});

// ---- update ----
function update(dt) {
  state.now = performance.now();
  if (state.phase !== 'playing') return;
  state.timeLeft -= dt;
  if (state.timeLeft <= 0) { state.timeLeft = 0; endShift(); return; }
  // spawn tickets
  state.nextTicketIn -= dt;
  if (state.nextTicketIn <= 0 && state.tickets.length < MAX_TICKETS) {
    spawnTicket(Math.random);
    state.nextTicketIn = 12 + Math.random() * 5;
  }
  // patience
  for (let i = state.tickets.length - 1; i >= 0; i--) {
    const tk = state.tickets[i];
    tk.patience -= dt;
    if (tk.patience <= 0) {
      state.tickets.splice(i, 1);
      state.expired += 1;
      state.combo = 0;
      if (state.selectedTicket >= state.tickets.length) state.selectedTicket = Math.max(0, state.tickets.length - 1);
      say('Pesanan hangus — pelanggan pergi.');
      sfxBuzz();
    }
  }
  // grill progress
  for (const slot of state.grill) {
    if (slot) slot.progress = Math.min(1, slot.progress + dt / slot.cookSeconds);
  }
  // floats
  state.floats = state.floats.filter((f) => state.now < f.until);
  if (state.message && state.now >= state.message.until) state.message = null;
}

// ---- boot ----
const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
if (shotName) {
  // Staged deterministic screenshot: one fixed frame, no loop.
  const seed = Number(params.get('seed') || 11);
  state = buildShotState(shotName, seed);
  drawScene(state, 1200);
  window.__shotReady = true;
  window.__sate = { state, shot: shotName };
} else {
  let last = performance.now();
  window.__sate = { get state() { return state; } };
  const loop = (now) => {
    const dt = clamp((now - last) / 1000, 0, 0.1);
    last = now;
    update(dt);
    drawScene(state, now);
    requestAnimationFrame(loop);
  };
  drawScene(state, performance.now());
  requestAnimationFrame(loop);
}
