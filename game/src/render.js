// SATE BARA — all canvas drawing. One scene, one layout, shared with main.js
// through LAYOUT so input hit-testing uses the exact same rectangles.
import { C, W, H, INGREDIENTS, ING_BY_ID, DISH_BY_ID, CUSTOMERS, GRILL_SLOTS, GREEN_LOW, GREEN_HIGH, BURN_AT } from './data.js';

export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 64 },
  board: { x: 24, y: 80, w: 276, h: 260 },
  grill: { x: 324, y: 80, w: 380, h: 260 },
  plate: { x: 728, y: 80, w: 280, h: 260 },
  customers: { x: 1032, y: 80, w: 224, h: 260 },
  counter: { x: 24, y: 356, w: 680, h: 200 },
  serve: { x: 728, y: 356, w: 280, h: 200 },
  stats: { x: 1032, y: 356, w: 224, h: 200 },
  bottom: { x: 0, y: 572, w: 1280, h: 148 },
};

// Ticket rects inside the board (3 slots).
export function ticketRect(i) {
  return { x: LAYOUT.board.x + 12, y: LAYOUT.board.y + 52 + i * 68, w: LAYOUT.board.w - 24, h: 60 };
}
// Grill slot rects (4 across inside the grill bed).
export function grillSlotRect(i) {
  return { x: LAYOUT.grill.x + 16 + i * 92, y: LAYOUT.grill.y + 74, w: 80, h: 118 };
}
// Cooked-tray slot rects (under the grill bed).
export function traySlotRect(i) {
  return { x: LAYOUT.grill.x + 16 + i * 92, y: LAYOUT.grill.y + 204, w: 80, h: 40 };
}
// Counter bin rects (8 across).
export function binRect(i) {
  return { x: LAYOUT.counter.x + 10 + i * 84, y: LAYOUT.counter.y + 44, w: 76, h: 132 };
}
export function bellRect() {
  return { x: LAYOUT.serve.x + 62, y: LAYOUT.serve.y + 56, w: 156, h: 96 };
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

// ---- 2.5D helpers ----
// A "tabletop" trapezoid: front edge wide, back edge narrower and higher —
// the top-down perspective look. (x, y) = top-left of the bounding box,
// w = front width, h = vertical extent, inset = narrowing per side at the back.
function trap(ctx, x, y, w, h, inset) {
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w - inset, y);
  ctx.lineTo(x + inset, y);
  ctx.closePath();
}

function patienceColor(frac) {
  if (frac > 0.5) return C.green;
  if (frac > 0.25) return C.gold;
  return C.red;
}

function fmtTime(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ---- ingredient icons (vector, no images) ----
export function drawIngredientIcon(ctx, id, cx, cy, s) {
  const u = s / 40; // unit
  ctx.save();
  ctx.translate(cx, cy);
  if (id === 'ayam' || id === 'kambing' || id === 'sapi') {
    // raw skewer: stick + 3 meat cubes
    const g = ING_BY_ID[id];
    ctx.strokeStyle = '#d8b48a';
    ctx.lineWidth = 3 * u;
    ctx.beginPath(); ctx.moveTo(-16 * u, 0); ctx.lineTo(16 * u, 0); ctx.stroke();
    for (let i = -1; i <= 1; i++) {
      ctx.fillStyle = g.rawColor;
      rr(ctx, i * 11 * u - 5 * u, -6 * u, 10 * u, 12 * u, 2 * u);
      ctx.fill();
    }
  } else if (id === 'lontong') {
    ctx.fillStyle = '#2f6b3a';
    rr(ctx, -15 * u, -10 * u, 30 * u, 20 * u, 4 * u); ctx.fill();
    ctx.fillStyle = '#f3ead2';
    rr(ctx, -11 * u, -7 * u, 22 * u, 14 * u, 3 * u); ctx.fill();
    ctx.strokeStyle = '#c9b98a'; ctx.lineWidth = 1.5 * u;
    ctx.beginPath(); ctx.moveTo(-11 * u, 0); ctx.lineTo(11 * u, 0); ctx.stroke();
  } else if (id === 'kacang' || id === 'padang' || id === 'sambal') {
    const col = ING_BY_ID[id].color;
    ctx.fillStyle = '#e8e0d0';
    ctx.beginPath(); ctx.ellipse(0, 2 * u, 16 * u, 9 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(0, 0, 13 * u, 6.5 * u, 0, 0, Math.PI * 2); ctx.fill();
    if (id === 'sambal') {
      ctx.fillStyle = '#7a1d12';
      ctx.beginPath(); ctx.ellipse(-4 * u, -2 * u, 3 * u, 2 * u, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(5 * u, -1 * u, 2.5 * u, 1.8 * u, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5 * u;
      ctx.beginPath(); ctx.moveTo(-8 * u, -1 * u); ctx.quadraticCurveTo(0, -5 * u, 8 * u, -1 * u); ctx.stroke();
    }
  } else if (id === 'esteh') {
    ctx.fillStyle = 'rgba(240, 235, 220, 0.9)';
    rr(ctx, -9 * u, -14 * u, 18 * u, 26 * u, 3 * u); ctx.fill();
    ctx.fillStyle = '#c97b2d';
    rr(ctx, -7 * u, -6 * u, 14 * u, 16 * u, 2 * u); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(-4 * u, -4 * u, 4 * u, 4 * u);
    ctx.fillRect(2 * u, 2 * u, 4 * u, 4 * u);
    ctx.strokeStyle = '#e5484d'; ctx.lineWidth = 2.5 * u;
    ctx.beginPath(); ctx.moveTo(4 * u, -14 * u); ctx.lineTo(8 * u, -22 * u); ctx.stroke();
  }
  ctx.restore();
}

function drawCookedSkewer(ctx, meat, cx, cy, s) {
  const u = s / 40;
  const g = ING_BY_ID[meat];
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = '#d8b48a';
  ctx.lineWidth = 3 * u;
  ctx.beginPath(); ctx.moveTo(-16 * u, 0); ctx.lineTo(16 * u, 0); ctx.stroke();
  for (let i = -1; i <= 1; i++) {
    ctx.fillStyle = g.meatColor;
    rr(ctx, i * 11 * u - 5 * u, -6 * u, 10 * u, 12 * u, 2 * u);
    ctx.fill();
    ctx.fillStyle = 'rgba(60, 20, 5, 0.55)';
    ctx.fillRect(i * 11 * u - 2 * u, -6 * u, 4 * u, 3 * u);
    ctx.fillRect(i * 11 * u + 1 * u, 2 * u, 3 * u, 2.5 * u);
  }
  ctx.restore();
}

// ---- scene parts ----
export function drawTopBar(ctx, st) {
  const b = LAYOUT.topBar;
  ctx.fillStyle = '#120c07';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = C.ember;
  ctx.fillRect(b.x, b.y + b.h - 3, b.w, 3);
  text(ctx, 'SATE BARA', 24, 30, 26, C.ember);
  text(ctx, 'Charcoal Grill Rush', 24, 52, 12, C.creamDim, 'normal');
  // shift timer, big and central
  const t = fmtTime(st.timeLeft);
  const urgent = st.timeLeft <= 30 && st.phase === 'playing';
  ctx.fillStyle = urgent ? C.red : C.board;
  rr(ctx, 560, 10, 160, 44, 8); ctx.fill();
  text(ctx, 'SHIFT', 640, 26, 10, C.creamDim, 'bold', 'center');
  text(ctx, t, 640, 48, 22, urgent ? '#ffffff' : C.cream, 'bold', 'center');
  // coins / score / combo
  text(ctx, `KOINS ${st.coins}`, 900, 32, 20, C.gold, 'bold', 'right');
  text(ctx, `Disajikan ${st.served}`, 900, 52, 12, C.creamDim, 'normal', 'right');
  if (st.combo > 1) {
    ctx.fillStyle = C.ember;
    rr(ctx, 930, 12, 110, 40, 8); ctx.fill();
    text(ctx, `KOMBO x${st.combo}`, 985, 38, 16, '#ffffff', 'bold', 'center');
  }
  text(ctx, 'Dapur arang · tanpa jaringan', 1256, 52, 11, C.creamDim, 'normal', 'right');
}

export function drawBoard(ctx, st) {
  const b = LAYOUT.board;
  // lifted frame: a darker board offset down-right, like a shadow
  ctx.fillStyle = '#1c3327';
  rr(ctx, b.x + 5, b.y + 5, b.w, b.h, 10); ctx.fill();
  ctx.fillStyle = C.board;
  rr(ctx, b.x, b.y, b.w, b.h, 10); ctx.fill();
  ctx.strokeStyle = C.boardEdge; ctx.lineWidth = 3;
  rr(ctx, b.x, b.y, b.w, b.h, 10); ctx.stroke();
  text(ctx, 'PESANAN  ·  ORDER BOARD', b.x + 14, b.y + 26, 14, C.chalk);
  ctx.strokeStyle = 'rgba(242,247,238,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(b.x + 14, b.y + 36); ctx.lineTo(b.x + b.w - 14, b.y + 36); ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const r = ticketRect(i);
    const tk = st.tickets[i];
    ctx.fillStyle = i === st.selectedTicket && tk ? '#3a5f4a' : 'rgba(0,0,0,0.18)';
    rr(ctx, r.x, r.y, r.w, r.h, 6); ctx.fill();
    if (!tk) {
      text(ctx, '— kosong —', r.x + 12, r.y + 36, 13, 'rgba(242,247,238,0.45)', 'normal');
      continue;
    }
    const dish = DISH_BY_ID[tk.dishId];
    const frac = tk.patience / tk.maxPatience;
    if (i === st.selectedTicket) {
      ctx.strokeStyle = C.gold; ctx.lineWidth = 2;
      rr(ctx, r.x, r.y, r.w, r.h, 6); ctx.stroke();
    }
    text(ctx, `${i + 1}. ${dish.name}`, r.x + 10, r.y + 20, 15, C.chalk);
    text(ctx, `Rp${dish.price}`, r.x + r.w - 10, r.y + 20, 13, C.gold, 'bold', 'right');
    // component icons with done state
    dish.components.forEach((cid, j) => {
      const done = tk.done.includes(cid);
      const ix = r.x + 22 + j * 34;
      const iy = r.y + 42;
      ctx.globalAlpha = done ? 1 : 0.35;
      drawIngredientIcon(ctx, cid, ix, iy, 26);
      ctx.globalAlpha = 1;
      if (done) {
        ctx.strokeStyle = C.green; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(ix - 6, iy); ctx.lineTo(ix - 1, iy + 5); ctx.lineTo(ix + 7, iy - 5); ctx.stroke();
      }
    });
    // patience bar
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    rr(ctx, r.x + 10, r.y + 52, r.w - 20, 6, 3); ctx.fill();
    ctx.fillStyle = patienceColor(frac);
    rr(ctx, r.x + 10, r.y + 52, Math.max(6, (r.w - 20) * frac), 6, 3); ctx.fill();
  }
}

function drawGrill(ctx, st, t) {
  const g = LAYOUT.grill;
  ctx.fillStyle = C.woodDark;
  rr(ctx, g.x, g.y, g.w, g.h, 10); ctx.fill();
  text(ctx, 'PANGGANG  ·  GRILL', g.x + 14, g.y + 26, 14, C.cream);
  text(ctx, 'klik tusuk mentah, ambil saat hijau', g.x + g.w - 14, g.y + 26, 11, C.creamDim, 'normal', 'right');
  // --- the grill as a 2.5D box: trapezoid tabletop + front firebox face ---
  const bed = { x: 334, y: 120, w: 368, h: 128, inset: 16 };
  const bedFrontY = bed.y + 112; // 232 — where the tabletop meets the front face
  // tabletop (trapezoid, front wide / back narrow)
  const topGrad = ctx.createLinearGradient(0, bed.y, 0, bedFrontY);
  topGrad.addColorStop(0, '#241609');
  topGrad.addColorStop(1, '#171009');
  ctx.fillStyle = topGrad;
  trap(ctx, bed.x, bed.y, bed.w, bedFrontY - bed.y, bed.inset);
  ctx.fill();
  // grate lines converging toward the back
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 2;
  for (let i = 0; i <= 4; i++) {
    const fx = bed.x + (i * bed.w) / 4;
    const bx = bed.x + bed.inset + (i * (bed.w - 2 * bed.inset)) / 4;
    ctx.beginPath(); ctx.moveTo(fx, bedFrontY); ctx.lineTo(bx, bed.y); ctx.stroke();
  }
  // embers glowing on the surface (deterministic positions, skip slot areas)
  const slotBoxes = [];
  for (let i = 0; i < GRILL_SLOTS; i++) slotBoxes.push(grillSlotRect(i));
  for (let i = 0; i < 14; i++) {
    const ey = bed.y + 16 + ((i * 53) % 88);
    const frac = (ey - bed.y) / (bedFrontY - bed.y);
    const halfW = (bed.w / 2 - bed.inset) + frac * bed.inset - 22;
    const ex = bed.x + bed.w / 2 + ((((i * 67) % 100) - 50) / 50) * halfW;
    if (slotBoxes.some((r) => ex > r.x - 4 && ex < r.x + r.w + 4 && ey > r.y - 4 && ey < r.y + r.h + 4)) continue;
    const glow = 0.6 + 0.4 * Math.sin(t / 300 + i * 1.7);
    ctx.fillStyle = `rgba(255, ${Math.floor(90 + 60 * glow)}, 26, ${0.5 + 0.4 * glow})`;
    ctx.beginPath(); ctx.ellipse(ex, ey, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
  }
  // front face: dark firebox with glowing coal slits
  ctx.fillStyle = '#241407';
  ctx.fillRect(bed.x, bedFrontY, bed.w, 16);
  ctx.fillStyle = 'rgba(255, 122, 26, 0.55)';
  for (let i = 0; i < 3; i++) {
    rr(ctx, bed.x + 60 + i * 120, bedFrontY + 5, 48, 6, 3); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255, 180, 80, 0.35)';
  ctx.fillRect(bed.x, bedFrontY, bed.w, 2);
  // slots: grates sitting on the tabletop (same hit rects as before)
  for (let i = 0; i < GRILL_SLOTS; i++) {
    const r = grillSlotRect(i);
    const slot = st.grill[i];
    // grate lid: trapezoid top of the slot card
    ctx.fillStyle = 'rgba(23, 16, 9, 0.92)';
    trap(ctx, r.x + 4, r.y, r.w - 8, 20, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1;
    trap(ctx, r.x + 4, r.y, r.w - 8, 20, 8); ctx.stroke();
    // card body
    ctx.fillStyle = 'rgba(23, 16, 9, 0.92)';
    rr(ctx, r.x, r.y + 20, r.w, r.h - 20, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1;
    rr(ctx, r.x, r.y + 20, r.w, r.h - 20, 8); ctx.stroke();
    if (!slot) {
      text(ctx, 'kosong', r.x + r.w / 2, r.y + r.h / 2 + 4, 11, 'rgba(245,230,200,0.4)', 'normal', 'center');
      continue;
    }
    const prog = slot.progress;
    drawCookedSkewer(ctx, slot.meat, r.x + r.w / 2, r.y + 34, 34);
    // cook meter
    const mw = r.w - 16;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    rr(ctx, r.x + 8, r.y + 62, mw, 10, 5); ctx.fill();
    ctx.fillStyle = prog >= BURN_AT ? C.red : prog >= GREEN_LOW ? C.green : C.ember;
    rr(ctx, r.x + 8, r.y + 62, Math.max(4, mw * Math.min(1, prog)), 10, 5); ctx.fill();
    // green zone marker
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(r.x + 8 + mw * GREEN_LOW, r.y + 60, 2, 14);
    ctx.fillRect(r.x + 8 + mw * GREEN_HIGH, r.y + 60, 2, 14);
    const label = prog >= BURN_AT ? 'GOSONG!' : prog >= GREEN_LOW ? (prog >= GREEN_HIGH ? 'AMBIL!' : 'PAS!') : 'masak…';
    text(ctx, label, r.x + r.w / 2, r.y + 94, 12, prog >= BURN_AT ? C.red : prog >= GREEN_LOW ? C.green : C.cream, 'bold', 'center');
    // smoke wisps
    ctx.fillStyle = 'rgba(220, 210, 195, 0.25)';
    for (let k = 0; k < 2; k++) {
      const sy = r.y + 16 - ((t / 40 + k * 30 + i * 17) % 36);
      ctx.beginPath(); ctx.ellipse(r.x + r.w / 2 + (k ? 7 : -7), sy, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  // cooked tray: a serving shelf in perspective
  text(ctx, 'MATANG — klik untuk ke piring', g.x + 14, g.y + 196, 11, C.creamDim, 'normal');
  ctx.fillStyle = '#8a5a33';
  trap(ctx, 328, 276, 372, 48, 8); ctx.fill();
  for (let i = 0; i < GRILL_SLOTS; i++) {
    const r = traySlotRect(i);
    const item = st.tray[i];
    ctx.fillStyle = 'rgba(242,193,78,0.12)';
    rr(ctx, r.x, r.y, r.w, r.h, 6); ctx.fill();
    ctx.strokeStyle = 'rgba(242,193,78,0.35)'; ctx.lineWidth = 1;
    rr(ctx, r.x, r.y, r.w, r.h, 6); ctx.stroke();
    if (item) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2 + 8, 24, 5, 0, 0, Math.PI * 2); ctx.fill();
      drawCookedSkewer(ctx, item.meat, r.x + r.w / 2, r.y + r.h / 2, 26);
    }
  }
}

function drawPlate(ctx, st) {
  const p = LAYOUT.plate;
  ctx.fillStyle = C.wood;
  rr(ctx, p.x, p.y, p.w, p.h, 10); ctx.fill();
  text(ctx, 'PIRING  ·  PLATE', p.x + 14, p.y + 26, 14, C.cream);
  const tk = st.tickets[st.selectedTicket];
  const dish = tk ? DISH_BY_ID[tk.dishId] : null;
  // the plate itself: a 3D dish — drop shadow, side wall (rim thickness), top surface
  const cx = p.x + p.w / 2, cy = p.y + 150;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(cx, cy + 10, 112, 60, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d8cbb0'; // side wall
  ctx.beginPath(); ctx.ellipse(cx, cy + 10, 104, 62, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.plate;
  ctx.beginPath(); ctx.ellipse(cx, cy, 104, 62, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d8cbb0'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(cx, cy, 104, 62, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx, cy, 78, 44, 0, 0, Math.PI * 2); ctx.stroke();
  if (tk && dish) {
    const added = tk.done;
    // stack the added components on the plate
    added.forEach((cid, j) => {
      const ox = cx - 48 + j * 48;
      if (cid === 'ayam' || cid === 'kambing' || cid === 'sapi') {
        drawCookedSkewer(ctx, cid, ox, cy - 6, 38);
      } else {
        drawIngredientIcon(ctx, cid, ox, cy - 2, 38);
      }
    });
    const ready = added.length === dish.components.length;
    text(ctx, dish.name, cx, p.y + 56, 16, C.cream, 'bold', 'center');
    text(ctx, `${added.length}/${dish.components.length} bahan`, cx, p.y + 78, 12, C.creamDim, 'normal', 'center');
    if (ready) {
      ctx.fillStyle = C.green;
      rr(ctx, cx - 66, p.y + 222, 132, 30, 15); ctx.fill();
      text(ctx, 'SIAP! — bunyikan lonceng', cx, p.y + 242, 13, '#ffffff', 'bold', 'center');
    } else if (added.length === 0) {
      text(ctx, 'Klik bahan di meja / nampan', cx, p.y + 232, 12, C.creamDim, 'normal', 'center');
    }
  } else {
    text(ctx, 'Tidak ada pesanan', cx, p.y + 56, 14, C.creamDim, 'normal', 'center');
    text(ctx, 'Tunggu tiket baru', cx, p.y + 232, 12, C.creamDim, 'normal', 'center');
  }
}

export function drawCustomers(ctx, st) {
  const z = LAYOUT.customers;
  ctx.fillStyle = C.woodDark;
  rr(ctx, z.x, z.y, z.w, z.h, 10); ctx.fill();
  text(ctx, 'PELANGGAN', z.x + 14, z.y + 26, 14, C.cream);
  for (let i = 0; i < 3; i++) {
    const tk = st.tickets[i];
    const cy = z.y + 78 + i * 62;
    const cx = z.x + 40;
    const cust = tk ? tk.customer : CUSTOMERS[(i + 1) % CUSTOMERS.length];
    // floor shadow under the customer
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(cx, cy + 38, 24, 5, 0, 0, Math.PI * 2); ctx.fill();
    // face
    ctx.fillStyle = cust.skin;
    ctx.beginPath(); ctx.arc(cx, cy, 24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = cust.shirt;
    rr(ctx, cx - 24, cy + 20, 48, 18, 6); ctx.fill();
    if (cust.hat) { ctx.fillStyle = cust.hat; rr(ctx, cx - 26, cy - 30, 52, 12, 6); ctx.fill(); }
    if (cust.cap) { ctx.fillStyle = cust.cap; ctx.beginPath(); ctx.arc(cx, cy - 8, 24, Math.PI, 0); ctx.fill(); }
    if (cust.hair) { ctx.fillStyle = cust.hair; ctx.beginPath(); ctx.arc(cx, cy - 6, 24, Math.PI * 0.95, Math.PI * 2.05); ctx.fill(); }
    // eyes + mouth by mood
    const mood = !tk ? 'idle' : tk.patience / tk.maxPatience > 0.5 ? 'ok' : tk.patience / tk.maxPatience > 0.25 ? 'worried' : 'angry';
    ctx.fillStyle = '#241a12';
    ctx.beginPath(); ctx.arc(cx - 8, cy - 2, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 8, cy - 2, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#241a12'; ctx.lineWidth = 2;
    ctx.beginPath();
    if (mood === 'ok' || mood === 'idle') { ctx.arc(cx, cy + 6, 8, 0.15 * Math.PI, 0.85 * Math.PI); }
    else if (mood === 'worried') { ctx.moveTo(cx - 7, cy + 12); ctx.lineTo(cx + 7, cy + 12); }
    else { ctx.arc(cx, cy + 16, 8, 1.15 * Math.PI, 1.85 * Math.PI); }
    ctx.stroke();
    // patience ring
    if (tk) {
      const frac = tk.patience / tk.maxPatience;
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(cx, cy, 31, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = patienceColor(frac); ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(cx, cy, 31, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); ctx.stroke();
      text(ctx, cust.name, z.x + 74, cy - 4, 13, C.cream);
      text(ctx, DISH_BY_ID[tk.dishId].name, z.x + 74, cy + 14, 11, C.creamDim, 'normal');
    } else {
      text(ctx, cust.name, z.x + 74, cy - 4, 13, C.creamDim);
      text(ctx, 'menunggu…', z.x + 74, cy + 14, 11, C.creamDim, 'normal');
    }
  }
}

function drawCounter(ctx, st) {
  const c = LAYOUT.counter;
  ctx.fillStyle = C.wood;
  rr(ctx, c.x, c.y, c.w, c.h, 10); ctx.fill();
  text(ctx, 'MEJA BAHAN  ·  COUNTER', c.x + 14, c.y + 26, 14, C.cream);
  text(ctx, 'klik bahan, atau tekan 1–8', c.x + c.w - 14, c.y + 26, 11, C.creamDim, 'normal', 'right');
  INGREDIENTS.forEach((g, i) => {
    const r = binRect(i);
    // drop shadow under the bin
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + r.h + 4, 30, 6, 0, 0, Math.PI * 2); ctx.fill();
    // bin top: trapezoid opening (front wide, back narrow)
    ctx.fillStyle = '#e8dcc0';
    trap(ctx, r.x, r.y, r.w, 24, 9); ctx.fill();
    ctx.fillStyle = '#cbb98f';
    trap(ctx, r.x + 8, r.y + 4, r.w - 16, 16, 7); ctx.fill();
    // bin front face (square top corners so it meets the trapezoid cleanly)
    ctx.fillStyle = '#f3e9d2';
    rr(ctx, r.x, r.y + 24, r.w, r.h - 24, 8); ctx.fill();
    ctx.fillRect(r.x, r.y + 24, 8, 8);
    ctx.fillRect(r.x + r.w - 8, r.y + 24, 8, 8);
    ctx.strokeStyle = '#d8cbb0'; ctx.lineWidth = 1.5;
    rr(ctx, r.x, r.y + 24, r.w, r.h - 24, 8); ctx.stroke();
    drawIngredientIcon(ctx, g.id, r.x + r.w / 2, r.y + 58, 40);
    const label = g.id === 'kacang' ? 'B. Kacang' : g.name;
    text(ctx, label, r.x + r.w / 2, r.y + 92, 11, C.ink, 'bold', 'center');
    text(ctx, g.sub, r.x + r.w / 2, r.y + 108, 10, '#7a6a55', 'normal', 'center');
    text(ctx, g.key, r.x + r.w - 8, r.y + 44, 13, '#6b4226', 'bold', 'right');
  });
}

function drawServe(ctx, st, t) {
  const s = LAYOUT.serve;
  ctx.fillStyle = C.woodDark;
  rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
  text(ctx, 'ANTAR  ·  SERVE', s.x + 14, s.y + 26, 14, C.cream);
  const r = bellRect();
  const tk = st.tickets[st.selectedTicket];
  const ready = tk && tk.done.length === DISH_BY_ID[tk.dishId].components.length;
  const pulse = ready ? 0.5 + 0.5 * Math.sin(t / 180) : 0;
  ctx.fillStyle = ready ? `rgba(242,193,78,${0.25 + 0.3 * pulse})` : 'rgba(255,255,255,0.05)';
  rr(ctx, r.x - 8, r.y - 8, r.w + 16, r.h + 24, 12); ctx.fill();
  // the bell sits on a small wooden table in perspective
  ctx.fillStyle = '#8a5a33';
  trap(ctx, r.x - 8, r.y + 50, r.w + 16, 60, 16); ctx.fill();
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(r.x - 8, r.y + 106, r.w + 16, 4);
  // bell
  ctx.fillStyle = C.gold;
  ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + r.h / 2 - 6, 40, Math.PI, 0); ctx.fill();
  ctx.fillRect(r.x + r.w / 2 - 40, r.y + r.h / 2 - 8, 80, 10);
  ctx.fillStyle = '#8a6a1d';
  ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + r.h / 2 + 34, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8a6a1d';
  ctx.fillRect(r.x + r.w / 2 - 3, r.y + r.h / 2 - 34, 6, 12);
  text(ctx, ready ? 'BUNYIKAN! (Spasi)' : 'Lonceng', r.x + r.w / 2, r.y + r.h + 34, 13, ready ? C.gold : C.creamDim, 'bold', 'center');
  // floating +coins
  for (const f of st.floats) {
    const age = 1 - (f.until - st.now) / 1200;
    ctx.globalAlpha = Math.max(0, 1 - age);
    text(ctx, f.text, f.x, f.y - age * 34, 18, f.color, 'bold', 'center');
    ctx.globalAlpha = 1;
  }
}

export function drawStats(ctx, st) {
  const s = LAYOUT.stats;
  ctx.fillStyle = C.woodDark;
  rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
  text(ctx, 'WARUNG HARI INI', s.x + 14, s.y + 26, 14, C.cream);
  const rows = [
    ['Disajikan', String(st.served)],
    ['Sempurna (grill)', String(st.perfectGrills)],
    ['Kombo terbaik', `x${Math.max(1, st.bestCombo)}`],
    ['Tiket hangus', String(st.expired)],
  ];
  rows.forEach(([k, v], i) => {
    const y = s.y + 58 + i * 30;
    text(ctx, k, s.x + 14, y, 13, C.creamDim, 'normal');
    text(ctx, v, s.x + s.w - 14, y, 14, C.cream, 'bold', 'right');
  });
  text(ctx, 'Shift 3 menit · 6 menu', s.x + 14, s.y + 184, 11, C.creamDim, 'normal');
}

export function drawBottom(ctx, st) {
  const b = LAYOUT.bottom;
  ctx.fillStyle = '#120c07';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  text(ctx, '1–8 bahan · Spasi antar · Tab ganti tiket · P jeda · R ulang', 24, b.y + 30, 13, C.creamDim, 'normal');
  text(ctx, 'Sate BARA — game orisinal, semua gambar digambar dari kode, tanpa aset luar.', 24, b.y + 54, 12, C.creamDim, 'normal');
  // message line
  if (st.message && st.now < st.message.until) {
    text(ctx, st.message.text, 640, b.y + 96, 20, C.gold, 'bold', 'center');
  }
  // shift progress
  const frac = st.timeLeft / 180;
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  rr(ctx, 24, b.y + 112, 1232, 8, 4); ctx.fill();
  ctx.fillStyle = frac > 0.25 ? C.ember : C.red;
  rr(ctx, 24, b.y + 112, Math.max(8, 1232 * frac), 8, 4); ctx.fill();
}

export function drawOverlay(ctx, st) {
  ctx.fillStyle = 'rgba(18, 12, 7, 0.82)';
  ctx.fillRect(0, 0, W, H);
  if (st.phase === 'title') {
    text(ctx, 'SATE BARA', 640, 210, 64, C.ember, 'bold', 'center');
    text(ctx, 'Charcoal Grill Rush — masak sate di atas arang', 640, 252, 20, C.cream, 'normal', 'center');
    text(ctx, 'Pesanan datang di papan. Panggang tusuk sampai hijau, susun di piring,', 640, 300, 16, C.creamDim, 'normal', 'center');
    text(ctx, 'lalu bunyikan lonceng sebelum pelanggan kehabisan sabar. Shift 3 menit.', 640, 324, 16, C.creamDim, 'normal', 'center');
    ctx.fillStyle = C.ember;
    rr(ctx, 540, 360, 200, 56, 12); ctx.fill();
    text(ctx, 'MULAI MASAK', 640, 396, 20, '#ffffff', 'bold', 'center');
    text(ctx, 'Klik / tekan Spasi untuk mulai · 1–8 bahan · Spasi antar · P jeda', 640, 452, 13, C.creamDim, 'normal', 'center');
  } else if (st.phase === 'paused') {
    text(ctx, 'JEDA', 640, 300, 48, C.cream, 'bold', 'center');
    text(ctx, 'Tekan P untuk lanjut · R untuk ulang dari awal', 640, 350, 16, C.creamDim, 'normal', 'center');
  } else if (st.phase === 'over') {
    const e = st.endStats;
    text(ctx, 'SHIFT SELESAI!', 640, 180, 44, C.ember, 'bold', 'center');
    text(ctx, `Nilai ${e.grade}`, 640, 240, 28, C.gold, 'bold', 'center');
    text(ctx, `Koins ${e.coins} · Disajikan ${e.served} · Kombo terbaik x${e.bestCombo}`, 640, 292, 18, C.cream, 'normal', 'center');
    text(ctx, `Grill sempurna ${e.perfectGrills} · Tiket hangus ${e.expired}`, 640, 322, 16, C.creamDim, 'normal', 'center');
    ctx.fillStyle = C.ember;
    rr(ctx, 540, 360, 200, 56, 12); ctx.fill();
    text(ctx, 'MASAK LAGI (R)', 640, 396, 20, '#ffffff', 'bold', 'center');
  }
}

export function drawScene(ctx, st, t) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  // wall glow behind the stall
  const glow = ctx.createRadialGradient(640, 200, 60, 640, 200, 620);
  glow.addColorStop(0, 'rgba(255, 122, 26, 0.14)');
  glow.addColorStop(1, 'rgba(255, 122, 26, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  drawTopBar(ctx, st);
  drawBoard(ctx, st);
  drawGrill(ctx, st, t);
  drawPlate(ctx, st);
  drawCustomers(ctx, st);
  drawCounter(ctx, st);
  drawServe(ctx, st, t);
  drawStats(ctx, st);
  drawBottom(ctx, st);
  if (st.phase !== 'playing') drawOverlay(ctx, st);
}
