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

  let bright = null, twink = [], motes = [];
  function buildBase() {
    base = document.createElement('canvas'); base.width = W * dpr; base.height = H * dpr;
    bright = document.createElement('canvas'); bright.width = W * dpr; bright.height = H * dpr;
    const b = base.getContext('2d'), br = bright.getContext('2d'); b.scale(dpr, dpr); br.scale(dpr, dpr);
    const hubs = Object.values(HUB).map((h) => px(h.lon, h.lat));
    twink = [];
    for (const p of landGrid()) {
      const [x, y] = px(p.lon, p.lat);
      let heat = 0;
      for (const [hx, hy] of hubs) heat += Math.exp(-(((x - hx) ** 2 + (y - hy) ** 2) / (2 * (S * 9) ** 2)));
      const hot = heat > 0.3, r = hot ? S * 0.24 : S * 0.19;
      b.fillStyle = hot ? `rgba(255,205,110,${Math.min(1, 0.5 + heat * 0.5)})` : `rgba(120,165,255,${0.34 + p.n * 0.3 + heat * 0.4})`;
      b.beginPath(); b.arc(x, y, r, 0, 6.3); b.fill();
      br.fillStyle = hot ? 'rgba(255,240,200,1)' : 'rgba(190,220,255,1)'; br.beginPath(); br.arc(x, y, r * 1.5, 0, 6.3); br.fill();
      if (p.n > 0.93) twink.push({ x, y, ph: p.n * 90, hot });
    }
    motes = Array.from({ length: 46 }, (_, i) => ({ x: hash(i, 3) * W, y: hash(i, 9) * H, v: 6 + hash(i, 5) * 14, r: 0.6 + hash(i, 7) * 1.6 }));
  }

  function resize() {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    W = r.width; H = r.height; S = W / (LON1 - LON0);
    canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
    buildBase(); layout(); frame(performance.now());
  }

  function quad(a, b, lift) { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - Math.hypot(b[0] - a[0], b[1] - a[1]) * lift; return [mx, my]; }
  const sweep = document.createElement('canvas'), sc = sweep.getContext('2d');
  function frame(now) {
    if (!W) return;
    const t = (now - t0) / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    if (base) ctx.drawImage(base, 0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    // radar sweep: brighten the dot field inside a moving band (clipped draws are cheap)
    if (bright) {
      const cx = (((t * 0.09) % 1.4) - 0.2) * W, bw = W * 0.05;
      [[3, 0.18], [2, 0.3], [1, 0.5], [0.4, 0.8]].forEach(([m, al]) => { ctx.save(); ctx.beginPath(); ctx.rect(cx - bw * m, 0, bw * m * 2, H); ctx.clip(); ctx.globalAlpha = al; ctx.drawImage(bright, 0, 0, W, H); ctx.restore(); });
    }
    // twinkle
    for (const q of twink) { const a = 0.5 + 0.5 * Math.sin(t * 2.2 + q.ph); if (a < 0.55) continue; ctx.fillStyle = q.hot ? `rgba(255,230,160,${a * .9})` : `rgba(200,225,255,${a * .8})`; ctx.beginPath(); ctx.arc(q.x, q.y, S * 0.34, 0, 6.3); ctx.fill(); ctx.globalAlpha = 0.18; ctx.beginPath(); ctx.arc(q.x, q.y, S * 0.9, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.shadowBlur = 0;
    // hub halos + shockwaves
    Object.values(HUB).forEach((h, i) => {
      const [x, y] = px(h.lon, h.lat);
      const g = ctx.createRadialGradient(x, y, 0, x, y, S * 11); g.addColorStop(0, `rgba(255,190,90,${0.28 + 0.1 * Math.sin(t * 2 + i)})`); g.addColorStop(1, 'rgba(255,190,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, S * 11, 0, 6.3); ctx.fill();
      for (let k = 0; k < 2; k++) { const u = ((t * 0.35 + i * 0.23 + k * 0.5) % 1); ctx.strokeStyle = `rgba(255,205,120,${(1 - u) * 0.6})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y, S * (1 + u * 9), 0, 6.3); ctx.stroke(); }
    });
    // arcs with comet trails
    ARCS.forEach(([a, b, lift, col], i) => {
      const A = px(HUB[a].lon, HUB[a].lat), B = px(HUB[b].lon, HUB[b].lat), C = quad(A, B, lift);
      ctx.strokeStyle = col; ctx.globalAlpha = 0.5; ctx.lineWidth = 5; ctx.globalAlpha = 0.1;
      ctx.beginPath(); ctx.moveTo(...A); ctx.quadraticCurveTo(...C, ...B); ctx.stroke(); ctx.lineWidth = 1.6; ctx.globalAlpha = 0.55; ctx.stroke();
      for (let k = 0; k < 3; k++) {
        const u0 = ((t * 0.13 + i * 0.27 + k / 3) % 1);
        for (let j = 0; j < 9; j++) {
          const u = u0 - j * 0.012; if (u < 0) continue; const v = 1 - u;
          const x = v * v * A[0] + 2 * v * u * C[0] + u * u * B[0], y = v * v * A[1] + 2 * v * u * C[1] + u * u * B[1];
          ctx.globalAlpha = (1 - j / 9) * 0.95; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 3 - j * 0.2, 0, 6.3); ctx.fill(); if (!j) { ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.3); ctx.fill(); }
        }
      }
    });
    // drifting motes
    ctx.globalAlpha = 1;
    for (const m of motes) { const y = (m.y - t * m.v + H * 10) % H; ctx.fillStyle = 'rgba(160,200,255,.35)'; ctx.beginPath(); ctx.arc(m.x + Math.sin(t + m.v) * 8, y, m.r, 0, 6.3); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  let lastF = 0;
  function loop(now) { if (!running) return; if (now - lastF > 30) { lastF = now; frame(now); } raf = requestAnimationFrame(loop); }

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
