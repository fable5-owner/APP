// Dot-matrix world map (canvas) with company hubs, animated supply arcs and risk markers.
import { isLand, hash } from './geo.js';

const LON0 = -150, LON1 = 170, LAT_C = 14;
const STEP = 0.85; // degrees between dots
let GRID = null;   // cached land mask [{lon,lat,n}]

function landGrid() {
  if (GRID) return GRID;
  GRID = [];
  for (let lat = 72; lat > -48; lat -= STEP) {
    const off = (Math.round((72 - lat) / STEP) & 1) ? STEP / 2 : 0;
    for (let lon = LON0; lon < LON1; lon += STEP) {
      const lo = lon + off;
      if (isLand(lo, lat) && lat > -46) GRID.push({ lon: lo, lat, n: hash(Math.round(lo * 10), Math.round(lat * 10)) });
    }
  }
  return GRID;
}

export const HUB = {
  sv: { lon: -121.5, lat: 37.4, label: 'SILICON VALLEY' },
  sea: { lon: -122.3, lat: 47.6, label: 'SEATTLE' },
  oma: { lon: -96, lat: 41.3, label: 'OMAHA' },
  tw: { lon: 121, lat: 24.8, label: 'HSINCHU' },
};
const ARCS = [['tw', 'sv', 0.34, '#86aefc'], ['oma', 'sv', 0.22, '#f3c978'], ['sv', 'sea', 0.2, '#86aefc'], ['tw', 'oma', 0.3, '#5d6a82']];
const RISKS = [{ lon: 31, lat: 49, label: '우크라이나 전선' }, { lon: 53, lat: 32, label: '이란 전쟁' }, { lon: 114, lat: 14, label: '남중국해' }];

export function createMap({ dim = false } = {}) {
  const el = document.createElement('div');
  el.className = 'map' + (dim ? ' dim' : '');
  const canvas = document.createElement('canvas');
  const layer = document.createElement('div'); layer.className = 'map-layer';
  el.append(canvas, layer);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, S = 1, dpr = 1, base = null, raf = 0, t0 = performance.now(), nodes = [], onNode = null, running = false;

  const px = (lon, lat) => [(lon - LON0) * S, H / 2 - (lat - LAT_C) * S];

  function buildBase() {
    base = document.createElement('canvas'); base.width = W * dpr; base.height = H * dpr;
    const b = base.getContext('2d'); b.scale(dpr, dpr);
    const hubs = Object.values(HUB).map((h) => px(h.lon, h.lat));
    for (const p of landGrid()) {
      const [x, y] = px(p.lon, p.lat);
      let heat = 0;
      for (const [hx, hy] of hubs) heat += Math.exp(-(((x - hx) ** 2 + (y - hy) ** 2) / (2 * (S * 9) ** 2)));
      const a = 0.3 + p.n * 0.25;
      b.fillStyle = heat > 0.35 ? `rgba(243,201,120,${Math.min(0.95, 0.4 + heat * 0.5)})` : `rgba(134,174,252,${a + heat * 0.5})`;
      b.beginPath(); b.arc(x, y, heat > 0.35 ? S * 0.2 : S * 0.17, 0, 6.3); b.fill();
    }
  }

  function resize() {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height; S = W / (LON1 - LON0);
    canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
    buildBase(); layout(); frame(performance.now());
  }

  function quad(a, b, lift) { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - Math.hypot(b[0] - a[0], b[1] - a[1]) * lift; return [mx, my]; }
  function frame(now) {
    if (!W) return;
    const t = (now - t0) / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    if (base) ctx.drawImage(base, 0, 0, W, H);
    if (dim) return;
    ARCS.forEach(([a, b, lift, col], i) => {
      const A = px(HUB[a].lon, HUB[a].lat), B = px(HUB[b].lon, HUB[b].lat), C = quad(A, B, lift);
      ctx.strokeStyle = col; ctx.globalAlpha = 0.35; ctx.lineWidth = 1.2; ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.moveTo(...A); ctx.quadraticCurveTo(...C, ...B); ctx.stroke(); ctx.setLineDash([]);
      for (let k = 0; k < 2; k++) {
        const u = ((t * 0.12 + i * 0.27 + k * 0.5) % 1), v = 1 - u;
        const x = v * v * A[0] + 2 * v * u * C[0] + u * u * B[0], y = v * v * A[1] + 2 * v * u * C[1] + u * u * B[1];
        ctx.globalAlpha = 0.95; ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 6.3); ctx.fill(); ctx.shadowBlur = 0;
      }
    });
    ctx.globalAlpha = 1;
  }
  function loop(now) { if (!running) return; frame(now); raf = requestAnimationFrame(loop); }

  function layout() {
    layer.innerHTML = '';
    const mk = (cls, lon, lat, html, data) => { const d = document.createElement('div'); d.className = cls; const [x, y] = px(lon, lat); d.style.left = `${x}px`; d.style.top = `${y}px`; d.innerHTML = html; if (data) d.dataset.node = data; layer.appendChild(d); return d; };
    for (const r of RISKS) mk('risk', r.lon, r.lat, `<i></i><span>${r.label}</span>`);
    for (const n of nodes) { const h = HUB[n.id]; const d = mk('hubn' + (n.alert ? ' alert' : ''), h.lon, h.lat, `<button class="pin" data-node="${n.id}" aria-label="${n.name}"><i></i></button><div class="lab ${n.side || 'r'}"><b>${n.name}</b><small>${n.sub}</small></div>`); d.firstChild.addEventListener('click', () => onNode && onNode(n.id)); }
  }

  const ro = new ResizeObserver(() => resize());
  ro.observe(el);
  return {
    el,
    setNodes(list, cb) { nodes = list; onNode = cb; layout(); },
    start() { if (running) return; running = true; t0 = performance.now(); raf = requestAnimationFrame(loop); },
    stop() { running = false; cancelAnimationFrame(raf); },
    resize,
  };
}
