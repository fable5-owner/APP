// Civ-style strategic hex map: terrain, territory borders, fog of war, cities (DOM banners), units, trade caravans.
import { fbm, hash } from './geo.js';

export const COLS = 40, ROWS = 23, S3 = Math.sqrt(3);
export const SITES = {
  MS: [8, 3], AM: [12, 4], NV: [5, 8], AP: [9, 7], GO: [13, 9], ME: [7, 11], BC: [11, 12], AN: [5, 14], OA: [9, 15], BK: [15, 13], TS: [26, 12],
};
export const KESTREL = [34, 11];
const VILLAGES = [[2, 5, '리노'], [20, 5, '델타 항'], [30, 5, '북벽'], [36, 17, '아슈'], [21, 18, '남십자']];
const BLOBS = [[0.22, 0.5, 0.22, 0.52], [0.12, 0.22, 0.12, 0.26], [0.8, 0.48, 0.2, 0.55], [0.92, 0.8, 0.1, 0.22], [0.66, 0.52, 0.045, 0.12], [0.5, 0.22, 0.04, 0.07], [0.5, 0.85, 0.05, 0.08], [0.38, 0.12, 0.03, 0.05]];
const TNAME = { deep: '심해', shallow: '연안', plains: '평원', grass: '초원', forest: '숲', hills: '구릉', mountain: '산악', desert: '사막', snow: '설원' };
const COL = { deep: ['#0b3560', '#0e3d6c'], shallow: ['#1a6794', '#1f739f'], plains: ['#7db553', '#86bd5a'], grass: ['#62a24a', '#6aab50'], forest: ['#3d7a42', '#448349'], hills: ['#97a05c', '#a1aa64'], mountain: ['#8c8782', '#989390'], desert: ['#d8b86c', '#e0c276'], snow: ['#e6eff4', '#f0f6f9'] };

const cube = (c, r) => { const x = c - (r - (r & 1)) / 2, z = r; return [x, -x - z, z]; };
export const hexDist = (a, b) => { const A = cube(a[0], a[1]), B = cube(b[0], b[1]); return Math.max(Math.abs(A[0] - B[0]), Math.abs(A[1] - B[1]), Math.abs(A[2] - B[2])); };
const NB = [[[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]], [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]]];
const neigh = (c, r) => NB[r & 1].map(([dc, dr]) => [c + dc, r + dr]);
const inb = (c, r) => c >= 0 && r >= 0 && c < COLS && r < ROWS;

// ---------- world generation (deterministic) ----------
let WORLD = null;
function world() {
  if (WORLD) return WORLD;
  const T = [], F = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const u = c / COLS, v = r / ROWS;
    let f = -9; for (const [cx, cy, rx, ry] of BLOBS) f = Math.max(f, 1 - ((u - cx) / rx) ** 2 - ((v - cy) / ry) ** 2);
    f += (fbm(c * 0.19 + 3, r * 0.19 + 7) - 0.5) * 0.7;
    F[r * COLS + c] = f;
  }
  const cities = Object.values(SITES).concat([KESTREL], VILLAGES.map((v) => [v[0], v[1]]));
  for (const [cc, cr] of cities) { F[cr * COLS + cc] = Math.max(F[cr * COLS + cc], 0.35); for (const [nc, nr] of neigh(cc, cr)) if (inb(nc, nr)) F[nr * COLS + nc] = Math.max(F[nr * COLS + nc], 0.12); }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const i = r * COLS + c, f = F[i], v = r / ROWS, m = fbm(c * 0.14 + 50, r * 0.14 + 50), nz = hash(c * 7 + 1, r * 13 + 5);
    let t;
    if (f < -0.28) t = 'deep'; else if (f < 0.0) t = 'shallow';
    else if (v < 0.06 || v > 0.95) t = 'snow';
    else if (f > 0.85 && nz > 0.55) t = 'mountain';
    else if (f > 0.55 && nz > 0.6) t = 'hills';
    else if (m < 0.34 && v > 0.3 && v < 0.78) t = 'desert';
    else if (m > 0.6 && nz > 0.25) t = 'forest';
    else if (nz > 0.75) t = 'hills';
    else t = nz > 0.4 ? 'plains' : 'grass';
    T[i] = t;
  }
  for (const [cc, cr] of cities) { const i = cr * COLS + cc; if (T[i] !== 'plains' && T[i] !== 'grass') T[i] = 'plains'; for (const [nc, nr] of neigh(cc, cr)) if (inb(nc, nr)) { const j = nr * COLS + nc; if (T[j] === 'deep' || T[j] === 'shallow' || T[j] === 'mountain') T[j] = 'grass'; } }
  // ownership
  const O = new Array(COLS * ROWS).fill(null), ids = Object.keys(SITES);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const t = T[r * COLS + c]; if (t === 'deep' || t === 'shallow') continue;
    let best = null, bd = 3;
    for (const id of ids) { const d = hexDist([c, r], SITES[id]); if (d < bd || (d === bd && best && d <= 2 && id < best)) { bd = d; best = id; } }
    if (best && bd <= 2) O[r * COLS + c] = best;
    else if (hexDist([c, r], KESTREL) <= 2) O[r * COLS + c] = 'KES';
  }
  // resources
  const RES = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { const i = r * COLS + c; if (O[i] && O[i] !== 'KES' && T[i] !== 'deep' && hash(c * 3 + 9, r * 5 + 2) > 0.8 && !cities.some(([a, b]) => a === c && b === r)) RES.push([c, r, ['chip', 'data', 'energy', 'talent'][Math.floor(hash(c, r + 40) * 4)]]); }
  WORLD = { T, F, O, RES, ids };
  return WORLD;
}

export function createHexMap() {
  const el = document.createElement('div'); el.className = 'hexmap';
  const base = document.createElement('canvas'), ov = document.createElement('canvas'), layer = document.createElement('div'), tip = document.createElement('div');
  layer.className = 'hx-layer'; tip.className = 'hx-tip hidden';
  el.append(base, ov, layer, tip);
  const bctx = base.getContext('2d'), octx = ov.getContext('2d');
  let W = 0, H = 0, r = 20, ox = 0, oy = 0, dpr = 1, data = { cities: [], units: [], turn: 1 }, selected = null, raf = 0, running = false, t0 = performance.now(), cb = {}, fog = null, clouds = [], lastF = 0, lastKey = '';
  const hc = (c, rr) => [ox + r * S3 * (c + 0.5 * (rr & 1)) + r * S3 / 2, oy + r * 1.5 * rr + r];
  const hexPath = (ctx, x, y, rad) => { ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 180 * (60 * k - 30); const px = x + rad * Math.cos(a), py = y + rad * Math.sin(a); k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); };
  const corner = (x, y, k, rad = r) => { const a = Math.PI / 180 * (60 * k - 30); return [x + rad * Math.cos(a), y + rad * Math.sin(a)]; };
  // edge k connects corner k and k+1; neighbor direction index for pointy-top: edge between corner k and k+1 faces neighbor dir (k+5)%6 in NB order? build mapping by angle
  const edgeNb = (c, rr, k) => { const ang = (60 * k) * Math.PI / 180; const [x, y] = hc(c, rr); const mx = x + r * S3 * Math.cos(ang), my = y + r * S3 * Math.sin(ang); let best = null, bd = 1e9; for (const [nc, nr] of neigh(c, rr)) { const [nx, ny] = hc(nc, nr); const d = (nx - mx) ** 2 + (ny - my) ** 2; if (d < bd) { bd = d; best = [nc, nr]; } } return best; };

  function visDist() { const t = data.turn || 1; return 4.5 + t * 0.75; }
  function fogMap() {
    const w = world(), out = new Float32Array(COLS * ROWS), vis = visDist(), srcs = Object.values(SITES).concat(data.units.map((u) => [u.col, u.row]));
    for (let rr = 0; rr < ROWS; rr++) for (let c = 0; c < COLS; c++) { let d = 99; for (const s of srcs) d = Math.min(d, hexDist([c, rr], s)); out[rr * COLS + c] = Math.max(0, Math.min(1, (d - vis) / 2.2)); }
    return out;
  }

  function drawBase() {
    const w = world(); fog = fogMap();
    base.width = W * dpr; base.height = H * dpr; bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = bctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0c3158'); g.addColorStop(1, '#0a2a4c'); bctx.fillStyle = g; bctx.fillRect(0, 0, W, H);
    for (let rr = 0; rr < ROWS; rr++) for (let c = 0; c < COLS; c++) {
      const i = rr * COLS + c, t = w.T[i], [x, y] = hc(c, rr), h = hash(c * 5 + 3, rr * 7 + 1), cl = COL[t][h > 0.5 ? 1 : 0];
      hexPath(bctx, x, y, r + 0.6); bctx.fillStyle = cl; bctx.fill();
      if (t === 'deep' || t === 'shallow') {
        bctx.strokeStyle = t === 'shallow' ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.035)'; bctx.lineWidth = 1; bctx.stroke();
        if (h > 0.72) { bctx.strokeStyle = 'rgba(255,255,255,.18)'; bctx.lineWidth = 1.2; bctx.beginPath(); bctx.moveTo(x - r * 0.4, y + 1); bctx.quadraticCurveTo(x - r * 0.2, y - 3, x, y + 1); bctx.quadraticCurveTo(x + r * 0.2, y + 5, x + r * 0.4, y + 1); bctx.stroke(); }
        continue;
      }
      bctx.strokeStyle = 'rgba(20,30,10,.2)'; bctx.lineWidth = 1; bctx.stroke();
      // feature art
      const R = (k) => hash(c * 11 + k, rr * 17 + k * 3);
      if (t === 'forest') for (let k = 0; k < 5; k++) { const fx = x + (R(k) - 0.5) * r * 1.2, fy = y + (R(k + 9) - 0.4) * r * 1.0; bctx.fillStyle = '#1f5230'; bctx.beginPath(); bctx.moveTo(fx, fy - 6); bctx.lineTo(fx - 3.6, fy + 2.5); bctx.lineTo(fx + 3.6, fy + 2.5); bctx.fill(); bctx.fillStyle = '#2d7440'; bctx.beginPath(); bctx.moveTo(fx, fy - 6); bctx.lineTo(fx - 3.6, fy + 2.5); bctx.lineTo(fx, fy + 2.5); bctx.fill(); }
      else if (t === 'hills') for (let k = 0; k < 2; k++) { const fx = x + (k - 0.5) * r * 0.7, fy = y + 2; bctx.fillStyle = '#7a8148'; bctx.beginPath(); bctx.ellipse(fx, fy, r * 0.42, r * 0.3, 0, Math.PI, 0); bctx.fill(); bctx.fillStyle = 'rgba(255,255,255,.18)'; bctx.beginPath(); bctx.ellipse(fx - 2, fy - 1, r * 0.25, r * 0.15, 0, Math.PI, 0); bctx.fill(); }
      else if (t === 'mountain') { for (let k = 0; k < 2; k++) { const fx = x + (k - 0.5) * r * 0.6, hh = r * (0.75 - k * 0.15); bctx.fillStyle = '#6c6761'; bctx.beginPath(); bctx.moveTo(fx - r * 0.42, y + r * 0.45); bctx.lineTo(fx, y + r * 0.45 - hh); bctx.lineTo(fx + r * 0.42, y + r * 0.45); bctx.fill(); bctx.fillStyle = '#b9b4ad'; bctx.beginPath(); bctx.moveTo(fx, y + r * 0.45 - hh); bctx.lineTo(fx + r * 0.42, y + r * 0.45); bctx.lineTo(fx + 2, y + r * 0.45); bctx.fill(); bctx.fillStyle = '#fff'; bctx.beginPath(); bctx.moveTo(fx, y + r * 0.45 - hh); bctx.lineTo(fx - r * 0.14, y + r * 0.45 - hh + r * 0.3); bctx.lineTo(fx + r * 0.14, y + r * 0.45 - hh + r * 0.3); bctx.fill(); } }
      else if (t === 'desert') { bctx.strokeStyle = 'rgba(150,110,40,.45)'; bctx.lineWidth = 1.2; for (let k = 0; k < 3; k++) { const fy = y - 6 + k * 6; bctx.beginPath(); bctx.moveTo(x - r * 0.5, fy); bctx.quadraticCurveTo(x, fy - 3, x + r * 0.5, fy); bctx.stroke(); } }
      else if (t === 'grass' || t === 'plains') { bctx.strokeStyle = 'rgba(30,80,20,.35)'; bctx.lineWidth = 1; for (let k = 0; k < 4; k++) { const fx = x + (R(k) - 0.5) * r * 1.3, fy = y + (R(k + 5) - 0.5) * r * 1.0; bctx.beginPath(); bctx.moveTo(fx, fy + 2); bctx.lineTo(fx - 1.4, fy - 2); bctx.moveTo(fx, fy + 2); bctx.lineTo(fx + 1.4, fy - 2); bctx.stroke(); } }
    }
    // coastline foam
    bctx.lineCap = 'round';
    for (let rr = 0; rr < ROWS; rr++) for (let c = 0; c < COLS; c++) {
      const t = w.T[rr * COLS + c]; if (t === 'deep' || t === 'shallow') continue; const [x, y] = hc(c, rr);
      for (let k = 0; k < 6; k++) { const nb = edgeNb(c, rr, k); if (!nb || !inb(nb[0], nb[1])) continue; const nt = w.T[nb[1] * COLS + nb[0]]; if (nt === 'deep' || nt === 'shallow') { const [a1, a2] = corner(x, y, k), [b1, b2] = corner(x, y, k + 1); bctx.strokeStyle = 'rgba(236,250,255,.85)'; bctx.lineWidth = 2.6; bctx.beginPath(); bctx.moveTo(a1, a2); bctx.lineTo(b1, b2); bctx.stroke(); bctx.strokeStyle = 'rgba(120,210,235,.35)'; bctx.lineWidth = 6; bctx.stroke(); } }
    }
    // territory tint + borders
    const colorOf = (id) => id === 'KES' ? '#ff4d6d' : (data.cities.find((c) => c.id === id) || {}).color || '#fff';
    for (let rr = 0; rr < ROWS; rr++) for (let c = 0; c < COLS; c++) { const o = w.O[rr * COLS + c]; if (!o) continue; const [x, y] = hc(c, rr); hexPath(bctx, x, y, r); bctx.fillStyle = colorOf(o) + '30'; bctx.fill(); }
    bctx.lineCap = 'round';
    for (let rr = 0; rr < ROWS; rr++) for (let c = 0; c < COLS; c++) {
      const o = w.O[rr * COLS + c]; if (!o) continue; const [x, y] = hc(c, rr);
      for (let k = 0; k < 6; k++) { const nb = edgeNb(c, rr, k); const no = nb && inb(nb[0], nb[1]) ? w.O[nb[1] * COLS + nb[0]] : null; if (no === o) continue; const [a1, a2] = corner(x, y, k, r - 1.5), [b1, b2] = corner(x, y, k + 1, r - 1.5); bctx.strokeStyle = colorOf(o); bctx.lineWidth = 3.2; bctx.beginPath(); bctx.moveTo(a1, a2); bctx.lineTo(b1, b2); bctx.stroke(); bctx.strokeStyle = 'rgba(255,255,255,.5)'; bctx.lineWidth = 1; bctx.stroke(); }
    }
    // roads between neighbouring cities
    bctx.setLineDash([2, 5]); bctx.strokeStyle = 'rgba(90,60,30,.7)'; bctx.lineWidth = 2;
    const ids = w.ids; for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) if (hexDist(SITES[ids[i]], SITES[ids[j]]) <= 5) { const [x1, y1] = hc(...SITES[ids[i]]), [x2, y2] = hc(...SITES[ids[j]]); bctx.beginPath(); bctx.moveTo(x1, y1); bctx.lineTo(x2, y2); bctx.stroke(); }
    bctx.setLineDash([]);
    // resources
    for (const [c, rr, kind] of w.RES) { const [x, y] = hc(c, rr), col = { chip: '#c9d1dc', data: '#6fb4ff', energy: '#ffd24a', talent: '#7be08a' }[kind]; bctx.fillStyle = 'rgba(8,14,26,.75)'; bctx.beginPath(); bctx.arc(x + r * 0.45, y - r * 0.35, 5.4, 0, 6.3); bctx.fill(); bctx.fillStyle = col; bctx.beginPath(); if (kind === 'chip') bctx.rect(x + r * 0.45 - 2.6, y - r * 0.35 - 2.6, 5.2, 5.2); else if (kind === 'energy') { bctx.moveTo(x + r * 0.45 + 1, y - r * 0.35 - 3.4); bctx.lineTo(x + r * 0.45 - 2.2, y - r * 0.35 + 0.6); bctx.lineTo(x + r * 0.45, y - r * 0.35 + 0.6); bctx.lineTo(x + r * 0.45 - 1, y - r * 0.35 + 3.4); bctx.lineTo(x + r * 0.45 + 2.2, y - r * 0.35 - 0.6); bctx.lineTo(x + r * 0.45, y - r * 0.35 - 0.6); } else bctx.arc(x + r * 0.45, y - r * 0.35, 2.6, 0, 6.3); bctx.fill(); }
    // fog of war
    for (let rr = 0; rr < ROWS; rr++) for (let c = 0; c < COLS; c++) { const f = fog[rr * COLS + c]; if (f <= 0.02) continue; const [x, y] = hc(c, rr); hexPath(bctx, x, y, r + 0.8); bctx.fillStyle = `rgba(14,20,34,${0.2 + f * 0.62})`; bctx.fill(); if (f > 0.5) { bctx.fillStyle = `rgba(150,170,205,${0.05 * f})`; bctx.beginPath(); bctx.arc(x + (hash(c, rr) - 0.5) * r, y + (hash(rr, c) - 0.5) * r, r * 0.6, 0, 6.3); bctx.fill(); } }
    // vignette
    const vg = bctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(2,6,14,.62)'); bctx.fillStyle = vg; bctx.fillRect(0, 0, W, H);
  }

  const boats = [[3, 0.2, 14, 0.012], [7, 0.7, 11, -0.01], [18, 0.4, 20, 0.014], [23, 0.62, 16, -0.012], [31, 0.8, 14, 0.01]].map(([c, v, len, sp]) => ({ c, v, len, sp }));
  function drawClouds(t) {
    octx.save();
    for (let i = 0; i < 7; i++) { const sp = 6 + i * 2.2, x = ((i * 0.31 * W + t * sp) % (W + 400)) - 200, y = (0.1 + 0.8 * hash(i, 5)) * H, s = 80 + hash(i, 9) * 110; octx.fillStyle = 'rgba(8,16,30,.10)'; octx.beginPath(); octx.ellipse(x + 26, y + 36, s, s * 0.34, 0, 0, 6.3); octx.fill(); octx.fillStyle = 'rgba(235,244,255,.14)'; for (let k = 0; k < 5; k++) { octx.beginPath(); octx.ellipse(x + (k - 2) * s * 0.34, y + (k % 2) * 6, s * 0.34, s * 0.2, 0, 0, 6.3); octx.fill(); } }
    octx.restore();
  }
  function frame(now) {
    if (!W) return; const t = (now - t0) / 1000; octx.setTransform(dpr, 0, 0, dpr, 0, 0); octx.clearRect(0, 0, W, H);
    drawClouds(t);
    // trade caravans along supply routes
    const rt = [['TS', 'NV', '#9fd0ff'], ['BK', 'AP', '#ffd98a'], ['MS', 'GO', '#9fd0ff'], ['TS', 'BC', '#c79bff']];
    rt.forEach(([a, b, col], i) => { const A = hc(...SITES[a]), B = hc(...SITES[b]), mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2 - Math.hypot(B[0] - A[0], B[1] - A[1]) * 0.22; octx.strokeStyle = col + '88'; octx.lineWidth = 1.6; octx.setLineDash([4, 6]); octx.beginPath(); octx.moveTo(...A); octx.quadraticCurveTo(mx, my, ...B); octx.stroke(); octx.setLineDash([]); for (let k = 0; k < 2; k++) { const u = (t * 0.07 + i * 0.25 + k * 0.5) % 1, v = 1 - u, x = v * v * A[0] + 2 * v * u * mx + u * u * B[0], y = v * v * A[1] + 2 * v * u * my + u * u * B[1]; octx.fillStyle = col; octx.beginPath(); octx.arc(x, y, 3.2, 0, 6.3); octx.fill(); octx.fillStyle = col + '44'; octx.beginPath(); octx.arc(x, y, 8, 0, 6.3); octx.fill(); } });
    // boats
    for (const b of boats) { const u = (((b.c / COLS + t * b.sp) % 1) + 1) % 1, x = ox + u * COLS * r * S3, y = oy + b.v * ROWS * r * 1.5 + Math.sin(t * 1.4 + b.c) * 2; if (fog && fog[Math.min(ROWS - 1, Math.floor(b.v * ROWS)) * COLS + Math.min(COLS - 1, Math.floor(u * COLS))] > 0.55) continue; const d = b.sp > 0 ? 1 : -1; octx.save(); octx.translate(x, y); octx.scale(d, 1); octx.fillStyle = '#e9eef6'; octx.beginPath(); octx.moveTo(-8, 0); octx.lineTo(8, 0); octx.lineTo(5, 4); octx.lineTo(-5, 4); octx.fill(); octx.fillStyle = '#fff'; octx.beginPath(); octx.moveTo(0, -11); octx.lineTo(7, -1); octx.lineTo(0, -1); octx.fill(); octx.fillStyle = 'rgba(255,255,255,.35)'; octx.beginPath(); octx.ellipse(-10, 5, 8, 1.4, 0, 0, 6.3); octx.fill(); octx.restore(); }
    // kestrel pulse
    { const [kx, ky] = hc(...KESTREL), f = fog ? fog[KESTREL[1] * COLS + KESTREL[0]] : 1, p = (t * 0.5) % 1; octx.strokeStyle = `rgba(255,77,109,${(1 - p) * (0.7 - f * 0.45)})`; octx.lineWidth = 2; octx.beginPath(); octx.arc(kx, ky, r * (1 + p * 3.2), 0, 6.3); octx.stroke(); }
    // selection ring
    if (selected && SITES[selected]) { const [x, y] = hc(...SITES[selected]), pu = 0.5 + 0.5 * Math.sin(t * 4); hexPath(octx, x, y, r * 1.02); octx.strokeStyle = `rgba(255,255,255,${0.7 + pu * 0.3})`; octx.lineWidth = 3; octx.stroke(); hexPath(octx, x, y, r * 1.3); octx.strokeStyle = `rgba(255,224,130,${0.25 + pu * 0.35})`; octx.lineWidth = 2; octx.stroke(); }
    // city glow pulses
    Object.values(SITES).forEach(([c, rr], i) => { const [x, y] = hc(c, rr), p = ((t * 0.3 + i * 0.13) % 1); octx.strokeStyle = `rgba(255,236,170,${(1 - p) * 0.28})`; octx.lineWidth = 1.5; octx.beginPath(); octx.arc(x, y, r * (0.8 + p * 1.8), 0, 6.3); octx.stroke(); });
  }
  function loop(now) { if (!running) return; if (now - lastF > 33) { lastF = now; frame(now); } raf = requestAnimationFrame(loop); }

  function layout() {
    layer.innerHTML = '';
    const mk = (cls, c, rr, html, attrs = {}) => { const d = document.createElement('div'); d.className = cls; const [x, y] = hc(c, rr); d.style.left = `${x}px`; d.style.top = `${y}px`; d.style.setProperty('--r', `${r}px`); d.innerHTML = html; for (const [k, v] of Object.entries(attrs)) d.dataset[k] = v; layer.appendChild(d); return d; };
    for (const v of VILLAGES) { const f = fog ? fog[v[1] * COLS + v[0]] : 0; mk('village' + (f > 0.6 ? ' fogged' : ''), v[0], v[1], `<i></i><small>${v[2]}</small>`); }
    { const f = fog ? fog[KESTREL[1] * COLS + KESTREL[0]] : 1; mk('kcity' + (f > 0.6 ? ' fogged' : ''), KESTREL[0], KESTREL[1], `<div class="kc-ico">${f > 0.6 ? '?' : '👁'}</div><small>${f > 0.6 ? '미지의 땅' : '켈스트럴'}</small>`); }
    for (const c of data.cities) { const [col, row] = SITES[c.id]; const d = mk('city' + (c.id === selected ? ' sel' : ''), col, row, c.html, { id: c.id }); d.style.setProperty('--c', c.color); d.addEventListener('click', (e) => { e.stopPropagation(); cb.city && cb.city(c.id); }); d.addEventListener('dblclick', (e) => { e.stopPropagation(); cb.open && cb.open(c.id); }); }
    for (const u of data.units) { if (u.cls === 'enemy' && fog && fog[u.row * COLS + u.col] > 0.6) continue; const d = mk('unit ' + (u.cls || ''), u.col, u.row, u.html, { id: u.id }); d.addEventListener('click', (e) => { e.stopPropagation(); cb.unit && cb.unit(u.id); }); }
  }
  function resize() {
    const rc = el.getBoundingClientRect(); if (!rc.width || !rc.height) return;
    dpr = Math.min(1.5, devicePixelRatio || 1); W = rc.width; H = rc.height;
    r = Math.max(W / (S3 * (COLS + 0.5)), H / (1.5 * (ROWS - 1) + 2));
    ox = (W - r * S3 * (COLS + 0.5)) / 2; oy = (H - r * (1.5 * (ROWS - 1) + 2)) / 2;
    ov.width = W * dpr; ov.height = H * dpr; ov.style.width = base.style.width = `${W}px`; ov.style.height = base.style.height = `${H}px`;
    drawBase(); layout(); frame(performance.now());
  }
  function hexAtPx(px, py) { let best = null, bd = 1e9; for (let rr = 0; rr < ROWS; rr++) for (let c = 0; c < COLS; c++) { const [x, y] = hc(c, rr), d = (x - px) ** 2 + (y - py) ** 2; if (d < bd) { bd = d; best = [c, rr]; } } return bd < (r * 1.05) ** 2 ? best : null; }
  el.addEventListener('mousemove', (e) => {
    const rc = el.getBoundingClientRect(), h = hexAtPx(e.clientX - rc.left, e.clientY - rc.top); if (!h || e.target.closest('.city,.unit')) { tip.classList.add('hidden'); return; }
    const w = world(), i = h[1] * COLS + h[0], o = w.O[i], f = fog ? fog[i] : 0; const cname = o === 'KES' ? '켈스트럴 영토' : o ? (data.cities.find((c) => c.id === o) || {}).name + ' 영토' : '무주지';
    tip.innerHTML = f > 0.6 ? '<b>미탐험</b><small>정보를 모으면 시야가 넓어집니다</small>' : `<b>${TNAME[w.T[i]]}</b><small>${cname}</small>`; tip.style.left = `${e.clientX - rc.left + 14}px`; tip.style.top = `${e.clientY - rc.top + 14}px`; tip.classList.remove('hidden');
  });
  el.addEventListener('mouseleave', () => tip.classList.add('hidden'));
  el.addEventListener('click', (e) => { if (e.target.closest('.city,.unit')) return; cb.empty && cb.empty(); });
  const ro = new ResizeObserver(() => resize()); ro.observe(el);
  return {
    el,
    set(d, callbacks) { const key = d.turn + '|' + d.units.length; const redraw = key !== lastKey; lastKey = key; data = d; cb = callbacks || cb; if (d.selected !== undefined) selected = d.selected; if (W) { if (redraw) drawBase(); layout(); } },
    select(id) { selected = id; layout(); },
    start() { if (running) return; running = true; t0 = performance.now(); raf = requestAnimationFrame(loop); },
    stop() { running = false; cancelAnimationFrame(raf); },
    resize,
    pos: (id) => (SITES[id] ? hc(...SITES[id]) : null),
  };
}
